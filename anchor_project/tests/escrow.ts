import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Escrow } from "../target/types/escrow";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { assert, expect } from "chai";
import {
  Account,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getAccount,
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
  const tokenAmount = new anchor.BN(1 * LAMPORTS_PER_SOL);
  const description_1 = "desctipion 1";
  const long_escrow_id = "A".repeat(32);
  const long_description = "D".repeat(128);
  const expiry = new anchor.BN(Date.now() / 1000 + 3600);

  const TOKEN_A_PUBKEY = new anchor.web3.PublicKey(Array(32).fill(1));

  // describe("Initialize Escrow", () => {
  //   it("Should successfully initialize a escrow with a valid id and description", async () => {
  //     let escrowId = "escrowId";
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

  // describe("Accept Escrow", () => {
  //   it("Should allow seller to successfully accept escrow", async () => {
  //     await airdrop(provider.connection, seller.publicKey);
  //     await airdrop(provider.connection, buyer.publicKey);

  //     const [escrowPda, escrowBump] = await InitializeEscrow({
  //       program,
  //       buyer,
  //       seller,
  //       escrowId: "accept_01",
  //       mint1: ZERO_PUBKEY,
  //       mint2: TOKEN_A_PUBKEY,
  //       dep_amount: depositAmount,
  //       rec_amount: depositAmount,
  //       expiry: new anchor.BN(Date.now() / 1000 + 3600),
  //     });

  //     await program.methods
  //       .acceptEscrow()
  //       .accounts({
  //         seller: seller.publicKey,
  //         escrow: escrowPda,
  //       })
  //       .signers([seller])
  //       .rpc();

  //     checkAcceptEscrow({
  //       program,
  //       escrowPda,
  //       seller,
  //     });
  //   });

  //   it("Should fail to accept if state is not valid", async () => {
  //     await airdrop(provider.connection, seller.publicKey);
  //     await airdrop(provider.connection, buyer.publicKey);
  //     try {
  //       const [escrowPda, escrowBump] = await InitializeEscrow({
  //         program,
  //         buyer,
  //         seller,
  //         escrowId: "fail_01",
  //         mint1: ZERO_PUBKEY,
  //         mint2: TOKEN_A_PUBKEY,
  //         dep_amount: depositAmount,
  //         rec_amount: depositAmount,
  //         expiry: new anchor.BN(Date.now() / 1000 + 3600),
  //       });

  //       await acceptEscrow({ program, seller, escrowPda });

  //       await acceptEscrow({ program, seller, escrowPda });

  //       checkAcceptEscrow({
  //         program,
  //         escrowPda,
  //         seller,
  //       });
  //     } catch (error) {
  //       assert.strictEqual(error.error.errorMessage, "Invalid State");
  //     }
  //   });

  //   it("Should fail if caller is not the seller", async () => {
  //     const tina = anchor.web3.Keypair.generate();
  //     await airdrop(provider.connection, tina.publicKey);
  //     await airdrop(provider.connection, buyer.publicKey);
  //     try {
  //       const [escrowPda, escrowBump] = await InitializeEscrow({
  //         program,
  //         buyer,
  //         seller,
  //         escrowId: "fail_02",
  //         mint1: ZERO_PUBKEY,
  //         mint2: TOKEN_A_PUBKEY,
  //         dep_amount: depositAmount,
  //         rec_amount: depositAmount,
  //         expiry: new anchor.BN(Date.now() / 1000 + 3600),
  //       });

  //       await acceptEscrow({ program, seller: tina, escrowPda });
  //     } catch (error) {
  //       assert.strictEqual(
  //         error.error.errorMessage,
  //         "A seeds constraint was violated"
  //       );
  //     }
  //   });

  //   it("Should fail if escrow as expired", async () => {
  //     await airdrop(provider.connection, seller.publicKey);
  //     await airdrop(provider.connection, buyer.publicKey);

  //     // expiry 5 seconds in the past

  //     try {
  //       const [escrowPda, escrowBump] = await InitializeEscrow({
  //         program,
  //         buyer,
  //         seller,
  //         escrowId: "fail_03",
  //         mint1: ZERO_PUBKEY,
  //         mint2: TOKEN_A_PUBKEY,
  //         dep_amount: depositAmount,
  //         rec_amount: depositAmount,
  //         expiry: new anchor.BN(Date.now() / 1000 + 3),
  //       });

  //       setTimeout(async () => {}, 2000);

  //       await acceptEscrow({ program, seller, escrowPda });
  //     } catch (error) {
  //       console.log({ error });
  //       assert.strictEqual(error.error.errorMessage, "Escrow Expired");
  //     }
  //   });
  // });

  // describe("Fund Escrow", () => {
  //   let escrowPda_01: any,
  //     escrowPda_02: any,
  //     escrowBump_01: any,
  //     escrowBump_02: any,
  //     mint: PublicKey,
  //     buyerATA: Account;

  //   beforeEach(async () => {
  //     // fund the buyer account with sol
  //     await airdrop(provider.connection, buyer.publicKey, 3 * 1000000000);

  //     // Create mint and mint tokens
  //     const minted = await mintTokens(provider.connection, buyer);
  //     mint = minted.mint;
  //     buyerATA = minted.ata;
  //   });

  //   it("should successfully allow the buyer to fund With SOl", async () => {
  //     [escrowPda_01, escrowBump_01] = await InitializeEscrow({
  //       program,
  //       buyer,
  //       seller,
  //       escrowId: "pass_01",
  //       mint1: ZERO_PUBKEY, //SOL
  //       mint2: mint, // TEST TOKEN
  //       dep_amount: depositAmount,
  //       rec_amount: depositAmount,
  //       expiry: new anchor.BN(Date.now() / 1000 + 3600),
  //     });

  //     await acceptEscrow({ program, seller, escrowPda: escrowPda_01 });

  //     const escrowAta = await getEscrowATA(
  //       provider.connection,
  //       escrowPda_01,
  //       mint
  //     );

  //     await fundEscrow({
  //       program,
  //       buyer,
  //       mint,
  //       buyerATA,
  //       escrowPda: escrowPda_01,
  //       escrowATA: escrowAta,
  //     });

  //     await checkFundEscrow({
  //       program,
  //       provider,
  //       escrowPda: escrowPda_01,
  //       escrowAta: escrowAta,
  //       dep_type: "SOL",
  //     });
  //   });

  //   it("Should successfully allow the buyer to fund with Mint", async () => {
  //     [escrowPda_02, escrowBump_02] = await InitializeEscrow({
  //       program,
  //       buyer,
  //       seller,
  //       escrowId: "pass_02",
  //       mint1: mint, // TESTTOKEN
  //       mint2: ZERO_PUBKEY, // SOL
  //       dep_amount: depositAmount,
  //       rec_amount: depositAmount,
  //       expiry: new anchor.BN(Date.now() / 1000 + 3600),
  //     });

  //     await acceptEscrow({ program, seller, escrowPda: escrowPda_02 });
  //     const escrowAta = await getEscrowATA(
  //       provider.connection,
  //       escrowPda_02,
  //       mint
  //     );

  //     await fundEscrow({
  //       program,
  //       buyer,
  //       mint,
  //       buyerATA,
  //       escrowPda: escrowPda_02,
  //       escrowATA: escrowAta,
  //     });

  //     await checkFundEscrow({
  //       program,
  //       provider,
  //       escrowPda: escrowPda_02,
  //       escrowAta: escrowAta,
  //       dep_type: "MINT",
  //     });
  //   });

  //   it("Should fail the buyer does not have sufficient balance to fund with SOL", async () => {
  //     const newdepositAmount = new anchor.BN(5 * LAMPORTS_PER_SOL);
  //     [escrowPda_02, escrowBump_02] = await InitializeEscrow({
  //       program,
  //       buyer,
  //       seller,
  //       escrowId: "fail_033",
  //       mint1: ZERO_PUBKEY,
  //       mint2: mint,
  //       dep_amount: newdepositAmount,
  //       rec_amount: depositAmount,
  //       expiry: new anchor.BN(Date.now() / 1000 + 3600),
  //     });

  //     await acceptEscrow({ program, seller, escrowPda: escrowPda_02 });
  //     const escrowAta = await getEscrowATA(
  //       provider.connection,
  //       escrowPda_02,
  //       mint
  //     );

  //     try {
  //       await fundEscrow({
  //         program,
  //         buyer,
  //         mint,
  //         buyerATA,
  //         escrowPda: escrowPda_02,
  //         escrowATA: escrowAta,
  //       });

  //       await checkFundEscrow({
  //         program,
  //         provider,
  //         escrowPda: escrowPda_02,
  //         escrowAta: escrowAta,
  //         dep_type: "MINT",
  //       });
  //     } catch (error) {
  //       assert.strictEqual(error.error.errorMessage, "Insufficient Balance");
  //     }
  //   });

  //   it("Should fail the buyer does not have sufficient balance to fund with Mint", async () => {
  //     const newdepositAmount = new anchor.BN(5000000000000);
  //     [escrowPda_02, escrowBump_02] = await InitializeEscrow({
  //       program,
  //       buyer,
  //       seller,
  //       escrowId: "fail_04",
  //       mint1: mint,
  //       mint2: ZERO_PUBKEY,
  //       dep_amount: newdepositAmount,
  //       rec_amount: depositAmount,
  //       expiry: new anchor.BN(Date.now() / 1000 + 3600),
  //     });

  //     await acceptEscrow({ program, seller, escrowPda: escrowPda_02 });
  //     const escrowAta = await getEscrowATA(
  //       provider.connection,
  //       escrowPda_02,
  //       mint
  //     );

  //     try {
  //       await fundEscrow({
  //         program,
  //         buyer,
  //         mint,
  //         buyerATA,
  //         escrowPda: escrowPda_02,
  //         escrowATA: escrowAta,
  //       });

  //       await checkFundEscrow({
  //         program,
  //         provider,
  //         escrowPda: escrowPda_02,
  //         escrowAta: escrowAta,
  //         dep_type: "MINT",
  //       });
  //     } catch (error) {
  //       assert.strictEqual(error.error.errorMessage, "Insufficient Balance");
  //     }
  //   });

  //   it("Should fail when escrow has expired", async () => {
  //     [escrowPda_02, escrowBump_02] = await InitializeEscrow({
  //       program,
  //       buyer,
  //       seller,
  //       escrowId: "fail_05",
  //       mint1: mint,
  //       mint2: ZERO_PUBKEY,
  //       dep_amount: depositAmount,
  //       rec_amount: depositAmount,
  //       expiry: new anchor.BN(Date.now() / 1000 + 3600),
  //     });

  //     await acceptEscrow({ program, seller, escrowPda: escrowPda_02 });
  //     const escrowAta = await getEscrowATA(
  //       provider.connection,
  //       escrowPda_02,
  //       mint
  //     );

  //     setTimeout(async () => {
  //       try {
  //         await fundEscrow({
  //           program,
  //           buyer,
  //           mint,
  //           buyerATA,
  //           escrowPda: escrowPda_02,
  //           escrowATA: escrowAta,
  //         });

  //         await checkFundEscrow({
  //           program,
  //           provider,
  //           escrowPda: escrowPda_02,
  //           escrowAta: escrowAta,
  //           dep_type: "MINT",
  //         });
  //       } catch (error) {
  //         assert.strictEqual(error.error.errorMessage, "Escrow Expired");
  //       }
  //     }, 5000);
  //   });

  //   it("Should fail if the escrow is not already active", async () => {
  //     [escrowPda_02, escrowBump_02] = await InitializeEscrow({
  //       program,
  //       buyer,
  //       seller,
  //       escrowId: "fail_06",
  //       mint1: mint,
  //       mint2: ZERO_PUBKEY,
  //       dep_amount: depositAmount,
  //       rec_amount: depositAmount,
  //       expiry: new anchor.BN(Date.now() / 1000 + 3600),
  //     });

  //     const escrowAta = await getEscrowATA(
  //       provider.connection,
  //       escrowPda_02,
  //       mint
  //     );

  //     try {
  //       await fundEscrow({
  //         program,
  //         buyer,
  //         mint,
  //         buyerATA,
  //         escrowPda: escrowPda_02,
  //         escrowATA: escrowAta,
  //       });

  //       await checkFundEscrow({
  //         program,
  //         provider,
  //         escrowPda: escrowPda_02,
  //         escrowAta: escrowAta,
  //         dep_type: "MINT",
  //       });
  //     } catch (error) {
  //       assert.strictEqual(
  //         error.error.errorMessage,
  //         "Escrow is not Active. Seller must accept before funding."
  //       );
  //     }
  //   });
  // });

  // describe("Send Asset", () => {
  //   let escrowPda_01: any,
  //     escrowBump_01: any,
  //     mint_01: PublicKey,
  //     mint_02: PublicKey,
  //     buyerATA_01: Account,
  //     sellerATA_01: Account,
  //     buyerATA_02: Account,
  //     sellerATA_02: Account;

  //   it("Should successfully allow the seller to send in Sol as asset", async () => {
  //     // fund the buyer account with sol
  //     await airdrop(provider.connection, buyer.publicKey, 3 * 1000000000);

  //     // fund the seller account with sol
  //     await airdrop(provider.connection, seller.publicKey, 3 * 1000000000);

  //     const minted01 = await mintTokens(provider.connection, buyer, seller);
  //     mint_01 = minted01.mint;
  //     buyerATA_01 = minted01.ata;
  //     sellerATA_01 = minted01.ata2;
  //     const escrowId = "send_01";

  //     [escrowPda_01, escrowBump_01] = await InitializeEscrow({
  //       program,
  //       buyer,
  //       seller,
  //       escrowId,
  //       mint1: mint_01,
  //       mint2: ZERO_PUBKEY, // SOL
  //       dep_amount: depositAmount,
  //       rec_amount: depositAmount,
  //       expiry: new anchor.BN(Date.now() / 1000 + 3600),
  //     });

  //     await acceptEscrow({ program, seller, escrowPda: escrowPda_01 });
  //     const escrowAta = await getEscrowATA(
  //       provider.connection,
  //       escrowPda_01,
  //       mint_01
  //     );

  //     await fundEscrow({
  //       program,
  //       buyer,
  //       mint: mint_01,
  //       buyerATA: buyerATA_01,
  //       escrowPda: escrowPda_01,
  //       escrowATA: escrowAta,
  //     });

  //     await checkFundEscrow({
  //       program,
  //       provider,
  //       escrowPda: escrowPda_01,
  //       escrowAta: escrowAta,
  //       dep_type: "MINT",
  //     });

  //     await sendAsset({
  //       program,
  //       seller,
  //       mint: mint_01,
  //       sellerATA: sellerATA_01,
  //       escrowPda: escrowPda_01,
  //       escrowATA: escrowAta,
  //     });

  //     // send asset
  //     await checkSendAsset({
  //       program,
  //       provider,
  //       escrowPda: escrowPda_01,
  //       escrowAta: escrowAta,
  //       rec_type: "SOL",
  //       mint,
  //     });
  //   });

  //   it("Should successfully allow the seller to send in Mint as asset", async () => {
  //     // fund the buyer account with sol
  //     await airdrop(provider.connection, buyer.publicKey, 3 * 1000000000);

  //     // fund the seller account with sol
  //     await airdrop(provider.connection, seller.publicKey, 3 * 1000000000);
  //     const escrowId = "send_02";
  //     const minted02 = await mintTokens(provider.connection, seller, buyer);
  //     mint_02 = minted02.mint;
  //     sellerATA_01 = minted02.ata;
  //     buyerATA_01 = minted02.ata2;

  //     [escrowPda_01, escrowBump_01] = await InitializeEscrow({
  //       program,
  //       buyer,
  //       seller,
  //       escrowId,
  //       mint2: mint_02,
  //       mint1: ZERO_PUBKEY, // SOL
  //       dep_amount: depositAmount,
  //       rec_amount: depositAmount,
  //       expiry: new anchor.BN(Date.now() / 1000 + 3600),
  //     });

  //     await acceptEscrow({ program, seller, escrowPda: escrowPda_01 });
  //     const escrowAta = await getEscrowATA(
  //       provider.connection,
  //       escrowPda_01,
  //       mint_02
  //     );

  //     await fundEscrow({
  //       program,
  //       buyer,
  //       mint: mint_02,
  //       buyerATA: buyerATA_02,
  //       escrowPda: escrowPda_01,
  //       escrowATA: escrowAta,
  //     });

  //     await checkFundEscrow({
  //       program,
  //       provider,
  //       escrowPda: escrowPda_01,
  //       escrowAta: escrowAta,
  //       dep_type: "SOL",
  //     });

  //     // send asset
  //     await sendAsset({
  //       program,
  //       seller,
  //       mint: mint_02,
  //       sellerATA: sellerATA_02,
  //       escrowPda: escrowPda_01,
  //       escrowATA: escrowAta,
  //     });

  //     await checkSendAsset({
  //       program,
  //       provider,
  //       escrowPda: escrowPda_01,
  //       escrowAta: escrowAta,
  //       rec_type: "MINT",
  //       mint: mint_02,
  //     });
  //   });

  //   it("Should fail if the seller does not have sufficient SOL to fund with", async () => {
  //     // fund the buyer account with sol
  //     await airdrop(provider.connection, buyer.publicKey, 3 * 1000000000);

  //     // fund the seller account with sol
  //     await airdrop(provider.connection, seller.publicKey, 300000000);

  //     const minted01 = await mintTokens(provider.connection, buyer, seller);
  //     mint_01 = minted01.mint;
  //     buyerATA_01 = minted01.ata;
  //     sellerATA_01 = minted01.ata2;
  //     const escrowId = "send_03";

  //     [escrowPda_01, escrowBump_01] = await InitializeEscrow({
  //       program,
  //       buyer,
  //       seller,
  //       escrowId,
  //       mint1: mint_01,
  //       mint2: ZERO_PUBKEY, // SOL
  //       dep_amount: depositAmount,
  //       rec_amount: depositAmount,
  //       expiry: new anchor.BN(Date.now() / 1000 + 3600),
  //     });

  //     await acceptEscrow({ program, seller, escrowPda: escrowPda_01 });
  //     const escrowAta = await getEscrowATA(
  //       provider.connection,
  //       escrowPda_01,
  //       mint_01
  //     );

  //     await fundEscrow({
  //       program,
  //       buyer,
  //       mint: mint_01,
  //       buyerATA: buyerATA_01,
  //       escrowPda: escrowPda_01,
  //       escrowATA: escrowAta,
  //     });

  //     await checkFundEscrow({
  //       program,
  //       provider,
  //       escrowPda: escrowPda_01,
  //       escrowAta: escrowAta,
  //       dep_type: "MINT",
  //     });

  //     try {
  //       // send asset
  //       await sendAsset({
  //         program,
  //         seller,
  //         mint: mint_01,
  //         sellerATA: sellerATA_01,
  //         escrowPda: escrowPda_01,
  //         escrowATA: escrowAta,
  //       });
  //     } catch (error) {
  //       assert.strictEqual(error.error.errorMessage, "Insufficient Balance");
  //     }
  //   });

  //   it("Should fail if the seller does not have sufficient Mint to fund with", async () => {
  //     // fund the buyer account with sol
  //     await airdrop(provider.connection, buyer.publicKey, 5 * 1000000000);

  //     // fund the seller account with sol
  //     await airdrop(provider.connection, seller.publicKey, 3 * 1000000000);
  //     const escrowId = "send_04";
  //     const minted02 = await mintTokens(
  //       provider.connection,
  //       seller,
  //       buyer,
  //       100000
  //     );
  //     mint_02 = minted02.mint;
  //     sellerATA_01 = minted02.ata;
  //     buyerATA_01 = minted02.ata2;

  //     [escrowPda_01, escrowBump_01] = await InitializeEscrow({
  //       program,
  //       buyer,
  //       seller,
  //       escrowId,
  //       mint2: mint_02,
  //       mint1: ZERO_PUBKEY, // SOL
  //       dep_amount: depositAmount,
  //       rec_amount: depositAmount,
  //       expiry: new anchor.BN(Date.now() / 1000 + 3600),
  //     });

  //     await acceptEscrow({ program, seller, escrowPda: escrowPda_01 });
  //     const escrowAta = await getEscrowATA(
  //       provider.connection,
  //       escrowPda_01,
  //       mint_02
  //     );

  //     await fundEscrow({
  //       program,
  //       buyer,
  //       mint: mint_02,
  //       buyerATA: buyerATA_02,
  //       escrowPda: escrowPda_01,
  //       escrowATA: escrowAta,
  //     });

  //     await checkFundEscrow({
  //       program,
  //       provider,
  //       escrowPda: escrowPda_01,
  //       escrowAta: escrowAta,
  //       dep_type: "SOL",
  //     });

  //     // send asset
  //     try {
  //       await sendAsset({
  //         program,
  //         seller,
  //         mint: mint_02,
  //         sellerATA: sellerATA_02,
  //         escrowPda: escrowPda_01,
  //         escrowATA: escrowAta,
  //       });
  //     } catch (error) {
  //       assert.strictEqual(error.error.errorMessage, "Insufficient Balance");
  //     }
  //   });

  //   it("Should fail if the escrow has not been funded by buyer", async () => {
  //     // fund the buyer account with sol
  //     await airdrop(provider.connection, buyer.publicKey, 3 * 1000000000);

  //     // fund the seller account with sol
  //     await airdrop(provider.connection, seller.publicKey, 300000000);

  //     const minted01 = await mintTokens(provider.connection, buyer, seller);
  //     mint_01 = minted01.mint;
  //     buyerATA_01 = minted01.ata;
  //     sellerATA_01 = minted01.ata2;
  //     const escrowId = "send_06";

  //     [escrowPda_01, escrowBump_01] = await InitializeEscrow({
  //       program,
  //       buyer,
  //       seller,
  //       escrowId,
  //       mint1: mint_01,
  //       mint2: ZERO_PUBKEY, // SOL
  //       dep_amount: depositAmount,
  //       rec_amount: depositAmount,
  //       expiry: new anchor.BN(Date.now() / 1000 + 3600),
  //     });

  //     await acceptEscrow({ program, seller, escrowPda: escrowPda_01 });
  //     const escrowAta = await getEscrowATA(
  //       provider.connection,
  //       escrowPda_01,
  //       mint_01
  //     );

  //     try {
  //       // send asset
  //       await sendAsset({
  //         program,
  //         seller,
  //         mint: mint_01,
  //         sellerATA: sellerATA_01,
  //         escrowPda: escrowPda_01,
  //         escrowATA: escrowAta,
  //       });
  //     } catch (error) {
  //       assert.strictEqual(error.error.errorMessage, "Escrow Not Funded");
  //     }
  //   });
  // });

  describe("Confirm Asset", () => {
    let escrowPda_01: any,
      escrowBump_01: any,
      mint_01: PublicKey,
      mint_02: PublicKey,
      buyerATA_01: PublicKey,
      sellerATA_01: PublicKey,
      buyerATA_02: Account,
      sellerATA_02: Account;

    it("Should allow the buyer to successfully confirm the asset SOL-MINT", async () => {
      // fund the buyer account with sol
      await airdrop(provider.connection, buyer.publicKey, 3 * 1000000000);

      // fund the seller account with sol
      await airdrop(provider.connection, seller.publicKey, 3 * 1000000000);

      const minted01 = await mintTokens(provider.connection, seller, buyer);
      mint_01 = minted01.mint;
      buyerATA_01 = await getAssociatedTokenAddress(
        mint_01,
        buyer.publicKey,
        true,
        TOKEN_2022_PROGRAM_ID
      );

      sellerATA_01 = await getAssociatedTokenAddress(
        mint_01,
        seller.publicKey,
        true,
        TOKEN_2022_PROGRAM_ID
      );
      const escrowId = "confirm_01";

      [escrowPda_01, escrowBump_01] = await InitializeEscrow({
        program,
        buyer,
        seller,
        escrowId,
        mint1: ZERO_PUBKEY,
        mint2: mint_01, // SOL
        dep_amount: depositAmount,
        rec_amount: depositAmount,
        expiry: new anchor.BN(Date.now() / 1000 + 3600),
      });

      await acceptEscrow({ program, seller, escrowPda: escrowPda_01 });
      const escrowAta = await getEscrowATA(
        provider.connection,
        escrowPda_01,
        mint_01
      );

      await fundEscrow({
        program,
        buyer,
        mint: mint_01,
        buyerATA: buyerATA_01,
        escrowPda: escrowPda_01,
        escrowATA: escrowAta,
      });

      await checkFundEscrow({
        program,
        provider,
        escrowPda: escrowPda_01,
        escrowAta: escrowAta,
        dep_type: "SOL",
      });

      // send asset
      await sendAsset({
        program,
        seller,
        mint: mint_01,
        sellerATA: sellerATA_01,
        escrowPda: escrowPda_01,
        escrowATA: escrowAta,
      });

      // Check Send Asset
      await checkSendAsset({
        program,
        provider,
        escrowPda: escrowPda_01,
        escrowAta: escrowAta,
        rec_type: "MINT",
        mint: mint_01,
      });

      const accounts = {
        buyer: buyer.publicKey,
        seller: seller.publicKey,
        escrow: escrowPda_01,

        depositMint: null,
        receiveMint: mint_01,

        escrowDepositAta: null,
        escrowReceiveAta: escrowAta,

        buyerReceiveAta: buyerATA_01,
        sellerReceiveAta: null,

        // sellerReceiveAta: await getAssociatedTokenAddress(
        //   ZERO_PUBKEY,
        //   seller.publicKey,
        //   true,
        //   TOKEN_2022_PROGRAM_ID
        // ),

        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      };

      await program.methods
        .confirmAsset()
        .accounts(accounts)
        .signers([buyer])
        .rpc();

      await checkConfirmAsset({
        program,
        provider,
        escrowPda: escrowPda_01,
        escrowAta,
        dep_type: "SOL",
        rec_type: "MINT",
        mint: mint_01,
        buyer_ata: buyerATA_01,
        seller_ata: sellerATA_01,
        buyer,
        seller,
      });
    });

    it("Should allow the buyer to successfully confirm the asset MINT-SOL", async () => {
      // fund the buyer account with sol
      await airdrop(provider.connection, buyer.publicKey, 3 * 1000000000);

      // fund the seller account with sol
      await airdrop(provider.connection, seller.publicKey, 3 * 1000000000);

      const minted01 = await mintTokens(provider.connection, buyer, seller);
      mint_01 = minted01.mint;
      buyerATA_01 = await getAssociatedTokenAddress(
        mint_01,
        buyer.publicKey,
        true,
        TOKEN_2022_PROGRAM_ID
      );

      sellerATA_01 = await getAssociatedTokenAddress(
        mint_01,
        seller.publicKey,
        true,
        TOKEN_2022_PROGRAM_ID
      );
      const escrowId = "confirm_02";

      [escrowPda_01, escrowBump_01] = await InitializeEscrow({
        program,
        buyer,
        seller,
        escrowId,
        mint1: mint_01,
        mint2: ZERO_PUBKEY, // SOL
        dep_amount: depositAmount,
        rec_amount: depositAmount,
        expiry: new anchor.BN(Date.now() / 1000 + 3600),
      });

      await acceptEscrow({ program, seller, escrowPda: escrowPda_01 });
      const escrowAta = await getEscrowATA(
        provider.connection,
        escrowPda_01,
        mint_01
      );

      await fundEscrow({
        program,
        buyer,
        mint: mint_01,
        buyerATA: buyerATA_01,
        escrowPda: escrowPda_01,
        escrowATA: escrowAta,
      });

      await checkFundEscrow({
        program,
        provider,
        escrowPda: escrowPda_01,
        escrowAta: escrowAta,
        dep_type: "MINT",
      });

      // send asset

      await sendAsset({
        program,
        seller,
        mint: mint_01,
        sellerATA: sellerATA_01,
        escrowPda: escrowPda_01,
        escrowATA: escrowAta,
      });

      // Check Send Asset
      await checkSendAsset({
        program,
        provider,
        escrowPda: escrowPda_01,
        escrowAta: escrowAta,
        rec_type: "SOL",
        mint: mint_01,
      });

      const accounts = {
        buyer: buyer.publicKey,
        seller: seller.publicKey,
        escrow: escrowPda_01,

        depositMint: mint_01,
        receiveMint: null,

        escrowDepositAta: escrowAta,
        escrowReceiveAta: null,

        buyerReceiveAta: null,
        sellerReceiveAta: sellerATA_01,

        // sellerReceiveAta: await getAssociatedTokenAddress(
        //   ZERO_PUBKEY,
        //   seller.publicKey,
        //   true,
        //   TOKEN_2022_PROGRAM_ID
        // ),

        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      };

      await program.methods
        .confirmAsset()
        .accounts(accounts)
        .signers([buyer])
        .rpc();

      await checkConfirmAsset({
        program,
        provider,
        escrowPda: escrowPda_01,
        escrowAta,
        dep_type: "MINT",
        rec_type: "SOL",
        mint: mint_01,
        buyer_ata: buyerATA_01,
        seller_ata: sellerATA_01,
        buyer,
        seller,
      });
    });

    it("Should fail if excrow has expired", async () => {
      // fund the buyer account with sol
      await airdrop(provider.connection, buyer.publicKey, 3 * 1000000000);

      // fund the seller account with sol
      await airdrop(provider.connection, seller.publicKey, 3 * 1000000000);

      const minted01 = await mintTokens(provider.connection, seller, buyer);
      mint_01 = minted01.mint;
      buyerATA_01 = await getAssociatedTokenAddress(
        mint_01,
        buyer.publicKey,
        true,
        TOKEN_2022_PROGRAM_ID
      );

      sellerATA_01 = await getAssociatedTokenAddress(
        mint_01,
        seller.publicKey,
        true,
        TOKEN_2022_PROGRAM_ID
      );
      const escrowId = "confirm_03";

      [escrowPda_01, escrowBump_01] = await InitializeEscrow({
        program,
        buyer,
        seller,
        escrowId,
        mint1: ZERO_PUBKEY,
        mint2: mint_01, // SOL
        dep_amount: depositAmount,
        rec_amount: depositAmount,
        expiry: new anchor.BN(Date.now() / 1000 + 3600),
      });

      await acceptEscrow({ program, seller, escrowPda: escrowPda_01 });
      const escrowAta = await getEscrowATA(
        provider.connection,
        escrowPda_01,
        mint_01
      );

      await fundEscrow({
        program,
        buyer,
        mint: mint_01,
        buyerATA: buyerATA_01,
        escrowPda: escrowPda_01,
        escrowATA: escrowAta,
      });

      await checkFundEscrow({
        program,
        provider,
        escrowPda: escrowPda_01,
        escrowAta: escrowAta,
        dep_type: "SOL",
      });

      // send asset
      await sendAsset({
        program,
        seller,
        mint: mint_01,
        sellerATA: sellerATA_01,
        escrowPda: escrowPda_01,
        escrowATA: escrowAta,
      });

      // Check Send Asset
      await checkSendAsset({
        program,
        provider,
        escrowPda: escrowPda_01,
        escrowAta: escrowAta,
        rec_type: "MINT",
        mint: mint_01,
      });

      const accounts = {
        buyer: buyer.publicKey,
        seller: seller.publicKey,
        escrow: escrowPda_01,

        depositMint: null,
        receiveMint: mint_01,

        escrowDepositAta: null,
        escrowReceiveAta: escrowAta,

        buyerReceiveAta: buyerATA_01,
        sellerReceiveAta: null,

        // sellerReceiveAta: await getAssociatedTokenAddress(
        //   ZERO_PUBKEY,
        //   seller.publicKey,
        //   true,
        //   TOKEN_2022_PROGRAM_ID
        // ),

        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      };

      setTimeout(async () => {
        try {
          await program.methods
            .confirmAsset()
            .accounts(accounts)
            .signers([buyer])
            .rpc();
        } catch (error) {
          assert.strictEqual(error.error.errorMessage, "Escrow Expired");
        }
      }, 6000);
    });

    it("Should fail if state is not valid", async () => {
      // fund the buyer account with sol
      await airdrop(provider.connection, buyer.publicKey, 5 * 1000000000);

      // fund the seller account with sol
      await airdrop(provider.connection, seller.publicKey, 3 * 1000000000);

      const minted01 = await mintTokens(provider.connection, seller, buyer);
      mint_01 = minted01.mint;
      buyerATA_01 = await getAssociatedTokenAddress(
        mint_01,
        buyer.publicKey,
        true,
        TOKEN_2022_PROGRAM_ID
      );

      sellerATA_01 = await getAssociatedTokenAddress(
        mint_01,
        seller.publicKey,
        true,
        TOKEN_2022_PROGRAM_ID
      );
      const escrowId = "confirm_05";

      [escrowPda_01, escrowBump_01] = await InitializeEscrow({
        program,
        buyer,
        seller,
        escrowId,
        mint1: ZERO_PUBKEY,
        mint2: mint_01, // SOL
        dep_amount: depositAmount,
        rec_amount: depositAmount,
        expiry: new anchor.BN(Date.now() / 1000 + 3600),
      });

      await acceptEscrow({ program, seller, escrowPda: escrowPda_01 });
      const escrowAta = await getEscrowATA(
        provider.connection,
        escrowPda_01,
        mint_01
      );

      await fundEscrow({
        program,
        buyer,
        mint: mint_01,
        buyerATA: buyerATA_01,
        escrowPda: escrowPda_01,
        escrowATA: escrowAta,
      });

      const accounts = {
        buyer: buyer.publicKey,
        seller: seller.publicKey,
        escrow: escrowPda_01,

        depositMint: null,
        receiveMint: mint_01,

        escrowDepositAta: null,
        escrowReceiveAta: escrowAta,

        buyerReceiveAta: buyerATA_01,
        sellerReceiveAta: null,

        // sellerReceiveAta: await getAssociatedTokenAddress(
        //   ZERO_PUBKEY,
        //   seller.publicKey,
        //   true,
        //   TOKEN_2022_PROGRAM_ID
        // ),

        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      };

      try {
        await program.methods
          .confirmAsset()
          .accounts(accounts)
          .signers([buyer])
          .rpc();
      } catch (error) {
        assert.strictEqual(error.error.errorMessage, "Invalid State");
      }
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
      buyer_ata: buyerATA,
      escrow: escrowPda,
      escrow_ata: escrowATA,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .signers([buyer])
    .rpc();

  return tx;
}

async function sendAsset({
  program,
  seller,
  mint,
  sellerATA,
  escrowPda,
  escrowATA,
}) {
  await program.methods
    .sendAsset()
    .accounts({
      seller: seller.publicKey,
      mint,
      escrow: escrowPda,
      seller_ata: sellerATA,
      escrow_ata: escrowATA,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .signers([seller])
    .rpc();
}

// async function confirmAsset({
//   program,
//   buyer,
//   seller,
//   escrowPda,
//   deposit_mint,
//   receive_mint,
//   escrow_deposit_ata,
//   escrow_receive_ata,
//   buyer_receive_ata,
//   seller_receive_ata,
// }) {
//   await program.methods
//     .confirmAsset()
//     .accounts({
//       buyer,
//       seller,
//       escrow: escrowPda,
//       depositMint: deposit_mint,
//       receiveMint: receive_mint,
//       escrowDepositAta: escrow_deposit_ata,
//       escrowReceiveAta: escrow_receive_ata,
//       buyerReceiveAta: buyer_receive_ata,
//       sellerReceiveAta: seller_receive_ata,
//       systemProgram: anchor.web3.SystemProgram.programId,
//       tokenProgram: TOKEN_2022_PROGRAM_ID,
//       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//     })
//     .signers([buyer])
//     .rpc({ commitment: "confirmed" });
// }

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

async function checkFundEscrow({
  program,
  provider,
  escrowPda,
  escrowAta,
  dep_type,
}) {
  let escrow = await program.account.escrow.fetch(escrowPda);

  // console.log({ escrow });

  expect(escrow.state).to.deep.equal({ funded: {} });

  if (dep_type == "SOL") {
    // get sol vault pda
    const vaultPda = await getSolVaultPda(escrowPda, program);
    const escrowBalance = await provider.connection.getBalance(vaultPda);
    expect(escrowBalance).to.greaterThanOrEqual(
      escrow.depositAmount.toNumber()
    );
  } else {
    // Token deposit case
    const escrow_account = await getAccount(
      provider.connection,
      escrowAta,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    expect(Number(escrow_account.amount)).to.greaterThanOrEqual(
      escrow.depositAmount.toNumber()
    );
  }
}

async function checkSendAsset({
  program,
  provider,
  escrowPda,
  escrowAta,
  rec_type,
  mint,
}) {
  let escrow = await program.account.escrow.fetch(escrowPda);
  expect(escrow.state).to.deep.equal({ assetSent: {} });

  if (rec_type == "SOL") {
    const solVaultPda = await getSolVaultPda(escrowPda, program);
    const escrowBalance = await provider.connection.getBalance(solVaultPda);
    expect(escrowBalance).to.greaterThanOrEqual(
      escrow.receiveAmount.toNumber()
    );
  } else {
    // Token deposit case
    const escrow_account = await getAccount(
      provider.connection,
      escrowAta,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    expect(Number(escrow_account.amount)).to.greaterThanOrEqual(
      escrow.receiveAmount.toNumber()
    );

    expect(escrow.receiveMint.toBase58()).to.equal(mint.toBase58());
  }
}

async function checkConfirmAsset({
  program,
  provider,
  escrowPda,
  escrowAta,
  dep_type,
  rec_type,
  mint,
  buyer_ata,
  seller_ata,
  buyer,
  seller,
}) {
  let escrow = await program.account.escrow.fetch(escrowPda);
  expect(escrow.state).to.deep.equal({ released: {} });

  if (dep_type === "SOL") {
    const solVaultPda = await getSolVaultPda(escrowPda, program);
    const vaultBalance = await provider.connection.getBalance(solVaultPda);
    expect(vaultBalance).to.lessThan(escrow.depositAmount.toNumber());

    // Seller must receive SOL
    const sellerBalance = await provider.connection.getBalance(
      seller.publicKey
    );

    console.log({ sellerBalance });

    expect(sellerBalance).to.be.greaterThanOrEqual(
      escrow.depositAmount.toNumber()
    );
  }

  if (dep_type === "MINT") {
    // Token deposit ATA must be empty
    const escrowDepositAccount = await getAccount(
      provider.connection,
      escrowAta,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    expect(Number(escrowDepositAccount.amount)).to.equal(0);
    expect(escrow.depositMint.toBase58()).to.equal(mint.toBase58());

    // Seller token ATA must contain the deposited amount
    const sellerAccount = await getAccount(
      provider.connection,
      seller_ata,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    expect(Number(sellerAccount.amount)).to.be.greaterThanOrEqual(
      escrow.depositAmount.toNumber()
    );
  }

  if (rec_type === "SOL") {
    // Buyer must receive SOL
    const buyerBalance = await provider.connection.getBalance(buyer.publicKey);
    expect(buyerBalance).to.greaterThanOrEqual(escrow.receiveAmount.toNumber());
  }

  if (rec_type === "MINT") {
    // Buyer token ATA must contain the released amount
    const buyerAccount = await getAccount(
      provider.connection,
      buyer_ata,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    expect(Number(buyerAccount.amount)).to.greaterThanOrEqual(
      escrow.receiveAmount.toNumber()
    );

    // Check the mint matches
    expect(escrow.receiveMint.toBase58()).to.equal(mint.toBase58());
  }

  // Escrow PDA should hold no tokens (common invariant)
  if (escrowAta) {
    const escrowTokenAcc = await getAccount(
      provider.connection,
      escrowAta,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    expect(Number(escrowTokenAcc.amount)).to.equal(0);
  }

  // Required: expiry must still be > now (not expired)
  expect(escrow.expiry.toNumber()).to.be.greaterThan(
    Math.floor(Date.now() / 1000)
  );

  // // Required: escrow is now locked and can't be reused
  // expect(escrow.depositAmount.toNumber()).to.equal(0);
  // expect(escrow.receiveAmount.toNumber()).to.equal(0);

  return true;
}

async function airdrop(connection: any, address: any, amount = 1000000000) {
  await connection.confirmTransaction(
    await connection.requestAirdrop(address, amount),
    "confirmed"
  );
}

async function getSolVaultPda(escrowPda: any, program: any) {
  const [solVaultPda] = await PublicKey.findProgramAddress(
    [Buffer.from("sol_vault"), escrowPda.toBuffer()],
    program.programId
  );

  return solVaultPda;
}

async function getEscrowATA(connection: any, account: any, mint: any) {
  return await getAssociatedTokenAddress(
    mint,
    account,
    true,
    TOKEN_2022_PROGRAM_ID
  );
}

async function mintTokens(
  connection: any,
  account: any,
  account2?: any,
  amount = 5000000000000
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
  const ata = await getOrCreateAssociatedTokenAccount(
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

  let ata2 = null;
  // seller ATA
  if (account2) {
    ata2 = await getOrCreateAssociatedTokenAccount(
      connection,
      account2,
      mint,
      account2.publicKey,
      false,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
  }

  // Mint to buyer
  await mintTo(
    connection,
    account,
    mint,
    ata.address,
    account.publicKey,
    amount,
    [],
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  return { mint, ata, ata2 };
}

async function mintMoreTokens(
  connection: any,
  ata: any,
  account: any,
  mint: any,
  amount: any
) {
  // Mint to buyer
  return await mintTo(
    connection,
    account,
    mint,
    ata.address,
    account.publicKey,
    amount,
    [],
    undefined,
    TOKEN_2022_PROGRAM_ID
  );
}
