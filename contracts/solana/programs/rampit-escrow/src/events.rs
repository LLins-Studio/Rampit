use anchor_lang::prelude::*;
use crate::state::Direction;

#[event]
pub struct Initialized {
    pub admin: Pubkey,
    pub relayer: Pubkey,
    pub fee_bps: u16,
}

#[event]
pub struct OrderCreated {
    pub order_id: [u8; 32],
    pub recipient: Pubkey,
    pub funder: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub rate: u64,
    pub expiry: i64,
    pub direction: Direction,
}

#[event]
pub struct OrderReleased {
    pub order_id: [u8; 32],
    pub recipient: Pubkey,
    pub net_amount: u64,
    pub fee: u64,
}

#[event]
pub struct OrderRefunded {
    pub order_id: [u8; 32],
    pub funder: Pubkey,
    pub amount: u64,
}

#[event]
pub struct OrderCancelled {
    pub order_id: [u8; 32],
    pub funder: Pubkey,
    pub amount: u64,
}

#[event]
pub struct FeesCollected {
    pub token_mint: Pubkey,
    pub admin: Pubkey,
    pub amount: u64,
}

#[event]
pub struct RelayerUpdated {
    pub old_relayer: Pubkey,
    pub new_relayer: Pubkey,
}

#[event]
pub struct AdminTransferred {
    pub old_admin: Pubkey,
    pub new_admin: Pubkey,
}

#[event]
pub struct FeeUpdated {
    pub old_fee_bps: u16,
    pub new_fee_bps: u16,
}
