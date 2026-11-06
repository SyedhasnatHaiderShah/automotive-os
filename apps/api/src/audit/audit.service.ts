import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, hasActiveTransaction } from '../database/prisma.service';

export interface LogAuditParams {
  tenantId?: string | null;
  actorUserId?: string | null;
  action: string;
  targetType: string;
  targetId: string;
  correlationId?: string | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logAction(params: LogAuditParams): Promise<void> {
    try {
      await this.prisma.auditEvent.create({
        data: {
          tenantId: params.tenantId || null,
          actorUserId: params.actorUserId || null,
          action: params.action,
          targetType: params.targetType,
          targetId: params.targetId,
          correlationId: params.correlationId || null,
          metadata: (params.metadata || {}) as any,
        },
      });
      this.logger.log(
        `[AUDIT] Action: ${params.action} | Target: ${params.targetType}:${params.targetId} | Actor: ${params.actorUserId || 'ANONYMOUS'} | Tenant: ${params.tenantId || 'GLOBAL'}`
      );
    } catch (error: any) {
      // Inside a transaction the audit row is part of the change (workspace
      // rule: audit in the same transaction); a failure must abort the change.
      if (hasActiveTransaction()) {
        throw error;
      }
      this.logger.error(`Failed to write audit event: ${error.message}`, error.stack);
    }
  }
}
