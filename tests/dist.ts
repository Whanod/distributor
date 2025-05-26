import * as anchor from "@coral-xyz/anchor";
import { generateCsvFromEntries } from "./utils/generate_csv";
import {  Keypair, MessageV0, PublicKey, SystemProgram, Transaction, VersionedTransaction } from "@solana/web3.js";
import { generateMerkleProofs } from "./utils/generate_proof";
import { MerkleDistributor } from "../target/types/merkle_distributor";
import { BN, max } from "bn.js";
import * as fs from 'fs';
import { join } from 'path';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount, getAssociatedTokenAddress, mintTo } from "@solana/spl-token";
import { getUserProof } from "./utils/get_proof";

const users:Keypair[] = []

let distributorPdaAndBump:[PublicKey,number];
let tokenVault:PublicKey;
let mint:PublicKey;
let mintOwner:Keypair;
for (let i = 0; i < 10; i++) {
  users.push(Keypair.generate())
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe("Create A Distributor Instance and claim", () => {
  it("should create a distributor", async () => {
    console.log(users.length ,"users")

    // Configure the client to use the local cluster.
    await generateCsvFromEntries("distributor.csv", users.map(user => ({
      address: user.publicKey.toBase58(),
      amount: 1000
    })));
    // Delete distributor folder if it exists
const distributorPath = join(process.cwd(), "distributor");
if (fs.existsSync(distributorPath)) {
  console.log("Deleting existing distributor folder...");
  fs.rmSync(distributorPath, { recursive: true, force: true });
  console.log("Distributor folder deleted");
}
    
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

    mintOwner = Keypair.generate()
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


     mint = await createMint(
      provider.connection, 
      mintOwner, 
      mintOwner.publicKey, 
      mintOwner.publicKey, 
      9,
      undefined,
      { "commitment": "confirmed" }
    );
    console.log("Created mint:", mint.toBase58());
   

    const baseKey = Keypair.generate()
    // Create the distributor PDA
    distributorPdaAndBump = PublicKey.findProgramAddressSync(
      [
        Buffer.from("MerkleDistributor"),
        baseKey.publicKey.toBytes(),
        mint.toBytes(),
        new BN(merkleTreeData.airdrop_version).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    //using mint owner to create the token account because provider doesnt expose the signer type
    tokenVault = (await getOrCreateAssociatedTokenAccount(
      provider.connection, 
      mintOwner, 
      mint, 
        distributorPdaAndBump[0],
      true
    )).address;

    let clawbackReceiver = await getOrCreateAssociatedTokenAccount(
      provider.connection, 
      mintOwner, 
      mint, 
      mintOwner.publicKey,
      true
    );
 

    // Create the distributor instance with the merkle tree data
    try {
      console.log("Creating distributor with accounts:", {
        distributor: distributorPdaAndBump[0].toBase58(),
        base: baseKey.publicKey.toBase58(),
        clawbackReceiver: clawbackReceiver.address.toBase58(),
        mint: mint.toBase58(),
        tokenVault: tokenVault.toBase58(),
        admin: provider.wallet.publicKey.toBase58(),
        systemProgram: anchor.web3.SystemProgram.programId.toBase58(),
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID.toBase58(),
        tokenProgram: TOKEN_PROGRAM_ID.toBase58(),
      });
      // A) Get the current slot the cluster has voted on
  const slot = await provider.connection.getSlot("confirmed");
  let max_num_nodes = merkleTreeData.max_num_nodes
  let max_total_claim = merkleTreeData.max_total_claim
  // B) Ask the RPC what time that slot was produced
  const unixTs = await provider.connection.getBlockTime(slot);
console.log("max total claim:",max_total_claim)
console.log("max num nodes:",max_num_nodes)
      // Log the instruction data
      const ix = await program.methods
        .newDistributor(
          new BN(merkleTreeData.airdrop_version),
          Array.from(Buffer.from(merkleTreeData.merkle_root)),
          new BN(max_total_claim.toString()),
          new BN(max_num_nodes.toString()),
          new BN(unixTs+3),
          new BN(unixTs + 15),
          new BN(unixTs+ 172800),
          new BN(0),
          true
        )
        .accounts({
          distributor: distributorPdaAndBump[0],
          base: baseKey.publicKey,
          clawbackReceiver: clawbackReceiver.address,
          mint: mint,
          tokenVault: tokenVault,
          admin: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();
      
     

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
    let mint_tx = await mintTo(provider.connection,mintOwner,mint,tokenVault,mintOwner,BigInt(max_total_claim.toString()),undefined,{
        commitment: "confirmed"
      })
            provider.connection.confirmTransaction(mint_tx,"confirmed")

    } catch (error) {
      console.error("Error creating distributor:", error);
      if (error.logs) {
        console.error("Program logs:", error.logs);
      }
      throw error;
    }
  })
  it("should create a claim instance", async () => {
    const provider = anchor.AnchorProvider.local();
    anchor.setProvider(provider);

    const program = anchor.workspace.MerkleDistributor as anchor.Program<MerkleDistributor>;
    let i=0
    for (let user of users) {
      try{
      i++
      console.log(i)
      console.log("current user:",user.publicKey.toBase58())
      console.log(users.length)
      
      let claimStatus = PublicKey.findProgramAddressSync(
        [
          Buffer.from("ClaimStatus"),
          user.publicKey.toBytes(),
          distributorPdaAndBump[0].toBytes(),
        ],
        program.programId
      )[0]
      let userTokenAccount = await getOrCreateAssociatedTokenAccount(
        provider.connection, 
        mintOwner, 
        mint, 
        user.publicKey,
        true
      )
      let proof = getUserProof(user.publicKey.toBase58())
      let ix = await program.methods.newClaim(new BN (proof.amount),new BN(0),proof.proof).accounts({
        distributor: distributorPdaAndBump[0],
        claimant: user.publicKey,
        systemProgram: SystemProgram.programId,
        from: tokenVault,
        tokenProgram: TOKEN_PROGRAM_ID,
        claimStatus: claimStatus,
        to: userTokenAccount.address,
      }).instruction()
   
     let airdrop_signature= await provider.connection.requestAirdrop(user.publicKey,100000000000000)
     await provider.connection.confirmTransaction(airdrop_signature,"confirmed")
      let claim_tx = new Transaction({
        
        feePayer: user.publicKey,
        recentBlockhash: (await provider.connection.getLatestBlockhash()).blockhash
      }).add(ix)
      claim_tx.sign(user)
     
      console.log("Claiming for user:", user.publicKey.toBase58())
      let message = new MessageV0(claim_tx.compileMessage())
      let versioned_tx = new VersionedTransaction(message)
      versioned_tx.sign([user])
      let x = await provider.connection.sendTransaction(versioned_tx)
      console.log("Claim created successfully:", x);
      provider.connection.confirmTransaction(x,"finalized")}
      catch(e){
        console.log("error:",e)
      }
      program.account.merkleDistributor.fetch(distributorPdaAndBump[0],"finalized").then(distributor=>{
        console.log("max num nodes:", distributor.maxNumNodes.toNumber())
        console.log("num nodes claimed:", distributor.numNodesClaimed.toNumber())
      })
     
    }
  
   
  })
  it("should claim an existing claim", async () => {
    await wait(3000)
    const provider = anchor.AnchorProvider.local();
    anchor.setProvider(provider);
    const program = anchor.workspace.MerkleDistributor as anchor.Program<MerkleDistributor>;
  for (let user of users) {
      let claimStatus = PublicKey.findProgramAddressSync(
        [
          Buffer.from("ClaimStatus"),
          user.publicKey.toBytes(),
          distributorPdaAndBump[0].toBytes(),
        ],
        program.programId
      )[0]
    
      let userTokenAccount = await getOrCreateAssociatedTokenAccount(
        provider.connection, 
        mintOwner, 
        mint, 
        user.publicKey,
        true
      )

      console.log("user token account balance:", userTokenAccount.amount.toString())
      

  // let ix=   await  program.methods.claimLocked().accounts({
  //       from: tokenVault,
  //       claimant: user.publicKey,
  //       claimStatus: claimStatus,
  //       to: userTokenAccount.address,
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //       distributor: distributorPdaAndBump[0],
  //     }).instruction()
  //     let claim_tx = new Transaction({
        
  //       feePayer: user.publicKey,
  //       recentBlockhash: (await provider.connection.getLatestBlockhash()).blockhash
  //     }).add(ix)
  //     claim_tx.sign(user)
  //     let message = new MessageV0(claim_tx.compileMessage())
  //     let versioned_tx = new VersionedTransaction(message)
  //     versioned_tx.sign([user])
  //     let x = await provider.connection.sendTransaction(versioned_tx)
  //     console.log("Claim created successfully:", x);
    }


    
  })
});