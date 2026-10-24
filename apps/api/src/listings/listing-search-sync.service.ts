import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, runWithDbContext } from '../database/prisma.service';
import {
  ListingStatus,
  StockStatus,
  TenantStatus,
  VerificationStatus,
} from '@automotive-os/database';
import {
  PublicListingDetailDto,
  PublicListingSummaryDto,
} from './dto/public-listing-response.dto';
import { PublicListingQueryDto } from './dto/public-listing-query.dto';

export interface ProjectedListingDoc {
  id: string;
  tenantId: string;
  vehicleId: string;
  slug: string;
  title: string;
  description: string | null;
  askingPriceFils: bigint;
  currency: string;
  year: number;
  modelYear: number;
  mileageKm: number | null;
  condition: string;
  gccSpec: boolean | null;
  colorExterior: string | null;
  fuel: string | null;
  transmission: string | null;
  trim: string | null;
  qualityScore: number;
  publishedAt: Date;
  verifiedAt: Date | null;
  maskedVin: string | null;
  emirate: string;
  make: {
    id: string;
    slug: string;
    name: string;
  };
  model: {
    id: string;
    slug: string;
    name: string;
  };
  seller: {
    id: string;
    slug: string;
    displayName: string;
    emirate: string;
    city: string;
    verified: boolean;
  };
  branch: {
    id: string;
    name: string;
    emirate: string;
    city: string;
  };
  media: Array<{
    id: string;
    kind: string;
    url: string;
    altText: string | null;
    sortOrder: number;
  }>;
}

@Injectable()
export class ListingSearchSyncService {
  private readonly logger = new Logger(ListingSearchSyncService.name);

  // In-memory projection store (can be seamlessly backed by Redis or OpenSearch)
  private readonly projectionIndex = new Map<string, ProjectedListingDoc>();
  private readonly slugIndex = new Map<string, string>(); // slug -> listingId

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Synchronize a newly published listing into the public search projection.
   * Strictly enforces publish gates and confidential field redaction.
   */
  async handleListingPublished(payload: {
    listingId: string;
    vehicleId?: string;
  }): Promise<boolean> {
    const { listingId } = payload;

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!listingId || !UUID_REGEX.test(listingId)) {
      throw new Error(`Invalid UUID format for listingId: ${listingId}`);
    }

