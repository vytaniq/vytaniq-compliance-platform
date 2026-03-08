VYTANIQ — Senior Fullstack Engineer Build Guide Version: 1.0 | Stack: Next.js 14 · TypeScript · PostgreSQL · AWS · Prisma
Scope: Phase 1 MVP only — strictly PRD-compliant
TABLE OF CONTENTS
1. GitHub Repository Setup
2. Folder Structure
3. PRD as Markdown in the Repo
4. Design System & Visual Identity
5. Landing Page — SEO + Conversion Design
6. Environment & Security Config
7. Database Schema & Migrations
8. Authentication System
9. Backend API Architecture
10. Frontend Architecture
11. Module-by-Module Build Order
12. Security Hardening Checklist
13. Cursor Prompting Strategy
14. Pre-Launch Checklist
1. GITHUB REPOSITORY SETUP Step 1.1 — Create the Repo
1. Go to github.com → New Repository
2. Name:
3. Visibility: Private (compliance data — never public)
4. Initialize with: README , .gitignore: Node
5. Default branch: main
Step 1.2 — Branch Strategy (Git Flow)
main staging develop
→ production only. Protected. Requires PR + review.
→ pre-production testing. Deploy to staging environment. → active integration branch. All features merge here first.
                 vytaniq-platform
✓✓
   
  → individual feature branches (e.g. feature/auth-system) → bug fixes
