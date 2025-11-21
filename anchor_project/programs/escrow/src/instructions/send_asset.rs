use anchor_lang::prelude::{program::invoke, system_instruction::transfer, *};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{transfer_checked, Token2022, TransferChecked},
    token_interface::{Mint, TokenAccount},
};

use crate::{errors::EscrowError, events::EscrowAssetSent, state::*};

pub fn _send_asset(ctx: Context<SendAsset>) -> Result<()> {
    let seller: &mut Signer<'_> = &mut ctx.accounts.seller;
    let escrow: &mut Account<'_, Escrow> = &mut ctx.accounts.escrow;
    let sol_vault = &mut ctx.accounts.sol_vault;
    let system_program = &mut ctx.accounts.system_program;
    let token_program = &mut ctx.accounts.token_program;

    // optionals

    let escrow_ata = ctx.accounts.escrow_ata.as_ref();
    let seller_ata = ctx.accounts.seller_ata.as_ref();
    let mint = ctx.accounts.mint.as_ref();

    // check state of the escrow if the buyer already funded
    require!(
        escrow.state == EscrowState::Funded,
        EscrowError::EscrowNotFunded
    );

    // check if the seller is the one funding
    require!(
        seller.key() == escrow.seller,
        EscrowError::UnauthorizedSeller
    );

    if escrow.receive_mint == Pubkey::default() {
        // Expecting the seller to send in sol to the PDA
        // check if the seller has enough in his balance
        require!(
            seller.to_account_info().lamports() >= escrow.receive_amount,
            EscrowError::InsufficientBalance
        );

        msg!(
            "Lamports in sol vault: {}",
            sol_vault.to_account_info().lamports()
        );

        // check for overflow
        sol_vault
            .to_account_info()
            .lamports()
            .checked_add(escrow.receive_amount)
            .ok_or(EscrowError::OverFlow)?;

        let transfer_ctx = transfer(&seller.key(), &sol_vault.key(), escrow.receive_amount);

        invoke(
            &transfer_ctx,
            &[
                seller.to_account_info(),
                sol_vault.to_account_info(),
                system_program.to_account_info(),
            ],
        )?;
    } else {
        // Expecting the seller to send in token to the PDA
        // check if the seller has sufficient balance
        let mint = mint.unwrap();
        let from_ata = seller_ata.unwrap();
        let to_ata = escrow_ata.unwrap();

        require!(
            from_ata.amount > escrow.deposit_amount,
            EscrowError::InsufficientBalance
        );

        // check for overflow
        to_ata
            .amount
            .checked_add(escrow.receive_amount)
            .ok_or(EscrowError::OverFlow)?;

        let transfer_ctx = CpiContext::new(
            token_program.to_account_info(),
            TransferChecked {
                authority: seller.to_account_info(),
                mint: mint.to_account_info(),
                to: to_ata.to_account_info(),
                from: from_ata.to_account_info(),
            },
        );

        transfer_checked(transfer_ctx, escrow.receive_amount, mint.decimals)?;
    }

    escrow.state = EscrowState::AssetSent;

    // emit event
    emit!(EscrowAssetSent {
        escrow: escrow.key(),
        seller: escrow.seller,
        amount: escrow.receive_amount,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct SendAsset<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    /// CHECK: Mint of the token to transfer
    #[account(mut)]
    pub mint: Option<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        seeds = [ESCROW_SEED.as_bytes(), escrow.escrow_id.as_bytes(), escrow.buyer.as_ref(), seller.key().as_ref()],
        bump = escrow.bump,
        constraint = escrow.seller == seller.key() @ EscrowError::UnauthorizedSeller
    )]
    pub escrow: Account<'info, Escrow>,

    /// CHECK: PDA holding SOL deposits
    #[account(mut, seeds = [b"sol_vault", escrow.key().as_ref()], bump)]
    pub sol_vault: UncheckedAccount<'info>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = seller,
        associated_token::token_program = token_program
    )]
    pub seller_ata: Option<InterfaceAccount<'info, TokenAccount>>,

    #[account(
            init_if_needed,
            payer = seller,
            associated_token::mint = mint,
            associated_token::authority = escrow,
            associated_token::token_program = token_program
        )]
    pub escrow_ata: Option<InterfaceAccount<'info, TokenAccount>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