    return runWithDbContext({ isAdmin: true }, async () => {
      const listing = await this.prisma.listing.findUnique({
        where: { id: listingId },
        include: {
          tenant: {
            include: {
              verification: true,
            },
          },
          vehicle: {
            include: {
              branch: true,
              make: true,
              model: true,
              media: {
                where: { isPublic: true },
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
      });

      if (!listing) {
        this.logger.warn(`Cannot project listing ${listingId}: not found in DB`);
        this.evictFromProjection(listingId);
        return false;
      }

      // Verify publish gates before admitting into public search projection
      if (
        listing.status !== ListingStatus.PUBLISHED ||
        listing.vehicle.stockStatus !== StockStatus.AVAILABLE ||
        listing.tenant.status !== TenantStatus.ACTIVE ||
        listing.tenant.verification?.status !== VerificationStatus.APPROVED
      ) {
        this.logger.warn(
          `Listing ${listingId} failed public projection gates (status=${listing.status}, stock=${listing.vehicle.stockStatus}, tenant=${listing.tenant.status}, kyb=${listing.tenant.verification?.status}). Evicting from search index.`
        );
        this.evictFromProjection(listingId);
        return false;
      }

      const cdnBase = process.env.S3_PUBLIC_CDN_URL || 'https://cdn.automotive-os.ae';
      const emirate = listing.vehicle.branch?.emirate || 'UAE';
      const city = listing.vehicle.branch?.city || 'UAE';

      // Construct sanitized, redacted projection document
      const doc: ProjectedListingDoc = {
        id: listing.id,
        tenantId: listing.tenantId,
        vehicleId: listing.vehicleId,
        slug: listing.slug,
        title: listing.title,
        description: listing.description,
        askingPriceFils: listing.askingPriceFils,
        currency: 'AED',
        year: listing.vehicle.modelYear,
        modelYear: listing.vehicle.modelYear,
        mileageKm: listing.vehicle.mileageKm,
        condition: listing.vehicle.condition,
        gccSpec: listing.vehicle.gccSpec,
        colorExterior: listing.vehicle.colorExterior,
        fuel: listing.vehicle.fuel,
        transmission: listing.vehicle.transmission,
        trim: listing.vehicle.trim,
        qualityScore: listing.qualityScore,
        publishedAt: listing.publishedAt || new Date(),
        verifiedAt: listing.verifiedAt,
        maskedVin: this.maskVin(listing.vehicle.vin),
        emirate,
        make: {
          id: listing.vehicle.make.id,
          slug: listing.vehicle.make.slug,
          name: listing.vehicle.make.name,
        },
        model: {
          id: listing.vehicle.model.id,
          slug: listing.vehicle.model.slug,
          name: listing.vehicle.model.name,
        },
        seller: {
          id: listing.tenant.id,
          slug: listing.tenant.slug,
          displayName: listing.tenant.displayName,
          emirate,
          city,
          verified: listing.tenant.verification?.status === VerificationStatus.APPROVED,
        },
        branch: {
          id: listing.vehicle.branch.id,
          name: listing.vehicle.branch.name,
          emirate,
          city,
        },
        media: listing.vehicle.media.map((m) => ({
          id: m.id,
          kind: m.kind,
          url: `${cdnBase}/${m.objectKey}`,
          altText: m.altText,
          sortOrder: m.sortOrder,
        })),
      };

      // Store in projection indices
      this.projectionIndex.set(doc.id, doc);
      this.slugIndex.set(doc.slug, doc.id);

      this.logger.log(
        `[Search Projection] Synced published listing [${doc.id}] (${doc.slug}) — Active in marketplace discovery.`
      );
      return true;
    });
  }

  /**
   * Promptly evict listing from the public search index when unpublished, sold, or paused.
   */
  async handleListingUnpublished(payload: {
    listingId: string;
    vehicleId?: string;
    reason?: string;
  }): Promise<boolean> {
    const { listingId, reason } = payload;
    const evicted = this.evictFromProjection(listingId);

    if (evicted) {
      this.logger.log(
        `[Search Projection] Evicted listing [${listingId}] from search index. Reason: ${
          reason || 'Unpublished'
        }`
      );
    }
    return evicted;
  }

  /**
   * Handle listing rejection from platform admin.
   */
  async handleListingRejected(payload: {
    listingId: string;
    reason?: string;
  }): Promise<boolean> {
    const { listingId, reason } = payload;
    const evicted = this.evictFromProjection(listingId);
    this.logger.log(
      `[Search Projection] Moderation rejected listing [${listingId}] (reason: ${reason}). Evicted from projection.`
    );
    return evicted;
  }

  /**
   * Evict all active listings for a suspended or deactivated dealership.
   */
  async handleTenantSuspended(tenantId: string): Promise<number> {
    let evictedCount = 0;
    for (const [id, doc] of this.projectionIndex.entries()) {
      if (doc.tenantId === tenantId) {
        this.evictFromProjection(id);
        evictedCount++;
      }
    }
    this.logger.log(
      `[Search Projection] Tenant [${tenantId}] suspended. Evicted ${evictedCount} listings from public search.`
    );
    return evictedCount;
  }

  /**
   * Evict a listing by id from indices.
   */
  private evictFromProjection(listingId: string): boolean {
    const existing = this.projectionIndex.get(listingId);
    if (existing) {
      this.slugIndex.delete(existing.slug);
      this.projectionIndex.delete(listingId);
      return true;
    }
    return false;
  }

  /**
   * Mask VIN for public discovery: first 9 chars visible, remaining masked.
   */
  private maskVin(vin?: string | null): string | null {
    if (!vin) return null;
    return `${vin.slice(0, 9)}********`;
  }

  /**
   * Query the synchronized projection index with multi-attribute filtering.
   */
  searchProjected(query: PublicListingQueryDto): {
    items: PublicListingSummaryDto[];
    total: number;
    page: number;
    limit: number;
  } {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 20));

    let results = Array.from(this.projectionIndex.values());

    // Filter: Emirate
    if (query.emirate && query.emirate !== 'All Emirates') {
      const qEmirate = query.emirate.toLowerCase();
      results = results.filter(
        (doc) => doc.branch.emirate.toLowerCase() === qEmirate
      );
    }

    // Filter: Make
    if (query.make) {
      const qMake = query.make.toLowerCase();
      results = results.filter(
        (doc) =>
          doc.make.slug.toLowerCase() === qMake ||
          doc.make.name.toLowerCase() === qMake
      );
    }

    // Filter: Model
    if (query.model) {
      const qModel = query.model.toLowerCase();
      results = results.filter(
        (doc) =>
          doc.model.slug.toLowerCase() === qModel ||
          doc.model.name.toLowerCase() === qModel
      );
    }

    // Filter: Condition
    if (query.condition) {
      results = results.filter((doc) => doc.condition === query.condition);
    }

    // Filter: GCC Spec
    if (query.gccSpec !== undefined) {
      results = results.filter((doc) => doc.gccSpec === query.gccSpec);
    }

    // Filter: Min Price
    if (query.minPriceFils !== undefined) {
      const minFils = BigInt(query.minPriceFils);
      results = results.filter((doc) => doc.askingPriceFils >= minFils);
    }

    // Filter: Max Price
    if (query.maxPriceFils !== undefined) {
      const maxFils = BigInt(query.maxPriceFils);
      results = results.filter((doc) => doc.askingPriceFils <= maxFils);
    }

    // Sort by publishedAt desc
    results.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

    const total = results.length;
    const paginated = results.slice((page - 1) * limit, page * limit);

    const items: PublicListingSummaryDto[] = paginated.map((doc) => ({
      id: doc.id,
      slug: doc.slug,
      title: doc.title,
      price: {
        amountFils: doc.askingPriceFils.toString(),
        currency: doc.currency,
      },
      year: doc.year,
      mileageKm: doc.mileageKm,
      condition: doc.condition,
      emirate: doc.emirate,
      seller: doc.seller,
      media: doc.media,
      publishedAt: doc.publishedAt.toISOString(),
    }));

    return {
      items,
      total,
      page,
      limit,
    };
  }

  /**
   * Lookup a single listing by its slug from projection.
   */
  getProjectedDetailBySlug(slug: string): PublicListingDetailDto | null {
    const listingId = this.slugIndex.get(slug);
    if (!listingId) return null;
    const doc = this.projectionIndex.get(listingId);
    if (!doc) return null;

    return {
      id: doc.id,
      slug: doc.slug,
      title: doc.title,
      description: doc.description,
      price: {
        amountFils: doc.askingPriceFils.toString(),
        currency: doc.currency,
      },
      year: doc.year,
      mileageKm: doc.mileageKm,
      condition: doc.condition,
      emirate: doc.emirate,
      seller: doc.seller,
      media: doc.media,
      publishedAt: doc.publishedAt.toISOString(),
      makeName: doc.make.name,
      modelName: doc.model.name,
      trim: doc.trim,
      colorExterior: doc.colorExterior,
      fuel: doc.fuel,
      transmission: doc.transmission,
      gccSpec: doc.gccSpec,
      maskedVin: doc.maskedVin,
    };
  }

  /**
   * Check if a listing is projected currently.
   */
  isListingProjected(listingId: string): boolean {
    return this.projectionIndex.has(listingId);
  }

  /**
   * Diagnostics: return total number of projected listings.
   */
  getProjectedCount(): number {
    return this.projectionIndex.size;
  }

  /**
   * Synchronize all active eligible listings from Postgres into the projection.
   * Useful during startup or on-demand cache warm-up.
   */
  async syncAllActiveListings(): Promise<number> {
    return runWithDbContext({ isAdmin: true }, async () => {
      const activeListings = await this.prisma.listing.findMany({
        where: {
          status: ListingStatus.PUBLISHED,
          vehicle: {
            stockStatus: StockStatus.AVAILABLE,
          },
          tenant: {
            status: TenantStatus.ACTIVE,
            verification: {
              status: VerificationStatus.APPROVED,
            },
          },
        },
        select: { id: true },
      });

      let syncedCount = 0;
      for (const item of activeListings) {
        const ok = await this.handleListingPublished({ listingId: item.id });
        if (ok) syncedCount++;
      }

      this.logger.log(
        `[Search Projection] Full initial sync complete. Synced ${syncedCount}/${activeListings.length} eligible listings.`
      );
      return syncedCount;
    });
  }
}
