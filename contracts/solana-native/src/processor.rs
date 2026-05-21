use alloc::vec;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    clock::Clock,
    entrypoint::ProgramResult,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
};
use solana_program::system_program;

use crate::error::RampitError;
use crate::instruction::RampitInstruction;
use crate::state::{
    read_escrow_state, read_fee_account, read_order, write_escrow_state, write_fee_account,
    write_order, Direction, EscrowState, FeeAccount, Order, OrderStatus, FEE_ACCOUNT_LEN,
    ORDER_LEN, ESCROW_STATE_LEN, FEES_SEED, ORDER_SEED, STATE_SEED,
};

macro_rules! require {
    ($cond:expr, $err:expr) => {
        if !$cond {
            return Err($err.into());
        }
    };
}

const TOKEN_PROGRAM_ID: Pubkey = solana_program::pubkey!("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

pub fn process<'a>(
    program_id: &Pubkey,
    accounts: &'a [AccountInfo<'a>],
    input: &[u8],
) -> ProgramResult {
    let ix = RampitInstruction::unpack(input)?;
    match ix {
        RampitInstruction::Initialize { fee_bps } => {
            process_initialize(program_id, accounts, fee_bps)
        }
        RampitInstruction::CreateOrder {
            order_id,
            amount,
            rate,
            expiry,
            direction,
        } => process_create_order(
            program_id,
            accounts,
            order_id,
            amount,
            rate,
            expiry,
            direction,
        ),
        RampitInstruction::ReleaseOrder { order_id } => {
            process_release_order(program_id, accounts, order_id)
        }
        RampitInstruction::RefundOrder { order_id } => {
            process_refund_order(program_id, accounts, order_id)
        }
        RampitInstruction::CancelOrder { order_id } => {
            process_cancel_order(program_id, accounts, order_id)
        }
        RampitInstruction::CollectFees => process_collect_fees(program_id, accounts),
        RampitInstruction::SetRelayer { new_relayer } => {
            process_set_relayer(program_id, accounts, new_relayer)
        }
        RampitInstruction::SetAdmin { new_admin } => process_set_admin(program_id, accounts, new_admin),
        RampitInstruction::SetFee { fee_bps } => process_set_fee(program_id, accounts, fee_bps),
    }
}

fn process_initialize<'a>(
    program_id: &Pubkey,
    accounts: &'a [AccountInfo<'a>],
    fee_bps: u16,
) -> ProgramResult {
    require!(fee_bps <= 10_000, RampitError::InvalidFeeBps);

    let account_info_iter = &mut accounts.iter();
    let admin = next_account_info(account_info_iter)?;
    let state_info = next_account_info(account_info_iter)?;
    let system_program_info = next_account_info(account_info_iter)?;

    require!(admin.is_signer, RampitError::Unauthorized);
    require!(
        *system_program_info.key == system_program::id(),
        RampitError::InvalidAccountOwner
    );
    require!(state_info.data_is_empty(), RampitError::AlreadyInitialized);

    let (state_pda, bump) = Pubkey::find_program_address(&[STATE_SEED], program_id);
    require!(*state_info.key == state_pda, RampitError::InvalidAccountData);

    let rent = Rent::get()?;
    let lamports = rent.minimum_balance(ESCROW_STATE_LEN);

    invoke_signed(
        &system_instruction::create_account(
            admin.key,
            state_info.key,
            lamports,
            ESCROW_STATE_LEN as u64,
            program_id,
        ),
        &[admin.clone(), state_info.clone(), system_program_info.clone()],
        &[&[STATE_SEED, &[bump]]],
    )?;

    let state = EscrowState {
        admin: *admin.key,
        relayer: *admin.key,
        fee_bps,
        bump,
    };
    let mut data = state_info.try_borrow_mut_data()?;
    write_escrow_state(&mut data, &state).map_err(|_| ProgramError::InvalidAccountData)?;
    Ok(())
}

