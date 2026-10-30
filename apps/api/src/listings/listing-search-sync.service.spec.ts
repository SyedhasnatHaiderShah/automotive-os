import { ListingSearchSyncService, ProjectedListingDoc } from './listing-search-sync.service';
import { PublicListingQueryDto } from './dto/public-listing-query.dto';

describe('ListingSearchSyncService (Unit Tests)', () => {
  let service: ListingSearchSyncService;

  const mockPrismaService = {} as any;

  beforeEach(() => {
    service = new ListingSearchSyncService(mockPrismaService);

    // Populate projectionIndex directly via private access for unit testing searchProjected
    const projectionMap: Map<string, ProjectedListingDoc> = (service as any).projectionIndex;
    const slugMap: Map<string, string> = (service as any).slugIndex;

    const doc1: ProjectedListingDoc = {
      id: 'l1',
      tenantId: 't1',
      vehicleId: 'v1',
      slug: '2024-toyota-land-cruiser',
      title: '2024 Toyota Land Cruiser',
      description: 'Excellent condition',
      askingPriceFils: BigInt(25000000), // 250k AED
      currency: 'AED',
      year: 2024,
      modelYear: 2024,
      mileageKm: 15000,
      condition: 'USED',
      gccSpec: true,
      colorExterior: 'White',
      fuel: 'PETROL',
      transmission: 'AUTOMATIC',
      trim: 'VXR',
      qualityScore: 95,
      publishedAt: new Date('2026-01-10T10:00:00Z'),
      verifiedAt: new Date('2026-01-09T10:00:00Z'),
      maskedVin: '1GNEK1337********',
      emirate: 'Dubai',
      make: { id: 'm1', slug: 'toyota', name: 'Toyota' },
      model: { id: 'mod1', slug: 'land-cruiser', name: 'Land Cruiser' },
      seller: {
        id: 't1',
        slug: 'al-futtaim',
        displayName: 'Al Futtaim Prestige',
        emirate: 'Dubai',
        city: 'Dubai',
        verified: true,
      },
      branch: { id: 'b1', name: 'Main Branch', emirate: 'Dubai', city: 'Dubai' },
      media: [],
    };

    const doc2: ProjectedListingDoc = {
      id: 'l2',
      tenantId: 't2',
      vehicleId: 'v2',
      slug: '2023-nissan-patrol',
      title: '2023 Nissan Patrol LE',
      description: 'Clean title',
      askingPriceFils: BigInt(18000000), // 180k AED
      currency: 'AED',
      year: 2023,
      modelYear: 2023,
      mileageKm: 30000,
      condition: 'USED',
      gccSpec: false,
      colorExterior: 'Black',
      fuel: 'PETROL',
      transmission: 'AUTOMATIC',
      trim: 'LE',
      qualityScore: 88,
      publishedAt: new Date('2026-01-12T10:00:00Z'), // newer than doc1
      verifiedAt: null,
      maskedVin: 'JN1AZ3456********',
      emirate: 'Abu Dhabi',
      make: { id: 'm2', slug: 'nissan', name: 'Nissan' },
      model: { id: 'mod2', slug: 'patrol', name: 'Patrol' },
      seller: {
        id: 't2',
        slug: 'abu-dhabi-motors',
        displayName: 'Abu Dhabi Motors',
        emirate: 'Abu Dhabi',
        city: 'Abu Dhabi',
        verified: true,
      },
      branch: { id: 'b2', name: 'Capital Branch', emirate: 'Abu Dhabi', city: 'Abu Dhabi' },
      media: [],
    };

    const doc3: ProjectedListingDoc = {
      id: 'l3',
      tenantId: 't1',
      vehicleId: 'v3',
      slug: '2025-toyota-camry',
      title: '2025 Toyota Camry',
      description: 'Brand new',
      askingPriceFils: BigInt(11000000), // 110k AED
      currency: 'AED',
      year: 2025,
      modelYear: 2025,
      mileageKm: 0,
      condition: 'NEW',
      gccSpec: true,
      colorExterior: 'Silver',
      fuel: 'HYBRID',
      transmission: 'AUTOMATIC',
      trim: 'GLE',
      qualityScore: 99,
      publishedAt: new Date('2026-01-15T10:00:00Z'), // newest
      verifiedAt: new Date('2026-01-14T10:00:00Z'),
      maskedVin: '4T1B11HK8********',
      emirate: 'Dubai',
      make: { id: 'm1', slug: 'toyota', name: 'Toyota' },
      model: { id: 'mod3', slug: 'camry', name: 'Camry' },
      seller: {
        id: 't1',
        slug: 'al-futtaim',
        displayName: 'Al Futtaim Prestige',
        emirate: 'Dubai',
        city: 'Dubai',
        verified: true,
      },
      branch: { id: 'b1', name: 'Main Branch', emirate: 'Dubai', city: 'Dubai' },
      media: [],
    };

    projectionMap.set(doc1.id, doc1);
    slugMap.set(doc1.slug, doc1.id);

    projectionMap.set(doc2.id, doc2);
    slugMap.set(doc2.slug, doc2.id);

    projectionMap.set(doc3.id, doc3);
    slugMap.set(doc3.slug, doc3.id);
  });

  describe('searchProjected', () => {
    it('returns all items sorted by publishedAt desc when no filters applied', () => {
      const query: PublicListingQueryDto = {};
      const res = service.searchProjected(query);

      expect(res.total).toBe(3);
      expect(res.items.map((i) => i.id)).toEqual(['l3', 'l2', 'l1']);
    });

    it('filters by Emirate (case-insensitive and ignores "All Emirates")', () => {
      const query1: PublicListingQueryDto = { emirate: 'dubai' };
      const res1 = service.searchProjected(query1);
      expect(res1.total).toBe(2);
      expect(res1.items.map((i) => i.id)).toEqual(['l3', 'l1']);

      const queryAll: PublicListingQueryDto = { emirate: 'All Emirates' };
      const resAll = service.searchProjected(queryAll);
      expect(resAll.total).toBe(3);
    });

    it('filters by Make (slug or name, case-insensitive)', () => {
      const queryMakeSlug: PublicListingQueryDto = { make: 'TOYOTA' };
      const resMake = service.searchProjected(queryMakeSlug);
      expect(resMake.total).toBe(2);
      expect(resMake.items.map((i) => i.id)).toEqual(['l3', 'l1']);
    });

    it('filters by Model (slug or name, case-insensitive)', () => {
      const queryModel: PublicListingQueryDto = { model: 'Patrol' };
      const resModel = service.searchProjected(queryModel);
      expect(resModel.total).toBe(1);
      expect(resModel.items[0].id).toBe('l2');
    });

    it('filters by Condition', () => {
      const queryCond: PublicListingQueryDto = { condition: 'NEW' };
      const resCond = service.searchProjected(queryCond);
      expect(resCond.total).toBe(1);
      expect(resCond.items[0].id).toBe('l3');
    });

    it('filters by gccSpec', () => {
      const queryGccTrue: PublicListingQueryDto = { gccSpec: true };
      const resGccTrue = service.searchProjected(queryGccTrue);
      expect(resGccTrue.total).toBe(2);

      const queryGccFalse: PublicListingQueryDto = { gccSpec: false };
      const resGccFalse = service.searchProjected(queryGccFalse);
      expect(resGccFalse.total).toBe(1);
      expect(resGccFalse.items[0].id).toBe('l2');
    });

    it('filters by minPriceFils and maxPriceFils', () => {
      const queryPrice: PublicListingQueryDto = {
        minPriceFils: 15000000,
        maxPriceFils: 20000000,
      };
      const resPrice = service.searchProjected(queryPrice);
      expect(resPrice.total).toBe(1);
      expect(resPrice.items[0].id).toBe('l2');
    });

    it('paginates results correctly', () => {
      const queryPage1: PublicListingQueryDto = { page: 1, limit: 2 };
      const resPage1 = service.searchProjected(queryPage1);
      expect(resPage1.items.length).toBe(2);
      expect(resPage1.total).toBe(3);
      expect(resPage1.items.map((i) => i.id)).toEqual(['l3', 'l2']);

      const queryPage2: PublicListingQueryDto = { page: 2, limit: 2 };
      const resPage2 = service.searchProjected(queryPage2);
      expect(resPage2.items.length).toBe(1);
      expect(resPage2.items[0].id).toBe('l1');
    });
  });

  describe('getProjectedDetailBySlug', () => {
    it('returns detail DTO when slug exists', () => {
      const detail = service.getProjectedDetailBySlug('2024-toyota-land-cruiser');
      expect(detail).toBeDefined();
      expect(detail?.id).toBe('l1');
      expect(detail?.makeName).toBe('Toyota');
      expect(detail?.modelName).toBe('Land Cruiser');
    });

    it('returns null when slug does not exist', () => {
      const detail = service.getProjectedDetailBySlug('non-existent-slug');
      expect(detail).toBeNull();
    });
  });
});
