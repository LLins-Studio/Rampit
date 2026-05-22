# ▲ RAMPIT — Mobile App UI/UX Design Specification

> Strictly mirrors the web app design. All colors, typography, spacing, and interaction patterns are derived from the existing web codebase.

---

## 1. Design Tokens

### 1.1 Color Palette

#### Dark Mode (Default)
| Token           | Hex / Value                    | Usage                          |
|-----------------|-------------------------------|--------------------------------|
| `bg-primary`    | `#0A0A0B`                     | Screen backgrounds             |
| `bg-secondary`  | `#111113`                     | Cards, modals, sheets          |
| `bg-tertiary`   | `#1A1A1D`                     | Inputs, hover states, rows     |
| `accent`        | `#B5CC18`                     | CTAs, highlights, active state |
| `accent-muted`  | `rgba(181,204,24,0.12)`       | Accent backgrounds             |
| `text-primary`  | `#F0EEE9`                     | Headings, primary content      |
| `text-secondary`| `#8A8780`                     | Labels, subtitles              |
| `text-tertiary` | `#4A4845`                     | Placeholders, captions         |
| `border`        | `rgba(255,255,255,0.07)`      | Card borders, dividers         |
| `border-accent` | `rgba(181,204,24,0.28)`       | Focused inputs, active cards   |
| `success`       | `#22C55E`                     | Completed status               |
| `error`         | `#EF4444`                     | Failed status, errors          |
| `warning`       | `#EAB308`                     | Pending status                 |

#### Light Mode
| Token           | Hex / Value                    |
|-----------------|-------------------------------|
| `bg-primary`    | `#F7F3EC`                     |
| `bg-secondary`  | `#EEEAE2`                     |
| `bg-tertiary`   | `#E5E0D6`                     |
| `accent`        | `#7A8C00`                     |
| `accent-muted`  | `rgba(122,140,0,0.10)`        |
| `text-primary`  | `#1A1714`                     |
| `text-secondary`| `#5C5650`                     |
| `text-tertiary` | `#9A9490`                     |
| `border`        | `rgba(0,0,0,0.08)`            |
| `border-accent` | `rgba(122,140,0,0.30)`        |
| `success`       | `#16A34A`                     |
| `error`         | `#DC2626`                     |

---

### 1.2 Typography

| Role            | Font Family        | Size  | Weight | Letter Spacing |
|-----------------|--------------------|-------|--------|----------------|
| Display / H1    | Plus Jakarta Sans  | 28–32px | 800  | -0.5px         |
| H2 Section      | Plus Jakarta Sans  | 22px  | 800    | -0.3px         |
| H3 Card title   | Plus Jakarta Sans  | 17px  | 700    | 0              |
| Body            | Plus Jakarta Sans  | 14px  | 500    | 0              |
| Body small      | Plus Jakarta Sans  | 12px  | 500    | 0              |
| Eyebrow / Label | Plus Jakarta Sans  | 11px  | 700    | +1.2px (uppercase) |
| Mono / Numbers  | JetBrains Mono     | 13–22px | 600–800 | +0.06em      |
| Button          | Plus Jakarta Sans  | 15px  | 700    | 0              |
| Caption         | Plus Jakarta Sans  | 11px  | 500    | 0              |

---

### 1.3 Spacing Scale
| Token | Value |
|-------|-------|
| xs    | 4px   |
| sm    | 8px   |
| md    | 12px  |
| base  | 16px  |
| lg    | 20px  |
| xl    | 24px  |
| 2xl   | 32px  |
| 3xl   | 48px  |

---

### 1.4 Border Radius
| Component        | Radius |
|------------------|--------|
| Screen cards     | 16px   |
| Inputs           | 12px   |
| Buttons (primary)| 14px   |
| Buttons (small)  | 8px    |
| Badges / pills   | 20px   |
| Bottom sheets    | 28px top corners |
| Avatar           | 16px   |
| Token/flag icons | 50% (circle) |

---

### 1.5 Shadows
| Level  | Value                                      |
|--------|--------------------------------------------|
| Card   | `0 4px 20px rgba(0,0,0,0.4)`              |
| Modal  | `0 12px 40px rgba(0,0,0,0.6)`             |
| Button | `0 0 24px rgba(181,204,24,0.35)` on hover |

---

### 1.6 Animations
| Name         | Duration | Easing      | Usage                    |
|--------------|----------|-------------|--------------------------|
| fade-in      | 300ms    | ease-out    | Modals, overlays         |
| slide-up     | 350ms    | ease-out    | Bottom sheets            |
| fade-in-up   | 400ms    | ease-out    | Page content entrance    |
| pulse        | 1.5s     | ease-in-out | Live rate dot, status dot|

