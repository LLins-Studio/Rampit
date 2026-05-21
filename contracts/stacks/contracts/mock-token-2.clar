(impl-trait .sip-010-trait.sip-010-trait)

(define-fungible-token mock-token-2)

(define-constant ERR-UNAUTHORIZED (err u401))
(define-constant ERR-INSUFFICIENT-BALANCE (err u402))

(define-public (transfer
    (amount uint)
    (sender principal)
    (recipient principal)
    (memo (optional (buff 34)))
  )
  (begin
    (asserts! (is-eq tx-sender sender) ERR-UNAUTHORIZED)
    (try! (ft-transfer? mock-token-2 amount sender recipient))
    (match memo to-print (print to-print) 0x)
    (ok true)
  )
)

(define-read-only (get-name)
  (ok "Mock Token 2")
)

(define-read-only (get-symbol)
  (ok "MCK2")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance mock-token-2 account))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply mock-token-2))
)

(define-read-only (get-token-uri)
  (ok none)
)

(define-public (mint (amount uint) (recipient principal))
  (ft-mint? mock-token-2 amount recipient)
)
