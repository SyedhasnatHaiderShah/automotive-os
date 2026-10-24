import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@automotive-os/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const isProductionOrStaging = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';
    const databaseUrl = process.env.DATABASE_URL;

    if (isProductionOrStaging && !databaseUrl) {
      throw new Error(
        `[SECURITY_FATAL] DATABASE_URL must be explicitly configured in '${process.env.NODE_ENV}' environment. Fail-open localhost defaults are strictly prohibited.`
      );
    }

    if (!databaseUrl && process.env.NODE_ENV !== 'test') {
      console.warn(
        `[DATABASE_WARNING] DATABASE_URL is not set. Operating in local development mode with fallback connection.`
      );
    }

    super({
      datasources: {
        db: {
          url: databaseUrl || 'postgresql://postgres:postgres@localhost:5432/automotive_os?schema=public',
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
