/**
 * API Client — all HTTP calls to the backend.
 * Token stored in localStorage under 'rampit_token'.
 */

import ENDPOINTS from './endpoints';

const getToken = () => localStorage.getItem('rampit_token');

const headers = (auth = false, isFormData = false) => ({
  ...(!isFormData && { 'Content-Type': 'application/json' }),
  ...(auth && { Authorization: `Bearer ${getToken()}` }),
});

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

// ─── Auth ────────────────────────────────────────────────────────────────────
export const register        = (body) => fetch(ENDPOINTS.AUTH.REGISTER,        { method: 'POST', headers: headers(),     body: JSON.stringify(body) }).then(handle);
export const login           = (body) => fetch(ENDPOINTS.AUTH.LOGIN,           { method: 'POST', headers: headers(),     body: JSON.stringify(body) }).then(handle);
export const logout          = ()     => fetch(ENDPOINTS.AUTH.LOGOUT,          { method: 'POST', headers: headers(true)                             }).then(handle);
export const refreshToken    = (body) => fetch(ENDPOINTS.AUTH.REFRESH_TOKEN,   { method: 'POST', headers: headers(),     body: JSON.stringify(body) }).then(handle);
export const forgotPassword  = (body) => fetch(ENDPOINTS.AUTH.FORGOT_PASSWORD, { method: 'POST', headers: headers(),     body: JSON.stringify(body) }).then(handle);
export const resetPassword   = (body) => fetch(ENDPOINTS.AUTH.RESET_PASSWORD,  { method: 'POST', headers: headers(),     body: JSON.stringify(body) }).then(handle);
export const verifyEmail     = (body) => fetch(ENDPOINTS.AUTH.VERIFY_EMAIL,    { method: 'POST', headers: headers(true), body: JSON.stringify(body) }).then(handle);
export const resendOtp       = (body) => fetch(ENDPOINTS.AUTH.RESEND_OTP,      { method: 'POST', headers: headers(),     body: JSON.stringify(body) }).then(handle);

// ─── User ────────────────────────────────────────────────────────────────────
export const getUserProfile    = ()     => fetch(ENDPOINTS.USER.PROFILE,         { headers: headers(true)                                               }).then(handle);
export const updateUserProfile = (body) => fetch(ENDPOINTS.USER.PROFILE,         { method: 'PATCH',  headers: headers(true), body: JSON.stringify(body) }).then(handle);
export const changePassword    = (body) => fetch(ENDPOINTS.USER.CHANGE_PASSWORD, { method: 'PATCH',  headers: headers(true), body: JSON.stringify(body) }).then(handle);
export const deleteAccount     = ()     => fetch(ENDPOINTS.USER.DELETE_ACCOUNT,  { method: 'DELETE', headers: headers(true)                             }).then(handle);

// ─── KYC ─────────────────────────────────────────────────────────────────────
export const submitKyc  = (formData) => fetch(ENDPOINTS.KYC.SUBMIT, { method: 'POST', headers: headers(true, true), body: formData }).then(handle);
export const getKycStatus = ()       => fetch(ENDPOINTS.KYC.STATUS, { headers: headers(true) }).then(handle);

// ─── Wallet ──────────────────────────────────────────────────────────────────
export const getWallet           = ()     => fetch(ENDPOINTS.WALLET.GET,                { headers: headers(true)                                               }).then(handle);
export const connectWallet       = (body) => fetch(ENDPOINTS.WALLET.CONNECT,            { method: 'POST', headers: headers(true), body: JSON.stringify(body)   }).then(handle);
export const withdrawCrypto      = (body) => fetch(ENDPOINTS.WALLET.WITHDRAW,           { method: 'POST', headers: headers(true), body: JSON.stringify(body)   }).then(handle);
export const getSupportedNetworks = ()    => fetch(ENDPOINTS.WALLET.SUPPORTED_NETWORKS, { headers: headers(true)                                               }).then(handle);

// ─── Transactions ─────────────────────────────────────────────────────────────
export const getTransactions    = (params = {}) => fetch(`${ENDPOINTS.TRANSACTIONS.LIST}?${new URLSearchParams(params)}`, { headers: headers(true) }).then(handle);
export const initiateTransaction = (body)       => fetch(ENDPOINTS.TRANSACTIONS.INITIATE,      { method: 'POST', headers: headers(true), body: JSON.stringify(body) }).then(handle);
export const getTransactionById  = (id)         => fetch(ENDPOINTS.TRANSACTIONS.GET_BY_ID(id), { headers: headers(true) }).then(handle);
export const cancelTransaction   = (id)         => fetch(ENDPOINTS.TRANSACTIONS.CANCEL(id),    { method: 'POST', headers: headers(true) }).then(handle);
export const exportTransactions  = (params = {}) => fetch(`${ENDPOINTS.TRANSACTIONS.EXPORT}?${new URLSearchParams(params)}`, { headers: headers(true) }).then((res) => res.blob());

