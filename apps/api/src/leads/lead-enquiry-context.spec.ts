import { LeadsService } from './leads.service';
import { dbContextStorage } from '../database/prisma.service';

describe('LeadsService.createLeadEnquiry DB context', () => {
  it('validates the listing elevated, then writes in the listing tenant context (server-derived)', async () => {
    const seen: Record<string, unknown> = {};
    const tx = {
      lead: { create: jest.fn().mockResolvedValue({ id: 'lead-1', status: 'NEW', listingId: 'listing-1', tenantId: 'tenant-1', intent: 'ENQUIRY', createdAt: new Date() }) },
      leadDataGrant: { create: jest.fn() },
      outboxEvent: { create: jest.fn() },
      auditEvent: { create: jest.fn() },
    };
    const prisma: any = {
      listing: {
        findFirst: jest.fn().mockImplementation(() => {
          seen.read = dbContextStorage.getStore();
          return Promise.resolve({
            id: 'listing-1', tenantId: 'tenant-1', status: 'PUBLISHED',
            vehicle: { stockStatus: 'AVAILABLE' }, tenant: { status: 'ACTIVE' },
          });
        }),
      },
      $transaction: jest.fn().mockImplementation((fn: any) => {
        seen.write = dbContextStorage.getStore();
        return fn(tx);
      }),
    };
    const service = new LeadsService(prisma, {} as any, { checkLimit: jest.fn() } as any);

    await service.createLeadEnquiry('buyer-1', 'listing-1', {
      intent: 'ENQUIRY', preferredContact: 'EMAIL', fieldsToShare: ['name'], consentTextVersion: 'en-AE',
    } as any);

    expect(seen.read).toEqual({ isAdmin: true });
    expect(seen.write).toEqual({ tenantId: 'tenant-1', userId: 'buyer-1' });
  });
});
