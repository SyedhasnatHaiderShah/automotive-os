import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { MeModule } from './me/me.module';
import { TenantsModule } from './tenants/tenants.module';
import { AdminModule } from './admin/admin.module';
import { InventoryModule } from './inventory/inventory.module';
import { ListingsModule } from './listings/listings.module';
import { LeadsModule } from './leads/leads.module';
import { HealthModule } from './health/health.module';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';

@Module({
  imports: [
    DatabaseModule,
    AuditModule,
    AuthModule,
    MeModule,
    TenantsModule,
    AdminModule,
    InventoryModule,
    ListingsModule,
    LeadsModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
