import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { PublicMediaController } from './public-media.controller';
import { CatalogController } from './catalog.controller';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [VehiclesController, PublicMediaController, CatalogController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class InventoryModule {}
