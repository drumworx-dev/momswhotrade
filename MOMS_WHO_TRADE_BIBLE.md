# MOMS WHO TRADE — COMPLETE APP BIBLE
*Master reference document — exported for continuity across Claude accounts*
*Last updated: March 2026*

---

## OVERVIEW

**Moms Who Trade** is a Progressive Web App (PWA) built for women learning to trade financial markets. It combines a content platform (blog/education), practical tools (calculator, journal, goal tracker), and a monetised community funnel — all wrapped in a native-feeling mobile app that lives on the iOS/Android home screen.

**Live URL:** `https://app.momswhotrade.co`
**Ghost Blog:** `https://moms.ghost.io`
**Firebase Project:** `moms-who-trade`
**Auth Domain:** `app.momswhotrade.co`

---

## PEOPLE

### Mel — Founder / Trading Educator / Face of Brand
- Creator of content, trading education, and community
- Drives top-of-funnel via social (YouTube, Instagram)
- Delivers 1:1 calls and workshops
- Sets product strategy and pricing
- Writes blog content (published via Ghost CMS)

### Janlo — Developer / Technical Lead
- Builds and maintains the PWA, all features
- Manages Firebase, Firestore, Cloud Functions, Hosting
- Manages Ghost CMS integration
- Manages Whop integration (products, payment)
- Deploys updates, fixes bugs, builds new features
- Manages Firebase Analytics & GA4 data

---

## BUSINESS MODEL & FUNNEL

### The Full Funnel

```
[AWARENESS]
YouTube videos → Instagram posts → Reels/Shorts
              ↓
[DISCOVERY]
"Download the app" CTA in bio / video description
app.momswhotrade.co (installable PWA)
              ↓
[ACTIVATION]
Sign up (Google / Facebook / Email)
6-step onboarding → personalises experience
Email consent → joins Ghost newsletter
Joins free Telegram community
              ↓
[NURTURE — FREE]
Blog articles (education, trade ideas, tutorials)
Trade calculator (daily use, habit forming)
Trade journal (tracks their trades)
30/60/90-day goal tracker (emotionally invested)
Login streak tracker (gamified retention)
Ghost newsletter (email follow-up)
Free Telegram group (community accountability)
              ↓
[MONETISATION — PAID]
"Level Up" tab → two products via Whop:
  ① 1:1 Trading Kickstart Call — $99 (one-time)
  ② First $500 in 30 Days Workshop — $149 (one-time)
              ↓
[POST-PURCHASE]
① Call → Books via Calendly (link in success modal)
② Workshop → Joins private WhatsApp cohort group
Ghost label added (segmented email marketing)
Firestore updated (isPaidUser flag)
```

### Revenue Products (Whop)

| Product | Price | Plan ID | Post-purchase CTA |
|---------|-------|---------|-------------------|
| 1:1 Trading Kickstart Call | $99 | `plan_MEYR5hBmnpmtn` | Book call via Calendly |
| First $500 in 30 Days Workshop | $149 | `plan_NDWT8LrloUb7h` | Join WhatsApp cohort |

### Free Entry Points

| Channel | Link / Handle |
|---------|--------------|
| Telegram Community | Linked in-app (free join) |
| YouTube | Linked in Level Up tab |
| Instagram | Linked in Level Up tab |
| Ghost Newsletter | Consent captured on onboarding step 5 |

---

## WEEKLY RESPONSIBILITIES

### Mel — Weekly

| Cadence | Task |
|---------|------|
| 2–3x per week | Publish Ghost blog post (trade ideas, tutorials, beginner guides) |
| Weekly | Post YouTube video (drives app install CTAs) |
| Daily | Instagram stories / Reels (brand presence, funnel top) |
| Weekly | Send Ghost newsletter to subscribers |
| Weekly | Host Telegram community (post setups, answer questions) |
| As booked | Deliver 1:1 Kickstart Calls ($99 purchasers) |
| Monthly | Run "First $500" Workshop cohort (batched) |
| Monthly | Review analytics with Janlo (GA4, conversion, churn) |

### Janlo — Weekly

| Cadence | Task |
|---------|------|
| As needed | Build new features / fix bugs from user feedback |
| Weekly | Check Firebase Analytics — DAU, retention, events |
| Weekly | Monitor Firestore for errors / unusual patterns |
| As needed | Deploy updates via `npm run build && firebase deploy` |
| Monthly | Bump service worker cache version (`mwt-v2` → `mwt-v3` etc.) when major changes ship |
| Monthly | Review Whop conversion data with Mel |
| Monthly | Review Ghost subscriber growth & tag accuracy |
| Ongoing | Maintain Firebase security rules as features evolve |
| As needed | Update Ghost CMS API key / Firebase env vars |

