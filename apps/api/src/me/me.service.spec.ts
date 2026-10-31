import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MeService } from './me.service';
import { UpdateBuyerProfileDto } from './dto/update-buyer-profile.dto';
import { dbContextStorage } from '../database/prisma.service';

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
    listing: { findMany: jest.fn().mockResolvedValue([]) },
    favorite: { findMany: jest.fn().mockResolvedValue([]), upsert: jest.fn() },
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
    prisma.appointment.findMany.mockResolvedValueOnce([
      {
        id: 'a1', tenantId: 't1', leadId: 'l1', status: 'REQUESTED', note: null,
        startsAt: new Date(), endsAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
        lead: { listingId: 'listing-1' },
      },
    ]);
    await service.getBuyerAppointments('user-1');
    const media = prisma.listing.findMany.mock.calls[0][0].select.vehicle.select.media;
    expect(media.where).toEqual({ isPublic: true, kind: { in: ['EXTERIOR', 'INTERIOR'] } });
  });

  it('loads listing cards under an elevated read context, by id, with public fields only', async () => {
    prisma.favorite.findMany.mockResolvedValueOnce([
      { id: 'f1', userId: 'user-1', listingId: 'listing-1', createdAt: new Date() },
    ]);
    let seenContext: unknown;
    prisma.listing.findMany.mockImplementationOnce((args: any) => {
      seenContext = dbContextStorage.getStore();
      return Promise.resolve([
        {
          id: 'listing-1', slug: 's', title: 'T', askingPriceFils: BigInt(100), status: 'PUBLISHED',
          tenant: { displayName: 'Dealer' }, vehicle: { vin: 'WP1AA2AY5PS00003', media: [] },
        },
      ]);
    });

    const result = await service.getFavorites('user-1');

    expect(seenContext).toEqual({ isAdmin: true });
    const args = prisma.listing.findMany.mock.calls[0][0];
    expect(args.where).toEqual({ id: { in: ['listing-1'] } });
    expect(Object.keys(args.select).sort()).toEqual(
      ['askingPriceFils', 'id', 'slug', 'status', 'tenant', 'title', 'vehicle'].sort()
    );
    expect(result).toEqual([
      expect.objectContaining({ listingId: 'listing-1', askingPriceFils: '100', status: 'PUBLISHED' }),
    ]);
  });

  it('rejects favouriting a listing that is not published', async () => {
    prisma.listing.findMany.mockResolvedValueOnce([
      {
        id: 'listing-2', slug: 's', title: 'T', askingPriceFils: BigInt(1), status: 'DRAFT',
        tenant: { displayName: 'Dealer' }, vehicle: { vin: null, media: [] },
      },
    ]);
    await expect(service.addFavorite('user-1', { listingId: 'listing-2' } as any)).rejects.toThrow('not found');
    expect(prisma.favorite.upsert).not.toHaveBeenCalled();
  });
});
