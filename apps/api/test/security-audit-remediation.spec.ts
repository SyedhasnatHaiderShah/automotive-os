import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request = require("supertest");
import { AppModule } from "../src/app.module";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";
import { AuthService } from "../src/auth/auth.service";
import { PrismaService } from "../src/database/prisma.service";
import {
  MembershipRole,
  StockStatus,
  VehicleCondition,
} from "@automotive-os/database";

describe("AG-17 Security Audit & Remediation Verification Suite", () => {
  let app: INestApplication;
  let authService: AuthService;
  let prisma: PrismaService;

  let ownerToken: string;
  let salesAgentToken: string;
  let tenantId = "11111111-1111-1111-1111-111111111111";
  let branchId = "11111111-1111-1111-1111-000000000001";
  let testVehicleId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Replicate production security middleware & filter
    app.use((_req: any, res: any, next: any) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
      res.setHeader("X-XSS-Protection", "1; mode=block");
      res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
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
    prisma = app.get<PrismaService>(PrismaService);

    // 1. Issue OWNER Token (Tariq Al-Hashimi)
    ownerToken = authService.generateDevToken({
      identitySubject: "auth0|dealer_a_tariq",
      email: "tariq@alfuttaim-prestige.ae",
      name: "Tariq Al-Hashimi",
    });

    // 2. Create and Issue Junior SALES_AGENT Token
    let agentUser = await prisma.user.findFirst({
      where: { identitySubject: "auth0|sales_agent_audit_test" },
    });
    if (!agentUser) {
      agentUser = await prisma.user.create({
        data: {
          identitySubject: "auth0|sales_agent_audit_test",
          email: "agent_audit@alfuttaim-prestige.ae",
          displayName: "Rashid Agent",
        },
      });
      await prisma.membership.create({
        data: {
          tenantId,
          userId: agentUser.id,
          role: MembershipRole.SALES_AGENT,
          active: true,
        },
      });
    }

    salesAgentToken = authService.generateDevToken({
      identitySubject: "auth0|sales_agent_audit_test",
      email: "agent_audit@alfuttaim-prestige.ae",
      name: "Rashid Agent",
    });

    // 3. Ensure a test vehicle with purchaseCostFils exists
    const make = await prisma.make.findFirst();
    const model = await prisma.carModel.findFirst({
      where: { makeId: make?.id },
    });

    const vehicle = await prisma.vehicle.create({
      data: {
        tenantId,
        branchId,
        makeId: make!.id,
        modelId: model!.id,
        vin: "AUDITTESTVIN00001",
        stockNumber: "STK-AUDIT-001",
        modelYear: 2024,
        condition: VehicleCondition.USED,
        purchaseCostFils: BigInt(85000000), // AED 850,000 wholesale acquisition cost
        askingPriceFils: BigInt(98000000), // AED 980,000 retail price
        stockStatus: StockStatus.AVAILABLE,
      },
    });
    testVehicleId = vehicle.id;
  });

  afterAll(async () => {
    if (testVehicleId) {
      await prisma.vehicle.deleteMany({ where: { id: testVehicleId } });
    }
    await prisma.membership.deleteMany({
      where: { user: { identitySubject: "auth0|sales_agent_audit_test" } },
    });
    await prisma.user.deleteMany({
      where: { identitySubject: "auth0|sales_agent_audit_test" },
    });
    await app.close();
  });

  describe("Finding SEC-002: Defense-in-Depth HTTP Security Response Headers", () => {
    it("GET /health returns nosniff, SAMEORIGIN, and Referrer-Policy headers", async () => {
      const response = await request(app.getHttpServer())
        .get("/health")
        .expect(200);

      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
      expect(response.headers["referrer-policy"]).toBe(
        "strict-origin-when-cross-origin",
      );
    });
  });

  describe("Finding PRIV-001: Role-Aware Wholesale Purchase Cost Redaction", () => {
    it("DEALER OWNER can view confidential purchaseCostFils on single vehicle get", async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantId}/vehicles/${testVehicleId}`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.id).toBe(testVehicleId);
      expect(response.body.askingPriceFils).toBe("98000000");
      // Privileged OWNER receives wholesale acquisition cost
      expect(response.body.purchaseCostFils).toBe("85000000");
    });

    it("DEALER SALES_AGENT receives purchaseCostFils as null (Redacted Margin)", async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantId}/vehicles/${testVehicleId}`)
        .set("Authorization", `Bearer ${salesAgentToken}`)
        .expect(200);

      expect(response.body.id).toBe(testVehicleId);
      expect(response.body.askingPriceFils).toBe("98000000");
      // SALES_AGENT has wholesale cost strictly REDACTED
      expect(response.body.purchaseCostFils).toBeNull();
    });

    it("DEALER SALES_AGENT listing vehicle stock receives purchaseCostFils as null across list", async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantId}/vehicles`)
        .set("Authorization", `Bearer ${salesAgentToken}`)
        .expect(200);

      const target = response.body.items.find(
        (v: any) => v.id === testVehicleId,
      );
      expect(target).toBeDefined();
      expect(target.purchaseCostFils).toBeNull();
      expect(target.askingPriceFils).toBe("98000000");
    });

    it("DEALER OWNER listing vehicle stock receives purchaseCostFils populated", async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantId}/vehicles`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .expect(200);

      const target = response.body.items.find(
        (v: any) => v.id === testVehicleId,
      );
      expect(target).toBeDefined();
      expect(target.purchaseCostFils).toBe("85000000");
    });
  });

  describe("Finding SEC-003: Error Contract Sanitization", () => {
    it("Global exception filter produces standardized { error: { code, message, correlationId } }", async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/api/v1/tenants/${tenantId}/vehicles/00000000-0000-0000-0000-000000000000`,
        )
        .set("Authorization", `Bearer ${ownerToken}`)
        .expect(404);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBeDefined();
      expect(response.body.error.message).toBeDefined();
      expect(response.body.error.correlationId).toBeDefined();
      expect(response.body.error.correlationId).toMatch(/^corr-/);
    });
  });
});
