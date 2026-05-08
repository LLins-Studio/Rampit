/**
 * API Endpoint Constants
 *
 * Backend dev: implement these REST endpoints on your server.
 * Base URL is read from the VITE_API_BASE_URL environment variable.
 * Set it in a .env file at the project root:
 *   VITE_API_BASE_URL=http://localhost:4000/api
 */

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const ENDPOINTS = {

  /**
   * ─── AUTH ────────────────────────────────────────────────────────────────
   * POST /auth/register
   *   body: { fullName, email, phone, password }
   *   returns: { token, user }
   *
   * POST /auth/login
   *   body: { email, password }
   *   returns: { token, user }
   *
   * POST /auth/logout
   *   headers: Authorization: Bearer <token>
   *
   * POST /auth/refresh-token
   *   body: { refreshToken }
   *   returns: { token }
   *
   * POST /auth/forgot-password
   *   body: { email }
   *   returns: { message }
   *
   * POST /auth/reset-password
   *   body: { token, newPassword }
   *   returns: { message }
   *
   * POST /auth/verify-email
   *   body: { otp }
   *   returns: { message }
   *
   * POST /auth/resend-otp
   *   body: { email }
   *   returns: { message }
   */
  AUTH: {
    REGISTER:         `${BASE_URL}/auth/register`,
    LOGIN:            `${BASE_URL}/auth/login`,
    LOGOUT:           `${BASE_URL}/auth/logout`,
    REFRESH_TOKEN:    `${BASE_URL}/auth/refresh-token`,
    FORGOT_PASSWORD:  `${BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD:   `${BASE_URL}/auth/reset-password`,
    VERIFY_EMAIL:     `${BASE_URL}/auth/verify-email`,
    RESEND_OTP:       `${BASE_URL}/auth/resend-otp`,
  },

  /**
   * ─── USER ────────────────────────────────────────────────────────────────
   * GET   /user/profile
   *   returns: { id, fullName, email, phone, kycStatus, createdAt }
   *
   * PATCH /user/profile
   *   body: { fullName, phone }
   *   returns: { success, user }
   *
   * PATCH /user/change-password
   *   body: { currentPassword, newPassword }
   *   returns: { message }
   *
   * DELETE /user/account
   *   returns: { message }
   */
  USER: {
    PROFILE:         `${BASE_URL}/user/profile`,
    CHANGE_PASSWORD: `${BASE_URL}/user/change-password`,
    DELETE_ACCOUNT:  `${BASE_URL}/user/account`,
  },

  /**
   * ─── KYC ─────────────────────────────────────────────────────────────────
   * POST /kyc/submit
   *   body: FormData { idType, idNumber, idFront (file), idBack (file), selfie (file) }
   *   returns: { kycId, status }
   *
   * GET /kyc/status
   *   returns: { status: 'pending' | 'approved' | 'rejected', reason? }
   */
  KYC: {
    SUBMIT: `${BASE_URL}/kyc/submit`,
    STATUS: `${BASE_URL}/kyc/status`,
  },

  /**
   * ─── WALLET ──────────────────────────────────────────────────────────────
   * GET /wallet
   *   returns: { address, balances: [{ token, amount, usdValue }] }
   *
   * POST /wallet/connect
   *   body: { walletAddress, network }
   *   returns: { success, walletAddress }
   *
   * POST /wallet/withdraw
   *   body: { token, amount, destinationAddress, network }
   *   returns: { transactionId, status, fee }
   *
   * GET /wallet/supported-networks
   *   returns: { networks: [{ id, name, tokens: [] }] }
   */
  WALLET: {
    GET:                `${BASE_URL}/wallet`,
    CONNECT:            `${BASE_URL}/wallet/connect`,
    WITHDRAW:           `${BASE_URL}/wallet/withdraw`,
    SUPPORTED_NETWORKS: `${BASE_URL}/wallet/supported-networks`,
  },

  /**
   * ─── TRANSACTIONS ────────────────────────────────────────────────────────
   * GET /transactions
   *   query: { page, limit, type: 'buy'|'sell'|'withdraw', status }
   *   returns: { transactions: [...], total, page }
   *
   * POST /transactions/initiate
   *   body: { amount, currency, walletAddress, bankCode, token }
   *   returns: { transactionId, bankAccount: { accountNumber, bankName, amount }, expiresAt }
   *
   * GET /transactions/:id
   *   returns: { transactionId, status, amount, token, walletAddress, createdAt, updatedAt }
   *
   * POST /transactions/:id/cancel
   *   returns: { message }
   *
   * GET /transactions/export
   *   query: { from, to, format: 'csv'|'pdf' }
   *   returns: file download
   */
  TRANSACTIONS: {
    LIST:       `${BASE_URL}/transactions`,
    INITIATE:   `${BASE_URL}/transactions/initiate`,
    GET_BY_ID:  (id) => `${BASE_URL}/transactions/${id}`,
    CANCEL:     (id) => `${BASE_URL}/transactions/${id}/cancel`,
    EXPORT:     `${BASE_URL}/transactions/export`,
  },

  /**
   * ─── BANKS ───────────────────────────────────────────────────────────────
   * GET /banks
   *   returns: { banks: [{ bankCode, bankName, logoUrl }] }
   *
   * POST /banks/verify
   *   body: { accountNumber, bankCode }
   *   returns: { accountName, accountNumber, bankCode }
   *
   * GET /banks/saved
   *   returns: { accounts: [{ id, accountName, accountNumber, bankName }] }
   *
   * POST /banks/saved
   *   body: { accountNumber, bankCode }
   *   returns: { id, accountName, accountNumber, bankName }
   *
   * DELETE /banks/saved/:id
   *   returns: { message }
   */
  BANKS: {
    LIST:           `${BASE_URL}/banks`,
    VERIFY_ACCOUNT: `${BASE_URL}/banks/verify`,
    SAVED:          `${BASE_URL}/banks/saved`,
    DELETE_SAVED:   (id) => `${BASE_URL}/banks/saved/${id}`,
  },

  /**
   * ─── RATES ───────────────────────────────────────────────────────────────
   * GET /rates
   *   query: { tokens } e.g. ?tokens=BTC,ETH,USDT
   *   returns: { rates: [{ token, ngnRate, usdRate, change24h }], updatedAt }
   *
   * GET /rates/convert
   *   query: { from, to, amount }
   *   returns: { result, rate, fee }
   */
  RATES: {
    GET:     `${BASE_URL}/rates`,
    CONVERT: `${BASE_URL}/rates/convert`,
  },

  /**
   * ─── NOTIFICATIONS ───────────────────────────────────────────────────────
   * GET /notifications
   *   query: { page, limit, read: true|false }
   *   returns: { notifications: [...], unreadCount }
   *
   * PATCH /notifications/:id/read
   *   returns: { message }
   *
   * PATCH /notifications/read-all
   *   returns: { message }
   *
   * PATCH /notifications/preferences
   *   body: { email: bool, push: bool, sms: bool }
   *   returns: { preferences }
   */
  NOTIFICATIONS: {
    LIST:        `${BASE_URL}/notifications`,
    MARK_READ:   (id) => `${BASE_URL}/notifications/${id}/read`,
    READ_ALL:    `${BASE_URL}/notifications/read-all`,
    PREFERENCES: `${BASE_URL}/notifications/preferences`,
  },

  /**
   * ─── REFERRALS ───────────────────────────────────────────────────────────
   * GET /referrals
   *   returns: { referralCode, totalReferrals, totalEarned, referrals: [...] }
   *
   * POST /referrals/apply
   *   body: { referralCode }
   *   returns: { message, bonus }
   */
  REFERRALS: {
    GET:   `${BASE_URL}/referrals`,
    APPLY: `${BASE_URL}/referrals/apply`,
  },

  /**
   * ─── SUPPORT ─────────────────────────────────────────────────────────────
   * POST /support/ticket
   *   body: { subject, message, category }
   *   returns: { ticketId, status }
   *
   * GET /support/tickets
   *   returns: { tickets: [{ ticketId, subject, status, createdAt }] }
   *
   * GET /support/tickets/:id
   *   returns: { ticketId, subject, messages: [...], status }
   *
   * POST /support/tickets/:id/reply
   *   body: { message }
   *   returns: { message }
   */
  SUPPORT: {
    CREATE_TICKET: `${BASE_URL}/support/ticket`,
    LIST_TICKETS:  `${BASE_URL}/support/tickets`,
    GET_TICKET:    (id) => `${BASE_URL}/support/tickets/${id}`,
    REPLY_TICKET:  (id) => `${BASE_URL}/support/tickets/${id}/reply`,
  },

  /**
   * ─── ADMIN (protected — admin role only) ─────────────────────────────────
   * GET    /admin/users              — List all users
   * GET    /admin/users/:id          — Get user details
   * PATCH  /admin/users/:id/suspend  — Suspend a user
   * GET    /admin/transactions        — List all transactions
   * PATCH  /admin/kyc/:id/approve    — Approve KYC
   * PATCH  /admin/kyc/:id/reject     — Reject KYC
   * GET    /admin/stats              — Dashboard stats
   */
  ADMIN: {
    USERS:           `${BASE_URL}/admin/users`,
    USER_BY_ID:      (id) => `${BASE_URL}/admin/users/${id}`,
    SUSPEND_USER:    (id) => `${BASE_URL}/admin/users/${id}/suspend`,
    TRANSACTIONS:    `${BASE_URL}/admin/transactions`,
    APPROVE_KYC:     (id) => `${BASE_URL}/admin/kyc/${id}/approve`,
    REJECT_KYC:      (id) => `${BASE_URL}/admin/kyc/${id}/reject`,
    STATS:           `${BASE_URL}/admin/stats`,
  },
};

export default ENDPOINTS;
