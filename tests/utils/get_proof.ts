import { PublicKey } from "@solana/web3.js";
import * as fs from 'fs';
import { join } from 'path';

interface ProofData {
    merkle_tree: string;
    amount: number;
    proof: number[][];
}

interface MerkleTreeData {
    [key: string]: ProofData;
}

export function getUserProof(userAddress: string): { 
    proof: number[][], 
    amount: number,
    merkleTree: string
} {
    // Read the merkle tree data
    const merkleTreePath = join(process.cwd(), "distributor", "proofs", "0.json");
    if (!fs.existsSync(merkleTreePath)) {
        throw new Error(`Merkle tree file not found at ${merkleTreePath}`);
    }

    const merkleTreeData: MerkleTreeData = JSON.parse(fs.readFileSync(merkleTreePath, 'utf8'));
    
    // Get the user's proof data
    const userProof = merkleTreeData[userAddress];
    if (!userProof) {
        throw new Error(`No proof found for user ${userAddress}`);
    }

    return {
        proof: userProof.proof,
        amount: userProof.amount,
        merkleTree: userProof.merkle_tree
    };
} 