fn process_create_order<'a>(
    program_id: &Pubkey,
    accounts: &'a [AccountInfo<'a>],
    order_id: [u8; 32],
    amount: u64,
    rate: u64,
    expiry: i64,
    direction: Direction,
) -> ProgramResult {
    require!(amount > 0, RampitError::InvalidAmount);

    let clock = Clock::get()?;
    require!(expiry > clock.unix_timestamp, RampitError::InvalidExpiry);

    let account_info_iter = &mut accounts.iter();
    let relayer = next_account_info(account_info_iter)?;
    let recipient = next_account_info(account_info_iter)?;
    let state_info = next_account_info(account_info_iter)?;
    let order_info = next_account_info(account_info_iter)?;
    let mint_info = next_account_info(account_info_iter)?;
    let relayer_ata = next_account_info(account_info_iter)?;
    let escrow_ata = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;
    let system_program_info = next_account_info(account_info_iter)?;

    require!(relayer.is_signer, RampitError::Unauthorized);
    require!(*token_program.key == TOKEN_PROGRAM_ID, RampitError::InvalidAccountOwner);
    require!(
        *system_program_info.key == system_program::id(),
        RampitError::InvalidAccountOwner
    );

    let state = load_escrow_state(state_info, program_id)?;
    require!(*relayer.key == state.relayer, RampitError::Unauthorized);

    let order_seeds: &[&[u8]] = &[ORDER_SEED, &order_id];
    let (order_pda, order_bump) = Pubkey::find_program_address(order_seeds, program_id);
    require!(*order_info.key == order_pda, RampitError::InvalidAccountData);
    require!(order_info.data_is_empty(), RampitError::OrderAlreadyExists);

    let (state_pda, _) = Pubkey::find_program_address(&[STATE_SEED], program_id);
    require!(*state_info.key == state_pda, RampitError::InvalidAccountData);

    verify_token_account(relayer_ata, mint_info.key, relayer.key)?;
    verify_token_account(escrow_ata, mint_info.key, &state_pda)?;

    let rent = Rent::get()?;
    invoke_signed(
        &system_instruction::create_account(
            relayer.key,
            order_info.key,
            rent.minimum_balance(ORDER_LEN),
            ORDER_LEN as u64,
            program_id,
        ),
        &[relayer.clone(), order_info.clone(), system_program_info.clone()],
        &[&[ORDER_SEED, &order_id, &[order_bump]]],
    )?;

    cpi_token_transfer(
        token_program,
        relayer_ata,
        escrow_ata,
        relayer,
        amount,
        None,
    )?;

    let order = Order {
        order_id,
        recipient: *recipient.key,
        funder: *relayer.key,
        token_mint: *mint_info.key,
        amount,
        rate,
        expiry,
        direction,
        status: OrderStatus::Pending,
        bump: order_bump,
    };
    let mut data = order_info.try_borrow_mut_data()?;
    write_order(&mut data, &order).map_err(|_| ProgramError::InvalidAccountData)?;
    Ok(())
}

fn process_release_order<'a>(
    program_id: &Pubkey,
    accounts: &'a [AccountInfo<'a>],
    order_id: [u8; 32],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let relayer = next_account_info(account_info_iter)?;
    let recipient = next_account_info(account_info_iter)?;
    let state_info = next_account_info(account_info_iter)?;
    let order_info = next_account_info(account_info_iter)?;
    let mint_info = next_account_info(account_info_iter)?;
    let recipient_ata = next_account_info(account_info_iter)?;
    let escrow_ata = next_account_info(account_info_iter)?;
    let fee_info = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;
    let system_program_info = next_account_info(account_info_iter)?;

    require!(relayer.is_signer, RampitError::Unauthorized);
    require!(*token_program.key == TOKEN_PROGRAM_ID, RampitError::InvalidAccountOwner);

    let state = load_escrow_state(state_info, program_id)?;
    require!(*relayer.key == state.relayer, RampitError::Unauthorized);

    let mut order = load_order(order_info, program_id, &order_id)?;
    require!(order.status == OrderStatus::Pending, RampitError::OrderNotPending);
    require!(*recipient.key == order.recipient, RampitError::Unauthorized);
    require!(*mint_info.key == order.token_mint, RampitError::InvalidMint);

    let (state_pda, state_bump) = Pubkey::find_program_address(&[STATE_SEED], program_id);
    verify_token_account(escrow_ata, mint_info.key, &state_pda)?;
    verify_token_account(recipient_ata, mint_info.key, recipient.key)?;

    let fee = (order.amount as u128)
        .checked_mul(state.fee_bps as u128)
        .and_then(|v| v.checked_div(10_000))
        .ok_or(RampitError::Overflow)? as u64;
    let net = order
        .amount
        .checked_sub(fee)
        .ok_or(RampitError::Overflow)?;

    let state_seeds: &[&[&[u8]]] = &[&[STATE_SEED, &[state_bump]]];
    cpi_token_transfer(
        token_program,
        escrow_ata,
        recipient_ata,
        state_info,
        net,
        Some(state_seeds),
    )?;

    init_fee_account_if_needed(
        program_id,
        relayer,
        fee_info,
        mint_info,
        system_program_info,
    )?;
    let mut fee_acct = load_fee_account(fee_info, program_id, mint_info.key)?;
    fee_acct.accumulated = fee_acct
        .accumulated
        .checked_add(fee)
        .ok_or(RampitError::Overflow)?;
    {
        let mut data = fee_info.try_borrow_mut_data()?;
        write_fee_account(&mut data, &fee_acct)
            .map_err(|_| ProgramError::InvalidAccountData)?;
    }

    order.status = OrderStatus::Released;
    close_order_account(order_info, relayer)?;
    Ok(())
}

