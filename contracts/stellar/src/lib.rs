#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Bytes, Env,
};

// ---------------------------------------------------------------------------
// TTL constants – Soroban persistent/instance entries expire unless their
// time-to-live is periodically extended.  Values are in ledger sequence
// numbers (~5 s per ledger on mainnet).
// ---------------------------------------------------------------------------
const INSTANCE_LIFETIME_THRESHOLD: u32 = 17_280; // ~1 day
const INSTANCE_BUMP_AMOUNT: u32 = 120_960; // ~7 days
const PERSISTENT_LIFETIME_THRESHOLD: u32 = 120_960; // ~7 days
const PERSISTENT_BUMP_AMOUNT: u32 = 518_400; // ~30 days

// Basis-point denominator (100 bps = 1%, 10 000 bps = 100%).
const BPS_DENOMINATOR: i128 = 10_000;

// ===========================================================================
//  Error enum – every fallible path returns one of these instead of panicking.
// ===========================================================================
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum RampitError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    OrderNotFound = 4,
    OrderAlreadyExists = 5,
    InvalidAmount = 6,
    InvalidExpiry = 7,
    OrderNotPending = 8,
    OrderExpired = 9,
    OrderNotExpired = 10,
    NoFeesToCollect = 11,
    InvalidFeeBps = 12,
}

// ===========================================================================
//  Domain types
// ===========================================================================

/// Whether the user is buying crypto with fiat (OnRamp) or selling crypto for
/// fiat (OffRamp).
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Direction {
    OnRamp,
    OffRamp,
}

/// Lifecycle status of an escrow order.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum OrderStatus {
    Pending,
    Released,
    Refunded,
    Cancelled,
}

/// A single escrow order.
#[contracttype]
#[derive(Clone, Debug)]
pub struct Order {
    pub order_id: Bytes,
    /// Crypto payout address (customer wallet).
    pub recipient: Address,
    /// Ops/relayer wallet that funded the escrow.
    pub funder: Address,
    pub token: Address,
    pub amount: i128,
    pub rate: i128,
    pub expiry: u64,
    pub direction: Direction,
    pub status: OrderStatus,
}

// ===========================================================================
//  Storage layout – each variant maps to a unique ledger key.
//  Using individual keys per order is far more gas-efficient than storing all
//  orders inside a single Map value.
// ===========================================================================
#[contracttype]
pub enum DataKey {
    Admin,
    Relayer,
    FeeBps,
    Order(Bytes),
    AccumFees(Address),
}

// ===========================================================================
//  Contract definition
// ===========================================================================
#[contract]
pub struct RampitEscrow;

#[contractimpl]
impl RampitEscrow {
    // -----------------------------------------------------------------------
    //  Initialization
    // -----------------------------------------------------------------------

