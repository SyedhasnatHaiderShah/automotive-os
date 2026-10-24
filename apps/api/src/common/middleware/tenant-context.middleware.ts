import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { dbContextStorage, DatabaseContext } from '../../database/prisma.service';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Fail-safe initialization of request-scoped database context.
    // Tenant ID, User ID, and Admin context are NEVER derived from unauthenticated
    // request URL paths (such as /admin), unverified headers, or unsigned JWT payloads.
    // They are set exclusively by authenticated guards (JwtAuthGuard, TenantAccessGuard, PlatformAdminGuard)
    // after cryptographic token verification and database role validation.
    const context: DatabaseContext = {};
    dbContextStorage.run(context, () => next());
  }
}
