/**
 * API Client
 *
 * Central place for all HTTP calls to the backend.
 * Import the relevant function wherever you need data in a component.
 *
 * Auth token is read from localStorage under the key 'ec_token'.
 * The backend dev should ensure all protected routes validate this Bearer token.
 */

import ENDPOINTS from './endpoints';

const getToken = () => localStorage.getItem('ec_token');

const headers = (auth = false) => ({
  'Content-Type': 'application/json',
  ...(auth && { Authorization: `Bearer ${getToken()}` }),
});

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

// --- Auth ---
export const register = (body) =>
  fetch(ENDPOINTS.AUTH.REGISTER, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handle);

export const login = (body) =>
  fetch(ENDPOINTS.AUTH.LOGIN, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handle);

export const logout = () =>
  fetch(ENDPOINTS.AUTH.LOGOUT, { method: 'POST', headers: headers(true) }).then(handle);

// --- Wallet ---
export const getWallet = () =>
  fetch(ENDPOINTS.WALLET.GET, { headers: headers(true) }).then(handle);

export const connectWallet = (body) =>
  fetch(ENDPOINTS.WALLET.CONNECT, { method: 'POST', headers: headers(true), body: JSON.stringify(body) }).then(handle);

// --- Transactions ---
export const getTransactions = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetch(`${ENDPOINTS.TRANSACTIONS.LIST}?${query}`, { headers: headers(true) }).then(handle);
};

export const initiateTransaction = (body) =>
  fetch(ENDPOINTS.TRANSACTIONS.INITIATE, { method: 'POST', headers: headers(true), body: JSON.stringify(body) }).then(handle);

export const getTransactionById = (id) =>
  fetch(ENDPOINTS.TRANSACTIONS.GET_BY_ID(id), { headers: headers(true) }).then(handle);

// --- Banks ---
export const getBanks = () =>
  fetch(ENDPOINTS.BANKS.LIST, { headers: headers() }).then(handle);

export const verifyBankAccount = (body) =>
  fetch(ENDPOINTS.BANKS.VERIFY_ACCOUNT, { method: 'POST', headers: headers(true), body: JSON.stringify(body) }).then(handle);

// --- Rates ---
export const getRates = (tokens = []) => {
  const query = tokens.length ? `?tokens=${tokens.join(',')}` : '';
  return fetch(`${ENDPOINTS.RATES.GET}${query}`, { headers: headers() }).then(handle);
};

// --- User ---
export const getUserProfile = () =>
  fetch(ENDPOINTS.USER.PROFILE, { headers: headers(true) }).then(handle);

export const updateUserProfile = (body) =>
  fetch(ENDPOINTS.USER.PROFILE, { method: 'PATCH', headers: headers(true), body: JSON.stringify(body) }).then(handle);