---

## TECH STACK

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| Build tool | Vite | 7.3.1 |
| Routing | React Router DOM | 7.13 |
| Styling | Tailwind CSS | 3.4.19 |
| Animation | Framer Motion | 12.34.2 |
| Icons | Lucide React | 0.574.0 |
| Date utils | date-fns | 4.1.0 |
| Screenshot | html2canvas | 1.4.1 |
| Auth/DB/Hosting | Firebase | 12.9.0 |
| Payments | @whop/checkout | 0.0.52 |
| Notifications | react-hot-toast | 2.6.0 |

---

## AUTHENTICATION

### Providers

| Provider | Method | iOS PWA Note |
|----------|--------|-------------|
| Google | OAuth2 | Uses `signInWithRedirect` (not popup — iOS blocks popups) |
| Facebook | OAuth2 | Email + profile scopes |
| Email / Password | Firebase native | Standard |

### iOS PWA Special Handling
- iOS Safari blocks popup windows, which breaks Google/Facebook OAuth in standalone PWA mode
- Solution: detect iOS PWA (`window.navigator.standalone === true`) → use `signInWithRedirect()` instead of `signInWithPopup()`
- On return from redirect, `getRedirectResult()` claims the auth credentials

### User Data Structure (Firestore `/users/{uid}`)

```typescript
{
  uid: string
  email: string
  displayName: string
  photoURL?: string
  provider: 'google' | 'facebook' | 'password'
  experience?: 'beginner' | 'intermediate' | 'advanced'
  monthlyGoal?: number          // $500-$5000+
  dailyProfitGoalPercent?: number
  onboardingComplete?: boolean
  emailConsent?: boolean        // Ghost newsletter subscription
  loginDates?: string[]         // ['2026-03-01', ...] for streak tracking
  isPaidUser?: boolean
  purchasedWorkshop?: boolean
  purchasedCall?: boolean
}
```

---

## ONBOARDING FLOW (6 Steps)

1. **Welcome** — Greets user by first name, sets the tone
2. **Experience Level** — Beginner / Intermediate / Advanced (personalises content)
3. **Monthly Income Goal** — $500 / $1,000 / $2,000 / $5,000+ presets
4. **Daily Profit Goal %** — Slider 0.5%–5% with live compound projection ($1k base)
5. **Social / Community Links** — Telegram, YouTube, Instagram CTAs
6. **Email Consent** — Subscribe to Ghost newsletter (stored + Cloud Function triggered)

**On completion:**
- `onboardingComplete = true` written to Firestore
- `ensureGhostMember()` Cloud Function called → tags user in Ghost Admin
- Dark mode gate activated (login/onboarding always force light mode)
- Welcome confetti fires on first blog feed load

---

## APP FEATURES (5 Main Tabs)

### 1. Home — Blog Feed (`/`)

- Fetches posts from Ghost CMS (`https://moms.ghost.io`) via Content API v5.0
- Dynamic tag-based tabs (Beginners Guide, Tutorials, Trade Ideas, Trades)
- In-app article reader overlay (no browser redirect)
- Login consistency streak banner (7-day window, colour-coded)
- Profile sheet: dark mode toggle, sign out, user info
- Scroll depth tracking for analytics
- Fallback to mock posts if Ghost API key missing

**Ghost post tags → app tabs:**
- `Beginners Guide` → Beginners tab
- `Tutorials` → Tutorials tab
- `Trade Ideas` → Ideas tab
- `Trades` → Trades tab

### 2. Trade Calculator (`/calculator`)

Full position sizing and risk management calculator.

**Inputs:**
- Asset category: Crypto / Stocks / Commodities / Forex
- Currency: USD / BTC / EUR / GBP
- Account size ($)
- Risk: % of account OR flat $ amount
- Leverage (1x–125x)
- Entry price, Stop Loss, Take Profit

**Outputs:**
- Position size (units)
- $ at risk
- Risk % of account
- Potential profit ($)
- Actual R:R ratio
- Visual: TP zone (green) / Entry (black bar) / SL zone (red)

**Actions:**
- Export PDF report (html2canvas)
- Save to Journal (as "open" or "planned" trade)
- Risk warning shown if >25% account risk

State persisted to `localStorage`.

### 3. Trade Journal (`/journal`)

Full trade logging and tracking.

**Trade statuses:** `planned` / `open` / `closed` / `tp_reached` / `sl_hit`

