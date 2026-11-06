import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { ListingsModule } from '../listings/listings.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminDataController } from './data/admin-data.controller';
import { AdminDataService } from './data/admin-data.service';

@Module({
  imports: [DatabaseModule, AuditModule, ListingsModule],
  controllers: [AdminController, AdminDataController],
  providers: [AdminService, AdminDataService],
  exports: [AdminService],
})
export class AdminModule {}