---

## 2. Component Library

### 2.1 Bottom Navigation Bar
- **Height:** 64px + safe area inset
- **Background:** `bg-secondary` with top border `border`
- **5 tabs:** Home, History, Dashboard, Profile, Settings
- **Active tab:** icon + label in `accent` color, accent dot indicator above icon
- **Inactive tab:** icon + label in `text-tertiary`
- **Icons:** 22px stroke SVGs

---

### 2.2 Top Header (per screen)
- **Height:** 56px
- **Left:** Screen title in `text-primary`, 22px, weight 800
- **Right:** Theme toggle button (sun/moon icon, 36×36, `bg-tertiary`, rounded-xl)
- **Home screen only:** ▲ RAMPIT wordmark left, theme toggle + avatar/login right

---

### 2.3 Input Field
- Background: `bg-tertiary`
- Border: 1px `border` → on focus: `border-accent` + `0 0 0 3px accent-muted` glow
- Border radius: 12px
- Padding: 16px horizontal, 13px vertical
- Font: JetBrains Mono, 14px, `text-primary`
- Placeholder: `text-tertiary`
- Disabled: opacity 0.45

---

### 2.4 Gold CTA Button
- Background: `accent`
- Text: `bg-primary`, 15px, weight 700
- Border radius: 14px
- Padding: 16px vertical, full width
- Disabled: opacity 0.35
- Active: brightness 1.1 + shadow `0 0 24px rgba(181,204,24,0.35)`

---

### 2.5 Secondary Button
- Background: `bg-tertiary`
- Border: 1px `border`
- Text: `text-secondary`, 14px, weight 600
- Border radius: 14px

---

### 2.6 Status Badge
| Status    | Background                  | Text color  | Dot color   |
|-----------|-----------------------------|-------------|-------------|
| completed | `rgba(34,197,94,0.12)`      | `#22C55E`   | `#22C55E`   |
| pending   | `rgba(234,179,8,0.12)`      | `#ca8a04`   | `#eab308`   |
| failed    | `rgba(239,68,68,0.12)`      | `#EF4444`   | `#EF4444`   |

- Padding: 4px 10px
- Border radius: 20px
- Font: 11px, weight 700, capitalize

---

### 2.7 Bottom Sheet / Modal
- Slides up from bottom
- Top corners: 28px radius
- Drag handle: 40×4px, `border` color, centered, 12px from top
- Backdrop: `rgba(0,0,0,0.72)` + blur(10px)
- Background: `bg-secondary`
- Border: 1px `border`

---

### 2.8 Dropdown Selector
- Trigger: full-width row, `bg-tertiary`, border `border`, 12px radius
- Open state: border changes to `border-accent`
- Options list: `bg-tertiary`, `border-accent` border, 8px radius, shadow
- Selected option: `accent-muted` background, `accent` checkmark

---

### 2.9 Copy Button
- Size: small pill, 28px height
- Default: `bg-secondary`, `border`, `text-tertiary`
- Copied state: `accent-muted`, `border-accent`, `accent` text + checkmark icon

---

### 2.10 Eyebrow Tag
- Background: `accent-muted`
- Border: 1px `border-accent`
- Text: `accent`, 11px, weight 700, uppercase, letter-spacing 1.2px
- Border radius: 20px
- Padding: 4px 12px

---

## 3. Screen Specifications

---

### Screen 1 — Home (Landing)

**Route:** `/` (Tab: Home)
**Status bar:** Dark content on dark bg

#### Layout (top → bottom):
1. **Header bar** (56px)
   - Left: `▲` accent triangle + "RAMPIT" wordmark (22px, weight 700, letter-spacing 0.08em)
   - Right: Theme toggle + Login button ("Get Started →") OR avatar initials button if logged in

2. **Hero Section** (padding: 32px top, 24px sides)
   - Radial gradient mesh background: `rgba(181,204,24,0.09)` ellipse at top center
   - Eyebrow pill: "● Africa's Crypto Onramp" — pulsing green dot
   - H1: "Buy Crypto." newline "**Pay Local.**" — "Pay Local." in `accent`
   - Subtext: "Convert NGN, GHS, or KES to crypto in minutes. No bank drama, no delays." — `text-secondary`, 15px
   - Token strip: "Supported tokens" label + 5 circular token icons (32px each, `bg-secondary` bg, `border` border)