**Each trade records:**
- Token/asset, category, direction (long/short)
- Entry, SL, TP prices, leverage
- Position size, value traded
- Timeframe (1hr / 4hr / daily / weekly)
- Cause/reason for trade
- Estimated fee
- Partial closes (25% / 50% / 75% with price and P&L per close)
- Actual P&L and P&L %
- Win/Loss result

**Features:**
- Filter by status and asset category
- Summary stats: Total P&L, Win Rate, Trade Count, Estimated Fees
- Best/worst performing category badges
- Share P&L Card (html2canvas screenshot → share to socials)
- Edit and close trades with actual price

### 4. Daily Goal Tracker (`/goals`)

30/60/90-day compound growth projection.

**Settings:**
- Starting balance ($)
- Daily goal % (0.5%–10%)
- Time horizon: 30 / 60 / 90 days
- Exclude weekends: yes/no
- Exclude US public holidays: yes/no
- Trading fee %: 0.5 / 1 / 1.5 / 2%

**Output:**
- Projected end balance
- Gain multiplier (e.g., "2.3x")
- Today's dollar target
- Full date-by-date projection table
- Actual P&L synced from journal trades
- Beat / Missed indicators per day
- Per-day starting balance overrides

### 5. Level Up / Community (`/community-level-up`)

Monetisation and community hub.

**Free:**
- Telegram community join link
- YouTube channel link
- Instagram link

**Paid (Whop embedded checkout):**
- 1:1 Trading Kickstart Call — $99
- First $500 in 30 Days Workshop — $149

**Purchase flow:**
1. User taps Buy
2. Whop checkout modal opens in-app
3. Payment completed
4. `onComplete()` callback fires
5. Firestore: `isPaidUser`, `purchasedCall`/`purchasedWorkshop` set
6. Cloud Function: Ghost label added for segmentation
7. Success modal shown with next step CTA

---

## INTEGRATIONS

### Firebase

| Service | Usage |
|---------|-------|
| Firebase Auth | All sign-in providers, session persistence |
| Firestore | Users, trades, daily goals — real-time database |
| Cloud Functions | Ghost CMS label webhook (avoids CORS) |
| Firebase Hosting | Serves the built PWA (`dist/`) |
| Firebase Analytics | GA4 custom events + user properties |

**Firestore Collections:**
```
/users/{uid}          — user profiles
/trades/{tradeId}     — all trades (userId field for filtering)
/dailyGoals/{uid}/... — per-user daily goal results
```

**Security Rules (simplified):**
```
users → read/write if auth.uid == document userId
trades → read/write if auth.uid == resource.userId
dailyGoals → read/write if auth.uid == path userId
```

### Ghost CMS

- **URL:** `https://moms.ghost.io`
- **API:** Content API v5.0 (read-only, public key)
- **Env var:** `VITE_GHOST_API_KEY`
- **Used for:** Fetching blog posts with tags, authors, feature images
- **Cloud Function:** `addGhostLabel(email, label, subscribeToNewsletter, name)` — writes to Ghost Admin API server-side to avoid CORS

Ghost label strategy:
- On onboarding email consent → label: newsletter subscriber
- On Call purchase → label: paid_call
- On Workshop purchase → label: paid_workshop

### Whop (Payments)

- **Library:** `@whop/checkout` (embedded, no redirect)
- **Products:** Two one-time payment plans
- **Modal checkout** — stays in-app
- **Plan IDs:**
  - Call: `plan_MEYR5hBmnpmtn`
  - Workshop: `plan_NDWT8LrloUb7h`

### Analytics (Firebase / GA4)

**Custom Events:**

| Event | Trigger |
|-------|---------|
| `login_screen_viewed` | Auth screen shown |
| `sign_up` | New account created |
| `login` | Existing user signs in |
| `onboarding_started` | Step 1 shown |
| `onboarding_step_completed` | Each step completed |
| `onboarding_completed` | Final step done |
| `page_view` | Tab navigation |
| `article_read` | Blog post opened |
| `feed_scroll_depth` | Scroll % on feed |
| `position_calculated` | Calculator used |
| `trade_taken` | Trade saved from calculator |
| `trade_saved_journal` | Manual journal entry |
| `pnl_card_shared` | Share card generated |
| `goal_settings_saved` | Goal tracker configured |
| `whop_product_tapped` | Level Up product clicked |

**User Properties:**
- `experience_level`: beginner / intermediate / advanced
- `email_consent`: yes / no
- `monthly_goal_bucket`: <$500 / $500-$999 / $1k-$1,999 / $2k-$4,999 / $5k+

---

## PWA CONFIGURATION

