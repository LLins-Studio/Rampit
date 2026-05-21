use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use crate::errors::RampitError;
use crate::events::OrderRefunded;
use crate::state::{EscrowState, Order, OrderStatus};

#[derive(Accounts)]
#[instruction(order_id: [u8; 32])]
pub struct RefundOrder<'info> {
    #[account(
        mut,
        close = relayer,
        seeds = [b"order", order_id.as_ref()],
        bump = order.bump,
        constraint = order.status == OrderStatus::Pending @ RampitError::OrderNotPending,
    )]
    pub order: Account<'info, Order>,

    #[account(seeds = [b"state"], bump = state.bump)]
    pub state: Account<'info, EscrowState>,

    #[account(
        mut,
        constraint = relayer.key() == state.relayer @ RampitError::Unauthorized,
    )]
    pub relayer: Signer<'info>,

    #[account(constraint = token_mint.key() == order.token_mint)]
    pub token_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = order.funder,
    )]
    pub funder_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = state,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn refund_order_handler(ctx: Context<RefundOrder>, _order_id: [u8; 32]) -> Result<()> {
    let order = &ctx.accounts.order;
    let state = &ctx.accounts.state;

    let seeds = &[b"state".as_ref(), &[state.bump]];
    let signer = &[&seeds[..]];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.funder_token_account.to_account_info(),
                authority: ctx.accounts.state.to_account_info(),
            },
            signer,
        ),
        order.amount,
    )?;

    emit!(OrderRefunded {
        order_id: order.order_id,
        funder: order.funder,
        amount: order.amount,
    });

    Ok(())
}
