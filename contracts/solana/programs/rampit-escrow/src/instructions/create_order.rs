use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};
use crate::errors::RampitError;
use crate::events::OrderCreated;
use crate::state::{Direction, EscrowState, Order, OrderStatus};

#[derive(Accounts)]
#[instruction(order_id: [u8; 32])]
pub struct CreateOrder<'info> {
    #[account(
        mut,
        constraint = relayer.key() == state.relayer @ RampitError::Unauthorized,
    )]
    pub relayer: Signer<'info>,

    /// Customer payout address (does not sign).
    /// CHECK: Only stored on the order account.
    pub recipient: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,

    #[account(
        init,
        payer = relayer,
        space = 8 + Order::INIT_SPACE,
        seeds = [b"order", order_id.as_ref()],
        bump,
    )]
    pub order: Box<Account<'info, Order>>,

    #[account(seeds = [b"state"], bump = state.bump)]
    pub state: Box<Account<'info, EscrowState>>,

    pub token_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = relayer,
    )]
    pub relayer_token_account: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = relayer,
        associated_token::mint = token_mint,
        associated_token::authority = state,
    )]
    pub escrow_token_account: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

/// Relayer locks SPL tokens into escrow for an on-ramp order.
pub fn create_order_handler(
    ctx: Context<CreateOrder>,
    order_id: [u8; 32],
    amount: u64,
    rate: u64,
    expiry: i64,
    direction: Direction,
) -> Result<()> {
    require!(amount > 0, RampitError::InvalidAmount);

    let clock = Clock::get()?;
    require!(expiry > clock.unix_timestamp, RampitError::InvalidExpiry);

    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.relayer_token_account.to_account_info(),
                to: ctx.accounts.escrow_token_account.to_account_info(),
                authority: ctx.accounts.relayer.to_account_info(),
            },
        ),
        amount,
    )?;

    let order = ctx.accounts.order.as_mut();
    order.order_id = order_id;
    order.recipient = ctx.accounts.recipient.key();
    order.funder = ctx.accounts.relayer.key();
    order.token_mint = ctx.accounts.token_mint.key();
    order.amount = amount;
    order.rate = rate;
    order.expiry = expiry;
    order.direction = direction;
    order.status = OrderStatus::Pending;
    order.bump = ctx.bumps.order;

    emit!(OrderCreated {
        order_id,
        recipient: order.recipient,
        funder: order.funder,
        token_mint: order.token_mint,
        amount,
        rate,
        expiry,
        direction,
    });

    Ok(())
}
