use crate::{errors::EscrowError, events::EscrowCancel, state::*};
use anchor_lang::prelude::{program::invoke_signed, system_instruction::transfer, *};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{self, Token2022, TransferChecked},
    token_interface::{Mint, TokenAccount},
};

pub fn _cancel_escrow(ctx: Context<CancelEscrow>) -> Result<()> {
    let buyer: &mut Signer<'_> = &mut ctx.accounts.buyer;
    let seller: &mut UncheckedAccount<'_> = &mut ctx.accounts.seller;
    let escrow: &mut Account<'_, Escrow> = &mut ctx.accounts.escrow;
    let escrow_deposit_ata = ctx.accounts.escrow_deposit_ata.as_ref();
    let escrow_receive_ata = ctx.accounts.escrow_receive_ata.as_ref();
    let buyer_receive_ata = ctx.accounts.buyer_receive_ata.as_ref();
    let seller_receive_ata = ctx.accounts.seller_receive_ata.as_ref();
    let system_program: &mut Program<'_, System> = &mut ctx.accounts.system_program;
    let token_program: &mut Program<'_, Token2022> = &mut ctx.accounts.token_program;
    let receive_mint = ctx.accounts.receive_mint.as_ref();
    let deposit_mint = ctx.accounts.deposit_mint.as_ref();

    // get signer seeds
    let escrow_seeds: &[&[u8]; 5] = &[
        ESCROW_SEED.as_bytes(),
        escrow.escrow_id.as_bytes(),
        escrow.buyer.as_ref(),
        escrow.seller.as_ref(),
        &[escrow.bump],
    ];

    let signer_seeds: &[&[&[u8]]; 1] = &[&escrow_seeds[..]];

    match escrow.state {
        EscrowState::Pending
        | EscrowState::Released
        | EscrowState::Cancel
        | EscrowState::Closed => {
            // Do nothing
        }
        EscrowState::Funded | EscrowState::Active => {
            // Means it has been funded and its active
            // Transfer Buyer asset to buyer
            if escrow.deposit_mint != Pubkey::default() {
                let mint = deposit_mint.unwrap();
                let from_ata = escrow_deposit_ata.unwrap();
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
                    signer_seeds,
                );

                token_2022::transfer_checked(transfer_ctx, escrow.deposit_amount, mint.decimals)?;
            } else {
                // Sol Transfer using invoke signed
                let transfer_ix = transfer(&escrow.key(), &buyer.key(), escrow.deposit_amount);

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
        }
        EscrowState::AssetSent => {
            // Meaning the seller has sent in the asset, Refund both side

            // Transfer Buyer asset to buyer
            if escrow.deposit_mint != Pubkey::default() {
                let mint = deposit_mint.unwrap();
                let from_ata = escrow_deposit_ata.unwrap();
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
                    signer_seeds,
                );

                token_2022::transfer_checked(transfer_ctx, escrow.deposit_amount, mint.decimals)?;
            } else {
                // Sol Transfer using invoke signed
                let transfer_ix = transfer(&escrow.key(), &buyer.key(), escrow.deposit_amount);

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

            // Transfer seller asset to seller
            if escrow.receive_mint != Pubkey::default() {
                let mint = receive_mint.unwrap();
                let from_ata = escrow_receive_ata.unwrap();
                let to_ata = seller_receive_ata.unwrap();

                let cpi_accounts = TransferChecked {
                    from: from_ata.to_account_info(),
                    mint: mint.to_account_info(),
                    to: to_ata.to_account_info(),
                    authority: escrow.to_account_info(),
                };

                let transfer_ctx = CpiContext::new_with_signer(
                    token_program.to_account_info(),
                    cpi_accounts,
                    signer_seeds,
                );

                token_2022::transfer_checked(transfer_ctx, escrow.receive_amount, mint.decimals)?;
            } else {
                // SOl Transfer using invoke signed
                let transfer_ix = transfer(&escrow.key(), &seller.key(), escrow.receive_amount);

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
        }
    }

    // Transfer seller asset to seller
    escrow.state = EscrowState::Cancel;

    emit!(EscrowCancel {
        escrow: escrow.key()
    });

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
        constraint = escrow.state == EscrowState::Released @ EscrowError::InvalidStateTransition
    )]
    pub escrow: Account<'info, Escrow>,

    /// CHECK: Mint of the deposit token to transfer
    pub deposit_mint: Option<InterfaceAccount<'info, Mint>>,

    /// CHECK: Mint of the deposit token to transfer
    pub receive_mint: Option<InterfaceAccount<'info, Mint>>,

    #[account(
            mut,
            associated_token::mint = deposit_mint,
            associated_token::authority = escrow,
            associated_token::token_program = token_program
        )]
    pub escrow_deposit_ata: Option<InterfaceAccount<'info, TokenAccount>>,

    #[account(
            mut,
            associated_token::mint = receive_mint,
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
