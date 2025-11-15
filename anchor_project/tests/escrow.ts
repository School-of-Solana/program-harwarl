import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Escrow } from "../target/types/escrow";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { expect } from "chai";

const ESCROW_SEED = "ESCROW_SEED";
const ZERO_PUBKEY = anchor.web3.PublicKey.default;

describe("escrow", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.escrow as Program<Escrow>;

  const alice = anchor.web3.Keypair.generate();
  const bob = anchor.web3.Keypair.generate();

  const escrow_1_id = "escrow_1_id";
  const description_1 = "desctipion 1";

  const escrow_2_id = "escrow_2_id";
  const description_2 = "description 2";

  const long_escrow_id = "A".repeat(35);
  const long_description = "D".repeat(50);

  describe("Initialize Escrow", async () => {
    it("Should successfully initialize a tweet with a valid id and description", async () => {
      // Bob as the buyer, Alice as the seller
      await airdrop(provider.connection, bob.publicKey);

      const [escrow_pkey, escrow_bump] = getEscrowAddress(
        escrow_1_id,
        bob.publicKey,
        alice.publicKey,
        program.programId
      );

      await program.methods
        .initEscrow(
          escrow_1_id,
          { sol2token: {} },
          ZERO_PUBKEY,
          new anchor.BN(0.5 * LAMPORTS_PER_SOL),
          new anchor.web3.PublicKey(Array(32).fill(0)),
          new anchor.BN(0.3 * LAMPORTS_PER_SOL),
          description_1,
          new anchor.BN(Date.now() / 1000 + 3600)
        )
        .accounts({
          buyer: bob.publicKey,
          seller: alice.publicKey,
          escrow: escrow_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });

      await checkEscrow(program, escrow_pkey, bob.publicKey, {
        buyer: bob.publicKey,
        seller: alice.publicKey,
        escrowType: { sol2token: {} },
        depositMint: ZERO_PUBKEY,
        depositAmount: new anchor.BN(0.5 * LAMPORTS_PER_SOL),
        receiveMint: new anchor.web3.PublicKey(Array(32).fill(0)),
        receiveAmount: new anchor.BN(0.3 * LAMPORTS_PER_SOL),
        description: description_1,
        expiry: new anchor.BN(Date.now() / 1000 + 3600),
      });
    });
  });
});

async function airdrop(connection: any, address: any, amount = 1000000000) {
  await connection.confirmTransaction(
    await connection.requestAirdrop(address, amount),
    "confirmed"
  );
}

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

async function checkEscrow(
  program: anchor.Program<Escrow>,
  escrowPda: PublicKey,
  escrow_author: PublicKey,
  expected: {
    buyer;
    seller;
    escrowType;
    depositMint;
    depositAmount;
    receiveMint;
    receiveAmount;
    description;
    expiry;
  }
) {
  // let escrow = await program.account.escrow.fetch(escrowPda);
  // // Basic Asserts
  // expect(escrow.bump).to.be.a("number");
}

function isSOL(mint) {
  return mint.equals(ZERO_PUBKEY);
}
