# Project Description

**Deployed Frontend URL:** [TODO: Link to your deployed frontend]

**Solana Program ID:** [TODO: Your deployed program's public key]

## Project Overview

### Description

A simple escrow application built on solana. Users(buyers) can open escrow contracts to swap assets with sellers. Each escrow is a unique PDA derived from buyer + seller + a unique seed (escrow ID). Escrow PDA store all data i.e buyer pubkey, seller pubkey assetInfo, amounts, state, expiry. Users(buyers and sellers) can only interact with their escrow PDAs. This dApp demonstrates basic Solana program development concepts including PDAs, account creation, and state management.

### Key Features

- **Create Escrow**: Initialize a new escrow account between a buyer and a seller, storing asset details, payment amount and expiry.
- **Fund Escrow**: Allow the buyer to deposit funds into the escrow account securely.
- **Accept Escrow**: Enable the seller to accept the escrow after reviewing its details, activating the contract.
- **Send Asset**: Allow the seller to transfer the asset (token or NFT) into the escrow account.
- **Confirm Asset**: Enable the buyer to confirm receipt of the asset, triggering the release of funds to the seller.
- **Cancel Escrow**: Allow the buyer to cancel the escrow before completion, returning funds to the buyer and the asset to the seller.
- **Auto release** Automatically release funds or refund the buyer if the escrow reaches its expiry and one party is unresponsive.

### How to Use the dApp

1. **Connect Wallet**
2. **Main Action 1:** [Step-by-step instructions]
3. **Main Action 2:** [Step-by-step instructions]
4. ...

## Program Architecture

**Instructions Implemented:**

- **CreateEscrow**: Initialize a new escrow account between a buyer and a seller, storing asset details, and payment amount.
- **FundEscrow**: Allow the buyer to deposit funds into the escrow account securely.
- **AcceptEscrow**: Enable the seller to accept the escrow after reviewing its details, activating the contract.
- **SendAsset**: Allow the seller to transfer the asset (token or NFT) into the escrow account.
- **ConfirmAsset**: Enable the buyer to confirm receipt of the asset, triggering the release of funds to the seller.
- **CancelEscrow**: Allow the buyer to cancel the escrow before completion, returning funds to the buyer and the asset to the seller.
- **AutoRelease** Automatically release funds or refund the buyer if the escrow reaches its expiry and one party is unresponsive.

### PDA Usage

[TODO: Explain how you implemented Program Derived Addresses (PDAs) in your project. What seeds do you use and why?]

**PDAs Used:**

- PDA 1: [Purpose and description]
- PDA 2: [Purpose and description]

### Program Instructions

[TODO: List and describe all the instructions in your Solana program]

**Instructions Implemented:**

- Instruction 1: [Description of what it does]
- Instruction 2: [Description of what it does]
- ...

### Account Structure

[TODO: Describe your main account structures and their purposes]

```rust
// Example account structure (replace with your actual structs)
#[account]
pub struct YourAccountName {
    // Describe each field
}
```

## Testing

### Test Coverage

[TODO: Describe your testing approach and what scenarios you covered]

**Happy Path Tests:**

- Test 1: [Description]
- Test 2: [Description]
- ...

**Unhappy Path Tests:**

- Test 1: [Description of error scenario]
- Test 2: [Description of error scenario]
- ...

### Running Tests

```bash
# Commands to run your tests
anchor test
```

### Additional Notes for Evaluators

[TODO: Add any specific notes or context that would help evaluators understand your project better]
