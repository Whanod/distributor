import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@project-serum/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface SetAdminAccounts {
  /** The [MerkleDistributor]. */
  distributor: PublicKey
  /** Admin signer */
  admin: PublicKey
  /** New admin account */
  newAdmin: PublicKey
}

export function setAdmin(accounts: SetAdminAccounts) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.distributor, isSigner: false, isWritable: true },
    { pubkey: accounts.admin, isSigner: true, isWritable: true },
    { pubkey: accounts.newAdmin, isSigner: false, isWritable: true },
  ]
  const identifier = Buffer.from([251, 163, 0, 52, 91, 194, 187, 92])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
  return ix
}
