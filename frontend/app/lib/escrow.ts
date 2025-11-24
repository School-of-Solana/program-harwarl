import * as anchor from "@coral-xyz/anchor";
import type { Escrow as EscrowProgram } from "../../../anchor_project/target/types/escrow";
import { PublicKey, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import idl from "../../../anchor_project/target/idl/escrow.json";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

const SYSTEM_PROGRAM = anchor.web3.SystemProgram.programId;
const ESCROW_SEED = "ESCROW_SEED";

export const getProgram = async (
  connection: Connection,
  wallet: WalletContextState
): Promise<anchor.Program<EscrowProgram>> => {
  if (!wallet.publicKey || !wallet.sendTransaction) {
    throw new Error("Wallet not connected");
  }

  const provider = new anchor.AnchorProvider(connection, wallet as any, {
    preflightCommitment: "processed",
  });

  return new anchor.Program<EscrowProgram>(idl as anchor.Idl, provider);
};

function getEscrowAddress(
  escrow_id: string,
  buyer: PublicKey,
  seller: PublicKey,
  ProgramId: PublicKey
) {
  return PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode(ESCROW_SEED),
      anchor.utils.bytes.utf8.encode(escrow_id),
      buyer.toBuffer(),
      seller.toBuffer(),
    ],
    ProgramId
  );
}

async function getAccountATA(account: any, mint: any) {
  return await getAssociatedTokenAddress(
    mint,
    account,
    true,
    TOKEN_2022_PROGRAM_ID
  );
}

export const getEscrowViaPda = async (
  connection: Connection,
  wallet: WalletContextState,
  escrowPda: PublicKey
) => {
  const program = await getProgram(connection, wallet);

  return program.account.escrow.fetch(escrowPda);
};

// Initialize Escrow
export const initializeEscrow = async (
  connection: Connection,
  wallet: WalletContextState,
  escrowId: string,
  seller: PublicKey,
  depositAmount: number,
  receiveAmount: number,
  depositMint: PublicKey,
  receiveMint: PublicKey,
  expiry?: number
) => {
  if (!wallet.connected) throw new Error("Wallet not connected");

  const program = await getProgram(connection, wallet);

  escrowId = escrowId.replace(/-/g, "");

  let escrowPda: PublicKey;
  try {
    [escrowPda] = getEscrowAddress(
      escrowId,
      wallet.publicKey!,
      seller,
      program.programId
    );
  } catch (error) {
    throw new Error(`Failed to derive PDA: ${error}`);
  }

  let tx: string;
  try {
    tx = await program.methods
      .initEscrow(
        escrowId,
        depositMint,
        new anchor.BN(depositAmount * LAMPORTS_PER_SOL),
        receiveMint,
        new anchor.BN(receiveAmount),
        new anchor.BN(expiry!)
      )
      .accounts({
        buyer: wallet.publicKey!,
        seller,
      })
      .signers([])
      .rpc({ commitment: "confirmed" });
  } catch (error) {
    throw new Error(`Failed to initialize escrow: ${error}`);
  }

  return { tx, escrowPda };
};

export const acceptEscrow = async (
  connection: Connection,
  wallet: WalletContextState,
  escrowId: string,
  buyer: PublicKey,
  seller: PublicKey
) => {
  if (!wallet.connected) throw new Error("Wallet not connected");

  const program = await getProgram(connection, wallet);

  const [escrowPda, _] = getEscrowAddress(
    escrowId,
    buyer,
    seller,
    program.programId
  );
  const tx = await program.methods
    .acceptEscrow()
    .accounts({
      seller: wallet.publicKey!,
      escrow: escrowPda,
    })
    .signers([])
    .rpc({ commitment: "confirmed" });

  return { tx, escrowPda };
};