**Manifest:**
- Name: "Moms Who Trade"
- Short name: "MWT"
- Theme colour: `#FDE2D1` (warm peach)
- Background colour: `#FDE2D1`
- Display: `standalone` (fullscreen, no browser chrome)
- Icons: 192px + 512px PNG + SVG

**Service Worker (`sw.js`):**
- Cache name: `mwt-v2` (bump to clear cache on major deploy)
- HTML (navigation): **network-first** → fallback to cached `/`
- Hashed JS/CSS bundles: **cache-first** (content-addressed, safe forever)
- Other assets: **network-first** → fallback to cache

**iOS PWA Limitation (important):**
- Links clicked in WhatsApp / Messages / email always open in Safari, not the installed PWA
- This is an Apple OS-level restriction — cannot be fixed in code
- Only solution is a native app (Capacitor wrapper) registered with Universal Links
- For now: accepted as a limitation. Future roadmap item if needed.

---

## ENVIRONMENT VARIABLES

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_APP_ID=...
VITE_GHOST_API_KEY=...   # optional — falls back to mock posts if missing
```

Firebase config also includes: `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `measurementId`

---

## DESIGN SYSTEM

### Philosophy
Warm Scandinavian palette. Soft, inviting, feminine without being childish. Never pure black in dark mode — always warm charcoals. Dusty rose as the hero brand colour.

### Color Tokens

**Light Mode:**
| Token | Value | Usage |
|-------|-------|-------|
| `bg-primary` | `#E8DDD8` | Main app background (warm sand) |
| `bg-secondary` | `#F5E6E8` | Secondary areas (light mauve-pink) |
| `surface` | `#FFFFFF` | Cards, modals |
| `surface-dim` | `#F9F5F3` | Dimmed surfaces |
| `accent-primary` | `#D4A5A5` | Dusty rose — brand hero colour |
| `accent-dark` | `#B88B8B` | Darker rose |
| `accent-success` | `#7FB069` | Sage green — wins, long trades |
| `accent-error` | `#E07A5F` | Terracotta — losses, short trades |
| `accent-warning` | `#F2A65A` | Warm orange — warnings |
| `text-primary` | `#2D2D2D` | Dark charcoal — main text |
| `text-secondary` | `#6B6B6B` | Medium grey |
| `text-tertiary` | `#9B9B9B` | Light grey |

**Dark Mode (warm charcoal — never pure black):**
| Token | Value |
|-------|-------|
| `bg-primary` | `#1C1C1E` |
| `bg-secondary` | `#2A2729` |
| `surface` | `#2C2A2D` |
| `surface-dim` | `#242224` |
| `accent-primary` | `#C9908F` |
| `accent-dark` | `#A87878` |
| `text-primary` | `#F0EBE7` |
| `text-secondary` | `#A09890` |
| `text-tertiary` | `#6A6260` |

**Special colours:**
| Name | Hex | Usage |
|------|-----|-------|
| Warm Peach | `#FDE2D1` | Auth & onboarding background |
| Article Rose | `#E8A598` | Blog links & blockquotes |
| Emerald Dark | `#2A6B49` | Call product, Trade tags |
| Terracotta | `#96522A` | Workshop product, Tutorial tags |
| Canvas Dark | `#0F0B0A` | P&L share card background |

### Typography
System font stack: `-apple-system, BlinkMacSystemFont, SF Pro Display, Segoe UI, Roboto, sans-serif`

### Border Radius
- Pill: `24px`
- Card: `16px`
- Input: `12px`

---

## DATA FLOW & STATE MANAGEMENT

### Context Providers (wrap entire app in App.tsx)

| Context | Persists to | Key data |
|---------|------------|---------|
| `AuthContext` | Firestore | User profile, auth state |
| `ThemeContext` | localStorage (`mwt_theme`) | light/dark preference |
| `TradesContext` | localStorage (`mwt_trades`) | All trades array |
| `GoalsContext` | localStorage (multiple keys) | Goal settings, daily goals |

### Dark Mode Gate
The `.dark` class is only applied to `<html>` when:
- User is authenticated, AND
- `onboardingComplete === true`

This ensures Login and Onboarding screens always render in light mode regardless of user's theme preference.

---

## FILE STRUCTURE