3. **Buy Form Card** (margin: 0 16px, `bg-secondary`, border `border`, 16px radius)
   - Card header row: "BUY CRYPTO" eyebrow left + "● Rates updating live" right (success dot)
   - **Step 1 — You Pay:**
     - Label: "You Pay"
     - Row: fiat symbol prefix + amount input (flex-1) + currency selector button (flag icon + code + chevron)
     - Currency dropdown: NGN 🇳🇬 / GHS 🇬🇭 / KES 🇰🇪
     - Error: minimum order message in `error` color
   - **You Receive:**
     - Label: "You Receive"
     - Token selector button: token icon + name + full-width + crypto amount right + chevron
     - Token dropdown: USDT / USDC / CELO / SOL / XLM with icons
   - **Rate info pill** (shown when amount ≥ minimum):
     - `accent-muted` bg, `border-accent` border
     - "Rate: ₦1,620/USD · Fee: ~₦500 · Est. 3–8 mins"
   - **Continue → button** (gold, full width, disabled until valid amount)
   - **Step 2 — Wallet (shown after Continue):**
     - Divider
     - Network selector (only if token has multiple networks: USDT, USDC)
     - Wallet address input + paste icon button (right side)
     - "Saved" pill button (accent, shown if user has saved wallets for this network)
     - Memo input (only for Stellar network) — labeled "Memo Required"
     - Warning box (yellow): "Double-check your address. Transactions are irreversible."
     - "View Payment Details →" gold button

4. **How It Works Section** (padding: 48px 20px)
   - Eyebrow: "HOW IT WORKS"
   - H2: "Three steps." newline "**Zero friction.**"
   - Subtext: "No sign-ups. No KYC under threshold. Just local currency in — crypto out."
   - 3 step cards (stacked vertically on mobile):
     - Each: icon (accent bg, 48×48, 16px radius) + step number ghost (88px, opacity 0.05) + title + description
     - Step 01: Choose Currency & Token
     - Step 02: Send Fiat to Escrow
     - Step 03: Receive Crypto Instantly
   - Stats bar (2×2 grid on mobile):
     - < 5 min / Settlement
     - 3 / Currencies
     - 5 / Tokens
     - 24/7 / Uptime

5. **Footer** (padding: 20px)
   - "RAMPIT · © 2025 Rampit Technologies Ltd."
   - Links row: Terms · Privacy · Support

---

### Screen 2 — Bank Transfer Bottom Sheet (Modal)

**Triggered by:** "View Payment Details →" button
**Type:** Bottom sheet, slides up

#### Layout:
1. Drag handle
2. **Header row:**
   - Left: "SEND PAYMENT" eyebrow + fiat amount (26px mono, weight 800) + currency code
   - Right: Close ✕ button
3. **Receiving summary pill** (`accent-muted` bg, `border-accent` border):
   - Token icon + "You will receive" label + crypto amount in `accent` (16px mono)
   - Right: "Network" label + network name
4. **Bank details card** (`bg-tertiary` bg, `border` border, 16px radius):
   - Loading skeleton state (1.8s delay)
   - Bank name header row (bank icon + name)
   - Account number row: large mono number (22px, weight 800) + Copy button
   - Account name row
   - Countdown timer row: clock icon + "Expires in" + timer (accent color, red when < 5 min)
5. **Wallet summary row** (`bg-tertiary`):
   - Wallet icon + truncated address
   - Memo row (if Stellar)
6. **"I've Sent the Payment →"** gold button (disabled if expired)
7. **Fine print:** "By proceeding you agree to our Terms & Privacy · Powered by RAMPIT"

---

### Screen 3 — Confirming / Success / Failed Modal

**Type:** Center modal (not bottom sheet)

#### Confirming state:
- Spinning circle loader in `accent`
- "Confirming Payment" title
- "Verifying your transfer of ₦X,XXX NGN"
- Summary card: Receiving / Network / Wallet / Memo rows
- "This usually takes a few seconds…" caption

#### Success state:
- Green circle with checkmark (`rgba(34,197,94,0.12)` bg)
- "Payment Successful!" title
- "Your wallet has been funded with X.XX TOKEN" — amount in `success`
- Wallet address box (green tint bg)
- "Done" gold button

#### Failed state:
- Red circle with ✕ (`rgba(239,68,68,0.12)` bg)
- "Payment Not Found" title
- "We couldn't verify your transfer. Please check your bank and try again."
- "Try Again" secondary button

---

