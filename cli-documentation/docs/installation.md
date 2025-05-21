# Installation Guide

This guide will help you install the Merkle Distributor CLI tool.

## Prerequisites

- Rust and Cargo installed (version 1.53 or higher recommended)
- Solana CLI tools
- Git

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/distributor.git
cd distributor
```

### 2. Build the CLI

```bash
cargo build --release -p jup-scripts
```

The executable will be available at `target/release/jup-scripts`.

### 3. Add to Path (Optional)

For convenience, you can add the CLI to your system PATH:

```bash
export PATH=$PATH:/path/to/distributor/target/release
```

Or create a symlink to a directory that's already in your PATH:

```bash
ln -s /path/to/distributor/target/release/jup-scripts /usr/local/bin/
```

## Verification

To verify that the installation was successful, run:

```bash
jup-scripts --help
```

This should display the help menu with available commands.

## Dependencies

The CLI depends on the following Rust crates:
- anchor-lang, anchor-spl, anchor-client
- solana-program, solana-rpc-client, solana-sdk
- clap (for command-line argument parsing)
- spl-associated-token-account, spl-token
- And other utility libraries

These dependencies are managed through Cargo and will be automatically downloaded during the build process. 