# Go-to-Market Strategy & Implementation Plan
*3D Farm Admin · Architect Document · March 2026*

---

## Part 1: Go-to-Market Strategy

### Positioning Statement
> *"The first order management system built for 3D print farms that shows you your actual cost per job — before you quote and after you ship."*

Secondary: *"Replace your Notion + spreadsheet stack with one tool that knows your printers, your filament, and your clients."*

---

### Target Customer Segments

| Segment | Description | Size | Priority |
|---------|-------------|------|----------|
| **Solo operator** | 1 person, 3–8 printers, Etsy/social media orders | Large | Primary |
| **Small shop** | 2–4 people, 8–25 printers, mixed B2C+B2B | Medium | Primary |
| **Growing farm** | 5–10 people, 25–100 printers, B2B focus | Small | Secondary (v2) |
| **Service bureau** | Multi-client, reseller needs | Very small | v2.0 target |

**Reach them via:**
- Bambu Lab community forums and Facebook groups
- r/3Dprinting, r/prusa3d, r/MPSelectMiniOwners
- Etsy seller communities and MakerWorld
- 3D printing YouTube creator sponsorships
- Print-on-demand Discord servers

---

### Pricing & Billing

**Processor:** Stripe (supports Panama-registered businesses; international card acceptance in 135+ countries; USD settlement available).

> **Panama note:** Stripe requires a Panama-registered legal entity (S.A. or S.R.L.) with a local bank account. Payouts are in USD. VAT/tax collection is handled by Stripe Tax. No per-transaction restrictions for SaaS subscriptions.

**Plans (flat monthly, tiered by printer count):**

| Plan | Printers | Monthly | Annual (20% off) | Stripe Price ID |
|------|----------|---------|-------------------|-----------------|
| **Solo** | Up to 5 | $29/mo | $278/yr | `price_solo_monthly` / `price_solo_annual` |
| **Shop** | Up to 20 | $79/mo | $758/yr | `price_shop_monthly` / `price_shop_annual` |
| **Farm** | Unlimited | $149/mo | $1,430/yr | `price_farm_monthly` / `price_farm_annual` |

- 14-day free trial, **no credit card required**
- No free tier (attracts non-buyers)
- Trial-to-paid conversion via in-app upgrade prompt at day 12
- Annual billing saves 20% and shown prominently

---

### Acquisition Channels

1. **Content SEO** — "How to run a profitable 3D print farm" blog series
2. **Community posts** — Organic posts in Bambu/Prusa communities showcasing cost tracking
3. **YouTube demos** — 3-minute demo video showing order → cost → margin flow
4. **Referral program** — 1 month free for referrer when a new customer pays (v1.1)
5. **Product Hunt launch** — After v1.0 polish is complete

---

## Part 2: Implementation Roadmap Overview

| Milestone | Target | Features |
|-----------|--------|---------|
| **M0: Foundation** | Week 1 | Technical debt, password reset, notification utility |
| **M1: v1.0 Launch** | Week 2–3 | Analytics charts, filament alerts, failure logging, job history |
| **M2: Monetization** | Week 4–6 | Stripe billing, sales page, onboarding flow |
| **M3: v1.1** | +60 days | Email notifications, printer utilization, maintenance, PWA |
| **M4: v1.2** | +120 days | Project templates, client history, auto-routing |
| **M5: v2.0** | Q3 2026 | Client portal, invoicing, reseller mode |

**Parallelization note:** All features within a milestone are designed to be independent and can be worked on simultaneously by different developers. Cross-feature dependencies are noted per task.

---

## Part 3: Feature Implementation Plan

---

## MILESTONE 0 — Foundation & Technical Debt

> These are the highest-leverage items. Do them first. They unblock everything else.

---

### F0 — Technical Debt Cleanup

**Overview:** Fix foundational issues that affect deploy reliability, developer experience, and future feature work.

**Changes:**
- Commit `pnpm-lock.yaml` (currently untracked — non-deterministic CI/CD builds)
- Add shared `createNotification(tenantId, type, message, metadata?)` utility in `src/lib/notifications.ts`
- Standardize all API routes to return `{ error: string, code: string }` on failure via a shared `apiError(code, message, status)` helper in `src/lib/api-response.ts`
- Improve `prisma/seed.ts` for realistic demo data: 3 active orders in different statuses, 2 completed with failure logs, 2 spools below threshold, 4 printers with job history

**No DB schema changes required.**

#### Tasks
- [x] **T-F0-1** Commit pnpm-lock.yaml and verify all dependencies resolve cleanly
- [x] **T-F0-2** Implement `src/lib/notifications.ts` — `createNotification()` utility with Prisma write + deduplication guard
- [x] **T-F0-3** Implement `src/lib/api-response.ts` — `apiError()` and `apiSuccess()` helpers; refactor all 45 API routes to use them
- [x] **T-F0-4** Improve `prisma/seed.ts` with realistic multi-state demo data (orders, failures, low-stock spools, job history)
- [x] **T-F0-5** Unit tests for `createNotification()` and `apiError()` helpers

---

### F0b — Password Reset Flow

**Overview:** Users have no way to recover access if they forget their password. Critical for any public-facing SaaS.

