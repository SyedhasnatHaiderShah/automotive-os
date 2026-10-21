import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TenantContext } from '../common/guards/tenant-access.guard';
import { TenantContextResponseDto } from './dto/tenant-context-response.dto';
import { PublicDealerDetailDto } from './dto/public-dealer-response.dto';
import {
  ListingStatus,
  StockStatus,
  TenantStatus,
  VerificationStatus,
} from '@automotive-os/database';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicDealerBySlug(slug: string): Promise<PublicDealerDetailDto> {
    const tenant = await this.prisma.tenant.findUnique({
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
    });

    if (!tenant || tenant.status !== TenantStatus.ACTIVE) {
      throw new NotFoundException(`Dealership '${slug}' not found or inactive`);
    }

    const liveGroundedStock = tenant.listings.length;
    const inventoryValueFils = tenant.listings
      .reduce((sum, l) => sum + l.askingPriceFils, BigInt(0))
      .toString();

    const isKybVerified =
      tenant.verification?.status === VerificationStatus.APPROVED;

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
      stats: {
        liveGroundedStock,
        inventoryValueFils,
        collectorRating: 4.98,
        facilitySqFt: 18500,
        establishedYears: 12,
      },
      contact: {
        directPhone: '+971 4 380 5515',
        whatsappNumber: '+971 50 123 4567',
        makaniNumber: '21948 83120',
        gpsCoordinates: '25.1412° N, 55.2281° E',
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
