use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use crate::errors::RampitError;
use crate::events::FeesCollected;
use crate::state::{EscrowState, FeeAccount};

#[derive(Accounts)]
pub struct CollectFees<'info> {
    #[account(seeds = [b"state"], bump = state.bump)]
    pub state: Account<'info, EscrowState>,

    #[account(
        constraint = admin.key() == state.admin @ RampitError::Unauthorized,
    )]
    pub admin: Signer<'info>,

    pub token_mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"fees", token_mint.key().as_ref()],
        bump = fee_account.bump,
        constraint = fee_account.accumulated > 0 @ RampitError::NoFeesToCollect,
    )]
    pub fee_account: Account<'info, FeeAccount>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = state,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = admin,
    )]
    pub admin_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

/// Admin-only.  Sweeps all accumulated fees for a token to the admin's ATA
/// and resets the fee counter to zero.
pub fn collect_fees_handler(ctx: Context<CollectFees>) -> Result<()> {
    let state = &ctx.accounts.state;
    let fee_account = &mut ctx.accounts.fee_account;
    let amount = fee_account.accumulated;

    let seeds = &[b"state".as_ref(), &[state.bump]];
    let signer = &[&seeds[..]];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.admin_token_account.to_account_info(),
                authority: ctx.accounts.state.to_account_info(),
            },
            signer,
        ),
        amount,
    )?;

    fee_account.accumulated = 0;

    emit!(FeesCollected {
        token_mint: fee_account.token_mint,
        admin: state.admin,
        amount,
    });

    Ok(())
}
