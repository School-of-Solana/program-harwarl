use anchor_lang::prelude::{program::invoke_signed, system_instruction::transfer, *};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{self, Token2022, TransferChecked},
    token_interface::{Mint, TokenAccount},
};

use crate::{
    errors::EscrowError,
    events::EscrowClosed,
    state::{Escrow, EscrowState, ESCROW_SEED, SOL_VAULT_SEED},
};

pub fn _close(ctx: Context<Close>, escrow_id: String) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    let sol_vault = &mut ctx.accounts.sol_vault;
    let escrow_authority = &mut ctx.accounts.escrow_authority;
    let receiver = &mut ctx.accounts.receiver;
    let system_program = &mut ctx.accounts.system_program;
    let token_program = &mut ctx.accounts.token_program;

    let vault_bump = ctx.bumps.sol_vault;

    let escrow_id_bytes = escrow_id.as_bytes();
    let escrow_authority_key = escrow_authority.key();
    let receiver_key = receiver.key();
    let escrow_key = escrow.key();
    let escrow_bump_ref = &[escrow.bump];

    // get signer seeds
    let escrow_seeds: &[&[u8]; 5] = &[
        ESCROW_SEED.as_bytes(),
        escrow_id_bytes,
        escrow_authority_key.as_ref(),
        receiver_key.as_ref(),
        escrow_bump_ref,
    ];

    let signer_seeds = &[&escrow_seeds[..]];

    // getvault signer seeds
    let vault_seeds = &[
        SOL_VAULT_SEED.as_bytes(),
        escrow_key.as_ref(),
        &[vault_bump],
    ];
    let vault_signer_seeds = &[&vault_seeds[..]];

    let is_deposit_sol = escrow.deposit_mint == Pubkey::default();

    match escrow.state {
        EscrowState::Active => {
            // Means its definitely funded
            if is_deposit_sol {
                // Transfer SOl (deposit amount) From the Escrow Vault to the Receiver
                let transfer_ix = transfer(
                    &sol_vault.key(),
                    &escrow_authority.key(),
                    escrow.deposit_amount,
                );

                invoke_signed(
                    &transfer_ix,
                    &[
                        sol_vault.to_account_info(),
                        escrow_authority.to_account_info(),
                        system_program.to_account_info(),
                    ],
                    vault_signer_seeds,
                )?;
            } else {
                // Transfer Deposit Token Out from the Escrow Vault to the escrow Authority
                let mint = ctx.accounts.deposit_mint.as_ref().unwrap();
                let from_ata = ctx.accounts.token_vault.as_ref().unwrap();
                let to_ata = ctx.accounts.authority_token_vault.as_ref().unwrap();

                require!(
                    mint.key() == escrow.deposit_mint,
                    EscrowError::InvalidDepositMint
                );

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
            }
        }
        _ => {}
    }

    escrow.state = EscrowState::Closed;

    emit!(EscrowClosed {
        escrow: escrow.key(),
        escrow_authority: escrow_authority.key(),
        receiver: receiver.key()
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(escrow_id: String)]
pub struct Close<'info> {
    #[account(mut)]
    escrow_authority: Signer<'info>,

    /// CHECK: account of the receiver
    #[account(mut)]
    receiver: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [ESCROW_SEED.as_bytes(), escrow_id.as_bytes(), escrow_authority.key().as_ref(), receiver.key().as_ref()],
        bump = escrow.bump,
        constraint = escrow_authority.key() == escrow.escrow_authority @ EscrowError::UnauthorizedSigner,
        constraint = receiver.key() == escrow.receiver @ EscrowError::UnauthorizedSigner,
        close = escrow_authority
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