### Screen 4 — Auth Modal (Sign In / Sign Up)

**Type:** Bottom sheet

#### Email step:
- Eyebrow: "SIGN IN / SIGN UP"
- Title: "Continue with email"
- Email input (keyboard type: email)
- Error message (if invalid)
- "Send Code →" gold button (disabled until valid email)

#### OTP step:
- "← Back" link
- Eyebrow: "VERIFY EMAIL"
- Title: "Enter your code"
- Subtitle: "Sent to user@email.com"
- 6 OTP boxes (equal width, square aspect ratio, 22px mono digits)
  - Empty: `border` border
  - Filled: `border-accent` border
- Error message
- "Verify →" gold button
- Resend countdown / "Resend Code" link

---

### Screen 5 — KYC Modal

**Type:** Bottom sheet

#### Layout:
- Eyebrow: "IDENTITY VERIFICATION"
- Title: "KYC Required"
- Subtitle: "Orders above $50 require identity verification."
- **ID Type toggle** (2-column grid):
  - BVN button / NIN button
  - Selected: `accent-muted` bg, `border-accent` border, `accent` text
- **ID Number input** (numeric, maxLength 11)
- **Date of Birth input** (date picker)
- Error message
- **Privacy note** (`bg-tertiary` box): shield icon + encryption disclaimer
- "Submit for Verification →" gold button

---

### Screen 6 — Dashboard

**Route:** `/dashboard` (Tab: Dashboard)

#### Layout:
1. **Header:** "Dashboard" title + "View All Orders →" link (right)
2. **Welcome line:** "Welcome back, user@email.com"
3. **Stats grid (2×2):**
   - Total Volume (accent value) — "₦XXXk · N orders"
   - Completed — "X · XX% success rate"
   - Pending — "X · Awaiting confirmation"
   - Avg Order — "₦XX.Xk · Per completed order"
4. **Line chart card:**
   - Header: "VOLUME (LAST 10 DAYS)" + total volume
   - SVG line chart: accent line + gradient fill area
   - X-axis: MM-DD dates
   - Y-axis: ₦ values
   - Interactive dots with tooltip on tap
5. **Token Breakdown card:**
   - List of tokens with progress bars (accent fill)
   - Token name + amount + percentage
6. **Recent Orders card:**
   - "See all" link → History tab
   - 5 most recent orders: crypto amount + token / date + ref / fiat amount + status badge

---

### Screen 7 — Order History

**Route:** `/history` (Tab: History)

#### Layout:
1. **Header:** "Order History" + count
2. **Filter bar** (`bg-secondary` card):
   - Status pills: All / Completed / Pending / Failed
   - Search input (ref, hash, token, wallet)
   - Date range: From / To date inputs
   - "Clear" button (shown when filters active)
3. **Order list** (card rows):
   - Each row: ref + date / fiat amount + currency / crypto amount + token / status badge
   - Tap → Order Detail bottom sheet
4. **Pagination:** prev / page numbers / next

#### Order Detail Bottom Sheet:
- Full order info table:
  - Reference (+ copy)
  - Date & Time
  - Status badge
  - You Paid
  - You Received
  - Network
  - Rate
  - Wallet (+ copy)
  - Memo (if present)
  - Tx Hash (truncated + copy)

---

### Screen 8 — Profile

**Route:** `/profile` (Tab: Profile)

#### Layout:
1. **KYC banner** (red tint, only when unverified):
   - Warning icon + "Identity not verified" + "Verify" gold button
2. **Avatar card:**
   - Large initials avatar (80×80, `accent` bg, 16px radius)
   - Name (22px, weight 800)
   - Email (mono, 13px)
   - "Joined May 2026" with green dot
   - "Edit" button (top right)
3. **Stats row (3 columns):**
   - Total Orders / Completed / Volume (NGN)
4. **Account Details table:**
   - Full Name / Email / Phone / Country / Member Since / KYC Status
5. **Edit Profile modal** (center modal):
   - Full Name / Phone / Country inputs
   - Cancel + Save buttons

---

### Screen 9 — Settings

**Route:** `/settings` (Tab: Settings)

#### Layout:
1. **Account section** (`bg-secondary` card):
   - Email row (display only)
   - Email Notifications toggle (switch, `accent` when on)
2. **Saved Wallets section:**
   - Header: "SAVED WALLETS" + "Add +" button (accent)
   - Each wallet row:
     - Network badge (accent pill) + label
     - Address (mono, break-all)
     - Memo (if present)
     - Delete button (trash icon, red on hover)
   - Empty state: "No saved wallets yet"
