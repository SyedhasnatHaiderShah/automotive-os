import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../../auth/auth.service';
import { dbContextStorage } from '../../database/prisma.service';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user || !user.isPlatformAdmin) {
      throw new ForbiddenException(
        'PLATFORM_ADMIN_REQUIRED: Access restricted strictly to platform administrators'
      );
    }

    // QA-LOCAL-06: a suspended, disabled or not-yet-activated admin keeps no API access.
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `PLATFORM_ADMIN_INACTIVE: Administrator account status is ${user.status}`
      );
    }

    // Set platform admin database context strictly after verified authentication & role authorization
    const store = dbContextStorage.getStore();
    if (store) {
      store.isAdmin = true;
      if (user.id) {
        store.userId = user.id;
      }
    }

    return true;
  }
}
