 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 PRODUCT REQUIREMENTS DOCUMENT
Vytaniq
Compliance Intelligence Platform for Nigerian PSP Startups
Version: 1.0 — Phase 1 MVP
Date: March 2025
Status: Draft — For Internal Review
Author: Product Team
Stakeholders: Engineering, Legal, BD, Design
Executive Summary
Vytaniq is a compliance intelligence platform built specifically for Nigerian Payment Service Provider (PSP) startups operating under CBN licensing. Phase 1 delivers a structured compliance control panel — a single source of truth that maps each startup's regulatory obligations, tracks submission deadlines, surfaces circular impacts, and scores investor readiness. The goal is to acquire 10–30 PSP startups, collect workflow data, and establish the foundation for automated compliance execution and sector-wide intelligence in Phases 2 and 3.
   © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 1. Product Context & Problem Statement
1.1 The Nigerian PSP Regulatory Landscape
Nigerian PSPs operate under a complex, evolving regulatory environment governed primarily by the Central Bank of Nigeria (CBN). Key licenses include the Payment Service Provider (PSP) License, the Mobile Money Operator (MMO) License, the Switching & Processing License, and NFIU (Nigeria Financial Intelligence Unit) reporting obligations.
Regulations are communicated via circulars, guidelines, frameworks, and exposure drafts — many of which arrive without structured timelines or indexed repositories. This creates acute compliance risk for early-stage startups that lack dedicated compliance officers or legal infrastructure.
1.2 The Core Problem
     Pain Points by Stakeholder
 Founders / CEOs
Don't know what regulations apply to their specific license tier; operate reactively
Compliance Officers
No centralized system to track obligations, deadlines, and circular impact across teams
Investors / VCs
Cannot quickly assess compliance maturity of portfolio companies or targets
Legal Advisors
Repeatedly rebuild the same obligation maps for similar license types; no reusable framework
Regulators (CBN)
Industry has inconsistent interpretation of the same circular across PSPs
         1.3 The Opportunity
There is no purpose-built compliance management product for Nigerian fintech startups. Existing tools are either generic GRC platforms (expensive, complex, not Nigeria-specific) or manual spreadsheet approaches (error-prone, non-auditable, not scalable). Vytaniq fills this gap with a vertically focused, regulation-native product.
 © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 2. Product Vision & Roadmap
Vytaniq is built in three phases that compound on each other:
       Phas e
Name
Key Features
Success Metric
Phas e1
Compliance Control Panel
Obligation mapping, circular tracking, deadline calendar, compliance checklist, readiness score
10–30 PSP startups onboarded; workflow data collected
Phas e2
Execution Infrastructure
Auto-generated report templates, pre-filled filings, evidence vault, calendar-triggered builder, audit packages
70% of reports generated (not just tracked) within platform
Phas e3
Compliance Intelligence
Benchmarking, risk pattern analytics, investor due diligence reports, ecosystem risk scoring, sector insights
Revenue from intelligence products sold to investors, regulators, and enterprises
       2.1 Phase 1 Focus (This Document)
This PRD covers Phase 1 only: the Structured Compliance Mapping Layer. It answers the question: What does my startup need to do, when, and how exposed are we right now?
• Obligation clarity — what CBN requires, by license type
• Circular impact clarity — how new circulars affect current compliance posture
• Compliance tracking — what has been completed vs. outstanding
• Readiness scoring — investor and auditor readiness in a single number
 © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 3. Target Users
     Primary User Personas
 Persona
Description
Compliance Lead
Series A–B PSP with 1–3 person compliance team; needs structured tracking and audit trail
Founder / CEO
Pre-Series A PSP; doubles as compliance lead; needs clarity, not complexity
Investor (Observer)
VC/PE firm monitoring portfolio compliance health; needs dashboard read access
External Legal Advisor
Counsel supporting PSP on CBN matters; needs obligation map and circular log
           Target Companies
 License Type
PSP, MMO, Switching & Processing, Payment Solution Service Provider
Stage
Seed to Series B (primary); Pre-seed with CBN license (secondary)
Size
5–200 employees; revenue ₦50M–₦5B annually
Geography
Nigeria-licensed entities; operations nationwide
Tech Maturity
Have product-market fit; need compliance infrastructure before scale
Compliance Staff
0–5 dedicated compliance personnel (primary pain point range)
             © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 4. Feature Specifications & User Flows
The Phase 1 product comprises six core modules. Each module is described below with user flow, technical requirements, and acceptance criteria.
4.1 Onboarding & License Configuration
4.1.1 User Flow
         #
Actor
Trigger
Action
System
Output
1
User
Lands on /register
Enters company name, email, password
Auth service creates account; sends OTP email
Account created
2
User
Verifies OTP
Enters 6-digit code
OTP verified; session token issued; redirect to /onboarding
Authenticated session
3
User
/onboarding Step 1
Selects CBN license type(s)
License schema loaded; obligation set queried
License profile draft
4
User
Step 2
Enters license number, issue date, renewal date
License metadata stored; renewal reminder queued
License record created
5
User
Step 3
Configures business activities (payments, lending, FX)
Activity flags cross-referenced against regulation matrix
Regulation scope determined
6
User
Step 4
Uploads existing compliance artifacts (optional)
File stored in S3; pre-populates compliance checklist
Baseline compliance score generated
7
System
Onboarding complete
Auto-generates obligation list and compliance dashboard
Regulation engine maps license + activities to obligations
Dashboard populated; user redirected to /dashboard
              4.1.2 Technical Requirements
    Onboarding — Technical Specs
  Auth
Email/password + OTP (Twilio or Sendgrid); JWT session; refresh tokens (7d)
   © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
     License Schema
PostgreSQL table: license_types, activity_flags, regulation_matrix (many-to-many)
File Upload
AWS S3 + presigned URLs; max 25MB per file; PDF, DOCX, XLSX accepted
Obligation Engine
Rule-based query on regulation_matrix: license_type + activity_flags → obligation IDs
Onboarding Steps
Multi-step form with progress bar; step state persisted server-side (resumable)
Data Validation
License number format validated against CBN format regex; date picker with future-date enforcement for renewal
       4.2 Compliance Dashboard
4.2.1 Overview
The dashboard is the primary interface. It gives the user a real-time view of their compliance posture across all four dimensions: obligations, reports, deadlines, and readiness.
4.2.2 Dashboard Modules
    Dashboard Widgets
 Readiness Score Card
