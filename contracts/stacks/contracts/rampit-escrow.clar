;; rampit-escrow.clar
;; Escrow contract for the Rampit crypto/fiat on-off ramp (Stacks / Clarity 3)

(use-trait sip-010-trait .sip-010-trait.sip-010-trait)

;; --- Data Variables ---

(define-data-var admin principal tx-sender)
(define-data-var relayer principal tx-sender)
(define-data-var fee-bps uint u0)
(define-data-var initialized bool false)

;; --- Maps ---

(define-map orders
  { order-id: (buff 32) }
  {
    user: principal,
    token: principal,
    amount: uint,
    rate: uint,
    expiry: uint,
    direction: (string-ascii 8),
    status: (string-ascii 10)
  }
)

(define-map accumulated-fees
  { token: principal }
  { amount: uint }
)

;; --- Error Constants ---

(define-constant ERR-ALREADY-INITIALIZED (err u1))
(define-constant ERR-NOT-INITIALIZED     (err u2))
(define-constant ERR-UNAUTHORIZED        (err u3))
(define-constant ERR-ORDER-NOT-FOUND     (err u4))
(define-constant ERR-ORDER-ALREADY-EXISTS (err u5))
(define-constant ERR-INVALID-AMOUNT      (err u6))
(define-constant ERR-INVALID-EXPIRY      (err u7))
(define-constant ERR-ORDER-NOT-PENDING   (err u8))
(define-constant ERR-ORDER-EXPIRED       (err u9))
(define-constant ERR-ORDER-NOT-EXPIRED   (err u10))
(define-constant ERR-NO-FEES             (err u11))
(define-constant ERR-INVALID-FEE-BPS     (err u12))
(define-constant ERR-TOKEN-MISMATCH      (err u13))

(define-constant BPS-DENOMINATOR u10000)

;; --- Private Helpers ---

(define-private (check-initialized)
  (ok (asserts! (var-get initialized) ERR-NOT-INITIALIZED))
)

;; --- Public Functions ---

(define-public (initialize
    (new-admin principal)
    (new-relayer principal)
    (new-fee-bps uint)
  )
  (begin
    (asserts! (not (var-get initialized)) ERR-ALREADY-INITIALIZED)
    (asserts! (<= new-fee-bps u10000) ERR-INVALID-FEE-BPS)
    (var-set admin new-admin)
    (var-set relayer new-relayer)
    (var-set fee-bps new-fee-bps)
    (var-set initialized true)
    (print {
      event: "initialized",
      data: {
        admin: new-admin,
        relayer: new-relayer,
        fee-bps: new-fee-bps
      }
    })
    (ok true)
  )
)

(define-public (create-order
    (order-id (buff 32))
    (token <sip-010-trait>)
    (amount uint)
    (rate uint)
    (expiry uint)
    (direction (string-ascii 8))
  )
  (begin
    (try! (check-initialized))
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (> expiry stacks-block-height) ERR-INVALID-EXPIRY)
    (asserts! (is-none (map-get? orders { order-id: order-id })) ERR-ORDER-ALREADY-EXISTS)
    (try! (contract-call? token transfer amount tx-sender (as-contract tx-sender) none))
    (map-set orders
      { order-id: order-id }
      {
        user: tx-sender,
        token: (contract-of token),
        amount: amount,
        rate: rate,
        expiry: expiry,
        direction: direction,
        status: "pending"
      }
    )
    (print {
      event: "order-created",
      data: {
        order-id: order-id,
        user: tx-sender,
        token: (contract-of token),
        amount: amount,
        rate: rate,
        expiry: expiry,
        direction: direction
      }
    })
    (ok true)
  )
)

(define-public (release-order
    (order-id (buff 32))
    (token <sip-010-trait>)
  )
  (let (
    (order (unwrap! (map-get? orders { order-id: order-id }) ERR-ORDER-NOT-FOUND))
    (order-user (get user order))
    (order-amount (get amount order))
    (fee (/ (* order-amount (var-get fee-bps)) BPS-DENOMINATOR))
    (net (- order-amount fee))
    (token-principal (contract-of token))
    (current-fees (default-to { amount: u0 }
                    (map-get? accumulated-fees { token: token-principal })))
  )
    (try! (check-initialized))
    (asserts! (is-eq tx-sender (var-get relayer)) ERR-UNAUTHORIZED)
    (asserts! (is-eq (get status order) "pending") ERR-ORDER-NOT-PENDING)
    (asserts! (is-eq token-principal (get token order)) ERR-TOKEN-MISMATCH)
    (try! (as-contract (contract-call? token transfer net tx-sender order-user none)))
    (map-set accumulated-fees
      { token: token-principal }
      { amount: (+ (get amount current-fees) fee) }
    )
    (map-set orders
      { order-id: order-id }
      (merge order { status: "released" })
    )
    (print {
      event: "order-released",
      data: {
        order-id: order-id,
        user: order-user,
        amount: order-amount,
        fee: fee,
        net: net
      }
    })
    (ok true)
  )
)