// ─── Banks ───────────────────────────────────────────────────────────────────
export const getBanks          = ()     => fetch(ENDPOINTS.BANKS.LIST,                  { headers: headers()     }).then(handle);
export const verifyBankAccount = (body) => fetch(ENDPOINTS.BANKS.VERIFY_ACCOUNT,        { method: 'POST',   headers: headers(true), body: JSON.stringify(body) }).then(handle);
export const getSavedAccounts  = ()     => fetch(ENDPOINTS.BANKS.SAVED,                 { headers: headers(true) }).then(handle);
export const saveAccount       = (body) => fetch(ENDPOINTS.BANKS.SAVED,                 { method: 'POST',   headers: headers(true), body: JSON.stringify(body) }).then(handle);
export const deleteSavedAccount = (id)  => fetch(ENDPOINTS.BANKS.DELETE_SAVED(id),      { method: 'DELETE', headers: headers(true) }).then(handle);

// ─── Rates ───────────────────────────────────────────────────────────────────
export const getRates   = (tokens = []) => fetch(`${ENDPOINTS.RATES.GET}${tokens.length ? `?tokens=${tokens.join(',')}` : ''}`, { headers: headers() }).then(handle);
export const convertRate = (params = {}) => fetch(`${ENDPOINTS.RATES.CONVERT}?${new URLSearchParams(params)}`, { headers: headers() }).then(handle);

// ─── Notifications ────────────────────────────────────────────────────────────
export const getNotifications       = (params = {}) => fetch(`${ENDPOINTS.NOTIFICATIONS.LIST}?${new URLSearchParams(params)}`, { headers: headers(true) }).then(handle);
export const markNotificationRead   = (id)          => fetch(ENDPOINTS.NOTIFICATIONS.MARK_READ(id), { method: 'PATCH', headers: headers(true) }).then(handle);
export const markAllNotificationsRead = ()           => fetch(ENDPOINTS.NOTIFICATIONS.READ_ALL,      { method: 'PATCH', headers: headers(true) }).then(handle);
export const updateNotificationPrefs = (body)        => fetch(ENDPOINTS.NOTIFICATIONS.PREFERENCES,   { method: 'PATCH', headers: headers(true), body: JSON.stringify(body) }).then(handle);

// ─── Referrals ────────────────────────────────────────────────────────────────
export const getReferrals   = ()     => fetch(ENDPOINTS.REFERRALS.GET,   { headers: headers(true) }).then(handle);
export const applyReferral  = (body) => fetch(ENDPOINTS.REFERRALS.APPLY, { method: 'POST', headers: headers(true), body: JSON.stringify(body) }).then(handle);

// ─── Support ──────────────────────────────────────────────────────────────────
export const createTicket  = (body) => fetch(ENDPOINTS.SUPPORT.CREATE_TICKET,    { method: 'POST', headers: headers(true), body: JSON.stringify(body) }).then(handle);
export const getTickets    = ()     => fetch(ENDPOINTS.SUPPORT.LIST_TICKETS,     { headers: headers(true) }).then(handle);
export const getTicketById = (id)   => fetch(ENDPOINTS.SUPPORT.GET_TICKET(id),   { headers: headers(true) }).then(handle);
export const replyTicket   = (id, body) => fetch(ENDPOINTS.SUPPORT.REPLY_TICKET(id), { method: 'POST', headers: headers(true), body: JSON.stringify(body) }).then(handle);

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminGetUsers       = ()     => fetch(ENDPOINTS.ADMIN.USERS,              { headers: headers(true) }).then(handle);
export const adminGetUser        = (id)   => fetch(ENDPOINTS.ADMIN.USER_BY_ID(id),     { headers: headers(true) }).then(handle);
export const adminSuspendUser    = (id)   => fetch(ENDPOINTS.ADMIN.SUSPEND_USER(id),   { method: 'PATCH', headers: headers(true) }).then(handle);
export const adminGetTransactions = ()    => fetch(ENDPOINTS.ADMIN.TRANSACTIONS,        { headers: headers(true) }).then(handle);
export const adminApproveKyc     = (id)   => fetch(ENDPOINTS.ADMIN.APPROVE_KYC(id),    { method: 'PATCH', headers: headers(true) }).then(handle);
export const adminRejectKyc      = (id)   => fetch(ENDPOINTS.ADMIN.REJECT_KYC(id),     { method: 'PATCH', headers: headers(true) }).then(handle);
export const adminGetStats       = ()     => fetch(ENDPOINTS.ADMIN.STATS,               { headers: headers(true) }).then(handle);