0–100 score with breakdown: Obligations met, Reports submitted, Circulars acknowledged, Evidence uploaded
Obligation Map
Categorized list of all regulatory obligations applicable to this company; status: Met / Partial / Not Started / At Risk
Upcoming Deadlines
Calendar-style view of report submissions, license renewals, and circular response deadlines; color-coded by urgency (7d / 30d / 90d+)
Circular Alerts
Latest CBN circulars; impact tag per circular: 'Applies to you' / 'Monitor' / 'Not applicable'
Compliance Progress
Bar chart of completed vs. total obligations per category (KYC, AML, Reporting, Governance, Technology)
Risk Flags
List of items that could attract CBN sanction: missed reports, unacknowledged circulars, expired documents
          4.2.3 User Flow — Dashboard Interaction
        #
Actor
Trigger
Action
System
Output
1
User
Loads /dashboard
Views summary widgets
Queries obligations,
Populated dashboard
     © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
  #
         2
3
4
5
6
Actor Trigger Action System Output
User
User
User
User
System
Clicks obligation item
Clicks 'Mark Complete'
Clicks circular alert
Clicks 'Acknowledge'
Deadline within 7 days
Opens obligation detail panel
Submits completion + evidence upload
Opens circular summary + impact analysis
Acknowledges circular relevance
Triggers in-app notification + email
reports, deadlines, circulars for org_id
Loads regulation source, CBN legal reference, required actions
Updates obligation status; recalculates readiness score; logs audit entry
Loads pre-analyzed circular data; shows affected obligations
Logs acknowledgment with timestamp and user ID
Notification service; email via Sendgrid
Obligation detail view
Score updates; obligation marked green
Impact detail view
Circular marked acknowledged; risk flag cleared
User alerted
          4.3 Obligation Registry
4.3.1 What It Is
The Obligation Registry is Vytaniq's core database layer. It is a structured, human-curated catalog of every CBN regulation applicable to Nigerian PSPs, organized by license type and tagged to specific legal instruments (circulars, guidelines, frameworks).
4.3.2 Data Model
    Obligation Record Schema
 obligation_id
UUID primary key
title
Short obligation name (e.g., 'Monthly Settlement Report')
description
Full plain-English description of what is required
legal_source
CBN instrument reference (circular number, guideline name, section)
category
Enum: KYC | AML | Reporting | Governance | Technology | Consumer Protection | Capital
          © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
     license_types
Array of applicable license types (PSP, MMO, Switching, etc.)
activity_flags
Array of business activities that trigger this obligation
frequency
Enum: One-time | Monthly | Quarterly | Annual | Event-triggered
deadline_logic
JSON rule for computing next deadline (e.g., '10 business days after quarter end')
severity
Enum: Critical | High | Medium | Low (regulatory consequence level)
evidence_required
List of document types that satisfy this obligation
status_options
Met | Partial | Not Started | At Risk | Waived
last_updated
Timestamp of last content review by Vytaniq legal team
            4.3.3 User Flow — Obligation Detail
        #
Actor
Trigger
Action
System
Output
1
User
Clicks obligation in list
Opens obligation detail panel (slide-over)
Fetches obligation record + company's current status
Detail panel rendered
2
User
Reads requirement
Reviews legal source, description, evidence requirements
Renders markdown description; hyperlinks to CBN source document
User understands obligation
3
User
Clicks 'Upload Evidence'
Uploads supporting document
S3 upload; file linked to obligation_id + org_id; metadata logged
Evidence attached
4
User
Clicks 'Mark as Met'
Confirms completion
Status updated; audit log entry created; readiness score recalculated
Obligation marked complete
5
User
Clicks 'Flag for Review'
Adds internal note; assigns to team member
Task record created; email notification sent to assignee
Internal review task created
           4.4 Circular Tracker
4.4.1 Overview
 © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 CBN issues circulars, exposure drafts, and policy directives on an irregular basis. Many PSPs miss these or fail to assess their compliance impact. The Circular Tracker ingests CBN publications and delivers company-specific impact assessments.
4.4.2 Data Sourcing (Phase 1)
Phase 1: Vytaniq's internal legal team manually ingests and tags circulars from the CBN website on a weekly basis. Phase 2 will introduce automated scraping. Each circular is tagged with: affected license types, affected obligations, urgency level, response deadline (if any), and a plain-English impact summary.
4.4.3 User Flow — Circular Processing
        #
Actor
Trigger
Action
System
Output
1
Legal Team
CBN publishes circular
Ingests circular into admin CMS; tags metadata
Admin panel (internal); circular record created in DB
Circular published in platform
2
System
Circular published
Runs impact matching against all org license profiles
Queries which orgs have matching license_type + activity_flags
Relevance tags assigned per org
3
System
Impact match found
Creates circular alert per org; sends email notification
Notification service + email queue
'New Circular Affects You' notification
4
User
Opens notification
Views circular summary + impact breakdown
Renders circular detail: title, date, summary, affected obligations
Impact understood
5
User
Reviews impact
Acknowledges or disputes relevance
If acknowledged: logs timestamp + user; If disputed: creates review task for Vytaniq legal team
Acknowledgment logged
6
User
Action required
Views linked obligations that need updating
Circular auto-links to affected obligation_ids in company's obligation list
Actionable obligation list
            4.5 Regulatory Reporting Calendar
4.5.1 Overview
 © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 Nigerian PSPs must submit periodic reports to CBN across multiple functions: AML/CFT, Settlement, Operations, Consumer Complaints, Capital Adequacy, and more. Missing these reports is a primary source of CBN sanctions. The Reporting Calendar surfaces every upcoming deadline with status and actions.
4.5.2 User Flow — Calendar
        #
Actor
Trigger
Action
System
Output
1
System
Onboarding complete
Auto-populates calendar with all report deadlines for org's license type
Computes deadlines from obligation deadline_logic rules; generates recurring entries
12-month report calendar created
2
User
Opens /calendar
Views monthly/list view of all upcoming reports
Renders calendar with color-coded entries: Green (submitted) / Yellow (due soon) / Red (overdue)
Full deadline visibility
3
System
30 days before deadline
Sends email reminder + in-app notification
Scheduled job queries upcoming deadlines; triggers notification service
Reminder sent
4
System
7 days before deadline
Sends urgent reminder; adds to Risk Flags on dashboard
Escalated notification; risk flag record created
Urgent alert visible
5
User
Report submitted to CBN
Marks report as submitted; uploads confirmation
Report status updated to 'Submitted'; evidence attached; audit log entry
Calendar entry turns green
6
User
Clicks report entry
Opens report detail with CBN template reference and instructions
Renders report metadata: template link, CBN submission channel, contacts
User prepared to file
            4.6 Readiness Score Engine
4.6.1 Overview
The Readiness Score is a 0–100 composite metric that summarizes a company's compliance health. It is designed to be meaningful to both internal teams (what to fix) and external observers (investors, auditors, acquirers).
 © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 4.6.2 Scoring Methodology
    Readiness Score Components
 Component