    /// One-time setup.  Sets admin, relayer and fee (in basis points).
    /// Must be called before any other function.
    pub fn initialize(
        env: Env,
        admin: Address,
        relayer: Address,
        fee_bps: u32,
    ) -> Result<(), RampitError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(RampitError::AlreadyInitialized);
        }
        if fee_bps > 10_000 {
            return Err(RampitError::InvalidFeeBps);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Relayer, &relayer);
        env.storage().instance().set(&DataKey::FeeBps, &fee_bps);

        env.events()
            .publish((symbol_short!("init"),), (&admin, &relayer, fee_bps));

        Ok(())
    }

    // -----------------------------------------------------------------------
    //  Order lifecycle
    // -----------------------------------------------------------------------

    /// Lock tokens from the relayer into escrow and create a pending order.
    /// `order_id` must be unique; use it as the off-chain Rampit order key.
    /// `recipient` receives crypto on `release_order` (no recipient signature).
    pub fn create_order(
        env: Env,
        order_id: Bytes,
        recipient: Address,
        token: Address,
        amount: i128,
        rate: i128,
        expiry: u64,
        direction: Direction,
    ) -> Result<(), RampitError> {
        Self::require_init(&env)?;

        if amount <= 0 {
            return Err(RampitError::InvalidAmount);
        }
        if expiry <= env.ledger().timestamp() {
            return Err(RampitError::InvalidExpiry);
        }

        let order_key = DataKey::Order(order_id.clone());
        if env.storage().persistent().has(&order_key) {
            return Err(RampitError::OrderAlreadyExists);
        }

        let relayer = Self::load_relayer(&env)?;
        relayer.require_auth();

        let tok = token::TokenClient::new(&env, &token);
        tok.transfer(
            &relayer,
            &env.current_contract_address(),
            &amount,
        );

        let order = Order {
            order_id: order_id.clone(),
            recipient: recipient.clone(),
            funder: relayer.clone(),
            token: token.clone(),
            amount,
            rate,
            expiry,
            direction: direction.clone(),
            status: OrderStatus::Pending,
        };

        env.storage().persistent().set(&order_key, &order);
        Self::bump_persistent(&env, &order_key);
        Self::bump_instance(&env);

        env.events().publish(
            (symbol_short!("create"), order_id),
            (&recipient, &relayer, &token, amount, rate, expiry, direction),
        );

        Ok(())
    }

    /// Called by the relayer once fiat payment is confirmed.
    /// Deducts the platform fee, sends the net amount to `recipient`, and marks
    /// the order `Released`.
    pub fn release_order(env: Env, order_id: Bytes) -> Result<(), RampitError> {
        Self::require_init(&env)?;

        let relayer = Self::load_relayer(&env)?;
        relayer.require_auth();

        let order_key = DataKey::Order(order_id.clone());
        let mut order: Order = env
            .storage()
            .persistent()
            .get(&order_key)
            .ok_or(RampitError::OrderNotFound)?;

        if order.status != OrderStatus::Pending {
            return Err(RampitError::OrderNotPending);
        }

        // Fee calculation (integer arithmetic, rounds down).
        let fee_bps: u32 = env
            .storage()
            .instance()
            .get(&DataKey::FeeBps)
            .unwrap_or(0);
        let fee = (order.amount * fee_bps as i128) / BPS_DENOMINATOR;
        let net_amount = order.amount - fee;

        let tok = token::TokenClient::new(&env, &order.token);
        tok.transfer(
            &env.current_contract_address(),
            &order.recipient,
            &net_amount,
        );

        // Accumulate fees for later collection by admin.
        if fee > 0 {
            let fee_key = DataKey::AccumFees(order.token.clone());
            let current: i128 = env.storage().persistent().get(&fee_key).unwrap_or(0);
            env.storage()
                .persistent()
                .set(&fee_key, &(current + fee));
            Self::bump_persistent(&env, &fee_key);
        }

        order.status = OrderStatus::Released;
        env.storage().persistent().set(&order_key, &order);
        Self::bump_persistent(&env, &order_key);
        Self::bump_instance(&env);

        env.events().publish(
            (symbol_short!("release"), order_id),
            (&order.recipient, net_amount, fee),
        );

        Ok(())
    }

    /// Return the full escrowed amount to the funder (relayer). Relayer only.
    pub fn refund_order(env: Env, order_id: Bytes) -> Result<(), RampitError> {
        Self::require_init(&env)?;

        let relayer = Self::load_relayer(&env)?;
        relayer.require_auth();

        let order_key = DataKey::Order(order_id.clone());
        let mut order: Order = env
            .storage()
            .persistent()
            .get(&order_key)
            .ok_or(RampitError::OrderNotFound)?;

        if order.status != OrderStatus::Pending {
            return Err(RampitError::OrderNotPending);
        }

        let tok = token::TokenClient::new(&env, &order.token);
        tok.transfer(
            &env.current_contract_address(),
            &order.funder,
            &order.amount,
        );

        order.status = OrderStatus::Refunded;
        env.storage().persistent().set(&order_key, &order);
        Self::bump_persistent(&env, &order_key);
        Self::bump_instance(&env);

        env.events().publish(
            (symbol_short!("refund"), order_id),
            (&order.funder, order.amount),
        );

        Ok(())
    }

    /// Cancel a pending order before expiry. Relayer only; funds return to funder.
    pub fn cancel_order(env: Env, order_id: Bytes) -> Result<(), RampitError> {
        Self::require_init(&env)?;

        let relayer = Self::load_relayer(&env)?;
        relayer.require_auth();

        let order_key = DataKey::Order(order_id.clone());
        let mut order: Order = env
            .storage()
            .persistent()
            .get(&order_key)
            .ok_or(RampitError::OrderNotFound)?;

        if order.status != OrderStatus::Pending {
            return Err(RampitError::OrderNotPending);
        }
        if env.ledger().timestamp() >= order.expiry {
            return Err(RampitError::OrderExpired);
        }

        let tok = token::TokenClient::new(&env, &order.token);
        tok.transfer(
            &env.current_contract_address(),
            &order.funder,
            &order.amount,
        );

        order.status = OrderStatus::Cancelled;
        env.storage().persistent().set(&order_key, &order);
        Self::bump_persistent(&env, &order_key);
        Self::bump_instance(&env);

        env.events().publish(
            (symbol_short!("cancel"), order_id),
            (&order.funder, order.amount),
        );

        Ok(())
    }

    // -----------------------------------------------------------------------
    //  Admin functions
    // -----------------------------------------------------------------------

    /// Withdraw accumulated platform fees for a given token to the admin
    /// address.
    pub fn collect_fees(env: Env, token: Address) -> Result<(), RampitError> {
        Self::require_init(&env)?;

        let admin = Self::load_admin(&env)?;
        admin.require_auth();

        let fee_key = DataKey::AccumFees(token.clone());
        let fees: i128 = env
            .storage()
            .persistent()
            .get(&fee_key)
            .unwrap_or(0);

        if fees <= 0 {
            return Err(RampitError::NoFeesToCollect);
        }

        let tok = token::TokenClient::new(&env, &token);
        tok.transfer(&env.current_contract_address(), &admin, &fees);

        // Reset accumulated balance to zero.
        env.storage().persistent().set(&fee_key, &0_i128);
        Self::bump_persistent(&env, &fee_key);
        Self::bump_instance(&env);

        env.events()
            .publish((symbol_short!("fees"), token), (&admin, fees));

        Ok(())
    }

    /// Transfer admin role to a new address.  Only the current admin can call
    /// this.  Critical for key rotation if the admin key is compromised.
    pub fn set_admin(env: Env, new_admin: Address) -> Result<(), RampitError> {
        Self::require_init(&env)?;

        let admin = Self::load_admin(&env)?;
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &new_admin);
        Self::bump_instance(&env);

        env.events()
            .publish((symbol_short!("admin"),), &new_admin);

        Ok(())
    }

    /// Replace the relayer address (admin only).
    pub fn set_relayer(env: Env, new_relayer: Address) -> Result<(), RampitError> {
        Self::require_init(&env)?;

        let admin = Self::load_admin(&env)?;
        admin.require_auth();

        env.storage()
            .instance()
            .set(&DataKey::Relayer, &new_relayer);
        Self::bump_instance(&env);

        env.events()
            .publish((symbol_short!("relayer"),), &new_relayer);

        Ok(())
    }

    /// Update the fee in basis points (admin only).  Max 10 000 (= 100%).
    pub fn set_fee(env: Env, fee_bps: u32) -> Result<(), RampitError> {
        Self::require_init(&env)?;

        let admin = Self::load_admin(&env)?;
        admin.require_auth();

        if fee_bps > 10_000 {
            return Err(RampitError::InvalidFeeBps);
        }

        env.storage().instance().set(&DataKey::FeeBps, &fee_bps);
        Self::bump_instance(&env);

        env.events()
            .publish((symbol_short!("set_fee"),), fee_bps);

        Ok(())
    }

    // -----------------------------------------------------------------------
    //  Read-only queries
    // -----------------------------------------------------------------------

    /// Return the full `Order` struct for the given id (or error).
    ///
    /// **TTL note:** Read-only queries intentionally do not bump the
    /// persistent entry's TTL.  If the order is near expiry in ledger
    /// storage, a write operation (release / refund / cancel) will bump it.
    /// Frontends that need guaranteed availability should call a write path
    /// or use `extend_ttl` via a separate admin utility.
    pub fn get_order(env: Env, order_id: Bytes) -> Result<Order, RampitError> {
        let order_key = DataKey::Order(order_id);
        env.storage()
            .persistent()
            .get(&order_key)
            .ok_or(RampitError::OrderNotFound)
    }

    /// Whether an order id is already registered on-chain.
    pub fn order_exists(env: Env, order_id: Bytes) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Order(order_id))
    }

    /// Return the current fee in basis points.
    pub fn get_fee_bps(env: Env) -> Result<u32, RampitError> {
        env.storage()
            .instance()
            .get(&DataKey::FeeBps)
            .ok_or(RampitError::NotInitialized)
    }

    /// Return the accumulated (uncollected) fee balance for a token.
    pub fn get_accumulated_fees(env: Env, token: Address) -> i128 {
        let fee_key = DataKey::AccumFees(token);
        env.storage().persistent().get(&fee_key).unwrap_or(0)
    }

    /// Return the current relayer address.
    pub fn get_relayer(env: Env) -> Result<Address, RampitError> {
        Self::load_relayer(&env)
    }

    /// Return the admin address.
    pub fn get_admin(env: Env) -> Result<Address, RampitError> {
        Self::load_admin(&env)
    }

    // -----------------------------------------------------------------------
    //  Internal helpers (not exposed to callers)
    // -----------------------------------------------------------------------

    fn require_init(env: &Env) -> Result<(), RampitError> {
        if !env.storage().instance().has(&DataKey::Admin) {
            return Err(RampitError::NotInitialized);
        }
        Ok(())
    }

    fn load_admin(env: &Env) -> Result<Address, RampitError> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(RampitError::NotInitialized)
    }

    fn load_relayer(env: &Env) -> Result<Address, RampitError> {
        env.storage()
            .instance()
            .get(&DataKey::Relayer)
            .ok_or(RampitError::NotInitialized)
    }

    fn bump_instance(env: &Env) {
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
    }

    fn bump_persistent(env: &Env, key: &DataKey) {
        env.storage()
            .persistent()
            .extend_ttl(key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);
    }
}

