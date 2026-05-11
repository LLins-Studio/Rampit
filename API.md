# Rampit API Documentation

Full production backend endpoint reference.  
Base URL: `https://api.rampit.xyz/v1`  
All protected routes require: `Authorization: Bearer <token>`  
All request/response bodies are `application/json` unless stated otherwise.

---

## Table of Contents

1. [Auth](#1-auth)
2. [User](#2-user)
3. [KYC](#3-kyc)
4. [Wallet](#4-wallet)
5. [Transactions](#5-transactions)
6. [Banks](#6-banks)
7. [Rates & Conversion](#7-rates--conversion)
8. [Notifications](#8-notifications)
9. [Referrals](#9-referrals)
10. [Support](#10-support)
11. [Webhooks](#11-webhooks)
12. [Admin](#12-admin)
13. [Error Format](#13-error-format)
14. [Status Codes](#14-status-codes)

---

## 1. Auth

### POST `/auth/register`
Register a new user.

**Body**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+2348000000000",
  "password": "Min8Characters",
  "referralCode": "ABC123"
}
```
**Returns**
```json
{
  "token": "<jwt>",
  "refreshToken": "<jwt>",
  "user": { "id": "", "fullName": "", "email": "", "phone": "", "kycStatus": "pending" }
}
```

---

### POST `/auth/login`
Login with email and password.

**Body**
```json
{ "email": "john@example.com", "password": "Min8Characters" }
```
**Returns**
```json
{
  "token": "<jwt>",
  "refreshToken": "<jwt>",
  "user": { "id": "", "fullName": "", "email": "", "phone": "", "kycStatus": "" }
}
```

---

### POST `/auth/logout`
🔒 Protected. Invalidate the current session token.

**Returns**
```json
{ "message": "Logged out successfully" }
```

---

### POST `/auth/refresh-token`
Get a new access token using a refresh token.

**Body**
```json
{ "refreshToken": "<jwt>" }
```
**Returns**
```json
{ "token": "<jwt>" }
```

---

### POST `/auth/forgot-password`
Send a password reset link to the user's email.

**Body**
```json
{ "email": "john@example.com" }
```
**Returns**
```json
{ "message": "Reset link sent to your email" }
```

---

### POST `/auth/reset-password`
Reset password using the token from the email link.

**Body**
```json
{ "token": "<reset-token>", "newPassword": "NewPassword123" }
```
**Returns**
```json
{ "message": "Password reset successfully" }
```

---

### POST `/auth/verify-email`
🔒 Protected. Verify email with OTP sent after registration.

**Body**
```json
{ "otp": "123456" }
```
**Returns**
```json
{ "message": "Email verified successfully" }
```

---

### POST `/auth/resend-otp`
Resend email verification OTP.

**Body**
```json
{ "email": "john@example.com" }
```
**Returns**
```json
{ "message": "OTP resent successfully" }
```

---

### POST `/auth/2fa/enable`
🔒 Protected. Enable two-factor authentication (TOTP).

**Returns**
```json
{ "qrCode": "<base64-image>", "secret": "<totp-secret>" }
```

---

### POST `/auth/2fa/verify`
🔒 Protected. Verify TOTP code to complete 2FA setup.

**Body**
```json
{ "code": "123456" }
```
**Returns**
```json
{ "message": "2FA enabled successfully", "backupCodes": ["...", "..."] }
```

---

### POST `/auth/2fa/disable`
🔒 Protected. Disable two-factor authentication.

**Body**
```json
{ "code": "123456" }
```
**Returns**
```json
{ "message": "2FA disabled" }
```

---

## 2. User

### GET `/user/profile`
🔒 Protected. Get the authenticated user's profile.

**Returns**
```json
{
  "id": "",
  "fullName": "",
  "email": "",
  "phone": "",
  "kycStatus": "pending | approved | rejected",
  "twoFactorEnabled": false,
  "referralCode": "ABC123",
  "createdAt": ""
}
```

---

### PATCH `/user/profile`
🔒 Protected. Update user profile.

**Body**
```json
{ "fullName": "John Doe", "phone": "+2348000000000" }
```
**Returns**
```json
{ "success": true, "user": { "fullName": "", "phone": "" } }
```

---

### PATCH `/user/change-password`
🔒 Protected. Change account password.

**Body**
```json
{ "currentPassword": "OldPass123", "newPassword": "NewPass123" }
```
**Returns**
```json
{ "message": "Password updated successfully" }
```

---

### PATCH `/user/avatar`
🔒 Protected. Upload a profile picture.  
**Content-Type:** `multipart/form-data`

**Body**
```
avatar: <file>
```
**Returns**
```json
{ "avatarUrl": "https://cdn.rampit.xyz/avatars/user-id.jpg" }
```

---

### DELETE `/user/account`
🔒 Protected. Request account deletion (soft delete, 30-day grace period).

**Returns**
```json
{ "message": "Account scheduled for deletion in 30 days" }
```

---

## 3. KYC

### POST `/kyc/submit`
🔒 Protected. Submit KYC documents.  
**Content-Type:** `multipart/form-data`

**Body**
```
idType: "nin" | "bvn" | "passport" | "drivers_license"
idNumber: "12345678901"
idFront: <file>
idBack: <file>
selfie: <file>
```
**Returns**
```json
{ "kycId": "", "status": "pending" }
```
---

### GET `/kyc/status`
🔒 Protected. Get current KYC verification status.

**Returns**
```json
{
  "status": "pending | approved | rejected",
  "reason": "Document unclear",
  "submittedAt": "",
  "reviewedAt": ""
}
```

---

### GET `/kyc/limits`
🔒 Protected. Get transaction limits based on KYC tier.

**Returns**
```json
{
  "tier": 1,
  "dailyLimit": 500000,
  "monthlyLimit": 2000000,
  "currency": "NGN"
}
```

---

## 4. Wallet

### GET `/wallet`
🔒 Protected. Get wallet info and balances.

**Returns**
```json
{
  "address": "0x...",
  "balances": [
    { "token": "USDT", "amount": "100.00", "usdValue": "100.00" },
    { "token": "BTC", "amount": "0.002", "usdValue": "120.00" }
  ],
  "totalUsdValue": "220.00"
}
```

---

### POST `/wallet/connect`
🔒 Protected. Link an external wallet address.

**Body**
```json
{ "walletAddress": "0x...", "network": "ethereum | bsc | tron" }
```
**Returns**
```json
{ "success": true, "walletAddress": "0x..." }
```

---

### POST `/wallet/withdraw`
🔒 Protected. Withdraw crypto to an external wallet.

**Body**
```json
{
  "token": "USDT",
  "amount": "50.00",
  "destinationAddress": "0x...",
  "network": "tron",
  "twoFactorCode": "123456"
}
```
**Returns**
```json
{
  "transactionId": "",
  "status": "pending",
  "fee": "1.00",
  "estimatedArrival": "2-5 minutes"
}
```

---

### GET `/wallet/supported-networks`
Get all supported blockchain networks and tokens.

**Returns**
```json
{
  "networks": [
    {
      "id": "tron",
      "name": "Tron (TRC-20)",
      "tokens": ["USDT", "TRX"],
      "withdrawalFee": "1.00"
    }
  ]
}
```

---

### GET `/wallet/transactions`
🔒 Protected. Get on-chain transaction history for the wallet.

**Query Params:** `page`, `limit`, `token`, `type: deposit | withdrawal`

**Returns**
```json
{
  "transactions": [
    { "hash": "0x...", "type": "deposit", "token": "USDT", "amount": "100", "status": "confirmed", "createdAt": "" }
  ],
  "total": 1,
  "page": 1
}
```

---

## 5. Transactions

### GET `/transactions`
🔒 Protected. List all fiat-to-crypto transactions.

**Query Params:** `page`, `limit`, `type: buy | sell | withdraw`, `status: pending | completed | failed | cancelled`

**Returns**
```json
{
  "transactions": [
    {
      "id": "",
      "type": "buy",
      "status": "completed",
      "amount": "10000",
      "currency": "NGN",
      "token": "USDT",
      "tokenAmount": "6.25",
      "walletAddress": "0x...",
      "createdAt": "",
      "updatedAt": ""
    }
  ],
  "total": 10,
  "page": 1
}
```

---

### POST `/transactions/initiate`
🔒 Protected. Initiate a Naira → Crypto buy order.

**Body**
```json
{
  "amount": 10000,
  "currency": "NGN",
  "token": "USDT",
  "walletAddress": "0x...",
  "bankCode": "058",
  "savedAccountId": "optional"
}
```
**Returns**
```json
{
  "transactionId": "",
  "bankAccount": {
    "accountNumber": "0123456789",
    "bankName": "GTBank",
    "accountName": "Rampit Technologies",
    "amount": 10000
  },
  "expiresAt": "2026-01-01T00:30:00Z",
  "reference": "RMP-20260101-XXXX"
}
```

---

### GET `/transactions/:id`
🔒 Protected. Get a single transaction by ID.

**Returns**
```json
{
  "id": "",
  "type": "buy",
  "status": "pending | processing | completed | failed | cancelled",
  "amount": "10000",
  "currency": "NGN",
  "token": "USDT",
  "tokenAmount": "6.25",
  "rate": "1600",
  "fee": "100",
  "walletAddress": "0x...",
  "reference": "RMP-20260101-XXXX",
  "createdAt": "",
  "updatedAt": ""
}
```

---

### POST `/transactions/:id/cancel`
🔒 Protected. Cancel a pending transaction.

**Returns**
```json
{ "message": "Transaction cancelled successfully" }
```

---

### GET `/transactions/export`
🔒 Protected. Export transaction history.

**Query Params:** `from: YYYY-MM-DD`, `to: YYYY-MM-DD`, `format: csv | pdf`

**Returns:** File download (`text/csv` or `application/pdf`)

---

## 6. Banks

### GET `/banks`
Get list of all supported Nigerian banks.

**Returns**
```json
{
  "banks": [
    { "bankCode": "058", "bankName": "GTBank", "logoUrl": "https://cdn.rampit.xyz/banks/gtbank.png" }
  ]
}
```

---

### POST `/banks/verify`
🔒 Protected. Verify a Nigerian bank account number.

**Body**
```json
{ "accountNumber": "0123456789", "bankCode": "058" }
```
**Returns**
```json
{ "accountName": "John Doe", "accountNumber": "0123456789", "bankCode": "058" }
```

---

### GET `/banks/saved`
🔒 Protected. Get user's saved bank accounts.

**Returns**
```json
{
  "accounts": [
    { "id": "", "accountName": "John Doe", "accountNumber": "0123456789", "bankName": "GTBank", "bankCode": "058" }
  ]
}
```

---

### POST `/banks/saved`
🔒 Protected. Save a bank account.

**Body**
```json
{ "accountNumber": "0123456789", "bankCode": "058" }
```
**Returns**
```json
{ "id": "", "accountName": "John Doe", "accountNumber": "0123456789", "bankName": "GTBank" }
```

---

### DELETE `/banks/saved/:id`
🔒 Protected. Remove a saved bank account.

**Returns**
```json
{ "message": "Account removed" }
```

---

## 7. Rates & Conversion

### GET `/rates`
Get live Naira-to-crypto exchange rates.

**Query Params:** `tokens=BTC,ETH,USDT`

**Returns**
```json
{
  "rates": [
    { "token": "USDT", "ngnRate": "1600", "usdRate": "1.00", "change24h": "+0.1%" },
    { "token": "BTC", "ngnRate": "95000000", "usdRate": "59375", "change24h": "-2.3%" }
  ],
  "updatedAt": "2026-01-01T00:00:00Z"
}
```

---

### GET `/rates/convert`
Calculate conversion amount including fees.

**Query Params:** `from=NGN`, `to=USDT`, `amount=10000`

**Returns**
```json
{
  "from": "NGN",
  "to": "USDT",
  "inputAmount": "10000",
  "outputAmount": "6.00",
  "rate": "1600",
  "fee": "100",
  "feePercent": "1%",
  "total": "10100"
}
```

---

## 8. Notifications

### GET `/notifications`
🔒 Protected. Get user notifications.

**Query Params:** `page`, `limit`, `read: true | false`

**Returns**
```json
{
  "notifications": [
    { "id": "", "title": "Transaction Completed", "body": "Your USDT has been sent.", "read": false, "createdAt": "" }
  ],
  "unreadCount": 3,
  "total": 10
}
```

---

### PATCH `/notifications/:id/read`
🔒 Protected. Mark a notification as read.

**Returns**
```json
{ "message": "Marked as read" }
```

---

### PATCH `/notifications/read-all`
🔒 Protected. Mark all notifications as read.

**Returns**
```json
{ "message": "All notifications marked as read" }
```

---

### GET `/notifications/preferences`
🔒 Protected. Get notification preferences.

**Returns**
```json
{ "email": true, "push": true, "sms": false }
```

---

### PATCH `/notifications/preferences`
🔒 Protected. Update notification preferences.

**Body**
```json
{ "email": true, "push": false, "sms": true }
```
**Returns**
```json
{ "preferences": { "email": true, "push": false, "sms": true } }
```

---

## 9. Referrals

### GET `/referrals`
🔒 Protected. Get referral info and earnings.

**Returns**
```json
{
  "referralCode": "JOHN123",
  "referralLink": "https://rampit.xyz/register?ref=JOHN123",
  "totalReferrals": 5,
  "totalEarned": "2500",
  "currency": "NGN",
  "referrals": [
    { "name": "Jane D.", "joinedAt": "", "status": "active", "earned": "500" }
  ]
}
```

---

### POST `/referrals/apply`
🔒 Protected. Apply a referral code (one-time, at registration or within 24hrs).

**Body**
```json
{ "referralCode": "JOHN123" }
```
**Returns**
```json
{ "message": "Referral applied", "bonus": "500", "currency": "NGN" }
```

---

## 10. Support

### POST `/support/ticket`
🔒 Protected. Create a support ticket.

**Body**
```json
{
  "subject": "Transaction not received",
  "message": "I made a transfer but my USDT hasn't arrived.",
  "category": "transaction | account | kyc | other",
  "transactionId": "optional"
}
```
**Returns**
```json
{ "ticketId": "TKT-0001", "status": "open" }
```

---

### GET `/support/tickets`
🔒 Protected. List all support tickets for the user.

**Returns**
```json
{
  "tickets": [
    { "ticketId": "TKT-0001", "subject": "", "status": "open | in_progress | resolved | closed", "createdAt": "" }
  ]
}
```

---

### GET `/support/tickets/:id`
🔒 Protected. Get a support ticket with full message thread.

**Returns**
```json
{
  "ticketId": "TKT-0001",
  "subject": "",
  "status": "open",
  "messages": [
    { "sender": "user | support", "message": "", "createdAt": "" }
  ]
}
```

---

### POST `/support/tickets/:id/reply`
🔒 Protected. Reply to a support ticket.

**Body**
```json
{ "message": "Here is my bank receipt..." }
```
**Returns**
```json
{ "message": "Reply sent" }
```

---

### GET `/support/faq`
Get frequently asked questions. Public.

**Returns**
```json
{
  "faqs": [
    { "question": "How long does a transfer take?", "answer": "Under 60 seconds.", "category": "transactions" }
  ]
}
```

---

## 11. Webhooks

> Backend dev: these are outgoing webhooks Rampit fires to notify external systems (e.g. payment processors, internal services).

### POST `<your-webhook-url>`
Rampit will POST to your registered URL on these events:

| Event | Description |
|---|---|
| `transaction.initiated` | User initiated a buy order |
| `transaction.payment_received` | Bank transfer confirmed |
| `transaction.completed` | Crypto sent to user wallet |
| `transaction.failed` | Transaction failed |
| `transaction.cancelled` | User cancelled |
| `kyc.submitted` | User submitted KYC docs |
| `kyc.approved` | KYC approved |
| `kyc.rejected` | KYC rejected |
| `user.registered` | New user signed up |
| `wallet.withdrawal_initiated` | Crypto withdrawal started |
| `wallet.withdrawal_completed` | Crypto withdrawal confirmed on-chain |

**Payload shape**
```json
{
  "event": "transaction.completed",
  "timestamp": "2026-01-01T00:00:00Z",
  "data": { }
}
```

> Sign all webhook payloads with `HMAC-SHA256` using a shared secret. Frontend will verify the `X-Rampit-Signature` header.

---

## 12. Admin

> All admin routes require `Authorization: Bearer <token>` with role `admin`.

### GET `/admin/stats`
Dashboard overview stats.

**Returns**
```json
{
  "totalUsers": 1200,
  "totalTransactions": 8500,
  "totalVolume": "45000000",
  "currency": "NGN",
  "pendingKyc": 34,
  "openTickets": 12,
  "activeUsers24h": 320
}
```

---

### GET `/admin/users`
List all users.

**Query Params:** `page`, `limit`, `search`, `kycStatus`, `status: active | suspended`

**Returns**
```json
{
  "users": [
    { "id": "", "fullName": "", "email": "", "phone": "", "kycStatus": "", "status": "", "createdAt": "" }
  ],
  "total": 1200
}
```

---

### GET `/admin/users/:id`
Get full details of a specific user.

**Returns**
```json
{
  "id": "", "fullName": "", "email": "", "phone": "",
  "kycStatus": "", "status": "", "walletAddress": "",
  "totalTransactions": 5, "totalVolume": "50000", "createdAt": ""
}
```

---

### PATCH `/admin/users/:id/suspend`
Suspend or unsuspend a user account.

**Body**
```json
{ "reason": "Suspicious activity", "suspend": true }
```
**Returns**
```json
{ "message": "User suspended" }
```

---

### GET `/admin/transactions`
List all transactions across all users.

**Query Params:** `page`, `limit`, `status`, `type`, `from`, `to`, `userId`

**Returns**
```json
{
  "transactions": [ ],
  "total": 8500
}
```

---

### GET `/admin/kyc`
List all KYC submissions.

**Query Params:** `page`, `limit`, `status: pending | approved | rejected`

**Returns**
```json
{
  "submissions": [
    { "kycId": "", "userId": "", "fullName": "", "idType": "", "status": "", "submittedAt": "" }
  ],
  "total": 34
}
```

---

### GET `/admin/kyc/:id`
Get full KYC submission with document URLs.

**Returns**
```json
{
  "kycId": "", "userId": "", "idType": "", "idNumber": "",
  "idFrontUrl": "", "idBackUrl": "", "selfieUrl": "",
  "status": "", "submittedAt": ""
}
```

---

### PATCH `/admin/kyc/:id/approve`
Approve a KYC submission.

**Returns**
```json
{ "message": "KYC approved" }
```

---

### PATCH `/admin/kyc/:id/reject`
Reject a KYC submission with a reason.

**Body**
```json
{ "reason": "ID document is blurry" }
```
**Returns**
```json
{ "message": "KYC rejected" }
```

---

### GET `/admin/support/tickets`
List all support tickets.

**Query Params:** `page`, `limit`, `status`, `category`

**Returns**
```json
{ "tickets": [ ], "total": 12 }
```

---

### POST `/admin/support/tickets/:id/reply`
Reply to a user's support ticket as support agent.

**Body**
```json
{ "message": "We have resolved your issue." }
```
**Returns**
```json
{ "message": "Reply sent" }
```

---

### PATCH `/admin/support/tickets/:id/close`
Close a support ticket.

**Returns**
```json
{ "message": "Ticket closed" }
```

---

## 13. Error Format

All errors return a consistent JSON shape:

```json
{
  "message": "Human-readable error description",
  "code": "MACHINE_READABLE_CODE",
  "field": "email"
}
```

**Common error codes:**

| Code | Meaning |
|---|---|
| `INVALID_CREDENTIALS` | Wrong email or password |
| `EMAIL_NOT_VERIFIED` | Email not yet verified |
| `TOKEN_EXPIRED` | JWT has expired |
| `TOKEN_INVALID` | JWT is malformed or invalid |
| `UNAUTHORIZED` | Missing or invalid auth token |
| `FORBIDDEN` | Authenticated but not allowed |
| `NOT_FOUND` | Resource does not exist |
| `VALIDATION_ERROR` | Request body failed validation |
| `KYC_REQUIRED` | Action requires approved KYC |
| `LIMIT_EXCEEDED` | Transaction limit exceeded |
| `DUPLICATE_EMAIL` | Email already registered |
| `ACCOUNT_SUSPENDED` | User account is suspended |
| `RATE_LIMITED` | Too many requests |

---

## 14. Status Codes

| Code | Meaning |
|---|---|
| `200` | OK |
| `201` | Created |
| `204` | No Content |
| `400` | Bad Request |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not Found |
| `409` | Conflict |
| `422` | Unprocessable Entity |
| `429` | Too Many Requests |
| `500` | Internal Server Error |

---

> **Note for backend dev:** Use rate limiting on all auth endpoints. Implement idempotency keys on `/transactions/initiate` to prevent duplicate orders. All file uploads should be stored on S3 or equivalent and served via CDN.
