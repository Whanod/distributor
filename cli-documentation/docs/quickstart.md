# Quick Start Guide

This guide will help you get started with the Merkle Distributor CLI, walking through a basic token distribution workflow.

## Prerequisites

Before starting, make sure you have:
- The CLI installed (see [Installation Guide](installation.md))
- A Solana wallet with SOL for transaction fees
- SPL tokens that you want to distribute
- A list of recipient addresses

## Step 1: Prepare Your Recipient List

Create a CSV file with recipient wallet addresses and token amounts:

```bash
echo "HG5M29Qpqzt28UHbH8GwM8bU7jmYKUU5brCJMjDwqPTn,100" > recipients.csv
echo "8iA5Jrf1YgE5TcEUdYZJP5m9aRR1QHM5M7Mkc2HXiBUm,50" >> recipients.csv
echo "3KziaFoEY7SgwZGprGdt4yNcnrFLrVmAjZTtcNdkqtD8,75" >> recipients.csv
```

## Step 2: Create a Merkle Tree

Generate a Merkle tree from your recipient list:

```bash
jup-scripts create-merkle-tree \
  --csv-path ./recipients.csv \
  --merkle-tree-path ./merkle_trees \
  --max-nodes-per-tree 10000 \
  --amount 1.0 \
  --decimals 6
```

This command will create a directory `./merkle_trees` containing your Merkle tree data.

## Step 3: Create a New Distributor

First, make sure you have:
- Your SPL token mint address
- A base keypair (you can generate one with `solana-keygen new -o base-keypair.json`)
- Your admin keypair

Then create the distributor:

```bash
jup-scripts new-distributor \
  --mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --merkle-tree-path ./merkle_trees \
  --base-path ./base-keypair.json \
  --keypair-path ~/.config/solana/id.json \
  --start-vesting-ts $(date +%s) \
  --end-vesting-ts $(($(date +%s) + 2592000)) \  # 30 days from now
  --clawback-start-ts $(($(date +%s) + 7776000)) \  # 90 days from now
  --enable-slot 0 \
  --clawback-receiver-owner $(solana address) \
  --rpc-url https://api.mainnet-beta.solana.com
```

## Step 4: Fund the Distributor

Transfer tokens to the distributor:

```bash
jup-scripts fund-all \
  --merkle-tree-path ./merkle_trees \
  --keypair-path ~/.config/solana/id.json \
  --mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --base $(solana-keygen pubkey ./base-keypair.json) \
  --rpc-url https://api.mainnet-beta.solana.com
```

## Step 5: Prepare for Recipients to Claim

There are two ways to allow recipients to claim their tokens:

### Option A: Distribute Merkle Tree Files

Share the Merkle tree files with the recipients, who can then use the claim command:

```bash
jup-scripts claim \
  --merkle-tree-path ./merkle_trees/tree_0.json \
  --keypair-path ~/.config/solana/id.json \
  --mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --base $(solana-keygen pubkey ./base-keypair.json) \
  --rpc-url https://api.mainnet-beta.solana.com
```

### Option B: Set Up an API Endpoint

1. Generate KV proofs for API integration:

```bash
jup-scripts generate-kv-proof \
  --merkle-tree-path ./merkle_trees \
  --kv-path ./kv_proofs \
  --max-entries-per-file 1000
```

2. Host the KV proofs on a web server or cloud storage
3. Recipients can claim using the API method:

```bash
jup-scripts claim-from-api \
  --destination-owner <RECIPIENT_ADDRESS> \
  --keypair-path ~/.config/solana/id.json \
  --mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --base $(solana-keygen pubkey ./base-keypair.json) \
  --rpc-url https://api.mainnet-beta.solana.com
```

## Step 6: Monitor Claim Status

Check the status of claims:

```bash
jup-scripts view-claim-status \
  --mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --base $(solana-keygen pubkey ./base-keypair.json) \
  --rpc-url https://api.mainnet-beta.solana.com
```

## Step 7: Clawback Unclaimed Tokens (After Clawback Period)

After the clawback period has started, you can reclaim unclaimed tokens:

```bash
jup-scripts clawback \
  --merkle-tree-path ./merkle_trees \
  --keypair-path ~/.config/solana/id.json \
  --mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --base $(solana-keygen pubkey ./base-keypair.json) \
  --rpc-url https://api.mainnet-beta.solana.com
```

## Next Steps

For more detailed information about the CLI and its commands, check the [Commands Reference](commands.md) and [Usage Examples](usage-examples.md) documents. 