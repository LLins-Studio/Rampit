# EaseCrypt React Frontend

React + Vite frontend for EaseCrypt.

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`

---

## For Backend Developers

### API Integration

All API calls are centralized in `src/api/`:

- **`src/api/endpoints.js`** — Lists every endpoint URL with full documentation (request/response format)
- **`src/api/index.js`** — Exports functions for each API call (e.g., `login()`, `getTransactions()`)

### Environment Variables

Set the backend URL in `.env`:

```
VITE_API_BASE_URL=http://localhost:4000/api
```

### Authentication

- Frontend stores JWT in `localStorage` under key `ec_token`
- All protected routes send: `Authorization: Bearer <token>`
- Backend must validate this token and return 401 if invalid

### Required Endpoints

#### **Auth**
- `POST /auth/register` — body: `{ email, password, fullName, phone }` → returns: `{ token, user }`
- `POST /auth/login` — body: `{ email, password }` → returns: `{ token, user }`
- `POST /auth/logout` — headers: `Authorization: Bearer <token>`

#### **Wallet**
- `GET /wallet` — headers: `Authorization: Bearer <token>` → returns: `{ address, balances: [{ token, amount }] }`
- `POST /wallet/connect` — body: `{ walletAddress, network }` → returns: `{ success, walletAddress }`

#### **Transactions**
- `GET /transactions` — query: `{ page, limit, type }` → returns: `{ transactions: [...], total, page }`
- `POST /transactions/initiate` — body: `{ amount, currency, walletAddress, bankCode }` → returns: `{ transactionId, bankAccount: { accountNumber, bankName, amount }, expiresAt }`
- `GET /transactions/:id` → returns: `{ transactionId, status, amount, token, walletAddress, createdAt }`

#### **Banks**
- `GET /banks` → returns: `{ banks: [{ bankCode, bankName, logoUrl }] }`
- `POST /banks/verify` — body: `{ accountNumber, bankCode }` → returns: `{ accountName, accountNumber, bankCode }`

#### **Rates**
- `GET /rates?tokens=BTC,ETH,USDT` → returns: `{ rates: [{ token, ngnRate, usdRate, change24h }], updatedAt }`

#### **User**
- `GET /user/profile` → returns: `{ id, fullName, email, phone, kycStatus }`
- `PATCH /user/profile` — body: `{ fullName, phone }` → returns: `{ success, user }`

### CORS

Enable CORS for `http://localhost:5173` during development.

### Error Format

Return errors as JSON:

```json
{
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

Frontend expects `message` field for user-facing errors.

---

## Project Structure

```
src/
├── api/              # API client & endpoints
├── assets/           # Images
├── components/       # React components
├── hooks/            # Custom hooks
├── App.jsx           # Main app
├── main.jsx          # Entry point
└── style.css         # Global styles
```
