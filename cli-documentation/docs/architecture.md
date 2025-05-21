# Architecture Overview

This document provides an in-depth explanation of the architecture of the Merkle Distributor CLI and its relationship with the on-chain Merkle Distributor program.

## System Architecture

The Merkle Distributor system consists of several key components:

```
┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐
│                   │      │                   │      │                   │
│  Merkle           │      │  Solana           │      │  Token            │
│  Distributor CLI  │◄────►│  Blockchain       │◄────►│  Recipients       │
│                   │      │                   │      │                   │
└───────────────────┘      └───────────────────┘      └───────────────────┘
        │                          ▲
        │                          │
        ▼                          │
┌───────────────────┐      ┌───────────────────┐
│                   │      │                   │
│  Merkle Tree      │      │  Merkle           │
│  Files            │      │  Distributor      │
│                   │      │  Program          │
└───────────────────┘      └───────────────────┘
```

### Component Responsibilities

1. **Merkle Distributor CLI (`jup-scripts`)**: 
   - Provides the user interface for interacting with the system
   - Generates Merkle trees from recipient lists
   - Creates and manages distributors
   - Handles token transfers and claims

2. **Merkle Tree Files**:
   - Store the data structure representing recipient allocations
   - Contain proofs needed for token claims
   - Persist off-chain to save on-chain storage costs

3. **Solana Blockchain**:
   - Hosts the Merkle Distributor program
   - Manages token accounts and transfers
   - Provides transaction finality and security

4. **Merkle Distributor Program**:
   - Verifies Merkle proofs against on-chain Merkle roots
   - Controls token distribution according to vesting schedules
   - Manages claim status for each recipient
   - Handles administrative functions (clawback, etc.)

5. **Token Recipients**:
   - End users who claim tokens using Merkle proofs
   - Can interact directly with the CLI or through an API

## CLI Internal Architecture

The CLI follows a command-based architecture:

```
┌───────────────────────────────────────────────────────────────┐
│                         cli.rs                                │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ Args Struct │  │ Commands    │  │ Main        │           │
│  │             │  │ Enum        │  │ Function    │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                     instructions/                             │
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │ process_claim.rs│  │ process_new_    │  │ process_create_ ││
│  │                 │  │ distributor.rs  │  │ merkle_tree.rs  ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │ process_        │  │ verify_         │  │ Other           ││
│  │ clawback.rs     │  │ kv_proof.rs     │  │ processors      ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                     Dependencies                              │
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │ jito-merkle-    │  │ anchor-client   │  │ solana-sdk      ││
│  │ tree            │  │                 │  │                 ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
└───────────────────────────────────────────────────────────────┘
```

### Key Architectural Concepts

1. **Command Processor Pattern**:
   - Each CLI command has a dedicated processor module
   - Processors implement specific functionality for each command
   - Main function routes commands to appropriate processors

2. **Separation of Concerns**:
   - Tree generation is separate from on-chain interactions
   - Transaction building is separate from transaction signing and sending
   - Configuration is separate from execution logic

3. **External Dependencies**:
   - `jito-merkle-tree`: Core Merkle tree implementation and utilities
   - `anchor-client`: Client library for the Anchor framework
   - `solana-sdk`: Solana blockchain interaction
   - `clap`: Command-line argument parsing

## On-chain Program Architecture

The Merkle Distributor on-chain program is built with the Anchor framework and has these key components:

```
┌───────────────────────────────────────────────────────────────┐
│                    Merkle Distributor Program                 │
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │ Instructions    │  │ State Accounts  │  │ Errors          ││
│  │ - new_distributor│ │ - MerkleDistri- │  │                 ││
│  │ - new_claim     │  │   butor         │  │                 ││
│  │ - claim_locked  │  │ - ClaimStatus   │  │                 ││
│  │ - clawback      │  │                 │  │                 ││
│  │ - set_admin     │  │                 │  │                 ││
│  │ - others...     │  │                 │  │                 ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
└───────────────────────────────────────────────────────────────┘
```

### State Accounts

1. **MerkleDistributor**: Stores the core distributor data including:
   - Merkle root
   - Token mint and vault
   - Vesting schedule parameters
   - Clawback configuration
   - Administrative settings

2. **ClaimStatus**: Tracks the claim status for each recipient:
   - Amount claimed
   - Index in the Merkle tree
   - Timestamp of claim

### Program-Derived Addresses (PDAs)

The program uses PDAs to deterministically derive addresses for:

1. **Distributor Accounts**: 
   ```
   [program_id, base_pubkey, mint_pubkey, version]
   ```

2. **Claim Status Accounts**: 
   ```
   [program_id, distributor_pubkey, index]
   ```

## Data Flow

### Creating a Distributor

```
1. CLI generates Merkle tree from CSV
2. CLI creates MerkleDistributor account on-chain with root hash
3. CLI funds distributor token vault
```

### Claiming Tokens

```
1. Recipient requests to claim tokens
2. CLI generates Merkle proof for recipient
3. CLI submits proof and claim request to program
4. Program verifies proof against stored root
5. Program transfers tokens to recipient according to vesting schedule
6. Program records claim in ClaimStatus account
```

### Clawback Flow

```
1. Admin initiates clawback after clawback_start_ts
2. Program checks if clawback period has started
3. Program transfers unclaimed tokens to clawback receiver
4. Program marks distributor as clawed back
```

## Security Considerations

1. **Frontrunning Protection**:
   - New distributor transactions include checks to prevent malicious tampering
   - The CLI verifies on-chain state after creating distributors

2. **Proof Verification**:
   - Merkle proofs are cryptographically secure
   - On-chain verification prevents unauthorized claims

3. **Admin Controls**:
   - Administrative functions are protected by access control
   - Time-based locks prevent premature clawbacks

4. **Transaction Safety**:
   - Retry logic for handling network issues
   - Validation before sending transactions

## Integration Points

The CLI integrates with the following external systems:

1. **Solana RPC Nodes**: For blockchain interaction
2. **File System**: For storing and loading Merkle trees
3. **Key Management**: For loading and managing keypairs
4. **API Services**: For proof generation and verification

## Extension Points

The architecture allows for extensions such as:

1. **Custom Distribution Logic**: Additional distribution mechanisms
2. **New Command Processors**: For added functionality
3. **Alternative Proof Systems**: Could be adapted for other cryptographic proof methods
4. **UI Integrations**: Web interfaces or other client applications