# Usage Examples

This document provides practical examples for common tasks using the Merkle Distributor CLI.

## Preparing a Distribution

### 1. Creating a CSV File of Recipients

First, create a CSV file with recipient wallet addresses and token amounts. The file format should have two columns: wallet address and amount.

Example `recipients.csv`:
```
HG5M29Qpqzt28UHbH8GwM8bU7jmYKUU5brCJMjDwqPTn,100
8iA5Jrf1YgE5TcEUdYZJP5m9aRR1QHM5M7Mkc2HXiBUm,50
3KziaFoEY7SgwZGprGdt4yNcnrFLrVmAjZTtcNdkqtD8,75
...
```

### 2. Generating a Merkle Tree

```bash
jup-scripts create-merkle-tree \
  --csv-path ./recipients.csv \
  --merkle-tree-path ./merkle_trees \
  --max-nodes-per-tree 10000 \
  --amount 1.0 \
  --decimals 6
```

This command will:
- Read the recipient data from `recipients.csv`
- Create a Merkle tree with a maximum of 10,000 recipients per tree
- Scale the token amounts using 6 decimals of precision
- Save the Merkle tree data to the `./merkle_trees` directory

## Setting Up a Distributor

### 1. Creating a New Distributor

```bash
jup-scripts new-distributor \
  --mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --merkle-tree-path ./merkle_trees \
  --base-path ./keys/base-keypair.json \
  --keypair-path ./keys/admin-keypair.json \
  --start-vesting-ts 1650000000 \
  --end-vesting-ts 1660000000 \
  --clawback-start-ts 1670000000 \
  --enable-slot 100000000 \
  --clawback-receiver-owner 5hAykmD4YGcQ7Am3N7nC9kyELq9xZX81qGcnZ7kVBBgY \
  --rpc-url https://api.mainnet-beta.solana.com
```

This command:
- Creates a new distributor for the USDC token mint
- Uses the Merkle tree(s) in the `./merkle_trees` directory
- Sets vesting to start at timestamp 1650000000 and end at 1660000000
- Enables clawback after timestamp 1670000000
- Makes the distributor active starting at slot 100000000
- Sets the specified address as the clawback receiver

### 2. Funding the Distributor

After creating the distributor, you need to fund it with tokens:

```bash
jup-scripts fund-all \
  --merkle-tree-path ./merkle_trees \
  --keypair-path ./keys/admin-keypair.json \
  --mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --base 8iA5Jrf1YgE5TcEUdYZJP5m9aRR1QHM5M7Mkc2HXiBUm \
  --rpc-url https://api.mainnet-beta.solana.com
```

## Claiming Tokens

### 1. Claiming Directly with a Merkle Tree File

For users who have access to the original Merkle tree file:

```bash
jup-scripts claim \
  --merkle-tree-path ./merkle_trees/tree_0.json \
  --keypair-path ./keys/recipient-keypair.json \
  --mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --base 8iA5Jrf1YgE5TcEUdYZJP5m9aRR1QHM5M7Mkc2HXiBUm \
  --rpc-url https://api.mainnet-beta.solana.com
```

### 2. Claiming via API

For end-users without direct access to the Merkle tree file:

```bash
jup-scripts claim-from-api \
  --destination-owner HG5M29Qpqzt28UHbH8GwM8bU7jmYKUU5brCJMjDwqPTn \
  --keypair-path ./keys/recipient-keypair.json \
  --mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --base 8iA5Jrf1YgE5TcEUdYZJP5m9aRR1QHM5M7Mkc2HXiBUm \
  --rpc-url https://api.mainnet-beta.solana.com
```

## Administrative Functions

### 1. Setting a New Admin

```bash
jup-scripts set-admin \
  --new-admin 3KziaFoEY7SgwZGprGdt4yNcnrFLrVmAjZTtcNdkqtD8 \
  --merkle-tree-path ./merkle_trees \
  --keypair-path ./keys/current-admin-keypair.json \
  --mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --base 8iA5Jrf1YgE5TcEUdYZJP5m9aRR1QHM5M7Mkc2HXiBUm \
  --rpc-url https://api.mainnet-beta.solana.com
```

### 2. Clawing Back Unclaimed Tokens

After the clawback period has started:

```bash
jup-scripts clawback \
  --merkle-tree-path ./merkle_trees \
  --keypair-path ./keys/admin-keypair.json \
  --mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --base 8iA5Jrf1YgE5TcEUdYZJP5m9aRR1QHM5M7Mkc2HXiBUm \
  --rpc-url https://api.mainnet-beta.solana.com
```

### 3. Viewing Distributor Status

```bash
jup-scripts view-distributors \
  --from-version 1 \
  --to-version 5 \
  --mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --base 8iA5Jrf1YgE5TcEUdYZJP5m9aRR1QHM5M7Mkc2HXiBUm \
  --rpc-url https://api.mainnet-beta.solana.com
```

## Utility Functions

### 1. Generating KV Proofs for API Integration

To generate key-value proofs for integration with distribution APIs:

```bash
jup-scripts generate-kv-proof \
  --merkle-tree-path ./merkle_trees \
  --kv-path ./kv_proofs \
  --max-entries-per-file 1000
```

### 2. Verifying KV Proofs

```bash
jup-scripts verify-kv-proof \
  --csv-path ./recipients.csv \
  --kv-api https://example.com/kv-service \
  --local-api https://example.com/local-service \
  --num-verify 100
```

### 3. Converting a Timestamp to a Slot

```bash
jup-scripts slot-by-time \
  --timestamp 1650000000 \
  --rpc-url https://api.mainnet-beta.solana.com
```

## Mass Token Sending

### 1. Sending Tokens to Multiple Recipients in Batched Transactions

```bash
jup-scripts mass-send \
  --csv-path ./recipients.csv \
  --des-path ./results \
  --max-address-per-tx 5 \
  --amount 10 \
  --keypair-path ./keys/sender-keypair.json \
  --mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --rpc-url https://api.mainnet-beta.solana.com
```

### 2. Retrying Failed Transactions

```bash
jup-scripts resend \
  --des-path ./results \
  --max-address-per-tx 5 \
  --amount 10 \
  --keypair-path ./keys/sender-keypair.json \
  --mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --rpc-url https://api.mainnet-beta.solana.com
``` 