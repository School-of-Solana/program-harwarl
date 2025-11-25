use anchor_lang::prelude::{program::invoke_signed, system_instruction::transfer, *};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{self, Token2022, TransferChecked},
    token_interface::{Mint, TokenAccount},
};

use crate::{
    errors::EscrowError,
    events::EscrowBuyerRefund,
    state::{Escrow, EscrowState, ESCROW_SEED, SOL_VAULT_SEED},
};

pub fn _refund_buyer(ctx: Context<RefundBuyer>) -> Result<()> {
    let escrow = &ctx.accounts.escrow;

    // Check if it has not been released yet
    require!(
        escrow.state != EscrowState::Released && escrow.state != EscrowState::Closed,
        EscrowError::InvalidStateTransition
    );

    // Only allow refund if escrow was funded
    require!(
        escrow.state == EscrowState::Funded || escrow.state == EscrowState::AssetSent || escrow.state == EscrowState::SellerRefunded,
        EscrowError::NoDepositToRefund
    );


    require!(escrow.buyer_refund == false, EscrowError::AlreadyRefunded);

    let is_deposit_token = escrow.deposit_mint != Pubkey::default();

    // If its a valid token, verify the account
    if is_deposit_token {
        require!(
            ctx.accounts.deposit_mint.is_some()
                && ctx.accounts.escrow_deposit_ata.is_some()
                && ctx.accounts.buyer_ata.is_some(),
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

    if is_deposit_token {
        let mint = ctx.accounts.deposit_mint.as_ref().unwrap();
        let from_ata = ctx.accounts.escrow_deposit_ata.as_ref().unwrap();
        let to_ata = ctx.accounts.buyer_ata.as_ref().unwrap();

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

        token_2022::transfer_checked(transfer_ctx, escrow.deposit_amount, mint.decimals)?;
    } else {
        // SOl Transfer using invoke signed
        let transfer_ix = transfer(
            &ctx.accounts.sol_vault.key(),
            &ctx.accounts.buyer.key(),
            escrow.deposit_amount,
        );

        invoke_signed(
            &transfer_ix,
            &[
                ctx.accounts.sol_vault.to_account_info(),
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            vault_signer_seeds,
        )?;
    }

    // Set The buyer refund to true
    ctx.accounts.escrow.buyer_refund = true;

    // Set State to Refunded
    ctx.accounts.escrow.state = EscrowState::BuyerRefunded;

    // Set escrow as closed
    if ctx.accounts.escrow.seller_refund == true {
        ctx.accounts.escrow.state = EscrowState::Closed
    };

    // emit event
    emit!(EscrowBuyerRefund {
        escrow: ctx.accounts.escrow.key(),
        buyer: ctx.accounts.buyer.key(),
        amount: ctx.accounts.escrow.deposit_amount
    });

    Ok(())
}

#[derive(Accounts)]
pub struct RefundBuyer<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [ESCROW_SEED.as_bytes(), escrow.escrow_id.as_bytes(), buyer.key().as_ref(), escrow.seller.as_ref()],
        bump = escrow.bump,
        constraint = escrow.buyer == buyer.key() @ EscrowError::UnauthorizedBuyer,
    )]
    pub escrow: Account<'info, Escrow>,

    /// CHECK: PDA holding SOL deposits
    #[account(
        mut,
        seeds = [SOL_VAULT_SEED.as_bytes(), escrow.key().as_ref()],
        bump
    )]
    pub sol_vault: UncheckedAccount<'info>,

    // deposit mint
    #[account(mut)]
    pub deposit_mint: Option<InterfaceAccount<'info, Mint>>,

    // escrow deposit ata
    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = deposit_mint,
        associated_token::authority = escrow,
        associated_token::token_program = token_program
    )]
    pub escrow_deposit_ata: Option<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = deposit_mint,
        associated_token::authority = buyer,
        associated_token::token_program = token_program
    )]
    pub buyer_ata: Option<InterfaceAccount<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
