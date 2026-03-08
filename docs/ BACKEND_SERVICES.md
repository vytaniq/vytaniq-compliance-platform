# VYTANIQ BACKEND SERVICES - Implementation Guide

**Version:** 1.0  
**Date:** March 8, 2026  
**Status:** Ready for Implementation  

---

## TABLE OF CONTENTS

1. [Backend Architecture Overview](#backend-overview)
2. [Database Schema (Prisma)](#database-schema)
3. [Utility Libraries Created](#utility-libraries)
4. [Middleware Components](#middleware)
5. [Validation Schemas (Zod)](#validation)
6. [API Routes - Complete Map](#api-routes)
7. [Security Implementation](#security)
8. [Error Handling Strategy](#error-handling)
9. [Audit Logging](#audit-logging)
10. [Database Seeding](#seeding)

---

## BACKEND OVERVIEW

Vytaniq backend is implemented as Next.js API routes within a monorepo structure. All backend code follows these principles:

- ✅ **Security-first:** RBAC, audit logging, encryption, rate limiting
- ✅ **Type-safe:** Full TypeScript + Zod validation on every endpoint
- ✅ **Modular:** Clear separation of concerns (lib, middleware, validators, routes)
- ✅ **Testable:** Pure functions in `/lib/` can be unit tested independently
- ✅ **Scalable:** Stateless design allows horizontal scaling via Vercel auto-scaling

### Backend File Structure

```
apps/web/src/
├── app/api/v1/
│   ├── auth/
│   │   ├── register/route.ts      ✅ CREATED
│   │   ├── verify-otp/route.ts    ✅ CREATED
│   │   ├── login/route.ts         ✅ CREATED
│   │   └── refresh/route.ts       ✅ CREATED
│   │
│   ├── onboarding/
│   │   └── complete/route.ts       (TODO: 4-step flow)
│   │
│   ├── obligations/
│   │   ├── [orgId]/route.ts        (TODO: List obligations)
│   │   ├── [orgId]/[id]/route.ts   (TODO: Update status)
│   │   └── [orgId]/[id]/evidence/route.ts (TODO: Presigned URLs)
│   │
│   ├── circulars/
│   │   ├── [orgId]/route.ts        (TODO: List circulars)
│   │   ├── [orgId]/[id]/acknowledge/route.ts (TODO)
│   │   └── [orgId]/[id]/dispute/route.ts (TODO)
│   │
│   ├── calendar/
│   │   ├── [orgId]/route.ts        (TODO: Report deadlines)
│   │   └── [orgId]/[id]/submit/route.ts (TODO: Mark submitted)
│   │
│   ├── readiness/
│   │   ├── [orgId]/route.ts        (TODO: Get score)
│   │   └── [orgId]/report/route.ts (TODO: PDF generation)
│   │
│   └── admin/
│       ├── obligations/route.ts     (TODO: CRUD obligations)
│       └── circulars/route.ts       (TODO: Ingest circulars)
│
├── lib/                            ✅ CREATED
│   ├── prisma.ts                   ✅ Prisma singleton
│   ├── jwt.ts                      ✅ Token sign/verify
│   ├── hash.ts                     ✅ Password hashing (bcrypt)
│   ├── otp.ts                      ✅ OTP generation + verification
│   ├── s3.ts                       ✅ S3 presigned URLs + validation
│   ├── audit.ts                    ✅ Append-only audit logging
│   ├── score.ts                    ✅ Readiness score engine (5 components)
│   ├── obligation-engine.ts        ✅ Obslige license mapping
│   ├── deadline.ts                 ✅ Deadline computation from JSON
│   └── sendgrid.ts                 ✅ Email notifications
│
├── middleware/                     ✅ CREATED
│   ├── withAuth.ts                 ✅ JWT verification + context extraction
│   ├── withRole.ts                 ✅ RBAC enforcement
│   └── withPlan.ts                 ✅ Feature gating by plan tier
│
├── validators/                     ✅ CREATED
│   ├── auth.ts                     ✅ Register, login, OTP, refresh
│   ├── obligation.ts               ✅ Status update, evidence upload
│   ├── circular.ts                 ✅ Acknowledge, dispute, ingest
│   └── onboarding.ts               ✅ License config, activities
│
├── types/                          (TODO: API types, responses)
└── constants/                      (TODO: App constants, configs)

prisma/
├── schema.prisma                   ✅ Full database model (17 models)
├── migrations/                     (TODO: Auto-generated)
└── seed/                           (TODO: Seed 60+ obligations + circulars)
```

---

## DATABASE SCHEMA (PRISMA)

**File:** `prisma/schema.prisma` ✅ CREATED

### 17 Core Models:

1. **Organization** - PSP company profile, license types, plan tier
2. **User** - Team members (admin, member, observer)
3. **Obligation** - Master catalog of all CBN requirements (60+)
4. **ObligationVersion** - Historical versions with change tracking (PRD A1)
5. **OrgObligation** - Per-org obligation status + evidence
6. **Circular** - CBN publications (weekly ingested)
7. **OrgCircular** - Per-org circular relevance tags
8. **CircularDispute** - PSP challenges to circular relevance (PRD A3)
9. **ReportCalendar** - Auto-populated report deadlines
10. **ReadinessScore** - Compliance health (0-100 score)
11. **AuditLog** - Append-only mutation history (PRD A6)
12. **RefreshToken** - For token revocation on logout
13. **OtpVerification** - Temporary OTP storage

### Key Features:

- ✅ **Versioning:** `ObligationVersion` stores all changes with changedAt, effectiveFrom, changeType
- ✅ **Audit Trail:** `AuditLog` table with DB-level INSERT-only rules (no UPDATE/DELETE)
- ✅ **JSON Fields:** deadline_logic, autoFillMappings, evidenceRequired (PRD A6.1)
- ✅ **Soft Deletes:** `deletedAt` timestamp for NDPR compliance
- ✅ **Indexed:** org_id, status, dueDate for fast queries
- ✅ **Relations:** Cascading deletes for data integrity

### Enum Types:

- UserRole: ADMIN, MEMBER, OBSERVER
- PlanTier: FREE, STARTER, GROWTH, ENTERPRISE
- ObligationStatus: MET, PARTIAL, NOT_STARTED, AT_RISK, WAIVED
- ObligationCategory: KYC, AML, REPORTING, GOVERNANCE, TECHNOLOGY, CONSUMER_PROTECTION, CAPITAL
- ObligationFrequency: ONE_TIME, MONTHLY, QUARTERLY, ANNUAL, EVENT_TRIGGERED
- ObligationSeverity: CRITICAL, HIGH, MEDIUM, LOW
- ScoreBand: INVESTOR_READY (85-100), AUDIT_READY (70-84), WORK_REQUIRED (50-69), AT_RISK (<50)

---

## UTILITY LIBRARIES CREATED ✅

### 1. Prisma Client (`src/lib/prisma.ts`)
- Singleton pattern prevents connection pool leaks
- Configurable logging (query, error, warn)

### 2. JWT Utilities (`src/lib/jwt.ts`)
```typescript
signAccessToken(payload) → 15-min JWT
signRefreshToken(userId, orgId) → 7-day JWT
verifyAccessToken(token) → TokenPayload
verifyRefreshToken(token) → { userId, orgId }
decodeToken(token) → raw token data (no verification)
```

### 3. Password Hashing (`src/lib/hash.ts`)
```typescript
hashPassword(password) → bcrypt hash (12 rounds)
verifyPassword(plainPassword, hash) → boolean (timing-safe)
```

### 4. OTP Management (`src/lib/otp.ts`)
```typescript
generateOTP() → 6-digit random code
createOTPRecord(otp) → { hashedOtp, expiresAt }
verifyOTP(provided, hash, expiresAt) → { valid, expired }
```

### 5. S3 File Storage (`src/lib/s3.ts`)
```typescript
generatePresignedUploadUrl(orgId, obligationId, fileName)
  → S3 presigned URL (15 min expiry, AES-256 encryption)
generatePresignedDownloadUrl(s3Key) → S3 presigned URL
validateFileUpload(fileSize, fileName) → { valid, error? }
```

### 6. Audit Logging (`src/lib/audit.ts`)
```typescript
writeAuditLog(entry) → INSERT to AuditLog (append-only)
getAuditLogs(orgId, filters) → queryable audit trail
auditObligationStatusUpdate(...) → helper for status changes
auditEvidenceUpload(...) → helper for file uploads
auditCircularAcknowledgment(...) → helper for acknowledgments
auditLoginSuccess/auditLoginFailure(...) → auth tracking
```

### 7. Readiness Score Engine (`src/lib/score.ts`)
```typescript
calculateReadinessScore(orgId) → {
  totalScore: 0-100,
  band: INVESTOR_READY | AUDIT_READY | WORK_REQUIRED | AT_RISK,
  components: {
    obligationCoverage: 0-1 (35% weight),
    reportSubmission: 0-1 (30% weight),
    circularAcknowledgment: 0-1 (15% weight),
    evidenceCompleteness: 0-1 (10% weight),
    licenseCurrency: 0-1 (10% weight)
  }
}
saveReadinessScore(orgId, score) → store to DB
getLatestReadinessScore(orgId) → retrieve latest
getScoreGaps(orgId) → [...improvements ranked by impact]
```

### 8. Obligation Engine (`src/lib/obligation-engine.ts`)
```typescript
getApplicableObligations(orgId) → filter by license + activities
createInitialOrgObligations(orgId) → populate on onboarding
getOrgObligationsWithStatus(orgId, filters) → with joins
getObligationsByCategory(orgId) → grouped
getObligationsSummary(orgId) → { total, met, partial, notStarted, atRisk, waived }
updateObligationStatus(orgId, obligationId, status, userId)
```

### 9. Deadline Computation (`src/lib/deadline.ts`)
```typescript
computeNextDueDate(deadlineLogic, fromDate) → Date
  // Handles: month_end, quarter_end, fiscal_year_end
  // Offset: before/after + business days only option
computeNextDueDates(deadlineLogic, fromDate, months) → Date[]
  // Generate 12-month calendar for recurring obligations
getDeadlineUrgency(dueDate) → OVERDUE | URGENT | WARNING | SAFE
shouldTriggerReminder(dueDate, reminderDays) → boolean
```

### 10. Sendgrid Email (`src/lib/sendgrid.ts`)
```typescript
sendOTPEmail(email, otp, companyName) → sends 6-digit code
send30DayReminder(email, reports) → upcoming reports
send7DayUrgentAlert(email, reports) → reports due within 7 days
sendCircularAlert(email, circular) → new circular published
sendDisputeResolution(email, outcome, circular) → dispute decided
```

---

## MIDDLEWARE COMPONENTS ✅

### 1. Authentication Middleware (`src/middleware/withAuth.ts`)

**Purpose:** Verify JWT and extract authentication context

```typescript
export function withAuth(handler: AuthHandler, options?) {
  // Check Authorization: Bearer {token}
  // Verify JWT signature
  // Extract: userId, orgId, role, planTier
  // Enforce role if specified
  // Call handler with AuthContext
}

// Usage:
export const GET = withAuth(async (req, context) => {
  const { userId, orgId, role, planTier } = context
  // ... handler logic
})

// With role check:
export const POST = withAuth(handler, { requiredRole: 'ADMIN' })
```

**AuthContext:**
```typescript
{
  userId: string
  orgId: string          // ← From JWT only (never from request body)
  role: 'ADMIN' | 'MEMBER' | 'OBSERVER'
  planTier: 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE'
  token: TokenPayload
}
```

### 2. Role-Based Access Control (`src/middleware/withRole.ts`)

**Purpose:** Enforce permission matrix by user role

```typescript
// Permission matrix:
PERMISSION_MATRIX: {
  // Org management
  ORG_CREATE: ['ADMIN'],
  ORG_READ: ['ADMIN', 'MEMBER', 'OBSERVER'],
  ORG_UPDATE: ['ADMIN'],
  
  // Obligation tracking
  OBLIGATION_READ: ['ADMIN', 'MEMBER', 'OBSERVER'],
  OBLIGATION_UPDATE: ['ADMIN', 'MEMBER'],
  
  // Admin functions
  ADMIN_OBLIGATION_MANAGE: ['ADMIN'],
  ADMIN_CIRCULAR_INGEST: ['ADMIN'],
  ADMIN_DISPUTE_REVIEW: ['ADMIN'],
  
  // Audit logs
  AUDIT_LOG_READ: ['ADMIN'],
}

// Usage:
export const POST = withRole(handler, 'OBLIGATION_UPDATE')
```

### 3. Feature Gating Middleware (`src/middleware/withPlan.ts`)

**Purpose:** Server-side enforcement of freemium paywall (PRD A4)

```typescript
// Feature matrix (org plan → feature access):
FEATURE_MATRIX: {
  OBLIGATION_TRACKING: ['STARTER', 'GROWTH', 'ENTERPRISE'],
  EVIDENCE_VAULT: ['GROWTH', 'ENTERPRISE'],
  READINESS_SCORE: ['STARTER', 'GROWTH', 'ENTERPRISE'],
  CIRCULAR_DISPUTES: ['STARTER', 'GROWTH', 'ENTERPRISE'],
  READINESS_REPORT_PDF: ['GROWTH', 'ENTERPRISE'],
  API_ACCESS: ['ENTERPRISE'],
}

// Usage:
export const PATCH = withPlan(handler, 'OBLIGATION_TRACKING')

// Composed:
export const GET = withAuth(
  withPlan(handler, 'EVIDENCE_VAULT'),
  { requiredRole: 'MEMBER' }
)
```

**Composition Pattern:**
```typescript
// Step 1: Verify JWT + extract context (withAuth)
// Step 2: Check plan tier (withPlan)
// Step 3: Check role permission (withRole)
// Step 4: Execute handler

export const POST = withAuth(
  withRole(
    withPlan(handler, 'OBLIGATION_UPDATE'),
    'OBLIGATION_UPDATE'
  ),
  { requiredRole: 'MEMBER' }
)
```

---

## VALIDATION SCHEMAS (ZOD) ✅

### 1. Authentication Validators (`src/validators/auth.ts`)

```typescript
registerSchema
  email: string (email, lowercase)
  password: string (8+ chars, uppercase, lowercase, digit)
  confirmPassword: string
  companyName: string (2-255 chars)

loginSchema
  email: string (email, lowercase)
  password: string (1+ chars)

verifyOTPSchema
  email: string (email, lowercase)
  otp: string (exactly 6 digits)

refreshTokenSchema
  refreshToken: string
```

### 2. Obligation Validators (`src/validators/obligation.ts`)

```typescript
updateObligationStatusSchema
  orgObligationId: string (UUID)
  status: enum [MET, PARTIAL, NOT_STARTED, AT_RISK, WAIVED]
  notes: string (optional, max 1000 chars)

uploadEvidenceSchema
  orgObligationId: string (UUID)
  fileName: string (PDF|DOCX|XLSX only)
  fileSize: number (max 25MB)

removeEvidenceSchema
  orgObligationId: string (UUID)
  evidenceUrl: string (valid URL)
```

### 3. Circular Validators (`src/validators/circular.ts`)

```typescript
acknowledgeCircularSchema
  circularId: string (UUID)

disputeCircularSchema
  circularId: string (UUID)
  reason: string (10-2000 chars)

resolveDisputeSchema
  disputeId: string (UUID)
  outcome: enum [RELEVANCE_CONFIRMED, RELEVANCE_WITHDRAWN, PARTIAL_RELEVANCE]
  resolutionNote: string (10-2000 chars)

ingestCircularSchema
  title: string (5-255 chars)
  summary: string (20-5000 chars)
  content: string (optional)
  date: Date (valid date)
  url: string (optional, valid URL)
  affected LicenseTypes: enum[] [PSP, MMO, SWITCHING, PSSB]
  affectedObligationIds: UUID[] (at least 1)
  urgency: enum [CRITICAL, HIGH, MONITOR] (default: MONITOR)
  taggingConfidence: enum [HIGH, MEDIUM, LOW] (default: MEDIUM)
```

### 4. Onboarding Validators (`src/validators/onboarding.ts`)

```typescript
licenseConfigSchema
  licenseTypes: enum[] [PSP, MMO, SWITCHING, PSSB] (1-4 required)
  licenseNumber: string (alphanum with dash/slash)
  licenseIssueDate: Date
  licenseRenewalDate: Date

businessActivitiesSchema
  activityFlags: enum[] [PAYMENTS, LENDING, FX_TRADING, BILL_PAYMENT, REMITTANCE, WALLET, CARD_ISSUANCE]

completeOnboardingSchema
  (Combined licenseConfig + businessActivities)
```

---

## API ROUTES - COMPLETE MAP

### Authentication Routes ✅ CREATED

#### 1. POST /api/v1/auth/register
**File:** `apps/web/src/app/api/v1/auth/register/route.ts` ✅

```
Request:
  {
    email: string
    password: string
    confirmPassword: string
    companyName: string
  }

Process:
  1. Validate with registerSchema
  2. Check email not already registered
  3. Create Organization (FREE tier)
  4. Create User (ADMIN role)
  5. Generate 6-digit OTP
  6. Hash OTP, save with 10-min expiry
  7. Send OTP email
  8. Return userId + orgId

Response (201):
  {
    success: true
    userId: string
    orgId: string
    email: string
    requiresOTP: true
  }

Security:
  ✅ Email enumeration prevention
  ✅ bcrypt 12-round hashing
  ✅ OTP never returned in response
  ✅ Rate limit: 5 req/hr per IP
```

#### 2. POST /api/v1/auth/verify-otp
**File:** `apps/web/src/app/api/v1/auth/verify-otp/route.ts` ✅

```
Request:
  {
    email: string
    otp: string (6 digits)
  }

Process:
  1. Validate with verifyOTPSchema
  2. Find OTP record
  3. Check not expired (10 min)
  4. Check attempts < 5
  5. Timing-safe OTP comparison
  6. Mark OTP verified
  7. Get user + org
  8. Update user: emailVerified=true, lastLogin=now
  9. Generate JWT access token (15 min)
  10. Generate refresh token (7 days)
  11. Save refresh token to DB (for revocation)
  12. Set refresh token in httpOnly cookie

Response (200):
  {
    success: true
    accessToken: string (JWT)
    expiresIn: 900
    user: { userId, email, firstName, role, orgId }
  }

Cookies:
  refreshToken (httpOnly, Secure, SameSite=Strict, 7 days)

Security:
  ✅ Timing-safe OTP comparison
  ✅ Attempt limiting (5 max)
  ✅ Refresh token rotated on every use
  ✅ Age validation on both tokens
```

#### 3. POST /api/v1/auth/login
**File:** `apps/web/src/app/api/v1/auth/login/route.ts` ✅

```
Request:
  {
    email: string
    password: string (not used in Phase 1)
  }

Process:
  1. Validate with loginSchema
  2. Find user by email
  3. Generate OTP
  4. Save OTP record
  5. Send OTP emailResponse (200):
  {
    success: true
    message: "OTP sent to your email"
    requiresOTP: true
    email: string
  }

Security:
  ✅ Email enumeration prevention
  ✅ Same response for existing/non-existing users
  ✅ IP tracking for security monitoring
```

#### 4. POST /api/v1/auth/refresh
**File:** `apps/web/src/app/api/v1/auth/refresh/route.ts` ✅

```
Request:
  Refresh token in httpOnly cookie

Process:
  1. Extract refreshToken from cookie
  2. Verify JWT signature
  3. Check refresh token not revoked (DB lookup)
  4. Check token not expired
  5. Get user + org
  6. Generate new access token (15 min)

Response (200):
  {
    success: true
    accessToken: string (JWT)
    expiresIn: 900
  }

Security:
  ✅ DB lookup prevents revocation bypass
  ✅ Signing key rotation-ready
```

---

### Onboarding Routes (TODO - Design Below)

#### POST /api/v1/onboarding/complete
**Purpose:** Complete 4-step onboarding flow

```
Requirements from PRD 4.1:
  1. License type selection
  2. License metadata (number, issue date, renewal date)
  3. Business activities (payments, lending, FX, etc.)
  4. Optional evidence upload

Endpoint should:
  1. Validate organizationobject (licenseConfigSchema + businessActivitiesSchema)
  2. withAuth + check FREE tier (all new users) OR STARTER+
  3. Update organzation: licenseTypes[], activityFlags[], license metadata
  4. Call obligation-engine.createInitialOrgObligations(orgId)
  5. Calculate initial readiness score
  6. Populate report calendar with 12-month obligations
  7. Audit log: ORGANIZATION_CONFIGURED
  8. Return: obligations count + initial score + calendar entries

Response:
  {
    success: true,
    obligationsCount: number,
    readinessScore: { totalScore, band, components },
    calendarEntries: number,
    nextSteps: ["Track obligations", "Review circulars"]
  }
```

---

### Obligations Routes (TODO - Design Below)

#### GET /api/v1/obligations/[orgId]
**Purpose:** List all obligations for an org with status

```
Requirements:
  1. withAuth middleware (validate orgId matches JWT)
  2. Query all org_obligations for this org
  3. Include obligation metadata + version
  4. Filter: category, status, severity (optional)
  5. Return: [{ obligation, status, evidenceUrls, completedAt }]
  6. Audit log: READ (optional, for compliance tracking)

Response:
  {
    obligations: [
      {
        id: string,
        obligation: { title, description, legalSource, category, severity },
        status: enum,
        evidenceUrls: string[],
        completedAt: Date?
      }
    ]
  }
```

#### PATCH /api/v1/obligations/[orgId]/[obligationId]
**Purpose:** Update obligation status + upload evidence

```
Requirements:
  1. withAuth, withRole('OBLIGATION_UPDATE'), withPlan('OBLIGATION_TRACKING')
  2. Validate status with updateObligationStatusSchema
  3. Database transaction:
     - Update org_obligation.status
     - Set completedAt/completedBy if status=MET
     - Write audit log: OBLIGATION_STATUS_UPDATED
  4. Recalculate readiness score
  5. Return updated obligation

Response:
  {
    success: true,
    obligation: { ... },
    newScore: { totalScore, band }
  }
```

#### POST /api/v1/obligations/[orgId]/[obligationId]/evidence
**Purpose:** Generate presigned S3 URL for evidence upload

```
Requirements:
  1. withAuth, withPlan('EVIDENCE_VAULT')
  2. Validate fileName + fileSize with uploadEvidenceSchema
  3. Call s3.generatePresignedUploadUrl()
  4. Return presigned URL (15 min expiry)
  5. Browser POSTs directly to S3
  6. On successful upload, webhook or client calls PATCH evidence

Response:
  {
    presignedUrl: string,
    expiresIn: 900,
    instructions: "Upload file directly to this URL"
  }
```

---

### Circulars Routes (TODO - Design Below)

#### GET /api/v1/circulars/[orgId]
**Purpose:** List CBN circulars with org-specific relevance tags

```
Requirements:
  1. withAuth
  2. Query all circulars
  3. For each, find org_circular record (relevance_tag)
  4. Filter disputes in progress (don't count disputed circulars against score)
  5. Return with: title, date, urgency, relevance_tag, acknowledged_at, dispute_status

Response:
  {
    circulars: [
      {
        circularId: string,
        title: string,
        date: Date,
        urgency: enum,
        relevanceTag: enum,
        acknowledgedAt: Date?,
        disputeStatus: enum?
      }
    ]
  }
```

#### PATCH /api/v1/circulars/[orgId]/[circularId]/acknowledge
**Purpose:** Acknowledge circular (mark as reviewed)

```
Requirements:
  1. withAuth, with Role('CIRCULAR_ACKNOWLEDGE')
  2. Update org_circular.acknowledgedAt = now()
  3. Recalculate readiness score (circularAcknowledgment component)
  4. Audit log: CIRCULAR_ACKNOWLEDGED

Response:
  {
    success: true,
    acknownledgedAt: Date,
    newScore: { totalScore, band }
  }
```

#### POST /api/v1/circulars/[orgId]/[circularId]/dispute
**Purpose:** Dispute circular relevance (PRD A3)

```
Requirements:
  1. withAuth, withRole('CIRCULAR_DISPUTE')
  2. Validate reason with disputeCircularSchema
  3. Create circular_dispute record
  4. Set dispute status: OPEN
  5. Pause circular from scoring (doesn't count against readiness score)
  6. Audit log: CIRCULAR_DISPUTE_RAISED
  7. Send email to Vytaniq legal team (SLA: 72 business hours)

Response:
  {
    success: true,
    disputeId: string,
    status: "OPEN",
    slaDeadline: Date,
    message: "Your dispute is under review"
  }
```

---

### Calendar Routes (TODO - Design Below)

#### GET /api/v1/calendar/[orgId]
**Purpose:** Get report deadline calendar (12-month view)

```
Requirements:
  1. withAuth
  2. Query all report_calendar entries for org
  3. For each: compute current status (PENDING / SUBMITTED / OVERDUE)
  4. Sort by due_date ASC
  5. Return with: obligation name, due_date, status, urgency

Response:
  {
    calendar: [
      {
        entryId: string,
        obligationName: string,
        dueDate: Date,
        status: enum,
        urgency: "OVERDUE" | "URGENT" | "WARNING" | "SAFE",
        submittedAt: Date?,
        submissionEvidenceUrl: string?
      }
    ]
  }
```

#### PATCH /api/v1/calendar/[orgId]/[entryId]/submit
**Purpose:** Mark report as submitted

```
Requirements:
  1. withAuth
  2. Update report_calendar.submittedAt = now()
  3. update report_calendar.status = "SUBMITTED"
  4. Optional: evidenceUrl points to CBN submission proof
  5. Recalculate readiness score
  6. Audit log: REPORT_SUBMITTED

Response:
  {
    success: true,
    submittedAt: Date,
    newScore: { totalScore, band }
  }
```

---

### Readiness Score Routes (TODO - Design Below)

#### GET /api/v1/readiness/[orgId]
**Purpose:** Get current compliance health score

```
Requirements:
  1. withAuth, withPlan('READINESS_SCORE')
  2. Calculate score using score.calculateReadinessScore()
  3. Get latest saved score (for comparison)
  4. Return: totalScore, band, components breakdown, trends

Response:
  {
    score: {
      totalScore: 78,
      band: "AUDIT_READY",
      components: {
        obligationCoverage: 0.80,
        reportSubmission: 0.92,
        circularAcknowledgment: 0.75,
        evidenceCompleteness: 0.40,
        licenseCurrency: 1.0
      }
    },
    gaps: [
      { component: "evidenceCompleteness", impact: 6, actionItems: [...] },
      { component: "circularAcknowledgment", impact: 2, actionItems: [...] }
    ]
  }
```

#### POST /api/v1/readiness/[orgId]/report
**Purpose:** Generate PDF readiness snapshot for investors (PRD 4.6.3)

```
Requirements:
  1. withAuth, withPlan('READINESS_REPORT_PDF')
  2. Calculate current score
  3. Generate PDF via Puppeteer:
     - Title: "Compliance Readiness Report"
     - Score card (78/100, AUDIT_READY band)
     - Component breakdown (5 components, weights)
     - Obligation summary (X met, X partial, X not started)
     - Circular log (recent circulars + acknowledgments)
     - MANDATORY disclaimer (PRD A5.1): "The Vytaniq Readiness Score is an internal self-assessment tool..."
     - Methodology section (PRD A5.2)
  4. Return PDF as file download

Response:
  PDF file with Content-Disposition: attachment
```

---

### Admin Routes (TODO - Design Below)

#### GET /api/v1/admin/obligations
#### POST /api/v1/admin/obligations
#### PATCH /api/v1/admin/obligations/[id]
**Purpose:** Manage master obligation registry (admin CMS)

```
Requirements:
  1. withAuth, withRole('ADMIN_OBLIGATION_MANAGE')
  2. GET: List all obligations with version history
  3. POST: Create new obligation version (PRD A1)
     - Always creates new version, never updates in-place
     - change_type: "CREATED" | "REQUIREMENT_UPDATED" | "DEADLINE_CHANGED" | "DEPRECATED"
     - change_summary: required before save (PRD A1 Rule 3)
     - effective_from: minimum 7 days future (PRD A1 Rule 4)
  4. PATCH: Edit obligation (creates version)
     - Validates deadline_logic JSON (PRD A6.1)
     - Validates auto_fill_mappings sources
     - Validates evidence_required
  5. impact assessment: runs queries against all orgs
     - Finds orgs affected by this change
     - Sets to "Needs Review" if evidence gaps
     - Sends emails to compliance leads
```

#### GET /api/v1/admin/circulars
#### POST /api/v1/admin/circulars
**Purpose:** CBN circular ingestion (admin CMS)

```
Requirements:
  1. withAuth, withRole('ADMIN_CIRCULAR_INGEST')
  2. POST: Ingest new circular
     - Validate with ingestCircularSchema
     - Create circular record
     - Tag affected_license_types[]
     - Tag affected_obligation_ids[]
     - Set urgency + tagging_confidence
     - Run impact matching
     - Generate org_circular records for all affected orgs
     - Send circular alert emails
```

#### GET /api/v1/admin/disputes
#### PATCH /api/v1/admin/disputes/[id]/resolve
**Purpose:** Review circular disputes (PRD A3, SLA 72 hours)

```
Requirements:
  1. withAuth, withRole('ADMIN_DISPUTE_REVIEW')
  2. GET: List open disputes with SLA countdown
  3. PATCH: Resolve dispute
     - Validate resolveDisputeSchema
     - Update dispute: status, outcome, resolutionNote
     - If RELEVANCE_WITHDRAWN: remove from org_circular globally
     - If PARTIAL_RELEVANCE: flag for manual review
     - Send email to org with resolution
     - If 3+ disputes on same circular: flag for global re-tagging
```

---

## SECURITY IMPLEMENTATION

### 1. Authentication Flow

```
┌─ POST /api/v1/auth/register
│  ├─ Email/password validation
│  ├─ Create Organization + User
│  ├─ Generate 6-digit OTP
│  ├─ Send OTP email
│  └─ Return: userId, orgId

├─ POST /api/v1/auth/verify-otp
│  ├─ Timing-safe OTP verification
│  ├─ Attempt limiting (5 max)
│  ├─ Generate JWT access token (15 min)
│  ├─ Generate refresh token (7 days)
│  ├─ Save refresh token to DB
│  └─ Return: accessToken + httpOnly cookie

├─ POST /api/v1/auth/login
│  ├─ Request OTP for existing user
│  └─ → verify-otp flow

└─ POST /api/v1/auth/refresh
   ├─ Validate refresh token (JWT + DB lookup)
   └─ Return: new accessToken
```

### 2. JWT Security

```
Access Token (15 minutes):
  {
    userId: string
    orgId: string          ← PRIMARY org isolation
    role: string
    planTier: string
    iat, exp
  }
  Signed with: HS256 (symmetric)
  Secret from: process.env.JWT_SECRET
  Expires: 15 minutes

Refresh Token (7 days):
  {
    userId: string
    orgId: string
    iat, exp
  }
  Signed with: HS256 (symmetric)
  Secret from: process.env.JWT_REFRESH_SECRET
  Storage: httpOnly cookie + DB table
  Revocation: checked on every refresh
  Expires: 7 days
```

### 3. Org Isolation

**CRITICAL RULE:** org_id ALWAYS from JWT context, NEVER from request body or URL params (validated against JWT)

```typescript
// ✅ CORRECT
const { orgId } = context // From JWT
const urlOrgId = req.nextUrl.pathname.split('/')[4]
if (orgId !== urlOrgId) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// ❌ WRONG (security bug)
const orgId = params.orgId // From URL - NOT TRUSTED
const org = await prisma.organization.findUnique({ where: { id: orgId } })
```

### 4. Rate Limiting

```
Auth endpoints:
  /register: 5 req/hour per IP
  /verify-otp: 10 req/hour per email
  /login: 5 req/hour per email

API endpoints:
  General: 100 req/min per org

Implementation:
  use Redis-based counter
  on limit exceeded: return 429 (Too Many Requests)
  include Retry-After header
```

### 5. Data Encryption

```
Passwords:
  ✅ bcrypt 12 rounds (OWASP minimum)
  ✅ never stored in plain text
  ✅ timing-safe verification

OTP:
  ✅ hashed before storage
  ✅ never returned in API response
  ✅ never logged

S3 Files:
  ✅ AES-256 encryption at-rest
  ✅ TLS 1.3 in-transit
  ✅ presigned URLs (15 min expiry max)
  ✅ every access logged to audit_logs

Database:
  ✅ SSL required in connection string
  ✅ encrypted backups
  ✅ encryption at rest via AWS RDS

Tokens in Transit:
  ✅ HTTPS only (HTTP redirected to HTTPS)
  ✅ strict CORS headers
  ✅ X-Frame-Options: DENY
  ✅ X-Content-Type-Options: nosniff
```

### 6. RBAC Enforcement

```
Middleware chain (checks applied in order):
  1. withAuth:
     - Verify JWT signature
     - Check token not expired
     - Extract context (userId, orgId, role, planTier)

  2. withRole:
     - Check role in PERMISSION_MATRIX
     - Enforce role hierarchy if needed

  3. withPlan:
     - Check plan_tier in FEATURE_MATRIX
     - Reject if insufficient plan

  4. Business logic:
     - Validate org_id from URL matches JWT
     - Validate resource ownership
     - Perform action
```

### 7. Audit Logging

```
Every mutation logged:
  ├─ Standard fields:
  │  ├─ orgId (from JWT)
  │  ├─ userId (from JWT)
  │  ├─ actionType (OBLIGATION_STATUS_UPDATED, etc.)
  │  ├─ entityType (org_obligation, org_circular, etc.)
  │  ├─ entityId (resource ID)
  │  ├─ timestamp (server-side)
  │  ├─ ipAddress (from request headers)
  │  └─ userAgent (from request headers)
  │
  └─ metadata (action-specific):
     ├─ Previous values: { previousStatus: "Not Started" }
     ├─ New values: { newStatus: "Met" }
     ├─ Evidence: { fileUrl: "s3://..." }
     └─ Changes: { changeType: "REQUIREMENT_UPDATED" }

Insert-only (no UPDATE, no DELETE):
  DB-level rules:
    CREATE RULE no_update_audit_logs AS ON UPDATE TO "AuditLog" DO INSTEAD NOTHING;
    CREATE RULE no_delete_audit_logs AS ON DELETE TO "AuditLog" DO INSTEAD NOTHING;
```

### 8. Input Validation

```
Every incoming request validated with Zod schemas:
  1. Type validation (string, enum, date, uuid, etc.)
  2. Length validation (min, max)
  3. Format validation (email, URL, regex)
  4. Custom validators (e.g., file extension)

Example:
  const parsed = updateObligationStatusSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const { status, notes } = parsed.data // Type-safe

Benefits:
  ✅ Catches malformed input before DB query
  ✅ Prevents SQL injection (Prisma parameterized queries)
  ✅ Prevents XSS (Node auto-escapes, React auto-escapes)
  ✅ Prevents CSRF (SameSite=Strict cookies)
```

---

## ERROR HANDLING STRATEGY

### Standard Error Response Format

```typescript
// 400: Bad Request (validation failed)
{
  error: "Validation failed",
  details: {
    status: ["Invalid enum value"]
  }
}

// 401: Unauthorized (auth failure)
{
  error: "Invalid or expired token",
  code: "INVALID_TOKEN"
}

// 403: Forbidden (insufficient permissions)
{
  error: "Insufficient permissions",
  required: "STARTER",
  current: "FREE"
}

// 404: Not Found
{
  error: "Organization not found"
}

// 429: Too Many Requests
{
  error: "Rate limit exceeded",
  retryAfter: 60
}

// 500: Internal Server Error
{
  error: "Internal server error"
  // Never leak stack trace to client
}
```

### Error Handling Rules

1. **Never expose stack traces** to client in production
2. **Always log errors** to Sentry for monitoring
3. **Use appropriate HTTP status codes** (400, 401, 403, 404, 429, 500)
4. **Consistent error JSON** across all endpoints
5. **Email enumeration prevention**: same response for existing/non-existing users
6. **No verbose error messages** that leak system implementation details

---

## AUDIT LOGGING

###Audit Event Types

```
AUTH_EVENTS:
  LOGIN_SUCCESS
  LOGIN_FAILURE
  LOGIN_FAILED_OTP_ATTEMPTS_EXCEEDED
  LOGOUT
  TOKEN_REFRESH

OBLIGATION_EVENTS:
  OBLIGATION_STATUS_UPDATED
  EVIDENCE_UPLOADED
  EVIDENCE_REMOVED
  OBLIGATION_FLAGGED_FOR_REVIEW
  OBLIGATION_VERSION_CHANGED

CIRCULAR_EVENTS:
  CIRCULAR_ACKNOWLEDGED
  CIRCULAR_DISPUTE_RAISED
  CIRCULAR_DISPUTE_RESOLVED
  CIRCULAR_TAGGED (admin only)

ORG_EVENTS:
  ORGANIZATION_CONFIGURED
  ORGANIZATION_UPDATED
  USER_INVITED
  USER_REMOVED
  PLAN_UPGRADED

ADMIN_EVENTS:
  ADMIN_OBLIGATION_CREATED
  ADMIN_OBLIGATION_UPDATED
  ADMIN_CIRCULAR_INGESTED
  ADMIN_DISPUTE_REVIEWED
```

### Query Audit Logs

```typescript
// Get all audit logs for org
const logs = await getAuditLogs(orgId)

// Get logs with filters
const logs = await getAuditLogs(orgId, {
  entityType: 'org_obligation',
  actionType: 'OBLIGATION_STATUS_UPDATED',
  userId: 'user-123',
  limit: 50,
  offset: 0
})

// Response:
{
  logs: [
    {
      id: uuid,
      orgId: uuid,
      userId: uuid,
      actionType: 'OBLIGATION_STATUS_UPDATED',
      entityType: 'org_obligation',
      entityId: uuid,
      metadata: { previousStatus: 'Not Started', newStatus: 'Met' },
      timestamp: Date,
      ipAddress: '203.0.113.42',
      userAgent: 'Mozilla/5.0...'
    }
  ],
  total: 142,
  hasMore: true
}
```

---

## DATABASE SEEDING

### Seed Scripts (TODO)

```typescript
// prisma/seed/obligations.ts
// Load 60+ CBN obligations into master Obligation table

const obligations = [
  {
    id: uuid(),
    title: 'Monthly Settlement Report',
    description: 'PSPs must file monthly settlement reports...',
    legalSource: 'CBN Circular 2024/08',
    category: 'REPORTING',
    licenseTypes: ['PSP', 'MMO'],
    activityFlags: ['PAYMENTS'],
    frequency: 'MONTHLY',
    deadlineLogic: {
      frequency: 'Monthly',
      anchor: 'month_end',
      offsetDays: 10,
      offsetDirection: 'after',
      businessDaysOnly: true
    },
    evidenceRequired: [
      {
        docType: 'Settlement Report',
        description: 'Monthly settlement report filed with CBN',
        mandatory: true,
        acceptedFormats: ['PDF', 'XLSX'],
        maxAgeMonths: 1
      }
    ],
    severity: 'CRITICAL',
    lastUpdated: new Date('2025-03-08')
  },
  // ... 59 more obligations
]

// prisma/seed/circulars.ts
// Load 24 months of CBN circulars

const circulars = [
  {
    id: uuid(),
    title: 'Guidelines on Consumer Protection in Digital Financial Services',
    summary: 'New CBN guidelines for consumer protection...',
    date: new Date('2024-01-15'),
    affectedLicenseTypes: ['PSP', 'MMO'],
    affectedObligationIds: [/* obligation UUIDs */],
    urgency: 'HIGH',
    taggingConfidence: 'HIGH',
    publishedAt: new Date('2024-01-15')
  },
  // ... 23 months of circulars
]
```

### Seed Execution

```bash
cd apps/web
npx prisma db seed
# Populates:
#   - 60+ obligations (with versions)
#   - 24 months of circulars
#   - Initial Vytaniq admin user
```

---

## NEXT STEPS

### Phase 1: Backend (In Progress)

- [x] Database schema (Prisma) with versioning + audit log
- [x] Core utility libraries (JWT, OTP, S3, scoring, etc.)
- [x] Middleware (auth, RBAC, plan tier)
- [x] Validation schemas (Zod)
- [x] Auth API routes (register, verify-OTP, login, refresh)
- [ ] Remaining API routes (obligations, circulars, calendar, readiness, admin)
- [ ] Database migrations + seeding
- [ ] Scheduled jobs (AWS EventBridge + Lambda)
- [ ] Rate limiting (Redis)
- [ ] Error handling + logging (Sentry)
- [ ] API documentation (OpenAPI/Swagger)

### Phase 2: Frontend (Next)

- [ ] Landing page
- [ ] Auth pages (register, login, OTP verify)
- [ ] Onboarding flow (4 steps)
- [ ] Dashboard (6 widgets)
- [ ] Obligation tracking UI
- [ ] Circular tracker UI
- [ ] Calendar view
- [ ] Readiness score breakdown

### Phase 3: Deployment & QA

- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Security audit
- [ ] Performance testing (Lighthouse)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Penetration testing
- [ ] Closed beta (3-5 PSPs)
- [ ] Public launch

---

**Document Status:** Ready for Backend Route Implementation  
**Last Updated:** March 8, 2026  
**Next Task:** Generate remaining API routes (obligations, circulars, calendar, readiness, admin)
