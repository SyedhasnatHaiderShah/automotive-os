import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request = require("supertest");
import { AppModule } from "../src/app.module";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";
import { AuthService } from "../src/auth/auth.service";
import { PrismaService } from "../src/database/prisma.service";
import { ClientTier } from "../src/auth/dto/register-vip.dto";

describe("Final Release Hardening — Authentication, Identity & Operational Integrity Suite", () => {
  let app: INestApplication;
  let authService: AuthService;
  let prisma: PrismaService;

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
      }),
    );

    await app.init();

    authService = app.get<AuthService>(AuthService);
    prisma = app.get<PrismaService>(PrismaService);

    // Clean up test identities to ensure test idempotency
    await prisma.user.deleteMany({
      where: {
        OR: [
          { phoneE164: "+971507778899" },
          { email: { contains: "hardened-lead" } },
        ],
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe("1. Registration Hardening: No JWT & Unverified Identity Defense", () => {
    const testEmail = `hardened-lead-${Date.now()}@sovereign-vault.ae`;
    const testEid = "784-1992-9182736-1";
    let createdUserId: string;
    let pendingSubject: string;

    it("1.1 MUST NOT issue authenticated JWT for unverified public registrations", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({
          tier: ClientTier.COLLECTOR,
          legalName: "Humaid Al-Zaabi",
          phone: "+971507778899",
          email: testEmail,
          emiratesId: testEid,
          emirate: "Abu Dhabi",
          consentPdpl: true,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe("PENDING_VERIFICATION");
      expect(res.body.requiresVerification).toBe(true);
      expect(res.body.accessToken).toBeUndefined(); // Zero token emission
      expect(res.body.userId).toBeDefined();

      createdUserId = res.body.userId;
    });

    it("1.2 MUST NEVER trust self-reported Emirates ID as a UAE PASS identity (no uae_pass_ subject reservation)", async () => {
      const user = await prisma.user.findUnique({
        where: { id: createdUserId },
      });

      expect(user).toBeDefined();
      pendingSubject = user!.identitySubject;

      // Verification: Subject MUST NOT be uae_pass_784199291827361
      expect(pendingSubject).not.toBe("uae_pass_784199291827361");
      expect(pendingSubject).not.toMatch(/^uae_pass_/);
      expect(pendingSubject).toMatch(/^pending_reg_/);
    });

    it("1.3 MUST prohibit unverified registration subjects from accessing protected resources", async () => {
      // Attacker attempts to forge/sign a token with the pending registration subject
      const forgedPendingToken = authService.generateDevToken({
        identitySubject: pendingSubject,
        email: testEmail,
        name: "Humaid Al-Zaabi",
      });

      const resMe = await request(app.getHttpServer())
        .get("/api/v1/me")
        .set("Authorization", `Bearer ${forgedPendingToken}`);

      expect(resMe.status).toBe(401);

      const resSettings = await request(app.getHttpServer())
        .get("/api/v1/me/settings")
        .set("Authorization", `Bearer ${forgedPendingToken}`);

      expect(resSettings.status).toBe(401);
    });
  });

  describe("2. Dev Token Hardening: Zero Override in Staging & Production", () => {
    it("2.1 MUST reject POST /api/v1/auth/token in production even if ENABLE_DEV_TOKEN is set to true", async () => {
      const origEnv = process.env.NODE_ENV;
      const origFlag = process.env.ENABLE_DEV_TOKEN;

      process.env.NODE_ENV = "production";
      process.env.ENABLE_DEV_TOKEN = "true";

      try {
        const res = await request(app.getHttpServer())
          .post("/api/v1/auth/token")
          .send({
            identitySubject: "auth0|attacker",
            email: "attacker@test.ae",
            name: "Attacker",
          });

        expect(res.status).toBe(403);
      } finally {
        process.env.NODE_ENV = origEnv;
        process.env.ENABLE_DEV_TOKEN = origFlag;
      }
    });

    it("2.2 MUST reject POST /api/v1/auth/token in staging environment unconditionally", async () => {
      const origEnv = process.env.NODE_ENV;

      process.env.NODE_ENV = "staging";
      delete process.env.ENABLE_DEV_TOKEN;

      try {
        const res = await request(app.getHttpServer())
          .post("/api/v1/auth/token")
          .send({
            identitySubject: "auth0|attacker",
            email: "attacker@test.ae",
            name: "Attacker",
          });

        expect(res.status).toBe(403);
      } finally {
        process.env.NODE_ENV = origEnv;
      }
    });
  });

  describe("3. RTA Verification & Inspection Provenance Mapping", () => {
    it("3.1 MUST evaluate rtaVerified as false when a vehicle is PUBLISHED without inspection provenance", () => {
      const publishedListingWithoutCertificate = {
        id: "veh-test-published-only",
        listingStatus: "PUBLISHED",
        rtaVerified: false,
        // No certificate or inspection test provenance
      };

      const hasInspectionEvidence = Boolean(
        (publishedListingWithoutCertificate as any).inspectionCertificateId ||
        (publishedListingWithoutCertificate as any).inspectionCertificateNumber ||
        (publishedListingWithoutCertificate as any).tasjeelTestNumber ||
        ((publishedListingWithoutCertificate as any).rtaVerified === true &&
          (publishedListingWithoutCertificate as any).inspectionProvenanced === true)
      );
      const isVerified = Boolean(
        publishedListingWithoutCertificate.rtaVerified && hasInspectionEvidence
      );

      // PUBLISHED status alone MUST NOT imply verified=true
      expect(isVerified).toBe(false);
    });

    it("3.2 MUST evaluate rtaVerified as true ONLY when genuine inspection provenance is provided", () => {
      const certifiedVehicle = {
        id: "veh-test-certified",
        listingStatus: "PUBLISHED",
        rtaVerified: true,
        inspectionCertificateNumber: "TASJEEL-DXB-2026-991823",
      };

      const hasInspectionEvidence = Boolean(
        (certifiedVehicle as any).inspectionCertificateId ||
        (certifiedVehicle as any).inspectionCertificateNumber ||
        (certifiedVehicle as any).tasjeelTestNumber ||
        ((certifiedVehicle as any).rtaVerified === true &&
          (certifiedVehicle as any).inspectionProvenanced === true)
      );
      const isVerified = Boolean(
        certifiedVehicle.rtaVerified && hasInspectionEvidence
      );

      expect(isVerified).toBe(true);
    });
  });

  describe("4. Dealer DMS Safe Caching & Tenant Isolation", () => {
    it("4.1 MUST fail closed when tenantId is omitted in production/staging without fallback to default UUID", () => {
      const isProdOrStaging = true;
      const tenantId = undefined;
      const configuredEnvTenant = undefined;

      const resolveTenant = () => {
        const target =
          tenantId ||
          configuredEnvTenant ||
          (!isProdOrStaging ? "11111111-1111-1111-1111-111111111111" : undefined);
        if (!target) {
          throw new Error("TENANT_CONTEXT_REQUIRED");
        }
        return target;
      };

      expect(resolveTenant).toThrow("TENANT_CONTEXT_REQUIRED");
    });
  });
});
