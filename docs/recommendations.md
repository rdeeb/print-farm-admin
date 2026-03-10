# 3D Farm Admin — Product Recommendations
*Team Lead Report · March 10, 2026*

---

## Executive Summary

This product occupies a genuinely defensible niche: it is the **only farm management tool built around a project-based Bill of Materials model with real cost calculation**. No competitor has this. The codebase is 75–85% complete. The gap to v1.0 is approximately **2 weeks of focused work** — not months. The strategic recommendation is to ship fast, target solo/small-shop operators, and layer on differentiating features (client portal, invoicing) only after confirming product-market fit with 10+ paying customers.

---

## What Ships at v1.0 (The 4 Non-Negotiables)

| # | Feature | Effort | Definition of Done |
|---|---------|--------|--------------------|
| 1 | **Analytics charts rendered** | 2–3 days | Orders-over-time, revenue, and filament charts using existing API data. Zero placeholder text remains on `/analytics`. |
| 2 | **Filament low-stock visual alert** | 1 day | Badge/color indicator per spool below threshold. UI only — no email yet. |
| 3 | **Print job failure logging** | 1–2 days | "Mark as Failed" action with reason dropdown (jam, adhesion, power loss, file error, other) + notes. Persisted to DB. |
| 4 | **Job history + reprint action** | 1–2 days | Filtered history view of completed/failed jobs. One-click "Reprint" clones job back to queue. |

**Everything else waits.** The analyst wanted more; the Lean Advocate was right to cut it.

---

## Post-Launch Roadmap

### v1.1 — First 60 Days (Retention)
- Wire email notifications (Resend/Postmark) to the `Notification` model already in schema — low stock + job failure triggers only
- Per-printer utilization history (data already exists in `PrintJob` records — query + chart)
- Maintenance scheduling — a "Next Service Due" date field + overdue badge (4 hours of work)
- PWA manifest — makes the web app installable on mobile, no native app needed

### v1.2 — 60–120 Days (Stickiness)
- **Project templates** — save/clone a project as a reusable blueprint (highest-leverage differentiator given the BOM model)
- **Client order history view** — filtered order list scoped to a client record
- **Auto job routing (rule-based)** — assign jobs by filament type/printer capability; no ML

### v2.0 — Q3 2026 (Expansion)
- **Client-facing order tracking portal** — unique-token public URL per order; no competitor has this
- **Invoicing** — only if customer interviews confirm they aren't already using FreshBooks/QuickBooks
- **Multi-tenant reseller mode** — sub-tenant management; the architecture already supports it

---

## The 3 Strategic Differentiators (Don't Lose These)

**1. Project-Based BOM Model** — No competitor models a print job as part of a project with parts, hardware, and cost rollup. Lead all marketing with this. Pitch: *"Do you know your actual cost per order, including failed prints and wasted filament?"*

**2. Full Cost Model with Multipliers** — The settings-driven cost system is already built and is unique. It's 80% of the path to invoice generation — the hard part is done.

**3. Multi-Tenant Architecture from Day One** — Invisible to early customers but the unlock for a reseller/bureau tier in v2. No competitor built for this.

---

## Permanently Deprioritize

| Feature | Why |
|---------|-----|
| AI failure detection (camera/CV) | Hardware + ML infrastructure — not a software product |
| Built-in slicing engine | Free commodity tools (Bambu Studio, PrusaSlicer) solve this |
| Native mobile app | PWA covers the use case; two codebases is not worth it pre-PMF |
| Granular permissions (18+ types) | Enterprise procurement feature; 3 roles cover every small shop scenario |
| Automated print ejection hardware | Physical hardware product — out of scope |

---

## Go-to-Market

**Target customer:** Solo operator or 2-person shop, 5–15 Bambu/Prusa printers, currently on Notion + spreadsheets.

**Reach them via:** Bambu community forums, r/3Dprinting, Etsy/MakerWorld seller communities.

**Positioning:** *"The first order management system built for 3D print farms that shows you your actual cost per job — before you quote and after you ship."*

**Pricing (flat monthly, tiered by printer count):**

| Tier | Printers | Price |
|------|----------|-------|
| Solo | Up to 5 | $29/mo |
| Shop | Up to 20 | $79/mo |
| Farm | Unlimited | $149/mo |

14-day free trial, no credit card. **No free tier** — it attracts non-buyers.

---

## Quick Technical Wins (Do These Now)

1. **Commit `pnpm-lock.yaml`** — currently untracked; Dokku builds are non-deterministic without it (30 min)
2. **Add `createNotification()` utility** — the schema is ready; one shared function prevents five different notification patterns later (2 hrs)
3. **Consistent API error shape** — `{ error, code }` across all routes (3 hrs)
4. **Seed data quality pass** — ensure the demo seed has realistic data: mixed order statuses, a spool below threshold, job history with at least one failure

---

## Appendix: Competitive Landscape Summary

Eight competitors were analyzed: 3DPrinterOS, SimplyPrint, Obico, Bambu Farm Manager, Repetier-Server, Prusa Connect, AstroPrint, 3DQue AutoFarm3D, and Printago.

### Table Stakes (3+ Competitors Have These)
- Automated filament low-stock alerts + email delivery
- Rendered analytics charts
- Per-printer utilization history
- Maintenance scheduling / PM tracking
- Job history with reprint capability
- Mobile app or PWA

### Blue Ocean (Nobody Has These)
- Client-facing order tracking portal
- Invoicing / quote-to-invoice workflow
- **Project BOM management** ← we already have this
- Multi-tenant reseller mode

### Competitor Pricing Reference
| Product | Model | Price |
|---------|-------|-------|
| SimplyPrint | Flat fee | $31/mo (farm tier) |
| 3DPrinterOS | Per-printer | ~$9.50/printer/mo |
| 3DQue AutoFarm3D | Per-printer | $10–$30/printer/mo |
| Obico | Per-device | $4/mo/printer |
| Repetier-Server | One-time | €59.99 perpetual |
| Bambu Farm Manager | Free | $0 (Bambu-only) |

---

*Generated by a multi-agent analysis team: Feature Analyst, Market Researcher, Feature Gap Analyst, Lean/MVP Advocate, and Team Lead.*
