# Merkle Distributor CLI - Vesting Support Guide

This guide explains how to use the updated Merkle Distributor CLI to create token distributions with vesting schedules.

## Overview

The CLI now supports two types of token allocations:
- **Unlocked Amount**: Tokens that are immediately available when a user makes their initial claim
- **Locked Amount**: Tokens that are released linearly over time according to the vesting schedule

## CSV Format

### New Format (with Vesting)

```csv
pubkey,amount_unlocked,amount_locked
4SX6nqv5VRLMoNfYM5phvHgcBNcBEwUEES4qPPjf1EqS,200.0,800.0
EDGARWktv3nDxRYjufjdbZmryqGXceaFPoPpbUzdpqED,500.0,1500.0
EDGARWktv3nDxRYjufjdbZmryqGXceaFPoPpbUzdpqEH,100.0,400.0
```

### Legacy Format (Backward Compatible)

```csv
pubkey,amount
4SX6nqv5VRLMoNfYM5phvHgcBNcBEwUEES4qPPjf1EqS,1000.0
EDGARWktv3nDxRYjufjdbZmryqGXceaFPoPpbUzdpqED,2000.0
EDGARWktv3nDxRYjufjdbZmryqGXceaFPoPpbUzdpqEH,500.0
```

**Note**: The legacy format treats all tokens as unlocked (no vesting).

## Example Scenarios

### Scenario 1: 20% Immediate, 80% Vested Over 1 Year

For a user receiving 1000 tokens total:
- `amount_unlocked`: 200.0 (20% immediately available)
- `amount_locked`: 800.0 (80% vested linearly over the vesting period)

### Scenario 2: 100% Immediate (No Vesting)

For a user receiving 1000 tokens with no vesting:
- `amount_unlocked`: 1000.0
- `amount_locked`: 0.0

### Scenario 3: 100% Vested (Cliff Vesting)

For a user receiving 1000 tokens with full vesting:
- `amount_unlocked`: 0.0
- `amount_locked`: 1000.0

## CLI Commands

### 1. Create Merkle Tree with Vesting

```bash
./target/release/cli create-merkle-tree \
  --csv-path ./allocations_vesting.csv \
  --merkle-tree-path ./merkle_tree.json \
  --max-nodes-per-tree 10000 \
  --amount 1.0 \
  --decimals 9
```

### 2. Create New Distributor with Vesting Schedule

```bash
./target/release/cli new-distributor \
  --mint <TOKEN_MINT_ADDRESS> \
  --base <BASE_KEYPAIR_ADDRESS> \
  --start-vesting-ts 1704067200 \
  --end-vesting-ts 1735689600 \
  --clawback-start-ts 1735776000 \
  --merkle-tree-path ./merkle_tree.json \
  --enable-slot 0 \
  --airdrop-version 1 \
  --closable true \
  --base-path ./base_keypair.json \
  --clawback-receiver-owner <CLAWBACK_RECEIVER_ADDRESS> \
  --keypair-path ./admin_keypair.json
```

**Key Parameters:**
- `start-vesting-ts`: Unix timestamp when vesting begins
- `end-vesting-ts`: Unix timestamp when vesting ends
- `clawback-start-ts`: Unix timestamp when admin can clawback unclaimed tokens (must be at least 1 day after end-vesting-ts)

### 3. User Claims Tokens

#### Initial Claim (Gets Unlocked Portion)
```bash
./target/release/cli claim \
  --merkle-tree-path ./merkle_tree.json \
  --keypair-path ./user_keypair.json
```

This will:
- Transfer the `amount_unlocked` immediately to the user
- Create a claim status account tracking the `amount_locked` for vesting

#### Claim Vested Tokens (Can be called multiple times)
```bash
./target/release/cli claim-locked \
  --merkle-tree-path ./merkle_tree.json \
  --keypair-path ./user_keypair.json
```

This will:
- Calculate how many locked tokens have vested based on current time
- Transfer the newly vested tokens to the user
- Update the claim status to track what has been withdrawn

## Vesting Timeline Example

Given the following setup:
- **Total Allocation**: 1000 tokens
- **Unlocked**: 200 tokens (20%)
- **Locked**: 800 tokens (80%)
- **Vesting Period**: January 1, 2024 to January 1, 2025 (1 year)

### Timeline:

| Date | Action | Unlocked Available | Locked Vested | Total Claimable |
|------|--------|-------------------|----------------|-----------------|
| Jan 1, 2024 | Initial Claim | 200 tokens | 0 tokens | 200 tokens |
| Apr 1, 2024 | Claim Locked | 0 tokens | 200 tokens (25%) | 200 tokens |
| Jul 1, 2024 | Claim Locked | 0 tokens | 200 tokens (25%) | 200 tokens |
| Oct 1, 2024 | Claim Locked | 0 tokens | 200 tokens (25%) | 200 tokens |
| Jan 1, 2025 | Claim Locked | 0 tokens | 200 tokens (25%) | 200 tokens |

**Total Claimed**: 1000 tokens over the vesting period

## Important Notes

### Backward Compatibility
- Existing CSV files with the old format (`pubkey,amount`) will continue to work
- Old format treats all tokens as unlocked (no vesting)

### Vesting Calculation
- Vesting is linear between `start-vesting-ts` and `end-vesting-ts`
- Users can claim vested tokens at any time (they don't lose tokens by waiting)
- The formula: `vested_amount = (current_time - start_time) / (end_time - start_time) * locked_amount`

### Gas Optimization
- Users can claim vested tokens as frequently or infrequently as they want
- Each claim requires a transaction fee
- Unclaimed vested tokens remain available

### Security
- Vesting parameters are immutable once the distributor is created
- Users can only claim their own tokens
- Admin can clawback unclaimed tokens after the clawback period

## Testing

You can test the vesting functionality using the provided sample CSV:

```bash
# Create test merkle tree
./target/release/cli create-merkle-tree \
  --csv-path ./merkle-tree/test_fixtures/test_csv_vesting.csv \
  --merkle-tree-path ./test_vesting_tree.json \
  --max-nodes-per-tree 10 \
  --amount 1.0 \
  --decimals 9

# View the generated tree to verify amounts
cat ./test_vesting_tree.json
```

This will show you how the unlocked and locked amounts are properly encoded in the merkle tree structure. 