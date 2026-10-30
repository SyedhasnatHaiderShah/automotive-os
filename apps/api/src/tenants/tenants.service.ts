import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, runWithDbContext } from '../database/prisma.service';
import { TenantContext } from '../common/guards/tenant-access.guard';
import { TenantContextResponseDto } from './dto/tenant-context-response.dto';
import {
  PublicDealerDetailDto,
  PublicDealerListResponseDto,
} from './dto/public-dealer-response.dto';
import {
  ListingStatus,
  StockStatus,
  TenantStatus,
  VerificationStatus,
} from '@automotive-os/database';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublicDealers(query: {
    emirate?: string;
    page?: number;
    limit?: number;
  }): Promise<PublicDealerListResponseDto> {
    const page = Math.max(1, Math.floor(query.page || 1));
    const limit = Math.min(50, Math.max(1, Math.floor(query.limit || 20)));
    const where = {
      status: TenantStatus.ACTIVE,
      verification: { status: VerificationStatus.APPROVED },
      ...(query.emirate
        ? {
            branches: {
              some: {
                isActive: true,
                emirate: { equals: query.emirate, mode: 'insensitive' as const },
              },
            },
          }
        : {}),
    };

    // Public read: tenant-scoped tables are hidden by RLS without an elevated
    // context, so read under admin context and project only public fields.
    const [total, tenants] = await runWithDbContext({ isAdmin: true }, () =>
      Promise.all([
        this.prisma.tenant.count({ where }),
        this.prisma.tenant.findMany({
          where,
          orderBy: { displayName: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            slug: true,
            displayName: true,
            branches: {
              where: { isActive: true },
              select: { emirate: true, city: true },
            },
            _count: {
              select: {
                listings: {
                  where: {
                    status: ListingStatus.PUBLISHED,
                    vehicle: { stockStatus: StockStatus.AVAILABLE },
                  },
                },
              },
            },
          },
        }),
      ])
    );

    return {
      items: tenants.map((t) => ({
        id: t.id,
        slug: t.slug,
        displayName: t.displayName,
        isKybVerified: true,
        emirates: [...new Set(t.branches.map((b) => b.emirate))],
        cities: [...new Set(t.branches.map((b) => b.city))],
        liveGroundedStock: t._count.listings,
      })),
      total,
      page,
      limit,
    };
  }

  async getPublicDealerBySlug(slug: string): Promise<PublicDealerDetailDto> {
    // Public read: without an elevated context RLS hides verification,
    // branches and listings, which made every storefront look empty.
    const tenant = await runWithDbContext({ isAdmin: true }, () =>
      this.prisma.tenant.findUnique({
        where: { slug },
        include: {
          verification: true,
          branches: {
            where: { isActive: true },
          },
          listings: {
            where: {
              status: ListingStatus.PUBLISHED,
              vehicle: {
                stockStatus: StockStatus.AVAILABLE,
              },
            },
            select: {
              askingPriceFils: true,
            },
          },
        },
      })
    );

    if (!tenant || tenant.status !== TenantStatus.ACTIVE) {
      throw new NotFoundException(`Dealership '${slug}' not found or inactive`);
    }

    const liveGroundedStock = tenant.listings.length;
    const inventoryValueFils = tenant.listings
      .reduce((sum, l) => sum + l.askingPriceFils, BigInt(0))
      .toString();

    const isKybVerified =
      tenant.verification?.status === VerificationStatus.APPROVED;

    const gpsBranch = tenant.branches.find((b) => b.latitude && b.longitude);
    const primaryBranchGps = gpsBranch
      ? `${gpsBranch.latitude!.toString()}, ${gpsBranch.longitude!.toString()}`
      : null;

    return {
      id: tenant.id,
      slug: tenant.slug,
      legalName: tenant.legalName,
      displayName: tenant.displayName,
      country: tenant.country,
      currency: tenant.currency,
      verification: tenant.verification
        ? {
            status: tenant.verification.status,
            tradeLicenseRef: tenant.verification.tradeLicenseRef || undefined,
            licenseExpiry: tenant.verification.licenseExpiry
              ? tenant.verification.licenseExpiry.toISOString()
              : undefined,
            jurisdiction: tenant.verification.jurisdiction || undefined,
            isKybVerified,
          }
        : undefined,
      branches: tenant.branches.map((b) => ({
        id: b.id,
        name: b.name,
        emirate: b.emirate,
        city: b.city,
        address: b.address ?? undefined,
        latitude: b.latitude ? b.latitude.toString() : undefined,
        longitude: b.longitude ? b.longitude.toString() : undefined,
      })),
      // Rating, facility, tenure and contact data have no source of record in
      // the schema yet; return null rather than fabricated values.
      stats: {
        liveGroundedStock,
        inventoryValueFils,
        collectorRating: null,
        facilitySqFt: null,
        establishedYears: null,
      },
      contact: {
        directPhone: null,
        whatsappNumber: null,
        makaniNumber: null,
        gpsCoordinates: primaryBranchGps,
      },
    };
  }

  async getTenantContext(tenantContext: TenantContext): Promise<TenantContextResponseDto> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantContext.tenantId },
      include: {
        branches: {
          where: { isActive: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantContext.tenantId} not found`);
    }

    return {
      tenantId: tenant.id,
      slug: tenant.slug,
      legalName: tenant.legalName,
      displayName: tenant.displayName,
      status: tenant.status,
      callerRole: tenantContext.userRole ? tenantContext.userRole.toString() : 'NONE',
      isPlatformAdminBypass: tenantContext.isPlatformAdminBypass,
      branches: tenant.branches.map((b) => ({
        id: b.id,
        name: b.name,
        emirate: b.emirate,
        city: b.city,
        address: b.address,
      })),
    };
  }
}