→ infra, deps, config changes
Branch protection rules on   and   :
Require pull request before merging Require at least 1 approving review Require status checks to pass (CI) Block force pushes
Step 1.3 — Clone and Bootstrap
bash
git clone https://github.com/YOUR_ORG/vytaniq-platform.git cd vytaniq-platform
# Create all major branches upfront
git checkout -b develop git push -u origin develop
git checkout -b staging git push -u origin staging
git checkout develop
Step 1.4 — Commit Convention
Follow Conventional Commits — this feeds your changelog and makes PRs readable:
feat(auth): add OTP verification flow
fix(dashboard): correct score calculation for partial obligations chore(deps): upgrade prisma to 5.x
security(s3): enforce presigned URL 15-minute expiry docs(prd): add Phase 1 obligation registry content
Step 1.5 — GitHub Actions CI (create )
yaml
feature/* fix/* chore/*
 main
staging
   .github/workflows/ci.yml
   
  name: CI
on: push:
branches: [develop, staging, main] pull_request:
branches: [develop, staging, main]
jobs: lint-and-test:
runs-on: ubuntu-latest steps:
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
with:
node-version: '20'
cache: 'npm'
cache-dependency-path: apps/web/package-lock.json
- run: cd apps/web && npm ci
- run: cd apps/web && npm run lint
- run: cd apps/web && npm run type-check - run: cd apps/web && npm run test
2. FOLDER STRUCTURE
Vytaniq uses a monorepo structure. The frontend (Next.js) contains both the public-facing site AND the app. The API lives inside Next.js API routes — this is sufficient for Phase 1 scale (500 concurrent users per PRD NFR).
  
   vytaniq-platform/
│
├── .github/
│ └── workflows/
│ ├── ci.yml
│ └── deploy.yml │
├── apps/
│ └── web/
│ ├── public/
# Lint, type-check, test on every PR
# Deploy to Vercel on merge to main
# Next.js 14 App Router (frontend + API)
# Self-hosted fonts (performance + privacy)
# Open Graph images for SEO
│ │
│ │
│ │ ││
│ ├── src/
├── fonts/ ├── images/ └── og/
│ │
│ │
│ │
│ │
│ │
│ │
│ │││
│ │ │ ├── (auth)/ # Route group — login, register, verify
├── app/
│ ├── (marketing)/ # Route group — public pages, no auth
│ │ │ │ │ │ │ │
├── page.tsx # Landing page /
├── pricing/
├── about/
└── methodology/ # Required by PRD A5.2
│ │ │ │
│ │ │ │
│ │ │ │
│ │ │ │
│ │ │ │
│ │ │ │
│ │ │ │
│ │ │ │
│ │││
│ │ │ ├── (admin)/
├── layout.tsx ├── onboarding/ ├── dashboard/ ├── obligations/ ├── circulars/ ├── calendar/ ├── readiness/ └── settings/
# Next.js App Router pages
│ │ │ │
│ │ │ │
│ │ │ │
│ │││
│ │ │ ├── (app)/ # Route group — authenticated app
# Auth guard wrapper
├── register/ ├── login/ └── verify-otp/
# Route group — Vytaniq internal team only # Admin role guard
│ │ │ │
│ │ │ │
│ │ │ │
│ │ │ │
│ │ │ │
│ │││
│ │ │ └── api/ # All API routes live here
│ │ │ └── v1/ # VERSIONED from day one (PRD A6 Rule 5)
├── layout.tsx ├── obligations/ ├── circulars/ ├── disputes/ └── orgs/

  │ ││
│ │ │
│ │ │
│ │ │
│ │ │
│ │ │
│ │ │
│ │ │
│ │ │
│ │ │
│ │ │
│ │ │ │││
├──auth/
│ ├── register/route.ts │ ├── verify-otp/route.ts │ ├── login/route.ts
│ └── refresh/route.ts ├── onboarding/
├── dashboard/
├── obligations/
├── circulars/
├── calendar/
├── readiness/
└── admin/
│ │
│ │
│ │
│ │
│ │
│ │
│ │
│ │
│ │││
│ │ │ ├── marketing/ # Landing page sections
│ │ │ │
│ │ │ │
│ │ │ │
│ │ │ │
│ │ │ │
│ │││
├── ReadinessScoreCard.tsx ├── ObligationMap.tsx ├── DeadlineCalendar.tsx ├── CircularAlerts.tsx └── RiskFlags.tsx
│ │ │
│ │ │
│ │ │
│ │ │
│ │ │
│ │ │
│ │ │ │││
├── onboarding/ ├── obligations/ ├── circulars/ └── layout/
├── Navbar.tsx ├── Sidebar.tsx └── AppShell.tsx
│ │
│ │
│ │
├── lib/
│ ├── prisma.ts │ ├── jwt.ts
# Core utilities and service clients # Prisma client singleton
# JWT sign/verify helpers
├── components/
│ ├── ui/ # Base design system components
│ │ │ │ │ │ │ │ │ │ │ │
├── Button.tsx ├── Badge.tsx ├── Card.tsx ├── Modal.tsx ├── Tooltip.tsx └── ScoreGauge.tsx
├── Hero.tsx
├── ProblemSection.tsx ├── FeaturesSection.tsx ├── PricingSection.tsx └── DemoRequestCTA.tsx
│ │ │ │
│ │ │ │
│ │ │ │
│ │ │ │
│ │ │ │
│ │││
│ │ │ ├── dashboard/ # App-specific components

  │ │ │
│ │ │
│ │ │
│ │ │
│ │ │
│ │ │ │││
│ │ ├── middleware/
│ │ │
│ │ │
│ │ │ │││
│ │ ├── hooks/
├── s3.ts
├── sendgrid.ts
├── audit.ts
├── score.ts
├── obligation-engine.ts # Maps license+activities → obligations
└── deadline.ts ├── withAuth.ts
# deadline_logic JSON parser
# JWT verification middleware # RBAC role checker
# Plan tier feature gate (server-side) # React custom hooks
├── withRole.ts └── withPlan.ts
# S3 client + presigned URL helpers # Email service
# Audit log writer (append-only) # Readiness score engine
│ │ │
│ │ │
│ │ │ │││
│ │ ├── stores/ # Zustand state (UI state only — no secrets)
│ │ │ ├── authStore.ts
│ │ │ └── onboardingStore.ts │││
│ │ ├── types/ # TypeScript type definitions
│ │ │
│ │ │
│ │ │
│ │ │ │││
├── api.ts ├── obligation.ts ├── circular.ts └── score.ts
│ │
│ │
│ │ ││
│ ├── prisma/
│ │
│ │
│ │
│ │
│ │
│ │ ││
│ ├── tests/
# CSS variables, design tokens, fonts # Keyframe animations
# Database schema
# Auto-generated migration files
# Seed 60+ obligations
# Seed 24 months CBN circulars
├── useAuth.ts ├── useDashboard.ts └── useReadiness.ts
└── styles/
├── globals.css └── animations.css
├── schema.prisma ├── migrations/ └── seed/
├── obligations.ts ├── circulars.ts └── index.ts
│ │
│ │
│ │ ││
│ ├── .env.local
│ ├── .env.example
│ ├── next.config.js
├── unit/ ├── integration/ └── e2e/
# Local dev secrets (NEVER commit) # Safe template (commit this)

  │ ├── tailwind.config.ts
│ ├── tsconfig.json
│ └── package.json │
├── docs/
│ ├── PRD.md
│ ├── PRD_APPENDIX_A.md # Appendix A risk specs
│ ├── ARCHITECTURE.md
│ ├── API.md
│ └── SECURITY.md │
├── .gitignore ├── .prettierrc ├── .eslintrc.json └── README.md
# System design decisions # API endpoint documentation
# Security policies and practices
# Full PRD as markdown (see Section 3)
  3. PRD AS MARKDOWN IN THE REPO
Yes — absolutely put the PRD in the repo. This is what senior engineers do. It makes the PRD the source of
truth that lives alongside the code. How to Structure It
docs/
├── PRD.md # Main PRD (Sections 1–11)
├── PRD_APPENDIX_A.md # Risk implementation specs (A1–A6) └── DECISIONS.md # Architecture Decision Records (ADRs)
Cursor Prompt for This:
"Always reference docs/PRD.md and docs/PRD_APPENDIX_A.md as the source of truth. If I ask you to build a feature, read the relevant PRD section first before writing any code. Never add features, fields, or API routes not in these documents."
DECISIONS.md Format (Architecture Decision Records)
Create   and add an entry for every major technical decision: markdown
  docs/DECISIONS.md
   
  # ADR-001: Monorepo with Next.js API Routes (vs. Separate Express API)
**Date:** YYYY-MM-DD
**Status:** Accepted
**Context:** Phase 1 requires 500 concurrent users max. Separate Express service adds ops overhead. **Decision:** Use Next.js API routes for Phase 1. Migrate to standalone NestJS API at Phase 2 if needed. **Consequences:** Simpler deployment. All API routes must be prefixed /api/v1/ for future separation.
4. DESIGN SYSTEM & VISUAL IDENTITY
Color Palette — "Regulatory Authority + Startup Energy"
The aesthetic is dark regulatory intelligence — think Bloomberg Terminal meets a fintech startup. Deep, trustworthy darks with electric accent pops. This signals: serious compliance tool, not a toy.
css
     
  /* src/styles/globals.css — CSS Design Tokens */
