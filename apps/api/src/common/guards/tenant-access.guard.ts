import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MembershipRole } from '@automotive-os/database';
import { REQUIRED_ROLES_KEY } from '../decorators/require-roles.decorator';
import { AuthenticatedUser } from '../../auth/auth.service';
import { dbContextStorage } from '../../database/prisma.service';

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  userRole?: MembershipRole;
  isPlatformAdminBypass: boolean;
}

@Injectable()
export class TenantAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user) {
      throw new ForbiddenException('User context missing');
    }

    // Extract tenantId strictly from route params (e.g. /tenants/:tenantId/...)
    const tenantId = request.params.tenantId;

    if (!tenantId) {
      throw new BadRequestException('Tenant route parameter (:tenantId) is missing');
    }

    // 1. Platform Admin Bypass: platform operators have audited cross-tenant access
    if (user.isPlatformAdmin) {
      const store = dbContextStorage.getStore();
      if (store) {
        store.isAdmin = true;
        store.tenantId = tenantId;
      }
      request.tenantContext = {
        tenantId,
        tenantSlug: 'platform-admin-view',
        tenantName: 'Platform Administration Override',
        userRole: MembershipRole.OWNER,
        isPlatformAdminBypass: true,
      };
      return true;
    }

    // 2. Resolve Verified Active Membership for the requested tenantId
    // Never trust client-supplied tenant claim: cross-reference against database user memberships
    const membership = user.memberships.find((m) => m.tenantId === tenantId);

    if (!membership) {
      throw new ForbiddenException(
        `TENANT_FORBIDDEN: User has no membership in tenant ${tenantId}`
      );
    }

    const store = dbContextStorage.getStore();
    if (store) {
      store.tenantId = tenantId;
      if (user.id) store.userId = user.id;
    }

    if (!membership.active) {
      throw new ForbiddenException(
        'MEMBERSHIP_INACTIVE: Dealership staff membership is currently inactive'
      );
    }

    if (membership.tenantStatus !== 'ACTIVE') {
      throw new ForbiddenException(
        `TENANT_INACTIVE: Dealership status is ${membership.tenantStatus}`
      );
    }

    // 3. Fine-Grained Role Permissions Check
    const requiredRoles = this.reflector.getAllAndOverride<MembershipRole[]>(
      REQUIRED_ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.includes(membership.role);
      if (!hasRequiredRole) {
        throw new ForbiddenException(
          `INSUFFICIENT_ROLE_PERMISSIONS: Required role(s) [${requiredRoles.join(
            ', '
          )}], current role is [${membership.role}]`
        );
      }
    }

    // 4. Attach verified tenant context to request for downstream handlers and RLS
    request.tenantContext = {
      tenantId: membership.tenantId,
      tenantSlug: membership.tenantSlug,
      tenantName: membership.tenantName,
      userRole: membership.role,
      isPlatformAdminBypass: false,
    };

    return true;
  }
}