Weight | Description
Obligation Coverage
35% — % of applicable obligations with status 'Met' or 'Partial'
Report Submission Rate
30% — % of periodic reports submitted on time in the trailing 12 months
Circular Acknowledgment
15% — % of applicable CBN circulars acknowledged within 14 days
Evidence Vault Completeness
10% — % of obligations with at least one evidence document uploaded
License Currency
10% — License not expired; renewal initiated with >60 days to expiry
              Readiness Score Bands
 85–100
Investor Ready — Suitable for due diligence; strong compliance posture
70–84
Audit Ready — Can pass CBN examination with minor preparation
50–69
Work Required — Material gaps; targeted remediation needed
Below 50
At Risk — High likelihood of CBN inquiry or sanction; urgent action required
       4.6.3 User Flow — Score Drill-Down
        #
Actor
Trigger
Action
System
Output
1
User
Clicks score card
Opens score breakdown modal
Fetches score component data for org_id
Breakdown by component rendered
2
User
Clicks component
Views specific gaps within that component
Lists unmet obligations / missing reports / unacknowledged circulars
Actionable gap list
3
User
Clicks 'Improve Score'
Opens prioritized action list
Ranks actions by score impact (highest-leverage first)
Score improvement roadmap
         © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
  #
  Actor Trigger Action System Output
        4
User
Clicks 'Generate Investor Report'
Requests PDF snapshot of compliance posture
Generates PDF with score, breakdown, obligation summary, circular log (Phase 1: basic PDF; Phase 2: full package)
Downloadable compliance snapshot
  © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 5. Technical Architecture
5.1 System Architecture Overview
   Architecture Components
 Layer
Technology / Service
Frontend
React + TypeScript (Next.js); Tailwind CSS; hosted on Vercel
Backend API
Node.js + Express (or NestJS); REST API; hosted on AWS (ECS Fargate)
Database
PostgreSQL (primary data store); Redis (sessions + caching); hosted on AWS RDS
File Storage
AWS S3 (evidence vault, documents); presigned URL access pattern
Auth
JWT + refresh tokens; Sendgrid OTP; optional SSO (Google OAuth) in Phase 1.1
Notifications
Sendgrid (email); in-app via WebSocket or polling; SMS (Termii) for critical deadlines
Scheduled Jobs
AWS EventBridge + Lambda for deadline reminders, score recalculation, circular ingestion
Admin CMS
Internal Next.js admin panel for Vytaniq legal team to manage obligations and circulars
PDF Generation
Puppeteer or PDF-lib for readiness report snapshots
CDN
CloudFront for static assets; edge caching for public obligation content
Monitoring
Sentry (error tracking); Datadog (infrastructure); PostHog (product analytics)
                     5.2 Database Schema (Key Tables)
    Core Tables
 organizations
org_id, name, license_types[], activity_flags[], created_at, plan_tier
users
user_id, org_id, email, role (admin|member|observer), last_login
obligations
obligation_id, title, description, legal_source, category, license_types[], frequency, deadline_logic, severity, evidence_required[]
       © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
     org_obligations
org_obligation_id, org_id, obligation_id, status, evidence_urls[], completed_at, completed_by, audit_log[]
circulars
circular_id, title, date, summary, affected_license_types[], affected_obligation_ids[], urgency, source_url, published_at
org_circulars
org_circular_id, org_id, circular_id, relevance_tag, acknowledged_at, acknowledged_by, disputed
report_calendar
entry_id, org_id, obligation_id, due_date, submitted_at, submission_evidence_url, status
readiness_scores
score_id, org_id, computed_at, total_score, component_scores{}, score_band
audit_logs
log_id, org_id, user_id, action_type, entity_type, entity_id, timestamp, metadata{}
         5.3 API Endpoints (Phase 1)
  REST API Endpoints
 POST /auth/register
Create account; issue OTP
POST /auth/verify-otp
Verify OTP; issue JWT
POST /onboarding/complete
Submit license profile; trigger obligation engine
GET /dashboard/:org_id
Aggregate dashboard data
GET /obligations/:org_id
Full obligation list with status
PATCH /obligations/:org_id/:obligation_id
Update status, upload evidence
GET /circulars/:org_id
Circulars with org-specific relevance tags
PATCH /circulars/:org_id/:circular_id/ackn owledge
Log acknowledgment
GET /calendar/:org_id
Report deadline calendar
PATCH /calendar/:org_id/:entry_id/submit
Mark report submitted
GET /readiness/:org_id
Current readiness score + component breakdown
POST /readiness/:org_id/report
Generate PDF readiness snapshot
GET /admin/obligations
(Internal) Full obligation registry management
POST /admin/circulars
(Internal) Publish new circular
                         © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 6. Regulatory Content Strategy
Vytaniq's defensibility is rooted in the quality and currency of its regulatory content. The obligation registry and circular database must be accurate, structured, and continuously maintained.
     Content Maintenance Plan
 CBN Circular Monitoring
Dedicated legal analyst monitors CBN website 3x/week; all circulars ingested within 48 hours of publication
Obligation Validation
Obligation registry reviewed quarterly by a Nigerian fintech legal advisor; changes versioned in DB
Legal Review SLA
All content reviewed by at least one qualified Nigerian fintech attorney before publication
Source Referencing
Every obligation linked directly to the CBN legal instrument (circular number, section reference, date)
Plain-English Summaries
All regulatory content translated into operator-friendly language without losing legal accuracy
CBN Contact Directory
Maintained list of CBN submission channels, contacts, and format requirements per report type
Circular History
Full archive of all ingested circulars; PSPs can query historical circulars affecting prior periods
            6.1 Initial Obligation Scope (Phase 1 Launch)
The Phase 1 obligation registry will cover the following CBN-governed areas at launch:
• KYC/CDD — Customer identification, verification, and enhanced due diligence requirements
• AML/CFT — Transaction monitoring, suspicious transaction reporting, NFIU filing requirements
• Periodic Reporting — Monthly, quarterly, and annual CBN statutory returns
• Consumer Protection — Dispute resolution, complaint response timelines, disclosure
requirements
• Capital & Financial — Minimum capital requirements, capital adequacy ratios, financial statements
• Governance — Board composition, compliance officer designation, policy documentation
• Technology — Business continuity requirements, data localization, cybersecurity frameworks
• Licensing — License renewal timelines, change-of-control notification requirements
 © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 7. Non-Functional Requirements
     NFR Specifications
 Performance
