import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data (optional - remove if you want to preserve)
  // await prisma.auditLog.deleteMany();
  // await prisma.circularDispute.deleteMany();
  // await prisma.orgCircular.deleteMany();
  // await prisma.circular.deleteMany();
  // await prisma.readinessScore.deleteMany();
  // await prisma.reportCalendar.deleteMany();
  // await prisma.orgObligation.deleteMany();
  // await prisma.obligationVersion.deleteMany();
  // await prisma.obligation.deleteMany();
  // await prisma.user.deleteMany();
  // await prisma.organization.deleteMany();

  // ============================================================================
  // 1. CREATE ORGANIZATIONS
  // ============================================================================
  console.log('📋 Creating organizations...');

  const org1 = await prisma.organization.create({
    data: {
      name: 'FinTech Solutions Nigeria',
      companyRegistration: 'RC-123456',
      licenseTypes: ['PSP', 'MMO'],
      activityFlags: ['payments', 'lending'],
      licenseNumber: 'PSP/CBN/2024/001',
      licenseIssueDate: new Date('2024-01-15'),
      licenseRenewalDate: new Date('2025-01-15'),
      planTier: 'GROWTH',
    },
  });

  const org2 = await prisma.organization.create({
    data: {
      name: 'African Banking Corp',
      companyRegistration: 'RC-789012',
      licenseTypes: ['MMO'],
      activityFlags: ['payments'],
      licenseNumber: 'MMO/CBN/2023/045',
      licenseIssueDate: new Date('2023-06-01'),
      licenseRenewalDate: new Date('2026-06-01'),
      planTier: 'STARTER',
    },
  });

  const org3 = await prisma.organization.create({
    data: {
      name: 'RegTech Innovators',
      companyRegistration: 'RC-345678',
      licenseTypes: ['PSP'],
      activityFlags: ['payments', 'FX'],
      licenseNumber: 'PSP/CBN/2024/012',
      licenseIssueDate: new Date('2024-03-01'),
      licenseRenewalDate: new Date('2025-03-01'),
      planTier: 'ENTERPRISE',
    },
  });

  // ============================================================================
  // 2. CREATE USERS
  // ============================================================================
  console.log('👥 Creating users...');

  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);

  const user1 = await prisma.user.create({
    data: {
      orgId: org1.id,
      email: 'admin@fintech-solutions.ng',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      firstName: 'Chioma',
      lastName: 'Okafor',
      emailVerified: true,
      lastLogin: new Date(),
    },
  });

  const user2 = await prisma.user.create({
    data: {
      orgId: org1.id,
      email: 'compliance@fintech-solutions.ng',
      passwordHash: hashedPassword,
      role: 'MEMBER',
      firstName: 'Tunde',
      lastName: 'Adeyemi',
      emailVerified: true,
      lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  const user3 = await prisma.user.create({
    data: {
      orgId: org2.id,
      email: 'admin@african-banking.ng',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      firstName: 'Folake',
      lastName: 'Oluwaseun',
      emailVerified: true,
    },
  });

  const user4 = await prisma.user.create({
    data: {
      orgId: org3.id,
      email: 'compliance@regtech.ng',
      passwordHash: hashedPassword,
      role: 'MEMBER',
      firstName: 'Emeka',
      lastName: 'Nwosu',
      emailVerified: true,
    },
  });

  // ============================================================================
  // 3. CREATE OBLIGATIONS (Master list)
  // ============================================================================
  console.log('📜 Creating obligations...');

  const obligation1 = await prisma.obligation.create({
    data: {
      title: 'Customer Identity Verification (KYC)',
      description:
        'All PSPs and MMOs must conduct Know Your Customer (KYC) verification before onboarding customers. Includes identity documentation review and verification.',
      legalSource: 'CBN Circular 2024/CCD/003, Section 4.2',
      category: 'KYC',
      licenseTypes: ['PSP', 'MMO'],
      activityFlags: ['payments', 'lending'],
      frequency: 'ONE_TIME',
      deadlineLogic: {
        frequency: 'ONE_TIME',
        anchor: 'CUSTOMER_ONBOARDING',
        offsetDays: 0,
        description: 'Must be completed before customer activation',
      } as any,
      autoFillMappings: {
        customer_name: { source_type: 'GOVERNMENT_ID', source_path: 'full_name' },
        date_of_birth: { source_type: 'GOVERNMENT_ID', source_path: 'dob' },
      } as any,
      evidenceRequired: [
        {
          docType: 'GOVERNMENT_ISSUED_ID',
          mandatory: true,
          acceptedFormats: ['PDF', 'JPG', 'PNG'],
          maxAgeMonths: null,
        },
        {
          docType: 'PROOF_OF_ADDRESS',
          mandatory: true,
          acceptedFormats: ['PDF', 'JPG'],
          maxAgeMonths: 6,
        },
      ] as any,
      severity: 'CRITICAL',
    },
  });

  const obligation2 = await prisma.obligation.create({
    data: {
      title: 'Anti-Money Laundering (AML) Compliance',
      description:
        'Implementation of AML policies, procedures, and transaction monitoring to detect and report suspicious activity.',
      legalSource: 'CBN Circular 2023/CCD/010, Section 5.1',
      category: 'AML',
      licenseTypes: ['PSP', 'MMO'],
      activityFlags: ['payments', 'lending'],
      frequency: 'MONTHLY',
      deadlineLogic: {
        frequency: 'MONTHLY',
        anchor: 'MONTH_END',
        offsetDays: 5,
        description: 'Report due by 5th of following month',
      } as any,
      autoFillMappings: undefined,
      evidenceRequired: [
        {
          docType: 'AML_POLICY_DOCUMENT',
          mandatory: true,
          acceptedFormats: ['PDF'],
          maxAgeMonths: 12,
        },
        {
          docType: 'TRANSACTION_MONITORING_REPORT',
          mandatory: true,
          acceptedFormats: ['CSV', 'XLSX'],
          maxAgeMonths: 1,
        },
      ] as any,
      severity: 'CRITICAL',
    },
  });

  const obligation3 = await prisma.obligation.create({
    data: {
      title: 'Quarterly Regulatory Report',
      description: 'Submission of quarterly financial and operational reports to CBN supervisory office.',
      legalSource: 'CBN Prudential Guidelines 2024, Section 3.4',
      category: 'REPORTING',
      licenseTypes: ['PSP', 'MMO'],
      activityFlags: ['payments'],
      frequency: 'QUARTERLY',
      deadlineLogic: {
        frequency: 'QUARTERLY',
        anchor: 'QUARTER_END',
        offsetDays: 14,
        description: 'Report due 14 days after quarter end',
      } as any,
      autoFillMappings: undefined,
      evidenceRequired: [
        {
          docType: 'FINANCIAL_REPORT',
          mandatory: true,
          acceptedFormats: ['PDF', 'XLSX'],
          maxAgeMonths: null,
        },
        {
          docType: 'OPERATIONAL_METRICS',
          mandatory: true,
          acceptedFormats: ['CSV', 'XLSX'],
          maxAgeMonths: null,
        },
      ] as any,
      severity: 'HIGH',
    },
  });

  const obligation4 = await prisma.obligation.create({
    data: {
      title: 'Board of Directors Meeting',
      description: 'Organization must hold quarterly board meetings to review compliance and governance matters.',
      legalSource: 'CBN Corporate Governance Code 2024',
      category: 'GOVERNANCE',
      licenseTypes: ['PSP', 'MMO'],
      activityFlags: [],
      frequency: 'QUARTERLY',
      deadlineLogic: {
        frequency: 'QUARTERLY',
        anchor: 'QUARTER_START',
        offsetDays: 30,
        description: 'Must hold within first 30 days of quarter',
      } as any,
      autoFillMappings: undefined,
      evidenceRequired: [
        {
          docType: 'BOARD_MINUTES',
          mandatory: true,
          acceptedFormats: ['PDF'],
          maxAgeMonths: null,
        },
      ] as any,
      severity: 'MEDIUM',
    },
  });

  const obligation5 = await prisma.obligation.create({
    data: {
      title: 'Annual Information Security Audit',
      description: 'Third-party security audit of IT systems, data protection, and cybersecurity controls.',
      legalSource: 'CBN Cybersecurity Guidelines 2023, Section 6.2',
      category: 'TECHNOLOGY',
      licenseTypes: ['PSP', 'MMO'],
      activityFlags: ['payments', 'lending'],
      frequency: 'ANNUAL',
      deadlineLogic: {
        frequency: 'ANNUAL',
        anchor: 'ANNIVERSARY',
        offsetDays: 0,
        description: 'Audit must be completed annually',
      } as any,
      autoFillMappings: undefined,
      evidenceRequired: [
        {
          docType: 'SECURITY_AUDIT_REPORT',
          mandatory: true,
          acceptedFormats: ['PDF'],
          maxAgeMonths: 12,
        },
      ] as any,
      severity: 'HIGH',
    },
  });

  // ============================================================================
  // 4. CREATE OBLIGATION VERSIONS
  // ============================================================================
  console.log('📝 Creating obligation versions...');

  const obVersion1 = await prisma.obligationVersion.create({
    data: {
      obligationId: obligation1.id,
      versionNumber: 1,
      changeType: 'CREATED',
      changeSummary: 'Initial KYC requirement established',
      changedBy: 'SYSTEM',
      effectiveFrom: new Date(),
      isCurrent: true,
      title: obligation1.title,
      description: obligation1.description,
      legalSource: obligation1.legalSource,
      category: obligation1.category,
      licenseTypes: obligation1.licenseTypes,
      activityFlags: obligation1.activityFlags,
      frequency: obligation1.frequency,
      deadlineLogic: obligation1.deadlineLogic as any,
      severity: obligation1.severity,
      evidenceRequired: obligation1.evidenceRequired as any,
    },
  });

  const obVersion2 = await prisma.obligationVersion.create({
    data: {
      obligationId: obligation2.id,
      versionNumber: 1,
      changeType: 'CREATED',
      changeSummary: 'Initial AML compliance requirement',
      changedBy: 'SYSTEM',
      effectiveFrom: new Date(),
      isCurrent: true,
      title: obligation2.title,
      description: obligation2.description,
      legalSource: obligation2.legalSource,
      category: obligation2.category,
      licenseTypes: obligation2.licenseTypes,
      activityFlags: obligation2.activityFlags,
      frequency: obligation2.frequency,
      deadlineLogic: obligation2.deadlineLogic as any,
      severity: obligation2.severity,
      evidenceRequired: obligation2.evidenceRequired as any,
    },
  });

  // Create versions for remaining obligations
  for (const ob of [obligation3, obligation4, obligation5]) {
    await prisma.obligationVersion.create({
      data: {
        obligationId: ob.id,
        versionNumber: 1,
        changeType: 'CREATED',
        changeSummary: 'Initial obligation created',
        changedBy: 'SYSTEM',
        effectiveFrom: new Date(),
        isCurrent: true,
        title: ob.title,
        description: ob.description,
        legalSource: ob.legalSource,
        category: ob.category,
        licenseTypes: ob.licenseTypes,
        activityFlags: ob.activityFlags,
        frequency: ob.frequency,
        deadlineLogic: ob.deadlineLogic as any,
        severity: ob.severity,
        evidenceRequired: ob.evidenceRequired as any,
      },
    });
  }

  // ============================================================================
  // 5. ASSIGN OBLIGATIONS TO ORGANIZATIONS
  // ============================================================================
  console.log('🔗 Assigning obligations to organizations...');

  const obligations = [obligation1, obligation2, obligation3, obligation4, obligation5];

  for (const org of [org1, org2]) {
    for (const ob of obligations) {
      await prisma.orgObligation.create({
        data: {
          orgId: org.id,
          obligationId: ob.id,
          obligationVersionId: ob.id === obligation1.id
            ? obVersion1.id
            : ob.id === obligation2.id
              ? obVersion2.id
              : (await prisma.obligationVersion.findFirst({
                  where: { obligationId: ob.id, isCurrent: true },
                }))!.id,
          status: [1, 2].includes(obligations.indexOf(ob)) ? 'MET' : 'PARTIAL',
          completedAt: [1, 2].includes(obligations.indexOf(ob)) ? new Date() : null,
          completedBy: [1, 2].includes(obligations.indexOf(ob)) ? user1.id : null,
          notes: null,
        },
      });
    }
  }

  // org3 has fewer obligations met
  for (const ob of [obligation1, obligation2, obligation3]) {
    await prisma.orgObligation.create({
      data: {
        orgId: org3.id,
        obligationId: ob.id,
        obligationVersionId: (await prisma.obligationVersion.findFirst({
          where: { obligationId: ob.id, isCurrent: true },
        }))!.id,
        status: 'NOT_STARTED',
      },
    });
  }

  // ============================================================================
  // 6. CREATE CIRCULARS
  // ============================================================================
  console.log('📰 Creating circulars...');

  const circular1 = await prisma.circular.create({
    data: {
      title: 'Enhanced KYC Requirements for High-Risk Customers',
      summary:
        'CBN issues enhanced KYC requirements for customers from high-risk jurisdictions. Additional documentation and verification required.',
      content:
        'This circular outlines enhanced KYC procedures for customers identified as high-risk per FATF guidelines...',
      date: new Date('2025-02-15'),
      url: 'https://cbn.gov.ng/circulars/2025/kycenhance',
      affectedLicenseTypes: ['PSP', 'MMO'],
      affectedObligationIds: [obligation1.id],
      urgency: 'HIGH',
      taggingConfidence: 'HIGH',
    },
  });

  const circular2 = await prisma.circular.create({
    data: {
      title: 'Transaction Monitoring System Upgrades',
      summary:
        'CBN announces new standards for transaction monitoring systems. FSPs must upgrade systems to detect layering patterns.',
      content: 'Updated transaction monitoring standards effective March 1, 2025...',
      date: new Date('2025-01-20'),
      url: 'https://cbn.gov.ng/circulars/2025/amlupgrade',
      affectedLicenseTypes: ['PSP', 'MMO'],
      affectedObligationIds: [obligation2.id],
      urgency: 'CRITICAL',
      taggingConfidence: 'HIGH',
    },
  });

  const circular3 = await prisma.circular.create({
    data: {
      title: 'Guidance on Digital Identity Verification',
      summary: 'CBN provides guidance on acceptable digital identity verification methods for PSPs.',
      content: 'Approved digital identity providers and verification methods...',
      date: new Date('2025-02-01'),
      url: 'https://cbn.gov.ng/circulars/2025/digitalid',
      affectedLicenseTypes: ['PSP'],
      affectedObligationIds: [obligation1.id],
      urgency: 'MONITOR',
      taggingConfidence: 'MEDIUM',
    },
  });

  // ============================================================================
  // 7. DISTRIBUTE CIRCULARS TO ORGANIZATIONS
  // ============================================================================
  console.log('📨 Distributing circulars...');

  const orgCircular1 = await prisma.orgCircular.create({
    data: {
      orgId: org1.id,
      circularId: circular1.id,
      relevanceTag: 'APPLIES_TO_YOU',
      acknowledgedAt: new Date(),
      acknowledgedBy: user1.id,
    },
  });

  const orgCircular2 = await prisma.orgCircular.create({
    data: {
      orgId: org1.id,
      circularId: circular2.id,
      relevanceTag: 'APPLIES_TO_YOU',
      acknowledgedAt: null,
    },
  });

  const orgCircular3 = await prisma.orgCircular.create({
    data: {
      orgId: org2.id,
      circularId: circular2.id,
      relevanceTag: 'APPLIES_TO_YOU',
      disputed: true,
    },
  });

  // ============================================================================
  // 8. CREATE CIRCULAR DISPUTES
  // ============================================================================
  console.log('⚖️ Creating disputes...');

  const dispute1 = await prisma.circularDispute.create({
    data: {
      orgId: org2.id,
      circularId: circular2.id,
      raisedBy: user3.id,
      reason: 'Our transaction monitoring system already exceeds these standards. Requirement is not applicable to our business model.',
      status: 'RESOLVED_PARTIAL',
      reviewedBy: 'VYTANIQ_ADMIN_01',
      reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      resolutionNote: 'Partial applicability confirmed. System meets 80% of requirements. Exemption granted for legacy system components.',
      outcome: 'PARTIAL_RELEVANCE',
    },
  });

  // ============================================================================
  // 9. CREATE REPORT CALENDAR ENTRIES
  // ============================================================================
  console.log('📅 Creating report calendar entries...');

  const dueDate1 = new Date();
  dueDate1.setMonth(dueDate1.getMonth() + 1);
  dueDate1.setDate(5);

  const dueDate2 = new Date();
  dueDate2.setMonth(dueDate2.getMonth() + 3);
  dueDate2.setDate(14);

  const reportCalendar1 = await prisma.reportCalendar.create({
    data: {
      orgId: org1.id,
      obligationId: obligation2.id,
      obligationVersionId: obVersion2.id,
      dueDate: dueDate1,
      status: 'PENDING',
      notes: 'Monthly AML compliance report',
    },
  });

  const reportCalendar2 = await prisma.reportCalendar.create({
    data: {
      orgId: org1.id,
      obligationId: obligation3.id,
      obligationVersionId: (await prisma.obligationVersion.findFirst({
        where: { obligationId: obligation3.id, isCurrent: true },
      }))!.id,
      dueDate: dueDate2,
      status: 'PENDING',
      notes: 'Q1 2025 Regulatory Report',
    },
  });

  // Overdue report
  const overdueDueDate = new Date();
  overdueDueDate.setDate(overdueDueDate.getDate() - 5);

  const reportCalendar3 = await prisma.reportCalendar.create({
    data: {
      orgId: org2.id,
      obligationId: obligation2.id,
      obligationVersionId: obVersion2.id,
      dueDate: overdueDueDate,
      status: 'OVERDUE',
      notes: 'February AML Report (OVERDUE)',
    },
  });

  // ============================================================================
  // 10. CREATE READINESS SCORES
  // ============================================================================
  console.log('📊 Creating readiness scores...');

  const readinessScore1 = await prisma.readinessScore.create({
    data: {
      orgId: org1.id,
      totalScore: 78,
      band: 'AUDIT_READY',
      components: {
        obligationCoverage: 0.85,
        reportSubmission: 0.72,
        circularAcknowledgment: 0.80,
        evidenceCompleteness: 0.75,
        licenseCurrency: 1.0,
      } as any,
    },
  });

  const readinessScore2 = await prisma.readinessScore.create({
    data: {
      orgId: org2.id,
      totalScore: 52,
      band: 'WORK_REQUIRED',
      components: {
        obligationCoverage: 0.60,
        reportSubmission: 0.40,
        circularAcknowledgment: 0.50,
        evidenceCompleteness: 0.45,
        licenseCurrency: 1.0,
      } as any,
    },
  });

  const readinessScore3 = await prisma.readinessScore.create({
    data: {
      orgId: org3.id,
      totalScore: 32,
      band: 'AT_RISK',
      components: {
        obligationCoverage: 0.30,
        reportSubmission: 0.20,
        circularAcknowledgment: 0.25,
        evidenceCompleteness: 0.15,
        licenseCurrency: 1.0,
      } as any,
    },
  });

  // ============================================================================
  // 11. CREATE AUDIT LOGS
  // ============================================================================
  console.log('📋 Creating audit logs...');

  await prisma.auditLog.create({
    data: {
      orgId: org1.id,
      userId: user1.id,
      actionType: 'OBLIGATION_STATUS_UPDATED',
      entityType: 'org_obligation',
      entityId: (
        await prisma.orgObligation.findFirst({
          where: { orgId: org1.id, obligationId: obligation1.id },
        })
      )!.id,
      metadata: {
        previousStatus: 'NOT_STARTED',
        newStatus: 'MET',
        completedAt: new Date(),
      } as any,
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: org1.id,
      userId: user2.id,
      actionType: 'CIRCULAR_ACKNOWLEDGED',
      entityType: 'org_circular',
      entityId: orgCircular1.id,
      metadata: {
        circularTitle: circular1.title,
        acknowledgedAt: new Date(),
      } as any,
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: org2.id,
      userId: user3.id,
      actionType: 'DISPUTE_RAISED',
      entityType: 'circular_dispute',
      entityId: dispute1.id,
      metadata: {
        circularId: circular2.id,
        reason: 'System already compliant',
      } as any,
    },
  });

  // ============================================================================
  // 12. CREATE REFRESH TOKENS
  // ============================================================================
  console.log('🔑 Creating refresh tokens...');

  await prisma.refreshToken.create({
    data: {
      userId: user1.id,
      token: 'refresh_token_' + Math.random().toString(36).substring(7),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n✅ Seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   • Organizations: 3`);
  console.log(`   • Users: 4`);
  console.log(`   • Obligations: 5`);
  console.log(`   • Obligation Versions: 5`);
  console.log(`   • Org Obligations: 13`);
  console.log(`   • Circulars: 3`);
  console.log(`   • Org Circulars: 3`);
  console.log(`   • Disputes: 1`);
  console.log(`   • Report Calendar Entries: 3`);
  console.log(`   • Readiness Scores: 3`);
  console.log(`   • Audit Logs: 3`);
  console.log('\n🔐 Test Credentials:');
  console.log(`   Email: admin@fintech-solutions.ng`);
  console.log(`   Password: TestPassword123!`);
  console.log(`   Role: ADMIN`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
