# API Reference

This document provides a technical reference for the internal structure and key components of the Merkle Distributor CLI.

## CLI Structure

The CLI is structured into several key components:

1. **Command-line Interface** (`cli.rs`) - Defines the command arguments structure and routing
2. **Instruction Modules** (`instructions/`) - Implementation of specific functionality for each command
3. **Utility Functions** - Helper functions for common operations

## Core Structs and Enums

### Args

The main CLI argument structure defined in `cli.rs`:

```rust
#[derive(Parser, Debug)]
pub struct Args {
    #[clap(subcommand)]
    pub command: Commands,

    // Global options
    #[clap(long, env, default_value_t = Pubkey::default())]
    pub mint: Pubkey,

    #[clap(long, env, default_value_t = Pubkey::default())]
    pub base: Pubkey,
    
    #[clap(long, env, default_value = "http://localhost:8899")]
    pub rpc_url: String,
    
    // Additional global options...
}
```

### Commands

Enum that defines all available commands:

```rust
#[derive(Subcommand, Debug)]
pub enum Commands {
    Claim(ClaimArgs),
    ClaimFromApi(ClaimFromApiArgs),
    NewDistributor(NewDistributorArgs),
    CloseDistributor(CloseDistributorArgs),
    CloseClaimStatus(CloseClaimStatusArgs),
    Clawback(ClawbackArgs),
    CreateMerkleTree(CreateMerkleTreeArgs),
    CreateMerkleTreeBlob(CreateMerkleTreeBlobArgs),
    SetAdmin(SetAdminArgs),
    SetEnableSlot(SetEnableSlotArgs),
    SetEnableSlotByTime(SetEnableSlotByTimeArgs),
    SetClawbackStartTs(SetClawbackStartTsArgs),
    FundAll(FundAllArgs),
    Verify(VerifyArgs),
    SlotByTime(SlotByTimeArgsArgs),
    GenerateKvProof(GenerateKvProofArgs),
    MassSend(MassSendArgs),
    Resend(ResendSendArgs),
    ViewClaimStatus(ViewClaimStatusArgs),
    VerifyKvProof(VerifyKvProofArgs),
    TotalClaim(TotalClaimAgrs),
    SetClawbackReceiver(ClawbackReceiverArgs),
    ViewDistributors(ViewDistributorsArgs),
}
```

## Key Functions

### Command Processors

Each command is processed by a corresponding function in the `instructions/` directory:

```rust
// process_new_distributor.rs
pub fn process_new_distributor(args: &Args, new_distributor_args: &NewDistributorArgs) {
    // Implementation...
}

// process_create_merkle_tree.rs
pub fn process_create_merkle_tree(create_merkle_tree_args: &CreateMerkleTreeArgs) -> Result<()> {
    // Implementation...
}

// process_claim.rs
pub fn process_claim(args: &Args, claim_args: &ClaimArgs) -> Result<()> {
    // Implementation...
}

// Other processing functions...
```

### Merkle Tree Generation

From `process_create_merkle_tree.rs`:

```rust
fn generate_merkle_tree(
    entries: &[CsvEntry],
    max_nodes_per_tree: u64,
    amount: f64,
    decimals: u32,
) -> Vec<AirdropMerkleTree> {
    // Implementation for creating merkle trees from CSV entries
}
```

### Transaction Handling

In `send_transaction.rs`:

```rust
pub fn send_transaction(
    tx: &Transaction,
    client: &RpcClient,
    send_client: &RpcClient,
) -> Result<(), Error> {
    // Implementation for sending and confirming transactions
}
```

## Merkle Tree Implementation

The CLI depends on the `jito-merkle-tree` crate for the core Merkle tree functionality.

### AirdropMerkleTree

The main struct for storing and manipulating a Merkle tree:

```rust
pub struct AirdropMerkleTree {
    pub airdrop_version: u64,
    pub creator: [u8; 32],
    pub max_total_claim: u64,
    pub max_num_nodes: u64,
    pub merkle_root: [u8; 32],
    pub entries: Vec<MerkleHashEntry>,
}
```

Methods include:
- `new_from_file` - Load a Merkle tree from a file
- `new_from_entries` - Create a Merkle tree from entries
- `get_proof_for_address` - Generate a Merkle proof for a specific address

## On-chain Program Interaction

The CLI interacts with the on-chain Merkle Distributor program using Anchor's client libraries:

```rust
fn get_program_client(&self) -> Program<Rc<Keypair>> {
    let payer = Keypair::new();
    let client = AnchorClient::new_with_options(
        Cluster::Custom(self.rpc_url.clone(), self.rpc_url.clone()),
        Rc::new(Keypair::from_bytes(&payer.to_bytes()).unwrap()),
        CommitmentConfig::finalized(),
    );
    let program: anchor_client::Program<Rc<Keypair>> =
        client.program(merkle_distributor::id()).unwrap();
    program
}
```

## Helper Functions

### PDA Generation

Functions for deriving program-derived addresses:

```rust
// From jito-merkle-tree/utils.rs
pub fn get_merkle_distributor_pda(
    program_id: &Pubkey,
    base: &Pubkey,
    mint: &Pubkey,
    version: u64,
) -> (Pubkey, u8) {
    // Implementation...
}

pub fn get_claim_status_pda(
    program_id: &Pubkey,
    distributor: &Pubkey,
    index: u64,
) -> (Pubkey, u8) {
    // Implementation...
}
```

### CSV Handling

Functions for working with CSV files:

```rust
// From jito-merkle-tree/csv_entry.rs
pub fn read_csv_entries(csv_path: &Path) -> Result<Vec<CsvEntry>> {
    // Implementation for reading and parsing CSV files
}

pub fn write_csv_entries(entries: &[CsvEntry], csv_path: &Path) -> Result<()> {
    // Implementation for writing entries to CSV
}
```

## Type Definitions

### CsvEntry

Represents a single entry in a CSV file:

```rust
pub struct CsvEntry {
    pub wallet_address: String,
    pub amount: u64,
    pub locked_amount: u64,
    // Additional fields...
}
```

### MerkleHashEntry

Represents a leaf node in the Merkle tree:

```rust
pub struct MerkleHashEntry {
    pub leaf_node: [u8; 32],
    pub wallet_address: String,
    pub amount: u64,
    pub locked_amount: u64,
    // Additional fields...
}
```

## Error Handling

The CLI uses Rust's `anyhow` crate for error handling, allowing for clean propagation of errors up the call stack:

```rust
pub fn create_new_distributor(args: &Args, new_distributor_args: &NewDistributorArgs) -> Result<()> {
    // Implementation with error handling
    // ...
    Ok(())
}
```

Common error scenarios are captured and reported to the user with meaningful error messages. 