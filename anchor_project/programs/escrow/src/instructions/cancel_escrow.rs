use crate::{errors::EscrowError, escrow, events::EscrowCancel, state::*};
use anchor_lang::prelude::{program::invoke_signed, system_instruction::transfer, *};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{self, Token2022, TransferChecked},
    token_interface::{Mint, TokenAccount},
};

pub fn _cancel_escrow(ctx: Context<CancelEscrow>) -> Result<()> {

    // validate Accounts
    validate_account(&ctx)?;

    let escrow_state = ctx.accounts.escrow.state;
    let escrow_bump = ctx.accounts.escrow.bump;
    let escrow_id = ctx.accounts.escrow.escrow_id.clone();
    let buyer = ctx.accounts.escrow.buyer;
    let seller = ctx.accounts.escrow.seller;
    let escrow_key = ctx.accounts.escrow.key();
    let vault_bump = ctx.bumps.sol_vault;

    // get signer seeds
    let escrow_seeds: &[&[u8]; 5] = &[
        ESCROW_SEED.as_bytes(),
        escrow_id.as_bytes(),
        buyer.as_ref(),
        seller.as_ref(),
        &[escrow_bump],
    ];

    let signer_seeds: &[&[&[u8]]; 1] = &[&escrow_seeds[..]];

    let escrow_key: Pubkey = escrow_key;
    let escrow_key_ref: &[u8] = escrow_key.as_ref();
    let vault_seeds = &[b"sol_vault", escrow_key_ref, &[vault_bump]];
    let vault_signer_seeds = &[&vault_seeds[..]];

    match escrow_state {
        EscrowState::Funded | EscrowState::Active => {
            // Means it has been funded and its active
            // Transfer Buyer asset to buyer
            refund_deposit(&ctx, signer_seeds, vault_signer_seeds)?;
        }
        EscrowState::AssetSent => {
            // Meaning the seller has sent in the asset, Refund both side
            refund_deposit(&ctx, signer_seeds, vault_signer_seeds)?;
            refund_receive(&ctx, signer_seeds, vault_signer_seeds)?;
        }
        _ => {} // Other escrow States
    };

    // Transfer seller asset to seller
    let escrow = &mut ctx.accounts.escrow;
    escrow.state = EscrowState::Cancel;

    emit!(EscrowCancel {
        escrow: escrow.key()
    });

    Ok(())
}

fn validate_account(ctx: &Context<CancelEscrow>) -> Result<()> {
    
    let escrow = &ctx.accounts.escrow;
    
    let is_deposit_token = escrow.deposit_mint != Pubkey::default();
    let is_receive_token = escrow.receive_mint != Pubkey::default();
    
    // Validate deposit account,
    if is_deposit_token {
        require!(
            ctx.accounts.deposit_mint.is_some(),
            EscrowError::InvalidDepositMint
        );

        require!(
            ctx.accounts.deposit_mint.as_ref().unwrap().key() == escrow.deposit_mint,
            EscrowError::InvalidDepositMint
        );
    }

    // Validate the receive account,
    if is_receive_token && escrow.state == EscrowState::AssetSent {
        require!(
            ctx.accounts.receive_mint.is_some(),
            EscrowError::InvalidReceiveMint
        );

        require!(
            ctx.accounts.receive_mint.as_ref().unwrap().key() == escrow.receive_mint,
            EscrowError::InvalidReceiveMint
        );
    }

    Ok(())
}

fn refund_receive(
    ctx: &Context<CancelEscrow>,
    signer_seeds: &[&[&[u8]]],
    vault_signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    let escrow = &ctx.accounts.escrow;

    if escrow.receive_mint != Pubkey::default() {
        let mint = ctx.accounts.receive_mint.as_ref().unwrap();
        let from_ata = ctx.accounts.escrow_receive_ata.as_ref().unwrap();
        let to_ata = ctx.accounts.seller_receive_ata.as_ref().unwrap();

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

    Ok(())
}

fn refund_deposit(
    ctx: &Context<CancelEscrow>,
    signer_seeds: &[&[&[u8]]],
    vault_signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    let escrow = &ctx.accounts.escrow;

    if escrow.deposit_mint != Pubkey::default() {
        let mint = ctx.accounts.deposit_mint.as_ref().unwrap();
        let from_ata = ctx.accounts.escrow_deposit_ata.as_ref().unwrap();
        let to_ata = ctx.accounts.buyer_receive_ata.as_ref().unwrap();
        // Token tranfer
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
        // Sol Transfer using invoke signed
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
    Ok(())
}

#[derive(Accounts)]
pub struct CancelEscrow<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: seller is only for sol/account transfers
    #[account(mut)]
    pub seller: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [ESCROW_SEED.as_bytes(), escrow.escrow_id.as_bytes(), escrow.buyer.as_ref(), escrow.seller.key().as_ref()],
        bump = escrow.bump,
        constraint = buyer.key() == escrow.buyer @ EscrowError::UnauthorizedBuyer,
        constraint = seller.key() == escrow.seller @ EscrowError::UnauthorizedSeller,
        // constraint = escrow.state == EscrowState::Released @ EscrowError::InvalidStateTransition
    )]
    pub escrow: Account<'info, Escrow>,

    /// CHECK: PDA holding SOL deposits
    #[account(
    mut,
    seeds = [b"sol_vault", escrow.key().as_ref()],
    bump,
    )]
    pub sol_vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub deposit_mint: Option<InterfaceAccount<'info, Mint>>,

    #[account(mut)]
    pub receive_mint: Option<InterfaceAccount<'info, Mint>>,

    #[account(
            mut,
            associated_token::mint = escrow.deposit_mint,
            associated_token::authority = escrow,
            associated_token::token_program = token_program
        )]
    pub escrow_deposit_ata: Option<InterfaceAccount<'info, TokenAccount>>,

    #[account(
            mut,
            associated_token::mint = escrow.receive_mint,
            associated_token::authority = escrow,
            associated_token::token_program = token_program
        )]
    pub escrow_receive_ata: Option<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = receive_mint,
        associated_token::authority = buyer,
        associated_token::token_program = token_program,
    )]
    pub buyer_receive_ata: Option<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = seller,
        associated_token::mint = deposit_mint,
        associated_token::authority = seller,
        associated_token::token_program = token_program,
    )]
    pub seller_receive_ata: Option<InterfaceAccount<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
