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
    let escrow_deposit_ata = &mut ctx.accounts.escrow_deposit_ata;
    let escrow_receive_ata = &mut ctx.accounts.escrow_receive_ata;
    let buyer_receive_ata = &mut ctx.accounts.buyer_receive_ata;
    let seller_receive_ata = &mut ctx.accounts.seller_receive_ata;
    let system_program = &mut ctx.accounts.system_program;
    let token_program = &mut ctx.accounts.token_program;
    let receive_mint = &mut ctx.accounts.receive_mint;
    let deposit_mint = &mut ctx.accounts.deposit_mint;
    let receive_decimal = receive_mint.decimals;
    let deposit_decimal = deposit_mint.decimals;

    require!(
        escrow.expiry > Clock::get()?.unix_timestamp,
        EscrowError::EscrowExpired
    );

    let escrow_seeds: &[&[u8]; 5] = &[
        ESCROW_SEED.as_bytes(),
        escrow.escrow_id.as_bytes(),
        escrow.buyer.as_ref(),
        escrow.seller.as_ref(),
        &[escrow.bump],
    ];

    let signer_seeds = &[&escrow_seeds[..]];

    // Transfer seller asset to buyer
    if escrow.receive_mint != Pubkey::default() {
        // Token tranfer
        let cpi_accounts = TransferChecked {
            from: escrow_receive_ata.to_account_info(),
            mint: receive_mint.to_account_info(),
            to: buyer_receive_ata.to_account_info(),
            authority: escrow_receive_ata.to_account_info(),
        };

        let transfer_ctx = CpiContext::new_with_signer(
            token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );

        token_2022::transfer_checked(transfer_ctx, escrow.receive_amount, receive_decimal)?;
    } else {
        // SOl Transfer using invoke signed
        let transfer_ix = transfer(&escrow.key(), &buyer.key(), escrow.receive_amount);

        invoke_signed(
            &transfer_ix,
            &[
                escrow.to_account_info(),
                buyer.to_account_info(),
                system_program.to_account_info(),
            ],
            signer_seeds,
        )?;
    }

    // Transfer Buyer Asset to the Seller
    if escrow.deposit_mint != Pubkey::default() {
        // Token Transfer to seller
        // Token tranfer
        let cpi_accounts = TransferChecked {
            from: escrow_deposit_ata.to_account_info(),
            mint: deposit_mint.to_account_info(),
            to: seller_receive_ata.to_account_info(),
            authority: escrow_deposit_ata.to_account_info(),
        };

        let transfer_ctx = CpiContext::new_with_signer(
            token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );

        token_2022::transfer_checked(transfer_ctx, escrow.deposit_amount, deposit_decimal)?;
    } else {
        // Sol transfer to seller
        // Sol Transfer using invoke signed
        let transfer_ix = transfer(&escrow.key(), &seller.key(), escrow.deposit_amount);

        invoke_signed(
            &transfer_ix,
            &[
                escrow.to_account_info(),
                seller.to_account_info(),
                system_program.to_account_info(),
            ],
            signer_seeds,
        )?;
    }

    // handle the sending of funds to the buyer and the seller
    escrow.state = EscrowState::Released;

    emit!(
        EscrowReleased {
            escrow: escrow.key()
        }
    );

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

    /// CHECK: Mint of the deposit token to transfer
    pub deposit_mint: InterfaceAccount<'info, Mint>,

    /// CHECK: Mint of the deposit token to transfer
    pub receive_mint: InterfaceAccount<'info, Mint>,

    #[account(
            mut,
            associated_token::mint = deposit_mint,
            associated_token::authority = escrow,
            associated_token::token_program = token_program
        )]
    pub escrow_deposit_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
            mut,
            associated_token::mint = receive_mint,
            associated_token::authority = escrow,
            associated_token::token_program = token_program
        )]
    pub escrow_receive_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = receive_mint,
        associated_token::authority = buyer,
        associated_token::token_program = token_program,
    )]
    pub buyer_receive_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = seller,
        associated_token::mint = deposit_mint,
        associated_token::authority = seller,
        associated_token::token_program = token_program,
    )]
    pub seller_receive_ata: InterfaceAccount<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