**DB Schema Changes:**
```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**New API Routes:**
- `POST /api/auth/forgot-password` — validates email, creates token, sends email
- `POST /api/auth/reset-password` — validates token, updates password, marks token used

**New UI Pages:**
- `src/app/auth/forgot-password/page.tsx` — email input form
- `src/app/auth/reset-password/page.tsx` — new password form (reads `?token=` from URL)

**Depends on:** F8 (email delivery) for sending the reset link. For M0, log the reset URL to console in development; wire email in M3.

#### Tasks
- [x] **T-F0b-1** DB: Add `PasswordResetToken` model to schema + run migration
- [x] **T-F0b-2** API: `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` routes
- [x] **T-F0b-3** UI: Forgot password page + reset password page; add "Forgot password?" link to sign-in form
- [x] **T-F0b-4** Unit tests for token generation, expiry validation, and password update logic

---

## MILESTONE 1 — v1.0 Launch Sprint

> These four features are the only things between the current state and a shippable product.

---

### F1 — Analytics Charts

**Overview:** The analytics page has two "Chart Coming Soon" placeholder divs. The data pipeline is complete. This is purely a rendering task.

**Dependencies to install:**
```bash
pnpm add recharts
```

**New API Routes:**
- `GET /api/analytics/timeseries?range=6m` — returns monthly bucketed data for orders created, revenue (from ledger), and filament consumed (from completed print jobs)

**UI Changes (`src/app/(protected)/analytics/page.tsx`):**
- Replace placeholder divs with `<OrdersOverTimeChart>`, `<RevenueOverTimeChart>`, `<FilamentUsageChart>`
- Add date range selector (3m / 6m / 12m / YTD)

**New Components:**
- `src/app/(protected)/analytics/components/OrdersOverTimeChart.tsx`
- `src/app/(protected)/analytics/components/RevenueOverTimeChart.tsx`
- `src/app/(protected)/analytics/components/FilamentUsageChart.tsx`
- `src/app/(protected)/analytics/components/ChartContainer.tsx` — shared wrapper with loading/empty states

#### Tasks
- [x] **T-F1-1** Install recharts; create `ChartContainer` base wrapper with loading + empty states
- [x] **T-F1-2** Build `GET /api/analytics/timeseries` endpoint — Prisma `groupBy` on orders and ledger entries by month
- [x] **T-F1-3** Implement `OrdersOverTimeChart` component using recharts `LineChart`
- [x] **T-F1-4** Implement `RevenueOverTimeChart` component using recharts `BarChart`
- [x] **T-F1-5** Implement `FilamentUsageChart` component; wire filament consumption from completed `PrintJob` records
- [x] **T-F1-6** Unit tests for timeseries API aggregation logic and chart component rendering

---

### F2 — Filament Low-Stock Visual Alerts

**Overview:** Operators need to see at a glance which spools are running low. The inventory page has a static low-stock count card. This adds per-spool threshold tracking and visual indicators throughout the UI.

**DB Schema Changes:**
```prisma
model FilamentSpool {
  // ... existing fields ...
  lowStockThreshold Int @default(20) // percentage (0-100); alert when remainingPercentage <= this
}
```

**API Changes:**
- `PATCH /api/filament/spools/[id]` — when `remainingPercentage` drops at or below `lowStockThreshold`, call `createNotification(tenantId, 'FILAMENT_LOW', ...)` (uses F0-2 utility)
- `PATCH /api/settings` — add `defaultLowStockThreshold` field to `TenantSettings`

**UI Changes:**
- `FilamentTypeCard` — add amber/red badge on spool row when below threshold
- `FilamentStatsCards` — existing low-stock card becomes clickable filter
- Dashboard — add low-stock warning banner if any spools are critical (< 10%)
- Spool management dialog — add threshold % input field

#### Tasks
- [x] **T-F2-1** DB: Add `lowStockThreshold` to `FilamentSpool`; add `defaultLowStockThreshold` to `TenantSettings`; run migration
- [x] **T-F2-2** API: Wire `createNotification()` trigger in spool PATCH handler when threshold is crossed
- [x] **T-F2-3** UI: Add threshold input to spool creation/edit dialog; show current remaining % alongside threshold
- [x] **T-F2-4** UI: Low-stock badge on spool rows in `FilamentTypeCard`; color scale (amber ≤ threshold, red ≤ 10%)
- [x] **T-F2-5** UI: Low-stock banner on dashboard when any spool is in critical state
- [x] **T-F2-6** Unit tests for threshold trigger logic and badge rendering conditions

---

### F3 — Print Job Failure Logging

**Overview:** The `PrintJob` model has `failureReason: String?` and `FAILED` status in the enum, but neither the API nor UI expose them. Operators can't log or track failure causes, making defect analysis impossible.

**API Changes:**
- `PATCH /api/queue/[id]` — add support for `status: 'FAILED'` with optional `failureReason` body; trigger `createNotification(tenantId, 'JOB_FAILED', ...)`

**UI Changes:**
- Queue job card — add "Mark as Failed" action in job dropdown menu (alongside existing Cancel)
- New `FailureLogDialog` component — modal with:
  - Reason dropdown: `Filament Jam`, `Bed Adhesion`, `Power Loss`, `File Error`, `Stringing`, `Warping`, `Operator Error`, `Other`
  - Optional notes textarea
- Failed jobs visually distinct in queue: red left border, failure badge, reason visible on hover/expand
- Analytics page — failed job reasons breakdown (simple count per reason type)

**New Components:**
- `src/app/(protected)/queue/components/FailureLogDialog.tsx`

#### Tasks
- [x] **T-F3-1** API: Extend `PATCH /api/queue/[id]` to accept `FAILED` status + `failureReason`; add `createNotification()` trigger
- [x] **T-F3-2** UI: `FailureLogDialog` component with reason dropdown and notes field
- [x] **T-F3-3** UI: "Mark as Failed" action in job card dropdown; failed job visual styling (red accent, reason badge)
- [x] **T-F3-4** UI: Failure reason breakdown widget on analytics page (recharts PieChart, reuses F1 install)
- [x] **T-F3-5** Unit tests for failure API endpoint, dialog form validation, and notification trigger

---

### F4 — Job History & Reprint Action

**Overview:** Completed/failed/cancelled jobs disappear from operational view. Operators need to find past jobs and reprint with one click.

**New API Routes:**
- `GET /api/queue/history?page=1&limit=20&status=COMPLETED,FAILED,CANCELLED&printerId=&from=&to=` — paginated job history
- `POST /api/queue/[id]/reprint` — clones job back to `QUEUED` status; returns new job ID

**UI Changes:**
- Queue page — add "History" tab alongside active queue tabs
- `JobHistoryList` component — table view with columns: Part, Order, Printer, Filament, Duration, Status, Reason, Date
- "Reprint" button per history row — shows confirmation dialog, then creates new job and switches to active queue tab

**New Components:**
- `src/app/(protected)/queue/components/JobHistoryList.tsx`
- `src/app/(protected)/queue/components/ReprintConfirmDialog.tsx`

#### Tasks
- [x] **T-F4-1** API: `GET /api/queue/history` — paginated history endpoint with filter params
- [x] **T-F4-2** API: `POST /api/queue/[id]/reprint` — clone job to QUEUED; validate original job exists and belongs to tenant
- [x] **T-F4-3** UI: History tab on queue page; `JobHistoryList` table with pagination
- [x] **T-F4-4** UI: Reprint button + `ReprintConfirmDialog`; optimistic update to active queue on success
- [x] **T-F4-5** Unit tests for history query (filtering, pagination) and reprint clone logic

---

## MILESTONE 2 — Monetization & Growth

> These three features are pre-launch requirements. Can be built in parallel with M1.

---

### F5 — Stripe Subscription & Billing

**Overview:** Full subscription lifecycle: plan selection → Stripe Checkout → webhook → access enforcement → billing portal. Stripe supports Panama-registered businesses with USD payouts.

**Dependencies to install:**
```bash
pnpm add stripe @stripe/stripe-js
```

**Environment Variables to add:**
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_SOLO_MONTHLY=price_...
STRIPE_PRICE_SOLO_ANNUAL=price_...
STRIPE_PRICE_SHOP_MONTHLY=price_...
STRIPE_PRICE_SHOP_ANNUAL=price_...
STRIPE_PRICE_FARM_MONTHLY=price_...
STRIPE_PRICE_FARM_ANNUAL=price_...
```

