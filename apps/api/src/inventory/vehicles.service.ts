import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";
import {
  CreateMediaUploadDto,
  MediaUploadResponseDto,
  ALLOWED_MEDIA_CONTENT_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_DOCUMENT_SIZE_BYTES,
} from "./dto/create-media-upload.dto";
import { VehicleResponseDto } from "./dto/vehicle-response.dto";
import {
  ListingStatus,
  MembershipRole,
  StockStatus,
} from "@automotive-os/database";

const PRIVILEGED_COST_ROLES: MembershipRole[] = [
  MembershipRole.OWNER,
  MembershipRole.ADMIN,
  MembershipRole.FINANCE_MANAGER,
  MembershipRole.INVENTORY_MANAGER,
];

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createVehicle(
    tenantId: string,
    dto: CreateVehicleDto,
    actorUserId?: string,
    callerRole?: MembershipRole,
  ): Promise<VehicleResponseDto> {
    // Field-level permission check: Only privileged roles can submit purchaseCostFils
    if (
      dto.purchaseCostFils !== undefined &&
      (!callerRole || !PRIVILEGED_COST_ROLES.includes(callerRole))
    ) {
      throw new ForbiddenException(
        "Insufficient permissions: role lacks authorization to set vehicle purchaseCostFils",
      );
    }

    // 1. Verify branch belongs strictly to this tenant
    const branch = await this.prisma.branch.findUnique({
      where: {
        tenantId_id: {
          tenantId,
          id: dto.branchId,
        },
      },
    });

    if (!branch) {
      throw new BadRequestException(
        `Branch ${dto.branchId} does not belong to dealership tenant ${tenantId}`,
      );
    }

    // 2. Verify make and model exist and are paired
    const model = await this.prisma.carModel.findUnique({
      where: { id: dto.modelId },
    });

    if (!model || model.makeId !== dto.makeId) {
      throw new BadRequestException("Invalid make or car model reference");
    }

    // 3. Create canonical vehicle record
    try {
      const vehicle = await this.prisma.vehicle.create({
        data: {
          tenantId,
          branchId: dto.branchId,
          makeId: dto.makeId,
          modelId: dto.modelId,
          vin: dto.vin || null,
          stockNumber: dto.stockNumber,
          trim: dto.trim || null,
          modelYear: dto.modelYear,
          condition: dto.condition,
          mileageKm: dto.mileageKm !== undefined ? dto.mileageKm : null,
          colorExterior: dto.colorExterior || null,
          fuel: dto.fuel || null,
          transmission: dto.transmission || null,
          gccSpec: dto.gccSpec !== undefined ? dto.gccSpec : null,
          purchaseCostFils:
            dto.purchaseCostFils !== undefined
              ? BigInt(dto.purchaseCostFils)
              : null,
          askingPriceFils: BigInt(dto.askingPriceFils),
          stockStatus: dto.stockStatus || StockStatus.INTAKE,
        },
        include: {
          make: true,
          model: true,
          media: true,
          listing: true,
        },
      });

      // Audit vehicle ingestion
      await this.auditService.logAction({
        tenantId,
        actorUserId: actorUserId || null,
        action: "VEHICLE_CREATED",
        targetType: "vehicle",
        targetId: vehicle.id,
        metadata: {
          stockNumber: vehicle.stockNumber,
          stockStatus: vehicle.stockStatus,
        },
      });

      return this.mapVehicleResponse(vehicle, callerRole);
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new ConflictException(
          "Vehicle with this VIN or stock number already exists in dealership",
        );
      }
      throw error;
    }
  }

  async getVehicleById(
    tenantId: string,
    id: string,
    callerRole?: MembershipRole,
  ): Promise<VehicleResponseDto> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: {
        tenantId_id: {
          tenantId,
          id,
        },
      },
      include: {
        make: true,
        model: true,
        media: {
          orderBy: { sortOrder: "asc" },
        },
        listing: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${id} not found in this dealership`);
    }

    return this.mapVehicleResponse(vehicle, callerRole);
  }

  async listVehicles(
    tenantId: string,
    filters?: {
      stockStatus?: StockStatus;
      makeId?: string;
      condition?: string;
      page?: number;
      limit?: number;
    },
    callerRole?: MembershipRole,
  ): Promise<{ items: VehicleResponseDto[]; total: number }> {
    const page = Math.max(1, filters?.page || 1);
    const limit = Math.min(50, Math.max(1, filters?.limit || 20));
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      stockStatus: filters?.stockStatus,
      makeId: filters?.makeId,
      condition: filters?.condition as any,
    };

    const [vehicles, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        include: {
          make: true,
          model: true,
          media: true,
          listing: true,
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return {
      items: vehicles.map((v) => this.mapVehicleResponse(v, callerRole)),
      total,
    };
  }

  async updateVehicle(
    tenantId: string,
    id: string,
    dto: UpdateVehicleDto,
    actorUserId?: string,
    callerRole?: MembershipRole,
  ): Promise<VehicleResponseDto> {
    // Field-level permission check: Only privileged roles can modify purchaseCostFils
    if (
      dto.purchaseCostFils !== undefined &&
      (!callerRole || !PRIVILEGED_COST_ROLES.includes(callerRole))
    ) {
      throw new ForbiddenException(
        "Insufficient permissions: role lacks authorization to modify vehicle purchaseCostFils",
      );
    }

    // 1. Verify vehicle belongs to tenant
    const existing = await this.prisma.vehicle.findUnique({
      where: {
        tenantId_id: {
          tenantId,
          id,
        },
      },
      include: {
        listing: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Vehicle ${id} not found in this dealership`);
    }

    const isTransitioningToUnavailable =
      dto.stockStatus &&
      dto.stockStatus !== StockStatus.AVAILABLE &&
      existing.stockStatus === StockStatus.AVAILABLE;

    // 2. Perform updates atomically with Outbox unpublish event if stock status becomes unavailable
    const updated = await this.prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.update({
        where: {
          tenantId_id: {
            tenantId,
            id,
          },
        },
        data: {
          trim: dto.trim,
          modelYear: dto.modelYear,
          condition: dto.condition,
          mileageKm: dto.mileageKm !== undefined ? dto.mileageKm : undefined,
          colorExterior: dto.colorExterior,
          fuel: dto.fuel,
          transmission: dto.transmission,
          gccSpec: dto.gccSpec,
          purchaseCostFils:
            dto.purchaseCostFils !== undefined
              ? BigInt(dto.purchaseCostFils)
              : undefined,
          askingPriceFils:
            dto.askingPriceFils !== undefined
              ? BigInt(dto.askingPriceFils)
              : undefined,
          stockStatus: dto.stockStatus,
        },
        include: {
          make: true,
          model: true,
          media: true,
          listing: true,
        },
      });

      // Prompt Unpublish Rule: If vehicle is SOLD or ARCHIVED, automatically unpublish listing
      if (
        isTransitioningToUnavailable &&
        existing.listing &&
        existing.listing.status === ListingStatus.PUBLISHED
      ) {
        const nextListingStatus =
          dto.stockStatus === StockStatus.SOLD
            ? ListingStatus.SOLD
            : ListingStatus.PAUSED;

        await tx.listing.update({
          where: {
            tenantId_id: {
              tenantId,
              id: existing.listing.id,
            },
          },
          data: {
            status: nextListingStatus,
          },
        });

        // Insert Outbox event for reliable projection unpublish
        await tx.outboxEvent.create({
          data: {
            tenantId,
            aggregateType: "listing",
            aggregateId: existing.listing.id,
            eventType: "listing.unpublished",
            payload: {
              listingId: existing.listing.id,
              vehicleId: id,
              reason: `Vehicle transitioned to ${dto.stockStatus}`,
              previousStatus: ListingStatus.PUBLISHED,
              newStatus: nextListingStatus,
            },
          },
        });
      }

      return vehicle;
    });

    // 3. Log audit action
    await this.auditService.logAction({
      tenantId,
      actorUserId: actorUserId || null,
      action: "VEHICLE_UPDATED",
      targetType: "vehicle",
      targetId: id,
      metadata: {
        stockStatus: dto.stockStatus,
        askingPriceFils: dto.askingPriceFils,
      },
    });

    return this.mapVehicleResponse(updated, callerRole);
  }

  private getS3Client(): S3Client | null {
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;
    const endpoint = process.env.R2_ENDPOINT || process.env.S3_ENDPOINT;

    if (!accessKeyId || !secretAccessKey || !endpoint) {
      return null;
    }

    return new S3Client({
      region: process.env.R2_REGION || process.env.AWS_REGION || "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async registerMediaUpload(
    tenantId: string,
    vehicleId: string,
    dto: CreateMediaUploadDto,
  ): Promise<MediaUploadResponseDto> {
    // 1. Verify vehicle belongs to tenant
    const vehicle = await this.prisma.vehicle.findUnique({
      where: {
        tenantId_id: {
          tenantId,
          id: vehicleId,
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(
        `Vehicle ${vehicleId} not found in this dealership`,
      );
    }

    // 2. Validate content type and file extension matching
    const allowedExts = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf'],
    };

    const exts = allowedExts[dto.contentType];
    if (!exts) {
      throw new BadRequestException(
        `Unsupported media content type: ${dto.contentType}. Allowed types: ${ALLOWED_MEDIA_CONTENT_TYPES.join(', ')}`,
      );
    }

    const lowerFileName = dto.fileName.toLowerCase();
    const hasValidExt = exts.some((ext) => lowerFileName.endsWith(ext));
    if (!hasValidExt) {
      throw new BadRequestException(
        `File name '${dto.fileName}' does not match expected extension for ${dto.contentType} (${exts.join(', ')})`,
      );
    }

    // 3. File size limit enforcement
    if (dto.fileSizeBytes !== undefined) {
      if (dto.contentType.startsWith('image/') && dto.fileSizeBytes > MAX_IMAGE_SIZE_BYTES) {
        throw new BadRequestException(
          `Image file size (${dto.fileSizeBytes} bytes) exceeds maximum limit of ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB`,
        );
      }
      if (dto.contentType === 'application/pdf' && dto.fileSizeBytes > MAX_DOCUMENT_SIZE_BYTES) {
        throw new BadRequestException(
          `Document file size (${dto.fileSizeBytes} bytes) exceeds maximum limit of ${MAX_DOCUMENT_SIZE_BYTES / (1024 * 1024)}MB`,
        );
      }
    }

    // 4. Object storage configuration verification
    const s3Client = this.getS3Client();
    const bucket = process.env.R2_BUCKET_NAME || process.env.S3_BUCKET;

    if (!s3Client || !bucket) {
      throw new ServiceUnavailableException(
        'Object storage service is not configured on this server. Direct media uploads are disabled until valid R2/S3 credentials are provided.',
      );
    }

    // 5. Construct tenant-scoped secure object key
    const sanitizedFileName = dto.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueId = randomUUID();
    const objectKey = `tenants/${tenantId}/vehicles/${vehicleId}/${uniqueId}-${sanitizedFileName}`;
    const expiresInSeconds = 900; // 15 mins
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    // 6. Generate authentic pre-signed PUT command with SigV4
    let uploadUrl;
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        ContentType: dto.contentType,
        ...(dto.fileSizeBytes ? { ContentLength: dto.fileSizeBytes } : {}),
      });

      uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: expiresInSeconds,
      });
    } catch (err) {
      throw new ServiceUnavailableException(
        `Failed to generate secure object storage pre-signed URL: ${err?.message || 'unknown error'}`,
      );
    }

    // 7. Record media in database
    const media = await this.prisma.vehicleMedia.create({
      data: {
        tenantId,
        vehicleId,
        kind: dto.kind,
        objectKey,
        altText: dto.altText || null,
        sortOrder: dto.sortOrder || 0,
        isPublic: dto.isPublic !== undefined ? dto.isPublic : false,
      },
    });

    return {
      mediaId: media.id,
      objectKey: media.objectKey,
      uploadUrl,
      expiresAt: expiresAt.toISOString(),
      isPublic: media.isPublic,
    };
  }

  private mapVehicleResponse(
    vehicle: any,
    callerRole?: MembershipRole,
  ): VehicleResponseDto {
    // Defense-in-depth: Default to DENYING purchaseCostFils unless caller is explicitly verified as a privileged role
    const isCostAuthorized = Boolean(
      callerRole && PRIVILEGED_COST_ROLES.includes(callerRole),
    );
    const purchaseCostFils =
      isCostAuthorized && vehicle.purchaseCostFils
        ? vehicle.purchaseCostFils.toString()
        : null;

    return {
      id: vehicle.id,
      tenantId: vehicle.tenantId,
      branchId: vehicle.branchId,
      makeName: vehicle.make?.name || "Unknown",
      modelName: vehicle.model?.name || "Unknown",
      vin: vehicle.vin,
      stockNumber: vehicle.stockNumber,
      trim: vehicle.trim,
      modelYear: vehicle.modelYear,
      condition: vehicle.condition,
      mileageKm: vehicle.mileageKm,
      colorExterior: vehicle.colorExterior,
      fuel: vehicle.fuel,
      transmission: vehicle.transmission,
      gccSpec: vehicle.gccSpec,
      purchaseCostFils,
      askingPriceFils: vehicle.askingPriceFils.toString(),
      stockStatus: vehicle.stockStatus,
      createdAt: vehicle.createdAt.toISOString(),
      updatedAt: vehicle.updatedAt.toISOString(),
      media: (vehicle.media || []).map((m: any) => ({
        id: m.id,
        kind: m.kind,
        objectKey: m.objectKey,
        altText: m.altText,
        sortOrder: m.sortOrder,
        isPublic: m.isPublic,
      })),
      listingId: vehicle.listing?.id || null,
      listingStatus: vehicle.listing?.status || null,
    };
  }
}