export const fundEscrow = async (
  connection: Connection,
  wallet: WalletContextState,
  escrowPda: PublicKey
) => {
  if (!wallet || !wallet.connected) throw new Error("Wallet not connected");

  const program = await getProgram(connection, wallet);
  let escrow = await program.account.escrow.fetch(escrowPda);

  const tx = await program.methods
    .fundEscrow()
    .accounts({
      buyer: wallet.publicKey!,
      mint:
        escrow.depositMint == PublicKey.default
          ? escrow.receiveMint
          : escrow.depositMint,
      escrow: escrowPda,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .signers([])
    .rpc({ commitment: "confirmed" });

  return { tx, escrowPda };
};

export const sendAsset = async (
  connection: Connection,
  wallet: WalletContextState,
  escrowPda: PublicKey
) => {
  if (!wallet || !wallet.connected) throw new Error("Wallet not connected");

  const program = await getProgram(connection, wallet);
  let escrow = await program.account.escrow.fetch(escrowPda);

  const tx = await program.methods
    .sendAsset()
    .accounts({
      seller: wallet.publicKey!,
      mint:
        escrow.receiveMint == PublicKey.default
          ? escrow.depositMint
          : escrow.receiveMint,
      escrow: escrowPda,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .signers([])
    .rpc({ commitment: "confirmed" });

  return { tx, escrowPda };
};

export const confirmAsset = async (
  connection: Connection,
  wallet: WalletContextState,
  escrowPda: string
) => {
  if (!wallet || !wallet.connected) throw new Error("Wallet not connected");

  const program = await getProgram(connection, wallet);
  const escrowPubkey = new PublicKey(escrowPda);

  const escrow = await program.account.escrow.fetch(escrowPubkey);

  let buyer_ata: PublicKey | null = null;
  let seller_ata: PublicKey | null = null;
  let escrow_deposit_ata: PublicKey | null = null;
  let escrow_receive_ata: PublicKey | null = null;

  let depositMint: PublicKey | null = null;
  let receiveMint: PublicKey | null = null;

  // Deposit side
  if (!escrow.depositMint.equals(PublicKey.default)) {
    seller_ata = await getAccountATA(escrow.seller, escrow.depositMint);

    escrow_deposit_ata = await getAccountATA(escrowPubkey, escrow.depositMint);

    depositMint = escrow.depositMint;
  }

  // Receive side
  if (!escrow.receiveMint.equals(PublicKey.default)) {
    buyer_ata = await getAccountATA(wallet.publicKey!, escrow.receiveMint);

    escrow_receive_ata = await getAccountATA(escrowPubkey, escrow.receiveMint);

    receiveMint = escrow.receiveMint;
  }

  const tx = await program.methods
    .confirmAsset()
    .accounts({
      buyer: wallet.publicKey!,
      seller: escrow.seller,
      escrow: escrowPubkey,
      depositMint,
      receiveMint,
      escrowDepositAta: escrow_deposit_ata,
      escrowReceiveAta: escrow_receive_ata,
      buyerReceiveAta: buyer_ata,
      sellerReceiveAta: seller_ata,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .rpc({ commitment: "confirmed" });

  return { tx, escrowPda };
};

export const refundBuyer = async (
  connection: Connection,
  wallet: WalletContextState,
  escrowPda: string
) => {
  if (!wallet || !wallet.connected) throw new Error("Wallet not connected");

  const program = await getProgram(connection, wallet);
  const escrowPubkey = new PublicKey(escrowPda);

  const escrow = await program.account.escrow.fetch(escrowPda);
  let depositMint: PublicKey | null = null;

  // Deposit side
  if (!escrow.depositMint.equals(PublicKey.default)) {
    depositMint = escrow.depositMint;
  }

  // Receive side
  if (!escrow.receiveMint.equals(PublicKey.default)) {
    depositMint = escrow.receiveMint; // Placeholder
  }

  const tx = await program.methods
    .refundBuyer()
    .accounts({
      buyer: wallet.publicKey!,
      escrow: escrowPubkey,
      depositMint,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .signers([])
    .rpc({ commitment: "confirmed" });

  return { tx, escrowPda };
};

export const refundSeller = async (
  connection: Connection,
  wallet: WalletContextState,
  escrowPda: string
) => {
  if (!wallet || !wallet.connected) throw new Error("Wallet not connected");

  const program = await getProgram(connection, wallet);
  const escrowPubkey = new PublicKey(escrowPda);

  const escrow = await program.account.escrow.fetch(escrowPda);
  let receiveMint: PublicKey | null = null;

  // Receive side
  if (!escrow.receiveMint.equals(PublicKey.default)) {
    receiveMint = escrow.receiveMint;
  }

  // Deposit side
  if (!escrow.depositMint.equals(PublicKey.default)) {
    receiveMint = escrow.depositMint; // Placeholder
  }

  const tx = await program.methods
    .refundSeller()
    .accounts({
      seller: wallet.publicKey!,
      escrow: escrowPubkey,
      receiveMint,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .signers([])
    .rpc({ commitment: "confirmed" });

  return { tx, escrowPda };
};
