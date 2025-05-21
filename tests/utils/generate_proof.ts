import { exec, execSync } from "child_process";
import { join, resolve } from "path";
import * as fs from 'fs';

export function generateMerkleProofs(csvPath: string, outputPath: string) {
    // Convert paths to absolute paths
    const absoluteCsvPath = resolve(csvPath);
    const absoluteOutputPath = resolve(outputPath);
    
    // Debug: Check if CLI exists
    try {
        const cliPath = execSync('which cli', { encoding: 'utf8' }).trim();
        console.log('CLI path:', cliPath);
    } catch (error) {
        console.error('CLI command not found in PATH. Please ensure cli is installed and in PATH');
        throw error;
    }

    // Debug: Check if CSV file exists and has content
    if (!fs.existsSync(absoluteCsvPath)) {
        throw new Error(`CSV file not found at ${absoluteCsvPath}`);
    }
    const csvContent = fs.readFileSync(absoluteCsvPath, 'utf8');
    console.log('CSV content:', csvContent);
    
    // Ensure output directory exists
    if (!fs.existsSync(absoluteOutputPath)) {
        fs.mkdirSync(absoluteOutputPath, { recursive: true });
    }

    console.log('CSV Path:', absoluteCsvPath);
    console.log('Output Path:', absoluteOutputPath);
    console.log('Current working directory:', process.cwd());
    console.log('Environment PATH:', process.env.PATH);

    // First create merkle tree
    const createTreeCommand = `cli create-merkle-tree \
        --csv-path "${absoluteCsvPath}" \
        --merkle-tree-path "${absoluteOutputPath}" \
        --max-nodes-per-tree 1000 \
        --amount 10000 \
        --decimals 9`;

    console.log('Creating merkle tree with command:', createTreeCommand);
    
    try {
        // Capture output for create merkle tree
        const createTreeOutput = execSync(createTreeCommand, { 
            encoding: 'utf8',
            env: { ...process.env, PATH: process.env.PATH },
            maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });
        console.log('Create merkle tree output:', createTreeOutput);

        // Verify the tree was created
        const treeFiles = fs.readdirSync(absoluteOutputPath);
        console.log('Created tree files:', treeFiles);
        
        if (treeFiles.length === 0) {
            console.error('No tree files were created!');
            console.log('Directory contents:', fs.readdirSync(absoluteOutputPath));
            throw new Error('No tree files were created');
        }

        // Then generate proofs
        const generateProofsCommand = `cli generate-kv-proof \
            --merkle-tree-path "${absoluteOutputPath}" \
            --kv-path "${join(absoluteOutputPath, 'proofs')}" \
            --max-entries-per-file 1000`;

        console.log('Generating proofs with command:', generateProofsCommand);
        
        // Capture output for generate proofs
        const generateProofsOutput = execSync(generateProofsCommand, { 
            encoding: 'utf8',
            env: { ...process.env, PATH: process.env.PATH },
            maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });
        console.log('Generate proofs output:', generateProofsOutput);

        // Verify the proofs were created
        const proofsPath = join(absoluteOutputPath, 'proofs');
        if (fs.existsSync(proofsPath)) {
            const proofFiles = fs.readdirSync(proofsPath);
            console.log('Created proof files:', proofFiles);
            
            if (proofFiles.length === 0) {
                console.error('No proof files were created!');
                console.log('Proofs directory contents:', fs.readdirSync(proofsPath));
                throw new Error('No proof files were created');
            }
        } else {
            console.warn('Proofs directory was not created');
            throw new Error('Proofs directory was not created');
        }

        console.log("Merkle proofs generated successfully");
    } catch (error) {
        console.error('Error executing command:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        throw error;
    }
}
  