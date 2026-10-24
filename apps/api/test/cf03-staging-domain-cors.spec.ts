import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request = require("supertest");
import { AppModule } from "../src/app.module";

describe("CF-03: Staging Domain CORS & Origin Security Gates (syedhasnat.com)", () => {
  let app: INestApplication;
  const originalEnv = process.env.NODE_ENV;
  const originalCors = process.env.CORS_ORIGINS;
  const originalJwt = process.env.JWT_SECRET;

  beforeAll(async () => {
    // Set staging environment, valid JWT secret, and authorized hostnames
    process.env.NODE_ENV = "staging";
    process.env.JWT_SECRET = "staging-jwt-secret-min-32-chars-strictly-secure";
    process.env.CORS_ORIGINS =
      "https://cars-staging.syedhasnat.com,https://dealer-staging.syedhasnat.com,https://admin-staging.syedhasnat.com";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Replicate bootstrap CORS policy from main.ts
    const isProductionOrStaging =
      process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging";
    const rawCorsOrigins = process.env.CORS_ORIGINS || "";
    const allowedOrigins = rawCorsOrigins
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    app.enableCors({
      origin: (requestOrigin, callback) => {
        if (!requestOrigin) {
          return callback(null, true);
        }
        if (isProductionOrStaging) {
          if (allowedOrigins.length === 0) {
            return callback(
              new Error("CORS_NOT_ALLOWED: Fail-closed active."),
              false,
            );
          }
          const isExplicitlyAllowed = allowedOrigins.includes(requestOrigin);
          const isHttps = requestOrigin.startsWith("https://");
          if (isExplicitlyAllowed && isHttps) {
            return callback(null, true);
          }
          return callback(
            new Error(
              `CORS_NOT_ALLOWED: Origin ${requestOrigin} is not in approved HTTPS allowlist`,
            ),
            false,
          );
        }
        callback(null, true);
      },
    });

    await app.init();
  });

  afterAll(async () => {
    process.env.NODE_ENV = originalEnv;
    process.env.CORS_ORIGINS = originalCors;
    process.env.JWT_SECRET = originalJwt;
    if (app) {
      await app.close();
    }
  });

  it("MUST permit preflight request from Buyer Marketplace (https://cars-staging.syedhasnat.com)", async () => {
    const res = await request(app.getHttpServer())
      .options("/health")
      .set("Origin", "https://cars-staging.syedhasnat.com")
      .set("Access-Control-Request-Method", "GET");

    expect(res.headers["access-control-allow-origin"]).toBe(
      "https://cars-staging.syedhasnat.com",
    );
  });

  it("MUST permit preflight request from Dealer DMS (https://dealer-staging.syedhasnat.com)", async () => {
    const res = await request(app.getHttpServer())
      .options("/health")
      .set("Origin", "https://dealer-staging.syedhasnat.com")
      .set("Access-Control-Request-Method", "GET");

    expect(res.headers["access-control-allow-origin"]).toBe(
      "https://dealer-staging.syedhasnat.com",
    );
  });

  it("MUST permit preflight request from Platform Admin (https://admin-staging.syedhasnat.com)", async () => {
    const res = await request(app.getHttpServer())
      .options("/health")
      .set("Origin", "https://admin-staging.syedhasnat.com")
      .set("Access-Control-Request-Method", "GET");

    expect(res.headers["access-control-allow-origin"]).toBe(
      "https://admin-staging.syedhasnat.com",
    );
  });

  it("MUST reject plain HTTP request (http://cars-staging.syedhasnat.com)", async () => {
    const res = await request(app.getHttpServer())
      .options("/health")
      .set("Origin", "http://cars-staging.syedhasnat.com")
      .set("Access-Control-Request-Method", "GET");

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("MUST reject unauthorized subdomains (https://unauthorized.syedhasnat.com)", async () => {
    const res = await request(app.getHttpServer())
      .options("/health")
      .set("Origin", "https://unauthorized.syedhasnat.com")
      .set("Access-Control-Request-Method", "GET");

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("MUST isolate personal portfolio domain from private operational API CORS (https://syedhasnat.com)", async () => {
    const res = await request(app.getHttpServer())
      .options("/health")
      .set("Origin", "https://syedhasnat.com")
      .set("Access-Control-Request-Method", "GET");

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
