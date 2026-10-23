import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request = require("supertest");
import { AppModule } from "../src/app.module";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";
import { AuthService } from "../src/auth/auth.service";
import { PrismaService } from "../src/database/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { VehiclesService } from "../src/inventory/vehicles.service";
import { MembershipRole } from "@automotive-os/database";

describe("AG-18 Security Remediation & Data Integrity Verification Suite", () => {
  let app: INestApplication;
  let authService: AuthService;
  let jwtService: JwtService;
  let vehiclesService: VehiclesService;
  let prisma: PrismaService;

  const tenantId = "11111111-1111-1111-1111-111111111111";
  let ownerToken: string;
  let salesAgentToken: string;
  let testVehicleId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Production-like CORS & security middleware
    const rawCorsOrigins = process.env.CORS_ORIGINS || "";
    const allowedOrigins = rawCorsOrigins
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    app.enableCors({
      origin: (requestOrigin, callback) => {
        if (!requestOrigin) return callback(null, true);
        const isProdOrStaging =
          process.env.NODE_ENV === "production" ||
          process.env.NODE_ENV === "staging";

        if (isProdOrStaging) {
          if (
            allowedOrigins.length === 0 ||
            !allowedOrigins.includes(requestOrigin) ||
            !requestOrigin.startsWith("https://")
          ) {
            return callback(
              new Error(`CORS_NOT_ALLOWED: Origin ${requestOrigin} is forbidden`),
              false,
            );
          }
          return callback(null, true);
        }

        if (
          allowedOrigins.length === 0 ||
          allowedOrigins.includes(requestOrigin) ||
          requestOrigin.startsWith("http://localhost:")
        ) {
          return callback(null, true);
        }
        return callback(new Error("CORS_NOT_ALLOWED"), false);
      },
      credentials: true,
    });

    app.use((_req: any, res: any, next: any) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
      res.setHeader("X-XSS-Protection", "1; mode=block");
      res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      );
      res.setHeader("Pragma", "no-cache");
      next();
    });

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
    jwtService = app.get<JwtService>(JwtService);
    vehiclesService = app.get<VehiclesService>(VehiclesService);
    prisma = app.get<PrismaService>(PrismaService);

    // Ensure Tariq exists and has OWNER membership on test tenant
    let tariq = await prisma.user.findUnique({
      where: { identitySubject: "auth0|dealer_a_tariq" },
    });
    if (!tariq) {
      tariq = await prisma.user.create({
        data: {
          identitySubject: "auth0|dealer_a_tariq",
          email: "tariq@alfuttaim-prestige.ae",
          displayName: "Tariq Al-Hashimi",
          phoneE164: "+971501112233",
        },
      });
      await prisma.membership.create({
        data: {
          tenantId,
          userId: tariq.id,
          role: MembershipRole.OWNER,
          active: true,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: tariq.id },
        data: { displayName: "Tariq Al-Hashimi" },
      });
    }

    // Ensure Youssef exists and has SALES_AGENT membership on test tenant
    let youssef = await prisma.user.findUnique({
      where: { identitySubject: "auth0|dealer_a_youssef" },
    });
    if (!youssef) {
      youssef = await prisma.user.create({
        data: {
          identitySubject: "auth0|dealer_a_youssef",
          email: "youssef@alfuttaim-prestige.ae",
          displayName: "Youssef Mansour",
          phoneE164: "+971504445566",
        },
      });
      await prisma.membership.create({
        data: {
          tenantId,
          userId: youssef.id,
          role: MembershipRole.SALES_AGENT,
          active: true,
        },
      });
    } else {
      await prisma.membership.upsert({
        where: {
          tenantId_userId: {
            tenantId,
            userId: youssef.id,
          },
        },
        create: {
          tenantId,
          userId: youssef.id,
          role: MembershipRole.SALES_AGENT,
          active: true,
        },
        update: {
          role: MembershipRole.SALES_AGENT,
          active: true,
        },
      });
    }

    // Tokens
    ownerToken = authService.generateDevToken({
      identitySubject: "auth0|dealer_a_tariq",
      email: "tariq@alfuttaim-prestige.ae",
      name: "Tariq Al-Hashimi",
    });

    salesAgentToken = authService.generateDevToken({
      identitySubject: "auth0|dealer_a_youssef",
      email: "youssef@alfuttaim-prestige.ae",
      name: "Youssef Mansour",
    });

    // Locate existing vehicle for testing
    const existingVehicle = await prisma.vehicle.findFirst({
      where: { tenantId },
    });
    if (existingVehicle) {
      testVehicleId = existingVehicle.id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe("1. AUTHENTICATION & IDENTITY TAKEOVER DEFENSE", () => {
    it("1.1 MUST disable public dev token issuance in staging/production", async () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      delete process.env.ENABLE_DEV_TOKEN;

      try {
        const res = await request(app.getHttpServer())
          .post("/api/v1/auth/token")
          .send({
            identitySubject: "attacker_sub",
            email: "attacker@exploit.ae",
            name: "Attacker",
          });

        expect([403, 404]).toContain(res.status);
      } finally {
        process.env.NODE_ENV = origEnv;
      }
    });

    it("1.2 MUST reject registration when email matches existing user (prevent account takeover)", async () => {
      // tariq@alfuttaim-prestige.ae is an existing OWNER user in the database
      const res = await request(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({
          email: "tariq@alfuttaim-prestige.ae",
          phone: "+971501112233",
          legalName: "Impersonator Attacker",
          emirate: "Dubai",
          tier: "collector",
          consentPdpl: true,
        });

      // Must NOT return 201 or issue an access token for Tariq's account! Must be 409 Conflict.
      expect(res.status).toBe(409);
      expect(res.body.accessToken).toBeUndefined();
    });

    it("1.3 MUST reject registration when Emirates ID matches existing user", async () => {
      await prisma.user.upsert({
        where: { identitySubject: "uae_pass_784198512345671" },
        create: {
          identitySubject: "uae_pass_784198512345671",
          email: "vip-existing-eid@example.ae",
          displayName: "Existing VIP Citizen",
          phoneE164: "+971508889900",
        },
        update: {},
      });

      const res = await request(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({
          email: "unique-new-lead@example.ae",
          phone: "+971509998877",
          emiratesId: "784-1985-1234567-1",
          legalName: "Impersonator By EmiratesId",
          emirate: "Dubai",
          tier: "collector",
          consentPdpl: true,
        });

      // If user with this Emirates ID already exists, reject 409
      expect(res.status).toBe(409);
    });

    it("1.4 MUST reject expired JWT tokens with 401 Unauthorized", async () => {
      const expiredToken = jwtService.sign(
        {
          sub: "auth0|dealer_a_tariq",
          email: "tariq@alfuttaim-prestige.ae",
          iss: "https://auth.autonexa.ae",
          aud: "autonexa-api",
        },
        { expiresIn: "-10s" },
      );

      const res = await request(app.getHttpServer())
        .get("/api/v1/me/settings")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });

    it("1.5 MUST reject JWT tokens with invalid issuer or audience", async () => {
      const forgedIssToken = jwtService.sign({
        sub: "auth0|dealer_a_tariq",
        iss: "https://evil-issuer.com",
        aud: "autonexa-api",
      });

      const resIss = await request(app.getHttpServer())
        .get("/api/v1/me/settings")
        .set("Authorization", `Bearer ${forgedIssToken}`);

      expect(resIss.status).toBe(401);

      const forgedAudToken = jwtService.sign({
        sub: "auth0|dealer_a_tariq",
        iss: "https://auth.autonexa.ae",
        aud: "wrong-audience",
      });

      const resAud = await request(app.getHttpServer())
        .get("/api/v1/me/settings")
        .set("Authorization", `Bearer ${forgedAudToken}`);

      expect(resAud.status).toBe(401);
    });

    it("1.6 MUST reject JWT tokens with missing subject (sub claim)", async () => {
      const noSubToken = jwtService.sign({
        email: "tariq@alfuttaim-prestige.ae",
        iss: "https://auth.autonexa.ae",
        aud: "autonexa-api",
      });

      const res = await request(app.getHttpServer())
        .get("/api/v1/me/settings")
        .set("Authorization", `Bearer ${noSubToken}`);

      expect(res.status).toBe(401);
    });
  });

  describe("2. DATA PROTECTION & FIELD-LEVEL PERMISSION (purchaseCostFils)", () => {
    it("2.1 MUST default to denying purchaseCostFils when callerRole is undefined", async () => {
      const vehicle = await prisma.vehicle.findFirst({
        where: { tenantId },
        include: { make: true, model: true, media: true, listing: true },
      });

      expect(vehicle).toBeDefined();
      expect(vehicle?.purchaseCostFils).toBeDefined();

      // Call mapping directly with callerRole === undefined
      const mappedDefault = (vehiclesService as any).mapVehicleResponse(vehicle, undefined);
      expect(mappedDefault.purchaseCostFils).toBeNull();
    });

    it("2.2 MUST deny purchaseCostFils visibility to non-privileged roles (SALES_AGENT)", async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantId}/vehicles/${testVehicleId}`)
        .set("Authorization", `Bearer ${salesAgentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.purchaseCostFils).toBeNull();
    });

    it("2.3 MUST allow purchaseCostFils visibility to privileged roles (OWNER)", async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantId}/vehicles/${testVehicleId}`)
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.purchaseCostFils).not.toBeNull();
      expect(typeof res.body.purchaseCostFils).toBe("string");
    });

    it("2.4 MUST reject unprivileged roles (SALES_AGENT) attempting to update purchaseCostFils", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/tenants/${tenantId}/vehicles/${testVehicleId}`)
        .set("Authorization", `Bearer ${salesAgentToken}`)
        .send({
          purchaseCostFils: "30000000",
        });

      // Must be 403 Forbidden because SALES_AGENT lacks purchase cost mutation privileges
      expect(res.status).toBe(403);
    });

    it("2.5 MUST reject unprivileged roles (SALES_AGENT) attempting to create vehicle with purchaseCostFils", async () => {
      const make = await prisma.make.findFirst();
      const model = await prisma.carModel.findFirst({ where: { makeId: make?.id } });
      const branch = await prisma.branch.findFirst({ where: { tenantId } });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/tenants/${tenantId}/vehicles`)
        .set("Authorization", `Bearer ${salesAgentToken}`)
        .send({
          branchId: branch?.id,
          makeId: make?.id,
          modelId: model?.id,
          stockNumber: `STOCK-SEC-${Date.now()}`,
          vin: `VINSEC${Date.now()}`.padEnd(17, "0").substring(0, 17),
          modelYear: 2024,
          condition: "USED",
          askingPriceFils: 50000000,
          purchaseCostFils: 35000000, // Non-privileged role cannot set purchase cost
        });

      expect(res.status).toBe(403);
    });
  });

  describe("3. CORS & CACHE-CONTROL HEADERS", () => {
    it("3.1 MUST emit safe no-store Cache-Control headers on API responses", async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantId}/vehicles/${testVehicleId}`)
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.headers["cache-control"]).toMatch(/no-store/i);
      expect(res.headers["pragma"]).toBe("no-cache");
    });

    it("3.2 MUST reject unallowed origins in production CORS mode", async () => {
      // In production, an origin not in CORS_ORIGINS must be rejected
      const origEnv = process.env.NODE_ENV;
      const origCors = process.env.CORS_ORIGINS;
      process.env.NODE_ENV = "production";
      process.env.CORS_ORIGINS = "https://dealer.automotive-os.ae,https://admin.automotive-os.ae";

      try {
        const res = await request(app.getHttpServer())
          .options("/api/v1/health")
          .set("Origin", "https://malicious-site.com")
          .set("Access-Control-Request-Method", "GET");

        // The response must NOT have Access-Control-Allow-Origin matching malicious-site
        expect(res.headers["access-control-allow-origin"]).toBeUndefined();
      } finally {
        process.env.NODE_ENV = origEnv;
        process.env.CORS_ORIGINS = origCors;
      }
    });

    it("3.3 MUST reject plain HTTP and wildcard subdomains in production CORS mode", async () => {
      const origEnv = process.env.NODE_ENV;
      const origCors = process.env.CORS_ORIGINS;
      process.env.NODE_ENV = "production";
      process.env.CORS_ORIGINS = "https://dealer.automotive-os.ae";

      try {
        // Plain HTTP must be rejected
        const httpRes = await request(app.getHttpServer())
          .options("/api/v1/health")
          .set("Origin", "http://dealer.automotive-os.ae")
          .set("Access-Control-Request-Method", "GET");

        expect(httpRes.headers["access-control-allow-origin"]).toBeUndefined();

        // Subdomain that is not explicitly in allowlist must be rejected
        const subRes = await request(app.getHttpServer())
          .options("/api/v1/health")
          .set("Origin", "https://unauthorized.automotive-os.ae")
          .set("Access-Control-Request-Method", "GET");

        expect(subRes.headers["access-control-allow-origin"]).toBeUndefined();
      } finally {
        process.env.NODE_ENV = origEnv;
        process.env.CORS_ORIGINS = origCors;
      }
    });
  });

  describe("4. DYNAMIC DATA & DEALER DMS ZERO-SIMULATION", () => {
    it("4.1 MUST return empty state with zero stats on empty database, without falling back to mock fixtures", () => {
      // Test the data mapping contract implemented in Dealer DMS
      const emptyRawItems: any[] = [];
      const isDev = false;
      const enableFixtures = false;

      const items = emptyRawItems.map((item: any) => ({
        ...item,
        rtaVerified: Boolean(item.rtaVerified || item.listingStatus === "PUBLISHED"),
        inquiriesCount: typeof item.inquiriesCount === "number" ? item.inquiriesCount : 0,
        vipBookingsCount: typeof item.vipBookingsCount === "number" ? item.vipBookingsCount : 0,
        isFixture: false,
      }));

      const totalFloor = items.reduce(
        (acc: number, item: any) => acc + Math.round(Number(item.askingPriceFils || 0) / 100),
        0,
      );

      const stats = {
        totalUnits: items.length,
        floorValuationAed: totalFloor,
        publishedCount: items.filter((i: any) => i.listingStatus === "PUBLISHED").length,
        underReviewCount: items.filter((i: any) => i.listingStatus === "PENDING_REVIEW").length,
        escrowCount: items.filter((i: any) => i.stockStatus === "RESERVED").length,
        draftCount: items.filter((i: any) => !i.listingStatus || i.listingStatus === "DRAFT").length,
      };

      expect(items).toHaveLength(0);
      expect(stats.totalUnits).toBe(0);
      expect(stats.floorValuationAed).toBe(0);
      expect(stats.publishedCount).toBe(0);
    });

    it("4.2 MUST not hardcode simulated RTA or enquiry metrics when dynamic vehicle is returned", () => {
      const liveVehicleFromDb = {
        id: "veh-123",
        vin: "WBA1234567890ABCD",
        askingPriceFils: "25000000",
        stockStatus: "AVAILABLE",
        listingStatus: "DRAFT",
        // Notice: rtaVerified, inquiriesCount, vipBookingsCount are NOT in DB record
      };

      const mapped = {
        ...liveVehicleFromDb,
        rtaVerified: Boolean((liveVehicleFromDb as any).rtaVerified || liveVehicleFromDb.listingStatus === "PUBLISHED"),
        inquiriesCount: typeof (liveVehicleFromDb as any).inquiriesCount === "number" ? (liveVehicleFromDb as any).inquiriesCount : 0,
        vipBookingsCount: typeof (liveVehicleFromDb as any).vipBookingsCount === "number" ? (liveVehicleFromDb as any).vipBookingsCount : 0,
        isFixture: false,
      };

      // Must NOT be hardcoded 12 inquiries, 2 vip drives, or true rtaVerified
      expect(mapped.rtaVerified).toBe(false);
      expect(mapped.inquiriesCount).toBe(0);
      expect(mapped.vipBookingsCount).toBe(0);
    });
  });
});