Dashboard load: <2s on 4G; API P95 response: <500ms; File upload: <5s for 10MB
Availability
99.5% uptime SLA; maintenance windows during off-peak hours (2AM–4AM WAT)
Security
SOC 2 Type II target (Phase 2); AES-256 encryption at rest; TLS 1.3 in transit; RBAC; MFA available
Data Residency
All data stored in AWS af-south-1 (Cape Town) or eu-west-1 (Ireland) by default; Nigeria region planned Phase 2
Compliance (Meta)
NDPR (Nigeria Data Protection Regulation) compliant; data processing agreement available
Scalability
Architecture supports 500 concurrent users at Phase 1; 5,000 at Phase 2
Audit Trail
Every data mutation logged with user ID, timestamp, and previous value; immutable audit log
Backup
Database backup every 6 hours; 30-day retention; point-in-time recovery enabled
Accessibility
WCAG 2.1 AA target for all core user flows
Browser Support
Chrome 90+, Firefox 88+, Safari 14+, Edge 90+; mobile responsive
                 © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 8. Go-To-Market & Success Metrics
8.1 Acquisition Strategy (Phase 1 Goal: 10–30 PSPs)
   Acquisition Channels
 Channel
Approach
Fintech Associations
Direct partnerships with Fintech Association of Nigeria (FintechNGR), Nigeria Inter-Bank Settlement System (NIBSS) network
CBN License Events
Presence at CBN stakeholder forums; present Vytaniq as a compliance enabler (not a challenger)
VC Portfolio Outreach
Partner with 3–5 Nigeria-focused VCs (Ventures Platform, TLcom, Founders Factory Africa) to offer compliance health checks to portfolio PSPs
Compliance Communities
LinkedIn and WhatsApp groups for Nigerian fintech compliance officers; content marketing with obligation checklists
Referral Program
Existing PSP customers refer others; both get 2 months free; tracked via referral codes
Cold Outbound
Target PSPs with CBN license issued in last 24 months (public CBN license registry); offer free readiness assessment
              8.2 Pricing Model
    Phase 1 Pricing
 Tier
Price & Inclusions
Free (Freemium)
1 user; obligation registry view-only; no tracking, no calendar, no score — conversion tool
Starter
₦150,000/month (≈ $100 USD): Up to 3 users; full dashboard; obligation tracking; circular alerts; basic readiness score
Growth
₦350,000/month (≈ $230 USD): Up to 10 users; full dashboard; evidence vault; team assignment; audit trail; investor readiness report PDF
Enterprise
Custom pricing: Unlimited users; multi-entity; priority legal review; dedicated compliance success manager; API access (Phase 2)
          © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 8.3 Phase 1 Success Metrics
    KPIs — Phase 1 (0–12 months)
 Acquisition
10–30 paying PSP companies onboarded
Activation
80%+ complete full onboarding (license profile + first obligation marked) within 7 days
Engagement
Weekly Active Usage: 60%+ of accounts (defined as at least one status update or circular acknowledgment/week)
Retention
Month 3 retention: 75%+
Revenue
₦5M–₦15M ARR by month 12 (with 15–30 companies on Starter/Growth)
Workflow Data
Sufficient obligation completion data from 10+ PSPs to train Phase 2 automation templates
NPS
Net Promoter Score ≥40 at month 6
Circular Coverage
100% of CBN circulars ingested within 48 hours of publication
              © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 9. Team, Timeline & Execution Plan
9.1 Phase 1 Build Timeline
   Engineering Milestones
 Week 1–2
Infrastructure setup; DB schema design; auth system; obligation registry data model
Week 3–4
Obligation registry seeding (initial 60+ obligations); admin CMS for legal team
Week 5–6
Onboarding flow (license configuration, activity flags, obligation engine)
Week 7–8
Dashboard — obligation list, status tracking, evidence upload
Week 9–10
Circular tracker — ingestion pipeline, impact matching, notification system
Week 11–12
Reporting calendar — deadline computation, reminder system, submission tracking
Week 13
Readiness score engine + PDF snapshot generator
Week 14
QA, security review, performance testing
Week 15
Closed beta: 3–5 friendly PSPs; feedback collection
Week 16
Bug fixes, UX refinement, onboarding optimization
Week 17–18
Public launch; GTM activation; first 10 paying customers target
                    9.2 Team Requirements
    Team Composition (Phase 1)
 Role
Responsibility
Product Manager
PRD ownership; user research; GTM coordination; stakeholder alignment
Lead Engineer (Full-stack)
Architecture; backend API; obligation engine; database design
Frontend Engineer
Dashboard UI; onboarding flow; circular tracker UI; calendar; responsive design
Legal Analyst (Nigeria Fintech)
Obligation registry curation; circular ingestion and tagging; content accuracy
Design (UX/UI)
Dashboard UX; onboarding flow; component library; readiness score visualization
           © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
    BD / Sales
 PSP outreach; VC partnership; association relationships; customer success (first 10)
   © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 10. Risks & Mitigations
     Risk Register
 Risk
Likelihood | Mitigation
CBN regulations change faster than content team can update
High | Weekly monitoring cadence; version history; auto-flag when obligation_source circular is superseded
PSPs reluctant to upload compliance evidence to third party
Medium | Local encryption; SOC 2 roadmap communicated upfront; optional evidence fields (score still computed without upload)
Circular impact assessment is inaccurate (false relevance)
Medium | Human legal review on all circulars; PSP can dispute relevance; feedback loop to legal team
Low willingness to pay (PSPs expect free compliance resources)
Medium | Freemium tier for acquisition; ROI framing ('avoid ₦10M CBN fine for ₦150K/month'); investor readiness angle
Key competitor enters market (generic GRC tool customizes for Nigeria)
Low | Moat is depth of Nigerian-specific content + network effects from multi-PSP data (Phase 3)
Readiness score methodology challenged by CBN
Low | Score is explicitly a Vytaniq internal assessment tool, not a CBN endorsement; disclaimer on all score outputs
Technical debt from rapid build prevents Phase 2 automation
Medium | Phase 1 schema designed for Phase 2 extensibility; obligation and report data models built to support template generation
              © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 11. Phase 2 & 3 Preview
11.1 Phase 2: Execution Infrastructure
Building on the workflow data collected in Phase 1, Phase 2 transforms Vytaniq from a compliance tracker into a compliance executor. The pivot: from 'Report Due' to 'Report Generated.'
• Auto-generated report templates pre-filled with company data
• Calendar-triggered report builder with collaborative editing
• Evidence vault with structured document management and version control
• Audit-ready report packaging (full filing bundle per submission)
• CBN submission integration (where API or structured channels exist)
• Structured export formats (PDF, XLSX, JSON) for external counsel and auditors
11.2 Phase 3: Compliance Intelligence
With multiple PSPs on the platform, Vytaniq becomes the most data-rich compliance intelligence provider in Nigerian fintech. Phase 3 monetizes this data layer.
• Compliance benchmarking: How does your PSP compare to peers by license type and size?
• Risk pattern analytics: Which obligations are most commonly failed and why?
• Investor due diligence reports: Standardized compliance health assessment for VCs and PEs
• Ecosystem risk scoring: Sector-wide compliance risk index sold to regulators and financial institutions
• Regulatory intelligence subscription: Early-warning system for incoming CBN policy shifts
END OF DOCUMENT
Vytaniq — Phase 1 PRD v1.0 — March 2025
   © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 APPENDIX A