// ===========================================================================
//  Tests
// ===========================================================================
#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};
    use soroban_sdk::{token, Bytes, Env};

    /// Helper: deploy the contract, a test token, and initialize the escrow.
    fn setup() -> (Env, Address, Address, Address, Address, RampitEscrowClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let relayer = Address::generate(&env);
        let recipient = Address::generate(&env);

        let token_admin = Address::generate(&env);
        let token_contract = env.register_stellar_asset_contract_v2(token_admin.clone());
        let token_addr = token_contract.address();
        let sac = token::StellarAssetClient::new(&env, &token_addr);
        sac.mint(&relayer, &100_000_000_000);

        let contract_id = env.register(RampitEscrow, ());
        let client = RampitEscrowClient::new(&env, &contract_id);

        client.initialize(&admin, &relayer, &50);

        (env, admin, relayer, recipient, token_addr, client)
    }

    fn make_order_id(env: &Env) -> Bytes {
        Bytes::from_slice(env, b"order-001")
    }

    #[test]
    fn test_full_lifecycle_release() {
        let (env, _admin, relayer, recipient, token_addr, client) = setup();
        let order_id = make_order_id(&env);
        let amount: i128 = 1_000_000_000;

        env.ledger().with_mut(|li| li.timestamp = 1000);

        client.create_order(
            &order_id,
            &recipient,
            &token_addr,
            &amount,
            &4500_0000000,
            &2000,
            &Direction::OnRamp,
        );

        let order = client.get_order(&order_id);
        assert_eq!(order.status, OrderStatus::Pending);
        assert_eq!(order.amount, amount);
        assert_eq!(order.recipient, recipient);
        assert_eq!(order.funder, relayer);
        assert!(client.order_exists(&order_id));

        client.release_order(&order_id);

        let order = client.get_order(&order_id);
        assert_eq!(order.status, OrderStatus::Released);

        let fees = client.get_accumulated_fees(&token_addr);
        assert_eq!(fees, 5_000_000);
    }

    #[test]
    fn test_cancel_by_relayer() {
        let (env, _admin, _relayer, recipient, token_addr, client) = setup();
        let order_id = make_order_id(&env);

        env.ledger().with_mut(|li| li.timestamp = 1000);

        client.create_order(
            &order_id,
            &recipient,
            &token_addr,
            &500_000_000,
            &4500_0000000,
            &2000,
            &Direction::OnRamp,
        );

        client.cancel_order(&order_id);

        let order = client.get_order(&order_id);
        assert_eq!(order.status, OrderStatus::Cancelled);
    }

    #[test]
    fn test_refund_by_relayer() {
        let (env, _admin, _relayer, recipient, token_addr, client) = setup();
        let order_id = make_order_id(&env);

        env.ledger().with_mut(|li| li.timestamp = 1000);

        client.create_order(
            &order_id,
            &recipient,
            &token_addr,
            &500_000_000,
            &4500_0000000,
            &2000,
            &Direction::OnRamp,
        );

        client.refund_order(&order_id);

        let order = client.get_order(&order_id);
        assert_eq!(order.status, OrderStatus::Refunded);
    }

    #[test]
    fn test_duplicate_order_id_fails() {
        let (env, _admin, _relayer, recipient, token_addr, client) = setup();
        let order_id = make_order_id(&env);

        env.ledger().with_mut(|li| li.timestamp = 1000);

        client.create_order(
            &order_id,
            &recipient,
            &token_addr,
            &500_000_000,
            &4500_0000000,
            &2000,
            &Direction::OnRamp,
        );

        let result = client.try_create_order(
            &order_id,
            &recipient,
            &token_addr,
            &100_000_000,
            &4500_0000000,
            &2000,
            &Direction::OnRamp,
        );
        assert_eq!(result, Err(Ok(RampitError::OrderAlreadyExists)));
    }

    #[test]
    fn test_collect_fees() {
        let (env, admin, _relayer, recipient, token_addr, client) = setup();
        let order_id = make_order_id(&env);

        env.ledger().with_mut(|li| li.timestamp = 1000);

        client.create_order(
            &order_id,
            &recipient,
            &token_addr,
            &1_000_000_000,
            &4500_0000000,
            &2000,
            &Direction::OnRamp,
        );

        client.release_order(&order_id);

        let before = token::TokenClient::new(&env, &token_addr).balance(&admin);
        client.collect_fees(&token_addr);
        let after = token::TokenClient::new(&env, &token_addr).balance(&admin);

        assert_eq!(after - before, 5_000_000);
        assert_eq!(client.get_accumulated_fees(&token_addr), 0);
    }

    #[test]
    fn test_set_relayer() {
        let (env, _admin, _relayer, _user, _token_addr, client) = setup();
        let new_relayer = Address::generate(&env);

        client.set_relayer(&new_relayer);

        assert_eq!(client.get_relayer(), new_relayer);
    }

    #[test]
    fn test_double_init_fails() {
        let (_env, admin, relayer, _user, _token_addr, client) = setup();
        let result = client.try_initialize(&admin, &relayer, &50);
        assert!(result.is_err());
    }

    #[test]
    fn test_release_after_expiry_succeeds() {
        let (env, _admin, _relayer, recipient, token_addr, client) = setup();
        let order_id = make_order_id(&env);

        env.ledger().with_mut(|li| li.timestamp = 1000);

        client.create_order(
            &order_id,
            &recipient,
            &token_addr,
            &1_000_000_000,
            &4500_0000000,
            &2000,
            &Direction::OnRamp,
        );

        env.ledger().with_mut(|li| li.timestamp = 3000);

        client.release_order(&order_id);

        let order = client.get_order(&order_id);
        assert_eq!(order.status, OrderStatus::Released);
    }

    #[test]
    fn test_order_exists() {
        let (env, _admin, _relayer, recipient, token_addr, client) = setup();
        let order_id = make_order_id(&env);

        assert!(!client.order_exists(&order_id));

        env.ledger().with_mut(|li| li.timestamp = 1000);

        client.create_order(
            &order_id,
            &recipient,
            &token_addr,
            &500_000_000,
            &4500_0000000,
            &2000,
            &Direction::OnRamp,
        );

        assert!(client.order_exists(&order_id));
    }

    #[test]
    fn test_set_fee_invalid_bps_fails() {
        let (_env, _admin, _relayer, _user, _token_addr, client) = setup();

        // 10 001 bps exceeds the 100% cap.
        let result = client.try_set_fee(&10_001);
        assert_eq!(result, Err(Ok(RampitError::InvalidFeeBps)));
    }

    #[test]
    fn test_set_admin() {
        let (env, _admin, _relayer, _user, _token_addr, client) = setup();
        let new_admin = Address::generate(&env);

        client.set_admin(&new_admin);

        assert_eq!(client.get_admin(), new_admin);
    }
}
