import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { ListingsService } from './listings.service';
import { OutboxService } from './outbox.service';
import { ListingSearchSyncService } from './listing-search-sync.service';
import { ListingsController } from './listings.controller';
import { AdminListingsController } from './admin-listings.controller';
import { PublicListingsController } from './public-listings.controller';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [
    ListingsController,
    AdminListingsController,
    PublicListingsController,
  ],
  providers: [ListingsService, OutboxService, ListingSearchSyncService],
  exports: [ListingsService, OutboxService, ListingSearchSyncService],
})
export class ListingsModule {}
