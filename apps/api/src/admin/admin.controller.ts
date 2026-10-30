import {
  Body,
  Controller,
  Delete,
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
import { AdminService, AuditLogListResponse } from "./admin.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { PlatformAdminGuard } from "../common/guards/platform-admin.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AdminTenantSummaryDto } from "./dto/admin-tenant-summary.dto";
import { UpdateTenantStatusDto } from "./dto/update-tenant-status.dto";
import { AdminUserFilterDto, AdminUpdateUserDto } from "./dto/admin-user.dto";
import { AdminCreateDealerDto, AdminInviteDealerStaffDto } from "./dto/admin-dealer.dto";

@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@Controller("api/v1/admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==========================================
  // Dealerships Platform Oversight
  // ==========================================

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

  @Get("dealers")
  @ApiOperation({ summary: "Alias for listing dealerships" })
  async listDealers(
    @CurrentUser("id") adminUserId: string,
    @Headers("x-correlation-id") correlationId?: string,
  ) {
    return this.adminService.listAllTenants(adminUserId, correlationId);
  }

  @Post("dealers")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Provision new verified dealership with initial owner" })
  async createDealer(
    @CurrentUser("id") adminUserId: string,
    @Body() dto: AdminCreateDealerDto,
  ) {
    return this.adminService.createDealer(dto, adminUserId);
  }

  @Post("dealers/:id/invite")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Issue cryptographic invitation for new dealership employee" })
  async inviteDealerStaff(
    @CurrentUser("id") adminUserId: string,
    @Param("id") tenantId: string,
    @Body() dto: AdminInviteDealerStaffDto,
  ) {
    return this.adminService.inviteDealerStaff(tenantId, dto, adminUserId);
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

  // ==========================================
  // Platform User Administration
  // ==========================================

  @Get("users")
  @ApiOperation({ summary: "List and filter platform users with pagination" })
  async listUsers(
    @CurrentUser("id") adminUserId: string,
    @Query() filter: AdminUserFilterDto,
  ) {
    return this.adminService.listUsers(filter, adminUserId);
  }

  @Get("users/:id")
  @ApiOperation({ summary: "Get detailed user identity, memberships, and session activity" })
  async getUser(
    @CurrentUser("id") adminUserId: string,
    @Param("id") userId: string,
  ) {
    return this.adminService.getUserById(userId, adminUserId);
  }

  @Patch("users/:id")
  @ApiOperation({ summary: "Update user status (ACTIVE, SUSPENDED, DISABLED) or role elevation" })
  async updateUser(
    @CurrentUser("id") adminUserId: string,
    @Param("id") userId: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.adminService.updateUser(userId, dto, adminUserId);
  }

  @Post("users/:id/revoke-sessions")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Immediately terminate all active sessions for a user" })
  async revokeSessions(
    @CurrentUser("id") adminUserId: string,
    @Param("id") userId: string,
  ) {
    return this.adminService.revokeUserSessions(userId, adminUserId);
  }

  @Delete("users/:id")
  @ApiOperation({ summary: "Soft delete user (sets status to DISABLED and revokes sessions)" })
  async deleteUser(
    @CurrentUser("id") adminUserId: string,
    @Param("id") userId: string,
  ) {
    return this.adminService.deleteUser(userId, adminUserId);
  }

  // ==========================================
  // Audit Log Trail
  // ==========================================

  @Get("audit-logs")
  @ApiOperation({ summary: "Stream paginated audit log events" })
  async listAuditLogs(
    @CurrentUser("id") adminUserId: string,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number,
    @Query("targetType") targetType?: string,
  ): Promise<AuditLogListResponse> {
    return this.adminService.listAuditLogs(
      {
        limit: Math.min(Math.max(Number(limit) || 50, 1), 200),
        offset: Math.max(Number(offset) || 0, 0),
        targetType,
      },
      adminUserId
    );
  }

  // ==========================================
  // Outbox Processing & Worker Hooks
  // ==========================================

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
      // SEC-17: bound the batch size an admin can trigger in one request.
      Math.min(Math.max(Number(limit) || 50, 1), 200),
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