**DB Schema Changes:**
```prisma
enum PlanTier {
  TRIAL
  SOLO
  SHOP
  FARM
}

model Subscription {
  id                   String    @id @default(cuid())
  tenantId             String    @unique
  stripeCustomerId     String    @unique
  stripeSubscriptionId String?   @unique
  stripePriceId        String?
  tier                 PlanTier  @default(TRIAL)
  status               String    @default("trialing") // Stripe status values
  trialEndsAt          DateTime?
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean   @default(false)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  tenant               Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
}
```

**New API Routes:**
- `POST /api/stripe/checkout` — creates Stripe Checkout session for plan selection
- `POST /api/stripe/portal` — creates Stripe Customer Portal session for billing management
- `POST /api/stripe/webhook` — handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- `GET /api/subscription` — returns current tenant subscription status + tier

**New UI Pages/Components:**
- `src/app/(protected)/settings/components/BillingSection.tsx` — shows current plan, next billing date, upgrade/downgrade, cancel, link to Stripe portal
- `src/app/subscribe/page.tsx` — plan selection page (public, accessible pre-auth for marketing)
- `src/components/SubscriptionGate.tsx` — wrapper that shows upgrade prompt when printer count exceeds plan limit

**Middleware Changes (`src/middleware.ts`):**
- Check `Subscription.tier` and `Subscription.status` on protected routes
- Redirect to `/subscribe` if trial expired and no active subscription
- Pass `printerLimit` to client via response header for soft-limit enforcement

**Printer limit enforcement:**
| Plan | Printer Limit |
|------|--------------|
| TRIAL | 5 (same as Solo, expires in 14 days) |
| SOLO | 5 |
| SHOP | 20 |
| FARM | Unlimited |

#### Tasks
- [ ] **T-F5-1** DB: Add `Subscription` model and `PlanTier` enum; run migration; update `api/auth/register` to create TRIAL subscription on signup
- [ ] **T-F5-2** Install stripe; create `src/lib/stripe.ts` singleton client + plan config constants
- [ ] **T-F5-3** API: `POST /api/stripe/checkout` — Checkout session creation with success/cancel URLs
- [ ] **T-F5-4** API: `POST /api/stripe/webhook` — webhook handler with signature verification; update Subscription record on all relevant events
- [ ] **T-F5-5** API: `POST /api/stripe/portal` + `GET /api/subscription` routes
- [ ] **T-F5-6** UI: `BillingSection` component in settings page — current plan badge, usage (printers used / limit), portal link, upgrade CTA
- [ ] **T-F5-7** UI: `/subscribe` plan selection page with monthly/annual toggle and Stripe Checkout redirect
- [ ] **T-F5-8** Middleware: Trial expiry check + printer count enforcement; `SubscriptionGate` component for soft-limit UI
- [ ] **T-F5-9** Unit tests for webhook handler (mock Stripe events), subscription status helpers, and plan limit enforcement

---

### F6 — Sales & Marketing Landing Page

**Overview:** Expand `src/app/page.tsx` from a basic redirect page into a full marketing site that converts visitors into trial signups. This is the top of the funnel.

**No DB changes. No backend changes.**

**UI Changes (`src/app/page.tsx` + new components):**

```
/ (landing page)
├── <NavBar /> — logo, features anchor, pricing anchor, sign in, "Start Free Trial" CTA
├── <HeroSection /> — headline, sub-headline, CTA button, product screenshot/mockup
├── <ProblemSection /> — "Running a print farm on spreadsheets?" pain points
├── <FeaturesSection /> — 3 key differentiators (BOM model, cost tracking, order management)
├── <HowItWorksSection /> — 3-step visual flow: Add order → Track prints → See profit
├── <PricingSection /> — pricing cards from F5 with Stripe Checkout links
├── <SocialProofSection /> — placeholder testimonials + competitor comparison table
├── <FaqSection /> — 6–8 common questions
└── <FooterSection /> — links, legal, social
```

