use std::{ops::Mul, str::FromStr};

use serde::{Deserialize, Serialize};
use solana_program::{hash::hashv, pubkey::Pubkey};
use solana_sdk::hash::Hash;

use crate::csv_entry::CsvEntry;

/// Represents the claim information for an account.
#[derive(Debug, Clone, Eq, Hash, PartialEq, Serialize, Deserialize)]
pub struct TreeNode {
    /// Pubkey of the claimant; will be responsible for signing the claim
    pub claimant: Pubkey,
    /// Amount that claimant can claim immediately (unlocked)
    pub amount_unlocked: u64,
    /// Amount that claimant can claim through vesting (locked)
    pub amount_locked: u64,
    /// Claimant's proof of inclusion in the Merkle Tree
    pub proof: Option<Vec<[u8; 32]>>,
}

impl TreeNode {
    pub fn hash(&self) -> Hash {
        hashv(&[
            &self.claimant.to_bytes(),
            &self.amount_unlocked.to_le_bytes(),
            &self.amount_locked.to_le_bytes(),
        ])
    }

    /// Return total amount for this claimant (unlocked + locked)
    pub fn amount(&self) -> u64 {
        self.amount_unlocked + self.amount_locked
    }
    
    /// Return unlocked amount for this claimant
    pub fn amount_unlocked(&self) -> u64 {
        self.amount_unlocked
    }
    
    /// Return locked amount for this claimant
    pub fn amount_locked(&self) -> u64 {
        self.amount_locked
    }
}

/// Converts a ui amount to a token amount (with decimals)
fn ui_amount_to_token_amount(amount: f64, decimals: u32) -> u64 {
    amount
        .mul(10u64.checked_pow(decimals).unwrap() as f64)
        .floor() as u64
}

impl TreeNode {
    pub fn from_csv(entry: CsvEntry, decimals: u32) -> Self {
        let node = Self {
            claimant: Pubkey::from_str(entry.pubkey.as_str()).unwrap(),
            amount_unlocked: ui_amount_to_token_amount(entry.unlocked_amount(), decimals),
            amount_locked: ui_amount_to_token_amount(entry.locked_amount(), decimals),
            proof: None,
        };
        node
    }
}