fn process_refund_order<'a>(
    program_id: &Pubkey,
    accounts: &'a [AccountInfo<'a>],
    order_id: [u8; 32],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let relayer = next_account_info(account_info_iter)?;
    let state_info = next_account_info(account_info_iter)?;
    let order_info = next_account_info(account_info_iter)?;
    let mint_info = next_account_info(account_info_iter)?;
    let funder_ata = next_account_info(account_info_iter)?;
    let escrow_ata = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;

    require!(relayer.is_signer, RampitError::Unauthorized);
    require!(*token_program.key == TOKEN_PROGRAM_ID, RampitError::InvalidAccountOwner);

    let state = load_escrow_state(state_info, program_id)?;
    require!(*relayer.key == state.relayer, RampitError::Unauthorized);

    let order = load_order(order_info, program_id, &order_id)?;
    require!(order.status == OrderStatus::Pending, RampitError::OrderNotPending);
    require!(*mint_info.key == order.token_mint, RampitError::InvalidMint);

    let (state_pda, state_bump) = Pubkey::find_program_address(&[STATE_SEED], program_id);
    verify_token_account(escrow_ata, mint_info.key, &state_pda)?;
    verify_token_account(funder_ata, mint_info.key, &order.funder)?;

    let state_seeds: &[&[&[u8]]] = &[&[STATE_SEED, &[state_bump]]];
    cpi_token_transfer(
        token_program,
        escrow_ata,
        funder_ata,
        state_info,
        order.amount,
        Some(state_seeds),
    )?;

    close_order_account(order_info, relayer)?;
    Ok(())
}

fn process_cancel_order<'a>(
    program_id: &Pubkey,
    accounts: &'a [AccountInfo<'a>],
    order_id: [u8; 32],
) -> ProgramResult {
    let clock = Clock::get()?;
    let account_info_iter = &mut accounts.iter();
    let relayer = next_account_info(account_info_iter)?;
    let state_info = next_account_info(account_info_iter)?;
    let order_info = next_account_info(account_info_iter)?;
    let mint_info = next_account_info(account_info_iter)?;
    let funder_ata = next_account_info(account_info_iter)?;
    let escrow_ata = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;

    require!(relayer.is_signer, RampitError::Unauthorized);

    let state = load_escrow_state(state_info, program_id)?;
    require!(*relayer.key == state.relayer, RampitError::Unauthorized);

    let order = load_order(order_info, program_id, &order_id)?;
    require!(order.status == OrderStatus::Pending, RampitError::OrderNotPending);
    require!(clock.unix_timestamp < order.expiry, RampitError::OrderExpired);

    let (state_pda, state_bump) = Pubkey::find_program_address(&[STATE_SEED], program_id);
    verify_token_account(escrow_ata, mint_info.key, &state_pda)?;
    verify_token_account(funder_ata, mint_info.key, &order.funder)?;

    let state_seeds: &[&[&[u8]]] = &[&[STATE_SEED, &[state_bump]]];
    cpi_token_transfer(
        token_program,
        escrow_ata,
        funder_ata,
        state_info,
        order.amount,
        Some(state_seeds),
    )?;

    close_order_account(order_info, relayer)?;
    Ok(())
}

