use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

/// Anchor-compatible account discriminators (sha256("account:Name")[..8]).
pub const ESCROW_STATE_DISCRIMINATOR: [u8; 8] =
    [19, 90, 148, 111, 55, 130, 229, 108];
pub const ORDER_DISCRIMINATOR: [u8; 8] = [134, 173, 223, 185, 77, 86, 28, 51];
pub const FEE_ACCOUNT_DISCRIMINATOR: [u8; 8] =
    [137, 191, 201, 34, 168, 222, 43, 138];

pub const STATE_SEED: &[u8] = b"state";
pub const ORDER_SEED: &[u8] = b"order";
pub const FEES_SEED: &[u8] = b"fees";

/// 8-byte disc + EscrowState::INIT_SPACE (67)
pub const ESCROW_STATE_LEN: usize = 75;
/// 8-byte disc + Order::INIT_SPACE (155)
pub const ORDER_LEN: usize = 163;
/// 8-byte disc + FeeAccount::INIT_SPACE (41)
pub const FEE_ACCOUNT_LEN: usize = 49;

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
#[repr(u8)]
pub enum Direction {
    OnRamp = 0,
    OffRamp = 1,
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
#[repr(u8)]
pub enum OrderStatus {
    Pending = 0,
    Released = 1,
    Refunded = 2,
    Cancelled = 3,
}

impl BorshSerialize for Direction {
    fn serialize<W: borsh::maybestd::io::Write>(
        &self,
        writer: &mut W,
    ) -> borsh::maybestd::io::Result<()> {
        writer.write_all(&[*self as u8])
    }
}

impl BorshDeserialize for Direction {
    fn deserialize(buf: &mut &[u8]) -> borsh::maybestd::io::Result<Self> {
        match u8::deserialize(buf)? {
            0 => Ok(Direction::OnRamp),
            1 => Ok(Direction::OffRamp),
            _ => Err(borsh::maybestd::io::Error::new(
                borsh::maybestd::io::ErrorKind::InvalidData,
                "InvalidDirection",
            )),
        }
    }
}

impl BorshSerialize for OrderStatus {
    fn serialize<W: borsh::maybestd::io::Write>(
        &self,
        writer: &mut W,
    ) -> borsh::maybestd::io::Result<()> {
        writer.write_all(&[*self as u8])
    }
}

impl BorshDeserialize for OrderStatus {
    fn deserialize(buf: &mut &[u8]) -> borsh::maybestd::io::Result<Self> {
        match u8::deserialize(buf)? {
            0 => Ok(OrderStatus::Pending),
            1 => Ok(OrderStatus::Released),
            2 => Ok(OrderStatus::Refunded),
            3 => Ok(OrderStatus::Cancelled),
            _ => Err(borsh::maybestd::io::Error::new(
                borsh::maybestd::io::ErrorKind::InvalidData,
                "InvalidOrderStatus",
            )),
        }
    }
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Copy, Debug)]
pub struct EscrowState {
    pub admin: Pubkey,
    pub relayer: Pubkey,
    pub fee_bps: u16,
    pub bump: u8,
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Copy, Debug)]
pub struct Order {
    pub order_id: [u8; 32],
    pub recipient: Pubkey,
    pub funder: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub rate: u64,
    pub expiry: i64,
    pub direction: Direction,
    pub status: OrderStatus,
    pub bump: u8,
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Copy, Debug)]
pub struct FeeAccount {
    pub token_mint: Pubkey,
    pub accumulated: u64,
    pub bump: u8,
}

pub fn write_escrow_state(
    account: &mut [u8],
    state: &EscrowState,
) -> Result<(), ()> {
    account[..8].copy_from_slice(&ESCROW_STATE_DISCRIMINATOR);
    state.serialize(&mut &mut account[8..]).map_err(|_| ())
}

pub fn read_escrow_state(data: &[u8]) -> Option<EscrowState> {
    if data.len() < ESCROW_STATE_LEN || data[..8] != ESCROW_STATE_DISCRIMINATOR {
        return None;
    }
    EscrowState::try_from_slice(&data[8..]).ok()
}

pub fn write_order(account: &mut [u8], order: &Order) -> Result<(), ()> {
    account[..8].copy_from_slice(&ORDER_DISCRIMINATOR);
    order.serialize(&mut &mut account[8..]).map_err(|_| ())
}

pub fn read_order(data: &[u8]) -> Option<Order> {
    if data.len() < ORDER_LEN || data[..8] != ORDER_DISCRIMINATOR {
        return None;
    }
    Order::try_from_slice(&data[8..]).ok()
}

pub fn write_fee_account(account: &mut [u8], fee: &FeeAccount) -> Result<(), ()> {
    account[..8].copy_from_slice(&FEE_ACCOUNT_DISCRIMINATOR);
    fee.serialize(&mut &mut account[8..]).map_err(|_| ())
}

pub fn read_fee_account(data: &[u8]) -> Option<FeeAccount> {
    if data.len() < FEE_ACCOUNT_LEN || data[..8] != FEE_ACCOUNT_DISCRIMINATOR {
        return None;
    }
    FeeAccount::try_from_slice(&data[8..]).ok()
}