:root {
/* Brand Colors */
--color-midnight: #0A0E1A; /* Primary background — deep navy-black */ --color-surface: #111827; /* Card backgrounds */
--color-surface-raised: #1C2333; /* Elevated surfaces */
--color-border: #1E293B; /* Subtle borders */
--color-border-bright: #2D3A52; /* Active/hover borders */
/* Accent — Electric Teal (compliance = clarity) */ --color-accent: #00D4B8; /* Primary CTA, active states */ --color-accent-dim: #00A896; /* Hover states */ --color-accent-glow: rgba(0, 212, 184, 0.15); /* Glow effects */
/* Score Colors (matching PRD score bands) */ --color-score-investor: #10B981; /* 85–100 Investor Ready */
--color-score-audit: #3B82F6; --color-score-work: #F59E0B; --color-score-risk: #EF4444;
/* Deadline Urgency Colors */
--color-urgent: #EF4444; --color-warning: #F59E0B; --color-safe: #10B981;
/* Typography */
/* 70–84 Audit Ready */
/* 50–69 Work Required */
/* Below 50 At Risk */
/* 7 days */
/* 30 days */
/* 90+ days */
--color-text-primary: #F1F5F9; --color-text-secondary: #94A3B8; --color-text-muted: #475569;
/* Typography Scale */
--font-display: 'Syne', sans-serif;
--font-body: 'DM Sans', sans-serif; /* Body — clean, readable */ --font-mono: 'JetBrains Mono', monospace; /* Code, scores, numbers */
/* Spacing */
--radius-sm: 6px; --radius-md: 12px; --radius-lg: 20px;
/* Shadows */
--shadow-card: 0 4px 24px rgba(0, 0, 0, 0.4);
--shadow-glow: 0 0 40px rgba(0, 212, 184, 0.1); }
/* Headers — geometric, authoritative */
 
Typography
Install from Google Fonts in   or use   : tsx
// src/app/layout.tsx
import { Syne, DM_Sans } from 'next/font/google'
const syne = Syne({
subsets: ['latin'],
variable: '--font-display',
weight: ['400', '600', '700', '800'],
})
const dmSans = DM_Sans({ subsets: ['latin'],
variable: '--font-body',
weight: ['300', '400', '500', '600'],
})
Animation System
css
next.config.js
next/font
 Syne — Display font: angular, modern, authority. Used for H1–H3, score numbers, badge labels. DM Sans — Body: warm but professional. Used for all paragraph text, form labels, descriptions. JetBrains Mono — For scores, CBN reference codes, API keys, dates.
   
  /* src/styles/animations.css */
