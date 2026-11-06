import { BadRequestException } from '@nestjs/common';
import { MeService } from './me.service';

/** QA-LOCAL-04: the effective budget range (request merged with stored values) must satisfy min <= max. */
describe('MeService.updateBuyerProfile budget range', () => {
  const stored = { userId: 'u1', preferredLanguage: 'en', preferredEmirate: null, budgetMinFils: BigInt(5_000_000), budgetMaxFils: BigInt(20_000_000), preferredMakes: [], marketingConsentAt: null };
  const prisma: any = {
    buyerProfile: {
      findUnique: jest.fn().mockResolvedValue(stored),
      upsert: jest.fn().mockImplementation(async ({ update }: any) => ({ ...stored, ...update })),
    },
  };
  const service = new MeService(prisma, {} as any);

  beforeEach(() => prisma.buyerProfile.upsert.mockClear());

  it('rejects a request whose min exceeds max', async () => {
    await expect(service.updateBuyerProfile('u1', { budgetMinFils: 20_000_000, budgetMaxFils: 1_000 } as any)).rejects.toThrow(BadRequestException);
    expect(prisma.buyerProfile.upsert).not.toHaveBeenCalled();
  });

  it('rejects a new min above the stored max', async () => {
    await expect(service.updateBuyerProfile('u1', { budgetMinFils: 50_000_000 } as any)).rejects.toThrow(/BUDGET_RANGE_INVALID/);
  });

  it('accepts a coherent range and clearing one side with null', async () => {
    await expect(service.updateBuyerProfile('u1', { budgetMinFils: 10_000_000 } as any)).resolves.toBeDefined();
    await expect(service.updateBuyerProfile('u1', { budgetMaxFils: null } as any)).resolves.toBeDefined();
    expect(prisma.buyerProfile.upsert).toHaveBeenCalledTimes(2);
  });
});
