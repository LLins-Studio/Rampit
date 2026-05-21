use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;
use state::Direction;

// Replace with your deployed program ID after `anchor keys list`.
declare_id!("Cpdpas52WbHgLeXMvb4NSeJV4AzsbX8NFdyEHQY22LJx");

#[program]
pub mod rampit_escrow {
    use super::*;

    /// One-time initialization.  Sets admin = signer, relayer = admin,
    /// and the platform fee in basis points.
    pub fn initialize(ctx: Context<Initialize>, fee_bps: u16) -> Result<()> {
        instructions::initialize::initialize_handler(ctx, fee_bps)
    }

    /// Create an on-ramp order. Relayer locks SPL tokens; recipient receives on release.
    pub fn create_order(
        ctx: Context<CreateOrder>,
        order_id: [u8; 32],
        amount: u64,
        rate: u64,
        expiry: i64,
        direction: Direction,
    ) -> Result<()> {
        instructions::create_order::create_order_handler(ctx, order_id, amount, rate, expiry, direction)
    }

    /// Release order (relayer only). Deducts fee, sends net to recipient, closes order PDA.
    pub fn release_order(ctx: Context<ReleaseOrder>, order_id: [u8; 32]) -> Result<()> {
        instructions::release_order::release_order_handler(ctx, order_id)
    }

    /// Refund order (relayer only). Full amount to funder. Closes the order PDA.
    pub fn refund_order(ctx: Context<RefundOrder>, order_id: [u8; 32]) -> Result<()> {
        instructions::refund_order::refund_order_handler(ctx, order_id)
    }

    /// Cancel order (relayer only, before expiry). Full amount to funder.
    pub fn cancel_order(ctx: Context<CancelOrder>, order_id: [u8; 32]) -> Result<()> {
        instructions::cancel_order::cancel_order_handler(ctx, order_id)
    }

    /// Sweep accumulated fees for a token to the admin's ATA.
    pub fn collect_fees(ctx: Context<CollectFees>) -> Result<()> {
        instructions::collect_fees::collect_fees_handler(ctx)
    }

    /// Update the relayer address (admin only).
    pub fn set_relayer(ctx: Context<SetRelayer>, new_relayer: Pubkey) -> Result<()> {
        instructions::admin::set_relayer_handler(ctx, new_relayer)
    }

    /// Transfer admin role (admin only, direct — no two-step needed on Solana).
    pub fn set_admin(ctx: Context<SetAdmin>, new_admin: Pubkey) -> Result<()> {
        instructions::admin::set_admin_handler(ctx, new_admin)
    }

    /// Update fee in basis points (admin only, max 10 000).
    pub fn set_fee(ctx: Context<SetFee>, fee_bps: u16) -> Result<()> {
        instructions::admin::set_fee_handler(ctx, fee_bps)
    }
}