/* Page entrance — staggered fade up */
@keyframes fadeUp {
from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); }
}
/* Score gauge fill */
@keyframes gaugeArc {
from { stroke-dashoffset: 440; }
to { stroke-dashoffset: var(--gauge-offset); }
}
/* Ambient glow pulse (used on score card) */
@keyframes glowPulse {
0%, 100% { box-shadow: 0 0 40px rgba(0, 212, 184, 0.1); } 50% { box-shadow: 0 0 80px rgba(0, 212, 184, 0.25); }
}
/* Circular alert slide in from right */
@keyframes slideInRight {
from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); }
}
/* Skeleton shimmer */
@keyframes shimmer {
from { background-position: -200% 0; } to { background-position: 200% 0; }
}
/* Stagger utility classes */
.animate-fade-up {
animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; opacity: 0;
}
.delay-100 { animation-delay: 100ms; } .delay-200 { animation-delay: 200ms; } .delay-300 { animation-delay: 300ms; } .delay-400 { animation-delay: 400ms; }
/* Score ring animation trigger */
.score-ring { animation: gaugeArc 1.4s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

  /* Glow card */
.glow-card { animation: glowPulse 3s ease-in-out infinite; }
5. LANDING PAGE — SEO + CONVERSION DESIGN SEO Foundations (add to   )
tsx
// app/(marketing)/page.tsx
export const metadata = {
title: 'Vytaniq — CBN Compliance Intelligence for Nigerian PSPs',
description: 'Track CBN obligations, monitor circulars, and know your compliance readiness score. Built exclusively for Nig keywords: ['CBN compliance', 'Nigerian PSP compliance', 'fintech compliance Nigeria', 'CBN circular tracker', 'payment serv openGraph: {
title: 'Vytaniq — Compliance Intelligence for Nigerian PSPs',
description: 'Stop operating blind. Know exactly what CBN requires, when, and how ready you are.', url: 'https://vytaniq.com',
siteName: 'Vytaniq',
images: [{ url: '/og/vytaniq-og.png', width: 1200, height: 630 }],
type: 'website',
}, twitter: {
card: 'summary_large_image',
title: 'Vytaniq — CBN Compliance Intelligence',
description: 'Built for Nigerian PSPs. Track obligations, circulars, and readiness score.', images: ['/og/vytaniq-og.png'],
},
robots: { index: true, follow: true }, alternates: { canonical: 'https://vytaniq.com' },
}
Landing Page Architecture — Sections That Convert
Structure the page to answer 5 questions a founder asks on first visit:
  app/(marketing)/page.tsx
 
 1. HERO → "What is this? Is it for me?"
Headline + sub + animated compliance score preview + CTA
2. PROBLEM → "Do they understand my pain?"
The 5 pain points from PRD 1.2 — founder, compliance officer, investor
3. FEATURES → "What does it actually do?"
6 module cards with animated previews
4. SOCIAL PROOF → "Who else uses this?"
(Placeholder for beta — 'Built with 5 Nigerian PSPs during beta')
5. PRICING → "Can I afford it?"
3-tier pricing with freemium entry point
6. DEMO CTA → "How do I try it?"
Full-width demo request section — this is the conversion moment
Hero Component — Cursor Prompt
"Build a Hero section for Vytaniq's landing page with this exact structure: Full-screen dark background (
). Left side: H1 headline 'Know Exactly Where You Stand With CBN' in Syne font, 64px, white. Subheadline in DM Sans: 'Compliance intelligence built for Nigerian PSPs — obligation tracking, circular alerts, and a readiness score investors can read in seconds.' Two CTAs: primary button 'Request Demo' (electric teal #00D4B8 , dark text), secondary ghost button 'See How It Works'. Right side: animated compliance score card mockup — circular gauge animating from 0 to 78, surrounded by floating metric badges ('14 Obligations Met', '3 Circulars Pending', 'Investor Ready'). Background: subtle grid pattern with teal glow radiating from center. Entrance: staggered fade-up animations with 100ms delays between elements."
Demo Request CTA — The Most Important Section
This is your primary conversion mechanism. Build it as: tsx
// components/marketing/DemoRequestCTA.tsx
// Full-width section with:
// - Bold headline: "See Vytaniq In 20 Minutes"
// - Sub: "We'll walk you through your license type's full obligation map, live." // - Form: Company name, Email, License Type (dropdown), Team Size
// - Submit → Sends email via Sendgrid to your team + confirmation to prospect // - After submit: animated success state with "We'll be in touch within 24 hours"
  #0A0E1A
   
6. ENVIRONMENT & SECURITY CONFIG
 .env.example
(commit this — it's a safe template)
   bash

  # Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/vytaniq_db?sslmode=require"
# Auth
JWT_SECRET="CHANGE_ME_64_CHAR_RANDOM_STRING" JWT_REFRESH_SECRET="CHANGE_ME_DIFFERENT_64_CHAR_RANDOM_STRING" JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="7d"
OTP_EXPIRES_MINUTES="10"
# Email
SENDGRID_API_KEY="SG.XXXXXXXX" SENDGRID_FROM_EMAIL="noreply@vytaniq.com" SENDGRID_FROM_NAME="Vytaniq"
# AWS
AWS_ACCESS_KEY_ID="XXXXXXXX"
AWS_SECRET_ACCESS_KEY="XXXXXXXX"
AWS_REGION="af-south-1"
AWS_S3_BUCKET="vytaniq-evidence-prod" AWS_S3_PRESIGNED_URL_EXPIRY_SECONDS="900" # 15 minutes MAX per PRD A2.1
# SMS (Critical deadlines only)
TERMII_API_KEY="XXXXXXXX"
# Payments
PAYSTACK_SECRET_KEY="sk_live_XXXXXXXX" PAYSTACK_PUBLIC_KEY="pk_live_XXXXXXXX"
# Monitoring
NEXT_PUBLIC_POSTHOG_KEY="phc_XXXXXXXX" NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com" SENTRY_DSN="https://XXXXXXXX@sentry.io/XXXXXXXX" SENTRY_AUTH_TOKEN="XXXXXXXX"
# App
NEXT_PUBLIC_APP_URL="https://app.vytaniq.com" NEXT_PUBLIC_MARKETING_URL="https://vytaniq.com" NODE_ENV="development"
# Internal Admin
ADMIN_SECRET_KEY="CHANGE_ME_INTERNAL_ADMIN_KEY"
 
 .gitignore
(critical entries)
 .env
.env.local .env.production .env.staging *.pem
*.key .DS_Store node_modules/ .next/
dist/
Security Rules Enforced in Code
typescript
   
  // src/middleware/withAuth.ts
// RULE: org_id ALWAYS comes from JWT, NEVER from request body or query params // RULE: role checked before any data mutation
// RULE: plan_tier checked before any premium feature
import { NextRequest, NextResponse } from 'next/server' import { verifyAccessToken } from '@/lib/jwt'
export function withAuth(
handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>, options: { requiredRole?: UserRole; requiredPlan?: PlanTier } = {}
){
return async (req: NextRequest) => {
const authHeader = req.headers.get('authorization') if (!authHeader?.startsWith('Bearer ')) {
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
try {
const token = authHeader.split(' ')[1]
const payload = verifyAccessToken(token)
// SECURITY: org_id comes from JWT only
const context: AuthContext = {
userId: payload.userId,
orgId: payload.orgId, // ← NEVER from req.body role: payload.role,
planTier: payload.planTier,
}
// Role check
if (options.requiredRole && !hasRequiredRole(context.role, options.requiredRole)) { return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
// Plan tier check (server-side gate — PRD A4 Rule 1)
if (options.requiredPlan && !hasRequiredPlan(context.planTier, options.requiredPlan)) { return NextResponse.json({
error: 'Plan upgrade required',
gateReason: options.requiredPlan, }, { status: 403 })
}
return handler(req, context) } catch {
return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })

  } }
}
7. DATABASE SCHEMA & MIGRATIONS Cursor Prompt — Full Schema
"Create the complete Prisma schema for Vytaniq using the exact fields from docs/PRD.md and docs/PRD_APPENDIX_A.md. Every table must be exactly as specified. Do not add extra fields. The org_obligations table must store obligation_version_id (not just obligation_id). The audit_logs table must have no updateAt field — it is append-only. All monetary values stored as integers (kobo). All JSON fields typed as Json in Prisma."
Key Schema Sections to Verify
After Cursor generates the schema, verify these PRD requirements are met: prisma
      
  // PRD REQUIREMENT — A6 Rule 1: org_obligations stores VERSION ID model OrgObligation {
id
orgId
obligationId
obligationVersionId String // ← CRITICAL — PRD A6 Rule 1
status evidenceUrls completedAt completedBy auditLog deletedAt
// ...
}
String
ObligationStatus String[]
DateTime? String?
Json[]
DateTime? // Soft delete — PRD A2.3
description String deadlineLogic Json autoFillMappings Json evidenceRequired Json // ...
}
// PRD A6 — must be fully populated // PRD A6 — must be fully populated // PRD A6 — must be fully populated
String @id @default(uuid()) String
// PRD REQUIREMENT — A1: Obligation versioning (never update in-place) model ObligationVersion {
id String @id @default(uuid()) obligationId String // Stable parent ID versionNumber Int
changeType
changeSummary
changedBy
changedAt
effectiveFrom
sourceCircularId String?
previousVersionId String?
isCurrent Boolean @default(true)
// All obligation content fields duplicated here: title String
ChangeType
String // REQUIRED before any save — PRD A1 Rule 3
String
DateTime @default(now())
DateTime // Minimum 7 days future — PRD A1 Rule 4
// PRD REQUIREMENT — A1 Rule 3: audit_logs is append-only
// Enforce in Prisma with no update operations anywhere in codebase model AuditLog {
id
orgId
userId
actionType String entityType String entityId String
String @id @default(uuid()) String
String

  timestamp DateTime @default(now())
