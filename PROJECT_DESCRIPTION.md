# Project Description

**Deployed Frontend URL:** [[Escrow App](https://escrow-s0fdc3rrz-harwarls-projects.vercel.app)]

**Solana Program ID:** [nj9z1iSrdSBhFt3jmxmgHzhBLVqE6b2bh7MwLjiDWuq]

## Project Overview

### Description

A simple escrow application built on solana. Users(buyers) can open escrow contracts to swap assets with sellers(receivers). Each escrow is a unique PDA derived from Owner + seller + a unique seed (escrow ID). Escrow PDA store all data i.e Owner pubkey, seller pubkey assetInfo, amounts, state. Users(buyers and sellers(receivers)) can only interact with their escrow PDAs. This dApp demonstrates basic Solana program development concepts including PDAs, account creation, and state management.

### Key Features

- **Create Escrow**: Initialize a new escrow with a counterparty, specifying the tokens and amounts to exchange.
- **Accept Escrow**: The designated seller reviews and accepts the escrow, depositing their required tokens.
- **Automatic Token Swap**: Once accepted, both parties' deposits are exchanged atomically.
- **Close Escrow**: Allows the escrow creator to reclaim unused tokens or dust if the escrow remains unaccepted or when escrow has been accepted.
- **View Escrows**: Displays all escrows associated with your wallet, including status and details.

### How to Use the dApp

1. **Connect Wallet** – Link your Solana wallet to access balances and sign transactions.
2. **Create Escrow** – Click the **Create Escrow** button and fill out the modal form with:
   - Counterparty (seller) address
   - Token you will deposit
   - Token you expect to receive
   - Corresponding token amounts  
     Confirm by selecting **Create Escrow**.
3. **Wait for Counterparty** – The escrow remains pending until the seller accepts.
4. **Accept Escrow** – The seller opens the escrow via the **View** button and confirms acceptance, which deposits their tokens and completes the swap.
5. **Close Escrow** – If the escrow remains unaccepted, the owner can close it to recover dust or cancel the exchange.
6. **Track Status** – Review escrow states and balances directly from the dashboard.

## Program Architecture

This escrow dApp employs a structured program design with a dedicated escrow account and three primary instructions. A PDA holds user deposits securely until the swap is finalized, ensuring trustless settlement and state consistency throughout the workflow.

**Instructions Implemented:**

- **InitEscrow**  
  Creates a new escrow account and records the owner, seller, token mints, and amounts.  
  Transfers the owner’s deposit token into the escrow PDA and sets the escrow state to _Active_.

- **AcceptEscrow**  
  Allows the designated seller to accept the escrow.  
  Transfers the seller’s required tokens into the PDA and performs an atomic swap:

  - Owner’s deposit → Seller
  - Seller’s deposit → Owner  
    Marks the escrow as _Completed_.

- **Close**  
  Enables the escrow creator to cancel an unaccepted escrow or recover leftover token dust.  
  Returns any remaining balance to the owner and closes the escrow account.

### PDA Usage

The program uses Program Derived Addresses to manage escrow accounts and vaults that safely hold deposited assets during the exchange.  
Each escrow instance generates deterministic PDAs using the escrow ID, the owner, and the receiver, ensuring isolation between different escrow sessions.

**PDAs Used:**

- **Escrow PDA**  
  Derived from:  
  `["escrow", escrow_id, escrow_authority_pubkey, receiver_pubkey]`  
  This PDA stores all metadata for a single escrow, including the creator, receiver, token mints, amounts, and current state.  
  The receiver constraint ensures that only the designated counterparty is authorized to accept the escrow.

- **SOL Vault PDA**  
  Derived from:  
  `["sol_vault", escrow_pda_pubkey]`  
  This account temporarily holds SOL deposits tied to the escrow activity.  
  It is owned and controlled exclusively by the program, preventing either party from withdrawing prematurely.

These PDAs provide deterministic, secure, and collision-free storage locations for escrow data and assets, while enabling the program to enforce access control and atomic settlement guarantees.

### Program Instructions

### Program Instructions

**Instructions Implemented:**

- **InitEscrow**  
  Creates a new escrow account using the escrow PDA derived from the escrow ID, the escrow authority, and the receiver.  
  Stores all required metadata such as deposit mint, receive mint, and token amounts.  
  Transfers the creator’s deposit (SOL or SPL tokens) into the appropriate vault PDA and sets the escrow state to _Pending_.

- **AcceptEscrow**  
  Executed by the designated receiver specified in the escrow account.  
  Verifies authorization, deposits the receiver’s required amount into the vault, and performs an atomic swap between both parties.  
  Once the exchange completes, the escrow state is updated to _Completed_.

- **Close**  
  Allows the escrow creator to close an unaccepted or expired escrow.  
  Returns remaining balances (“dust”) from the vault PDA back to the creator and closes the escrow account and SOL vault.  
  Ensures the program cleans up all unused accounts after execution.

### Account Structure

The program uses a dedicated escrow account to store all metadata required to manage a secure token-for-token or SOL-for-token exchange.  
This account tracks the creator, the designated receiver, token mints, amounts, and the escrow state, ensuring both parties' deposits and settlement logic remain deterministic and verifiable.

```rust
#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub escrow_authority: Pubkey,
    // The wallet that created the escrow. Only this authority can close or cancel it.

    pub receiver: Pubkey,
    // The designated counterparty allowed to accept the escrow and finalize the exchange.

    // Buyer deposit details
    pub deposit_mint: Pubkey,
    // Mint of the token (or native SOL placeholder) the escrow creator is depositing.
    pub deposit_amount: u64,
    // Amount of tokens/SOL the creator deposits into the vault when the escrow is initialized.

    // Seller receive details
    pub receive_mint: Pubkey,
    // Mint of the token (or SOL) the creator expects to receive from the counterparty.
    pub receive_amount: u64,
    // Required amount the receiver must deposit to accept and settle the escrow.

    pub state: EscrowState,
    // Tracks the current status of the escrow (Pending, Completed, Closed).

    pub bump: u8,
    // PDA bump used to derive the escrow account address.

    #[max_len(ESCROW_ID_LENGTH)]
    pub escrow_id: String,
    // A unique string identifier for this escrow instance, included in PDA derivation.
}
```

## Testing

### Test Coverage

The project includes a comprehensive test suite validating all escrow instructions, covering both successful workflows and failure scenarios to ensure correctness, safety, and predictable behavior across all edge cases.

**Happy Path Tests:**

- **Init Escrow (SOL)**  
  Ensures an escrow can be initialized and funded using native SOL, with correct PDA derivation and vault funding.

- **Init Escrow (Token)**  
  Validates token-based initialization, confirming the creator’s SPL token deposit is transferred to the vault and the escrow state is set to `Pending`.

- **Accept Escrow (SOL)**  
  Confirms the receiver can successfully accept an escrow funded with SOL and that the atomic transfer of assets completes correctly.

- **Accept Escrow (Token)**  
  Validates a token-for-token or SOL-for-token escrow settlement, ensuring the receiver’s deposit is verified and both parties receive their expected assets.

- **Close Escrow (SOL)**  
  Ensures an escrow funded with SOL can be properly closed, returning remaining vault funds to the creator and closing associated PDAs.

- **Close Escrow (Token)**  
  Confirms token-based escrows can be safely closed, cleaning up the escrow and vault accounts while returning any dust.

**Unhappy Path Tests:**

- **Zero Deposit Amount**  
  Fails when attempting to initialize an escrow with a deposit amount of zero.

- **Zero Receive Amount**  
  Fails when the expected receive amount is zero.

- **Identical Mint Error**  
  Prevents initialization when the deposit and receive mints are the same.

- **Invalid Deposit Mint**  
  Ensures the program rejects escrows that specify an invalid or unsupported deposit mint.

- **Insufficient Balance**  
  Fails when the escrow authority does not have enough SOL or tokens to fund the vault.

- **Empty Escrow ID**  
  Ensures ID-based escrows cannot be created with an empty string.

- **Duplicate Escrow Initialization**  
  Prevents creating a second escrow with the same ID seeds, confirming PDA uniqueness and state protection.

- **Accept Mint Mismatch (Deposit Side)**  
  Fails when the receiver attempts to accept using a token that does not match the deposit mint stored in the escrow.

- **Accept Mint Mismatch (Receive Side)**  
  Fails when the receiver’s expected receive mint does not match the on-chain escrow configuration.

### Running Tests

```bash
# Commands to run your tests
anchor test
```

### Additional Notes for Evaluators

### Developer Notes

This was my first full escrow implementation on Solana, and it came with its own set of challenges.  
The biggest hurdle was handling optional token mints. Since Anchor does not allow optional ATAs in account validation, I had to introduce placeholder (dummy) token accounts whenever the deposit or receive mint was `Pubkey::default()`.  
These dummy accounts acted as stand-ins so the instruction handlers could still execute without breaking PDA derivation or account constraint checks.

This workaround allowed the program to support flexible escrow types (SOL-to-token, token-to-SOL, and token-to-token), even though the underlying account validation expected fixed ATAs.  
Once this pattern was established, the rest of the escrow flow became much more predictable, and the flexibility of PDAs made the architecture significantly cleaner.
