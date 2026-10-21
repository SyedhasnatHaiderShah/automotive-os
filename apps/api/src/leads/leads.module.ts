import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { LeadsService } from './leads.service';
import { AppointmentsService } from './appointments.service';
import { EnquiryRateLimiterService } from './enquiry-rate-limiter.service';
import { PublicLeadsController } from './public-leads.controller';
import { LeadsController } from './leads.controller';
import { AppointmentsController } from './appointments.controller';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [
    PublicLeadsController,
    LeadsController,
    AppointmentsController,
  ],
  providers: [
    LeadsService,
    AppointmentsService,
    EnquiryRateLimiterService,
  ],
  exports: [LeadsService, AppointmentsService, EnquiryRateLimiterService],
})
export class LeadsModule {}
