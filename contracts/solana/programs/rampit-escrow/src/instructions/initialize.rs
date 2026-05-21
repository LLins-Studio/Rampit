use anchor_lang::prelude::*;
use crate::errors::RampitError;
use crate::events::Initialized;
use crate::state::EscrowState;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + EscrowState::INIT_SPACE,
        seeds = [b"state"],
        bump,
    )]
    pub state: Account<'info, EscrowState>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

/// One-time program setup.  Anchor's `init` constraint guarantees this
/// can only succeed once (the PDA already exists on a second call).
pub fn initialize_handler(ctx: Context<Initialize>, fee_bps: u16) -> Result<()> {
    require!(fee_bps <= 10_000, RampitError::InvalidFeeBps);

    let state = &mut ctx.accounts.state;
    state.admin = ctx.accounts.admin.key();
    state.relayer = ctx.accounts.admin.key();
    state.fee_bps = fee_bps;
    state.bump = ctx.bumps.state;

    emit!(Initialized {
        admin: state.admin,
        relayer: state.relayer,
        fee_bps,
    });

    Ok(())
}
