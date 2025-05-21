# Merkle Distributor CLI Overview

## What is the Merkle Distributor?

The Merkle Distributor is a Solana program designed for efficiently distributing tokens to a large number of recipients. It uses Merkle trees to reduce on-chain storage costs while ensuring secure and verifiable token claims.

Traditional token distribution methods on Solana involve sending individual transactions to each recipient, which can be costly in terms of transaction fees and storage rent. The Merkle Distributor solves this by:

1. Generating a Merkle tree from a list of recipients and their token allocations
2. Storing only the Merkle root on-chain (a single 32-byte value)
3. Requiring recipients to provide a proof of their inclusion in the tree when claiming tokens

This approach shifts the storage burden off-chain while maintaining the security and verifiability of the distribution process.

## CLI Purpose and Functionality

The Merkle Distributor CLI (`jup-scripts`) is a command-line interface tool that facilitates interaction with the Merkle Distributor program. It provides functionality for:

### 1. Distribution Setup and Management

- Creating Merkle trees from CSV files of recipients
- Deploying new Merkle distributors on-chain
- Setting parameters like vesting schedules and clawback conditions
- Managing administrative functions (changing admin, setting clawback receivers)

### 2. Recipient Interactions

- Claiming tokens (with both direct and API-based methods)
- Generating and verifying proofs
- Managing claim status

### 3. Administrative Tools

- Funding distributors with tokens
- Clawing back unclaimed tokens after the clawback period
- Setting enable slots and timing parameters
- Closing distributors (in test environments)

## Key Concepts

### Merkle Trees

Merkle trees are binary hash trees where each leaf node contains a hash of a data block, and each non-leaf node contains a hash of its children. The root hash (Merkle root) serves as a cryptographic commitment to the entire dataset.

In the context of token distribution:
- Leaf nodes represent recipient addresses and token allocations
- The Merkle root is stored on-chain as part of the distributor state
- When claiming tokens, recipients provide a Merkle proof that verifies their data against the on-chain root

### Vesting Schedules

The Merkle Distributor supports token vesting, where tokens become available gradually over time:
- `start_vesting_ts`: When vesting begins
- `end_vesting_ts`: When vesting completes

### Clawback Mechanism

To handle unclaimed tokens, the Merkle Distributor implements a clawback feature:
- `clawback_start_ts`: After this timestamp, unclaimed tokens can be reclaimed by the administrator
- `clawback_receiver`: The account that receives clawed back tokens

## Architecture Overview

The CLI is built in Rust and interfaces with:

1. **Solana RPC Nodes**: For submitting transactions and querying blockchain state
2. **Local File System**: For managing Merkle tree files, CSV input data, and output records
3. **External APIs**: For some claim verification methods

At its core, the CLI uses:
- The Anchor framework for Solana program interaction
- CLAP for command-line argument parsing
- Various cryptographic libraries for Merkle tree operations

## Use Cases

The Merkle Distributor CLI is particularly useful for:

- Token airdrops to large recipient lists
- Governance token distributions
- Reward and incentive programs
- Vested token allocations (like team or investor tokens)

By reducing transaction overhead and on-chain storage costs, it makes large-scale token distributions economically viable on Solana. 