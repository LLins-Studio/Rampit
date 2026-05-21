use solana_program::program_error::ProgramError;

#[repr(u32)]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum RampitError {
    AlreadyInitialized = 6000,
    NotInitialized = 6001,
    Unauthorized = 6002,
    OrderNotFound = 6003,
    OrderAlreadyExists = 6004,
    InvalidAmount = 6005,
    InvalidExpiry = 6006,
    OrderNotPending = 6007,
    OrderExpired = 6008,
    NoFeesToCollect = 6009,
    InvalidFeeBps = 6010,
    Overflow = 6011,
    InvalidAccountData = 6012,
    InvalidAccountOwner = 6013,
    InvalidMint = 6014,
}

impl From<RampitError> for ProgramError {
    fn from(e: RampitError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
