import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security: Configurable explicit CORS allowlist
  const isProductionOrStaging =
    process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging";
  const rawCorsOrigins = process.env.CORS_ORIGINS || "";
  const allowedOrigins = rawCorsOrigins
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  if (isProductionOrStaging && allowedOrigins.length === 0) {
    console.warn(
      `[SECURITY_WARNING] CORS_ORIGINS is unset in ${process.env.NODE_ENV}. Strict fail-closed active: no cross-origin browser requests will be permitted.`
    );
  }

  app.enableCors({
    origin: (requestOrigin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!requestOrigin) {
        return callback(null, true);
      }

      if (isProductionOrStaging) {
        // Fail closed if CORS_ORIGINS is empty
        if (allowedOrigins.length === 0) {
          return callback(
            new Error(
              `CORS_NOT_ALLOWED: Fail-closed active. No cross-origin requests permitted in ${process.env.NODE_ENV}.`,
            ),
            false,
          );
        }

        // Must match explicitly configured origins and MUST be HTTPS (no localhost, no wildcard suffix)
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

      // Development / test fallback
      if (
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(requestOrigin) ||
        requestOrigin.startsWith("http://localhost:")
      ) {
        return callback(null, true);
      }

      return callback(
        new Error(
          `CORS_NOT_ALLOWED: Origin ${requestOrigin} is not in approved allowlist`,
        ),
        false,
      );
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-correlation-id",
      "Accept",
    ],
    exposedHeaders: ["x-correlation-id"],
    maxAge: 86400,
  });

  // Security: Defense-in-depth HTTP response headers & safe no-store cache headers
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
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
  });

  // Global Exception Filter for standardized API contract errors: { error: { code, message, correlationId } }
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global Validation Pipe for strict DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // OpenAPI (Swagger) Documentation Setup
  const config = new DocumentBuilder()
    .setTitle("Automotive OS API")
    .setDescription(
      "UAE Dealership SaaS & Verified-Dealer Marketplace Modular Monolith API",
    )
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("health", "Health & liveness probes")
    .addTag("auth", "OIDC identity and authentication")
    .addTag("me", "Global buyer identity and user preferences")
    .addTag("tenants", "Dealer tenancy operations and role permissions")
    .addTag("admin", "Audited platform administration")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || process.env.API_PORT || 4000;
  await app.listen(port, "0.0.0.0");
  console.log(`[API] Server listening on port ${port} | OpenAPI at /api/docs`);
}

void bootstrap();