Risk Implementation Specifications
The Risk Register in Section 10 identifies seven risks and states mitigations at a high level. This appendix converts each mitigation into a buildable specification — concrete features, data models, user flows, and engineering rules that must be implemented during Phase 1 to prevent each risk from materialising. These are not optional enhancements; they are pre-conditions for a stable, trustworthy Phase 1 product.
  © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 A1 CBN Regulations Change Faster Than the Content Team Can Update
Risk Level: High | Without this spec: obligation data becomes stale; PSPs trust wrong deadlines; legal liability.
A1.1 Obligation Versioning System
Every obligation record must support full version history. When the Vytaniq legal team edits an obligation (because CBN changed the requirement), the old version is not overwritten — it is archived and a new version is created. This allows PSPs to see what changed, when, and why.
     Obligation Version Schema
 obligation_version_id
UUID — unique ID for this version of the obligation
obligation_id
FK — parent obligation this version belongs to (stable across versions)
version_number
Integer — auto-increments on each edit (v1, v2, v3...)
change_type
Enum: Created | Requirement_Updated | Deadline_Changed | Severity_Changed | Deprecated | Reinstated
change_summary
Plain-English description of what changed (e.g., 'CBN Circular 2025/03 extended deadline from 5 to 10 business days')
changed_by
Internal admin user ID (Vytaniq legal team member)
changed_at
Timestamp of the change
effective_from
Date from which this version applies to PSPs
source_circular_id
FK to the CBN circular that triggered this change (nullable)
previous_version_id
FK to prior version record (nullable for v1)
is_current
Boolean — true for the active version; false for all archived versions
                  A1.2 PSP Impact Notification Flow
When an obligation version changes, every PSP whose obligation status is affected must be notified automatically. The system must also re-evaluate whether previously 'Met' obligations are still valid under the new version.
        #
Actor
Trigger
Action
System
Output
 1
Legal Admin
Edits obligation in admin CMS
Submits change with change_type, change_summary,
New obligation version record created; is_current
New version live in DB
     © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
  #
         2
3
4
5
6
Actor Trigger Action System Output
System
System
System
User
User
New obligation version created
Impact list generated
Status downgraded
Opens notification
Reviews evidence gap
effective_from date, and optional source circular
Runs impact assessment across all orgs
Evaluates whether existing 'Met' evidence still satisfies new version requirements
Sends in-app alert + email to compliance lead for each affected org
Views side-by-side diff of old vs. new obligation requirement
Uploads new evidence or confirms existing evidence still applies
set to true on new; false on previous; changelog entry written
Queries all org_obligations where obligation_id matches AND status = 'Met'; flags each for re-validation
Compares evidence_required [] on new version vs. uploaded evidence types; if gap found, status downgraded to 'Needs Review'
Notification: '[Obligation Name] has been updated by CBN. Your current evidence may need to be refreshed. Review by [effective_from date].'
Renders change_summary + diff view of changed fields (requirement text, deadline_logic, evidence_required )
If confirmed: status stays Met with audit log note. If new evidence uploaded: status updated to Met with new evidence.
List of affected org_obligations generated
Affected obligations set to 'Needs Review'
PSP alerted before effective date
User understands exactly what changed
Obligation re-validated under new version
          A1.3 Engineering Rules — Must Be Built Into Phase 1 Schema
 © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
     Obligation Versioning Engineering Rules
 Rule 1
NEVER UPDATE obligation records in-place. All changes must create a new version record. The obligation_id is immutable; only version records change.
Rule 2
org_obligations table must store obligation_version_id (not just obligation_id) so the system always knows which version of the obligation a PSP's status refers to.
Rule 3
The admin CMS must enforce: change_summary is required before any obligation edit can be saved. No silent updates.
Rule 4
effective_from must always be set to a future date (minimum 7 days from change). No retroactive obligation changes that could incorrectly invalidate past submissions.
Rule 5
Deprecated obligations must remain visible in PSP dashboards with a 'Superseded' badge and a link to the replacement obligation. They must not be deleted.
Rule 6
The Circular Tracker module must include a field: affected_obligation_ids[]. When a circular is ingested, the legal team must tag which obligations it affects. This creates the auto-flag chain described in the Risk Register.
           © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 A2 PSPs Reluctant to Upload Compliance Evidence to a Third Party
Risk Level: Medium | Without this spec: early adopters refuse to upload evidence; score remains hollow; vault is unused.
A2.1 Encryption Implementation Spec
     Evidence Encryption Requirements
 At-Rest Encryption
AES-256 encryption on all S3 buckets storing evidence files. Use AWS S3 Server-Side Encryption (SSE-S3 or SSE-KMS). Must be enforced via S3 bucket policy — unencrypted uploads must be rejected.
In-Transit Encryption
TLS 1.3 enforced for all API endpoints and file upload/download URLs. HTTP requests must be redirected to HTTPS. Presigned URLs must have maximum 15-minute expiry.
Key Management
Phase 1: AWS SSE-S3 (AWS-managed keys). Phase 2: Migrate to SSE-KMS with customer-managed keys (CMK) — allows key rotation and per-org key isolation on Enterprise plan.
Access Control
S3 buckets must be private with no public access. All file access must go through presigned URLs generated by the API after RBAC check. Direct S3 URLs must never be exposed to users.
Audit of File Access
Every presigned URL generation must log: user_id, org_id, evidence_id, timestamp, and action (view/download). This log must be immutable and queryable by the org admin.
         A2.2 Trust Communication — UI Specification
Trust must be built into the product UI at every point where evidence is requested — not buried in a privacy policy. The following UI elements are mandatory:
    Required Trust UI Elements
 Element
Placement | Copy
Encryption Badge
Shown on every file upload modal. Icon + text: 'Files encrypted with AES-256. Only your team can access them.'
Optional Evidence Banner
Shown on any obligation where evidence is not yet uploaded. Text: 'Evidence upload is optional. Your readiness score still updates without it. Uploading evidence unlocks full audit-ready status.'
       © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
     Data Deletion CTA
Accessible from Account Settings. Label: 'Delete All My Data'. On click: confirmation modal explaining what is deleted and that the action is irreversible. Must process within 30 days (NDPR requirement).
Data Export CTA
Accessible from Account Settings. Label: 'Export My Data'. Generates ZIP of all org data: obligation statuses, evidence files, circular logs, audit trail. Must process within 48 hours.
Privacy Policy Link
Shown in onboarding Step 1 before any data is collected. Must be accepted before proceeding. Policy must explicitly state: Vytaniq does not sell your data; evidence files are not shared with third parties without your consent.
SOC 2 Roadmap Disclosure
Shown in onboarding and on the Security settings page. Text: 'Vytaniq is currently undergoing SOC 2 Type II certification. Expected completion: [date]. View our current security practices here.'
      A2.3 Data Deletion & Portability — Engineering Rules
  Data Rights Engineering Rules
 Rule 1
