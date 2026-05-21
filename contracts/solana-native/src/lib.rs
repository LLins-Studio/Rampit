#![no_std]
#![deny(clippy::arithmetic_side_effects)]
#![deny(clippy::integer_arithmetic)]

extern crate alloc;

#[allow(unused_imports)]
use alloc::format;

mod error;
mod instruction;
mod processor;
mod state;

use solana_program::{
    account_info::AccountInfo, entrypoint, entrypoint::ProgramResult, pubkey::Pubkey,
};

pub use error::RampitError;
pub use instruction::RampitInstruction;
pub use state::*;

solana_program::declare_id!("Cpdpas52WbHgLeXMvb4NSeJV4AzsbX8NFdyEHQY22LJx");

entrypoint!(process_instruction);

fn process_instruction<'a>(
    program_id: &Pubkey,
    accounts: &'a [AccountInfo<'a>],
    instruction_data: &[u8],
) -> ProgramResult {
    processor::process(program_id, accounts, instruction_data)
}
