import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  TenantAccessGuard,
  TenantContext,
} from '../common/guards/tenant-access.guard';
import { CurrentTenant } from '../common/decorators/tenant-context.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireRoles } from '../common/decorators/require-roles.decorator';
import { LeadStatus, MembershipRole } from '@automotive-os/database';
import {
  DealerLeadDetailDto,
  DealerLeadSummaryDto,
} from './dto/dealer-lead.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';

@ApiTags('leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantAccessGuard)
@Controller('api/v1/tenants/:tenantId/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  // Lead data includes consented buyer contact fields: sales roles only (SEC-11).
  @RequireRoles(
    MembershipRole.OWNER,
    MembershipRole.ADMIN,
    MembershipRole.SALES_MANAGER,
    MembershipRole.SALES_AGENT,
  )
  @ApiOperation({
    summary:
      'List CRM leads for dealership with privacy-preserving summary projection.',
  })
  @ApiResponse({ status: 200, type: [DealerLeadSummaryDto] })
  async listLeads(
    @CurrentTenant() tenant: TenantContext,
    @Query('status') status?: LeadStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<{ items: DealerLeadSummaryDto[]; total: number }> {
    return this.leadsService.listTenantLeads(tenant.tenantId, {
      status,
      page,
      limit,
    });
  }

  @Get(':id')
  @RequireRoles(
    MembershipRole.OWNER,
    MembershipRole.ADMIN,
    MembershipRole.SALES_MANAGER,
    MembershipRole.SALES_AGENT,
  )
  @ApiOperation({
    summary:
      'Get CRM lead details. Strictly projects only buyer contact fields authorized by the active data grant; returns redacted contact if grant is revoked or ungranted.',
  })
  @ApiResponse({ status: 200, type: DealerLeadDetailDto })
  async getLead(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') leadId: string
  ): Promise<DealerLeadDetailDto> {
    return this.leadsService.getTenantLeadById(tenant.tenantId, leadId);
  }

  @Patch(':id/status')
  @RequireRoles(
    MembershipRole.OWNER,
    MembershipRole.ADMIN,
    MembershipRole.SALES_MANAGER,
    MembershipRole.SALES_AGENT
  )
  @ApiOperation({ summary: 'Update CRM lead lifecycle status' })
  @ApiResponse({ status: 200, type: DealerLeadDetailDto })
  async updateStatus(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') leadId: string,
    @Body() dto: UpdateLeadStatusDto,
    @CurrentUser('id') actorUserId: string
  ): Promise<DealerLeadDetailDto> {
    return this.leadsService.updateLeadStatus(
      tenant.tenantId,
      leadId,
      dto,
      actorUserId
    );
  }

  @Patch(':id/assignment')
  @RequireRoles(
    MembershipRole.OWNER,
    MembershipRole.ADMIN,
    MembershipRole.SALES_MANAGER
  )
  @ApiOperation({ summary: 'Assign CRM lead to a staff member in this dealership' })
  @ApiResponse({ status: 200, type: DealerLeadDetailDto })
  async assignLead(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') leadId: string,
    @Body() dto: AssignLeadDto,
    @CurrentUser('id') actorUserId: string
  ): Promise<DealerLeadDetailDto> {
    return this.leadsService.assignLead(
      tenant.tenantId,
      leadId,
      dto,
      actorUserId
    );
  }
}
