# CLI Commands Reference

The Merkle Distributor CLI (`jup-scripts`) provides a comprehensive set of commands to interact with the Merkle Distributor program. This reference documents all available commands and their options.

## Global Options

These options can be used with any command:

```
--mint <PUBKEY>             SPL Mint address
--base <PUBKEY>             Base key for merkle tree
--rpc-url <URL>             RPC URL (default: http://localhost:8899)
--extra-send-rpc-url <URL>  Send RPC URL (default: http://localhost:8899)
--program-id <PUBKEY>       Program ID (default: KdisqEcXbXKaTrBFqeDLhMmBvymLTwj9GmhDcdJyGat)
--keypair-path <PATH>       Payer keypair path
--priority-fee <NUMBER>     Priority fee
--bs58                      Encode the transaction in base58 and print for multisig
```

## Commands

### Create a New Distributor

```
jup-scripts new-distributor [OPTIONS] --merkle-tree-path <PATH> --base-path <PATH> --start-vesting-ts <TIMESTAMP> --end-vesting-ts <TIMESTAMP> --clawback-start-ts <TIMESTAMP> --enable-slot <SLOT> --clawback-receiver-owner <PUBKEY>
```

Options:
- `--start-vesting-ts <TIMESTAMP>`: Lockup timestamp start (Unix timestamp)
- `--end-vesting-ts <TIMESTAMP>`: Lockup timestamp end (Unix timestamp)
- `--merkle-tree-path <PATH>`: Path to directory containing merkle tree file(s)
- `--clawback-start-ts <TIMESTAMP>`: When to make the clawback period start
- `--enable-slot <SLOT>`: Enable slot for the distributor
- `--airdrop-version <VERSION>`: Optional airdrop version to filter trees
- `--closable`: Whether the distributor can be closed
- `--skip-verify`: Skip verification of distributor creation
- `--base-path <PATH>`: Base keypair path
- `--clawback-receiver-owner <PUBKEY>`: Clawback receiver owner public key

### Create a Merkle Tree

```
jup-scripts create-merkle-tree --csv-path <PATH> --merkle-tree-path <PATH> --max-nodes-per-tree <NUMBER> --amount <AMOUNT> --decimals <DECIMALS>
```

Options:
- `--csv-path <PATH>`: Path to CSV file with recipient data
- `--merkle-tree-path <PATH>`: Output path for merkle tree file
- `--max-nodes-per-tree <NUMBER>`: Maximum number of nodes per tree
- `--amount <AMOUNT>`: Token amount (as a floating-point number)
- `--decimals <DECIMALS>`: Token decimals

### Claim Tokens

```
jup-scripts claim --merkle-tree-path <PATH>
```

Options:
- `--merkle-tree-path <PATH>`: Path to merkle tree file

### Claim Using API

```
jup-scripts claim-from-api [OPTIONS] --destination-owner <PUBKEY>
```

Options:
- `--root-api <URL>`: API endpoint (default: https://worker.jup.ag/jup-claim-proof)
- `--destination-owner <PUBKEY>`: Destination owner public key

### Clawback Unclaimed Tokens

```
jup-scripts clawback --merkle-tree-path <PATH>
```

Options:
- `--merkle-tree-path <PATH>`: Path to merkle tree file

### Set Administrator

```
jup-scripts set-admin --new-admin <PUBKEY> --merkle-tree-path <PATH>
```

Options:
- `--new-admin <PUBKEY>`: New admin public key
- `--merkle-tree-path <PATH>`: Path to merkle tree file

### Set Enable Slot

```
jup-scripts set-enable-slot --from-version <VERSION> --to-version <VERSION> --slot <SLOT>
```

Options:
- `--from-version <VERSION>`: Starting version
- `--to-version <VERSION>`: Ending version
- `--slot <SLOT>`: Slot number

### Set Enable Slot By Time

```
jup-scripts set-enable-slot-by-time --merkle-tree-path <PATH> --timestamp <TIMESTAMP>
```

Options:
- `--merkle-tree-path <PATH>`: Path to merkle tree file
- `--timestamp <TIMESTAMP>`: Timestamp to convert to slot
- `--airdrop-version <VERSION>`: Optional airdrop version

### Set Clawback Start Timestamp

```
jup-scripts set-clawback-start-ts --from-version <VERSION> --to-version <VERSION> --clawback-start-ts <TIMESTAMP>
```

Options:
- `--from-version <VERSION>`: Starting version
- `--to-version <VERSION>`: Ending version
- `--clawback-start-ts <TIMESTAMP>`: Clawback start timestamp

### Fund All Distributors

```
jup-scripts fund-all --merkle-tree-path <PATH>
```

Options:
- `--merkle-tree-path <PATH>`: Path to directory containing merkle tree files

### Generate KV Proof

```
jup-scripts generate-kv-proof --merkle-tree-path <PATH> --kv-path <PATH> --max-entries-per-file <NUMBER>
```

Options:
- `--merkle-tree-path <PATH>`: Path to merkle tree file
- `--kv-path <PATH>`: Path for generated KV proofs
- `--max-entries-per-file <NUMBER>`: Maximum entries per file

### Mass Send Tokens

```
jup-scripts mass-send --csv-path <PATH> --des-path <PATH> --max-address-per-tx <NUMBER> --amount <AMOUNT>
```

Options:
- `--csv-path <PATH>`: Path to CSV with recipient addresses
- `--des-path <PATH>`: Destination path for results
- `--max-address-per-tx <NUMBER>`: Maximum addresses per transaction
- `--amount <AMOUNT>`: Amount to send

### Other Commands

The CLI also includes commands for:
- Verifying proofs
- Viewing claim status
- Closing distributors
- Viewing distributor information
- Setting clawback receiver
- And more...

For help with a specific command, use:
```
jup-scripts <COMMAND> --help
``` 