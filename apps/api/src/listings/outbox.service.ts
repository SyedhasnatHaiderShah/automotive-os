import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService, runWithDbContext } from '../database/prisma.service';
import { OutboxStatus } from '@automotive-os/database';
import { ListingSearchSyncService } from './listing-search-sync.service';

export interface OutboxMetricsDto {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  total: number;
}

@Injectable()
export class OutboxService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxService.name);
  private workerTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchSyncService: ListingSearchSyncService
  ) {}

  async onModuleInit() {
    // Warm up the public search projection on startup
    try {
      await this.searchSyncService.syncAllActiveListings();
    } catch (err: any) {
      this.logger.warn(
        `Initial search projection warm-up deferred: ${err.message}`
      );
    }
  }

  onModuleDestroy() {
    this.stopWorker();
  }

  /**
   * Process pending outbox events idempotently.
   * Can be invoked by a cron job, BullMQ worker, or directly within test suites.
   */
  async processPendingEvents(limit = 50): Promise<number> {
    if (this.isProcessing) {
      return 0;
    }
    this.isProcessing = true;

    try {
      return await runWithDbContext({ isAdmin: true }, async () => {
        const pendingEvents = await this.prisma.outboxEvent.findMany({
        where: {
          status: OutboxStatus.PENDING,
        },
        orderBy: { occurredAt: 'asc' },
        take: limit,
      });

      if (pendingEvents.length === 0) {
        return 0;
      }

      let processedCount = 0;

      for (const event of pendingEvents) {
        try {
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: OutboxStatus.PROCESSING,
              attempts: { increment: 1 },
            },
          });

          // Route event to synchronized read projection handlers
          await this.dispatchToProjections(event);

          this.logger.log(
            `Dispatched Outbox Event [${event.eventType}] for aggregate [${event.aggregateType}:${event.aggregateId}]`
          );

          // Mark as SENT
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: OutboxStatus.SENT,
              processedAt: new Date(),
            },
          });

          processedCount++;
        } catch (err: any) {
          this.logger.error(
            `Failed to process Outbox Event [${event.id}]: ${err.message}`,
            err.stack
          );

          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status:
                event.attempts + 1 >= 3
                  ? OutboxStatus.FAILED
                  : OutboxStatus.PENDING,
            },
          });
        }
      }

      return processedCount;
      });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Dispatch outbox events to read projections and indexing pipelines.
   */
  private async dispatchToProjections(event: {
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    payload: any;
  }): Promise<void> {
    const payload = event.payload as any;

    switch (event.eventType) {
      case 'listing.published':
        await this.searchSyncService.handleListingPublished({
          listingId: payload.listingId || event.aggregateId,
          vehicleId: payload.vehicleId,
        });
        break;

      case 'listing.unpublished':
        await this.searchSyncService.handleListingUnpublished({
          listingId: payload.listingId || event.aggregateId,
          vehicleId: payload.vehicleId,
          reason: payload.reason,
        });
        break;

      case 'listing.rejected':
        await this.searchSyncService.handleListingRejected({
          listingId: payload.listingId || event.aggregateId,
          reason: payload.reason,
        });
        break;

      case 'tenant.suspended':
        await this.searchSyncService.handleTenantSuspended(event.aggregateId);
        break;

      default:
        // Other events (e.g. lead.created, appointment.scheduled) can route to notifications/CRM
        break;
    }
  }

  /**
   * Start automated background polling worker loop.
   */
  startWorker(intervalMs = 3000): void {
    if (this.workerTimer) return;
    this.logger.log(
      `Starting background Outbox worker loop (polling every ${intervalMs}ms)`
    );
    this.workerTimer = setInterval(async () => {
      try {
        await this.processPendingEvents(50);
      } catch (err: any) {
        this.logger.error(`Outbox worker loop error: ${err.message}`);
      }
    }, intervalMs);
  }

  /**
   * Stop background polling worker.
   */
  stopWorker(): void {
    if (this.workerTimer) {
      clearInterval(this.workerTimer);
      this.workerTimer = null;
      this.logger.log('Stopped background Outbox worker loop.');
    }
  }

  /**
   * Returns current health & backlog metrics for Outbox queue.
   */
  async getMetrics(): Promise<OutboxMetricsDto> {
    return runWithDbContext({ isAdmin: true }, async () => {
      const [pending, processing, sent, failed, total] = await Promise.all([
        this.prisma.outboxEvent.count({ where: { status: OutboxStatus.PENDING } }),
        this.prisma.outboxEvent.count({ where: { status: OutboxStatus.PROCESSING } }),
        this.prisma.outboxEvent.count({ where: { status: OutboxStatus.SENT } }),
        this.prisma.outboxEvent.count({ where: { status: OutboxStatus.FAILED } }),
        this.prisma.outboxEvent.count(),
      ]);

      return {
        pending,
        processing,
        sent,
        failed,
        total,
      };
    });
  }

  /**
   * Retry all failed events by resetting status to PENDING and attempts to 0.
   */
  async retryFailedEvents(): Promise<number> {
    const result = await this.prisma.outboxEvent.updateMany({
      where: { status: OutboxStatus.FAILED },
      data: {
        status: OutboxStatus.PENDING,
        attempts: 0,
      },
    });
    return result.count;
  }
}
