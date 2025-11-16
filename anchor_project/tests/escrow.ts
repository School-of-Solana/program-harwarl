import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Escrow } from "../target/types/escrow";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { assert, expect } from "chai";
import {
  Account,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

const ESCROW_SEED = "ESCROW_SEED";
const ZERO_PUBKEY = anchor.web3.PublicKey.default;

describe("escrow", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.escrow as Program<Escrow>;

  let buyer: Keypair;
  let seller: Keypair;
  let mint: PublicKey;
  let buyerAta: Account;
  let sellerAta: Account;
  let escrowPda: PublicKey;
  let escrowBump: number;
  let escrowAta: Account;
  seller = anchor.web3.Keypair.generate();
  buyer = anchor.web3.Keypair.generate();
  const depositAmount = new anchor.BN(2 * LAMPORTS_PER_SOL);
  const tokenAmount = new anchor.BN(100 * LAMPORTS_PER_SOL);
  const description_1 = "desctipion 1";
  const long_escrow_id = "A".repeat(32);
  const long_description = "D".repeat(128);
  const expiry = new anchor.BN(Date.now() / 1000 + 4000);

  const TOKEN_A_PUBKEY = new anchor.web3.PublicKey(Array(32).fill(1));

  // describe("Initialize Escrow", async () => {
  //   it("Should successfully initialize a tweet with a valid id and description", async () => {
  //     await airdrop(provider.connection, buyer.publicKey);

  //     [escrowPda, escrowBump] = getEscrowAddress(
  //       escrowId,
  //       buyer.publicKey,
  //       seller.publicKey,
  //       program.programId
  //     );

  //     await program.methods
  //       .initEscrow(
  //         escrowId,
  //         ZERO_PUBKEY,
  //         depositAmount,
  //         TOKEN_A_PUBKEY,
  //         depositAmount,
  //         description_1,
  //         expiry
  //       )
  //       .accounts({
  //         buyer: buyer.publicKey,
  //         seller: seller.publicKey,
  //         escrow: escrowPda,
  //         systemProgram: anchor.web3.SystemProgram.programId,
  //       })
  //       .signers([buyer])
  //       .rpc({ commitment: "confirmed" });

  //     await checkEscrow({
  //       program,
  //       escrowPda: escrowPda,
  //       escrow_author: buyer.publicKey,
  //       expected: {
  //         bump: escrowBump,
  //         buyer: buyer.publicKey,
  //         seller: seller.publicKey,
  //         escrow_id: escrowId,
  //         depositMint: ZERO_PUBKEY,
  //         depositAmount,
  //         receiveMint: TOKEN_A_PUBKEY,
  //         receiveAmount: depositAmount,
  //         description: description_1,
  //         expiry,
  //       },
  //     });
  //   });

  //   it("Should successfully initialize escrow with exactly 32 bytes Id (boundary test)", async () => {
  //     [escrowPda, escrowBump] = getEscrowAddress(
  //       long_escrow_id,
  //       buyer.publicKey,
  //       seller.publicKey,
  //       program.programId
  //     );

  //     await program.methods
  //       .initEscrow(
  //         long_escrow_id,
  //         ZERO_PUBKEY,
  //         depositAmount,
  //         TOKEN_A_PUBKEY,
  //         depositAmount,
  //         description_1,
  //         expiry
  //       )
  //       .accounts({
  //         buyer: buyer.publicKey,
  //         seller: seller.publicKey,
  //         escrow: escrowPda,
  //         systemProgram: anchor.web3.SystemProgram.programId,
  //       })
  //       .signers([buyer])
  //       .rpc({ commitment: "confirmed" });

  //     await checkEscrow({
  //       program,
  //       escrowPda: escrowPda,
  //       escrow_author: buyer.publicKey,
  //       expected: {
  //         bump: escrowBump,
  //         buyer: buyer.publicKey,
  //         seller: seller.publicKey,
  //         escrow_id: long_escrow_id,
  //         depositMint: ZERO_PUBKEY,
  //         depositAmount,
  //         receiveMint: TOKEN_A_PUBKEY,
  //         receiveAmount: depositAmount,
  //         description: description_1,
  //         expiry,
  //       },
  //     });
  //   });

  //   it("Should successfully initialize escrow with exactly 128 bytes description (boundary test)", async () => {
  //     const expiry = new anchor.BN(Date.now() / 1000 + 3600);
  //     const id = "edge des";

  //     [escrowPda, escrowBump] = getEscrowAddress(
  //       id,
  //       buyer.publicKey,
  //       seller.publicKey,
  //       program.programId
  //     );

  //     await program.methods
  //       .initEscrow(
  //         id,
  //         ZERO_PUBKEY,
  //         depositAmount,
  //         TOKEN_A_PUBKEY,
  //         depositAmount,
  //         long_description,
  //         expiry
  //       )
  //       .accounts({
  //         buyer: buyer.publicKey,
  //         seller: seller.publicKey,
  //         escrow: escrowPda,
  //         systemProgram: anchor.web3.SystemProgram.programId,
  //       })
  //       .signers([buyer])
  //       .rpc({ commitment: "confirmed" });

  //     await checkEscrow({
  //       program,
  //       escrowPda: escrowPda,
  //       escrow_author: buyer.publicKey,
  //       expected: {
  //         bump: escrowBump,
  //         buyer: buyer.publicKey,
  //         seller: seller.publicKey,
  //         escrow_id: id,
  //         depositMint: ZERO_PUBKEY,
  //         depositAmount,
  //         receiveMint: TOKEN_A_PUBKEY,
  //         receiveAmount: depositAmount,
  //         description: long_description,
  //         expiry,
  //       },
  //     });
  //   });

  //   it("Should successfully initialize escrow with empty description", async () => {
  //     const expiry = new anchor.BN(Date.now() / 1000 + 3600);
  //     const id = "empty description";

  //     [escrowPda, escrowBump] = getEscrowAddress(
  //       id,
  //       buyer.publicKey,
  //       seller.publicKey,
  //       program.programId
  //     );

  //     await program.methods
  //       .initEscrow(
  //         id,
  //         ZERO_PUBKEY,
  //         depositAmount,
  //         TOKEN_A_PUBKEY,
  //         depositAmount,
  //         "",
  //         expiry
  //       )
  //       .accounts({
  //         buyer: buyer.publicKey,
  //         seller: seller.publicKey,
  //         escrow: escrowPda,
  //         systemProgram: anchor.web3.SystemProgram.programId,
  //       })
  //       .signers([buyer])
  //       .rpc({ commitment: "confirmed" });

  //     await checkEscrow({
  //       program,
  //       escrowPda: escrowPda,
  //       escrow_author: buyer.publicKey,
  //       expected: {
  //         bump: escrowBump,
  //         buyer: buyer.publicKey,
  //         seller: seller.publicKey,
  //         escrow_id: id,
  //         depositMint: ZERO_PUBKEY,
  //         depositAmount,
  //         receiveMint: TOKEN_A_PUBKEY,
  //         receiveAmount: depositAmount,
  //         description: "",
  //         expiry,
  //       },
  //     });
  //   });

  //   it("Should fail to initialize escrow when escrow Id exceeds 32 bytes", async () => {
  //     let should_fail = "A".repeat(45);
  //     const expiry = new anchor.BN(Date.now() / 1000 + 3600);

  //     try {
  //       [escrowPda, escrowBump] = getEscrowAddress(
  //         should_fail,
  //         buyer.publicKey,
  //         seller.publicKey,
  //         program.programId
  //       );

  //       await program.methods
  //         .initEscrow(
  //           should_fail,
  //           ZERO_PUBKEY,
  //           depositAmount,
  //           TOKEN_A_PUBKEY,
  //           depositAmount,
  //           long_description,
  //           expiry
  //         )
  //         .accounts({
  //           buyer: buyer.publicKey,
  //           seller: seller.publicKey,
  //           escrow: escrowPda,
  //           systemProgram: anchor.web3.SystemProgram.programId,
  //         })
  //         .signers([buyer])
  //         .rpc({ commitment: "confirmed" });
  //     } catch (error) {
  //       assert.strictEqual(
  //         error.message,
  //         "Max seed length exceeded",
  //         "Expected 'Max seed length exceeded' error for topic longer than 32 bytes"
  //       );
  //       should_fail = "Failed";
  //     }
  //   });

  //   it("Should fail to initialize escrow when the expiry is less than the created time", async () => {
  //     const expiry = new anchor.BN(Date.now() / 1000 - 1000);

  //     const should_fail = "will_fail";
  //     try {
  //       [escrowPda, escrowBump] = getEscrowAddress(
  //         should_fail,
  //         buyer.publicKey,
  //         seller.publicKey,
  //         program.programId
  //       );
  //       await program.methods
  //         .initEscrow(
  //           should_fail,
  //           ZERO_PUBKEY,
  //           depositAmount,
  //           TOKEN_A_PUBKEY,
  //           depositAmount,
  //           long_description,
  //           expiry
  //         )
  //         .accounts({
  //           buyer: buyer.publicKey,
  //           seller: seller.publicKey,
  //           escrow: escrowPda,
  //           systemProgram: anchor.web3.SystemProgram.programId,
  //         })
  //         .signers([buyer])
  //         .rpc({ commitment: "confirmed" });
  //     } catch (error) {
  //       assert.strictEqual(error.error.errorMessage, "Invalid Expiry date");
  //     }
  //   });

  //   it("Should fail to initialize escrow when the buyer and seller addresses are the same", async () => {
  //     const same_address_fail = "sameoowneraddress";
  //     try {
  //       [escrowPda, escrowBump] = getEscrowAddress(
  //         same_address_fail,
  //         buyer.publicKey,
  //         buyer.publicKey,
  //         program.programId
  //       );
  //       await program.methods
  //         .initEscrow(
  //           same_address_fail,
  //           ZERO_PUBKEY,
  //           depositAmount,
  //           TOKEN_A_PUBKEY,
  //           depositAmount,
  //           long_description,
  //           expiry
  //         )
  //         .accounts({
  //           buyer: buyer.publicKey,
  //           seller: buyer.publicKey,
  //           escrow: escrowPda,
  //           systemProgram: anchor.web3.SystemProgram.programId,
  //         })
  //         .signers([buyer])
  //         .rpc({ commitment: "confirmed" });
  //     } catch (error) {
  //       assert.strictEqual(
  //         error.error.errorMessage,
  //         "Token to same buyer and seller is not allowed"
  //       );
  //     }
  //   });

  //   it("Should fail to initialize escrow when the deposit amount is zero", async () => {
  //     const invalid_deposit_amount = "invalid_deposit_amount";
  //     try {
  //       [escrowPda, escrowBump] = getEscrowAddress(
  //         invalid_deposit_amount,
  //         buyer.publicKey,
  //         seller.publicKey,
  //         program.programId
  //       );
  //       await program.methods
  //         .initEscrow(
  //           invalid_deposit_amount,
  //           ZERO_PUBKEY,
  //           new anchor.BN(0),
  //           TOKEN_A_PUBKEY,
  //           depositAmount,
  //           long_description,
  //           expiry
  //         )
  //         .accounts({
  //           buyer: buyer.publicKey,
  //           seller: seller.publicKey,
  //           escrow: escrowPda,
  //           systemProgram: anchor.web3.SystemProgram.programId,
  //         })
  //         .signers([buyer])
  //         .rpc({ commitment: "confirmed" });
  //     } catch (error) {
  //       assert.strictEqual(
  //         error.error.errorMessage,
  //         "Deposit amount cannot be less than zero"
  //       );
  //     }
  //   });

  //   it("Should fail to initialize escrow when the receive amount is zero", async () => {
  //     const invalid_receive_amount = "invalid_receive_amount";
  //     try {
  //       [escrowPda, escrowBump] = getEscrowAddress(
  //         invalid_receive_amount,
  //         buyer.publicKey,
  //         seller.publicKey,
  //         program.programId
  //       );
  //       await program.methods
  //         .initEscrow(
  //           invalid_receive_amount,
  //           ZERO_PUBKEY,
  //           depositAmount,
  //           TOKEN_A_PUBKEY,
  //           new anchor.BN(0),
  //           long_description,
  //           expiry
  //         )
  //         .accounts({
  //           buyer: buyer.publicKey,
  //           seller: seller.publicKey,
  //           escrow: escrowPda,
  //           systemProgram: anchor.web3.SystemProgram.programId,
  //         })
  //         .signers([buyer])
  //         .rpc({ commitment: "confirmed" });
  //     } catch (error) {
  //       assert.strictEqual(
  //         error.error.errorMessage,
  //         "Receive amount cannot be less than zero"
  //       );
  //     }
  //   });

  //   it("Should fail to initialize escrow when the tokenAddresses are the same", async () => {
  //     const invalid_receive_amount = "invalid_receive_amount";
  //     try {
  //       [escrowPda, escrowBump] = getEscrowAddress(
  //         invalid_receive_amount,
  //         buyer.publicKey,
  //         seller.publicKey,
  //         program.programId
  //       );
  //       await program.methods
  //         .initEscrow(
  //           invalid_receive_amount,
  //           TOKEN_A_PUBKEY,
  //           depositAmount,
  //           TOKEN_A_PUBKEY,
  //           depositAmount,
  //           long_description,
  //           expiry
  //         )
  //         .accounts({
  //           buyer: buyer.publicKey,
  //           seller: seller.publicKey,
  //           escrow: escrowPda,
  //           systemProgram: anchor.web3.SystemProgram.programId,
  //         })
  //         .signers([buyer])
  //         .rpc({ commitment: "confirmed" });
  //     } catch (error) {
  //       assert.strictEqual(
  //         error.error.errorMessage,
  //         "Token to the same token is not allowed"
  //       );
  //     }
  //   });
  // });

  describe("Accept Escrow", async () => {
    it("Should allow seller to successfully accept escrow", async () => {
      await airdrop(provider.connection, seller.publicKey);
      await airdrop(provider.connection, buyer.publicKey);

      const [escrowPda, escrowBump] = await InitializeEscrow({
        program,
        buyer,
        seller,
        escrowId: "accept_01",
        mint1: ZERO_PUBKEY,
        mint2: TOKEN_A_PUBKEY,
        dep_amount: depositAmount,
        rec_amount: depositAmount,
        expiry: new anchor.BN(Date.now() / 1000 + 3600),
      });

      await program.methods
        .acceptEscrow()
        .accounts({
          seller: seller.publicKey,
          escrow: escrowPda,
        })
        .signers([seller])
        .rpc();

      checkAcceptEscrow({
        program,
        escrowPda,
        seller,
      });
    });

    it("Should fail to accept if state is not valid", async () => {
      await airdrop(provider.connection, seller.publicKey);
      await airdrop(provider.connection, buyer.publicKey);
      try {
        const [escrowPda, escrowBump] = await InitializeEscrow({
          program,
          buyer,
          seller,
          escrowId: "fail_01",
          mint1: ZERO_PUBKEY,
          mint2: TOKEN_A_PUBKEY,
          dep_amount: depositAmount,
          rec_amount: depositAmount,
          expiry: new anchor.BN(Date.now() / 1000 + 3600),
        });

        await acceptEscrow({ program, seller, escrowPda });

        await acceptEscrow({ program, seller, escrowPda });

        checkAcceptEscrow({
          program,
          escrowPda,
          seller,
        });
      } catch (error) {
        assert.strictEqual(error.error.errorMessage, "Invalid State");
      }
    });

    it("Should fail if caller is not the seller", async () => {
      const tina = anchor.web3.Keypair.generate();
      await airdrop(provider.connection, tina.publicKey);
      await airdrop(provider.connection, buyer.publicKey);
      try {
        const [escrowPda, escrowBump] = await InitializeEscrow({
          program,
          buyer,
          seller,
          escrowId: "fail_02",
          mint1: ZERO_PUBKEY,
          mint2: TOKEN_A_PUBKEY,
          dep_amount: depositAmount,
          rec_amount: depositAmount,
          expiry: new anchor.BN(Date.now() / 1000 + 3600),
        });

        await acceptEscrow({ program, seller: tina, escrowPda });
      } catch (error) {
        assert.strictEqual(
          error.error.errorMessage,
          "A seeds constraint was violated"
        );
      }
    });

    it("Should fail if escrow as expired", async () => {
      await airdrop(provider.connection, seller.publicKey);
      await airdrop(provider.connection, buyer.publicKey);

      // expiry 5 seconds in the past

      try {
        const [escrowPda, escrowBump] = await InitializeEscrow({
          program,
          buyer,
          seller,
          escrowId: "fail_03",
          mint1: ZERO_PUBKEY,
          mint2: TOKEN_A_PUBKEY,
          dep_amount: depositAmount,
          rec_amount: depositAmount,
          expiry: new anchor.BN(Date.now() / 1000 + 3),
        });

        setTimeout(async () => {}, 2000);

        await acceptEscrow({ program, seller, escrowPda });
      } catch (error) {
        console.log({ error });
        assert.strictEqual(error.error.errorMessage, "Escrow Expired");
      }
    });
  });

  describe("Fund Escrow", async () => {
    let escrowPda_01: any,
      escrowPda_02: any,
      escrowBump_01: any,
      escrowBump_02: any;
    beforeEach(async () => {
      [escrowPda_01, escrowBump_01] = await InitializeEscrow({
        program,
        buyer,
        seller,
        escrowId: "pass_01",
        mint1: ZERO_PUBKEY,
        mint2: TOKEN_A_PUBKEY,
        dep_amount: depositAmount,
        rec_amount: depositAmount,
        expiry: new anchor.BN(Date.now() / 1000 + 3600),
      });

      await acceptEscrow({ program, seller, escrowPda: escrowPda_01 });

      [escrowPda_02, escrowBump_02] = await InitializeEscrow({
        program,
        buyer,
        seller,
        escrowId: "pass_02",
        mint1: ZERO_PUBKEY,
        mint2: TOKEN_A_PUBKEY,
        dep_amount: depositAmount,
        rec_amount: depositAmount,
        expiry: new anchor.BN(Date.now() / 1000 + 3600),
      });

      await acceptEscrow({ program, seller, escrowPda: escrowPda_02 });
    });

    it("should successfully allow the buyer to fund", async () => {
      await program.methods.fundEscrow().accounts({}).signers([buyer]).rpc();
    });
  });
});

