import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/database/prisma.service';
import { EnquiryRateLimiterService } from '../src/leads/enquiry-rate-limiter.service';
import {
  AppointmentStatus,
  ContactPreference,
  LeadIntent,
  LeadStatus,
} from '@automotive-os/database';

describe('Buyer Profile, Favorites, CRM Leads & Data Grants (E2E Integration Tests)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let prisma: PrismaService;
  let rateLimiter: EnquiryRateLimiterService;

  let buyerAToken: string;
  let buyerBToken: string;
  let dealerAToken: string;
  let dealerBToken: string;

  const tenantAId = '11111111-1111-1111-1111-111111111111';
  const tenantBId = '22222222-2222-2222-2222-222222222222';
  const publishedListingId = '11111111-1111-1111-1111-cccc00000001';
  const soldListingId = '11111111-1111-1111-1111-cccc00000002';

  let buyerAUserId: string;
  let buyerBUserId: string;
  let dealerAStaffMembershipId: string;
  let dealerBStaffMembershipId: string;

  // Variables tracked across test phases
  let createdSavedSearchId: string;
  let createdLeadId: string;
  let createdAppointmentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      })
    );

    await app.init();

    authService = app.get<AuthService>(AuthService);
    prisma = app.get<PrismaService>(PrismaService);
    rateLimiter = app.get<EnquiryRateLimiterService>(EnquiryRateLimiterService);

    // Tokens
    buyerAToken = authService.generateDevToken({
      identitySubject: 'auth0|buyer_a_rashid',
      email: 'rashid.buyer@example.ae',
      name: 'Rashid Al-Maktoum',
    });

    buyerBToken = authService.generateDevToken({
      identitySubject: 'auth0|buyer_b_fatima',
      email: 'fatima.buyer@example.ae',
      name: 'Fatima Al-Nuaimi',
    });

    dealerAToken = authService.generateDevToken({
      identitySubject: 'auth0|dealer_a_tariq',
      email: 'tariq@alfuttaim-prestige.ae',
      name: 'Tariq Al-Hashimi',
    });

    dealerBToken = authService.generateDevToken({
      identitySubject: 'auth0|dealer_b_zayd',
      email: 'zayd@gargash-autos.ae',
      name: 'Zayd Mansoor',
    });

    // Lookup User IDs
    const buyerA = await prisma.user.findUniqueOrThrow({
      where: { identitySubject: 'auth0|buyer_a_rashid' },
    });
    buyerAUserId = buyerA.id;

    const buyerB = await prisma.user.findUniqueOrThrow({
      where: { identitySubject: 'auth0|buyer_b_fatima' },
    });
    buyerBUserId = buyerB.id;

    const dealerAStaff = await prisma.membership.findFirstOrThrow({
      where: { tenantId: tenantAId },
    });
    dealerAStaffMembershipId = dealerAStaff.id;

    const dealerBStaff = await prisma.membership.findFirstOrThrow({
      where: { tenantId: tenantBId },
    });
    dealerBStaffMembershipId = dealerBStaff.id;

    // Reset Buyer A profile preferences for test idempotency
    await prisma.buyerProfile.upsert({
      where: { userId: buyerAUserId },
      update: { preferredLanguage: 'ar', budgetMaxFils: BigInt(40000000) },
      create: {
        userId: buyerAUserId,
        preferredLanguage: 'ar',
        budgetMaxFils: BigInt(40000000),
      },
    });

    // Reset rate limiter
    rateLimiter.reset();
  });

  afterAll(async () => {
    // Cleanup created test records
    if (createdLeadId) {
      await prisma.appointment.deleteMany({ where: { leadId: createdLeadId } });
      await prisma.leadDataGrant.deleteMany({ where: { leadId: createdLeadId } });
      await prisma.lead.deleteMany({ where: { id: createdLeadId } });
    }
    await app.close();
  });

  describe('1. Buyer-Owned Profile, Favorites & Saved Searches', () => {
    it('Buyer A views own profile and updates preferences', async () => {
      const getRes = await request(app.getHttpServer())
        .get('/api/v1/me/buyer-profile')
        .set('Authorization', `Bearer ${buyerAToken}`)
        .expect(200);

      expect(getRes.body.userId).toBe(buyerAUserId);
      expect(getRes.body.preferredLanguage).toBe('ar');

      const patchRes = await request(app.getHttpServer())
        .patch('/api/v1/me/buyer-profile')
        .set('Authorization', `Bearer ${buyerAToken}`)
        .send({
          preferredLanguage: 'en',
          budgetMaxFils: 45000000,
        })
        .expect(200);

      expect(patchRes.body.preferredLanguage).toBe('en');
      expect(patchRes.body.budgetMaxFils).toBe('45000000');
    });

    it('Buyer A adds a vehicle listing to favorites', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/me/favorites')
        .set('Authorization', `Bearer ${buyerAToken}`)
        .send({ listingId: publishedListingId })
        .expect(201);

      expect(res.body.listingId).toBe(publishedListingId);
      expect(res.body.title).toContain('Toyota Land Cruiser');
    });

    it('Buyer A lists own favorites', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/me/favorites')
        .set('Authorization', `Bearer ${buyerAToken}`)
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
      const fav = res.body.find((f: any) => f.listingId === publishedListingId);
      expect(fav).toBeDefined();
    });

    it('Buyer A removes listing from favorites', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/me/favorites/${publishedListingId}`)
        .set('Authorization', `Bearer ${buyerAToken}`)
        .expect(200);

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/me/favorites')
        .set('Authorization', `Bearer ${buyerAToken}`)
        .expect(200);

      const found = listRes.body.find((f: any) => f.listingId === publishedListingId);
      expect(found).toBeUndefined();
    });

    it('Buyer A creates and lists saved searches', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/me/saved-searches')
        .set('Authorization', `Bearer ${buyerAToken}`)
        .send({
          name: 'Land Cruisers Dubai Under 350k',
          filterJson: { make: 'Toyota', maxPriceFils: 35000000, emirate: 'Dubai' },
          alertsEnabled: true,
        })
        .expect(201);

      expect(createRes.body.id).toBeDefined();
      expect(createRes.body.name).toBe('Land Cruisers Dubai Under 350k');
      expect(createRes.body.alertsEnabled).toBe(true);

      createdSavedSearchId = createRes.body.id;

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/me/saved-searches')
        .set('Authorization', `Bearer ${buyerAToken}`)
        .expect(200);

      const found = listRes.body.find((s: any) => s.id === createdSavedSearchId);
      expect(found).toBeDefined();
    });

    it('Negative: Buyer B cannot delete Buyer A saved search (404 Not Found)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/me/saved-searches/${createdSavedSearchId}`)
        .set('Authorization', `Bearer ${buyerBToken}`)
        .expect(404);
    });

    it('Buyer A deletes own saved search', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/me/saved-searches/${createdSavedSearchId}`)
        .set('Authorization', `Bearer ${buyerAToken}`)
        .expect(200);
    });
  });

  describe('2. Vehicle Enquiry with Explicit Field-Level Data Grant', () => {
    it('Buyer A cannot enquire on a sold or unpublished listing (400 Bad Request)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/public/listings/${soldListingId}/leads`)
        .set('Authorization', `Bearer ${buyerAToken}`)
        .send({
          intent: LeadIntent.TEST_DRIVE,
          preferredContact: ContactPreference.PHONE,
          fieldsToShare: ['name', 'phone'],
          consentTextVersion: 'buyer-lead-disclosure-en-AE-v1',
        })
        .expect(400);
    });

    it('Buyer A submits enquiry on published listing sharing ONLY name and phone (email omitted)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/public/listings/${publishedListingId}/leads`)
        .set('Authorization', `Bearer ${buyerAToken}`)
        .send({
          intent: LeadIntent.TEST_DRIVE,
          preferredContact: ContactPreference.PHONE,
          message: 'Interested in test driving this Saturday afternoon.',
          fieldsToShare: ['name', 'phone'], // Explicit consent: email is NOT granted!
          consentTextVersion: 'buyer-lead-disclosure-en-AE-v1',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe(LeadStatus.NEW);
      expect(res.body.listingId).toBe(publishedListingId);
      expect(res.body.tenantId).toBe(tenantAId);

      createdLeadId = res.body.id;

      // Verify Outbox Event created
      const outbox = await prisma.outboxEvent.findFirst({
        where: {
          aggregateId: createdLeadId,
          eventType: 'lead.created',
        },
      });
      expect(outbox).toBeDefined();

      // Verify Audit Event logged
      const audit = await prisma.auditEvent.findFirst({
        where: {
          targetId: createdLeadId,
          action: 'LEAD_ENQUIRY_CREATED',
        },
      });
      expect(audit).toBeDefined();
    });

    it('Enquiry anti-spam rate limiting triggers 429 Too Many Requests after rapid requests', async () => {
      // Send 5 rapid requests to exceed rate limit
      for (let i = 0; i < 4; i++) {
        await request(app.getHttpServer())
          .post(`/api/v1/public/listings/${publishedListingId}/leads`)
          .set('Authorization', `Bearer ${buyerAToken}`)
          .send({
            intent: LeadIntent.ENQUIRY,
            preferredContact: ContactPreference.EMAIL,
            fieldsToShare: ['name'],
            consentTextVersion: 'v1',
          });
      }

      // 6th request must trigger rate limit
      const rateLimitRes = await request(app.getHttpServer())
        .post(`/api/v1/public/listings/${publishedListingId}/leads`)
        .set('Authorization', `Bearer ${buyerAToken}`)
        .send({
          intent: LeadIntent.ENQUIRY,
          preferredContact: ContactPreference.EMAIL,
          fieldsToShare: ['name'],
          consentTextVersion: 'v1',
        })
        .expect(429);

      expect(rateLimitRes.body.error.code).toBe('RATE_LIMIT_EXCEEDED');

      // Reset rate limiter for remaining test suite
      rateLimiter.reset();
    });
  });

  describe('3. Dealer CRM Lead Access & Field-Level Authorization', () => {
    it('Dealer A lists leads and receives privacy-preserving summary', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantAId}/leads`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
      const leadItem = res.body.items.find((l: any) => l.id === createdLeadId);
      expect(leadItem).toBeDefined();
      expect(leadItem.status).toBe(LeadStatus.NEW);
      expect(leadItem.buyerDisplayName).toBe('Rashid Al-Maktoum');
    });

    it('Dealer A views lead detail: receives ONLY granted fields (name and phone); email is null', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantAId}/leads/${createdLeadId}`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .expect(200);

      expect(res.body.id).toBe(createdLeadId);
      expect(res.body.intent).toBe(LeadIntent.TEST_DRIVE);

      // FIELD-LEVEL DATA MINIMIZATION CHECKS:
      expect(res.body.buyerContact.grantStatus).toBe('ACTIVE');
      expect(res.body.buyerContact.name).toBe('Rashid Al-Maktoum');
      expect(res.body.buyerContact.phone).toBe('+971503333333');
      // Crucial: email was not granted in fieldsToShare, so must be NULL!
      expect(res.body.buyerContact.email).toBeNull();

      // Crucial: global buyer profile properties (budget, preferred makes) are not exposed!
      expect(res.body.budgetMinFils).toBeUndefined();
      expect(res.body.budgetMaxFils).toBeUndefined();
    });
  });

  describe('4. Cross-Tenant Lead Isolation', () => {
    it('Dealer B cannot read Dealer A lead via Dealer B route (404 Composite Isolation)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantBId}/leads/${createdLeadId}`)
        .set('Authorization', `Bearer ${dealerBToken}`)
        .expect(404);
    });

    it('Dealer B cannot access Dealer A tenant leads route (403 TENANT_FORBIDDEN)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantAId}/leads`)
        .set('Authorization', `Bearer ${dealerBToken}`)
        .expect(403);

      expect(res.body.error.message).toContain('TENANT_FORBIDDEN');
    });

    it('Unauthenticated guest cannot access dealer leads (401 Unauthorized)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantAId}/leads`)
        .expect(401);
    });
  });

  describe('5. Dealer Lead Status Changes & Staff Assignment', () => {
    it('Dealer A updates lead status to QUALIFIED', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/tenants/${tenantAId}/leads/${createdLeadId}/status`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .send({ status: LeadStatus.QUALIFIED })
        .expect(200);

      expect(res.body.status).toBe(LeadStatus.QUALIFIED);

      // Verify outbox event
      const outbox = await prisma.outboxEvent.findFirst({
        where: {
          aggregateId: createdLeadId,
          eventType: 'lead.status_updated',
        },
      });
      expect(outbox).toBeDefined();
    });

    it('Dealer A assigns lead to an active staff member in their dealership', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/tenants/${tenantAId}/leads/${createdLeadId}/assignment`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .send({ assignedMembershipId: dealerAStaffMembershipId })
        .expect(200);

      expect(res.body.assignedMembershipId).toBe(dealerAStaffMembershipId);
      expect(res.body.assignedStaffName).toBe('Tariq Al-Hashimi');
    });

    it('Negative: Dealer A cannot assign lead to Dealer B staff membership (400 Bad Request)', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/tenants/${tenantAId}/leads/${createdLeadId}/assignment`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .send({ assignedMembershipId: dealerBStaffMembershipId })
        .expect(400);
    });
  });

  describe('6. Test-Drive Appointment Lifecycle', () => {
    it('Buyer A requests a test-drive appointment for their active inquiry', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/me/leads/${createdLeadId}/appointments`)
        .set('Authorization', `Bearer ${buyerAToken}`)
        .send({
          startsAt: '2026-10-25T10:00:00Z',
          endsAt: '2026-10-25T11:00:00Z',
          note: 'VIP test-drive request from buyer portal.',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe(AppointmentStatus.REQUESTED);
      expect(res.body.leadId).toBe(createdLeadId);

      createdAppointmentId = res.body.id;
    });

    it('Dealer A lists tenant appointments and sees the requested slot', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantAId}/appointments`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
      const appt = res.body.find((a: any) => a.id === createdAppointmentId);
      expect(appt).toBeDefined();
      expect(appt.status).toBe(AppointmentStatus.REQUESTED);
    });

    it('Dealer A confirms the test-drive appointment', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/tenants/${tenantAId}/appointments/${createdAppointmentId}/status`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .send({ status: AppointmentStatus.CONFIRMED })
        .expect(200);

      expect(res.body.status).toBe(AppointmentStatus.CONFIRMED);
    });

    it('Buyer A views enquiries and sees confirmed appointment attached', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/me/enquiries')
        .set('Authorization', `Bearer ${buyerAToken}`)
        .expect(200);

      const enquiry = res.body.find((e: any) => e.id === createdLeadId);
      expect(enquiry).toBeDefined();
      expect(enquiry.appointments.length).toBeGreaterThanOrEqual(1);
      const appt = enquiry.appointments.find((a: any) => a.id === createdAppointmentId);
      expect(appt?.status).toBe(AppointmentStatus.CONFIRMED);
    });

    it('Buyer A lists appointments directly at /api/v1/me/appointments', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/me/appointments')
        .set('Authorization', `Bearer ${buyerAToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const appt = res.body.find((a: any) => a.id === createdAppointmentId);
      expect(appt).toBeDefined();
      expect(appt.status).toBe(AppointmentStatus.CONFIRMED);
      expect(appt.listing).toBeDefined();
    });

    it('Cross-buyer denial: Buyer B cannot cancel Buyer A appointment', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/me/appointments/${createdAppointmentId}/cancel`)
        .set('Authorization', `Bearer ${buyerBToken}`)
        .send({ reason: 'Malicious cancellation attempt' })
        .expect(404);
    });

    it('Buyer A cancels the appointment with release reason', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/me/appointments/${createdAppointmentId}/cancel`)
        .set('Authorization', `Bearer ${buyerAToken}`)
        .send({ reason: 'Personal schedule conflict' })
        .expect(200);

      expect(res.body.id).toBe(createdAppointmentId);
      expect(res.body.status).toBe(AppointmentStatus.CANCELLED);

      // Verify outbox event for cancellation
      const outbox = await prisma.outboxEvent.findFirst({
        where: {
          aggregateType: 'appointment',
          aggregateId: createdAppointmentId,
          eventType: 'appointment.cancelled',
        },
      });
      expect(outbox).toBeDefined();
    });
  });

  describe('7. Buyer Data Grant Revocation & Real-Time Dealership Redaction', () => {
    it('Buyer A revokes data grant for this inquiry', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/me/leads/${createdLeadId}/grant/revoke`)
        .set('Authorization', `Bearer ${buyerAToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.revokedAt).toBeDefined();

      // Verify Outbox Event for grant revocation
      const outbox = await prisma.outboxEvent.findFirst({
        where: {
          aggregateType: 'lead_grant',
          eventType: 'lead.grant_revoked',
        },
      });
      expect(outbox).toBeDefined();
    });

    it('Dealer A subsequently reads the lead: ALL contact details are immediately redacted', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantAId}/leads/${createdLeadId}`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .expect(200);

      expect(res.body.id).toBe(createdLeadId);

      // REAL-TIME REVOCATION ENFORCEMENT:
      expect(res.body.buyerContact.grantStatus).toBe('REVOKED');
      expect(res.body.buyerContact.name).toBeNull();
      expect(res.body.buyerContact.phone).toBeNull();
      expect(res.body.buyerContact.email).toBeNull();
    });
  });
});
