import {
  Body,
  Controller,
  Get,
  Headers,
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
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { PlatformAdminGuard } from "../common/guards/platform-admin.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AdminTenantSummaryDto } from "./dto/admin-tenant-summary.dto";
import { UpdateTenantStatusDto } from "./dto/update-tenant-status.dto";

@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@Controller("api/v1/admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("tenants")
  @ApiOperation({
    summary:
      "List all dealerships for platform oversight (Platform Admin Only - Audited)",
  })
  @ApiResponse({ status: 200, type: [AdminTenantSummaryDto] })
  async listTenants(
    @CurrentUser("id") adminUserId: string,
    @Headers("x-correlation-id") correlationId?: string,
  ): Promise<AdminTenantSummaryDto[]> {
    return this.adminService.listAllTenants(adminUserId, correlationId);
  }

  @Get("tenants/:id")
  @ApiOperation({
    summary:
      "Get full dealership dossier and KYB evidence for platform oversight",
  })
  @ApiResponse({ status: 200 })
  async getTenant(
    @CurrentUser("id") adminUserId: string,
    @Param("id") tenantId: string,
    @Headers("x-correlation-id") correlationId?: string,
  ) {
    return this.adminService.getTenantById(
      adminUserId,
      tenantId,
      correlationId,
    );
  }

  @Get("verifications/:id")
  @ApiOperation({
    summary: "Alias route for KYB dealership verification dossier review",
  })
  @ApiResponse({ status: 200 })
  async getVerificationDossier(
    @CurrentUser("id") adminUserId: string,
    @Param("id") tenantId: string,
    @Headers("x-correlation-id") correlationId?: string,
  ) {
    return this.adminService.getTenantById(
      adminUserId,
      tenantId,
      correlationId,
    );
  }

  @Patch("tenants/:id/status")
  @ApiOperation({
    summary:
      "Update dealership status (e.g. SUSPENDED). Automatically cascades unpublishing to all active listings and emits transactional outbox events.",
  })
  @ApiResponse({ status: 200, type: AdminTenantSummaryDto })
  async updateTenantStatus(
    @CurrentUser("id") adminUserId: string,
    @Param("id") tenantId: string,
    @Body() dto: UpdateTenantStatusDto,
    @Headers("x-correlation-id") correlationId?: string,
  ): Promise<AdminTenantSummaryDto> {
    return this.adminService.updateTenantStatus(
      adminUserId,
      tenantId,
      dto,
      correlationId,
    );
  }

  @Post("outbox/process")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Trigger idempotent processing of pending outbox events (Platform Admin Only - Audited).",
  })
  async processOutbox(
    @CurrentUser("id") adminUserId: string,
    @Query("limit") limit?: number,
    @Headers("x-correlation-id") correlationId?: string,
  ) {
    return this.adminService.processOutbox(
      adminUserId,
      limit ? Number(limit) : 50,
      correlationId,
    );
  }

  @Get("outbox/metrics")
  @ApiOperation({
    summary: "Get real-time metrics and status counts for the outbox queue.",
  })
  async getOutboxMetrics(@CurrentUser("id") adminUserId: string) {
    return this.adminService.getOutboxMetrics(adminUserId);
  }

  @Post("outbox/retry-failed")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Reset failed outbox events back to PENDING for re-processing (Platform Admin Only - Audited).",
  })
  async retryFailedOutbox(@CurrentUser("id") adminUserId: string) {
    return this.adminService.retryFailedOutboxEvents(adminUserId);
  }
}
