import * as anchor from "@coral-xyz/anchor";
import type { Escrow as EscrowProgram } from "../../../anchor_project/target/types/escrow";
import { PublicKey, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import idl from "../../../anchor_project/target/idl/escrow.json";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getMint,
} from "@solana/spl-token";

const SYSTEM_PROGRAM = anchor.web3.SystemProgram.programId;
const ESCROW_SEED = "ESCROW_SEED";
const NATIVE_SOL = PublicKey.default.toBase58();

const getEscrowAddress = (
  escrow_id: string,
  buyer: PublicKey,
  seller: PublicKey,
  ProgramId: PublicKey
) => {
  return PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode(ESCROW_SEED),
      anchor.utils.bytes.utf8.encode(escrow_id),
      buyer.toBuffer(),
      seller.toBuffer(),
    ],
    ProgramId
  );
};

const getSolVaultPda = async (escrowPda: PublicKey, program: any) => {
  const [solVaultPda] = await PublicKey.findProgramAddress(
    [Buffer.from("sol_vault"), escrowPda.toBuffer()],
    program.programId
  );

  return solVaultPda;
};

export const getMintProgram = async (
  connection: Connection,
  mint: PublicKey
) => {
  const mintKey = new PublicKey(mint);

  const mintInfo = await connection.getAccountInfo(mintKey, {
    commitment: "confirmed",
  });

  if (!mintInfo) {
    throw new Error(`Mint account not found: ${mintKey.toBase58()}`);
  }

  if (mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID))
    return TOKEN_2022_PROGRAM_ID;
  if (mintInfo.owner.equals(TOKEN_PROGRAM_ID)) return TOKEN_PROGRAM_ID;

  throw new Error(
    `Unexpected mint owner for ${mintKey.toBase58()}: ${mintInfo.owner.toBase58()}`
  );
};

export const getMintDecimals = async (
  connection: Connection,
  mint: PublicKey
) => {
  try {
    const mintInfo = await getMint(
      connection,
      mint,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    return 10 ** mintInfo.decimals;
  } catch (error) {
    return 10 ** 9;
  }
};

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

export const getEscrowBalances = async (
  connection: Connection,
  wallet: WalletContextState,
  escrowPda: string,
  depositMint: string,
  receiveMint: string
) => {
  const escrowPubKey = new PublicKey(escrowPda);
  const program = await getProgram(connection, wallet);

  let escrowSolBalance: number = 0;
  let depositBalance: number = 0;
  let receiveBalance: number = 0;

  const isDepositSol = depositMint === NATIVE_SOL;
  const isReceiveSol = receiveMint === NATIVE_SOL;

  if (isDepositSol || isReceiveSol) {
    // get sol balance
    // get Sol Vault
    const sol_vault = await getSolVaultPda(escrowPubKey, program);

    const lamports = await connection.getBalance(sol_vault, {
      commitment: "confirmed",
    });

    escrowSolBalance = lamports / LAMPORTS_PER_SOL;
  }

  const fetchTokenBalance = async (mint: string) => {
    const mintKey = new PublicKey(mint);

    const programId = await getMintProgram(connection, mintKey);

    const ata = await getAssociatedTokenAddress(
      mintKey,
      escrowPubKey,
      true,
      programId
    );

    let tokenAccount;
    try {
      tokenAccount = await getAccount(connection, ata, "confirmed", programId);
    } catch (error) {
      return 0;
    }

    return Number(tokenAccount.amount);
  };

  if (!isDepositSol) {
    depositBalance =
      (await fetchTokenBalance(depositMint)) /
      (await getMintDecimals(connection, new PublicKey(depositMint)));
  }

  if (!isReceiveSol) {
    receiveBalance =
      (await fetchTokenBalance(receiveMint)) /
      (await getMintDecimals(connection, new PublicKey(receiveMint)));
  }

  return {
    depositBalance: isDepositSol ? escrowSolBalance : depositBalance,
    receiveBalance: isReceiveSol ? escrowSolBalance : receiveBalance,
  };
};

export const getAccountATA = async (account: any, mint: any) => {
  return await getAssociatedTokenAddress(
    mint,
    account,
    true,
    TOKEN_2022_PROGRAM_ID
  );
};

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

  if (depositMint.toBase58() === PublicKey.default.toBase58()) {
    depositAmount = depositAmount * LAMPORTS_PER_SOL;
  } else {
    try {
      const depositDecimals = await getMintDecimals(connection, depositMint);
      depositAmount = depositAmount * depositDecimals;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  if (receiveMint.toBase58() === PublicKey.default.toBase58()) {
    receiveAmount = receiveAmount * LAMPORTS_PER_SOL;
  } else {
    try {
      const receiveDecimals = await getMintDecimals(connection, receiveMint);
      receiveAmount = receiveAmount * receiveDecimals;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  try {
    tx = await program.methods
      .initEscrow(
        escrowId,
        depositMint,
        new anchor.BN(depositAmount),
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
    console.log({ error });
    throw new Error(`Failed to initialize escrow: ${error}`);
  }
  return { tx, escrowPda };
};

export const acceptEscrow = async (
  connection: Connection,
  wallet: WalletContextState,
  escrowPda: string
) => {
  if (!wallet.connected) throw new Error("Wallet not connected");

  const program = await getProgram(connection, wallet);

  const tx = await program.methods
    .acceptEscrow()
    .accounts({
      seller: wallet.publicKey!,
      escrow: new PublicKey(escrowPda),
    })
    .signers([])
    .rpc({ commitment: "confirmed" });

  return { tx, escrowPda };
};

export const fundEscrow = async (
  connection: Connection,
  wallet: WalletContextState,
  escrowPda: string
) => {
  if (!wallet || !wallet.connected) throw new Error("Wallet not connected");

  const program = await getProgram(connection, wallet);
  let escrow = await program.account.escrow.fetch(escrowPda);

  let mint = escrow.depositMint.equals(PublicKey.default)
    ? escrow.receiveMint
    : escrow.depositMint;

  const tx = await program.methods
    .fundEscrow()
    .accounts({
      buyer: wallet.publicKey!,
      mint,
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
  escrowPda: string
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