3. **Danger Zone section** (red border):
   - "Delete Account" row + "Delete" red button

#### Add Wallet Modal (center modal):
- Network selector (dropdown)
- Address input
- Memo input (shown only for Stellar)
- Label input (optional)
- Cancel + "Add Wallet" gold button

#### Delete Confirmation Modal:
- Red warning icon circle
- "Delete Account?" title
- Warning text
- Cancel + Delete buttons

---

### Screen 10 — Saved Wallets Picker (Bottom Sheet)

**Triggered from:** Buy Form Step 2 "Saved" button

#### Layout:
- Title: "Saved Wallets — [Network]"
- List of saved wallets for current network:
  - Label (bold) + address (mono, break-all) + memo (if present)
  - Tap to select → fills wallet input

---

## 4. Navigation Structure

```
Bottom Tab Bar
├── Home (▲ icon)          → Landing + Buy Form
├── History (clock icon)   → Order History
├── Dashboard (grid icon)  → Dashboard
├── Profile (person icon)  → Profile
└── Settings (gear icon)   → Settings
```

**Modals / Sheets (overlay, not tabs):**
- Auth Modal (triggered from header "Get Started" or buy form)
- KYC Modal (triggered from profile or buy form threshold)
- Bank Transfer Sheet (triggered from buy form step 2)
- Confirming/Success/Failed Modal (triggered from bank sheet)
- Order Detail Sheet (triggered from history row)
- Add Wallet Modal (triggered from settings)
- Delete Confirmation Modal (triggered from settings)
- Edit Profile Modal (triggered from profile)
- Saved Wallets Picker Sheet (triggered from buy form)

---

## 5. Interaction & State Patterns

### Buy Form Flow
```
Step 1: Amount + Currency + Token
  → valid amount entered
  → "Continue →" enabled
  → tap Continue

Step 2: Network + Wallet + Memo
  → wallet validated (regex per network)
  → memo required check (Stellar only)
  → warning shown when wallet valid
  → "View Payment Details →" enabled

  [if not logged in] → Auth Modal opens first
  [if order > $50 USD and KYC unverified] → KYC Modal opens

Bank Sheet:
  → 1.8s skeleton loading for bank details
  → 30-min countdown starts
  → "I've Sent the Payment →" → Confirming modal
  → 3s delay → Success (60%) or Failed (40%)
```

### Auth Flow
```
Email step → validate email → send OTP → OTP step
OTP step → 6 digits → verify → success → close modal
Resend: 30s cooldown
```

### KYC Flow
```
Select BVN or NIN → enter 11-digit number → enter DOB
→ Submit → 1.4s loading → status = "pending" → modal closes
```

### Theme Toggle
- Persisted to AsyncStorage
- Toggles between dark (default) and light (cream/paper)
- Sun icon in dark mode, Moon icon in light mode

---

## 6. Accessibility

- All interactive elements: minimum 44×44px touch target
- ARIA equivalents: accessibilityLabel on all icon buttons
- accessibilityRole: "button", "tab", "switch" where applicable
- Color contrast: all text meets WCAG AA (4.5:1 minimum)
- Status badges use both color AND text (not color alone)
- OTP inputs: accessibilityLabel="Digit N of 6"
- Loading states announced via accessibilityLiveRegion

---

## 7. Asset References

### Country Flag Icons
| Currency | File                          |
|----------|-------------------------------|
| NGN      | `assets/icons/country/nigeria-ngn.png` |
| GHS      | `assets/icons/country/ghana-ghs.png`   |
| KES      | `assets/icons/country/kenya-kes.png`   |

### Crypto Token Icons
| Token | File                               |
|-------|------------------------------------|
| USDT  | `assets/icons/crypto/tether-usdt.svg`   |
| USDC  | `assets/icons/crypto/usdcoin-usdc.svg`  |
| CELO  | `assets/icons/crypto/celo-celo.svg`     |
| SOL   | `assets/icons/crypto/solana-sol.svg`    |
| XLM   | `assets/icons/crypto/stellar-xlm.svg`  |

---

## 8. Screen Dimensions Reference

| Device          | Width  | Height  |
|-----------------|--------|---------|
| iPhone 14 Pro   | 393px  | 852px   |
| iPhone SE       | 375px  | 667px   |
| Pixel 7         | 412px  | 915px   |
| Design base     | 390px  | 844px   |

All layouts use safe area insets. Bottom nav accounts for home indicator (34px on iPhone).