Data deletion must cascade: deleting an org must queue deletion of all associated S3 files, DB records, audit logs, and notification preferences within 30 days.
Rule 2
Soft-delete pattern must be used for all org data: deleted_at timestamp set; data hidden from UI immediately; permanent deletion runs on a 30-day scheduled job.
Rule 3
Data export job must be asynchronous: user requests export; system queues job; sends download link by email when ready. Export must include a machine-readable JSON manifest of all data included.
Rule 4
No evidence file may be used in any anonymized aggregate analysis (Phase 3) without explicit per-org opt-in consent. Default is opted-out. Consent preference stored in org settings table.
          © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 A3 Circular Impact Assessment Is Inaccurate (False Relevance)
Risk Level: Medium | Without this spec: PSPs receive irrelevant alerts; alert fatigue sets in; trust in the core circular tracker erodes.
A3.1 Circular Dispute Flow — Full Specification
The Phase 1 PRD mentions PSPs can 'dispute relevance' but does not define this flow. Without a defined dispute mechanism, an incorrectly tagged circular stays on a PSP's dashboard indefinitely, damaging trust. This spec defines the complete dispute lifecycle.
     Circular Dispute Data Model
 dispute_id
UUID primary key
org_circular_id
FK — the org-specific circular relevance record being disputed
org_id
FK — the disputing organisation
raised_by
user_id of the person who raised the dispute
raised_at
Timestamp
reason
Text — user's explanation of why the circular is not relevant to their operations
status
Enum: Open | Under_Review | Resolved_Confirmed | Resolved_Withdrawn
reviewed_by
Internal Vytaniq legal team admin user_id (nullable until reviewed)
reviewed_at
Timestamp (nullable until reviewed)
resolution_note
Plain-English explanation of the outcome and reasoning
outcome
Enum: Relevance_Confirmed | Relevance_Withdrawn | Partial_Relevance
                          #
Actor
Trigger
Action
System
Output
1
User
Views circular alert they believe is irrelevant
Clicks 'Dispute Relevance' button on circular detail panel
Opens dispute modal with: reason text field, optional CBN source reference field, submit button
Dispute modal rendered
2
User
Submits dispute
Enters reason and submits
Dispute record created with status: Open;
User sees: 'Your dispute is under review. This
       © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
  #
         3
4
5
6
7
Actor Trigger Action System Output
System
Legal Admin
Legal Admin
System
System
Dispute created
Reviews dispute within 72 business hours
Decision made
Dispute resolved
Pattern of disputes on same circular
Alerts Vytaniq legal team via internal admin dashboard + email
Assesses whether circular genuinely applies to this PSP's license and activities
Selects outcome and writes resolution note
Notifies PSP of outcome with full explanation
Flags circular for global re-tagging review
org_circular relevance_tag updated to 'Disputed — Pending Review'; risk flag for this circular is paused (does not count against score during review)
Admin notification: org name, circular title, dispute reason, SLA deadline (72 business hours)
Admin panel shows: org license profile, activity flags, circular tagging rationale, PSP's dispute reason side by side
Dispute status updated; org_circular relevance_tag updated to match outcome; resolution_note stored
Email + in-app notification: outcome, resolution note, updated circular status. If Relevance_Withdr awn: circular removed from PSP's obligation list and score recalculated.
If 3+ orgs dispute the same circular's relevance tag, admin dashboard flags circular for bulk review of its
circular will not affect your score while we investigate.'
Legal team alerted within 5 minutes
Legal admin makes decision
Dispute resolved
PSP receives clear resolution
Systemic tagging errors caught and fixed
           © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
  #
A3.2 SLA & Quality Rules
  Actor Trigger Action System Output
       license_type targeting
      Circular Accuracy Engineering & Process Rules
 SLA Rule
All disputes must be resolved within 72 business hours of submission. The admin dashboard must show an SLA countdown per open dispute. Overdue disputes must escalate to a senior reviewer automatically.
Pause Rule
While a dispute is Open or Under_Review, the disputed circular must NOT count against the PSP's readiness score. The score must resume including it only if Relevance_Confirmed.
Tagging Quality Rule
Every circular published in the platform must include a 'Tagging Confidence' field set by the legal admin: High | Medium | Low. Low-confidence circulars must display a banner: 'Impact assessment pending full review — verify with your compliance advisor.'
Feedback Loop Rule
Dispute outcomes must feed back into the tagging logic. If Relevance_Withdrawn for a license_type, that license_type must be removed from the circular's affected_license_types[] globally — fixing the error for all PSPs, not just the disputing one.
Accuracy Metric
Internal KPI: circular false-relevance rate must be tracked monthly. Target: <5% of circular-org assignments result in a successful dispute.
          © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 A4 Low Willingness to Pay — Freemium Conversion Spec
Risk Level: Medium | Without this spec: free users never convert; revenue target is missed; acquisition
cost is not recovered.
A4.1 Feature Gate Architecture
The freemium plan must be designed to create genuine value for free users while making the limitation of the free tier felt — not frustrating. Every gate must show the user what they are missing and why it matters, not just a 'Upgrade to unlock' wall.
     Freemium Feature Gate Definitions
 Feature
Free | Starter | Growth | Enterprise
Obligation registry (view-only)
Yes — all tiers
Obligation status tracking (mark complete)
No — Starter+
Evidence upload per obligation
No — Starter+
Readiness score
No — Starter+ (Free users see a locked score preview with a range: 'Your score is likely 40–65')
Circular alerts (view)
Yes — 3 most recent only on Free
Circular acknowledgment + dispute
No — Starter+
Reporting calendar
No — Starter+ (Free sees a blurred calendar with deadline counts)
Risk flags dashboard
No — Starter+ (Free sees count only: 'You have 4 risk flags. Upgrade to view.')
Investor readiness PDF
No — Growth+
Team members (multi-user)
No — Starter (3 users), Growth (10), Enterprise (unlimited)
Evidence vault
No — Growth+
Audit trail
No — Growth+
                     A4.2 Conversion Trigger Flow
Conversion must be triggered by the user experiencing a specific, high-value moment — not by a generic upgrade prompt. The following are the four designed conversion moments:
        #
Actor
Trigger
Action
System
Output
 1
System
Free user tries to mark an obligation as complete
Shows feature gate modal
Modal: 'Obligation tracking is available on Starter and above.
Conversion moment 1 triggered
     © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
  #
         2