fn process_collect_fees<'a>(
    program_id: &Pubkey,
    accounts: &'a [AccountInfo<'a>],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let state_info = next_account_info(account_info_iter)?;
    let admin = next_account_info(account_info_iter)?;
    let mint_info = next_account_info(account_info_iter)?;
    let fee_info = next_account_info(account_info_iter)?;
    let escrow_ata = next_account_info(account_info_iter)?;
    let admin_ata = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;

    require!(admin.is_signer, RampitError::Unauthorized);
    require!(*token_program.key == TOKEN_PROGRAM_ID, RampitError::InvalidAccountOwner);

    let state = load_escrow_state(state_info, program_id)?;
    require!(*admin.key == state.admin, RampitError::Unauthorized);

    let fee_acct = load_fee_account(fee_info, program_id, mint_info.key)?;
    require!(fee_acct.accumulated > 0, RampitError::NoFeesToCollect);

    let (state_pda, state_bump) = Pubkey::find_program_address(&[STATE_SEED], program_id);
    verify_token_account(escrow_ata, mint_info.key, &state_pda)?;
    verify_token_account(admin_ata, mint_info.key, admin.key)?;

    let amount = fee_acct.accumulated;
    let state_seeds: &[&[&[u8]]] = &[&[STATE_SEED, &[state_bump]]];
    cpi_token_transfer(
        token_program,
        escrow_ata,
        admin_ata,
        state_info,
        amount,
        Some(state_seeds),
    )?;

    let mut cleared = fee_acct;
    cleared.accumulated = 0;
    let mut data = fee_info.try_borrow_mut_data()?;
    write_fee_account(&mut data, &cleared).map_err(|_| ProgramError::InvalidAccountData)?;
    Ok(())
}

fn process_set_relayer(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    new_relayer: Pubkey,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let state_info = next_account_info(account_info_iter)?;
    let admin = next_account_info(account_info_iter)?;

    require!(admin.is_signer, RampitError::Unauthorized);
    let mut state = load_escrow_state(state_info, program_id)?;
    require!(*admin.key == state.admin, RampitError::Unauthorized);
    state.relayer = new_relayer;
    let mut data = state_info.try_borrow_mut_data()?;
    write_escrow_state(&mut data, &state).map_err(|_| ProgramError::InvalidAccountData)?;
    Ok(())
}

fn process_set_admin(program_id: &Pubkey, accounts: &[AccountInfo], new_admin: Pubkey) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let state_info = next_account_info(account_info_iter)?;
    let admin = next_account_info(account_info_iter)?;

    require!(admin.is_signer, RampitError::Unauthorized);
    let mut state = load_escrow_state(state_info, program_id)?;
    require!(*admin.key == state.admin, RampitError::Unauthorized);
    state.admin = new_admin;
    let mut data = state_info.try_borrow_mut_data()?;
    write_escrow_state(&mut data, &state).map_err(|_| ProgramError::InvalidAccountData)?;
    Ok(())
}

fn process_set_fee(program_id: &Pubkey, accounts: &[AccountInfo], fee_bps: u16) -> ProgramResult {
    require!(fee_bps <= 10_000, RampitError::InvalidFeeBps);
    let account_info_iter = &mut accounts.iter();
    let state_info = next_account_info(account_info_iter)?;
    let admin = next_account_info(account_info_iter)?;

    require!(admin.is_signer, RampitError::Unauthorized);
    let mut state = load_escrow_state(state_info, program_id)?;
    require!(*admin.key == state.admin, RampitError::Unauthorized);
    state.fee_bps = fee_bps;
    let mut data = state_info.try_borrow_mut_data()?;
    write_escrow_state(&mut data, &state).map_err(|_| ProgramError::InvalidAccountData)?;
    Ok(())
}

fn load_escrow_state<'a>(
    info: &'a AccountInfo,
    program_id: &Pubkey,
) -> Result<EscrowState, ProgramError> {
    let (pda, _) = Pubkey::find_program_address(&[STATE_SEED], program_id);
    require!(*info.key == pda, RampitError::InvalidAccountData);
    require!(*info.owner == *program_id, RampitError::InvalidAccountOwner);
    let data = info.try_borrow_data()?;
    read_escrow_state(&data).ok_or(RampitError::NotInitialized.into())
}

fn load_order<'a>(
    info: &'a AccountInfo,
    program_id: &Pubkey,
    order_id: &[u8; 32],
) -> Result<Order, ProgramError> {
    let (pda, _) = Pubkey::find_program_address(&[ORDER_SEED, order_id], program_id);
    require!(*info.key == pda, RampitError::OrderNotFound);
    require!(*info.owner == *program_id, RampitError::InvalidAccountOwner);
    let data = info.try_borrow_data()?;
    read_order(&data).ok_or(RampitError::OrderNotFound.into())
}

