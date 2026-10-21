import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

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
    })
  );

  // OpenAPI (Swagger) Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Automotive OS API')
    .setDescription('UAE Dealership SaaS & Verified-Dealer Marketplace Modular Monolith API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('health', 'Health & liveness probes')
    .addTag('auth', 'OIDC identity and authentication')
    .addTag('me', 'Global buyer identity and user preferences')
    .addTag('tenants', 'Dealer tenancy operations and role permissions')
    .addTag('admin', 'Audited platform administration')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.API_PORT || process.env.PORT || 4000;
  await app.listen(port);
  console.log(`[API] Server listening on port ${port} | OpenAPI at /api/docs`);
}

void bootstrap();