3
4
5
Actor Trigger Action System Output
System
System
System
System
Free user clicks on blurred readiness score
Free user views calendar tab
Free user has been on platform 14 days without upgrading
Free user clicks any CTA
Shows score preview + gate modal
Shows blurred calendar with deadline count
Sends lifecycle email
Lands on pricing page with plan comparison
Start tracking your compliance — from ₦150K/month.' CTA: 'Start Free Trial' or 'See Plans'
Modal shows score range: 'Based on your license type, Vytaniq estimates your readiness is between 35–55. Unlock your exact score and the actions to improve it.' CTA: 'Unlock My Score'
Banner: 'You have 7 CBN report deadlines in the next 90 days. Upgrade to see exact dates and get reminders.' CTA: 'See My Deadlines'
Email: Subject: 'A compliance update for [Company Name]' — Body: summarises 3 open risk flags and 2 upcoming deadlines (real data from their profile, partially obscured). CTA: 'See Your Full Risk Picture'
Pricing page pre-selects Starter as recommended; highlights the 3 features the user just tried to access; shows monthly and annual pricing;
Conversion moment 2 — highest urgency trigger
Conversion moment 3 triggered
Conversion moment 4 — personalised urgency email
Frictionless path to paid
          © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
  #
A4.3 Conversion Engineering Rules
  Actor Trigger Action System Output
       one-click checkout with Paystack
      Freemium Conversion Engineering Rules
 Rule 1
Feature gates must be enforced server-side (not just in the UI). API endpoints must check the org's plan_tier before returning gated data. A free user must never be able to access paid features by bypassing the frontend.
Rule 2
All four conversion moments must be tracked as analytics events in PostHog: gate_triggered, gate_cta_clicked, pricing_page_viewed, checkout_started, checkout_completed.
Rule 3
The blurred readiness score preview must be computed server-side (using a real scoring algorithm on available data) and must show a genuine range — not a fake number. Showing an artificially low score to pressure conversion is prohibited.
Rule 4
Lifecycle emails must use real data from the PSP's profile. Generic emails without personalisation must not be sent. If a free user has no obligation data yet (incomplete onboarding), send an onboarding completion nudge first.
Rule 5
A/B test the primary CTA copy: 'Start Free Trial' vs. 'Unlock My Score' vs. 'See My Deadlines'. Track conversion rate per variant from day one of launch.
          © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 A5 Readiness Score Methodology Challenged by CBN
Risk Level: Low (but High Impact if it occurs) | Without this spec: CBN issues a directive against Vytaniq;
PSPs face reputational risk from sharing the score.
A5.1 Legal Disclaimer Copy — Mandatory on All Score Outputs
The following disclaimer must appear in the exact contexts listed below. The copy must be approved by a Nigerian fintech legal advisor before Phase 1 launch and stored as a versioned content asset — not hardcoded in component code.
     Disclaimer Placement Rules
 Dashboard score card
Below the score number: 'The Vytaniq Readiness Score is an internal self-assessment tool based on your reported compliance activities. It does not constitute a CBN assessment, endorsement, or certification of regulatory compliance.'
Score drill-down modal
Top of modal before breakdown content: same disclaimer text as above.
Investor readiness PDF
Page 1 footer and a dedicated 'Methodology & Limitations' section at the end of the PDF. Limitations section must also state: 'This report is based on data self-reported by [Company Name] within the Vytaniq platform. Vytaniq has not independently verified the accuracy of the underlying data.'
Score share / export
Any exported or shared score must include the disclaimer embedded in the document — not just shown in the UI.
Onboarding (Step 4)
Before the first readiness score is displayed after onboarding: a one-time modal explaining what the score is and what it is not. User must click 'I Understand' to proceed.
         A5.2 Score Methodology Documentation
Vytaniq must publish a publicly accessible 'Score Methodology' page before launch. This page serves two purposes: it demonstrates intellectual transparency (making it harder for CBN to object), and it gives investors a reference point when evaluating shared scores.
    Score Methodology Page Requirements
 URL
vytaniq.com/methodology — publicly accessible without login
Contents
Full breakdown of the 5 scoring components and their weights; definition of each score band (Investor Ready / Audit Ready / Work Required / At Risk); statement of limitations; data sources used; update frequency; version number and last updated date
     © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
     Versioning
Every time the scoring methodology changes, the previous methodology must be archived at a versioned URL (e.g., /methodology/v1) so historical scores remain interpretable
Legal Review
Methodology page content must be reviewed by a Nigerian fintech attorney before publication and on each material change
   A5.3 CBN Engagement Protocol
  Proactive CBN Risk Mitigation
 Pre-Launch
Before public launch, send a briefing note to the relevant CBN department (Payments System Management) explaining what Vytaniq does, how the readiness score works, and that it is an internal self-assessment tool. Request informal feedback. Document the response.
No CBN Logo Usage
Vytaniq must never use the CBN logo, name, or any implication of CBN affiliation in its marketing, UI, or product without explicit written CBN approval.
Naming Rule
The score must always be referred to as the 'Vytaniq Readiness Score' — never as a 'CBN Compliance Score', 'Regulatory Compliance Score', or any name that could imply official regulatory endorsement.
Score Misrepresentation Policy
If Vytaniq becomes aware that a PSP is misrepresenting the score to regulators or counterparties as an official CBN assessment, Vytaniq reserves the right to suspend access. This must be written into the Terms of Service.
          © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 A6 Technical Debt from Rapid Build Prevents Phase 2 Automation
Risk Level: Medium | Without this spec: Phase 2's auto-fill engine requires a full data migration; Phase 1 obligation data is unusable for automation.
A6.1 Phase 2-Ready Field Definitions — Must Be Built in Phase 1
Phase 2's auto-fill engine depends entirely on three fields that must be populated correctly in Phase 1: deadline_logic, auto_fill_mappings, and evidence_required. These fields must be fully defined and populated for every obligation at Phase 1 launch — not left as empty placeholders.
     deadline_logic — Full JSON Specification
 Purpose
Enables Phase 2's calendar-triggered report builder to compute exact due dates without human input
Format
JSON object stored in the obligation record
Required Fields
frequency (Monthly/Quarterly/Annual/Event), anchor (quarter_end/month_end/license_anniversary/event), offset_days (business days after anchor), offset_direction (before/after), business_days_only (boolean)
Example — Monthly Report
{ "frequency": "Monthly", "anchor": "month_end", "offset_days": 10, "offset_direction": "after", "business_days_only": true }
Example — Annual Return
{ "frequency": "Annual", "anchor": "fiscal_year_end", "offset_days": 60, "offset_direction": "after", "business_days_only": false }
Example — Event-Triggered
{ "frequency": "Event", "trigger_event": "significant_transaction", "offset_days": 1, "offset_direction": "after", "business_days_only": true }
Validation Rule
The admin CMS must validate deadline_logic JSON against the schema before saving. Malformed logic must be rejected. All 60+ initial obligations must have this field populated before Phase 1 launch.
                auto_fill_mappings — Full JSON Specification
 Purpose
