use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum Direction {
    OnRamp,
    OffRamp,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum OrderStatus {
    Pending,
    Released,
    Refunded,
    Cancelled,
}

/// Singleton PDA holding global program configuration.
/// Seeds: `[b"state"]`
#[account]
#[derive(InitSpace)]
pub struct EscrowState {
    pub admin: Pubkey,
    pub relayer: Pubkey,
    pub fee_bps: u16,
    pub bump: u8,
}

/// Per-order PDA. Seeds: `[b"order", order_id]`
#[account]
#[derive(InitSpace)]
pub struct Order {
    pub order_id: [u8; 32],
    /// Customer wallet that receives crypto on release.
    pub recipient: Pubkey,
    /// Ops/relayer wallet that funded the escrow.
    pub funder: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub rate: u64,
    pub expiry: i64,
    pub direction: Direction,
    pub status: OrderStatus,
    pub bump: u8,
}

/// Per-token PDA accumulating platform fees until the admin sweeps them.
/// Seeds: `[b"fees", token_mint]`
#[account]
#[derive(InitSpace)]
pub struct FeeAccount {
    pub token_mint: Pubkey,
    pub accumulated: u64,
    pub bump: u8,
}