async function InitializeEscrow({
  program,
  buyer,
  seller,
  escrowId,
  mint1,
  mint2,
  dep_amount,
  rec_amount,
  expiry,
}) {
  const [escrowPda, escrowBump] = getEscrowAddress(
    escrowId,
    buyer.publicKey,
    seller.publicKey,
    program.programId
  );
  await program.methods
    .initEscrow(
      escrowId,
      mint1,
      dep_amount,
      mint2,
      rec_amount,
      "random_des",
      expiry
    )
    .accounts({
      buyer: buyer.publicKey,
      seller: seller.publicKey,
      escrow: escrowPda,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([buyer])
    .rpc({ commitment: "confirmed" });

  return [escrowPda, escrowBump];
}

async function acceptEscrow({ program, seller, escrowPda }) {
  const tx = await program.methods
    .acceptEscrow()
    .accounts({
      seller: seller.publicKey,
      escrow: escrowPda,
    })
    .signers([seller])
    .rpc();
  return tx;
}

async function fundEscrow({
  program,
  buyer,
  mint,
  buyerATA,
  escrowPda,
  escrowATA,
}) {
  const tx = await program.methods
    .fundEscrow()
    .accounts({
      buyer: buyer.publicKey,
      mint,
      buyerAta: buyerATA,
      escrow: escrowPda,
      escrowAta: escrowATA,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .signers([buyer])
    .rpc();

  return tx;
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

async function checkEscrow({
  program,
  escrowPda,
  escrow_author,
  expected: {
    bump,
    buyer,
    seller,
    escrow_id,
    depositMint,
    depositAmount,
    receiveMint,
    receiveAmount,
    description,
    expiry,
  },
}) {
  let escrow = await program.account.escrow.fetch(escrowPda);

  // // Basic Asserts
  expect(escrow.bump).to.equal(bump);
  expect(escrow.buyer.toString()).to.equal(buyer.toString());
  expect(escrow.seller.toString()).to.equal(seller.toString());
  expect(escrow.escrowId).to.equal(escrow_id);

  // Mint Asserts
  expect(escrow.depositMint.toString()).to.equal(
    depositMint.toString(),
    "Deposit mint mismatch"
  );

  console.log({ receiveMint });
  expect(escrow.receiveMint.toString()).to.equal(
    receiveMint.toString(),
    "Receive mint mismatch"
  );

  // Amount Asserts
  expect(escrow.depositAmount.toNumber()).to.equal(
    depositAmount.toNumber(),
    "Deposit amount mismatch"
  );

  expect(escrow.receiveAmount.toNumber()).to.equal(
    receiveAmount.toNumber(),
    "Receive amount mismatch"
  );

  // Description
  expect(escrow.description).to.equal(description);

  // State
  expect(escrow.state).to.deep.equal({ pending: {} });
  expect(escrow.requestedRelease).to.be.false;

  // Time stamp
  const now = Math.floor(Date.now() / 1000);
  expect(escrow.createdAt.toNumber()).to.be.lessThanOrEqual(now);
  expect(escrow.expiry.toNumber()).to.equal(expiry.toNumber());
}

async function checkAcceptEscrow({ program, escrowPda, seller }) {
  let escrow = await program.account.escrow.fetch(escrowPda);
  expect(escrow.state).to.deep.equal({ active: {} });
}

async function airdrop(connection: any, address: any, amount = 1000000000) {
  await connection.confirmTransaction(
    await connection.requestAirdrop(address, amount),
    "confirmed"
  );
}

async function getEscrowATA(connection: any, account: any, mint: any) {
  return await getAssociatedTokenAddress(
    mint,
    account,
    true,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
}

async function mintTokens(
  connection: any,
  account: any,
  amount = 1000000000000
) {
  // Create mint
  const mint = await createMint(
    connection,
    account,
    account.publicKey,
    null,
    6,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  // buyer ATA
  const buyerAta = await getOrCreateAssociatedTokenAccount(
    connection,
    account,
    mint,
    account.publicKey,
    false,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // Mint to buyer
  await mintTo(
    connection,
    account,
    mint,
    buyerAta.address,
    account.publicKey,
    1000000000,
    [],
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  return { mint, ata: buyerAta };
}
