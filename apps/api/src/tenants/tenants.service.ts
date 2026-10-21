import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TenantContext } from '../common/guards/tenant-access.guard';
import { TenantContextResponseDto } from './dto/tenant-context-response.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

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