```
momswhotrade/
├── src/
│   ├── App.tsx                    # Router, context providers, dark mode gate
│   ├── main.tsx                   # Entry point, service worker registration
│   ├── index.css                  # Tailwind base, CSS tokens, dark mode vars
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx    # Auth UI (Google/Facebook/Email)
│   │   │   └── OnboardingFlow.tsx # 6-step onboarding
│   │   ├── blog/
│   │   │   ├── BlogFeed.tsx       # Main feed, tabs, streak banner
│   │   │   ├── ArticleReader.tsx  # In-app article overlay
│   │   │   └── BlogCard.tsx       # Post card with tag colours
│   │   ├── calculator/
│   │   │   └── TradingCalculator.tsx
│   │   ├── journal/
│   │   │   ├── TradeJournal.tsx
│   │   │   ├── TradeCard.tsx
│   │   │   ├── TradeDetailModal.tsx
│   │   │   ├── NewTradeModal.tsx
│   │   │   ├── ShareCardModal.tsx
│   │   │   └── generatePnLCard.ts # Canvas-based share image
│   │   ├── goals/
│   │   │   └── GoalTracker.tsx
│   │   ├── community/
│   │   │   └── CommunityTab.tsx   # Products, socials, Whop embed
│   │   └── shared/
│   │       ├── BottomNav.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── ImageLightbox.tsx
│   │       └── ConfettiOverlay.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   ├── TradesContext.tsx
│   │   └── GoalsContext.tsx
│   ├── hooks/
│   │   ├── useAnalytics.ts
│   │   ├── useLoginStreak.ts
│   │   └── useScrollDepth.ts
│   ├── config/
│   │   ├── firebase.ts
│   │   └── ghost.ts
│   ├── utils/
│   │   ├── calculations.ts
│   │   ├── formatters.ts
│   │   ├── holidays.ts
│   │   └── mockData.ts
│   └── types/
│       └── index.ts               # All TypeScript interfaces
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── icon.svg / icon-192.png / icon-512.png
│   └── products/                  # Product images for Level Up
├── functions/                     # Firebase Cloud Functions
├── firestore.rules
├── firebase.json
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## DEPLOYMENT

```bash
# Build
npm run build   # → tsc -b && vite build → outputs to dist/

# Deploy everything (hosting + functions)
firebase deploy

# Deploy hosting only
firebase deploy --only hosting

# Deploy functions only
firebase deploy --only functions
```

**Hosting config (firebase.json):**
- Serves `dist/`
- All routes rewrite to `/index.html` (SPA routing)
- Cache headers set for hashed assets

**When to bump service worker version:**
- Any time a major deploy ships that changes cached assets
- Edit `sw.js`: change `mwt-v2` → `mwt-v3` (or whatever next is)
- This forces all existing users to get fresh assets on next load

---

## KNOWN LIMITATIONS & FUTURE ROADMAP

### Current Limitations

| Issue | Cause | Fix |
|-------|-------|-----|
| Links from WhatsApp don't open PWA | iOS OS restriction — no Universal Links for PWAs | Capacitor native wrapper (future) |
| Trades stored in localStorage | No cross-device sync yet | Migrate to Firestore (future) |
| Goals stored in localStorage | No cross-device sync yet | Migrate to Firestore (future) |
| No push notifications | Requires native app or Web Push setup | Future roadmap |

### Future Features (hints in codebase)

- **In-app Chat** — Premium tier feature (placeholder in Level Up)
- **WhatsApp Integration** — Workshop cohort group
- **Advanced Trade Analytics** — Deeper stats and reporting
- **Web Push Notifications** — Service worker infrastructure exists
- **Cross-device sync** — Move trades/goals from localStorage to Firestore
- **Capacitor iOS/Android app** — Native shell for Universal Links, App Store presence

---

## QUICK REFERENCE — KEY IDs & HANDLES

| Item | Value |
|------|-------|
| App URL | `https://app.momswhotrade.co` |
| Ghost CMS | `https://moms.ghost.io` |
| Firebase Project | `moms-who-trade` |
| Whop Call Plan ID | `plan_MEYR5hBmnpmtn` |
| Whop Workshop Plan ID | `plan_NDWT8LrloUb7h` |
| Service Worker Cache | `mwt-v2` |
| Theme localStorage key | `mwt_theme` |
| Trades localStorage key | `mwt_trades` |
| Ghost Content API version | `v5.0` |
| Cloud Functions region | `us-central1` |

---

## ONBOARDING A NEW CLAUDE ACCOUNT

When starting fresh in a new Claude session, paste this document and say:

> "This is the complete bible for the Moms Who Trade PWA. We built this together. I'm Mel (founder) and Janlo is the dev. Please read this fully before we continue — it covers the tech stack, all features, integrations, funnel, and responsibilities."

Then continue from wherever you left off. All context is in this document.

---

*End of Moms Who Trade Bible — Version 1.0*
