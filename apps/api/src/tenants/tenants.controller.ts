import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantAccessGuard, TenantContext } from '../common/guards/tenant-access.guard';
import { CurrentTenant } from '../common/decorators/tenant-context.decorator';
import { TenantContextResponseDto } from './dto/tenant-context-response.dto';
import { RequireRoles } from '../common/decorators/require-roles.decorator';
import { MembershipRole } from '@automotive-os/database';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantAccessGuard)
@Controller('api/v1/tenants/:tenantId')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('context')
  @ApiOperation({ summary: 'Resolve verified active dealership context for caller' })
  @ApiResponse({ status: 200, type: TenantContextResponseDto })
  async getContext(
    @Param('tenantId') _tenantId: string,
    @CurrentTenant() tenantContext: TenantContext
  ): Promise<TenantContextResponseDto> {
    return this.tenantsService.getTenantContext(tenantContext);
  }

  @Get('privileged-management')
  @RequireRoles(MembershipRole.OWNER, MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Privileged dealership management route (Owner/Admin roles only)' })
  @ApiResponse({ status: 200, description: 'Access granted to dealership management' })
  async privilegedManagement(
    @Param('tenantId') _tenantId: string,
    @CurrentTenant() tenantContext: TenantContext
  ) {
    return {
      status: 'authorized',
      message: 'Caller holds OWNER or ADMIN privileges in this dealership',
      tenantId: tenantContext.tenantId,
      role: tenantContext.userRole,
    };
  }
}
