import { AuditService } from './audit.service';
import * as prismaModule from '../database/prisma.service';

jest.mock('../database/prisma.service', () => ({
  PrismaService: class {},
  hasActiveTransaction: jest.fn(),
}));

/** QA-LOCAL-08: inside a transaction an audit failure must abort the change. */
describe('AuditService.logAction', () => {
  const create = jest.fn();
  const service = new AuditService({ auditEvent: { create } } as any);
  const hasActiveTransaction = prismaModule.hasActiveTransaction as jest.Mock;

  beforeEach(() => {
    create.mockReset();
    hasActiveTransaction.mockReset();
  });

  it('swallows a write failure outside a transaction (best effort logging)', async () => {
    hasActiveTransaction.mockReturnValue(false);
    create.mockRejectedValue(new Error('disk full'));
    await expect(service.logAction({ action: 'X', targetType: 'y', targetId: 'z' })).resolves.toBeUndefined();
  });

  it('rethrows a write failure inside a transaction so the change rolls back', async () => {
    hasActiveTransaction.mockReturnValue(true);
    create.mockRejectedValue(new Error('policy denied'));
    await expect(service.logAction({ action: 'X', targetType: 'y', targetId: 'z' })).rejects.toThrow('policy denied');
  });

  it('writes the row with null defaults for optional fields', async () => {
    hasActiveTransaction.mockReturnValue(false);
    create.mockResolvedValue({});
    await service.logAction({ action: 'X', targetType: 'y', targetId: 'z' });
    expect(create).toHaveBeenCalledWith({
      data: { tenantId: null, actorUserId: null, action: 'X', targetType: 'y', targetId: 'z', correlationId: null, metadata: {} },
    });
  });
});