**New files:**
- `src/app/(marketing)/layout.tsx` — marketing layout (no sidebar/auth)
- `src/app/(marketing)/page.tsx` — full landing page
- `src/app/(marketing)/components/` — all landing page section components
- `src/app/(marketing)/privacy/page.tsx` — Privacy Policy (required for Stripe + GDPR)
- `src/app/(marketing)/terms/page.tsx` — Terms of Service

**SEO:**
- `src/app/layout.tsx` — update metadata, OG tags, Twitter card
- `public/sitemap.xml`
- `public/robots.txt`

#### Tasks
- [ ] **T-F6-1** Set up `(marketing)` route group with its own layout (no sidebar); move landing page logic there
- [ ] **T-F6-2** Build `NavBar`, `HeroSection`, `ProblemSection` with strong copy and product screenshot placeholder
- [ ] **T-F6-3** Build `FeaturesSection` (BOM model, cost tracking, order management) and `HowItWorksSection`
- [ ] **T-F6-4** Build `PricingSection` — pricing cards wired to `/subscribe` with monthly/annual toggle
- [ ] **T-F6-5** Build `SocialProofSection` (testimonial placeholders + competitor comparison table) and `FaqSection`
- [ ] **T-F6-6** Privacy Policy page, Terms of Service page, Footer; add SEO metadata, OG tags, sitemap.xml, robots.txt
- [ ] **T-F6-7** Snapshot tests for all landing page section components

---

### F7 — Onboarding Flow

**Overview:** After registering, users land directly on the dashboard. There's no guided setup. This feature adds a 3-step onboarding wizard triggered on first login: (1) Welcome, (2) Add first printer (reusing existing wizard), (3) Invite teammates.

**DB Schema Changes:**
```prisma
model Tenant {
  // ... existing fields ...
  onboardingCompleted Boolean @default(false)
}

model TeamInvite {
  id         String    @id @default(cuid())
  tenantId   String
  email      String
  role       UserRole  @default(OPERATOR)
  token      String    @unique @default(cuid())
  expiresAt  DateTime
  acceptedAt DateTime?
  invitedBy  String    // userId
  createdAt  DateTime  @default(now())
  tenant     Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
}
```

**New API Routes:**
- `POST /api/onboarding/complete` — sets `tenant.onboardingCompleted = true`
- `POST /api/onboarding/skip` — same effect, marks as skipped
- `POST /api/invites` — creates `TeamInvite`, sends email (dev: logs to console; prod: uses F8 email)
- `GET /api/invites/[token]` — validates token, returns invite details
- `POST /api/invites/[token]/accept` — creates user account, assigns to tenant, marks invite accepted

**New UI:**
- `src/components/onboarding/OnboardingGate.tsx` — wraps `(protected)/layout.tsx`; if `!tenant.onboardingCompleted` and user is ADMIN, shows `OnboardingWizard`
- `src/components/onboarding/OnboardingWizard.tsx` — 3-step modal wizard:
  - **Step 1 — Welcome:** Farm name confirmation, brief "what you can do" value prop, progress bar
  - **Step 2 — Add Your First Printer:** Embeds existing `AddPrinterWizard` (already built); skip option
  - **Step 3 — Invite Your Team:** Inline invite form (email + role); can add multiple; skip option
- `src/app/invite/[token]/page.tsx` — public invite acceptance page (set password, then redirect to dashboard)

**Refactors:**
- `src/app/(protected)/layout.tsx` — wrap children with `<OnboardingGate>`

#### Tasks
- [ ] **T-F7-1** DB: Add `onboardingCompleted` to `Tenant`; add `TeamInvite` model; run migration
- [ ] **T-F7-2** API: `POST /api/onboarding/complete` and `POST /api/onboarding/skip` routes
- [ ] **T-F7-3** API: `POST /api/invites`, `GET /api/invites/[token]`, `POST /api/invites/[token]/accept` routes
- [ ] **T-F7-4** UI: `OnboardingWizard` — Step 1 Welcome screen with farm name and value prop
- [ ] **T-F7-5** UI: `OnboardingWizard` — Step 2 Printer setup (embed existing `AddPrinterWizard` component)
- [ ] **T-F7-6** UI: `OnboardingWizard` — Step 3 Team invite form (multi-email input, role selector, send button)
- [ ] **T-F7-7** UI: `OnboardingGate` wrapper; integrate into `(protected)/layout.tsx`; add Users page invite button
- [ ] **T-F7-8** UI: `/invite/[token]` public acceptance page — validate token, set password form, redirect to dashboard
- [ ] **T-F7-9** Unit tests for invite token generation/expiry, accept flow, onboarding gate condition

---

## MILESTONE 3 — v1.1 Retention (60 Days Post-Launch)

---

### F8 — Email Notifications Infrastructure

**Overview:** Wire the existing `Notification` model and `createNotification()` utility (F0-2) to actual email delivery. Use Resend + React Email for reliable transactional email from Panama.

**Dependencies to install:**
```bash
pnpm add resend @react-email/components @react-email/render
```

**Environment Variables:**
```env
RESEND_API_KEY=re_...
EMAIL_FROM=notifications@yourdomain.com
APP_URL=https://yourdomain.com
```

**New files:**
- `src/lib/email.ts` — `sendEmail(to, subject, reactComponent)` wrapper around Resend client
- `src/emails/FilamentLowEmail.tsx` — React Email template
- `src/emails/JobFailedEmail.tsx` — React Email template
- `src/emails/OrderOverdueEmail.tsx` — React Email template
- `src/emails/InviteEmail.tsx` — used by F7 invite flow
- `src/emails/PasswordResetEmail.tsx` — used by F0b password reset

