# Stellar / Soroban integration

Rampit’s Next.js app talks to the deployed **RampitEscrow** Soroban contract via `@stellar/stellar-sdk` and **Freighter** for user signing.

## Layout

| Path | Role |
|------|------|
| `src/lib/stellar/config.ts` | Contract ID, RPC, USDC addresses, server secrets |
| `src/lib/stellar/client.ts` | Soroban RPC singleton |
| `src/lib/stellar/args.ts` | `ScVal` builders per contract function |
| `src/lib/stellar/contract.ts` | Simulate, sign, submit, poll |
| `src/app/api/stellar/invoke/route.ts` | Admin/relayer writes (server key) |
| `src/app/api/stellar/query/route.ts` | Read-only simulations |
| `src/hooks/useStellarWallet.ts` | Freighter connect + user txs |
| `src/hooks/useStellarContract.ts` | SWR queries |
| `src/components/stellar/*` | UI primitives |

## Environment

Create **`.env.local`** at the repo root (Next.js does not read `contracts/.env`):

```bash
cp .env.example .env.local
```

Required:

- `NEXT_PUBLIC_STELLAR_CONTRACT_ID` — mainnet: `CAFTDA2AO6GSKMB4CGN5H3BPFEBPDG7YRJQEVHPQGGFIPJFRKZUQADSH`
- `NEXT_PUBLIC_STELLAR_RPC_URL` — e.g. `https://mainnet.sorobanrpc.com`
- `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` — must be quoted (contains `;`)
- `ADMIN_SECRET_KEY` — `S...` secret for admin/relayer account (server only)
- `ADMIN_API_SECRET` — bearer token for `POST /api/stellar/invoke`

## Testnet

1. Set `NEXT_PUBLIC_STELLAR_CONTRACT_ID=CBALW6L6MMXHM272SUQNXCBJ5LA5WB6FS6DBEV2Z4W5CAUI4UIB3HOLL`
2. Set RPC to testnet Soroban endpoint and testnet passphrase
3. Use testnet USDC from `USDC_TESTNET` in `config.ts`
4. Fund accounts via [Stellar testnet friendbot](https://laboratory.stellar.org/#account-creator?network=testnet)

## Freighter wallet connect

1. Install [Freighter](https://www.freighter.app/)
2. `WalletConnect` → `requestAccess()` / `getAddress()`
3. User actions (`create_order`, `cancel_order`) call `signTransaction()` with the prepared XDR
4. Network in Freighter must match `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE`

## Admin API security

- **`ADMIN_SECRET_KEY`** is only imported in Route Handlers and `invokeContractAdmin` (guarded with `typeof window` check).
- **`POST /api/stellar/invoke`** requires `Authorization: Bearer <ADMIN_API_SECRET>`.
- `AdminPanel` stores the bearer token in `sessionStorage` only — never ship `ADMIN_API_SECRET` as `NEXT_PUBLIC_*`.
- Allowed server functions: `release_order`, `refund_order`, `collect_fees`, `set_relayer`, `set_admin`, `set_fee`, `initialize`.

## Adding a new contract call

1. Add `buildMyFnArgs(...)` in `src/lib/stellar/args.ts`
2. Register it in `buildArgsFromPayload` in `api-args.ts`
3. **User-signed:** call `signAndSubmit('my_fn', payload)` from `useStellarWallet`
4. **Admin-signed:** allowlist `my_fn` in `invoke/route.ts` and call via `AdminPanel` or `fetch('/api/stellar/invoke', ...)`
5. **Read-only:** add case in `buildQueryArgs` + `parseQueryResult` in `query/route.ts`

## Static export note

`next.config.ts` currently sets `output: "export"`, which **disables API routes** in production builds. To use `/api/stellar/*` in production, remove `output: "export"` or host API on a separate Node server.

## Mainnet contract

- **Contract:** `CAFTDA2AO6GSKMB4CGN5H3BPFEBPDG7YRJQEVHPQGGFIPJFRKZUQADSH`
- **Explorer:** [stellar.expert](https://stellar.expert/explorer/public/contract/CAFTDA2AO6GSKMB4CGN5H3BPFEBPDG7YRJQEVHPQGGFIPJFRKZUQADSH)
