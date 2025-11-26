import * as anchor from "@coral-xyz/anchor";
import type { Escrow as EscrowProgram } from "../idl/escrow";
import { PublicKey, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import idl from "../idl/escrow.json";
import {
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getMint,
} from "@solana/spl-token";

// const SYSTEM_PROGRAM = anchor.web3.SystemProgram.programId;
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

  const isDepositSol = depositMint === NATIVE_SOL;

  if (isDepositSol) {
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

  return {
    depositBalance: isDepositSol ? escrowSolBalance : depositBalance,
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

  if (depositMint.equals(PublicKey.default)) {
    depositAmount = depositAmount * LAMPORTS_PER_SOL;
  } else {
    try {
      const depositDecimals = await getMintDecimals(connection, depositMint);
      depositAmount = depositAmount * depositDecimals;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  if (receiveMint.equals(PublicKey.default)) {
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
        new anchor.BN(receiveAmount)
      )
      .accounts({
        escrowAuthority: wallet.publicKey!,
        receiver: seller,
        depositMint: depositMint.equals(PublicKey.default)
          ? receiveMint
          : depositMint,
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
  const escrowPkey = new PublicKey(escrowPda);
  if (!wallet.connected) throw new Error("Wallet not connected");
  const program = await getProgram(connection, wallet);

  let escrow = await program.account.escrow.fetch(escrowPda);

  const tx = await program.methods
    .accept(escrow.escrowId)
    .accounts({
      receiver: wallet.publicKey!,
      escrowAuthority: escrow.escrowAuthority,
      receiveMint: escrow.receiveMint.equals(PublicKey.default)
        ? escrow.depositMint
        : escrow.receiveMint,
      depositMint: escrow.depositMint.equals(PublicKey.default)
        ? escrow.receiveMint
        : escrow.depositMint,
    })
    .signers([])
    .rpc({ commitment: "confirmed" });

  return { tx, escrowPda };
};

export const closeEscrow = async (
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
    .close(escrow.escrowId)
    .accounts({
      escrowAuthority: wallet.publicKey!,
      receiver: escrow.receiver,
      depositMint: escrow.depositMint.equals(PublicKey.default)
        ? escrow.receiveMint
        : escrow.depositMint,
    })
    .signers([])
    .rpc({ commitment: "confirmed" });

  return { tx, escrowPda };
};