**Trigger Integration:**
- Update `createNotification()` in `src/lib/notifications.ts` to call `sendEmail()` after writing DB record (respects user notification preferences)

**Settings UI Changes:**
- `src/app/(protected)/settings/page.tsx` — add "Notification Preferences" section: toggles for each notification type (filament low, job failed, order overdue)

**DB Schema Changes:**
```prisma
model TenantSettings {
  // ... existing fields ...
  notifyFilamentLow  Boolean @default(true)
  notifyJobFailed    Boolean @default(true)
  notifyOrderOverdue Boolean @default(true)
}
```

#### Tasks
- [ ] **T-F8-1** Install Resend + React Email; create `src/lib/email.ts` wrapper with error handling and dev-mode logging
- [ ] **T-F8-2** Build `InviteEmail.tsx` and `PasswordResetEmail.tsx` templates; wire into F7 and F0b flows
- [ ] **T-F8-3** Build `FilamentLowEmail.tsx` template; update `createNotification()` to send email on `FILAMENT_LOW`
- [ ] **T-F8-4** Build `JobFailedEmail.tsx` template; update `createNotification()` to send email on `JOB_FAILED`
- [ ] **T-F8-5** Build `OrderOverdueEmail.tsx` template; add overdue check cron-style logic (run on order list load)
- [ ] **T-F8-6** DB: Add notification preference fields to `TenantSettings`; run migration
- [ ] **T-F8-7** UI: Notification preferences section in settings page (toggles per type)
- [ ] **T-F8-8** Unit tests for email template rendering and `sendEmail()` error handling (mock Resend client)

---

### F9 — Per-Printer Utilization History

**Overview:** `PrintJob` records contain `startTime`, `endTime`, and `printerId`. From these, we can derive historical utilization per printer. Currently the analytics page shows only an instantaneous snapshot.

**New API Routes:**
- `GET /api/analytics/printer-utilization?range=30d` — returns per-printer: hours printed, jobs completed, jobs failed, utilization % by day/week

**UI Changes:**
- Analytics page — new "Printer Performance" section with:
  - Utilization heatmap or grouped bar chart per printer
  - Per-printer stats table (total hours, success rate, avg job duration)
- Printer cards (`/printers`) — add small stat badge: "X hrs this month"

**New Components:**
- `src/app/(protected)/analytics/components/PrinterUtilizationChart.tsx`
- `src/app/(protected)/analytics/components/PrinterPerformanceTable.tsx`

#### Tasks
- [ ] **T-F9-1** API: `GET /api/analytics/printer-utilization` — aggregate `PrintJob` by printer + date range
- [ ] **T-F9-2** UI: `PrinterUtilizationChart` (grouped bar or heatmap using recharts)
- [ ] **T-F9-3** UI: `PrinterPerformanceTable` — sortable table with per-printer stats; add monthly hours badge to printer cards
- [ ] **T-F9-4** Unit tests for utilization aggregation query and edge cases (no jobs, overlapping times)

---

### F10 — Maintenance Scheduling

**Overview:** The `Printer` model has a `MAINTENANCE` status but no maintenance history or scheduling. Operators need to track PM intervals and see which printers are overdue.

**DB Schema Changes:**
```prisma
model Printer {
  // ... existing fields ...
  maintenanceIntervalDays Int?
  nextMaintenanceDue      DateTime?
  maintenanceLogs         PrinterMaintenanceLog[]
}

model PrinterMaintenanceLog {
  id          String   @id @default(cuid())
  printerId   String
  type        String   // "routine", "repair", "cleaning", "calibration"
  notes       String?
  performedAt DateTime @default(now())
  performedBy String?  // free text name
  createdAt   DateTime @default(now())
  printer     Printer  @relation(fields: [printerId], references: [id], onDelete: Cascade)
}
```

**New API Routes:**
- `GET /api/printers/[id]/maintenance` — maintenance log for a printer
- `POST /api/printers/[id]/maintenance` — log a maintenance event; auto-update `nextMaintenanceDue`
- `DELETE /api/printers/[id]/maintenance/[logId]`

**UI Changes:**
- Printer card — add overdue maintenance badge (red if `nextMaintenanceDue` is past)
- Printer detail/edit dialog — add "Maintenance" tab with:
  - Next due date
  - Interval setting
  - Log new maintenance event form
  - Maintenance history list

#### Tasks
- [ ] **T-F10-1** DB: Add `maintenanceIntervalDays`, `nextMaintenanceDue` to `Printer`; add `PrinterMaintenanceLog` model; run migration
- [ ] **T-F10-2** API: `GET/POST /api/printers/[id]/maintenance` and `DELETE .../[logId]` routes
- [ ] **T-F10-3** UI: Maintenance tab in printer detail — log form, history list, next due date display
- [ ] **T-F10-4** UI: Overdue maintenance badge on printer cards; summary count on dashboard
- [ ] **T-F10-5** Unit tests for maintenance log creation, next-due auto-calculation, and overdue detection

---

### F11 — PWA Support

**Overview:** Make the app installable on mobile and desktop via PWA. Operators on the shop floor can add it to their home screen and get a near-native experience.

**Dependencies:**
```bash
pnpm add next-pwa
```

**Changes:**
- `next.config.js` — wrap with `withPWA` config
- `public/manifest.json` — app name, icons, theme color, display: standalone
- `public/icons/` — generate all required icon sizes (192×192, 512×512, maskable)
- `src/components/OfflineIndicator.tsx` — banner shown when navigator.onLine is false
- `src/app/layout.tsx` — add manifest link tag + viewport meta; include `<OfflineIndicator>`

