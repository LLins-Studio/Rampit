/**
 * API Endpoint Constants
 *
 * Backend dev: implement these REST endpoints on your server.
 * Base URL is read from the VITE_API_BASE_URL environment variable.
 * Set it in a .env file at the project root:
 *   VITE_API_BASE_URL=http://localhost:4000/api
 *
 * All endpoints below are relative to that base URL.
 */

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const ENDPOINTS = {
  /**
   * AUTH
   * POST /auth/register   — Register a new user
   *   body: { email, password, fullName, phone }
   *   returns: { token, user }
   *
   * POST /auth/login      — Login with email & password
   *   body: { email, password }
   *   returns: { token, user }
   *
   * POST /auth/logout     — Invalidate session token
   *   headers: Authorization: Bearer <token>
   */
  AUTH: {
    REGISTER: `${BASE_URL}/auth/register`,
    LOGIN: `${BASE_URL}/auth/login`,
    LOGOUT: `${BASE_URL}/auth/logout`,
  },

  /**
   * WALLET
   * GET  /wallet          — Get the authenticated user's wallet info
   *   headers: Authorization: Bearer <token>
   *   returns: { address, balances: [{ token, amount }] }
   *
   * POST /wallet/connect  — Link a wallet address to the user account
   *   body: { walletAddress, network }
   *   returns: { success, walletAddress }
   */
  WALLET: {
    GET: `${BASE_URL}/wallet`,
    CONNECT: `${BASE_URL}/wallet/connect`,
  },

  /**
   * TRANSACTIONS
   * GET  /transactions          — List all transactions for the user
   *   headers: Authorization: Bearer <token>
   *   query params: { page, limit, type }
   *   returns: { transactions: [...], total, page }
   *
   * POST /transactions/initiate — Initiate a Naira to Crypto purchase
   *   body: { amount, currency, walletAddress, bankCode }
   *   returns: { transactionId, bankAccount: { accountNumber, bankName, amount }, expiresAt }
   *
   * GET  /transactions/:id      — Get status of a specific transaction
   *   returns: { transactionId, status, amount, token, walletAddress, createdAt }
   */
  TRANSACTIONS: {
    LIST: `${BASE_URL}/transactions`,
    INITIATE: `${BASE_URL}/transactions/initiate`,
    GET_BY_ID: (id) => `${BASE_URL}/transactions/${id}`,
  },

  /**
   * BANKS
   * GET /banks            — List all supported Nigerian banks
   *   returns: { banks: [{ bankCode, bankName, logoUrl }] }
   *
   * POST /banks/verify    — Verify a bank account number
   *   body: { accountNumber, bankCode }
   *   returns: { accountName, accountNumber, bankCode }
   */
  BANKS: {
    LIST: `${BASE_URL}/banks`,
    VERIFY_ACCOUNT: `${BASE_URL}/banks/verify`,
  },

  /**
   * RATES
   * GET /rates            — Get current Naira to crypto exchange rates
   *   query params: { tokens } e.g. ?tokens=BTC,ETH,USDT
   *   returns: { rates: [{ token, ngnRate, usdRate, change24h }], updatedAt }
   */
  RATES: {
    GET: `${BASE_URL}/rates`,
  },

  /**
   * USER
   * GET   /user/profile   — Get authenticated user's profile
   *   headers: Authorization: Bearer <token>
   *   returns: { id, fullName, email, phone, kycStatus }
   *
   * PATCH /user/profile   — Update user profile
   *   body: { fullName, phone }
   *   returns: { success, user }
   */
  USER: {
    PROFILE: `${BASE_URL}/user/profile`,
  },
};

export default ENDPOINTS;
