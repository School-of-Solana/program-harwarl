use anchor_lang::prelude::{program::invoke_signed, *};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{transfer_checked, Token2022, TransferChecked},
    token_interface::{Mint, TokenAccount},
};

use crate::{
    errors::EscrowError,
    events::EscrowCreated,
    state::{Escrow, EscrowState, ESCROW_ID_LENGTH, ESCROW_SEED, SOL_VAULT_SEED},
};

pub fn _init_escrow(
    ctx: Context<InitializeEscrow>,
    escrow_id: String,
    deposit_mint: Pubkey,
    deposit_amount: u64,
    receive_mint: Pubkey,
    receive_amount: u64,
) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    let sol_vault = &mut ctx.accounts.sol_vault;
    let escrow_authority = &mut ctx.accounts.escrow_authority;
    let receiver = &mut ctx.accounts.receiver;
    let system_program = &mut ctx.accounts.system_program;
    let token_program = &mut ctx.accounts.token_program;

    let mint = ctx.accounts.deposit_mint.as_ref();
    let authority_token_vault = ctx.accounts.authority_token_vault.as_ref();
    let escrow_token_vault = ctx.accounts.token_vault.as_ref();

    let bump = ctx.bumps.escrow;
    let vault_bump = ctx.bumps.sol_vault;

    require!(
        escrow_authority.key() != receiver.key(),
        EscrowError::SameBuyerSellerNotAllowed
    );
    require!(deposit_amount > 0, EscrowError::DepositAmountLow);
    require!(receive_amount > 0, EscrowError::ReceiveAmountLow);
    require!(
        deposit_mint != receive_mint,
        EscrowError::SameTokenTransferNotAllowed
    );

    let is_deposit_sol = deposit_mint == Pubkey::default();

    // Update the escrow State
    escrow.bump = bump;
    escrow.receiver = receiver.key();
    escrow.deposit_amount = deposit_amount;
    escrow.deposit_mint = deposit_mint;
    escrow.receive_amount = receive_amount;
    escrow.receive_mint = receive_mint;
    escrow.escrow_authority = escrow_authority.key();
    escrow.escrow_id = escrow_id;

    // DO SOl Transfer to the sol vault
    // create vault only if the deposit is sol
    if is_deposit_sol {
        // create a sol vault
        let rent = Rent::get()?;
        let space = 0;
        let lamports = rent
            .minimum_balance(space)
            .checked_add(deposit_amount)
            .unwrap();

        let create_ix = system_instruction::create_account(
            &escrow_authority.key(),
            &sol_vault.key(),
            lamports,
            space as u64,
            &system_program.key(),
        );

        invoke_signed(
            &create_ix,
            &[
                escrow_authority.to_account_info(),
                sol_vault.to_account_info(),
                system_program.to_account_info(),
            ],
            &[&[
                SOL_VAULT_SEED.as_bytes(),
                escrow.key().as_ref(),
                &[vault_bump],
            ]],
        )?;
    } else {
        // Transfer token to the escrow ata
        // fund the escrow ata with token
        // check if the mint address matches what was agreed on
        let mint = mint.unwrap();
        let from_ata = authority_token_vault.unwrap();
        let to_ata = escrow_token_vault.unwrap();

        require!(
            mint.key() == escrow.deposit_mint,
            EscrowError::InvalidDepositMint
        );

        // check if the buyer has sufficient balance
        require!(
            from_ata.amount > escrow.deposit_amount,
            EscrowError::InsufficientBalance
        );

        // check for overflow
        to_ata
            .amount
            .checked_add(escrow.deposit_amount)
            .ok_or(EscrowError::OverFlow)?;

        let transfer_ctx = CpiContext::new(
            token_program.to_account_info(),
            TransferChecked {
                authority: escrow_authority.to_account_info(),
                mint: mint.to_account_info(),
                to: to_ata.to_account_info(),
                from: from_ata.to_account_info(),
            },
        );

        transfer_checked(transfer_ctx, escrow.deposit_amount, mint.decimals)?;
    }

    // Update the escrow state
    escrow.state = EscrowState::Active;

    emit!(EscrowCreated {
        escrow: escrow.key(),
        escrow_authority: escrow_authority.key(),
        receiver: receiver.key(),
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(escrow_id: String)]
pub struct InitializeEscrow<'info> {
    #[account(mut)]
    pub escrow_authority: Signer<'info>,

    /// CHECK: this is just the sellers account
    #[account(mut)]
    pub receiver: AccountInfo<'info>,

    #[account(
        init,
        payer = escrow_authority,
        space = 8 + Escrow::INIT_SPACE,
        seeds = [ESCROW_SEED.as_bytes(), escrow_id.as_bytes(), escrow_authority.key().as_ref(), receiver.key().as_ref()],
        bump,
        constraint = escrow_id.len() > 0 @ EscrowError::IdTooShort,
        constraint = escrow_id.len() <= ESCROW_ID_LENGTH @ EscrowError::IdTooLong
    )]
    pub escrow: Account<'info, Escrow>,

    /// CHECK: PDA holding SOL deposits
    #[account(mut, seeds = [SOL_VAULT_SEED.as_bytes(), escrow.key().as_ref()], bump)]
    pub sol_vault: UncheckedAccount<'info>,

    /// CHECK: Mint of the token to transfer
    #[account(mut)]
    pub deposit_mint: Option<InterfaceAccount<'info, Mint>>,

    //deposit mint token vault
    #[account(
            init_if_needed,
            payer = escrow_authority,
            associated_token::mint = deposit_mint,
            associated_token::authority = escrow,
            associated_token::token_program = token_program
        )]
    pub token_vault: Option<InterfaceAccount<'info, TokenAccount>>,

    #[account(
            init_if_needed,
            payer = escrow_authority,
            associated_token::mint = deposit_mint,
            associated_token::authority = escrow_authority,
            associated_token::token_program = token_program
        )]
    pub authority_token_vault: Option<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
