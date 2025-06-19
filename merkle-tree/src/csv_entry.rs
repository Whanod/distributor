use std::{fs::File, path::PathBuf, result};

use serde::{Deserialize, Serialize};

use crate::error::MerkleTreeError;

pub type Result<T> = result::Result<T, MerkleTreeError>;

/// Represents a single entry in a CSV
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CsvEntry {
    /// Pubkey of the claimant; will be responsible for signing the claim
    pub pubkey: String,
    /// amount unlocked immediately (ui amount)
    #[serde(default)]
    pub amount_unlocked: f64,
    /// amount locked for vesting (ui amount)
    #[serde(default)]
    pub amount_locked: f64,
    /// Legacy field for backward compatibility - if present, will be used as amount_unlocked
    #[serde(default)]
    pub amount: Option<f64>,
}

impl CsvEntry {
    pub fn new_from_file(path: &PathBuf) -> Result<Vec<Self>> {
        let file = File::open(path)?;
        let mut rdr = csv::Reader::from_reader(file);

        let mut entries = Vec::new();
        for result in rdr.deserialize() {
            let mut record: CsvEntry = result.unwrap();
            
            // Handle backward compatibility: if 'amount' field is present and amount_unlocked is 0,
            // use 'amount' as amount_unlocked
            if let Some(legacy_amount) = record.amount {
                if record.amount_unlocked == 0.0 && record.amount_locked == 0.0 {
                    record.amount_unlocked = legacy_amount;
                }
            }
            
            entries.push(record);
        }

        Ok(entries)
    }
    
    /// Get the total amount (unlocked + locked)
    pub fn total_amount(&self) -> f64 {
        self.amount_unlocked + self.amount_locked
    }
    
    /// Get the unlocked amount
    pub fn unlocked_amount(&self) -> f64 {
        self.amount_unlocked
    }
    
    /// Get the locked amount
    pub fn locked_amount(&self) -> f64 {
        self.amount_locked
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_csv_parsing() {
        let path = PathBuf::from("./test_fixtures/test_csv.csv");
        let entries = CsvEntry::new_from_file(&path).expect("Failed to parse CSV");

        assert_eq!(entries.len(), 3);

        assert_eq!(
            entries[0].pubkey,
            "4SX6nqv5VRLMoNfYM5phvHgcBNcBEwUEES4qPPjf1EqS"
        );
        // This will work with legacy format where amount becomes amount_unlocked
        assert_eq!(entries[0].unlocked_amount(), 1000.0);
    }
}
