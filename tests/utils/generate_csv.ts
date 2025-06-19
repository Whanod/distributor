import * as fs from 'fs';
import * as path from 'path';

interface Entry {
    address: string;
    amount: number;
}

/**
 * Generates a CSV file from an array of addresses and amounts
 * @param csvPath - Path where the CSV file should be created
 * @param entries - Array of objects containing address and amount
 * @returns Promise that resolves when the file is written
 */
export async function generateCsvFromEntries(
    csvPath: string,
    entries: Entry[]
): Promise<void> {
    // Create header
    const header = 'pubkey,amount\n';
    
    // Convert entries to CSV rows
    const rows = entries.map(entry => `${entry.address},${entry.amount}`);
    
    // Combine header and rows
    const csvContent = header + rows.join('\n');
    
    // Ensure directory exists
    const dir = path.dirname(csvPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write to file
    await fs.promises.writeFile(csvPath, csvContent, 'utf8');
    
    // Verify file was written
    const writtenContent = await fs.promises.readFile(csvPath, 'utf8');
    console.log('Written CSV content:', writtenContent);
}

// Example usage:
/*
const entries = [
    { address: 'address1', amount: 1000 },
    { address: 'address2', amount: 2000 }
];

await generateCsvFromEntries('./path/to/output.csv', entries);
*/



interface VestedEntry {
    address: string;
    amount_locked: number;
    amount_unlocked: number;
}

/**
 * Generates a CSV file from an array of addresses and amounts
 * @param csvPath - Path where the CSV file should be created
 * @param entries - Array of objects containing address and amount
 * @returns Promise that resolves when the file is written
 */
export async function generateCsvFromVestedEntries(
    csvPath: string,
    entries: VestedEntry[]
): Promise<void> {
    // Create header
    const header = 'pubkey,amount_unlocked,amount_locked\n';
    
    // Convert entries to CSV rows
    const rows = entries.map(entry => `${entry.address},${entry.amount_unlocked},${entry.amount_locked}`);
    
    // Combine header and rows
    const csvContent = header + rows.join('\n');
    
    // Ensure directory exists
    const dir = path.dirname(csvPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write to file
    await fs.promises.writeFile(csvPath, csvContent, 'utf8');
    
    // Verify file was written
    const writtenContent = await fs.promises.readFile(csvPath, 'utf8');
    console.log('Written CSV content:', writtenContent);
}