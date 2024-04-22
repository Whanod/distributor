import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@project-serum/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface SetEnableSlotArgs {
  enableSlot: BN
}

export interface SetEnableSlotAccounts {
  /** [MerkleDistributor]. */
  distributor: PublicKey
  /** Payer to create the distributor. */
  admin: PublicKey
}

export const layout = borsh.struct([borsh.u64("enableSlot")])

export function setEnableSlot(
  args: SetEnableSlotArgs,
  accounts: SetEnableSlotAccounts
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.distributor, isSigner: false, isWritable: true },
    { pubkey: accounts.admin, isSigner: true, isWritable: true },
  ]
  const identifier = Buffer.from([5, 52, 73, 33, 150, 115, 97, 206])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      enableSlot: args.enableSlot,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
  return ix
}
