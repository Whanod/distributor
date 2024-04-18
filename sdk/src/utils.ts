import * as anchor from "@coral-xyz/anchor";
import * as FarmsErrors from "./rpc_client/errors";
import { TOKEN_PROGRAM_ID } from "@project-serum/serum/lib/token-instructions";
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
  Transaction,
  Signer,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { Decimal } from "decimal.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
} from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import DISTRIBUTORIDL from "./rpc_client/merkle_distributor.json";

export const DISTRIBUTOR_IDL = DISTRIBUTORIDL as anchor.Idl;
export const WAD = new Decimal("1".concat(Array(18 + 1).join("0")));

export function parseKeypairFile(file: string): Keypair {
  return Keypair.fromSecretKey(
    Buffer.from(JSON.parse(require("fs").readFileSync(file))),
  );
}

export function collToLamportsDecimal(
  amount: Decimal,
  decimals: number,
): Decimal {
  let factor = Math.pow(10, decimals);
  return amount.mul(factor);
}

export function lamportsToCollDecimal(
  amount: Decimal,
  decimals: number,
): Decimal {
  let factor = Math.pow(10, decimals);
  return amount.div(factor);
}

export async function getAssociatedTokenAddress(
  owner: PublicKey,
  tokenMintAddress: PublicKey,
): Promise<PublicKey> {
  return await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID, // always ASSOCIATED_TOKEN_PROGRAM_ID
    TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
    tokenMintAddress, // mint
    owner, // owner
    true,
  );
}

export async function createAtaInstruction(
  owner: PublicKey,
  tokenMintAddress: PublicKey,
  ata: PublicKey,
): Promise<TransactionInstruction> {
  return Token.createAssociatedTokenAccountInstruction(
    ASSOCIATED_TOKEN_PROGRAM_ID, // always ASSOCIATED_TOKEN_PROGRAM_ID
    TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
    tokenMintAddress, // mint
    ata, // ata
    owner, // owner of token account
    owner, // fee payer
  );
}

export async function getTokenAccountBalance(
  provider: anchor.AnchorProvider,
  tokenAccount: PublicKey,
): Promise<Decimal> {
  const tokenAccountBalance =
    await provider.connection.getTokenAccountBalance(tokenAccount);
  return new Decimal(tokenAccountBalance.value.amount).div(
    Decimal.pow(10, tokenAccountBalance.value.decimals),
  );
}

export async function getSolBalanceInLamports(
  provider: anchor.AnchorProvider,
  account: PublicKey,
): Promise<number> {
  let balance: number | undefined = undefined;
  while (balance === undefined) {
    balance = (await provider.connection.getAccountInfo(account))?.lamports;
  }
  return balance;
}

export async function getSolBalance(
  provider: anchor.AnchorProvider,
  account: PublicKey,
): Promise<Decimal> {
  const balance = new Decimal(await getSolBalanceInLamports(provider, account));
  return lamportsToCollDecimal(balance, 9);
}

export type Cluster = "localnet" | "devnet" | "mainnet";

export async function accountExist(
  connection: anchor.web3.Connection,
  account: anchor.web3.PublicKey,
) {
  const info = await connection.getAccountInfo(account);
  if (info === null || info.data.length === 0) {
    return false;
  }
  return true;
}

export function getClaimStatusPDA(
  claimant: PublicKey,
  distributor: PublicKey,
  programId: PublicKey,
): PublicKey {
  const [userState, _userStateBump] =
    anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("ClaimStatus"), claimant.toBuffer(), distributor.toBuffer()],
      programId,
    );

  return userState;
}

export function initializeClient(): { initialOwner: Keypair, provider: anchor.AnchorProvider } {
  const admin = process.env.ADMIN;
  const rpc = process.env.RPC;
  let resolvedRpc: string;
  let resolvedAdmin: string;

  console.log(admin, rpc);

  if (rpc) {
    resolvedRpc = rpc;
  } else {
    throw "Must specify cluster";
  }

  if (admin) {
    resolvedAdmin = admin;
  } else {
    throw "Must specify admin";
  }

  const payer = parseKeypairFile(admin);
  const connection = new Connection(resolvedRpc, {
    commitment: "confirmed",
  });
  // @ts-ignore
  const wallet = new anchor.Wallet(payer);
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    anchor.AnchorProvider.defaultOptions(),
  );
  const initialOwner = payer;
  anchor.setProvider(provider);

  console.log("\nSettings ⚙️");
  console.log("Admin:", resolvedAdmin);
  console.log("Cluster:", resolvedRpc);

  return {
    initialOwner,
    provider
  };
}

export async function printSimulateTx(conn: Connection, tx: Transaction) {
  console.log(
    "Tx in B64",
    `https://explorer.solana.com/tx/inspector?message=${encodeURIComponent(
      tx.serializeMessage().toString("base64"),
    )}`,
  );

  let res = await conn.simulateTransaction(tx);
  console.log("Simulate Response", res);
  console.log("");
}

export function createAddExtraComputeUnitFeeTransaction(
  units: number,
  microLamports: number,
): TransactionInstruction[] {
  const ixns: TransactionInstruction[] = [];
  ixns.push(ComputeBudgetProgram.setComputeUnitLimit({ units }));
  ixns.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports }));
  return ixns;
}

export async function fetchUserDataFromApi(user: PublicKey, apiUrl: string): Promise<ClaimApiResponse> {
  const headers: Headers = new Headers()
  // Add a few headers
  headers.set('Content-Type', 'application/json')
  headers.set('Accept', 'application/json')
  // Add a custom header, which we can use to check
  headers.set('X-Custom-Header', 'CustomValue')

  // Create the request object, which will be a RequestInfo type. 
  // Here, we will pass in the URL as well as the options object as parameters.
  const request: RequestInfo = new Request(apiUrl + '/user/' + user.toString(), {
    method: 'GET',
    headers: headers
  })

  return fetch(request)
    // the JSON body is taken from the response
    .then(res => res.json())
    .then(res => {
      // The response has an `any` type, so we need to cast
      // it to the `User` type, and return it from the promise
      return res as ClaimApiResponse
    });
}

export type ClaimApiResponse = {
  merkle_tree: string;
  amount: number,
  proof: Array<Array<number>>;
}