use crate::{
    errors::EscrowError,
    events::EscrowCompleted,
    state::{Escrow, EscrowState, ESCROW_SEED, SOL_VAULT_SEED},
};
use anchor_lang::prelude::{
    program::{invoke, invoke_signed},
    system_instruction::transfer,
    *,
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{self, Token2022, TransferChecked},
    token_interface::{Mint, TokenAccount},
};

pub fn _accept(ctx: Context<Accept>, escrow_id: String) -> Result<()> {
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
    let escrow_state = escrow.state;

    require!(
        escrow_state == EscrowState::Active,
        EscrowError::InvalidState
    );

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
    let is_receive_sol = escrow.receive_mint == Pubkey::default();

    // Transfer Token from receive mint to the escrow_authority and fund the receiver with deposited SOL
    if is_deposit_sol {
        // Transfer Receiver Token Out from the Receiver to the escrow Authority
        let mint = &ctx.accounts.receive_mint;
        let from_ata = &ctx.accounts.receiver_receive_mint_ata;
        let to_ata = &ctx.accounts.authority_receive_mint_ata;

        require!(
            mint.key() == escrow.receive_mint,
            EscrowError::InvalidReceiveMint
        );
        // Token tranfer
        let cpi_accounts = TransferChecked {
            from: from_ata.to_account_info(),
            mint: mint.to_account_info(),
            to: to_ata.to_account_info(),
            authority: receiver.to_account_info(),
        };

        let transfer_ctx = CpiContext::new(token_program.to_account_info(), cpi_accounts);

        token_2022::transfer_checked(transfer_ctx, escrow.receive_amount, mint.decimals)?;

        // Transfer SOl (deposit amount) From the Escrow Vault to the Receiver
        let transfer_ix = transfer(&sol_vault.key(), &receiver.key(), escrow.deposit_amount);

        invoke_signed(
            &transfer_ix,
            &[
                sol_vault.to_account_info(),
                receiver.to_account_info(),
                system_program.to_account_info(),
            ],
            vault_signer_seeds,
        )?;
    }

    // Transfer SOl from the receiver to the escrow authority
    // Transfer Deposit Mint from Escrow to the Receiver
    if is_receive_sol {
        // Transfer Deposit Token from the Escrow to the Receiver
        let mint = &ctx.accounts.deposit_mint;
        let from_ata = &ctx.accounts.escrow_deposit_mint_ata;
        let to_ata = &ctx.accounts.receiver_deposit_mint_ata;

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
        msg!("Transferred {} tokens to receiver", escrow.deposit_amount);

        // SOL from the receiver to The escrow Authority
        let transfer_ix = transfer(
            &receiver.key(),
            &escrow_authority.key(),
            escrow.receive_amount,
        );
        invoke(
            &transfer_ix,
            &[
                receiver.to_account_info(),
                escrow_authority.to_account_info(),
                system_program.to_account_info(),
            ],
        )?;
        msg!(
            "Transferred {} lamports SOL to authority",
            escrow.receive_amount
        );
    }

    escrow.state = EscrowState::Completed;

    emit!(EscrowCompleted {
        escrow: escrow.key(),
        escrow_authority: escrow_authority.key(),
        receiver: receiver.key()
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(escrow_id: String)]
pub struct Accept<'info> {
    #[account(mut)]
    receiver: Signer<'info>,

    /// CHECK: This is just the escrow authority account
    #[account(mut)]
    escrow_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [ESCROW_SEED.as_bytes(), escrow_id.as_bytes(), escrow_authority.key().as_ref(), receiver.key().as_ref()],
        bump = escrow.bump,
        constraint = receiver.key() == escrow.receiver @ EscrowError::UnauthorizedSigner
    )]
    pub escrow: Account<'info, Escrow>,

    /// CHECK: PDA holding SOL deposits
    #[account(mut, seeds = [SOL_VAULT_SEED.as_bytes(), escrow.key().as_ref()], bump)]
    pub sol_vault: UncheckedAccount<'info>,

    /// CHECK: Mint of the token to transfer
    #[account(mut)]
    pub deposit_mint: InterfaceAccount<'info, Mint>,

    //deposit mint token vault
    #[account(
            init_if_needed,
            payer = receiver,
            associated_token::mint = deposit_mint,
            associated_token::authority = escrow,
            associated_token::token_program = token_program
        )]
    pub escrow_deposit_mint_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
            init_if_needed,
            payer = receiver,
            associated_token::mint = deposit_mint,
            associated_token::authority = receiver,
            associated_token::token_program = token_program
        )]
    pub receiver_deposit_mint_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
            init_if_needed,
            payer = receiver,
            associated_token::mint = deposit_mint,
            associated_token::authority = escrow_authority,
            associated_token::token_program = token_program
        )]
    pub authority_deposit_mint_ata: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: Mint of the token to transfer
    #[account(mut)]
    pub receive_mint: InterfaceAccount<'info, Mint>,

    #[account(
            init_if_needed,
            payer = receiver,
            associated_token::mint = receive_mint,
            associated_token::authority = receiver,
            associated_token::token_program = token_program
        )]
    pub receiver_receive_mint_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
            init_if_needed,
            payer = receiver,
            associated_token::mint = receive_mint,
            associated_token::authority = escrow_authority,
            associated_token::token_program = token_program
        )]
    pub authority_receive_mint_ata: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
