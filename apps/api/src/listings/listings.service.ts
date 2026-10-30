import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService, runWithDbContext } from "../database/prisma.service";
import { buildPublicMediaUrl } from "../common/media-url.util";
import {
  ADMIN_MEDIA_PREVIEW_TTL_SECONDS,
  signAdminMediaPreviewUrl,
} from "./admin-media-preview.util";
import { AuditService } from "../audit/audit.service";
import { CreateDraftListingDto } from "./dto/create-draft-listing.dto";
import {
  AdminListingDecisionDto,
  AdminModerationDecision,
} from "./dto/admin-listing-decision.dto";
import { ListingResponseDto } from "./dto/listing-response.dto";
import { PublicListingQueryDto } from "./dto/public-listing-query.dto";
import {
  PublicListingDetailDto,
  PublicListingSearchResponseDto,
  PublicListingSummaryDto,
} from "./dto/public-listing-response.dto";
import {
  ListingStatus,
  MediaKind,
  StockStatus,
  TenantStatus,
  VerificationStatus,
} from "@automotive-os/database";

import { ListingSearchSyncService } from "./listing-search-sync.service";

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly searchSyncService: ListingSearchSyncService,
  ) {}

  /**
   * Dealer creates or updates a DRAFT listing for their vehicle.
   * Enforces 1 active listing per physical vehicle.
   */
  async createDraftListing(
    tenantId: string,
    vehicleId: string,
    dto: CreateDraftListingDto,
    actorUserId?: string,
  ): Promise<ListingResponseDto> {
    // 1. Verify vehicle belongs to tenant
    const vehicle = await this.prisma.vehicle.findUnique({
      where: {
        tenantId_id: {
          tenantId,
          id: vehicleId,
        },
      },
      include: {
        make: true,
        model: true,
        listing: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException(
        `Vehicle ${vehicleId} not found in this dealership`,
      );
    }

    // 2. Check existing listing constraint (1 listing per physical vehicle)
    if (vehicle.listing) {
      if (
        vehicle.listing.status === ListingStatus.PUBLISHED ||
        vehicle.listing.status === ListingStatus.PENDING_REVIEW
      ) {
        throw new ConflictException(
          `Vehicle already has an active or pending listing (${vehicle.listing.status})`,
        );
      }

      // If existing listing is DRAFT or REJECTED or PAUSED, update it
      const askingPriceFils =
        dto.askingPriceFils !== undefined
          ? BigInt(dto.askingPriceFils)
          : vehicle.askingPriceFils;

      const title =
        dto.title ||
        `${vehicle.modelYear} ${vehicle.make.name} ${vehicle.model.name}${
          vehicle.trim ? " " + vehicle.trim : ""
        }`;

      const updated = await this.prisma.listing.update({
        where: {
          tenantId_id: {
            tenantId,
            id: vehicle.listing.id,
          },
        },
        data: {
          title,
          description: dto.description || vehicle.listing.description,
          askingPriceFils,
          status: ListingStatus.DRAFT,
        },
      });

      return this.mapListingResponse(updated);
    }

    // 3. Generate unique slug and compute initial quality score
    const slugBase = `${vehicle.modelYear}-${this.slugify(
      vehicle.make.name,
    )}-${this.slugify(vehicle.model.name)}-${vehicleId.slice(0, 8)}`;

    const existingSlug = await this.prisma.listing.findUnique({
      where: { slug: slugBase },
    });
    const slug = existingSlug
      ? `${slugBase}-${Date.now().toString(36)}`
      : slugBase;

    const title =
      dto.title ||
      `${vehicle.modelYear} ${vehicle.make.name} ${vehicle.model.name}${
        vehicle.trim ? " " + vehicle.trim : ""
      }`;

    const askingPriceFils =
      dto.askingPriceFils !== undefined
        ? BigInt(dto.askingPriceFils)
        : vehicle.askingPriceFils;

    const qualityScore = this.calculateQualityScore(vehicle, dto.description);

    const listing = await this.prisma.listing.create({
      data: {
        tenantId,
        vehicleId,
        slug,
        title,
        description: dto.description || null,
        askingPriceFils,
        status: ListingStatus.DRAFT,
        qualityScore,
      },
    });

    await this.auditService.logAction({
      tenantId,
      actorUserId: actorUserId || null,
      action: "LISTING_DRAFT_CREATED",
      targetType: "listing",
      targetId: listing.id,
      metadata: {
        vehicleId,
        slug: listing.slug,
      },
    });

    return this.mapListingResponse(listing);
  }

  /**
   * Dealer submits listing for moderation.
   * Strictly enforces publish gates:
   * 1. Dealership KYB verification is APPROVED
   * 2. Dealership tenant is in ACTIVE status
   * 3. Vehicle stockStatus is AVAILABLE
   * 4. Asking price > 0
   * 5. Media has at least 1 public exterior image
   */
  async submitForReview(
    tenantId: string,
    listingId: string,
    actorUserId?: string,
  ): Promise<ListingResponseDto> {
    const listing = await this.prisma.listing.findUnique({
      where: {
        tenantId_id: {
          tenantId,
          id: listingId,
        },
      },
      include: {
        vehicle: {
          include: {
            media: true,
          },
        },
        tenant: {
          include: {
            verification: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException(
        `Listing ${listingId} not found in this dealership`,
      );
    }

    if (listing.status === ListingStatus.PUBLISHED) {
      throw new BadRequestException("Listing is already published");
    }

    if (listing.status === ListingStatus.PENDING_REVIEW) {
      throw new BadRequestException("Listing is already pending review");
    }

    // Publish Gates Validation
    this.validatePublishGates(listing);

    // Atomically transition status to PENDING_REVIEW and write outbox event
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.listing.update({
        where: {
          tenantId_id: {
            tenantId,
            id: listingId,
          },
        },
        data: {
          status: ListingStatus.PENDING_REVIEW,
        },
      });

      await tx.outboxEvent.create({
        data: {
          tenantId,
          aggregateType: "listing",
          aggregateId: listingId,
          eventType: "listing.submitted_for_review",
          payload: {
            listingId,
            vehicleId: listing.vehicleId,
            tenantId,
            title: listing.title,
            askingPriceFils: listing.askingPriceFils.toString(),
          },
        },
      });

      return result;
    });

    await this.auditService.logAction({
      tenantId,
      actorUserId: actorUserId || null,
      action: "LISTING_SUBMITTED_FOR_REVIEW",
      targetType: "listing",
      targetId: listingId,
      metadata: {
        vehicleId: listing.vehicleId,
      },
    });

    return this.mapListingResponse(updated);
  }

  /**
   * Tenant-authorized unpublish. Status mutation, projection outbox and audit
   * must be persisted before the UI announces success.
   */
  async unpublishListing(
    tenantId: string,
    listingId: string,
    actorUserId?: string,
  ): Promise<ListingResponseDto> {
    const listing = await this.prisma.listing.findUnique({
      where: { tenantId_id: { tenantId, id: listingId } },
    });
    if (!listing) throw new NotFoundException('Listing not found in this dealership');
    if (listing.status !== ListingStatus.PUBLISHED) {
      throw new BadRequestException('Only published listings may be unpublished');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.listing.update({
        where: { tenantId_id: { tenantId, id: listingId } },
        data: { status: ListingStatus.PAUSED },
      });
      await tx.outboxEvent.create({
        data: {
          tenantId,
          aggregateType: 'listing',
          aggregateId: listingId,
          eventType: 'listing.unpublished',
          payload: {
            tenantId,
            listingId,
            vehicleId: listing.vehicleId,
            previousStatus: ListingStatus.PUBLISHED,
            newStatus: ListingStatus.PAUSED,
            reason: 'Dealer requested unpublish',
          },
        },
      });
      // Unlike AuditService.logAction (which swallows errors), this insert must
      // participate in the same transaction and abort the status change if it fails.
      await tx.auditEvent.create({
        data: {
          tenantId,
          actorUserId: actorUserId || null,
          action: 'LISTING_UNPUBLISHED',
          targetType: 'listing',
          targetId: listingId,
          metadata: { vehicleId: listing.vehicleId, source: 'dealer' },
        },
      });
      return result;
    });
    return this.mapListingResponse(updated);
  }

  /**
   * Platform Admin reviews listing (Approve or Reject with reason).
   * Appends transactional outbox event and audit record.
   */
  async adminDecision(
    adminUserId: string,
    listingId: string,
    dto: AdminListingDecisionDto,
  ): Promise<ListingResponseDto> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        vehicle: {
          include: {
            media: true,
          },
        },
        tenant: {
          include: {
            verification: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }

    // SEC-13: moderation decisions apply only to listings awaiting review.
    if (listing.status !== ListingStatus.PENDING_REVIEW) {
      throw new ConflictException(
        `Listing ${listingId} is ${listing.status}; only PENDING_REVIEW listings can be moderated`
      );
    }

    if (dto.decision === AdminModerationDecision.APPROVE) {
      // Re-verify publish gates prior to approval
      this.validatePublishGates(listing);

      const updated = await this.prisma.$transaction(async (tx) => {
        const published = await tx.listing.update({
          where: { id: listingId },
          data: {
            status: ListingStatus.PUBLISHED,
            verifiedAt: new Date(),
            publishedAt: new Date(),
          },
        });

        // Transactional Outbox Event
        await tx.outboxEvent.create({
          data: {
            tenantId: listing.tenantId,
            aggregateType: "listing",
            aggregateId: listing.id,
            eventType: "listing.published",
            payload: {
              listingId: listing.id,
              vehicleId: listing.vehicleId,
              slug: listing.slug,
              title: listing.title,
              askingPriceFils: listing.askingPriceFils.toString(),
              publishedAt: published.publishedAt?.toISOString(),
            },
          },
        });

        // Audit Record
        await tx.auditEvent.create({
          data: {
            tenantId: listing.tenantId,
            actorUserId: adminUserId,
            action: "LISTING_APPROVED",
            targetType: "listing",
            targetId: listing.id,
            metadata: {
              qualityScore: listing.qualityScore,
              publishedAt: published.publishedAt?.toISOString(),
            },
          },
        });

        return published;
      });

      // Synchronize public search projection
      await this.searchSyncService.handleListingPublished({
        listingId: listing.id,
        vehicleId: listing.vehicleId,
      });

      return this.mapListingResponse(updated);
    } else {
      // REJECT Decision
      if (!dto.reason || dto.reason.trim().length === 0) {
        throw new BadRequestException("Rejection reason is required");
      }

      const updated = await this.prisma.$transaction(async (tx) => {
        const rejected = await tx.listing.update({
          where: { id: listingId },
          data: {
            status: ListingStatus.REJECTED,
          },
        });

        // Transactional Outbox Event
        await tx.outboxEvent.create({
          data: {
            tenantId: listing.tenantId,
            aggregateType: "listing",
            aggregateId: listing.id,
            eventType: "listing.rejected",
            payload: {
              listingId: listing.id,
              vehicleId: listing.vehicleId,
              reason: dto.reason,
            },
          },
        });

        // Audit Record
        await tx.auditEvent.create({
          data: {
            tenantId: listing.tenantId,
            actorUserId: adminUserId,
            action: "LISTING_REJECTED",
            targetType: "listing",
            targetId: listing.id,
            metadata: {
              reason: dto.reason,
            },
          },
        });

        return rejected;
      });

      // Synchronize public search projection eviction
      await this.searchSyncService.handleListingRejected({
        listingId: listing.id,
        reason: dto.reason,
      });

      return this.mapListingResponse(updated);
    }
  }

  /**
   * Platform admin retrieves full listing dossier for moderation review.
   */
  async getAdminListingById(listingId: string, adminUserId?: string): Promise<any> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        listingId,
      );
    const listing = await this.prisma.listing.findFirst({
      where: isUuid
        ? { OR: [{ id: listingId }, { slug: listingId }] }
        : { slug: listingId },
      include: {
        tenant: {
          include: { verification: true },
        },
        vehicle: {
          include: {
            make: true,
            model: true,
            media: true,
            branch: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }

    // AD-08: moderators get a short-lived signed GET URL per media object so
    // they can see photos (public or private) before approving. previewUrl is
    // null when object storage is not configured (fail closed).
    const previewExpiresAt = new Date(
      Date.now() + ADMIN_MEDIA_PREVIEW_TTL_SECONDS * 1000,
    ).toISOString();
    const media = await Promise.all(
      listing.vehicle.media.map(async (m) => {
        const previewUrl = await signAdminMediaPreviewUrl(m.objectKey);
        return {
          ...m,
          previewUrl,
          previewExpiresAt: previewUrl ? previewExpiresAt : null,
        };
      }),
    );

    // Issuing a link to a private object (documents, unpublished photos) is a
    // sensitive read, so it is audited. Only ids are recorded, never the URL.
    const privateMediaIds = media
      .filter((m) => m.previewUrl && !m.isPublic)
      .map((m) => m.id);
    if (privateMediaIds.length > 0) {
      await this.auditService.logAction({
        tenantId: listing.tenantId,
        actorUserId: adminUserId || null,
        action: "ADMIN_PRIVATE_MEDIA_PREVIEW_ISSUED",
        targetType: "listing",
        targetId: listing.id,
        metadata: {
          mediaIds: privateMediaIds,
          expiresAt: previewExpiresAt,
        },
      });
    }

    return {
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      description: listing.description,
      askingPriceFils: listing.askingPriceFils.toString(),
      status: listing.status,
      qualityScore: listing.qualityScore,
      tenant: {
        id: listing.tenant.id,
        slug: listing.tenant.slug,
        displayName: listing.tenant.displayName,
        verificationStatus:
          listing.tenant.verification?.status || "NOT_SUBMITTED",
      },
      vehicle: {
        id: listing.vehicle.id,
        vin: listing.vehicle.vin,
        stockNumber: listing.vehicle.stockNumber,
        modelYear: listing.vehicle.modelYear,
        makeName: listing.vehicle.make?.name || "Unknown",
        modelName: listing.vehicle.model?.name || "Unknown",
        trim: listing.vehicle.trim,
        mileageKm: listing.vehicle.mileageKm,
        colorExterior: listing.vehicle.colorExterior,
        fuel: listing.vehicle.fuel,
        transmission: listing.vehicle.transmission,
        gccSpec: listing.vehicle.gccSpec,
        stockStatus: listing.vehicle.stockStatus,
        media,
      },
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    };
  }

  /**
   * Public Search & Filter for published listings.
   * Redacts private dealer costs, private documents, private notes, and private VIN.
   * Only returns stock where vehicle is AVAILABLE and tenant is ACTIVE.
   */
  async getPublicListings(
    query: PublicListingQueryDto,
  ): Promise<PublicListingSearchResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      status: ListingStatus.PUBLISHED,
      vehicle: {
        stockStatus: StockStatus.AVAILABLE,
      },
      tenant: {
        status: TenantStatus.ACTIVE,
      },
    };

    if (query.q?.trim()) {
      const keyword = query.q.trim();
      // Filter before pagination/count so search works for dealer and emirate
      // as well as title, preserving the original buyer search behavior.
      where.OR = [
        { title: { contains: keyword, mode: "insensitive" } },
        { tenant: { displayName: { contains: keyword, mode: "insensitive" } } },
        { vehicle: { branch: { emirate: { contains: keyword, mode: "insensitive" } } } },
      ];
    }

    if (query.dealerSlug) {
      where.tenant.slug = {
        equals: query.dealerSlug,
        mode: "insensitive",
      };
    }

    if (query.emirate) {
      where.vehicle.branch = {
        emirate: {
          equals: query.emirate,
          mode: "insensitive",
        },
      };
    }

    if (query.make) {
      where.vehicle.make = {
        OR: [
          { slug: { equals: query.make, mode: "insensitive" } },
          { name: { equals: query.make, mode: "insensitive" } },
        ],
      };
    }

    if (query.model) {
      where.vehicle.model = {
        OR: [
          { slug: { equals: query.model, mode: "insensitive" } },
          { name: { equals: query.model, mode: "insensitive" } },
        ],
      };
    }

    if (query.condition) {
      where.vehicle.condition = query.condition;
    }

    if (query.gccSpec !== undefined) {
      where.vehicle.gccSpec = query.gccSpec;
    }

    if (query.minPriceFils !== undefined) {
      where.askingPriceFils = {
        ...(where.askingPriceFils || {}),
        gte: BigInt(query.minPriceFils),
      };
    }

    if (query.maxPriceFils !== undefined) {
      where.askingPriceFils = {
        ...(where.askingPriceFils || {}),
        lte: BigInt(query.maxPriceFils),
      };
    }

    return runWithDbContext({ isAdmin: true }, async () => {
      const [listings, total] = await Promise.all([
        this.prisma.listing.findMany({
          where,
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
                  where: {
                    isPublic: true,
                  },
                  orderBy: {
                    sortOrder: "asc",
                  },
                },
              },
            },
          },
          orderBy: query.sort === "price-asc"
            ? [{ askingPriceFils: "asc" }, { publishedAt: "desc" }]
            : query.sort === "price-desc"
              ? [{ askingPriceFils: "desc" }, { publishedAt: "desc" }]
              : [{ publishedAt: "desc" }],
          skip,
          take: limit,
        }),
        this.prisma.listing.count({ where }),
      ]);

      return {
        items: listings.map((l) => this.mapPublicSummary(l)),
        total,
        page,
        limit,
      };
    });
  }

  /**
   * Public Detail by slug.
   * Redacts private dealer costs, private documents, private notes, and masks VIN.
   */
  async getPublicListingBySlug(slug: string): Promise<PublicListingDetailDto> {
    return runWithDbContext({ isAdmin: true }, async () => {
      const listing = await this.prisma.listing.findUnique({
        where: { slug },
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
                where: {
                  isPublic: true,
                },
                orderBy: {
                  sortOrder: "asc",
                },
              },
            },
          },
        },
      });

      if (
        !listing ||
        listing.status !== ListingStatus.PUBLISHED ||
        listing.vehicle.stockStatus !== StockStatus.AVAILABLE ||
        listing.tenant.status !== TenantStatus.ACTIVE
      ) {
        throw new NotFoundException("Listing not found or no longer available");
      }

      return this.mapPublicDetail(listing);
    });
  }

  /**
   * Publish gates validator
   */
  private validatePublishGates(listing: any): void {
    // Gate 1: Active Dealer KYB verification
    if (listing.tenant?.verification?.status !== VerificationStatus.APPROVED) {
      throw new BadRequestException(
        "Publish gate failed: Dealership KYB verification is not approved",
      );
    }

    // Gate 2: Dealership status is ACTIVE
    if (listing.tenant?.status !== TenantStatus.ACTIVE) {
      throw new BadRequestException(
        "Publish gate failed: Dealership tenant is not active",
      );
    }

    // Gate 3: Physical vehicle stock status must be AVAILABLE
    if (listing.vehicle?.stockStatus !== StockStatus.AVAILABLE) {
      throw new BadRequestException(
        `Publish gate failed: Physical vehicle stock status must be AVAILABLE (currently ${listing.vehicle?.stockStatus})`,
      );
    }

    // Gate 4: Asking price must be greater than zero
    if (listing.askingPriceFils <= BigInt(0)) {
      throw new BadRequestException(
        "Publish gate failed: Asking price must be greater than zero",
      );
    }

    // Gate 5: Media requirement - at least 1 public exterior image
    const media = listing.vehicle?.media || [];
    const hasPublicExterior = media.some(
      (m: any) => m.kind === MediaKind.EXTERIOR && m.isPublic === true,
    );

    if (!hasPublicExterior) {
      throw new BadRequestException(
        "Publish gate failed: Listing requires at least one public exterior photo",
      );
    }
  }

  private calculateQualityScore(vehicle: any, description?: string): number {
    let score = 50;
    if (description && description.length >= 20) score += 15;
    if (vehicle.mileageKm !== null && vehicle.mileageKm !== undefined)
      score += 10;
    if (vehicle.gccSpec) score += 10;
    if (vehicle.colorExterior) score += 5;
    if (vehicle.condition) score += 10;
    return Math.min(100, score);
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private mapListingResponse(listing: any): ListingResponseDto {
    return {
      id: listing.id,
      tenantId: listing.tenantId,
      vehicleId: listing.vehicleId,
      slug: listing.slug,
      title: listing.title,
      description: listing.description,
      askingPriceFils: listing.askingPriceFils.toString(),
      status: listing.status,
      qualityScore: listing.qualityScore,
      verifiedAt: listing.verifiedAt ? listing.verifiedAt.toISOString() : null,
      publishedAt: listing.publishedAt
        ? listing.publishedAt.toISOString()
        : null,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    };
  }

  private mapPublicSummary(listing: any): PublicListingSummaryDto {
    return {
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      price: {
        currency: "AED",
        amountFils: listing.askingPriceFils.toString(),
      },
      year: listing.vehicle.modelYear,
      mileageKm: listing.vehicle.mileageKm,
      condition: listing.vehicle.condition,
      gccSpec: listing.vehicle.gccSpec ?? null,
      emirate: listing.vehicle.branch?.emirate || "UAE",
      seller: {
        id: listing.tenant.id,
        slug: listing.tenant.slug,
        displayName: listing.tenant.displayName,
        emirate: listing.vehicle.branch?.emirate || "UAE",
        city: listing.vehicle.branch?.city || "UAE",
        verified:
          listing.tenant.verification?.status === VerificationStatus.APPROVED,
      },
      media: (listing.vehicle.media || []).map((m: any) => ({
        id: m.id,
        kind: m.kind,
        url: buildPublicMediaUrl(m.objectKey),
        altText: m.altText,
        sortOrder: m.sortOrder,
      })),
      publishedAt: listing.publishedAt
        ? listing.publishedAt.toISOString()
        : listing.createdAt.toISOString(),
    };
  }

  private mapPublicDetail(listing: any): PublicListingDetailDto {
    const summary = this.mapPublicSummary(listing);
    const vehicle = listing.vehicle;

    // Redacted VIN: Show prefix only, mask chassis sequence
    const maskedVin = vehicle.vin
      ? `${vehicle.vin.substring(0, 9)}********`
      : null;

    return {
      ...summary,
      description: listing.description,
      makeName: vehicle.make?.name || "Unknown",
      modelName: vehicle.model?.name || "Unknown",
      trim: vehicle.trim,
      colorExterior: vehicle.colorExterior,
      fuel: vehicle.fuel,
      transmission: vehicle.transmission,
      gccSpec: vehicle.gccSpec,
      maskedVin,
    };
  }
}