metadata Json
// NO updatedAt — this table is append-only
// PRD A6 Rule 6: DB-level constraint enforced via migration
}
Append-Only Audit Log — DB Migration
Add this to your migration SQL to enforce at DB level:
sql
-- In a custom migration file
CREATE RULE no_update_audit_logs AS ON UPDATE TO "AuditLog" DO INSTEAD NOTHING; CREATE RULE no_delete_audit_logs AS ON DELETE TO "AuditLog" DO INSTEAD NOTHING;
8. AUTHENTICATION SYSTEM Flow (exactly per PRD 4.1)
Register → OTP sent → Verify OTP → JWT issued → Onboarding → Dashboard
Cursor Prompt
"Build the complete auth system for Vytaniq. POST /api/v1/auth/register: accepts email, password, companyName. Hash password with bcrypt rounds=12. Generate 6-digit OTP, store hashed in DB with 10- minute expiry, send via Sendgrid. POST /api/v1/auth/verify-otp: verify OTP, mark email verified, issue JWT access token (15min) and refresh token (7 days, stored in httpOnly cookie). POST /api/v1/auth/refresh: validates refresh token cookie, issues new access token. All tokens must be validated server-side. Refresh token stored in DB for revocation."
Security Checklist for Auth
Passwords hashed bcrypt min 12 rounds
OTP is 6 digits, hashed before storage, expires 10 minutes
JWT access token: 15 minutes expiry, contains userId, orgId, role, planTier
Refresh token: 7 days, stored in httpOnly + Secure + SameSite=Strict cookie
Refresh tokens stored in DB — allows revocation on logout / security event
Rate limit: /auth/register 5/hour per IP, /auth/verify-otp 10/hour per email
Email enumeration prevention: register endpoint returns same response for existing emails Timing-safe OTP comparison (avoid timing attacks)
 
