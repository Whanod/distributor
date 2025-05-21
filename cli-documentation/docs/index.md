# Merkle Distributor CLI Documentation

Welcome to the documentation for the Merkle Distributor CLI. This tool is designed to interact with the Merkle Distributor program on the Solana blockchain, enabling efficient token distribution to large numbers of recipients.

## Documentation Contents

### Core Documentation

- [Overview](overview.md) - Introduction to the Merkle Distributor concept and CLI functionality
- [Installation Guide](installation.md) - How to install and set up the CLI
- [Quick Start Guide](quickstart.md) - Get up and running quickly with the basic workflow

### Reference Materials

- [Commands Reference](commands.md) - Detailed reference for all CLI commands
- [Usage Examples](usage-examples.md) - Practical examples for common tasks
- [API Reference](api-reference.md) - Technical reference for the CLI's internal structure

### Advanced Topics

- [Architecture](architecture.md) - In-depth explanation of the CLI and program architecture

## What is the Merkle Distributor?

The Merkle Distributor is a Solana program that enables efficient token distribution to large numbers of recipients using Merkle trees. This approach significantly reduces on-chain storage costs while maintaining security and verifiability.

Key benefits include:
- Reduced on-chain storage costs
- Efficient distribution to thousands or millions of recipients
- Support for token vesting schedules
- Clawback functionality for unclaimed tokens

## Key Features of the CLI

The CLI (`jup-scripts`) provides comprehensive tools for:

- Creating Merkle trees from CSV files of recipients
- Deploying and managing distributors on-chain
- Processing token claims for recipients
- Managing vesting schedules and admin functions
- Generating proofs for integration with external services

## Getting Started

If you're new to the Merkle Distributor CLI, we recommend starting with:

1. [Installation Guide](installation.md) to set up the CLI
2. [Quick Start Guide](quickstart.md) for a basic end-to-end workflow
3. [Commands Reference](commands.md) for detailed command information

For more complex use cases, check the [Usage Examples](usage-examples.md). 