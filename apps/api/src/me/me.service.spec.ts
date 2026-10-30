import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MeService } from './me.service';
import { UpdateBuyerProfileDto } from './dto/update-buyer-profile.dto';

describe('MeService buyer data (MK-08, MK-09, MK-10)', () => {
  const profileRow = {
    userId: 'user-1',
    preferredLanguage: 'en',
    preferredEmirate: null,
    budgetMinFils: null,
    budgetMaxFils: null,
    preferredMakes: [],
    marketingConsentAt: null,
    pdplConsentAt: null,
    createdAt: new Date('2026-10-30T00:00:00Z'),
    updatedAt: new Date('2026-10-30T00:00:00Z'),
  };

  const prisma: any = {
    buyerProfile: { upsert: jest.fn().mockResolvedValue(profileRow) },
    user: { findUnique: jest.fn() },
    appointment: { findMany: jest.fn().mockResolvedValue([]) },
  };
  const service = new MeService(prisma, {} as any);

  beforeEach(() => jest.clearAllMocks());

  it('clears budget and emirate when null is sent, and leaves undefined fields unchanged', async () => {
    prisma.buyerProfile.upsert.mockResolvedValue(profileRow);
    await service.updateBuyerProfile('user-1', {
      preferredEmirate: null,
      budgetMinFils: null,
      budgetMaxFils: 50000000,
    });
    const args = prisma.buyerProfile.upsert.mock.calls[0][0];
    expect(args.update.preferredEmirate).toBeNull();
    expect(args.update.budgetMinFils).toBeNull();
    expect(args.update.budgetMaxFils).toBe(BigInt(50000000));
    expect(args.update.preferredLanguage).toBeUndefined();
    expect(args.create.whatsappCommsConsent).toBe(false);
  });

  it('accepts null budget/emirate in the DTO but still rejects invalid values', async () => {
    const ok = plainToInstance(UpdateBuyerProfileDto, { preferredEmirate: null, budgetMinFils: null, budgetMaxFils: null });
    expect(await validate(ok)).toHaveLength(0);
    expect(ok.budgetMinFils).toBeNull();

    const bad = plainToInstance(UpdateBuyerProfileDto, { budgetMinFils: -1 });
    expect((await validate(bad)).length).toBeGreaterThan(0);
  });

  it('reports WhatsApp consent as not given when the buyer has no settings row', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      displayName: 'Buyer',
      email: 'buyer@example.test',
      phoneE164: null,
      updatedAt: new Date('2026-10-30T00:00:00Z'),
      buyer: null,
    });
    const settings = await service.getAccountSettings('user-1');
    expect(settings.whatsappCommsConsent).toBe(false);
  });

  it('only picks public photo media for appointment thumbnails', async () => {
    await service.getBuyerAppointments('user-1');
    const media = prisma.appointment.findMany.mock.calls[0][0].include.lead.include.listing.include.vehicle.include.media;
    expect(media.where).toEqual({ isPublic: true, kind: { in: ['EXTERIOR', 'INTERIOR'] } });
  });
});
