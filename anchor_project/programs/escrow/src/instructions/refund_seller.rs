use anchor_lang::prelude::{program::invoke_signed, system_instruction::transfer, *};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{self, Token2022, TransferChecked},
    token_interface::{Mint, TokenAccount},
};

use crate::{
    errors::EscrowError,
    events::EscrowSellerRefund,
    state::{Escrow, EscrowState, ESCROW_SEED, SOL_VAULT_SEED},
};

pub fn _refund_seller(ctx: Context<RefundSeller>) -> Result<()> {
    let escrow = &ctx.accounts.escrow;

    // Check if it has not been released yet
    require!(
        escrow.state != EscrowState::Released && escrow.state != EscrowState::Closed,
        EscrowError::InvalidStateTransition
    );

    // Only allow refund if escrow was funded
    require!(
        escrow.state == EscrowState::Funded
            || escrow.state == EscrowState::Active
            || escrow.state == EscrowState::AssetSent || escrow.state == EscrowState::BuyerRefunded,
        EscrowError::NoDepositToRefund
    );

    require!(escrow.seller_refund == false, EscrowError::AlreadyRefunded);

    let is_receive_token = escrow.receive_mint != Pubkey::default();

    // If its a valid token, verify the account
    if is_receive_token {
        require!(
            ctx.accounts.receive_mint.is_some()
                && ctx.accounts.escrow_receive_ata.is_some()
                && ctx.accounts.seller_ata.is_some(),
            EscrowError::MissingDepositAccounts
        );
    };

    // values needed
    let escrow_bump = escrow.bump;
    let escrow_id = escrow.escrow_id.clone();
    let buyer_key = escrow.buyer;
    let seller_key = escrow.seller;
    let escrow_key = escrow.key();

    // get signer seeds
    let escrow_seeds: &[&[u8]; 5] = &[
        ESCROW_SEED.as_bytes(),
        escrow_id.as_bytes(),
        buyer_key.as_ref(),
        seller_key.as_ref(),
        &[escrow_bump],
    ];

    let signer_seeds: &[&[&[u8]]; 1] = &[&escrow_seeds[..]];

    // getvault signer seeds
    let vault_seeds = &[b"sol_vault", escrow_key.as_ref(), &[ctx.bumps.sol_vault]];
    let vault_signer_seeds = &[&vault_seeds[..]];

    // refund the seller
    if is_receive_token {
        let mint = ctx.accounts.receive_mint.as_ref().unwrap();
        let from_ata = ctx.accounts.escrow_receive_ata.as_ref().unwrap();
        let to_ata = ctx.accounts.seller_ata.as_ref().unwrap();

        let cpi_accounts = TransferChecked {
            from: from_ata.to_account_info(),
            mint: mint.to_account_info(),
            to: to_ata.to_account_info(),
            authority: escrow.to_account_info(),
        };

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );

        token_2022::transfer_checked(transfer_ctx, escrow.receive_amount, mint.decimals)?;
    } else {
        // SOl Transfer using invoke signed
        let transfer_ix = transfer(
            &ctx.accounts.sol_vault.key(),
            &ctx.accounts.seller.key(),
            escrow.receive_amount,
        );

        invoke_signed(
            &transfer_ix,
            &[
                ctx.accounts.sol_vault.to_account_info(),
                ctx.accounts.seller.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            vault_signer_seeds,
        )?;
    }

    // Set The seller refund to true
    ctx.accounts.escrow.seller_refund = true;

    // Set State
    ctx.accounts.escrow.state = EscrowState::SellerRefunded;

    // Set escrow as closed
    if ctx.accounts.escrow.buyer_refund == true {
        ctx.accounts.escrow.state = EscrowState::Closed
    };

    // emit event
    emit!(EscrowSellerRefund {
        escrow: ctx.accounts.escrow.key(),
        seller: ctx.accounts.seller.key(),
        amount: ctx.accounts.escrow.receive_amount
    });

    Ok(())
}

#[derive(Accounts)]
pub struct RefundSeller<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        mut,
        seeds = [ESCROW_SEED.as_bytes(), escrow.escrow_id.as_bytes(), escrow.buyer.as_ref(), seller.key().as_ref()],
        bump = escrow.bump,
        constraint = escrow.seller == seller.key() @ EscrowError::UnauthorizedSeller,
    )]
    pub escrow: Account<'info, Escrow>,

    /// CHECK: PDA holding SOL deposits
    #[account(
        mut,
        seeds = [SOL_VAULT_SEED.as_bytes(), escrow.key().as_ref()],
        bump
    )]
    pub sol_vault: UncheckedAccount<'info>,

    // receive mint
    #[account(mut)]
    pub receive_mint: Option<InterfaceAccount<'info, Mint>>,

    // escrow receive ata
    #[account(
        init_if_needed,
        payer = seller,
        associated_token::mint = receive_mint,
        associated_token::authority = escrow,
        associated_token::token_program = token_program
    )]
    pub escrow_receive_ata: Option<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = seller,
        associated_token::mint = receive_mint,
        associated_token::authority = seller,
        associated_token::token_program = token_program
    )]
    pub seller_ata: Option<InterfaceAccount<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
