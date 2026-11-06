import { LeadsService } from './leads.service';

/**
 * QA-LOCAL-02: a dealer session cannot read other users' rows (RLS
 * `users_self_isolation`), so lead queries must not include `buyer` or
 * `tenant.memberships.user`. Names are resolved by id under a narrow
 * elevated read and still filtered by the consent grant.
 */
describe('LeadsService dealer views resolve people without RLS-blocked includes', () => {
  const buyerA = { id: 'buyer-a', displayName: 'Rashid Obeid', phoneE164: '+971500000001', email: 'rashid@buyers.example' };
  const leadRows = [
    { id: 'lead-1', buyerUserId: 'buyer-a', assignedMembershipId: 'mem-1', status: 'NEW', intent: 'ENQUIRY', preferredContact: 'PHONE', createdAt: new Date(), updatedAt: new Date(), listing: { id: 'l1', title: 'Car 1', slug: 'car-1', askingPriceFils: BigInt(100) }, grant: { revokedAt: null, fieldsGranted: ['name', 'phone'] } },
    { id: 'lead-2', buyerUserId: 'buyer-a', assignedMembershipId: null, status: 'NEW', intent: 'ENQUIRY', preferredContact: 'PHONE', createdAt: new Date(), updatedAt: new Date(), listing: { id: 'l2', title: 'Car 2', slug: 'car-2', askingPriceFils: BigInt(100) }, grant: { revokedAt: new Date(), fieldsGranted: ['name', 'phone'] } },
  ];
  const prisma: any = {
    lead: { findMany: jest.fn().mockResolvedValue(leadRows), count: jest.fn().mockResolvedValue(2), findUnique: jest.fn() },
    user: { findMany: jest.fn().mockResolvedValue([buyerA]) },
    membership: { findMany: jest.fn().mockResolvedValue([{ id: 'mem-1', user: { displayName: 'Khalid Al Marri' } }]) },
  };
  const service = new LeadsService(prisma, {} as any, { checkLimit: jest.fn() } as any);

  it('lists leads without including buyer or membership users, and names only granted buyers', async () => {
    const result = await service.listTenantLeads('tenant-1', { page: 1, limit: 20 });
    const include = prisma.lead.findMany.mock.calls[0][0].include;
    expect(include.buyer).toBeUndefined();
    expect(include.tenant).toBeUndefined();
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: ['buyer-a'] } } }));
    expect(prisma.membership.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: ['mem-1'] } } }));
    expect(result.items[0].buyerDisplayName).toBe('Rashid Obeid');
    expect(result.items[0].assignedStaffName).toBe('Khalid Al Marri');
    expect(result.items[1].buyerDisplayName).toBe('Prospective Buyer');
    expect(result.items[1].assignedStaffName).toBeNull();
  });

  it('lead detail exposes only granted fields and nothing after revocation', async () => {
    prisma.lead.findUnique.mockResolvedValueOnce({ ...leadRows[0], tenantId: 'tenant-1', buyerMessage: null, appointments: [] });
    const active = await service.getTenantLeadById('tenant-1', 'lead-1');
    expect(active.buyerContact).toEqual({ name: 'Rashid Obeid', phone: '+971500000001', email: null, grantStatus: 'ACTIVE' });

    prisma.lead.findUnique.mockResolvedValueOnce({ ...leadRows[1], tenantId: 'tenant-1', buyerMessage: null, appointments: [] });
    const revoked = await service.getTenantLeadById('tenant-1', 'lead-2');
    expect(revoked.buyerContact).toEqual({ name: null, phone: null, email: null, grantStatus: 'REVOKED' });
  });
});
