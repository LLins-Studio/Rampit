use anchor_lang::prelude::*;
use crate::errors::RampitError;
use crate::events::{AdminTransferred, FeeUpdated, RelayerUpdated};
use crate::state::EscrowState;

// =========================================================================
//  SetRelayer
// =========================================================================

#[derive(Accounts)]
pub struct SetRelayer<'info> {
    #[account(
        mut,
        seeds = [b"state"],
        bump = state.bump,
    )]
    pub state: Account<'info, EscrowState>,

    #[account(constraint = admin.key() == state.admin @ RampitError::Unauthorized)]
    pub admin: Signer<'info>,
}

pub fn set_relayer_handler(ctx: Context<SetRelayer>, new_relayer: Pubkey) -> Result<()> {
    let state = &mut ctx.accounts.state;
    let old = state.relayer;
    state.relayer = new_relayer;

    emit!(RelayerUpdated {
        old_relayer: old,
        new_relayer,
    });
    Ok(())
}

// =========================================================================
//  SetAdmin
// =========================================================================

#[derive(Accounts)]
pub struct SetAdmin<'info> {
    #[account(
        mut,
        seeds = [b"state"],
        bump = state.bump,
    )]
    pub state: Account<'info, EscrowState>,

    #[account(constraint = admin.key() == state.admin @ RampitError::Unauthorized)]
    pub admin: Signer<'info>,
}

/// Direct admin transfer.  Two-step is unnecessary on Solana because
/// signer authorization is explicit — the current admin must sign.
pub fn set_admin_handler(ctx: Context<SetAdmin>, new_admin: Pubkey) -> Result<()> {
    let state = &mut ctx.accounts.state;
    let old = state.admin;
    state.admin = new_admin;

    emit!(AdminTransferred {
        old_admin: old,
        new_admin,
    });
    Ok(())
}

// =========================================================================
//  SetFee
// =========================================================================

#[derive(Accounts)]
pub struct SetFee<'info> {
    #[account(
        mut,
        seeds = [b"state"],
        bump = state.bump,
    )]
    pub state: Account<'info, EscrowState>,

    #[account(constraint = admin.key() == state.admin @ RampitError::Unauthorized)]
    pub admin: Signer<'info>,
}

pub fn set_fee_handler(ctx: Context<SetFee>, fee_bps: u16) -> Result<()> {
    require!(fee_bps <= 10_000, RampitError::InvalidFeeBps);

    let state = &mut ctx.accounts.state;
    let old = state.fee_bps;
    state.fee_bps = fee_bps;

    emit!(FeeUpdated {
        old_fee_bps: old,
        new_fee_bps: fee_bps,
    });
    Ok(())
}