Tells Phase 2's report template engine exactly where to source the value for each field in a report — so PSPs don't have to re-enter data Vytaniq already holds
Format
JSON object: { field_id: { source_type, source_path, transform } }
     © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
     Source Types
org_profile (company name, CBN license number, address), license_data (license type, issue date, renewal date), prior_submission (last submitted value for this field), manual (user must enter this field — no auto-fill available), computed (calculated from other fields using a defined formula)
Example
{ "company_name": { "source_type": "org_profile", "source_path": "name" }, "license_number": { "source_type": "license_data", "source_path": "license_number" }, "reporting_period_end": { "source_type": "computed", "formula": "quarter_end_date" }, "total_transaction_value": { "source_type": "manual" } }
Phase 1 Requirement
Every CBN report template ingested into Phase 1 must have auto_fill_mappings populated for all fields where source_type is NOT manual. Fields with source_type: manual must be explicitly flagged — these are the fields Phase 2 will prioritise for data integration.
Why This Matters
If auto_fill_mappings is left empty in Phase 1, Phase 2 cannot auto-fill any report fields. The entire Phase 2 report generation module would require a full obligation data backfill.
          evidence_required — Full JSON Specification
 Purpose
Defines exactly what document types satisfy each obligation — enabling Phase 2's audit package completeness checker and Evidence Vault categorisation
Format
JSON array of objects: [{ doc_type, description, mandatory, accepted_formats[], max_age_months }]
Example
[{ "doc_type": "Board_Resolution", "description": "Board resolution approving AML policy", "mandatory": true, "accepted_formats": ["PDF", "DOCX"], "max_age_months": 24 }, { "doc_type": "Policy_Document", "description": "Written AML/CFT policy document", "mandatory": true, "accepted_formats": ["PDF", "DOCX"], "max_age_months": 12 }]
Phase 1 Requirement
Every obligation with severity Critical or High must have evidence_required fully populated at Phase 1 launch. Medium and Low severity obligations must be populated before Phase 2 launch.
Validation
When a user uploads evidence in Phase 1, the system should validate the file type against accepted_formats[] and warn if the document may be older than max_age_months. This validation is advisory in Phase 1; it becomes a hard gate in Phase 2's completeness checker.
          © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 A6.2 Schema Extensibility Rules — Non-Negotiable Engineering Constraints
    Phase 2-Ready Schema Engineering Rules
 Rule 1 — Version FK in org_obligations
The org_obligations table must store obligation_version_id (not just obligation_id). This is required for Phase 2's pre-fill logic to know which version of an obligation's auto_fill_mappings to use.
Rule 2 — No hardcoded deadline logic in application code
Deadline computation must always read from the deadline_logic JSON field on the obligation record. Hardcoding deadlines (e.g., 'settlement reports are due on the 10th') in application code is prohibited — it makes Phase 2 automation impossible without code changes.
Rule 3 — Report calendar entries must be linked to obligation versions
Each report_calendar entry must store: obligation_id, obligation_version_id, template_id (nullable in Phase 1; populated in Phase 2), and computed_due_date. The computed_due_date must be recalculated automatically when the underlying obligation version changes.
Rule 4 — org_profile must be structured (not freetext)
All org_profile fields that will be used in auto_fill_mappings (company name, CBN license number, address, registration number, compliance officer name) must be stored as discrete structured fields — not in a freetext notes field. Phase 2 cannot auto-fill from unstructured data.
Rule 5 — API must be versioned from day one
All Phase 1 API endpoints must be prefixed with /v1/. Phase 2 endpoints use /v2/. This prevents breaking changes to Phase 1 clients when Phase 2 introduces new endpoint schemas.
Rule 6 — Audit log must be append-only
The audit_logs table must never allow UPDATE or DELETE operations on existing records. Application-level and DB-level constraints must enforce this. Phase 3's risk analytics depend on a complete, unmodified history of compliance events.
          A6.3 Pre-Launch Data Completeness Checklist
Before Phase 1 launches to any paying customer, the following data completeness gates must be passed:
    Launch Gate Checklist
 Gate
Requirement
Obligation Registry
Minimum 60 obligations ingested; 100% of Critical/High obligations have deadline_logic, evidence_required, and auto_fill_mappings populated
CBN Report Templates
Minimum 10 most common CBN report types ingested with full section and field definitions
       © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
     License Matrix
obligation-to-license_type mappings complete for all 4 primary license types (PSP, MMO, Switching, PSSB)
Circular Archive
Minimum 24 months of CBN circulars ingested and tagged with affected_obligation_ids and affected_license_types
Admin CMS
Legal team trained on admin CMS; at least 2 team members with admin access; content review SLA documented
Schema Validation Tests
Automated tests verify: deadline_logic parses correctly for all obligations; auto_fill_mappings source paths resolve against org_profile schema; evidence_required formats are valid
Disclaimer Copy
All disclaimer text reviewed by Nigerian fintech attorney; approved copy stored in CMS (not hardcoded)
        © 2025 Vytaniq | v1.0 — Phase 1 PRD

 CONFIDENTIAL — INTERNAL PRD | Vytaniq
 Appendix Summary
The six risk implementation specs in this appendix translate the Risk Register from a list of concerns into a set of buildable, testable features. Each spec must be reviewed by the engineering lead and legal advisor before the Phase 1 sprint plan is finalised.
     Appendix Implementation Priority
 Priority
Risk Spec | Must Complete Before...
P0 — Pre-Schema
A6: Phase 2-Ready Field Definitions | Must be resolved before the DB schema is finalised. Cannot be retrofitted.
P0 — Pre-Launch
A1: Obligation Versioning System | Must be built before any obligations are published to PSPs. Live obligations without versioning cannot be safely updated.
P0 — Pre-Launch
A5: Readiness Score Disclaimer + CBN Engagement | Disclaimer copy must be in the product before any PSP sees their score.
P1 — Sprint 1
A2: Encryption + Trust UI | Must be live before any evidence upload feature is released.
P1 — Sprint 2
A3: Circular Dispute Flow | Must be live before circular tracker goes live. Cannot launch circular alerts without a dispute mechanism.
P2 — Post-Launch
A4: Freemium Conversion Flow | Must be live before free tier is opened to the public. Feature gates must be server-side enforced from day one.
             END OF APPENDIX A
Vytaniq — Phase 1 PRD v1.1 — Appendix A Added — March 2025
 © 2025 Vytaniq | v1.0 — Phase 1 PRD