#### Tasks
- [ ] **T-F11-1** Install next-pwa; configure `next.config.js`; create `public/manifest.json` with correct metadata
- [ ] **T-F11-2** Generate all PWA icon sizes; add to `public/icons/`; add offline fallback page
- [ ] **T-F11-3** Build `OfflineIndicator` component; integrate into root layout; test installability on Chrome/Safari

---

## MILESTONE 4 — v1.2 Stickiness (60–120 Days Post-Launch)

---

### F12 — Project Templates

**Overview:** Operators repeat the same project structure (same parts, same hardware) for different clients. Templates let them save a project as a reusable blueprint and instantiate it for a new order.

**DB Schema Changes:**
```prisma
model Project {
  // ... existing fields ...
  isTemplate   Boolean @default(false)
  templateName String?
}
```

**New API Routes:**
- `GET /api/projects/templates` — list all template projects for tenant
- `POST /api/projects/[id]/clone` — deep-clone a project (copies all `ProjectPart` and `ProjectHardware` records); body: `{ name: string, isTemplate: boolean }`

**UI Changes:**
- Projects page — add "Templates" tab alongside active projects
- Project detail — "Save as Template" action in project menu
- "New Project" dialog — add "Start from Template" option showing template picker

#### Tasks
- [ ] **T-F12-1** DB: Add `isTemplate` and `templateName` to `Project`; run migration
- [ ] **T-F12-2** API: `GET /api/projects/templates` and `POST /api/projects/[id]/clone` (deep clone with parts + hardware)
- [ ] **T-F12-3** UI: "Templates" tab on projects page; `TemplatePickerDialog` for new project flow
- [ ] **T-F12-4** UI: "Save as Template" and "Clone Project" actions in project detail menu
- [ ] **T-F12-5** Unit tests for deep clone logic (parts, hardware, no order associations cloned)

---

### F13 — Client Order History View

**Overview:** The clients page shows client cards but clicking one does nothing. Operators need a client detail view with full order history, total spend, and outstanding balance.

**New API Routes:**
- `GET /api/clients/[id]/summary` — client details + order history + aggregated stats (total orders, total revenue, outstanding UNPAID amount)

**New UI:**
- `src/app/(protected)/clients/[id]/page.tsx` — client detail page
  - Client info card (name, contact, source, notes) with edit button
  - Stats row: total orders, total spend, outstanding balance
  - Order history table: order number, date, status, payment status, amount
  - "Create Order" shortcut pre-filling this client

#### Tasks
- [ ] **T-F13-1** API: `GET /api/clients/[id]/summary` with order history + aggregated financial stats
- [ ] **T-F13-2** UI: `/clients/[id]` page — client info card with edit; stats row (orders, spend, outstanding)
- [ ] **T-F13-3** UI: Order history table with sort by date; "Create Order" CTA prefilling client
- [ ] **T-F13-4** UI: Make client cards on `/clients` page clickable (navigate to detail page)
- [ ] **T-F13-5** Unit tests for client summary aggregation and outstanding balance calculation

---

### F14 — Auto Job Routing (Rule-Based)

**Overview:** Manually assigning printers to each job is a bottleneck for farms with 8+ machines. Rule-based auto-routing assigns jobs to the best available idle printer matching technology and capability.

**DB Schema Changes:**
```prisma
model TenantSettings {
  // ... existing fields ...
  autoRoutingEnabled Boolean @default(false)
}
```

**New API Routes:**
- `POST /api/queue/auto-assign` — takes an array of job IDs (or "all unassigned") and assigns each to the best available printer using routing logic
- Routing logic (pure function in `src/lib/routing.ts`):
  1. Filter printers by `status: IDLE` and `technology` match
  2. Filter by build volume (if part has dimensions)
  3. Sort by job queue depth (assign to least-loaded printer)
  4. Assign or mark `UNROUTABLE` if no match found

**UI Changes:**
- Queue page header — "Auto-Assign" button (available when `autoRoutingEnabled = true`)
- Settings page — toggle for auto-routing + explanation

#### Tasks
- [ ] **T-F14-1** DB: Add `autoRoutingEnabled` to `TenantSettings`; run migration
- [ ] **T-F14-2** Build `src/lib/routing.ts` — pure routing engine function with technology + volume matching
- [ ] **T-F14-3** API: `POST /api/queue/auto-assign` — apply routing engine to selected/all unassigned jobs
- [ ] **T-F14-4** UI: "Auto-Assign" button in queue header; routing rules toggle in settings
- [ ] **T-F14-5** Unit tests for routing engine: technology mismatch, capacity sorting, no-match scenario, multi-job batch

---

## MILESTONE 5 — v2.0 Expansion (Q3 2026)

---

### F15 — Client-Facing Order Tracking Portal

**Overview:** Blue ocean feature — no competitor has this. Clients get a unique shareable link to track their order status without needing an account. Reduces support overhead.

**DB Schema Changes:**
```prisma
model Order {
  // ... existing fields ...
  trackingToken String? @unique @default(cuid())
}
```

**New API Routes:**
- `GET /api/track/[token]` — public, no auth; returns safe order subset (status, parts progress, due date, no cost/margin data)
- `POST /api/orders/[id]/tracking-token` — generates/regenerates token; ADMIN/OPERATOR only

**New UI:**
- `src/app/track/[token]/page.tsx` — public tracking page (no sidebar, no auth):
  - Order number + client name
  - Status timeline (Pending → In Progress → Assembled → Delivered)
  - Parts list with per-part status
  - Estimated completion date
  - Farm branding (uses `Tenant.logo` and name)
- Order detail page — "Share Tracking Link" button with copy-to-clipboard

#### Tasks
- [ ] **T-F15-1** DB: Add `trackingToken` to `Order`; run migration; generate token for all existing orders
- [ ] **T-F15-2** API: `GET /api/track/[token]` (public) and `POST /api/orders/[id]/tracking-token` (protected)
- [ ] **T-F15-3** UI: `/track/[token]` public page — status timeline, parts list, farm branding
- [ ] **T-F15-4** UI: "Share Tracking Link" button + copy modal on order detail page
- [ ] **T-F15-5** Unit tests for public endpoint data sanitization (no cost/margin leakage) and token uniqueness

