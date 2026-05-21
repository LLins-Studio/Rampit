use anchor_lang::prelude::*;

#[error_code]
pub enum RampitError {
    #[msg("Contract is already initialized")]
    AlreadyInitialized,

    #[msg("Contract has not been initialized")]
    NotInitialized,

    #[msg("Caller is not authorized for this action")]
    Unauthorized,

    #[msg("Order not found")]
    OrderNotFound,

    #[msg("An order with this ID already exists")]
    OrderAlreadyExists,

    #[msg("Amount must be greater than zero")]
    InvalidAmount,

    #[msg("Expiry must be in the future")]
    InvalidExpiry,

    #[msg("Order is not in Pending status")]
    OrderNotPending,

    #[msg("Order has expired")]
    OrderExpired,

    #[msg("Order has not expired yet")]
    OrderNotExpired,

    #[msg("No accumulated fees to collect")]
    NoFeesToCollect,

    #[msg("Fee basis points exceed maximum (10 000)")]
    InvalidFeeBps,

    #[msg("Arithmetic overflow")]
    Overflow,
}
