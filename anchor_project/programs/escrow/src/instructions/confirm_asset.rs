use crate::{errors::EscrowError, events::EscrowReleased, state::*};
use anchor_lang::prelude::{program::invoke_signed, system_instruction::transfer, *};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{self, Token2022, TransferChecked},
    token_interface::{Mint, TokenAccount},
};

pub fn _confirm_asset(ctx: Context<ConfirmAsset>) -> Result<()> {
    let buyer = &mut ctx.accounts.buyer;
    let seller = &mut ctx.accounts.seller;
    let escrow = &mut ctx.accounts.escrow;
    let sol_vault = &mut ctx.accounts.sol_vault;
    let system_program = &mut ctx.accounts.system_program;
    let token_program = &mut ctx.accounts.token_program;

    let deposit_mint = ctx.accounts.deposit_mint.as_ref();
    let receive_mint = ctx.accounts.receive_mint.as_ref();
    let escrow_deposit_ata = ctx.accounts.escrow_deposit_ata.as_ref();
    let escrow_receive_ata = ctx.accounts.escrow_receive_ata.as_ref();
    let buyer_receive_ata = ctx.accounts.buyer_receive_ata.as_ref();
    let seller_receive_ata = ctx.accounts.seller_receive_ata.as_ref();
    let vault_bump = ctx.bumps.sol_vault;

    // let receive_decimal = receive_mint.decimals;
    // let deposit_decimal = deposit_mint.decimals;

    require!(
        escrow.expiry > Clock::get()?.unix_timestamp,
        EscrowError::EscrowExpired
    );

    require!(
        escrow.state == EscrowState::AssetSent,
        EscrowError::InvalidStateTransition
    );

    let escrow_seeds: &[&[u8]; 5] = &[
        ESCROW_SEED.as_bytes(),
        escrow.escrow_id.as_bytes(),
        escrow.buyer.as_ref(),
        escrow.seller.as_ref(),
        &[escrow.bump],
    ];

    let escrow_key: Pubkey = escrow.key();
    let escrow_key_ref: &[u8] = escrow_key.as_ref();
    let vault_seeds = &[b"sol_vault", escrow_key_ref, &[vault_bump]];
    let signer_seeds = &[&vault_seeds[..]];
    let escrow_signer_seeds = &[&escrow_seeds[..]];

    // Transfer seller asset to buyer
    if escrow.receive_mint != Pubkey::default() {
        let mint = receive_mint.unwrap();
        let from_ata = escrow_receive_ata.unwrap();
        let to_ata = buyer_receive_ata.unwrap();

        // Token tranfer
        let cpi_accounts = TransferChecked {
            from: from_ata.to_account_info(),
            mint: mint.to_account_info(),
            to: to_ata.to_account_info(),
            authority: escrow.to_account_info(),
        };

        let transfer_ctx = CpiContext::new_with_signer(
            token_program.to_account_info(),
            cpi_accounts,
            escrow_signer_seeds,
        );

        token_2022::transfer_checked(transfer_ctx, escrow.receive_amount, mint.decimals)?;
    } else {
        // SOl Transfer using invoke signed
        let transfer_ix = transfer(&sol_vault.key(), &buyer.key(), escrow.receive_amount);

        invoke_signed(
            &transfer_ix,
            &[
                sol_vault.to_account_info(),
                buyer.to_account_info(),
                system_program.to_account_info(),
            ],
            signer_seeds,
        )?;
    }

    // Transfer Buyer Asset to the Seller
    if escrow.deposit_mint != Pubkey::default() {
        // Token Transfer to seller
        let mint = deposit_mint.unwrap();
        let from_ata = escrow_deposit_ata.unwrap();
        let to_ata = seller_receive_ata.unwrap();
        // Token tranfer
        let cpi_accounts = TransferChecked {
            from: from_ata.to_account_info(),
            mint: mint.to_account_info(),
            to: to_ata.to_account_info(),
            authority: escrow.to_account_info(),
        };

        let transfer_ctx = CpiContext::new_with_signer(
            token_program.to_account_info(),
            cpi_accounts,
            escrow_signer_seeds,
        );

        token_2022::transfer_checked(transfer_ctx, escrow.deposit_amount, mint.decimals)?;
    } else {
        // Sol transfer to seller
        // Sol Transfer using invoke signed
        let transfer_ix = transfer(&sol_vault.key(), &seller.key(), escrow.deposit_amount);

        invoke_signed(
            &transfer_ix,
            &[
                sol_vault.to_account_info(),
                seller.to_account_info(),
                system_program.to_account_info(),
            ],
            signer_seeds,
        )?;
    }

    // handle the sending of funds to the buyer and the seller
    escrow.state = EscrowState::Released;

    emit!(EscrowReleased {
        escrow: escrow.key()
    });

    Ok(())
}

#[derive(Accounts)]
pub struct ConfirmAsset<'info> {
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
        constraint = escrow.state == EscrowState::AssetSent @ EscrowError::InvalidStateTransition
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

    #[account(mut)]
    pub escrow_deposit_ata: Option<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
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
