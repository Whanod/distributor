import * as anchor from "@coral-xyz/anchor";
import { exec, execSync } from "child_process";
import { generateCsvFromEntries } from "./utils/generate_csv";
import { Connection, Keypair, PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY, Transaction } from "@solana/web3.js";
import { generateMerkleProofs } from "./utils/generate_proof";
import { Distributor } from "../sdk/src";
import { MerkleDistributor } from "../target/types/merkle_distributor";
import { BN } from "bn.js";
import * as fs from 'fs';
import { join } from 'path';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { createWithSeedSync } from "@coral-xyz/anchor/dist/cjs/utils/pubkey";
import { SystemAccountsCoder } from "@coral-xyz/anchor/dist/cjs/coder/system/accounts";
import { get } from "http";

const user1 = Keypair.generate()
const user2 = Keypair.generate()
const user3 = Keypair.generate()
const user4 = Keypair.generate()
const user5 = Keypair.generate()
const user6 = Keypair.generate()
const user7 = Keypair.generate()

describe("Create A Distributor Instance", () => {
  it("should create a distributor", async () => {
    // Configure the client to use the local cluster.
    await generateCsvFromEntries("distributor.csv", [
      { address: user1.publicKey.toBase58(), amount: 1000 },
      { address: user2.publicKey.toBase58(), amount: 2000 },
      { address: user3.publicKey.toBase58(), amount: 1000 },
      { address: user4.publicKey.toBase58(), amount: 3000 },
      { address: user5.publicKey.toBase58(), amount: 1000 },
    ]);
    
    // Generate merkle proofs
    generateMerkleProofs("distributor.csv", "distributor");

    const provider = anchor.AnchorProvider.local();
    anchor.setProvider(provider);
    const program = anchor.workspace.MerkleDistributor as anchor.Program<MerkleDistributor>;
    
    // Add program verification
    console.log("Program ID:", program.programId.toBase58());
    console.log("Program loaded:", !!program);
    
    // Load the merkle tree data
    const merkleTreePath = join(process.cwd(), "distributor", "tree_0.json");
    const merkleTreeData = JSON.parse(fs.readFileSync(merkleTreePath, 'utf8'))
    console.log("Merkle tree data:", merkleTreeData);

    let mintOwner = Keypair.generate()
    console.log("Provider wallet balance:", await provider.connection.getBalance(provider.wallet.publicKey))
    let ins = SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey: mintOwner.publicKey,
      space: 0,
      lamports: 100000000000000,
      programId: SystemProgram.programId
    })
    let tx = new Transaction({
      feePayer: provider.wallet.publicKey,
      recentBlockhash: (await provider.connection.getLatestBlockhash()).blockhash
    }).add(ins)
    const signed = await provider.wallet.signTransaction(tx)
    signed.sign(mintOwner)

    await provider.sendAndConfirm(signed)
    console.log("Provider wallet balance after funding:", await provider.connection.getBalance(provider.wallet.publicKey))
    console.log("Mint owner balance:", await provider.connection.getBalance(mintOwner.publicKey))
    console.log("--------------------------------")

    const mint = await createMint(
      provider.connection, 
      mintOwner, 
      mintOwner.publicKey, 
      mintOwner.publicKey, 
      6,
      undefined,
      { "commitment": "confirmed" }
    );
    console.log("Created mint:", mint.toBase58());

    const baseKey = Keypair.generate()
    // Create the distributor PDA
    const [distributorPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("MerkleDistributor"),
        baseKey.publicKey.toBytes(),
        mint.toBytes(),
        new BN(merkleTreeData.airdrop_version).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
    console.log("Distributor PDA:", distributorPda.toBase58());

    //using mint owner to create the token account because provider doesnt expose the signer type
    let tokenVault = await getOrCreateAssociatedTokenAccount(
      provider.connection, 
      mintOwner, 
      mint, 
      distributorPda,
      true
    );
    console.log("Token vault:", tokenVault.address.toBase58());

    let clawbackReceiver = await getOrCreateAssociatedTokenAccount(
      provider.connection, 
      mintOwner, 
      mint, 
      mintOwner.publicKey,
      true
    );
    console.log("Clawback receiver:", clawbackReceiver.address.toBase58());

    console.log("Airdrop version:", merkleTreeData.airdrop_version);
    console.log("Merkle root:", merkleTreeData.merkle_root);
    console.log("--------------------------------");

    // Create the distributor instance with the merkle tree data
    try {
      console.log("Creating distributor with accounts:", {
        distributor: distributorPda.toBase58(),
        base: baseKey.publicKey.toBase58(),
        clawbackReceiver: clawbackReceiver.address.toBase58(),
        mint: mint.toBase58(),
        tokenVault: tokenVault.address.toBase58(),
        admin: provider.wallet.publicKey.toBase58(),
        systemProgram: anchor.web3.SystemProgram.programId.toBase58(),
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID.toBase58(),
        tokenProgram: TOKEN_PROGRAM_ID.toBase58(),
      });
      // A) Get the current slot the cluster has voted on
  const slot = await provider.connection.getSlot("confirmed");

  // B) Ask the RPC what time that slot was produced
  const unixTs = await provider.connection.getBlockTime(slot);

      // Log the instruction data
      const ix = await program.methods
        .newDistributor(
          new BN(merkleTreeData.airdrop_version),
          Array.from(Buffer.from(merkleTreeData.merkle_root)),
          new BN(merkleTreeData.maxTotalClaim),
          new BN(merkleTreeData.maxNumNodes),
          new BN(unixTs+1000),
          new BN(unixTs + 86400),
          new BN(unixTs+ 172800),
          new BN(0),
          true
        )
        .accounts({
          distributor: distributorPda,
          base: baseKey.publicKey,
          clawbackReceiver: clawbackReceiver.address,
          mint: mint,
          tokenVault: tokenVault.address,
          admin: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();
      
      console.log("Instruction data:", ix.data);
      console.log("Instruction accounts:", ix.keys.map(k => ({
        pubkey: k.pubkey.toBase58(),
        isSigner: k.isSigner,
        isWritable: k.isWritable
      })));

      let tx = new Transaction({
        feePayer: provider.wallet.publicKey,
        recentBlockhash: (await provider.connection.getLatestBlockhash()).blockhash
      }).add(ix)
      const signed = await provider.wallet.signTransaction(tx)
      signed.sign(baseKey)
      let x = await provider.sendAndConfirm(signed)
      console.log("Distributor created successfully:", x);
      provider.connection.confirmTransaction(x,"confirmed")
      let txData = await provider.connection.getTransaction(x, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed"
      })
      console.log("Transaction error:", txData)
    } catch (error) {
      console.error("Error creating distributor:", error);
      if (error.logs) {
        console.error("Program logs:", error.logs);
      }
      throw error;
    }
  });
});