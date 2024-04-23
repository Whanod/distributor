#!/bin/bash

set -e

TABLE_NAME="helm-repo-lock-table.build.hubbleprotocol.io"
LOCK_ID="index.json"
LOCK_TTL=300 # 5 minutes

AWS_ACCESS_KEY_ID=$(cat /run/secrets/aws_access_key_id)
AWS_SECRET_ACCESS_KEY=$(cat /run/secrets/aws_secret_access_key)

export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY
export AWS_REGION="eu-west-1"

function build_chart() {
  echo "Building..."
  helm repo add hubbleprotocol s3://helmrepository.build.hubbleprotocol.io
  helm dependency update --skip-refresh
  helm package ./
}

function push_chart() {
  echo "Pushing..."
  helm s3 push --force ./"$CHART"-"$BUILD_VERSION".tgz hubbleprotocol
}

function acquire_lock() {
  max_attempts=300
  current_attempt=1

  while [[ ${current_attempt} -le ${max_attempts} ]]; do
    # Check if the lock item already exists in DynamoDB table
    echo "Checking lock..."
    existing_lock=$(aws dynamodb get-item --table-name "${TABLE_NAME}" --key '{"LockId":{"S":"'"${LOCK_ID}"'"}}' --projection-expression "LockState" --query 'Item.LockState.S' --output text 2>/dev/null)

    if [[ "${existing_lock}" == "LOCKED" ]]; then
      sleep_time=$((RANDOM % 5 + 1)) # Sleep for a random amount of time between 1 and 5 seconds
      echo "Lock in use, retrying acquire lock $((attempt + 1)) after waiting ${sleep_time} seconds..."
      sleep "${sleep_time}"
      ((current_attempt++))
    else
      # Atomically create the lock item in DynamoDB using a conditional write operation
      echo "Acquiring lock..."
      set +e
      if aws dynamodb put-item --table-name "${TABLE_NAME}" --item '{"LockId":{"S":"'"${LOCK_ID}"'"},"LockState":{"S":"LOCKED"}, "ttl": {"N":"'$(($(date +%s) + LOCK_TTL))'"}}' --condition-expression "attribute_not_exists(LockId)" >/dev/null; then
        set -e
        echo "Lock acquired"
        # Set up trap to call the trap_release_lock function on script exit
        trap trap_release_lock EXIT
        return
      else
        put_item_result=$?
        echo "Failed to acquire lock. Retrying..."
        set -e
      fi

      # Check if the failure is due to an expired lock
      if [[ "${put_item_result}" -eq 255 ]]; then
        # Delete the expired lock item
        set +e
        if ! aws dynamodb delete-item --table-name "${TABLE_NAME}" --key '{"LockId":{"S":"'"${LOCK_ID}"'"}}' >/dev/null; then
          echo "Failed to delete the expired lock item!"
        else
          current_attempt=0
          echo "Expired lock item deleted."
        fi
        set -e
      fi
      ((current_attempt++))
    fi
  done

  echo "Failed to acquire lock after ${max_attempts} attempts!"
  return 1
}

function release_lock() {
  # Delete the lock item from DynamoDB table
  echo "Releasing lock..."
  aws dynamodb delete-item --table-name "${TABLE_NAME}" --key '{"LockId":{"S":"'"${LOCK_ID}"'"}}' >/dev/null
  echo "Lock released"
}

function do_with_retry() {
  retries=30
  set +e
  for ((i = 0; i < retries; i++)); do
    if $1; then
      set -e
      return
    fi
    set -e

    if ((i < retries - 1)); then
      sleep_time=$((RANDOM % 5 + 1)) # Sleep for a random amount of time between 1 and 5 seconds
      echo "Failed, retrying attempt $((i + 1)) after waiting ${sleep_time} seconds..."
      sleep "${sleep_time}"
    fi
  done

  ((retries == i)) && {
    echo "Failed after ${retries} retries!"
    exit 1
  }
}

# Trap function to release the lock on script exit
function trap_release_lock() {
  echo "Exiting script..."
  do_with_retry release_lock
}

do_with_retry build_chart

acquire_lock
do_with_retry push_chart

exit 0