---

### F16 — Invoicing & PDF Generation

**Overview:** The cost model is already complete. Invoicing turns it into a business tool. Build only after confirming customers don't already use external billing tools.

**Dependencies to install:**
```bash
pnpm add @react-pdf/renderer
```

**DB Schema Changes:**
```prisma
enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  VOID
}

model Invoice {
  id          String        @id @default(cuid())
  tenantId    String
  orderId     String        @unique
  invoiceNo   String        // human-readable: INV-2026-0001
  status      InvoiceStatus @default(DRAFT)
  lineItems   Json          // [{description, qty, unitPrice, total}]
  subtotal    Decimal
  taxRate     Decimal       @default(0)
  taxAmount   Decimal       @default(0)
  total       Decimal
  notes       String?
  dueDate     DateTime?
  issuedAt    DateTime?
  paidAt      DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  tenant      Tenant        @relation(fields: [tenantId], references: [id])
  order       Order         @relation(fields: [orderId], references: [id])
}

model TenantSettings {
  // ... existing fields ...
  invoicePrefix     String  @default("INV")
  nextInvoiceNumber Int     @default(1)
  taxRate           Decimal @default(0)
  invoiceNotes      String?
}
```

**New API Routes:**
- `GET /api/invoices` — list invoices for tenant
- `POST /api/invoices` — create invoice from order (auto-populates line items from order cost data)
- `GET/PUT/DELETE /api/invoices/[id]`
- `GET /api/invoices/[id]/pdf` — generates and streams PDF
- `POST /api/invoices/[id]/send` — emails PDF to client via Resend (requires F8)

**New UI:**
- `src/app/(protected)/invoices/page.tsx` — invoice list with status filter
- `src/app/(protected)/invoices/[id]/page.tsx` — invoice detail + preview
- `src/emails/InvoiceEmail.tsx` — email template with PDF attachment
- Order detail page — "Issue Invoice" button (if no invoice exists for this order)
- Add "Invoices" to sidebar navigation

#### Tasks
- [ ] **T-F16-1** DB: Add `Invoice` model, `InvoiceStatus` enum, invoice settings to `TenantSettings`; run migration
- [ ] **T-F16-2** Install `@react-pdf/renderer`; build `InvoicePDF.tsx` component (logo, line items, totals, payment details)
- [ ] **T-F16-3** API: `GET/POST /api/invoices` — list and create from order cost data with auto line-item generation
- [ ] **T-F16-4** API: `GET/PUT/DELETE /api/invoices/[id]` and `GET /api/invoices/[id]/pdf` streaming endpoint
- [ ] **T-F16-5** API: `POST /api/invoices/[id]/send` — email invoice PDF to client via Resend
- [ ] **T-F16-6** UI: Invoice list page with status badges and filter
- [ ] **T-F16-7** UI: Invoice detail/edit page with line item editor and PDF preview panel
- [ ] **T-F16-8** UI: "Issue Invoice" button on order detail; "Invoices" sidebar nav item
- [ ] **T-F16-9** Unit tests for line item auto-generation from order cost, PDF rendering, invoice number sequencing

---

### F17 — Multi-Tenant Reseller Mode

**Overview:** The multi-tenant architecture is already in place. This adds a super-admin tier for operators who manage farms on behalf of multiple end-clients (service bureaus, print-as-a-service).

**DB Schema Changes:**
```prisma
enum UserRole {
  SUPER_ADMIN  // new
  ADMIN
  OPERATOR
  VIEWER
}

model Tenant {
  // ... existing fields ...
  parentTenantId String?
  parentTenant   Tenant?  @relation("TenantHierarchy", fields: [parentTenantId], references: [id])
  childTenants   Tenant[] @relation("TenantHierarchy")
}
```

**New API Routes:**
- `GET /api/admin/tenants` — list all tenants (SUPER_ADMIN only)
- `POST /api/admin/tenants` — create child tenant
- `PUT /api/admin/tenants/[id]` — update tenant settings
- `DELETE /api/admin/tenants/[id]` — deactivate tenant
- `POST /api/admin/tenants/[id]/impersonate` — create impersonation session token

**New UI:**
- `src/app/(admin)/layout.tsx` — super-admin layout
- `src/app/(admin)/tenants/page.tsx` — tenant list with stats
- `src/app/(admin)/tenants/[id]/page.tsx` — tenant detail + impersonation button

**Middleware changes:** Add SUPER_ADMIN bypass for tenant isolation checks; add impersonation session handling.

#### Tasks
- [ ] **T-F17-1** DB: Add `SUPER_ADMIN` to `UserRole` enum; add `parentTenantId` to `Tenant`; run migration
- [ ] **T-F17-2** API: `GET/POST /api/admin/tenants`, `PUT/DELETE /api/admin/tenants/[id]`, impersonation endpoint
- [ ] **T-F17-3** UI: Super-admin `(admin)` route group with tenant list and detail pages
- [ ] **T-F17-4** Middleware: SUPER_ADMIN role bypass + impersonation session token handling
- [ ] **T-F17-5** UI: Impersonation banner (shown when super-admin is impersonating a tenant)
- [ ] **T-F17-6** Unit tests for SUPER_ADMIN route protection, tenant isolation, and impersonation session security

---

## Summary: All Tasks by Milestone