9. BACKEND API ARCHITECTURE API Rules (non-negotiable)
typescript
   
  // Every API route follows this exact pattern: // src/app/api/v1/obligations/[orgId]/route.ts
import { NextRequest, NextResponse } from 'next/server' import { withAuth } from '@/middleware/withAuth' import { writeAuditLog } from '@/lib/audit'
export const GET = withAuth(async (req, { userId, orgId }) => {
// SECURITY: Always use orgId from JWT context, never from URL params alone // Verify the URL orgId matches the JWT orgId (unless admin role)
const urlOrgId = req.nextUrl.pathname.split('/')[4]
if (urlOrgId !== orgId && context.role !== 'admin') {
return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
// Business logic here
const obligations = await getOrgObligations(orgId) return NextResponse.json({ data: obligations })
})
export const PATCH = withAuth(async (req, { userId, orgId }) => {
const body = await req.json()
// Validate with Zod before any DB operation
const parsed = updateObligationSchema.safeParse(body) if (!parsed.success) {
return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }) }
const result = await updateObligation(orgId, parsed.data)
// ALWAYS write audit log on mutations
await writeAuditLog({
orgId, userId,
actionType: 'OBLIGATION_STATUS_UPDATED',
entityType: 'org_obligation',
entityId: result.id,
metadata: { previousStatus: result.previousStatus, newStatus: result.status },
})
return NextResponse.json({ data: result }) }, { requiredPlan: 'starter' })
 
Audit Log Writer — Append-Only Enforced
 typescript
// src/lib/audit.ts
// This function is the ONLY way to write audit logs
// It uses prisma.$executeRaw for INSERT only — never update
export async function writeAuditLog(entry: AuditLogEntry): Promise<void> { await prisma.auditLog.create({
data: {
orgId: entry.orgId,
userId: entry.userId,
actionType: entry.actionType, entityType: entry.entityType, entityId: entry.entityId,
metadata: entry.metadata,
// timestamp auto-set by DB default
}, })
// No return value — fire and forget (but awaited so errors surface)
}
10. FRONTEND ARCHITECTURE
 State Management
Server state (API data): React Query (
 ) — caching, refetching, loading states UI state (modals, forms, sidebar): Zustand — lightweight, no Redux overhead
Form state: React Hook Form + Zod validation
No localStorage / sessionStorage — store nothing sensitive client-side
Component Pattern
All components follow this structure:
tsx
@tanstack/react-query
   
  // components/dashboard/ReadinessScoreCard.tsx
interface ReadinessScoreCardProps { score: number
band: ScoreBand
components: ScoreComponents orgId: string
}
export function ReadinessScoreCard({ score, band, components }: ReadinessScoreCardProps) { // 1. Animation state
const [displayScore, setDisplayScore] = useState(0)
// 2. Animate score count-up on mount
useEffect(() => {
const timer = setInterval(() => {
setDisplayScore(prev => {
if (prev >= score) { clearInterval(timer); return score } return prev + 1
})
}, 12)
return () => clearInterval(timer)
}, [score])
// 3. Render with PRD-required disclaimer (A5.1)
return (
<div className="glow-card score-card">
<ScoreGauge value={displayScore} band={band} /> <p className="score-disclaimer">
The Vytaniq Readiness Score is an internal self-assessment tool based on your reported compliance activities. It does not constitute a CBN assessment, endorsement, or certification of regulatory compliance.
</p> </div>
) }
Route Protection
tsx
    
  // src/app/(app)/layout.tsx
