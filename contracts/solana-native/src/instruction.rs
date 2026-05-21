use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::program_error::ProgramError;
use solana_program::pubkey::Pubkey;

use crate::state::Direction;

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug)]
pub enum RampitInstruction {
  Initialize { fee_bps: u16 },
  CreateOrder {
    order_id: [u8; 32],
    amount: u64,
    rate: u64,
    expiry: i64,
    direction: Direction,
  },
  ReleaseOrder { order_id: [u8; 32] },
  RefundOrder { order_id: [u8; 32] },
  CancelOrder { order_id: [u8; 32] },
  CollectFees,
  SetRelayer { new_relayer: Pubkey },
  SetAdmin { new_admin: Pubkey },
  SetFee { fee_bps: u16 },
}

impl RampitInstruction {
  pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
    Self::try_from_slice(input).map_err(|_| ProgramError::InvalidInstructionData)
  }
}