### Milestone 0 — Foundation (Week 1)
| ID | Task | Parallelizable |
|----|------|---------------|
| T-F0-1 | Commit pnpm-lock.yaml | ✓ Solo |
| T-F0-2 | createNotification() utility | ✓ |
| T-F0-3 | Standardize API error shape | ✓ |
| T-F0-4 | Improve seed data | ✓ |
| T-F0-5 | Tests: notification + error helpers | after T-F0-2, T-F0-3 |
| T-F0b-1 | DB: PasswordResetToken model | ✓ |
| T-F0b-2 | API: forgot/reset password routes | after T-F0b-1 |
| T-F0b-3 | UI: forgot/reset password pages | after T-F0b-2 |
| T-F0b-4 | Tests: password reset flow | after T-F0b-3 |

### Milestone 1 — v1.0 Launch (Week 2–3)
| ID | Task | Parallelizable |
|----|------|---------------|
| T-F1-1 | Install recharts + ChartContainer | ✓ |
| T-F1-2 | API: timeseries endpoint | ✓ |
| T-F1-3 | Chart: Orders Over Time | after T-F1-1, T-F1-2 |
| T-F1-4 | Chart: Revenue Over Time | after T-F1-1, T-F1-2 |
| T-F1-5 | Chart: Filament Usage | after T-F1-1, T-F1-2 |
| T-F1-6 | Tests: analytics API + charts | after T-F1-3–5 |
| T-F2-1 | DB: lowStockThreshold field | ✓ |
| T-F2-2 | API: threshold trigger | after T-F2-1, T-F0-2 |
| T-F2-3 | UI: threshold input in dialog | after T-F2-1 |
| T-F2-4 | UI: low-stock badge on spools | after T-F2-1 |
| T-F2-5 | UI: dashboard low-stock banner | after T-F2-4 |
| T-F2-6 | Tests: threshold logic | after T-F2-2 |
| T-F3-1 | API: FAILED status + failureReason | after T-F0-2 |
| T-F3-2 | UI: FailureLogDialog | ✓ |
| T-F3-3 | UI: failed job visual styling | after T-F3-2 |
| T-F3-4 | UI: failure breakdown chart | after T-F1-1 |
| T-F3-5 | Tests: failure logging | after T-F3-1 |
| T-F4-1 | API: job history endpoint | ✓ |
| T-F4-2 | API: reprint endpoint | ✓ |
| T-F4-3 | UI: History tab + JobHistoryList | after T-F4-1 |
| T-F4-4 | UI: Reprint button + dialog | after T-F4-2 |
| T-F4-5 | Tests: history + reprint logic | after T-F4-2 |

### Milestone 2 — Monetization (Week 4–6, parallel with M1)
| ID | Task | Parallelizable |
|----|------|---------------|
| T-F5-1 | DB: Subscription model | ✓ |
| T-F5-2 | Stripe client setup | ✓ |
| T-F5-3 | API: checkout session | after T-F5-2 |
| T-F5-4 | API: webhook handler | after T-F5-2 |
| T-F5-5 | API: portal + subscription status | after T-F5-2 |
| T-F5-6 | UI: BillingSection in settings | after T-F5-5 |
| T-F5-7 | UI: /subscribe plan page | after T-F5-3 |
| T-F5-8 | Middleware: plan enforcement | after T-F5-1 |
| T-F5-9 | Tests: webhook + billing logic | after T-F5-4 |
| T-F6-1 | Landing: (marketing) layout + scaffold | ✓ |
| T-F6-2 | Landing: NavBar + Hero + Problem | after T-F6-1 |
| T-F6-3 | Landing: Features + HowItWorks | after T-F6-1 |
| T-F6-4 | Landing: Pricing section | after T-F5-7, T-F6-1 |
| T-F6-5 | Landing: SocialProof + FAQ | after T-F6-1 |
| T-F6-6 | Landing: Privacy, Terms, SEO, sitemap | after T-F6-1 |
| T-F6-7 | Tests: landing page snapshots | after T-F6-2–6 |
| T-F7-1 | DB: onboardingCompleted + TeamInvite | ✓ |
| T-F7-2 | API: onboarding complete/skip | after T-F7-1 |
| T-F7-3 | API: invite CRUD routes | after T-F7-1 |
| T-F7-4 | UI: OnboardingWizard Step 1 | after T-F7-1 |
| T-F7-5 | UI: OnboardingWizard Step 2 (printer) | after T-F7-4 |
| T-F7-6 | UI: OnboardingWizard Step 3 (invite) | after T-F7-3 |
| T-F7-7 | UI: OnboardingGate + layout integration | after T-F7-4–6 |
| T-F7-8 | UI: /invite/[token] acceptance page | after T-F7-3 |
| T-F7-9 | Tests: invite + onboarding flow | after T-F7-8 |

### Milestone 3 — v1.1 (Post-Launch +60 days)
| ID | Task |
|----|------|
| T-F8-1 through T-F8-8 | Email infrastructure (see F8) |
| T-F9-1 through T-F9-4 | Printer utilization history (see F9) |
| T-F10-1 through T-F10-5 | Maintenance scheduling (see F10) |
| T-F11-1 through T-F11-3 | PWA support (see F11) |

### Milestone 4 — v1.2 (Post-Launch +120 days)
| ID | Task |
|----|------|
| T-F12-1 through T-F12-5 | Project templates (see F12) |
| T-F13-1 through T-F13-5 | Client order history (see F13) |
| T-F14-1 through T-F14-5 | Auto job routing (see F14) |

### Milestone 5 — v2.0 (Q3 2026)
| ID | Task |
|----|------|
| T-F15-1 through T-F15-5 | Client tracking portal (see F15) |
| T-F16-1 through T-F16-9 | Invoicing + PDF (see F16) |
| T-F17-1 through T-F17-6 | Reseller mode (see F17) |

---

*Total: 17 features · ~110 tasks · Estimated 5 milestones spanning Q1–Q3 2026*
*Architecture document maintained by: Lead Engineer*
*Last updated: March 2026*
