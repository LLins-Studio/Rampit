use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};
use crate::errors::RampitError;
use crate::events::OrderReleased;
use crate::state::{EscrowState, FeeAccount, Order, OrderStatus};

#[derive(Accounts)]
#[instruction(order_id: [u8; 32])]
pub struct ReleaseOrder<'info> {
    #[account(
        mut,
        close = relayer,
        seeds = [b"order", order_id.as_ref()],
        bump = order.bump,
        constraint = order.status == OrderStatus::Pending @ RampitError::OrderNotPending,
    )]
    pub order: Box<Account<'info, Order>>,

    #[account(seeds = [b"state"], bump = state.bump)]
    pub state: Box<Account<'info, EscrowState>>,

    #[account(
        mut,
        constraint = relayer.key() == state.relayer @ RampitError::Unauthorized,
    )]
    pub relayer: Signer<'info>,

    /// CHECK: Customer payout address stored on the order.
    #[account(
        constraint = recipient.key() == order.recipient @ RampitError::Unauthorized,
    )]
    pub recipient: UncheckedAccount<'info>,

    #[account(constraint = token_mint.key() == order.token_mint)]
    pub token_mint: Box<Account<'info, Mint>>,

    #[account(
        init_if_needed,
        payer = relayer,
        associated_token::mint = token_mint,
        associated_token::authority = recipient,
    )]
    pub recipient_token_account: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = state,
    )]
    pub escrow_token_account: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = relayer,
        space = 8 + FeeAccount::INIT_SPACE,
        seeds = [b"fees", token_mint.key().as_ref()],
        bump,
    )]
    pub fee_account: Box<Account<'info, FeeAccount>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn release_order_handler(ctx: Context<ReleaseOrder>, _order_id: [u8; 32]) -> Result<()> {
    let order = ctx.accounts.order.as_ref();
    let state = ctx.accounts.state.as_ref();

    let fee = (order.amount as u128)
        .checked_mul(state.fee_bps as u128)
        .and_then(|v| v.checked_div(10_000))
        .ok_or(RampitError::Overflow)? as u64;
    let net_amount = order.amount.checked_sub(fee).ok_or(RampitError::Overflow)?;

    let seeds = &[b"state".as_ref(), &[state.bump]];
    let signer = &[&seeds[..]];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.recipient_token_account.to_account_info(),
                authority: ctx.accounts.state.to_account_info(),
            },
            signer,
        ),
        net_amount,
    )?;

    let fee_account = ctx.accounts.fee_account.as_mut();
    if fee_account.token_mint == Pubkey::default() {
        fee_account.token_mint = order.token_mint;
        fee_account.bump = ctx.bumps.fee_account;
    }
    fee_account.accumulated = fee_account
        .accumulated
        .checked_add(fee)
        .ok_or(RampitError::Overflow)?;

    emit!(OrderReleased {
        order_id: order.order_id,
        recipient: order.recipient,
        net_amount,
        fee,
    });

    Ok(())
}