// Wraps ALL authenticated app routes
import { redirect } from 'next/navigation' import { getServerSession } from '@/lib/auth'
export default async function AppLayout({ children }: { children: React.ReactNode }) { const session = await getServerSession()
if (!session) { redirect('/login')
}
if (!session.onboardingComplete) { redirect('/onboarding')
}
return (
<div className="app-shell">
<Sidebar orgId={session.orgId} planTier={session.planTier} />
<main>{children}</main> </div>
) }
11. MODULE-BY-MODULE BUILD ORDER
Build in this exact sequence. Each module depends on the one before it.
Sprint 0 (Week 1–2): Foundation
GitHub repo + branch strategy Next.js project scaffold
ESLint + Prettier + TypeScript config Tailwind config with design tokens Prisma schema — ALL tables Database migrations
.env setup + secret generation CI/CD pipeline (GitHub Actions docs/ folder with PRD.md
Vercel)
Sprint 1 (Week 3–4): Auth + Admin Scaffold

  Auth API routes (register, verify-otp, login, refresh)


  withAuth middleware
withRole middleware
withPlan middleware (server-side feature gates) Login + Register + Verify OTP pages
Admin CMS scaffold (internal team only) Obligation registry seed data (60+ obligations)
Sprint 2 (Week 5–6): Onboarding
4-step onboarding form (state persisted server-side) License type selection (PSP, MMO, Switching, PSSB) Activity flags configuration
Evidence upload (S3 presigned URLs + encryption) Obligation engine (license + activities obligation list) Baseline readiness score calculation
Score disclaimer modal (one-time, before first score view)
Sprint 3 (Week 7–8): Dashboard + Obligations
Dashboard page with all 6 widgets
Obligation list with status + filter
Obligation detail slide-over panel
Mark as Met + evidence upload flow
Flag for Review + task assignment
Audit log writes on every mutation
Obligation versioning (admin CMS — PRD A1) PSP notification on obligation version change
Sprint 4 (Week 9–10): Circular Tracker
Circular list page with relevance tags
Circular detail view + impact analysis Acknowledge circular flow
Dispute circular flow (full lifecycle — PRD A3) 72-hour SLA countdown in admin
Score pause during open disputes
Pattern detection (3+ disputes on same circular)
Impact matching engine (license + activity org relevance)
Sprint 5 (Week 11–12): Calendar + Notifications
Reporting calendar — deadline computation from deadline_logic JSON 12-month calendar auto-population on onboarding
Mark report submitted + evidence upload

  30-day reminder (email + in-app)
7-day urgent reminder + risk flag creation Sendgrid email templates for all notification types Termii SMS for critical deadline alerts
Sprint 6 (Week 13): Score Engine + PDF
Full readiness score engine (5 components, exact weights) Score drill-down modal with gap list
Prioritized action list ("Improve Score")
PDF report generation with Puppeteer
Disclaimer + Methodology section in PDF (PRD A5.1) Score methodology page at /methodology (public)
Sprint 7 (Week 14): Security + QA
Full security audit against checklist in Section 12 S3 bucket policy enforcement
Rate limiting on auth endpoints
Performance testing (dashboard <2s on 4G) Accessibility audit (WCAG 2.1 AA) Cross-browser testing
Penetration test on auth + file upload flows
Sprint 8 (Week 15–16): Freemium + Landing Page
Plan-based feature gates (all 4 conversion moments — PRD A4) Pricing page
Paystack checkout integration
Landing page (Hero, Problem, Features, Pricing, Demo CTA) SEO metadata on all marketing pages
Demo request form Sendgrid your team inbox /methodology public page (PRD A5.2)
Sprint 9 (Week 17–18): Closed Beta + Launch
3–5 friendly PSPs invited for closed beta Feedback collection (in-app NPS widget)
Bug fixes from beta feedback
CBN briefing note sent (PRD A5.3)
PostHog analytics verified on all key events Pre-launch data checklist completed (PRD A6.3) Public launch

 12. SECURITY HARDENING CHECKLIST
Work through this before any beta user touches the product:
Authentication & Authorization
bcrypt rounds = 12 minimum
JWT secrets are 64+ random chars, stored in env vars only
Access token: 15-minute expiry
Refresh token: httpOnly + Secure + SameSite=Strict cookie
Refresh tokens stored in DB (allows revocation)
org_id ALWAYS from JWT — never from request body/query
RBAC enforced server-side on every route
Plan tier enforced server-side on every premium endpoint
Admin routes protected by role='admin' JWT check + ADMIN_SECRET_KEY Rate limiting: auth routes (5 req/hour/IP), API routes (100 req/min/org)
Data & Storage
S3 bucket: BlockPublicAccess = true, no public URLs ever
S3 SSE-S3 encryption enforced via bucket policy
Presigned URL expiry: 900 seconds (15 minutes) MAXIMUM Every presigned URL generation logged to audit_logs
TLS 1.3 enforced — HTTPS redirect for all HTTP requests
Database: SSL required in connection string (?sslmode=require)
All PII fields encrypted at rest (AES-256 via AWS)
Soft delete on all org data (deleted_at timestamp)
Data deletion cascade within 30 days (NDPR)
Data export within 48 hours (NDPR)
No evidence files used in aggregate analysis without opt-in (PRD A2.3 Rule 4)
Application Security
All user inputs validated with Zod before DB operations
SQL injection: impossible via Prisma ORM (parameterized queries)
XSS: Next.js auto-escapes React output; no dangerouslySetInnerHTML
CSRF: SameSite=Strict cookies; custom headers on state-mutating requests
File upload: type validation (PDF/DOCX/XLSX only), 25MB limit, virus scan (Phase 2) Security headers in next.config.js:
X-Frame-Options: DENY X-Content-Type-Options: nosniff Referrer-Policy: strict-origin-when-cross-origin Content-Security-Policy: configured
Dependency audit: npm audit run in CI on every PR

  No secrets in client-side code (NEXT_PUBLIC_ vars are public by design) API routes return no stack traces in production (NODE_ENV check)
