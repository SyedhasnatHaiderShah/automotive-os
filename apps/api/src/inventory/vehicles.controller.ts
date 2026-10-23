import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { VehiclesService } from "./vehicles.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import {
  TenantAccessGuard,
  TenantContext,
} from "../common/guards/tenant-access.guard";
import { CurrentTenant } from "../common/decorators/tenant-context.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { RequireRoles } from "../common/decorators/require-roles.decorator";
import { MembershipRole } from "@automotive-os/database";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";
import {
  CreateMediaUploadDto,
  MediaUploadResponseDto,
} from "./dto/create-media-upload.dto";
import { VehicleResponseDto } from "./dto/vehicle-response.dto";
import { ListVehiclesQueryDto } from "./dto/list-vehicles-query.dto";

@ApiTags("inventory")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantAccessGuard)
@Controller("api/v1/tenants/:tenantId/vehicles")
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @RequireRoles(
    MembershipRole.OWNER,
    MembershipRole.ADMIN,
    MembershipRole.INVENTORY_MANAGER,
    MembershipRole.SALES_MANAGER,
    MembershipRole.SALES_AGENT,
  )
  @ApiOperation({
    summary: "Ingest physical vehicle into dealership stock ledger",
  })
  @ApiResponse({ status: 201, type: VehicleResponseDto })
  async createVehicle(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateVehicleDto,
    @CurrentUser("id") actorUserId: string,
  ): Promise<VehicleResponseDto> {
    return this.vehiclesService.createVehicle(
      tenant.tenantId,
      dto,
      actorUserId,
      tenant.userRole,
    );
  }

  @Get()
  @ApiOperation({ summary: "List physical vehicles in dealership stock" })
  @ApiResponse({ status: 200, description: "Paginated inventory items" })
  async listVehicles(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: ListVehiclesQueryDto,
  ): Promise<{ items: VehicleResponseDto[]; total: number }> {
    return this.vehiclesService.listVehicles(
      tenant.tenantId,
      query,
      tenant.userRole,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get full vehicle details by ID within dealership" })
  @ApiResponse({ status: 200, type: VehicleResponseDto })
  async getVehicle(
    @CurrentTenant() tenant: TenantContext,
    @Param("id") id: string,
  ): Promise<VehicleResponseDto> {
    return this.vehiclesService.getVehicleById(
      tenant.tenantId,
      id,
      tenant.userRole,
    );
  }

  @Patch(":id")
  @RequireRoles(
    MembershipRole.OWNER,
    MembershipRole.ADMIN,
    MembershipRole.INVENTORY_MANAGER,
    MembershipRole.SALES_MANAGER,
  )
  @ApiOperation({
    summary: "Update vehicle attributes or authoritative stock status",
  })
  @ApiResponse({ status: 200, type: VehicleResponseDto })
  async updateVehicle(
    @CurrentTenant() tenant: TenantContext,
    @Param("id") id: string,
    @Body() dto: UpdateVehicleDto,
    @CurrentUser("id") actorUserId: string,
  ): Promise<VehicleResponseDto> {
    return this.vehiclesService.updateVehicle(
      tenant.tenantId,
      id,
      dto,
      actorUserId,
      tenant.userRole,
    );
  }

  @Post(":id/media")
  @HttpCode(HttpStatus.CREATED)
  @RequireRoles(
    MembershipRole.OWNER,
    MembershipRole.ADMIN,
    MembershipRole.INVENTORY_MANAGER,
    MembershipRole.SALES_MANAGER,
    MembershipRole.SALES_AGENT,
  )
  @ApiOperation({
    summary: "Initiate private media upload descriptor for a vehicle",
  })
  @ApiResponse({ status: 201, type: MediaUploadResponseDto })
  async registerMedia(
    @CurrentTenant() tenant: TenantContext,
    @Param("id") id: string,
    @Body() dto: CreateMediaUploadDto,
  ): Promise<MediaUploadResponseDto> {
    return this.vehiclesService.registerMediaUpload(tenant.tenantId, id, dto);
  }
}