(define-public (refund-order
    (order-id (buff 32))
    (token <sip-010-trait>)
  )
  (let (
    (order (unwrap! (map-get? orders { order-id: order-id }) ERR-ORDER-NOT-FOUND))
    (order-user (get user order))
    (order-amount (get amount order))
    (token-principal (contract-of token))
  )
    (try! (check-initialized))
    (asserts! (is-eq (get status order) "pending") ERR-ORDER-NOT-PENDING)
    (asserts! (is-eq token-principal (get token order)) ERR-TOKEN-MISMATCH)
    (asserts!
      (or
        (is-eq tx-sender (var-get relayer))
        (and
          (is-eq tx-sender order-user)
          (>= stacks-block-height (get expiry order))
        )
      )
      ERR-UNAUTHORIZED
    )
    (try! (as-contract (contract-call? token transfer order-amount tx-sender order-user none)))
    (map-set orders
      { order-id: order-id }
      (merge order { status: "refunded" })
    )
    (print {
      event: "order-refunded",
      data: {
        order-id: order-id,
        user: order-user,
        amount: order-amount
      }
    })
    (ok true)
  )
)

(define-public (cancel-order
    (order-id (buff 32))
    (token <sip-010-trait>)
  )
  (let (
    (order (unwrap! (map-get? orders { order-id: order-id }) ERR-ORDER-NOT-FOUND))
    (order-user (get user order))
    (order-amount (get amount order))
    (token-principal (contract-of token))
  )
    (try! (check-initialized))
    (asserts! (is-eq (get status order) "pending") ERR-ORDER-NOT-PENDING)
    (asserts! (is-eq tx-sender order-user) ERR-UNAUTHORIZED)
    (asserts! (< stacks-block-height (get expiry order)) ERR-ORDER-EXPIRED)
    (asserts! (is-eq token-principal (get token order)) ERR-TOKEN-MISMATCH)
    (try! (as-contract (contract-call? token transfer order-amount tx-sender order-user none)))
    (map-set orders
      { order-id: order-id }
      (merge order { status: "cancelled" })
    )
    (print {
      event: "order-cancelled",
      data: {
        order-id: order-id,
        user: order-user,
        amount: order-amount
      }
    })
    (ok true)
  )
)

(define-public (collect-fees (token <sip-010-trait>))
  (let (
    (token-principal (contract-of token))
    (fee-entry (unwrap! (map-get? accumulated-fees { token: token-principal }) ERR-NO-FEES))
    (fee-amount (get amount fee-entry))
    (admin-addr (var-get admin))
  )
    (try! (check-initialized))
    (asserts! (is-eq tx-sender admin-addr) ERR-UNAUTHORIZED)
    (asserts! (> fee-amount u0) ERR-NO-FEES)
    (try! (as-contract (contract-call? token transfer fee-amount tx-sender admin-addr none)))
    (map-set accumulated-fees
      { token: token-principal }
      { amount: u0 }
    )
    (print {
      event: "fees-collected",
      data: {
        token: token-principal,
        amount: fee-amount,
        admin: admin-addr
      }
    })
    (ok true)
  )
)

;; --- Admin Functions ---

(define-public (set-relayer (new-relayer principal))
  (begin
    (try! (check-initialized))
    (asserts! (is-eq tx-sender (var-get admin)) ERR-UNAUTHORIZED)
    (var-set relayer new-relayer)
    (print {
      event: "relayer-updated",
      data: { new-relayer: new-relayer }
    })
    (ok true)
  )
)

(define-public (set-admin (new-admin principal))
  (begin
    (try! (check-initialized))
    (asserts! (is-eq tx-sender (var-get admin)) ERR-UNAUTHORIZED)
    (var-set admin new-admin)
    (print {
      event: "admin-updated",
      data: { new-admin: new-admin }
    })
    (ok true)
  )
)

(define-public (set-fee (new-fee-bps uint))
  (begin
    (try! (check-initialized))
    (asserts! (is-eq tx-sender (var-get admin)) ERR-UNAUTHORIZED)
    (asserts! (<= new-fee-bps u10000) ERR-INVALID-FEE-BPS)
    (var-set fee-bps new-fee-bps)
    (print {
      event: "fee-updated",
      data: { new-fee-bps: new-fee-bps }
    })
    (ok true)
  )
)

;; --- Read-Only Functions ---

(define-read-only (get-order (order-id (buff 32)))
  (map-get? orders { order-id: order-id })
)

(define-read-only (get-fee-bps)
  (var-get fee-bps)
)

(define-read-only (get-accumulated-fees (token principal))
  (default-to u0
    (get amount (map-get? accumulated-fees { token: token }))
  )
)

(define-read-only (get-relayer)
  (var-get relayer)
)

(define-read-only (get-admin)
  (var-get admin)
)
