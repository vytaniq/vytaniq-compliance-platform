# VYTANIQ SYSTEM ARCHITECTURE & DESIGN DOCUMENT

**Document Version:** 1.0  
**Date:** March 8, 2026  
**Author:** Staff-Level Architecture Team  
**Status:** Draft — Ready for Implementation

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Step 1: PRD Analysis & Requirements Summary](#step-1-prd-analysis)
3. [Step 2: Tech Stack Justification](#step-2-tech-stack)
4. [Step 3: System Architecture Overview](#step-3-system-architecture)
5. [Step 4: Repository Folder Structure](#step-4-repository-structure)
6. [Step 5: Modular File Organization](#step-5-modular-organization)
7. [Database Design](#database-design)
8. [API Architecture](#api-architecture)
9. [Security Model](#security-model)
10. [Scalability & Non-Functional Requirements](#scalability-nfr)

---

## EXECUTIVE SUMMARY

Vytaniq is a **compliance intelligence platform** purpose-built for Nigerian Payment Service Provider (PSP) startups operating under Central Bank of Nigeria (CBN) licensing. 

**Phase 1 Objective:** Build a structured compliance control panel that answers three critical questions for PSP founders and compliance officers:
- What does CBN require of us?
- When are our deadlines?
- How compliant are we right now?

**Target Users:**  
- Compliance Leads (Series A-B PSPs, 1-3 person teams)
- Founders/CEOs (pre-Series A, acting as compliance lead)
- Investors (read-only portfolio monitoring)
- External Legal Advisors (counsel supporting PSPs)

**Target Metrics:**
- 10-30 PSP startups onboarded in Phase 1
- 80%+ complete onboarding within 7 days
- 60%+ weekly active usage
- 75%+ Month 3 retention
- ₦5M–₦15M ARR by month 12

---

## STEP 1: PRD ANALYSIS & REQUIREMENTS SUMMARY

### 1.1 Core Product Requirements (Phase 1)

Vytaniq Phase 1 delivers **6 core modules** that form an integrated compliance control panel:

| Module | Purpose | Key Deliverables |
|--------|---------|------------------|
| **Onboarding & License Configuration** | Collect company profile and license profile | Email/OTP auth, license type selection, activity flags, baseline score |
| **Compliance Dashboard** | Central hub for compliance visibility | 6 widgets: Readiness Score, Obligation Map, Deadlines, Circulars, Progress, Risk Flags |
| **Obligation Registry** | Definitive catalog of all CBN requirements | 60+ curated obligations indexed by license type, frequency, severity |
| **Circular Tracker** | CBN regulatory publication management | Ingest circulars, tag affected obligations, impact assessment, dispute mechanism |
| **Regulatory Calendar** | Deadline tracking and reminders | Auto-populated 12-month report deadlines, color-coded urgency, recurring entries |
| **Readiness Score Engine** | Compliance health metric for investors | 0-100 score with 5 components, 4 score bands, drill-down breakdown |

### 1.2 User Workflows (Gold-Path Flows)

#### Workflow 1: PSP Founder Onboarding (Day 1)
```
Land on /register 
  → Enter company name + email + password 
  → Verify OTP 
  → Select CBN license type (PSP/MMO/Switching/PSSB)
  → Enter license number + issue/renewal dates
  → Select business activities (payments, lending, FX, etc.)
  → Optional: Upload existing compliance docs
  → System generates obligation list + baseline readiness score
  → Redirected to /dashboard
```

#### Workflow 2: Compliance Lead Reviewing Status (Weekly)
```
Open /dashboard 
  → View readiness score (0-100, with band: Investor Ready / Audit Ready / Work Required / At Risk)
  → Review obligation map (categorized: KYC, AML, Reporting, etc.)
  → Check upcoming deadlines (30-day, 7-day, urgent)
  → Review new circulars + impact tags (Applies to You / Monitor / N/A)
  → Click obligation → upload supporting evidence → mark complete
  → Audit log auto-recorded with timestamp + user
```

#### Workflow 3: Circular Update Management (Reactive)
```
CBN publishes circular 
  → Vytaniq legal team ingests within 48 hours
  → Tags affected license types + obligations
  → System auto-matches against all PSP profiles
  → Relevant PSPs receive email + in-app alert
  → PSP can acknowledge or dispute relevance
  → Dispute reviewed by legal team within 72 hours
  → If legitimate → assessment corrected globally for all PSPs
```

#### Workflow 4: Investor Due Diligence (Month 3 of Customer)
```
VC evaluating PSP portfolio company 
  → Requests readiness report 
  → Compliance Lead generates PDF snapshot
  → PDF includes: score, component breakdown, obligation summary, circular log
  → PDF includes mandatory disclaimer: "Internal self-assessment only, not CBN endorsement"
  → VC receives anonymized metrics for benchmarking (Phase 3)
```

### 1.3 Core Entities & Data Model Overview

**Key Entities:**
- `organizations` — PSP company profile
- `users` — Team members (roles: admin, member, observer)
- `obligations` — Master catalog of CBN requirements (versioned)
- `obligation_versions` — Historical versions of obligations (PRD Appendix A1)
- `org_obligations` — Tracking: which obligations apply to which PSPs, status, evidence
- `circulars` — CBN publications (ingested weekly)
- `org_circulars` — Org-specific circular relevance + acknowledgment status
- `circular_disputes` — PSP challenges to circular relevance (PRD Appendix A3)
- `report_calendar` — Auto-populated report deadlines
- `readiness_scores` — Computed compliance health (5 components, weighted)
- `audit_logs` — Immutable record of every data mutation (append-only, PRD Appendix A6)

---

## STEP 2: TECH STACK JUSTIFICATION

### 2.1 Frontend: Next.js 14 + TypeScript + React

**Why Next.js 14?**
- **Server Components + App Router** → Natural separation of server/client logic; reduces data exposure to browser
- **Built-in API routes** → No separate backend service needed for Phase 1 (100% sufficient for 500 concurrent users per NFR; migrate at Phase 2 if needed)
- **Dynamic route parameters** → Clean `/obligations/[orgId]` routing
- **Authentication middleware (next/headers)** → Protect routes server-side before rendering
- **Automatic code splitting** → Smaller bundles; faster client-side navigation
- **Vercel hosting** → Friction-free deployment, edge functions for global distribution
- **TypeScript** → Catch bugs at compile time; self-documenting API contracts; better refactoring

**Alternative Considered:** Express + React SPA
- **Why rejected:** Two separate deployments; more infrastructure overhead; harder to protect sensitive data (auth tokens, org_id); API surface grows faster without co-location

### 2.2 Backend API: Node.js + Next.js API Routes

**Why not separate Express/NestJS service?**
- Phase 1 scale (500 concurrent users, <2s dashboard load, <500ms P95 API response) easily handled by Next.js App Router
- Single deployment artifact reduces operational complexity
- Prisma ORM handles DB access uniformly
- Scheduled jobs via AWS EventBridge + Lambda stay decoupled anyway
- **Planned migration path:** At Phase 2 (if user base hits 5,000+), extract API routes to standalone NestJS service (already versioned `/v1/` for this)

**Why Node.js?**
- Excellent async/await + stream handling for file operations (S3 presigned URLs, evidence uploads)
- Rich ecosystem for business logic: date computations (`luxon`), JSON transformations (`zod`), email queues (`node-queue`)
- Same language as frontend → code reuse (types, utility functions, date logic)
- Easy to learn for full-stack teams (no Django/Python context switch)

### 2.3 Database: PostgreSQL + Prisma ORM

**Why PostgreSQL?**
- **Relational model fit:** Complex obligation mapping (license ↔ activity ↔ obligation), versioning (obligation_versions table)
- **JSON support** → `deadline_logic`, `auto_fill_mappings`, `evidence_required` stored as JSON; queried with `@>` operators (PRD Appendix A6.1)
- **Triggers + Rules** → Enforce append-only audit_logs table at DB level (no UPDATE/DELETE on audit_logs, PRD A6.2 Rule 6)
- **ACID transactions** → Score recalculation is a multi-table transaction; must be atomic
- **Full-text search** → Phase 2 for obligation search within vault
- **AWS RDS** → Managed backups, automated failover, multi-AZ support

**Why Prisma ORM?**
- **Type-safe queries** → Impossible to write an SQL injection; impossible to query unrelated orgs
- **Auto-generated migrations** → `prisma migrate dev` creates exact schema from schema.prisma
- **Seeding** → Load 60+ obligations + 24 months of circulars in one `prisma db seed` command
- **Observability** → `prisma studio` for interactive DB inspection during development

### 2.4 File Storage: AWS S3 + Presigned URLs

**Why S3?**
- **Security** → Evidence files never touch your application server memory; S3 handles encryption at rest (AES-256) and in transit (TLS 1.3)
- **Auditability** → Presigned URL generation logged to audit_logs; every download tracked
- **Compliance** → NDPR requires data residency; S3 in af-south-1 (Cape Town) or eu-west-1 (Ireland)
- **Cost** → Pay only for storage + bandwidth; no server-side file handling overhead
- **15-minute presigned URLs** → Upper bound per PRD A2.1; prevents URL leaks / secondary sharing

**Encryption Spec (PRD A2.1):**
- At-rest: AWS SSE-S3 (Phase 1) → SSE-KMS with customer-managed keys (Phase 2, Enterprise only)
- In-transit: TLS 1.3 enforced
- Access Control: No public bucket; all access via presigned URLs checked against org_id

### 2.5 Authentication: JWT + OTP (Sendgrid) + Refresh Tokens

**Why JWT?**
- Stateless authentication; no session table needed
- Cookies can store refresh token (httpOnly, Secure, SameSite=Strict)
- Token payload includes `orgId`, `role`, `planTier` → Use in API routes to enforce RBAC server-side

**OTP via Sendgrid:**
- No SMS dependency (Phase 1); 6-digit OTP, 10-minute expiry
- Email opens access to a wider audience (compliance officers may not have corp phone)
- Phase 2: Add SMS backups for critical deadlines (Termii)

**Refresh Token Strategy:**
- Access token: 15 minutes (JWT)
- Refresh token: 7 days (httpOnly cookie + DB record)
- DB lookup on refresh allows revocation (logout, security event, plan suspension)

### 2.6 Email & Notifications: Sendgrid + In-App Polling

**Why Sendgrid?**
- Nigerian fintech standard; reliable delivery in Nigeria
- Template system → consistent branding, easy A/B testing
- Delivery tracking → analytics on email effectiveness
- GDPR/NDPR compliant (data processor agreement available)

**In-App Notifications:**
- Phase 1: Polling (React Query refetch every 30s when user on /dashboard)
- Phase 2: WebSocket (server broadcasts obligation updates, circular disputes resolved)

**SMS (Termii, Phase 1):**
- Only for critical deadline alerts (7-day urgent reminders)
- Not for all notifications (cost + rate limiting concerns)

### 2.7 Scheduled Jobs: AWS EventBridge + Lambda

**Why AWS EventBridge + Lambda (not a background job queue)?**
- No operational burden; serverless
- Cron schedule: "30-day reminder: 3rd of every month at 6 AM WAT"
- Automatic retry + DLQ (dead-letter queue)
- CloudWatch monitoring
- Pay only for invocations (90 orgs × 12 months = 1,080 invocations/year ≈ $0.50)

**Use Cases:**
1. **30-day deadline reminders** — EventBridge → Lambda → fetch due deadlines → Sendgrid email queue
2. **7-day urgent reminders** — EventBridge → Lambda → fetch due deadlines → create risk flags + email
3. **Weekly circular ingestion** — EventBridge → Lambda → scrape CBN website (Phase 2) / manual trigger (Phase 1)
4. **Score recalculation** — EventBridge on obligation status change (or manual batch nightly)

### 2.8 Monitoring & Analytics

| Component | Tool | Why |
|-----------|------|-----|
| **Error Tracking** | Sentry | Real-time alerts for production errors; source map integration |
| **Infrastructure** | AWS CloudWatch | CPU, memory, request latency for ECS containers |
| **Product Analytics** | PostHog | Track all 4 conversion moments (PRD A4), feature usage (obligation tracking), retention |
| **Logs** | CloudWatch Logs | Application debug logs; queryable via Athena |
| **APM** | AWS X-Ray (Optional Phase 1.1) | Trace slow requests; identify bottlenecks |

### 2.9 Design System & UI: Tailwind CSS + Custom Components

**Why Tailwind?**
- Utility-first CSS → No CSS-in-JS runtime; output is static CSS
- Design tokens (color, spacing, radius, shadow, animation) as CSS variables
- Rapid prototyping; consistent spacing scale
- DX: hover:, dark:, md: breakpoints inline in component markup

**Design Philosophy:**
- Dark mode (deep navy #0A0E1A background) → signals "serious regulatory tool" not "cute fintech"
- Electric teal accent (#00D4B8) → clarity, action, compliance
- Geometric typography (Syne for headlines, DM Sans for body) → modern but professional
- Score gauge visualization → large, animate from 0 to final value on first load

---

## STEP 3: SYSTEM ARCHITECTURE OVERVIEW

### 3.1 Layered Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                               │
│  ┌─────────────┐  ┌──────────────────┐  ┌─────────────════────┐ │
│  │ Browser UI  │  │ React Components │  │ React Query caches  │ │
│  │ (Dark mode) │  │ (Dashboard,      │  │ (SWR, RTK Query)    │ │
│  │             │  │  Obligations,    │  │                     │ │
│  │             │  │  Circulars)      │  │ Zustand UI state    │ │
│  └─────────────┘  └──────────────────┘  └─────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                ↓ HTTPS + TLS 1.3
┌──────────────────────────────────────────────────────────────────┐
│                   API GATEWAY / MIDDLEWARE                        │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Next.js Middleware → Verify JWT, extract org_id, role       ││
│  │ withAuth wrapper → RBAC + plan-tier feature gates           ││
│  │ Rate Limiting → 100 req/min per org, 5 req/hour per email   ││
│  │ Request Logging → Every API call logged with response code  ││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
                ↓
┌──────────────────────────────────────────────────────────────────┐
│              BUSINESS LOGIC LAYER (API Routes)                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │ Auth         │ │ Onboarding   │ │ Dashboard                │ │
│  │ /auth/*      │ │ /onboarding  │ │ /dashboard/[orgId]       │ │
│  │              │ │              │ │                          │ │
│  │ • register   │ │ • license    │ │ • aggregate 6 widgets    │ │
│  │ • verify OTP │ │  selection   │ │ • compute readiness      │ │
│  │ • login      │ │ • activity   │ │   score (5 components)   │ │
│  │ • refresh    │ │  flags       │ │                          │ │
│  │              │ │ • obligation │ │ Obligations              │ │
│  │              │ │  engine      │ │ /obligations/[orgId]     │ │
│  │              │ │ • baseline   │ │                          │ │
│  └──────────────┘ │  score       │ │ • list all applicable    │ │
│  ┌──────────────┐ │              │ │ • status tracking        │ │
│  │ Circulars    │ │              │ │ • evidence upload        │ │
│  │ /circulars/* │ │ • evidence   │ │                          │ │
│  │              │ │  upload      │ │ Circular Tracker         │ │
│  │ • list       │ │  (presigned  │ │ /circulars/[orgId]       │ │
│  │   circulars  │ │  URLs)       │ │                          │ │
│  │ • impact     │ └──────────────┘ │ • list circulars         │ │
│  │   analysis   │                  │ • dispute relevance      │ │
│  │ • dispute    │                  │ • 72h dispute SLA        │ │
│  │   flow       │                  │                          │ │
│  │ • 72h SLA    │  Readiness Score │ Calendar                 │ │
│  │   tracking   │  /readiness/[org │ /calendar/[orgId]        │ │
│  │              │  Id]             │                          │ │
│  │              │                  │ • deadline tracking      │ │
│  │              │ • score engine   │ • recurring entries      │ │
│  │              │ • component      │ • submission status      │ │
│  │              │   breakdown      │                          │ │
│  │              │ • action list    │ Admin                    │ │
│  │              │ • PDF gen        │ /admin/[internal]        │ │
│  │              │                  │                          │ │
│  └──────────────┘                  │ • obligation mgmt        │ │
│  ┌──────────────┐                  │ • circular ingestion     │ │
│  │ Audit        │                  │ • dispute review         │ │
│  │ Logger       │                  │                          │ │
│  │ (append-only)│                  │                          │ │
│  │              │                  │                          │ │
│  │ Every        │                  │                          │ │
│  │ mutation     │                  │                          │ │
│  │ writes:      │                  │                          │ │
│  │ userId,      │                  │                          │ │
│  │ orgId,       │                  │                          │ │
│  │ action,      │                  │                          │ │
│  │ entity,      │                  │                          │ │
│  │ metadata     │                  │                          │ │
│  └──────────────┘                  └──────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
           ↓ Read/Write with org_id filter
┌──────────────────────────────────────────────────────────────────┐
│              DATA ACCESS LAYER (Prisma ORM)                       │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Prisma Client                                                ││
│  │ • All queries parameterized (no SQL injection)              ││
│  │ • Auto-filter: WHERE org_id = context.orgId                ││
│  │ • Transactions for multi-table updates (e.g., score calc)  ││
│  │ • Type-safe query results (TypeScript interfaces)          ││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
           ↓ Parameterized queries over TLS
┌──────────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ PostgreSQL (AWS RDS, af-south-1 or eu-west-1)              ││
│  │                                                              ││
│  │ • organizations (org_id, name, license_types[], plan_tier) ││
│  │ • users (user_id, org_id, email, role, password_hash)      ││
│  │ • obligations (obligation_id, title, category, frequency)  ││
│  │ • obligation_versions (versioning, PRD A1)                 ││
│  │ • org_obligations (status, evidence_urls[], completed_at)  ││
│  │ • circulars (circular_id, title, affected_obligations[])  ││
│  │ • org_circulars (relevance_tag, acknowledged_at)           ││
│  │ • circular_disputes (SLA tracking, resolution)             ││
│  │ • report_calendar (entry_id, org_id, due_date, status)     ││
│  │ • readiness_scores (total_score, component_scores[], band) ││
│  │ • audit_logs (append-only, every mutation)                 ││
│  │ • redis (sessions, cache, rate limit counters)             ││
│  │                                                              ││
│  │ Encryption: AES-256 at rest, TLS 1.3 in transit            ││
│  │ Backups: Every 6h, 30-day retention, point-in-time restore ││
│  │ Rules: Audit logs INSERT-only (no UPDATE/DELETE)           ││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
           ↓ Presigned URLs (org_id validated)
┌──────────────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES (Asyncronous)                      │
│  ┌──────────────────┐ ┌──────────────┐ ┌────────────────────┐   │
│  │ AWS S3           │ │ Sendgrid     │ │ AWS EventBridge    │   │
│  │ (Evidence Vault) │ │ (Email)      │ │ + Lambda           │   │
│  │                  │ │              │ │ (Scheduled Jobs)   │   │
│  │ • Presigned URLs │ │ • OTP        │ │                    │   │
│  │ • 15min expiry   │ │ • Reminders  │ │ • 30-day reminder  │   │
│  │ • SSE-S3         │ │ • Alerts     │ │ • 7-day urgent     │   │
│  │ • Audit logging  │ │ • Invoices   │ │ • Circular ingest  │   │
│  │ • NDPR data      │ │ • Support    │ │ • Score recalculate│   │
│  │   residency      │ │              │ │                    │   │
│  └──────────────────┘ └──────────────┘ └────────────────────┘   │
│  ┌──────────────────┐ ┌──────────────┐ ┌────────────────────┐   │
│  │ PostHog          │ │ Sentry       │ │ Paystack           │   │
│  │ (Analytics)      │ │ (Errors)     │ │ (Payments)         │   │
│  │                  │ │              │ │                    │   │
│  │ • Conversion     │ │ • Exceptions │ │ • Checkout         │   │
│  │   moments (A4)   │ │ • Stack      │ │ • Webhooks         │   │
│  │ • Feature usage  │ │   traces     │ │ • Invoice gen      │   │
│  │ • Retention      │ │ • Performance│ │                    │   │
│  │ • Funnels        │ │              │ │                    │   │
│  └──────────────────┘ └──────────────┘ └────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow: Obligation Lifecycle

```
┌─ Day 1: PSP Onboarding
│
├─ User selects license type (PSP) + activities (payments, lending)
│
├─ System triggers: Obligation Engine
│  └─ Query: obligation WHERE license_types[]='PSP' AND activity_flags[] INTERSECTS [payments, lending]
│     └─ Result: 28 applicable obligations (KYC, AML, Reporting, etc.)
│
├─ System creates: org_obligations rows for each of 28 obligations
│  └─ Baseline status: "Not Started"
│  └─ Baseline score: (0 / 28) * 0.35 = 0% obligation coverage
│
├─ Update: Readiness Score
│  └─ New score: 15–25 (very low; typical for new PSP)
│
└─ User sees: Dashboard with 28 obligations to track

┌─ Week 1–2: PSP Completes Obligations
│
├─ User clicks "Obligation detail" for "Monthly Settlement Report"
│  └─ Slides over detail view
│  └─ Shows: CBN Circular 2024/08, deadline logic: "10 business days after month end"
│  └─ Next due: 10th March
│
├─ User uploads evidence file (settl_report_feb_2026.pdf)
│  └─ System generates S3 presigned URL
│  └─ Browser uploads directly to S3, bypassing app server
│  └─ System logs: audit_log { actionType: "EVIDENCE_UPLOADED", ... }
│
├─ User clicks "Mark as Met"
│  └─ org_obligations status updated: "Met"
│  └─ Audit log written (PRD A6.2 Rule 6 — append-only)
│  └─ Score recalculated: obligation_coverage now 1/28
│
├─ Update: Readiness Score
│  └─ Old score: 20
│  └─ New score: 21
│  └─ Component updates: Obligation Coverage now 0.035 (1/28) * 0.35 = 0.035
│
└─ Dashboard updates: Score card animates 20→21, obligation card turns green

┌─ Week 3: CBN Publishes New Circular
│
├─ CBN publishes Circular 2026/05
│  └─ Content: "Switching providers must now file quarterly SLA reports"
│
├─ Vytaniq legal team (admin user) ingests circular:
│  └─ Logs into admin CMS
│  └─ Creates new circular record
│  └─ Tags: affected_license_types=['Switching'], affected_obligation_ids=['OBL-0085']
│  └─ Status published
│
├─ System triggers: Impact Matching
│  └─ Query all orgs: WHERE license_types[] CONTAINS 'Switching'
│  └─ For each matching org, create org_circular record
│  └─ relevance_tag: "Applies to you"
│
├─ System triggers: Notification
│  └─ For each affected org, send email + in-app alert
│  └─ Copy: "New CBN Circular affects your compliance: Switching providers must now file quarterly SLA reports"
│  └─ CTA: "View circular impact"
│
├─ PSP Compliance Lead receives notification
│  └─ Clicks notification
│  └─ Views circular detail view
│  └─ Sees "This circular adds a new obligation: Quarterly SLA Reporting"
│  └─ Sees linked obligation in their obligation list
│  └─ Can acknowledge ("We'll handle it") or dispute ("Not relevant to us")
│
├─ If acknowledge: org_circular.acknowledged_at = now()
├─ If dispute: circular_dispute record created with SLA tracking
│  └─ Vytaniq legal team reviews within 72 hours
│  └─ May confirm or withdraw relevance
│  └─ If withdrawn: org_circular deleted, score recalculated
│
└─ Dashboard updates: Circular badge removed or marked "Acknowledged"

┌─ Week 52: Annual Score Snapshot for Investors
│
├─ Founder requests "Investor Readiness Report"
│  └─ System generates PDF via Puppeteer
│  └─ PDF includes: current score (78 / 100), component breakdown, obligation summary, circular log
│
├─ PDF includes mandatory disclaimer:
│  └─ "The Vytaniq Readiness Score is an internal self-assessment tool based on your reported compliance activities.
│     It does not constitute a CBN assessment, endorsement, or certification of regulatory compliance."
│
├─ Founder shares PDF with VC during Series A due diligence
│  └─ VC reviews compliance posture
│  └─ VC scores PSP vs. peer benchmarks (Phase 3 feature)
│
└─ End of Phase 1: PSP has clear compliance audit trail, ready for Series A
```

---

## STEP 4: REPOSITORY FOLDER STRUCTURE

### 4.1 Monorepo Organization

The repository uses a **monorepo structure** with Next.js as the single deployment unit (Phase 1). This simplifies deployment while keeping code organized by domain.

```
vytaniq-platform/
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                      # Lint, type-check, test on every PR
│   │   └── deploy.yml                  # Deploy to Vercel on merge to main
│   └── ISSUE_TEMPLATE/
│       └── bug_report.md
│
├── apps/
│   └── web/                            # Next.js 14 monolithic app (frontend + API)
│       ├── public/
│       │   ├── fonts/                  # Self-hosted system fonts (privacy + performance)
│       │   │   ├── Syne-Bold.woff2
│       │   │   ├── DM_Sans-Regular.woff2
│       │   │   └── JetBrains_Mono-Regular.woff2
│       │   ├── images/
│       │   │   ├── logo.svg
│       │   │   ├── logo-dark.svg
│       │   │   └── avatars/
│       │   └── og/                     # Open Graph images for social sharing
│       │       ├── vytaniq-og.png      # 1200x630
│       │       └── feature-og.png
│       │
│       ├── src/
│       │   ├── app/                    # Next.js App Router
│       │   │   ├── (marketing)/        # Public site (no auth required)
│       │   │   │   ├── layout.tsx
│       │   │   │   ├── page.tsx        # Landing page
│       │   │   │   ├── pricing/page.tsx
│       │   │   │   ├── about/page.tsx
│       │   │   │   ├── methodology/page.tsx  # Score methodology (PRD A5.2)
│       │   │   │   ├── privacy/page.tsx
│       │   │   │   ├── terms/page.tsx
│       │   │   │   └── security/page.tsx
│       │   │   │
│       │   │   ├── (auth)/            # Auth routes (public, pre-login)
│       │   │   │   ├── layout.tsx      # Auth page shell
│       │   │   │   ├── register/page.tsx
│       │   │   │   ├── login/page.tsx
│       │   │   │   └── verify-otp/page.tsx
│       │   │   │
│       │   │   ├── (app)/             # Authenticated app (auth required)
│       │   │   │   ├── layout.tsx      # App shell with sidebar + navbar
│       │   │   │   ├── onboarding/    # Multi-step license configuration
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── [step]/page.tsx
│       │   │   │   │   ├── status/page.tsx
│       │   │   │   │   └── complete/page.tsx
│       │   │   │   │
│       │   │   │   ├── dashboard/     # Primary app entrypoint
│       │   │   │   │   ├── page.tsx    # 6 widgets: Score, Obligations, Deadlines, etc.
│       │   │   │   │   └── loading.tsx
│       │   │   │   │
│       │   │   │   ├── obligations/   # Obligation list + detail
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── [id]/
│       │   │   │   │   │   └── page.tsx  # Detail view + evidence upload
│       │   │   │   │   └── loading.tsx
│       │   │   │   │
│       │   │   │   ├── circulars/     # Circular tracker
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── [id]/
│       │   │   │   │   │   └── page.tsx  # Detail view + acknowledge + dispute
│       │   │   │   │   └── loading.tsx
│       │   │   │   │
│       │   │   │   ├── calendar/      # Report deadline calendar
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── [monthYear]/page.tsx
│       │   │   │   │   ├── [entryId]/
│       │   │   │   │   │   └── page.tsx  # Entry detail + submit report
│       │   │   │   │   └── loading.tsx
│       │   │   │   │
│       │   │   │   ├── readiness/     # Score breakdown + report generation
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── report/page.tsx  # PDF generation in progress
│       │   │   │   │   └── loading.tsx
│       │   │   │   │
│       │   │   │   ├── settings/      # Org settings + data export/delete
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── team/page.tsx
│       │   │   │   │   ├── security/page.tsx
│       │   │   │   │   └── billing/page.tsx
│       │   │   │   │
│       │   │   │   └── error.tsx       # Error boundary for app routes
│       │   │   │
│       │   │   ├── (admin)/           # Internal admin CMS (role='admin' only)
│       │   │   │   ├── layout.tsx
│       │   │   │   ├── obligations/   # Manage obligations + versioning
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── [id]/edit/page.tsx
│       │   │   │   │   └── create/page.tsx
│       │   │   │   │
│       │   │   │   ├── circulars/     # Ingest + tag new CBN circulars
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── [id]/
│       │   │   │   │   │   └── page.tsx  # Edit circular tags + publish
│       │   │   │   │   └── create/page.tsx
│       │   │   │   │
│       │   │   │   ├── disputes/      # Review circular disputes (SLA tracking)
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   └── [id]/
│       │   │   │   │       └── page.tsx  # Dispute detail + resolution
│       │   │   │   │
│       │   │   │   └── orgs/          # Org management for support
│       │   │   │       ├── page.tsx
│       │   │   │       └── [id]/page.tsx
│       │   │   │
│       │   │   └── api/               # All API routes (versioned)
│       │   │       └── v1/            # API v1 (future-proof for Phase 2 v2/)
│       │   │           ├── auth/
│       │   │           │   ├── register/route.ts
│       │   │           │   ├── verify-otp/route.ts
│       │   │           │   ├── login/route.ts
│       │   │           │   └── refresh/route.ts
│       │   │           │
│       │   │           ├── onboarding/
│       │   │           │   └── complete/route.ts
│       │   │           │
│       │   │           ├── dashboard/
│       │   │           │   └── [orgId]/route.ts  # Aggregate dashboard data
│       │   │           │
│       │   │           ├── obligations/
│       │   │           │   ├── [orgId]/route.ts  # List all (GET) + batch ops
│       │   │           │   ├── [orgId]/[obligationId]/route.ts  # Status + evidence
│       │   │           │   └── [orgId]/[obligationId]/evidence/route.ts  # Presigned URL
│       │   │           │
│       │   │           ├── circulars/
│       │   │           │   ├── [orgId]/route.ts  # List circulars for org
│       │   │           │   ├── [orgId]/[circularId]/acknowledge/route.ts
│       │   │           │   └── [orgId]/[circularId]/dispute/route.ts
│       │   │           │
│       │   │           ├── calendar/
│       │   │           │   ├── [orgId]/route.ts  # List deadlines for org
│       │   │           │   └── [orgId]/[entryId]/submit/route.ts
│       │   │           │
│       │   │           ├── readiness/
│       │   │           │   ├── [orgId]/route.ts  # Current score + breakdown
│       │   │           │   └── [orgId]/report/route.ts  # Generate PDF
│       │   │           │
│       │   │           ├── admin/
│       │   │           │   ├── obligations/route.ts  # CRUD (admin role only)
│       │   │           │   └── circulars/route.ts
│       │   │           │
│       │   │           └── health/
│       │   │               └── route.ts  # Healthcheck for load balancer
│       │   │
│       │   ├── components/            # React components (organized by feature)
│       │   │   ├── ui/                # Base design system (headless, no logic)
│       │   │   │   ├── Button.tsx
│       │   │   │   ├── Badge.tsx
│       │   │   │   ├── Card.tsx
│       │   │   │   ├── Modal.tsx
│       │   │   │   ├── Tooltip.tsx
│       │   │   │   ├── Input.tsx
│       │   │   │   ├── Checkbox.tsx
│       │   │   │   ├── Select.tsx
│       │   │   │   ├── ScoreGauge.tsx  # Circular progress gauge
│       │   │   │   ├── Skeleton.tsx
│       │   │   │   └── Spinner.tsx
│       │   │   │
│       │   │   ├── marketing/         # Landing page sections
│       │   │   │   ├── Hero.tsx
│       │   │   │   ├── ProblemSection.tsx
│       │   │   │   ├── FeaturesSection.tsx
│       │   │   │   ├── SocialProof.tsx
│       │   │   │   ├── PricingCards.tsx
│       │   │   │   ├── DemoRequestCTA.tsx
│       │   │   │   └── Footer.tsx
│       │   │   │
│       │   │   ├── dashboard/         # Dashboard-specific components
│       │   │   │   ├── ReadinessScoreCard.tsx  # Score number + band + disclaimer
│       │   │   │   ├── ObligationMap.tsx        # Status breakdown per category
│       │   │   │   ├── DeadlineCalendar.tsx     # Upcoming reports (color-coded)
│       │   │   │   ├── CircularAlerts.tsx       # Recent circulars + impact tags
│       │   │   │   ├── ComplianceProgress.tsx   # Bar chart % complete by category
│       │   │   │   └── RiskFlags.tsx            # X items could attract sanction
│       │   │   │
│       │   │   ├── obligations/      # Obligation-specific components
│       │   │   │   ├── ObligationList.tsx       # List with filter + sort
│       │   │   │   ├── ObligationDetail.tsx     # Slide-over detail view
│       │   │   │   ├── EvidenceUpload.tsx       # Presigned URL uploader
│       │   │   │   ├── StatusBadge.tsx          # Met / Partial / Not Started / At Risk
│       │   │   │   └── ObligationHistoryLog.tsx # Audit trail for this obligation
│       │   │   │
│       │   │   ├── circulars/        # Circular-specific components
│       │   │   │   ├── CircularList.tsx
│       │   │   │   ├── CircularDetail.tsx
│       │   │   │   ├── DisputeModal.tsx         # File dispute + SLA countdown
│       │   │   │   └── ImpactAnalysis.tsx       # Show affected obligations
│       │   │   │
│       │   │   ├── calendar/         # Calendar-specific components
│       │   │   │   ├── CalendarView.tsx         # Month view + List view
│       │   │   │   ├── DeadlineEntry.tsx        # Single entry (color-coded)
│       │   │   │   └── SubmissionModal.tsx      # Mark submitted + evidence
│       │   │   │
│       │   │   ├── readiness/        # Score-specific components
│       │   │   │   ├── ScoreBreakdown.tsx       # 5 components + gaps
│       │   │   │   ├── ActionList.tsx           # Prioritized gaps to fix
│       │   │   │   └── PDFPreview.tsx           # Report preview before download
│       │   │   │
│       │   │   ├── layout/           # Shared layout components
│       │   │   │   ├── Navbar.tsx               # Top nav + profile menu
│       │   │   │   ├── Sidebar.tsx              # Left sidebar + navigation
│       │   │   │   └── AppShell.tsx             # Wraps authenticated routes
│       │   │   │
│       │   │   └── common/           # Shared across features
│       │   │       ├── ErrorBoundary.tsx
│       │   │       ├── LoadingState.tsx
│       │   │       └── EmptyState.tsx
│       │   │
│       │   ├── lib/                  # Business logic utilities (no UI)
│       │   │   ├── prisma.ts          # Prisma client singleton
│       │   │   ├── jwt.ts             # JWT sign/verify/decode
│       │   │   ├── hash.ts            # bcrypt password hashing
│       │   │   ├── otp.ts             # OTP generation + verification
│       │   │   ├── s3.ts              # S3 presigned URL generation + upload
│       │   │   ├── sendgrid.ts        # Email sending (templates)
│       │   │   ├── audit.ts           # Audit log writer (append-only)
│       │   │   ├── score.ts           # Readiness score engine (5 components)
│       │   │   ├── obligation-engine.ts # license + activities → obligations
│       │   │   ├── deadline.ts        # Parse deadline_logic JSON + compute next due
│       │   │   ├── evidence-validator.ts # File type + size validation
│       │   │   ├── paystack.ts        # Paystack API client
│       │   │   ├── analytics.ts       # PostHog event tracking
│       │   │   └── stripe-webhook.ts  # Webhook dispatcher (Phase 2)
│       │   │
│       │   ├── middleware/           # HTTP middleware
│       │   │   ├── withAuth.ts        # JWT verification + org_id extraction
│       │   │   ├── withRole.ts        # RBAC check (auth requirement)
│       │   │   ├── withPlan.ts        # Plan-tier feature gate (server-side)
│       │   │   └── rateLimiter.ts     # Rate limit per IP / email / org
│       │   │
│       │   ├── hooks/                # React custom hooks (client-side state)
│       │   │   ├── useAuth.ts         # Current user + logout
│       │   │   ├── useDashboard.ts    # Dashboard data query
│       │   │   ├── useScore.ts        # Score breakdown query
│       │   │   ├── useObligation.ts   # Single obligation detail query
│       │   │   ├── useCirculars.ts    # Circulars list query
│       │   │   ├── useCalendar.ts     # Calendar data query
│       │   │   └── useForm.ts         # Reusable form state mgmt (React Hook Form)
│       │   │
│       │   ├── stores/               # Zustand state management (UI state)
│       │   │   ├── authStore.ts       # Current user + token
│       │   │   ├── onboardingStore.ts # Multi-step form state
│       │   │   ├── uiStore.ts         # Sidebar open/close, modals, notifications
│       │   │   ├── filterStore.ts     # Obligation filters, sort order
│       │   │   └── notificationStore.ts # Toast messages
│       │   │
│       │   ├── types/                # TypeScript type definitions
│       │   │   ├── api.ts             # Request/response shapes
│       │   │   ├── obligation.ts      # Obligation + OblitationVersion + org_obligation
│       │   │   ├── circular.ts        # Circular + org_circular + circular_dispute
│       │   │   ├── score.ts           # ScoreComponent + ScoreBand + ReadinessScore
│       │   │   ├── user.ts            # User + UserRole + PlanTier
│       │   │   ├── calendar.ts        # ReportCalendarEntry
│       │   │   └── index.ts           # Re-export all types
│       │   │
│       │   ├── validators/           # Zod schemas for validation
│       │   │   ├── auth.ts            # Register, login, OTP mutation schemas
│       │   │   ├── obligation.ts      # Obligation status update schema
│       │   │   ├── circular.ts        # Dispute submission schema
│       │   │   └── onboarding.ts      # License profile schema
│       │   │
│       │   ├── constants/            # App constants
│       │   │   ├── obligations.ts     # Obligation categories, severity levels
│       │   │   ├── licenses.ts        # License types, activity flags
│       │   │   ├── score.ts           # Score component weights, bands
│       │   │   └── config.ts          # App URLs, external service endpoints
│       │   │
│       │   └── styles/               # Global styles
│       │       ├── globals.css        # Design tokens (CSS variables), base styles
│       │       ├── animations.css     # Keyframe animations
│       │       ├── utilities.css      # Custom utility classes
│       │       └── dark-mode.css      # Dark theme overrides
│       │
│       ├── prisma/
│       │   ├── schema.prisma          # Full data model (versioning, audit log, etc.)
│       │   ├── seed/
│       │   │   ├── obligations.ts     # Seed 60+ CBN obligations
│       │   │   ├── circulars.ts       # Seed 24 months of CBN circulars
│       │   │   └── index.ts           # Main seeding script
│       │   └── migrations/            # Auto-generated by prisma migrate
│       │       ├── migration_lock.toml
│       │       └── [timestamp]_init/
│       │           └── migration.sql
│       │
│       ├── tests/
│       │   ├── unit/                  # Component + utility function tests
│       │   │   ├── score.test.ts      # Score engine logic
│       │   │   ├── obligation-engine.test.ts
│       │   │   ├── deadline.test.ts
│       │   │   └── components/
│       │   │       └── ReadinessScoreCard.test.tsx
│       │   │
│       │   ├── integration/           # API + database tests
│       │   │   ├── auth.test.ts       # Register, verify OTP, login flow
│       │   │   ├── obligations.test.ts # Status update, evidence upload, score recalc
│       │   │   ├── circulars.test.ts  # Acknowledge, dispute, SLA tracking
│       │   │   ├── onboarding.test.ts # Full onboarding flow
│       │   │   └── score.test.ts      # Score calculation with real data
│       │   │
│       │   └── e2e/                   # Full user journey tests (Playwright)
│       │       ├── auth.spec.ts       # Register → OTP → Login → Dashboard
│       │       ├── onboarding.spec.ts # License selection → Activity flags → Complete
│       │       ├── dashboard.spec.ts  # Load dashboard, view obligations
│       │       ├── obligations.spec.ts # Mark complete → Evidence upload
│       │       └── circular.spec.ts   # View circular → Acknowledge → Dispute
│       │
│       ├── .env.example               # Safe template (commit this)
│       ├── .env.local                 # Local secrets (NEVER commit)
│       ├── .env.production            # Prod secrets (managed by Vercel env vars)
│       │
│       ├── next.config.js             # Next.js config + security headers
│       ├── tsconfig.json              # TypeScript config
│       ├── tailwind.config.ts         # Tailwind + design tokens
│       ├── postcss.config.js          # PostCSS (tailwind plugin)
│       ├── eslint.config.mjs          # ESLint + Next.js plugin
│       ├── prettier.config.js         # Prettier formatting rules
│       ├── jest.config.js             # Jest test runner config
│       ├── playwright.config.ts       # Playwright E2E config
│       │
│       ├── package.json
│       ├── package-lock.json
│       └── README.md
│
├── docs/                             # Documentation (in repo with code)
│   ├── PRD.md                        # Full PRD (Sections 1–11)
│   ├── PRD_APPENDIX_A.md             # Risk implementation specs (A1–A6)
│   ├── ARCHITECTURE.md               # This document (System design)
│   ├── DECISIONS.md                  # Architecture Decision Records
│   ├── API.md                        # API endpoint reference
│   ├── DATABASE.md                   # Schema deep dive + migration strategy
│   ├── SECURITY.md                   # Security model + checklist
│   ├── DEPLOYMENT.md                 # Vercel + production checklist
│   ├── TESTING.md                    # Testing strategy + coverage goals
│   ├── ONBOARDING.md                 # Contributor onboarding guide
│   └── CHANGELOG.md                  # Version history
│
├── .gitignore                        # Ignore node_modules, .env, .next/
├── .prettierignore
├── .prettierrc                       # Prettier config (2-space indent)
├── .eslintignore
├── .eslintrc.json                    # ESLint config (strict rules)
├── .editorconfig                     # Editor conventions (spaces, line endings)
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint + type-check + test on every PR
│       └── deploy.yml                # Deploy to Vercel on merge to main
│
├── README.md                         # Project overview
├── CONTRIBUTING.md                   # Contributor guidelines
└── LICENSE                           # License (MIT or proprietary)
```

### 4.2 Directory Rationale

**Why This Structure?**

1. **Single Next.js App** — All code (frontend + API) in one codebase ✅
   - Simpler deployment
   - Shared types (TypeScript)
   - API routes can use utility functions directly (no RPC/gRPC overhead)

2. **Feature-Based Organization** — Routes + components grouped by feature ✅
   - `/obligations` folder contains all obligation logic (route + components + hooks)
   - `/circulars` folder contains all circular logic
   - Makes it easy to find & modify a feature
   - Team members can own a feature end-to-end

3. **Shared Utilities** — `/lib`, `/middleware`, `/hooks`, `/stores` ✅
   - Business logic decoupled from UI
   - Easy to refactor without breaking components
   - Testable in isolation

4. **Type Safety** — `/types` + `/validators` centralized ✅
   - Single source of truth for API contracts
   - Zod schemas catch data errors before DB
   - TypeScript interfaces auto-generated from Prisma schema

5. **Documentation in Repo** — `/docs` alongside code ✅
   - PRD lives here (not in a separate Confluence/Notion)
   - Easy to reference while coding
   - ADRs can be git-blamed (who made this decision & when?)

---

## STEP 5: MODULAR FILE ORGANIZATION

### 5.1 API Route Architecture Pattern

Every API route follows this exact pattern:

```typescript
// apps/web/src/app/api/v1/obligations/[orgId]/[obligationId]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middleware/withAuth'
import { withRole } from '@/middleware/withRole'
import { withPlan } from '@/middleware/withPlan'
import { writeAuditLog } from '@/lib/audit'
import { updateObligationSchema } from '@/validators/obligation'
import { prisma } from '@/lib/prisma'

// GET /api/v1/obligations/[orgId]/[obligationId]
// Retrieve obligation detail + PSP's completion status
export const GET = withAuth(async (req, context) => {
  const { orgId, obligationId } = getRouteParams(req)
  
  // SECURITY: org_id from JWT context, not URL
  if (context.orgId !== orgId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  })
  
  if (!org) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  
  const obligation = await prisma.obligation.findUnique({
    where: { id: obligationId },
  })
  
  const orgObligation = await prisma.orgObligation.findUnique({
    where: {
      orgId_obligationId: {
        orgId,
        obligationId,
      },
    },
    include: {
      obligationVersion: true,
    },
  })
  
  return NextResponse.json({
    data: {
      obligation,
      orgObligation,
    },
  })
})

// PATCH /api/v1/obligations/[orgId]/[obligationId]
// Update obligation status + upload evidence
export const PATCH = withAuth(
  async (req, context) => {
    const { orgId, obligationId } = getRouteParams(req)
    
    if (context.orgId !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await req.json()
    
    // Validate input with Zod
    const parsed = updateObligationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }
    
    // Database transaction: update status + create audit log
    const result = await prisma.$transaction(async (tx) => {
      const oldObligation = await tx.orgObligation.findUnique({
        where: { id: body.orgObligationId },
      })
      
      const updated = await tx.orgObligation.update({
        where: { id: body.orgObligationId },
        data: {
          status: parsed.data.status,
          completedAt: parsed.data.status === 'Met' ? new Date() : null,
          completedBy: context.userId,
        },
      })
      
      // Audit log writer (PRD A6 Rule 6: append-only)
      await writeAuditLog({
        orgId,
        userId: context.userId,
        actionType: 'OBLIGATION_STATUS_UPDATED',
        entityType: 'org_obligation',
        entityId: updated.id,
        metadata: {
          obligationId,
          previousStatus: oldObligation?.status,
          newStatus: updated.status,
        },
      })
      
      return updated
    })
    
    // Trigger score recalculation
    await recalculateReadinessScore(orgId)
    
    return NextResponse.json({ data: result })
  },
  // Require Starter plan or above (feature gate — PRD A4 Rule 1)
  { requiredPlan: 'starter' }
)
```

### 5.2 React Component Architecture Pattern

Every component follows this pattern:

```typescript
// apps/web/src/components/obligations/ObligationDetail.tsx

import { FC, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EvidenceUpload } from './EvidenceUpload'
import { ObligationHistoryLog } from './ObligationHistoryLog'
import type { OrgObligation } from '@/types/obligation'

interface ObligationDetailProps {
  obligationId: string
  onClose: () => void
}

export const ObligationDetail: FC<ObligationDetailProps> = ({
  obligationId,
  onClose,
}) => {
  const { orgId } = useAuth()
  const [showEvidenceUpload, setShowEvidenceUpload] = useState(false)
  
  // 1. Query obligation detail
  const { data: obligation, isLoading } = useQuery({
    queryKey: ['obligation', obligationId],
    queryFn: async () => {
      const res = await fetch(
        `/api/v1/obligations/${orgId}/${obligationId}`
      )
      return res.json()
    },
  })
  
  // 2. Mutation: Update status
  const updateStatusMutation = useMutation({
    mutationFn: async (status: OrgObligation['status']) => {
      const res = await fetch(
        `/api/v1/obligations/${orgId}/${obligationId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }
      )
      return res.json()
    },
    onSuccess: () => {
      // Invalidate cache + refetch
      queryClient.invalidateQueries({ queryKey: ['obligation', obligationId] })
      queryClient.invalidateQueries({ queryKey: ['readiness', orgId] })
    },
  })
  
  if (isLoading) return <Skeleton />
  
  return (
    <Card className="slide-over">
      <div className="header">
        <h2>{obligation.title}</h2>
        <Badge variant={obligation.severity}>{obligation.severity}</Badge>
      </div>
      
      <div className="body">
        {/* Legal reference */}
        <section>
          <label>Legal Source</label>
          <p className="text-secondary">{obligation.legalSource}</p>
        </section>
        
        {/* Description */}
        <section>
          <label>What's Required</label>
          <p className="text-body">{obligation.description}</p>
        </section>
        
        {/* Evidence upload */}
        <section>
          <label>Upload Evidence</label>
          {showEvidenceUpload ? (
            <EvidenceUpload obligationId={obligationId} />
          ) : (
            <Button
              variant="secondary"
              onClick={() => setShowEvidenceUpload(true)}
            >
              Upload File
            </Button>
          )}
        </section>
        
        {/* Status buttons */}
        <section className="actions">
          <Button
            variant="primary"
            onClick={() => updateStatusMutation.mutate('Met')}
            disabled={updateStatusMutation.isPending}
          >
            Mark as Met
          </Button>
          <Button
            variant="secondary"
            onClick={() => updateStatusMutation.mutate('Flag for Review')}
            disabled={updateStatusMutation.isPending}
          >
            Flag for Review
          </Button>
        </section>
        
        {/* Audit trail */}
        <ObligationHistoryLog obligationId={obligationId} />
      </div>
    </Card>
  )
}
```

### 5.3 Library Organization (`/lib`)

```typescript
// apps/web/src/lib/score.ts
// READINESS SCORE ENGINE (Pure function, no side effects)

import { prisma } from './prisma'

type ScoreComponent = 'obligationCoverage' | 'reportSubmission' | 
                     'circularAcknowledgment' | 'evidenceCompleteness' | 
                     'licenseCurrency'

type ComponentWeights = Record<ScoreComponent, number>

const WEIGHTS: ComponentWeights = {
  obligationCoverage: 0.35,
  reportSubmission: 0.30,
  circularAcknowledgment: 0.15,
  evidenceCompleteness: 0.10,
  licenseCurrency: 0.10,
}

type ScoreBand = 'investor_ready' | 'audit_ready' | 'work_required' | 'at_risk'

interface ComponentScores {
  obligationCoverage: number // 0–1
  reportSubmission: number
  circularAcknowledgment: number
  evidenceCompleteness: number
  licenseCurrency: number
}

interface ReadinessScore {
  totalScore: number // 0–100
  band: ScoreBand
  components: ComponentScores
  computedAt: Date
}

/**
 * Calculate readiness score for a single org
 * PRD Section 4.6 + Appendix A6
 */
export async function calculateReadinessScore(orgId: string): Promise<ReadinessScore> {
  // COMPONENT 1: Obligation Coverage (35%)
  const obligations = await prisma.orgObligation.findMany({
    where: { orgId },
  })
  
  const metObligations = obligations.filter(o => 
    o.status === 'Met' || o.status === 'Partial'
  )
  
  const obligationCoverage = obligations.length > 0
    ? metObligations.length / obligations.length
    : 0
  
  // COMPONENT 2: Report Submission Rate (30%)
  const reportEntries = await prisma.reportCalendar.findMany({
    where: { orgId },
    include: { obligation: true },
  })
  
  const last12MonthsEnd = new Date()
  last12MonthsEnd.setMonth(last12MonthsEnd.getMonth() - 12)
  
  const submittedReports = reportEntries.filter(e =>
    e.submittedAt &&
    new Date(e.submittedAt) >= last12MonthsEnd
  ).length
  
  const dueReports = reportEntries.filter(e =>
    new Date(e.dueDate) >= last12MonthsEnd
  ).length
  
  const reportSubmission = dueReports > 0
    ? submittedReports / dueReports
    : 1 // No reports due = 100%
  
  // COMPONENT 3: Circular Acknowledgment (15%)
  const circulars = await prisma.orgCircular.findMany({
    where: { orgId },
  })
  
  const applicableCirculars = circulars.filter(c => c.relevanceTag === 'applies_to_you')
  
  const acknowledgedCirculars = applicableCirculars.filter(c => c.acknowledgedAt).length
  
  const circularAcknowledgment = applicableCirculars.length > 0
    ? acknowledgedCirculars / applicableCirculars.length
    : 1
  
  // COMPONENT 4: Evidence Completeness (10%)
  const obligationsWithEvidence = obligations.filter(o =>
    o.evidenceUrls && o.evidenceUrls.length > 0
  ).length
  
  const evidenceCompleteness = obligations.length > 0
    ? obligationsWithEvidence / obligations.length
    : 0
  
  // COMPONENT 5: License Currency (10%)
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  })
  
  const licenseCurrency = org?.licenseRenewalDate && new Date(org.licenseRenewalDate) > new Date() ? 1 : 0
  
  // WEIGHTED TOTAL (0–100)
  const components: ComponentScores = {
    obligationCoverage,
    reportSubmission,
    circularAcknowledgment,
    evidenceCompleteness,
    licenseCurrency,
  }
  
  const totalScore = Math.round((
    obligationCoverage * WEIGHTS.obligationCoverage +
    reportSubmission * WEIGHTS.reportSubmission +
    circularAcknowledgment * WEIGHTS.circularAcknowledgment +
    evidenceCompleteness * WEIGHTS.evidenceCompleteness +
    licenseCurrency * WEIGHTS.licenseCurrency
  ) * 100)
  
  // SCORE BANDS (PRD 4.6.2)
  const band: ScoreBand =
    totalScore >= 85 ? 'investor_ready' :
    totalScore >= 70 ? 'audit_ready' :
    totalScore >= 50 ? 'work_required' :
    'at_risk'
  
  return {
    totalScore,
    band,
    components,
    computedAt: new Date(),
  }
}
```

### 5.4 Type Safety (`/types`)

```typescript
// apps/web/src/types/obligation.ts

export type ObligationStatus = 
  | 'Met'
  | 'Partial'
  | 'Not Started'
  | 'At Risk'
  | 'Waived'

export type ObligationCategory =
  | 'KYC'
  | 'AML'
  | 'Reporting'
  | 'Governance'
  | 'Technology'
  | 'Consumer Protection'
  | 'Capital'

export type ObligationFrequency =
  | 'One-time'
  | 'Monthly'
  | 'Quarterly'
  | 'Annual'
  | 'Event-triggered'

export type ObligationSeverity =
  | 'Critical'
  | 'High'
  | 'Medium'
  | 'Low'

export interface Obligation {
  id: string
  title: string
  description: string
  legalSource: string
  category: ObligationCategory
  licenseTypes: string[]
  activityFlags: string[]
  frequency: ObligationFrequency
  deadlineLogic: DeadlineLogic
  severity: ObligationSeverity
  evidenceRequired: EvidenceRequirement[]
  lastUpdated: Date
}

export interface DeadlineLogic {
  frequency: ObligationFrequency
  anchor: 'month_end' | 'quarter_end' | 'license_anniversary' | 'fiscal_year_end'
  offsetDays: number
  offsetDirection: 'before' | 'after'
  businessDaysOnly: boolean
}

export interface EvidenceRequirement {
  docType: string
  description: string
  mandatory: boolean
  acceptedFormats: string[]
  maxAgeMonths: number
}

export interface OrgObligation {
  id: string
  orgId: string
  obligationId: string
  obligationVersionId: string
  status: ObligationStatus
  evidenceUrls: string[]
  completedAt?: Date
  completedBy?: string
  auditLog: AuditLogEntry[]
}

export interface AuditLogEntry {
  timestamp: Date
  userId: string
  action: string
  previousValue?: string
  newValue?: string
}
```

### 5.5 Validation (`/validators`)

```typescript
// apps/web/src/validators/obligation.ts

import { z } from 'zod'

export const updateObligationSchema = z.object({
  orgObligationId: z.string().uuid('Invalid org obligation ID'),
  status: z.enum([
    'Met',
    'Partial',
    'Not Started',
    'At Risk',
    'Waived',
  ]),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  evidenceUrls: z.array(z.string().url('Invalid file URL')).optional(),
})

export type UpdateObligationInput = z.infer<typeof updateObligationSchema>
```

---

## DATABASE DESIGN

See [DATABASE.md](DATABASE.md) for full schema with relationships, indexes, and versioning strategy.

---

## API ARCHITECTURE

See [API.md](API.md) for full REST endpoint documentation with request/response examples.

---

## SECURITY MODEL

See [SECURITY.md](SECURITY.md) for full security architecture including encryption, RBAC, rate limiting, and audit logging.

---

## SCALABILITY & NON-FUNCTIONAL REQUIREMENTS

### 10.1 Performance Targets (PRD Section 7)

| Metric | Target | Implementation |
|--------|--------|-----------------|
| Dashboard Load | <2s on 4G | React Query + HTTP/2 Server Push; CloudFront CDN; CSS-in-utility (no JS parsing) |
| API P95 Response | <500ms | Prisma query optimization; DB indexes on org_id, status, deadline; read replicas Phase 2 |
| File Upload | <5s for 10MB | S3 presigned URLs (direct browser upload); no app server intermediate; multipart upload |

### 10.2 Availability Targets

| Metric | Target | Implementation |
|--------|--------|-----------------|
| Uptime SLA | 99.5% | Vercel managed infrastructure; auto-scaling; Sentry alerts on errors |
| Maintenance Window | 2–4 AM WAT | Scheduled during off-peak user hours |
| MTTR (Mean Time To Recovery) | <15 min | Database backups every 6h; Sentry alerts; automated rollback on failed deploy |

### 10.3 Scalability (Phase 1)

**Phase 1 Target:** 500 concurrent users (PRD NFR)

**Architecture supports:**
- Next.js auto-scaling on Vercel (from 1 to 100+ serverless functions)
- PostgreSQL read replicas (Phase 2, if needed)
- Redis for session cache (prevents DB queries on every auth check)

**Bottleneck Analysis:**
- **Auth bottleneck:** OTP generation + email — solved by Sendgrid (async)
- **Dashboard bottleneck:** Aggregate query (6 widgets) — solved by query optimization + caching
- **S3 bottleneck:** File upload — None (direct presigned URL to S3, not through app)
- **Score calculation:** Runs on PATCH (obligation status update) — completes in <100ms for 100 obligations

### 10.4 Data Residency & Compliance (PRD A2.1 + A5)

- **Database:** AWS af-south-1 (Cape Town) or eu-west-1 (Ireland)
- **S3 buckets:** Same region as database
- **Backups:** Regional replication
- **NDPR:** Data deletion within 30 days, export within 48 hours
- **SOC 2:** Roadmap disclosed during onboarding; target Phase 2

---

## NEXT STEPS

This document provides the **system architecture**, **tech stack justification**, **repository structure**, and **modular organization** for Vytaniq Phase 1.

**Next phase:** Implement the repository scaffold using the `create_new_workspace` tool and generate:
1. Full Prisma schema (`schema.prisma`)
2. Initial API routes scaffolding
3. React component templates
4. Seeding scripts for obligations + circulars

---

**Document Approval:**
- [ ] Product Manager
- [ ] Lead Engineer
- [ ] Legal/Compliance Advisor
- [ ] CTO

**Last Updated:** March 8, 2026  
**Version:** 1.0 (Ready for Implementation)
