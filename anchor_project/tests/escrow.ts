import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Escrow } from "../target/types/escrow";
import { publicKey } from "@coral-xyz/anchor/dist/cjs/utils";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getAccount,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { assert, expect } from "chai";

const ESCROW_SEED = "ESCROW_SEED";

describe("escrow", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.escrow as Program<Escrow>;
  let Bob = anchor.web3.Keypair.generate();
  let Alice = anchor.web3.Keypair.generate();

  describe("Init Escrow", () => {
    let depositAmount: number, receiveAmount: number, mint: PublicKey;
    beforeEach(async () => {
      // airdrop Bob
      await airdrop(provider.connection, Bob.publicKey, 1 * LAMPORTS_PER_SOL);
      depositAmount = 0.2 * LAMPORTS_PER_SOL;

      // Create Mint
      const res = await createAndMintTokens(
        provider.connection,
        Bob,
        1 * LAMPORTS_PER_SOL
      );
      mint = res.mint;
      receiveAmount = 0.01 * LAMPORTS_PER_SOL;
    });

    it("Should Allow Bob to Initialize and Fund Escrow with SOL", async () => {
      const escrowId = "test_01";

      await init_escrow({
        program,
        escrowId,
        escrowAuthority: Bob,
        receiver: Alice,
        depositMint: PublicKey.default,
        receiveMint: mint,
        depositAmount,
        receiveAmount,
      });

      await checkInitEscrow({
        provider,
        program,
        escrowId,
        escrowAuthority: Bob,
        receiver: Alice,
        depositMint: PublicKey.default,
        receiveMint: mint,
        depositAmount,
        receiveAmount,
      });
    });

    it("Should Allow Bob to Initialize and Fund Escrow with TOKEN", async () => {
      const escrowId = "test_02";

      const tx = await init_escrow({
        program,
        escrowId,
        escrowAuthority: Bob,
        receiver: Alice,
        depositMint: mint,
        receiveMint: PublicKey.default,
        depositAmount,
        receiveAmount,
      });

      await checkInitEscrow({
        provider,
        program,
        escrowId,
        escrowAuthority: Bob,
        receiver: Alice,
        depositMint: mint,
        receiveMint: PublicKey.default,
        depositAmount,
        receiveAmount,
      });
    });

    it("Should fail when the deposit Amount is zero", async () => {
      const escrowId = "test_03";

      try {
        await init_escrow({
          program,
          escrowId,
          escrowAuthority: Bob,
          receiver: Alice,
          depositMint: mint,
          receiveMint: PublicKey.default,
          depositAmount: new anchor.BN(0),
          receiveAmount,
        });
      } catch (error) {
        assert.strictEqual(error.error.errorMessage, "Low Deposit Amount");
      }
    });

    it("Should fail when the receive Amount is zero", async () => {
      const escrowId = "test_04";

      try {
        await init_escrow({
          program,
          escrowId,
          escrowAuthority: Bob,
          receiver: Alice,
          depositMint: mint,
          receiveMint: PublicKey.default,
          depositAmount,
          receiveAmount: new anchor.BN(0),
        });
      } catch (error) {
        assert.strictEqual(error.error.errorMessage, "Low Receive Amount");
      }
    });

    it("Should fail when the tokens are the same", async () => {
      const escrowId = "test_05";

      try {
        await init_escrow({
          program,
          escrowId,
          escrowAuthority: Bob,
          receiver: Alice,
          depositMint: mint,
          receiveMint: mint,
          depositAmount,
          receiveAmount,
        });
      } catch (error) {
        assert.strictEqual(
          error.error.errorMessage,
          "Token to the same token is not allowed"
        );
      }
    });

    it("Should fail when the deposit Mint is invalid", async () => {
      const escrowId = "test_06";

      let minted = await createAndMintTokens(
        provider.connection,
        Bob,
        0.0001 * LAMPORTS_PER_SOL
      );

      try {
        await program.methods
          .initEscrow(
            escrowId,
            mint,
            new anchor.BN(depositAmount),
            PublicKey.default,
            new anchor.BN(receiveAmount)
          )
          .accounts({
            escrowAuthority: Bob.publicKey,
            receiver: Alice.publicKey,
            depositMint: minted.mint,
          })
          .signers([Bob])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        assert.strictEqual(
          error.error.errorMessage,
          "Invalid Deposit Token mint"
        );
      }
    });

    it("Should fail when authority has insufficient balance", async () => {
      const escrowId = "test_06";

      let new_mint = await createMint(
        provider.connection,
        Bob,
        Bob.publicKey,
        null,
        6,
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );

      try {
        await program.methods
          .initEscrow(
            escrowId,
            new_mint,
            new anchor.BN(depositAmount),
            PublicKey.default,
            new anchor.BN(receiveAmount)
          )
          .accounts({
            escrowAuthority: Bob.publicKey,
            receiver: Alice.publicKey,
            depositMint: new_mint,
          })
          .signers([Bob])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        assert.strictEqual(error.error.errorMessage, "Insufficient balance");
      }
    });

    it("Should fail when Id is empty string", async () => {
      const escrowId = "";

      try {
        await program.methods
          .initEscrow(
            escrowId,
            mint,
            new anchor.BN(depositAmount),
            PublicKey.default,
            new anchor.BN(receiveAmount)
          )
          .accounts({
            escrowAuthority: Bob.publicKey,
            receiver: Alice.publicKey,
            depositMint: mint,
          })
          .signers([Bob])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        assert.strictEqual(error.error.errorMessage, "EscrowId too short");
      }
    });

    it("Should fail when an escrow is initialized twice withh the same ID", async () => {
      const escrowId = "test_09";

      try {
        await program.methods
          .initEscrow(
            escrowId,
            mint,
            new anchor.BN(depositAmount),
            PublicKey.default,
            new anchor.BN(receiveAmount)
          )
          .accounts({
            escrowAuthority: Bob.publicKey,
            receiver: Alice.publicKey,
            depositMint: mint,
          })
          .signers([Bob])
          .rpc({ commitment: "confirmed" });

        await program.methods
          .initEscrow(
            escrowId,
            mint,
            new anchor.BN(depositAmount),
            PublicKey.default,
            new anchor.BN(receiveAmount)
          )
          .accounts({
            escrowAuthority: Bob.publicKey,
            receiver: Alice.publicKey,
            depositMint: mint,
          })
          .signers([Bob])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        if (error.error && error.error.errorMessage) {
          assert.equal(error.error.errorMessage, "AccountAlreadyInitialized");
        } else {
          const logs = error.logs || error.transactionLogs || [];
          const found = logs.some((l: string) => l.includes("already in use"));
          assert.isTrue(found, "Expected 'already in use' error in logs");
        }
      }
    });
  });

  describe("Accept Escrow", () => {
    let depositAmount: number, receiveAmount: number, mint: PublicKey;
    let aliceBeforeSol: number, aliceAfterSol: number;
    let aliceBeforeMint: number, aliceAfterMint: number;
    let bobBeforeSol: number, bobAfterSol: number;
    let bobBeforeMint: number, bobAfterMint: number;
    let escrowBefore: number, escrowAfter: number;
    beforeEach(async () => {
      // airdrop Bob
      await airdrop(provider.connection, Bob.publicKey, 1 * LAMPORTS_PER_SOL);
      depositAmount = 0.2 * LAMPORTS_PER_SOL;

      await airdrop(
        provider.connection,
        Alice.publicKey,
        0.2 * LAMPORTS_PER_SOL
      );

      // Create Mint
      const res = await createAndMintTokens(
        provider.connection,
        Alice,
        1 * LAMPORTS_PER_SOL
      );
      mint = res.mint;
      receiveAmount = 0.01 * LAMPORTS_PER_SOL;
    });

    it("Should Allow Alice to Accept Bob Escrow and Fund Alice with SOL", async () => {
      const escrowId = "accept_01";

      await init_escrow({
        program,
        escrowId,
        escrowAuthority: Bob,
        receiver: Alice,
        depositMint: PublicKey.default,
        receiveMint: mint,
        depositAmount,
        receiveAmount,
      });

      await checkInitEscrow({
        provider,
        program,
        escrowId,
        escrowAuthority: Bob,
        receiver: Alice,
        depositMint: PublicKey.default,
        receiveMint: mint,
        depositAmount,
        receiveAmount,
      });

      let [escrowPda, escrowBump] = getEscrowAddress(
        escrowId,
        Bob.publicKey,
        Alice.publicKey,
        program.programId
      );

      let escrow = await program.account.escrow.fetch(escrowPda);

      // SOl to Token Escrow
      aliceBeforeSol = await getSolBalance({
        account: Alice.publicKey,
        provider,
      });
      bobBeforeMint = await getMintBalance({
        account: Bob.publicKey,
        provider,
        mint,
      });

      // Accept Escrow
      await program.methods
        .accept(escrowId)
        .accounts({
          receiver: Alice.publicKey,
          escrowAuthority: Bob.publicKey,
          receiveMint: escrow.receiveMint.equals(PublicKey.default)
            ? escrow.depositMint
            : escrow.receiveMint,
          depositMint: escrow.depositMint.equals(PublicKey.default)
            ? escrow.receiveMint
            : escrow.depositMint,
        })
        .signers([Alice])
        .rpc({ commitment: "confirmed" });

      aliceAfterSol = await getSolBalance({
        account: Alice.publicKey,
        provider,
      });
      bobAfterMint = await getMintBalance({
        account: Bob.publicKey,
        provider,
        mint,
      });
      escrowAfter = escrow.depositMint.equals(PublicKey.default)
        ? await getSolBalance({ account: escrowPda, provider })
        : await getMintBalance({ account: escrowPda, provider, mint });

      expect(aliceAfterSol - aliceBeforeSol).to.equals(
        depositAmount,
        "Wrong Amount for Alice"
      );

      expect(bobAfterMint - bobBeforeMint).to.equals(
        receiveAmount,
        "Wrong Amount for Bob"
      );

      expect(escrowAfter).to.be.lessThan(depositAmount);

      escrow = await program.account.escrow.fetch(escrowPda);
      expect(escrow.state).to.deep.equals({ completed: {} });
    });

    it("Should Allow Alice to Accept Bob Escrow and Fund Alice with MINT", async () => {
      const escrowId = "accept_02";

      // Create Mint
      const res = await createAndMintTokens(
        provider.connection,
        Bob,
        1 * LAMPORTS_PER_SOL
      );
      let newMint = res.mint;

      await init_escrow({
        program,
        escrowId,
        escrowAuthority: Bob,
        receiver: Alice,
        depositMint: newMint,
        receiveMint: PublicKey.default,
        depositAmount,
        receiveAmount,
      });

      await checkInitEscrow({
        provider,
        program,
        escrowId,
        escrowAuthority: Bob,
        receiver: Alice,
        depositMint: newMint,
        receiveMint: PublicKey.default,
        depositAmount,
        receiveAmount,
      });

      let [escrowPda, escrowBump] = getEscrowAddress(
        escrowId,
        Bob.publicKey,
        Alice.publicKey,
        program.programId
      );

      let escrow = await program.account.escrow.fetch(escrowPda);

      bobBeforeSol = await getSolBalance({
        account: Bob.publicKey,
        provider,
      });

      escrowBefore = escrow.depositMint.equals(PublicKey.default)
        ? await getSolBalance({ account: escrowPda, provider })
        : await getMintBalance({ account: escrowPda, provider, mint: newMint });

      // Accept Escrow
      await program.methods
        .accept(escrowId)
        .accounts({
          receiver: Alice.publicKey,
          escrowAuthority: Bob.publicKey,
          receiveMint: escrow.receiveMint.equals(PublicKey.default)
            ? escrow.depositMint
            : escrow.receiveMint,
          depositMint: escrow.depositMint.equals(PublicKey.default)
            ? escrow.receiveMint
            : escrow.depositMint,
        })
        .signers([Alice])
        .rpc({ commitment: "confirmed" });

      aliceAfterMint = await getMintBalance({
        account: Alice.publicKey,
        provider,
        mint: newMint,
      });

      bobAfterSol = await getSolBalance({
        account: Bob.publicKey,
        provider,
      });

      escrowAfter = escrow.depositMint.equals(PublicKey.default)
        ? await getSolBalance({ account: escrowPda, provider })
        : await getMintBalance({ account: escrowPda, provider, mint: newMint });

      expect(aliceAfterMint).to.equals(depositAmount, "Wrong Amount for Alice");

      expect(bobAfterSol - bobBeforeSol).to.equals(
        receiveAmount,
        "Wrong Amount for Bob"
      );

      expect(escrowBefore - escrowAfter).to.equals(depositAmount);

      escrow = await program.account.escrow.fetch(escrowPda);
      expect(escrow.state).to.deep.equals({ completed: {} });
    });

    it("Should fail if deposit mint does not tally", async () => {
      const escrowId = "accept_03";

      let resP = await createAndMintTokens(
        provider.connection,
        Bob,
        1 * LAMPORTS_PER_SOL
      );
      mint = resP.mint;

      // Create Mint
      const res = await createAndMintTokens(
        provider.connection,
        Bob,
        1 * LAMPORTS_PER_SOL
      );
      let newMint = res.mint;

      await init_escrow({
        program,
        escrowId,
        escrowAuthority: Bob,
        receiver: Alice,
        depositMint: mint,
        receiveMint: PublicKey.default,
        depositAmount,
        receiveAmount,
      });

      await checkInitEscrow({
        provider,
        program,
        escrowId,
        escrowAuthority: Bob,
        receiver: Alice,
        depositMint: mint,
        receiveMint: PublicKey.default,
        depositAmount,
        receiveAmount,
      });

      let [escrowPda, escrowBump] = getEscrowAddress(
        escrowId,
        Bob.publicKey,
        Alice.publicKey,
        program.programId
      );

      let escrow = await program.account.escrow.fetch(escrowPda);

      // Accept Escrow
      try {
        await program.methods
          .accept(escrowId)
          .accounts({
            receiver: Alice.publicKey,
            escrowAuthority: Bob.publicKey,
            receiveMint: escrow.receiveMint.equals(PublicKey.default)
              ? escrow.depositMint
              : escrow.receiveMint,
            depositMint: newMint,
          })
          .signers([Alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        assert.strictEqual(
          error.error.errorMessage,
          "Invalid Deposit Token mint"
        );
      }
    });

    it("Should fail if receive mint does not tally", async () => {
      const escrowId = "accept_04";

      // Create Mint
      const res = await createAndMintTokens(
        provider.connection,
        Bob,
        1 * LAMPORTS_PER_SOL
      );
      let newMint = res.mint;

      await init_escrow({
        program,
        escrowId,
        escrowAuthority: Bob,
        receiver: Alice,
        depositMint: PublicKey.default,
        receiveMint: mint,
        depositAmount,
        receiveAmount,
      });

      await checkInitEscrow({
        provider,
        program,
        escrowId,
        escrowAuthority: Bob,
        receiver: Alice,
        depositMint: PublicKey.default,
        receiveMint: mint,
        depositAmount,
        receiveAmount,
      });

      let [escrowPda, escrowBump] = getEscrowAddress(
        escrowId,
        Bob.publicKey,
        Alice.publicKey,
        program.programId
      );

      // Accept Escrow
      try {
        await program.methods
          .accept(escrowId)
          .accounts({
            receiver: Alice.publicKey,
            escrowAuthority: Bob.publicKey,
            receiveMint: newMint,
            depositMint: mint,
          })
          .signers([Alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        assert.strictEqual(
          error.error.errorMessage,
          "Invalid Receive Token mint"
        );
      }
    });

    it("Should Allow Alice to Accept Bob Escrow and Fund Alice with SOL", async () => {
      const escrowId = "accept_05";

      await init_escrow({
        program,
        escrowId,
        escrowAuthority: Bob,
        receiver: Alice,
        depositMint: PublicKey.default,
        receiveMint: mint,
        depositAmount,
        receiveAmount,
      });

      await checkInitEscrow({
        provider,
        program,
        escrowId,
        escrowAuthority: Bob,
        receiver: Alice,
        depositMint: PublicKey.default,
        receiveMint: mint,
        depositAmount,
        receiveAmount,
      });

      let [escrowPda, escrowBump] = getEscrowAddress(
        escrowId,
        Bob.publicKey,
        Alice.publicKey,
        program.programId
      );

      let escrow = await program.account.escrow.fetch(escrowPda);

      // SOl to Token Escrow
      aliceBeforeSol = await getSolBalance({
        account: Alice.publicKey,
        provider,
      });
      bobBeforeMint = await getMintBalance({
        account: Bob.publicKey,
        provider,
        mint,
      });

      // Accept Escrow
      await program.methods
        .accept(escrowId)
        .accounts({
          receiver: Alice.publicKey,
          escrowAuthority: Bob.publicKey,
          receiveMint: escrow.receiveMint.equals(PublicKey.default)
            ? escrow.depositMint
            : escrow.receiveMint,
          depositMint: escrow.depositMint.equals(PublicKey.default)
            ? escrow.receiveMint
            : escrow.depositMint,
        })
        .signers([Alice])
        .rpc({ commitment: "confirmed" });

      aliceAfterSol = await getSolBalance({
        account: Alice.publicKey,
        provider,
      });
      bobAfterMint = await getMintBalance({
        account: Bob.publicKey,
        provider,
        mint,
      });
      escrowAfter = escrow.depositMint.equals(PublicKey.default)
        ? await getSolBalance({ account: escrowPda, provider })
        : await getMintBalance({ account: escrowPda, provider, mint });

      expect(aliceAfterSol - aliceBeforeSol).to.equals(
        depositAmount,
        "Wrong Amount for Alice"
      );

      expect(bobAfterMint - bobBeforeMint).to.equals(
        receiveAmount,
        "Wrong Amount for Bob"
      );

      expect(escrowAfter).to.be.lessThan(depositAmount);

      escrow = await program.account.escrow.fetch(escrowPda);

      expect(escrow.state).to.deep.equals({ completed: {} });

      // Accept Escrow
      try {
        await program.methods
          .accept(escrowId)
          .accounts({
            receiver: Alice.publicKey,
            escrowAuthority: Bob.publicKey,
            receiveMint: escrow.receiveMint.equals(PublicKey.default)
              ? escrow.depositMint
              : escrow.receiveMint,
            depositMint: escrow.depositMint.equals(PublicKey.default)
              ? escrow.receiveMint
              : escrow.depositMint,
          })
          .signers([Alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        assert.strictEqual(error.error.errorMessage, "Invalid State");
      }
    });
  });

  describe("Close Escrow", () => {
    let depositAmount: number, receiveAmount: number, mint: PublicKey;
    let bobBeforeSol: number, bobAfterSol: number;
    let bobBeforeMint: number, bobAfterMint: number;
    beforeEach(async () => {
      // airdrop Bob
      await airdrop(provider.connection, Bob.publicKey, 1 * LAMPORTS_PER_SOL);
      depositAmount = 0.2 * LAMPORTS_PER_SOL;

      // Create Mint
      const res = await createAndMintTokens(
        provider.connection,
        Bob,
        1 * LAMPORTS_PER_SOL
      );
      mint = res.mint;
      receiveAmount = 0.01 * LAMPORTS_PER_SOL;
    });

    it("Successfully close an escrow FUNDED with SOL", async () => {
      const escrowId = "close_01";

      await init_escrow({
        program,
        escrowId,
        escrowAuthority: Bob,
        receiver: Alice,
        depositMint: PublicKey.default,
        receiveMint: mint,
        depositAmount,
        receiveAmount,
      });

      await checkInitEscrow({
        provider,
        program,
        escrowId,
        escrowAuthority: Bob,
        receiver: Alice,
        depositMint: PublicKey.default,
        receiveMint: mint,
        depositAmount,
        receiveAmount,
      });

      let [escrowPda, escrowBump] = getEscrowAddress(
        escrowId,
        Bob.publicKey,
        Alice.publicKey,
        program.programId
      );

      let escrow = await program.account.escrow.fetch(escrowPda);
      bobBeforeSol = await getSolBalance({
        account: Bob.publicKey,
        provider,
      });

      await program.methods
        .close(escrowId)
        .accounts({
          escrowAuthority: Bob.publicKey,
          receiver: Alice.publicKey,
          depositMint: escrow.depositMint.equals(PublicKey.default)
            ? escrow.receiveMint
            : escrow.depositMint,
        })
        .signers([Bob])
        .rpc({ commitment: "confirmed" });

      bobAfterSol = await getSolBalance({
        account: Bob.publicKey,
        provider,
      });

      expect(bobAfterSol - bobBeforeSol).to.be.greaterThanOrEqual(
        escrow.depositAmount.toNumber()
      );

      try {
        await program.account.escrow.fetch(escrowPda);

        assert.fail("Expected fetch to throw an error for closed account");
      } catch (err) {
        console.log({ err });

        const msg = err.message || err.error?.message || String(err);

        assert.include(
          msg,
          "Account does not exist or has no data",
          "Expected closed escrow fetch to fail"
        );
      }
    });

    it("Successfully close an escrow FUNDED with MINT", async () => {
      const escrowId = "close_02";

      const res = await createAndMintTokens(
        provider.connection,
        Bob,
        1 * LAMPORTS_PER_SOL
      );
      mint = res.mint;

      await init_escrow({
        program,
        escrowId,
        escrowAuthority: Bob,
        receiver: Alice,
        depositMint: mint,
        receiveMint: PublicKey.default,
        depositAmount,
        receiveAmount,
      });

      await checkInitEscrow({
        provider,
        program,
        escrowId,
        escrowAuthority: Bob,
        receiver: Alice,
        depositMint: mint,
        receiveMint: PublicKey.default,
        depositAmount,
        receiveAmount,
      });

      bobBeforeMint = await getMintBalance({
        account: Bob.publicKey,
        provider,
        mint,
      });

      let [escrowPda, escrowBump] = getEscrowAddress(
        escrowId,
        Bob.publicKey,
        Alice.publicKey,
        program.programId
      );

      let escrow = await program.account.escrow.fetch(escrowPda);

      await program.methods
        .close(escrowId)
        .accounts({
          escrowAuthority: Bob.publicKey,
          receiver: Alice.publicKey,
          depositMint: escrow.depositMint.equals(PublicKey.default)
            ? escrow.receiveMint
            : escrow.depositMint,
        })
        .signers([Bob])
        .rpc({ commitment: "confirmed" });

      bobAfterMint = await getMintBalance({
        account: Bob.publicKey,
        provider,
        mint,
      });

      expect(bobAfterMint - bobBeforeMint).to.be.equals(
        escrow.depositAmount.toNumber()
      );

      try {
        await program.account.escrow.fetch(escrowPda);
        assert.fail("Expected fetch to throw an error for closed account");
      } catch (err) {
        const msg = err.message || err.error?.message || String(err);

        assert.include(
          msg,
          "Account does not exist or has no data",
          "Expected closed escrow fetch to fail"
        );
      }
    });
  });
});

const init_escrow = async ({
  program,
  escrowId,
  escrowAuthority,
  receiver,
  depositMint,
  receiveMint,
  depositAmount,
  receiveAmount,
}) => {
  return await program.methods
    .initEscrow(
      escrowId,
      depositMint,
      new anchor.BN(depositAmount),
      receiveMint,
      new anchor.BN(receiveAmount)
    )
    .accounts({
      escrowAuthority: escrowAuthority.publicKey,
      receiver: receiver.publicKey,
      depositMint: depositMint == PublicKey.default ? receiveMint : depositMint,
    })
    .signers([escrowAuthority])
    .rpc({ commitment: "confirmed" });
};

const checkInitEscrow = async ({
  provider,
  program,
  escrowId,
  escrowAuthority,
  receiver,
  depositMint,
  receiveMint,
  depositAmount,
  receiveAmount,
}) => {
  // Get Pda of the escrow via the ID
  let [escrowPda, escrowBump] = getEscrowAddress(
    escrowId,
    escrowAuthority.publicKey,
    receiver.publicKey,
    program.programId
  );

  let escrow = await program.account.escrow.fetch(escrowPda);

  // // Basic Asserts
  expect(escrowBump).to.be.a("number");
  expect(escrow.escrowAuthority.toString()).to.equal(
    escrowAuthority.publicKey.toString()
  );
  expect(escrow.receiver.toString()).to.equal(receiver.publicKey.toString());
  expect(escrow.escrowId).to.equal(escrowId);

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
    depositAmount,
    "Deposit amount mismatch"
  );

  expect(escrow.receiveAmount.toNumber()).to.equal(
    receiveAmount,
    "Receive amount mismatch"
  );

  // State
  expect(escrow.state).to.deep.equal({ active: {} });

  checkEscrowBalance({
    provider,
    program,
    escrow,
    escrowPda,
    type: depositMint == PublicKey.default ? "SOL" : "MINT",
    mint: depositMint == PublicKey.default ? receiveMint : depositMint,
  });
};

const checkEscrowBalance = async ({
  provider,
  program,
  escrow,
  escrowPda,
  type,
  mint,
}) => {
  if (type == "SOL") {
    // get sol vault pda
    const vaultPda = await getSolVaultPda(escrowPda, program);
    const escrowBalance = await provider.connection.getBalance(vaultPda);
    expect(escrowBalance).to.lessThan(escrow.depositAmount.toNumber());
  } else {
    // Token deposit case
    const escrow_account = await getAccount(
      provider.connection,
      await getEscrowATA(program.connection, escrowPda, mint),
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    expect(Number(escrow_account.amount)).to.equal(escrow.depositAmount);
  }
};

// HELPERS
async function airdrop(connection: any, address: any, amount: number) {
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

async function getSolBalance({ account, provider }) {
  return await provider.connection.getBalance(account, {
    commitment: "confirmed",
  });
}

// account is public key in here
async function getMintBalance({ account, provider, mint }) {
  const ata = await getAssociatedTokenAddress(
    mint,
    account,
    true,
    TOKEN_2022_PROGRAM_ID
  );

  // Token deposit ATA must be empty
  const mint_act = await getAccount(
    provider.connection,
    ata,
    "confirmed",
    TOKEN_2022_PROGRAM_ID
  );

  return Number(mint_act.amount);
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

async function createAndMintTokens(
  connection: any,
  account: any,
  amount: number
) {
  // Create Mint
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

  return { mint, ata };
}