Audit & Compliance
audit_logs table: DB-level INSERT-only rules applied
Every data mutation writes to audit_logs
Audit log includes: userId, orgId, actionType, entityType, entityId, metadata Audit log queryable by org admin (read-only)
Score disclaimer text on all score displays (PRD A5.1)
Score named "Vytaniq Readiness Score" — never implies CBN endorsement No CBN logo or affiliation implied anywhere
Privacy policy accepted before data collection in onboarding
NDPR data processing agreement available
SOC 2 roadmap disclosed in onboarding and security settings page
All disclaimer copy reviewed by Nigerian fintech attorney before launch
13. CURSOR PROMPTING STRATEGY
The System Prompt (paste at start of every Cursor session)
You are a senior fullstack engineer building Vytaniq — a compliance intelligence platform for Nigerian PSP startups. Our tech stack is:
- Next.js 14 App Router, TypeScript, Tailwind CSS
- PostgreSQL via Prisma ORM
- AWS S3 (evidence storage), AWS EventBridge (scheduled jobs) - Sendgrid (email), Termii (SMS), Paystack (payments)
- PostHog (analytics), Sentry (errors)
RULES:
1. All features must match docs/PRD.md exactly. Never add fields or
features not in the PRD.
2. All API routes must be prefixed /api/v1/
3. org_id always comes from JWT context, never from request body.
4. Every data mutation must write to audit_logs.
5. Never update obligation records in-place — always create a new version. 6. S3 presigned URLs: maximum 15-minute expiry.
7. Feature gates enforced server-side via withPlan middleware.
8. When unsure, ask me before adding anything.
Current PRD is in: docs/PRD.md and docs/PRD_APPENDIX_A.md
  □
□
□
□
□
□
□
□
□
□
□
□
□
  
Per-Feature Prompt Template
 FEATURE: [Feature name from PRD section X.X] PRD REFERENCE: [Quote the exact PRD section]
BUILD:
1. [Specific thing to build] 2. [Another specific thing]
CONSTRAINTS:
- [Security rule that applies] - [Data rule that applies]
ACCEPTANCE CRITERIA: - [How I'll verify it's working]
After Each Module — Ask Cursor:
"Review the code you just wrote against docs/PRD.md Section X.X. List any fields, features, or behaviors that are either missing from the PRD or not specified in the PRD. I want to remove anything not in scope and add anything missing."
14. PRE-LAUNCH CHECKLIST
From PRD Appendix A6.3 — every item must be green before any paying customer:
  
 DATA COMPLETENESS
60+ obligations in registry
100% of Critical/High obligations: deadline_logic populated
100% of Critical/High obligations: evidence_required populated
100% of Critical/High obligations: auto_fill_mappings populated
10+ CBN report types ingested with full field definitions
License matrix complete: PSP, MMO, Switching, PSSB
24 months of CBN circulars ingested and tagged
Every circular tagged with affected_obligation_ids and affected_license_types
LEGAL & COMPLIANCE
All disclaimer copy reviewed by Nigerian fintech attorney
Score methodology page live at /methodology
Privacy policy reviewed and published
Terms of service include score misrepresentation clause (PRD A5.3)
CBN briefing note sent to Payments System Management dept (PRD A5.3) NDPR data processing agreement available
TECHNICAL
Schema validation tests passing (deadline_logic, auto_fill_mappings, evidence_required) All 4 conversion moments tracked in PostHog
Sentry error tracking verified in production
S3 bucket policies enforced and tested
Audit log append-only rules verified
Performance: dashboard loads <2s on simulated 4G
Accessibility: WCAG 2.1 AA audit passed on core flows
TEAM
2+ admin CMS users trained and have access
Content review SLA documented (circulars within 48 hours) Dispute resolution SLA documented (72 business hours) CBN circular monitoring schedule running (3x/week)
Vytaniq Build Guide v1.0 — Phase 1 MVP — Strictly PRD-Compliant Reference: docs/PRD.md | docs/PRD_APPENDIX_A.md
□
□
□
□
□
□
□
□
□
□
□
□
□
□
□
□
□
□
□
□
□
□
□
□
□
 