fn load_fee_account<'a>(
    info: &'a AccountInfo,
    program_id: &Pubkey,
    mint: &Pubkey,
) -> Result<FeeAccount, ProgramError> {
    let (pda, _) = Pubkey::find_program_address(&[FEES_SEED, mint.as_ref()], program_id);
    require!(*info.key == pda, RampitError::InvalidAccountData);
    require!(*info.owner == *program_id, RampitError::InvalidAccountOwner);
    let data = info.try_borrow_data()?;
    read_fee_account(&data).ok_or(RampitError::NotInitialized.into())
}

fn init_fee_account_if_needed<'a>(
    program_id: &Pubkey,
    payer: &'a AccountInfo<'a>,
    fee_info: &'a AccountInfo<'a>,
    mint_info: &'a AccountInfo<'a>,
    system_program_info: &'a AccountInfo<'a>,
) -> ProgramResult {
    if *fee_info.owner == *program_id && fee_info.data_len() >= FEE_ACCOUNT_LEN {
        return Ok(());
    }

    let (fee_pda, bump) =
        Pubkey::find_program_address(&[FEES_SEED, mint_info.key.as_ref()], program_id);
    require!(*fee_info.key == fee_pda, RampitError::InvalidAccountData);

    let rent = Rent::get()?;
    invoke_signed(
        &system_instruction::create_account(
            payer.key,
            fee_info.key,
            rent.minimum_balance(FEE_ACCOUNT_LEN),
            FEE_ACCOUNT_LEN as u64,
            program_id,
        ),
        &[payer.clone(), fee_info.clone(), system_program_info.clone()],
        &[&[FEES_SEED, mint_info.key.as_ref(), &[bump]]],
    )?;

    let fee = FeeAccount {
        token_mint: *mint_info.key,
        accumulated: 0,
        bump,
    };
    let mut data = fee_info.try_borrow_mut_data()?;
    write_fee_account(&mut data, &fee).map_err(|_| ProgramError::InvalidAccountData)?;
    Ok(())
}

fn verify_token_account(
    ata: &AccountInfo,
    mint: &Pubkey,
    owner: &Pubkey,
) -> Result<(), ProgramError> {
    require!(*ata.owner == TOKEN_PROGRAM_ID, RampitError::InvalidAccountOwner);
    let data = ata.try_borrow_data()?;
    require!(data.len() >= 72, RampitError::InvalidAccountData);
    let acct_mint = Pubkey::new_from_array(data[0..32].try_into().unwrap());
    let acct_owner = Pubkey::new_from_array(data[32..64].try_into().unwrap());
    require!(acct_mint == *mint, RampitError::InvalidMint);
    require!(acct_owner == *owner, RampitError::Unauthorized);
    Ok(())
}

fn cpi_token_transfer<'a>(
    token_program: &'a AccountInfo<'a>,
    from: &'a AccountInfo<'a>,
    to: &'a AccountInfo<'a>,
    authority: &'a AccountInfo<'a>,
    amount: u64,
    signer_seeds: Option<&[&[&[u8]]]>,
) -> ProgramResult {
    let mut data = [3u8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    data[1..9].copy_from_slice(&amount.to_le_bytes());

    let ix = solana_program::instruction::Instruction {
        program_id: TOKEN_PROGRAM_ID,
        accounts: vec![
            solana_program::instruction::AccountMeta::new(*from.key, false),
            solana_program::instruction::AccountMeta::new(*to.key, false),
            solana_program::instruction::AccountMeta::new_readonly(*authority.key, true),
        ],
        data: data[..9].to_vec(), // alloc::vec required for CPI
    };

    let infos = [
        from.clone(),
        to.clone(),
        authority.clone(),
        token_program.clone(),
    ];
    match signer_seeds {
        Some(seeds) => invoke_signed(&ix, &infos, seeds),
        None => invoke(&ix, &infos),
    }
}

fn close_order_account(order_info: &AccountInfo, rent_dest: &AccountInfo) -> ProgramResult {
    let dest_lamports = **rent_dest.lamports.borrow();
    let src_lamports = **order_info.lamports.borrow();
    **rent_dest.lamports.borrow_mut() = dest_lamports
        .checked_add(src_lamports)
        .ok_or(RampitError::Overflow)?;
    **order_info.lamports.borrow_mut() = 0;
    order_info.assign(&system_program::id());
    order_info.realloc(0, false)?;
    Ok(())
}
