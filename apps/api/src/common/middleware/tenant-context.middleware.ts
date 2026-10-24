import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { dbContextStorage, DatabaseContext } from '../../database/prisma.service';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const context: DatabaseContext = {};

    // 1. Extract tenantId from URL path or header
    // e.g. /api/v1/tenants/:tenantId/...
    const tenantMatch = req.originalUrl?.match(/\/api\/v1\/tenants\/([0-9a-f-]{36})/i);
    if (tenantMatch) {
      context.tenantId = tenantMatch[1];
    } else if (req.headers['x-tenant-id']) {
      const headerVal = req.headers['x-tenant-id'];
      if (typeof headerVal === 'string' && /^[0-9a-f-]{36}$/i.test(headerVal)) {
        context.tenantId = headerVal;
      }
    }

    // 2. Check if route is platform admin
    if (req.originalUrl?.includes('/api/v1/admin')) {
      context.isAdmin = true;
    }

    // 3. Inspect Authorization header for claims
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload.isPlatformAdmin === true) {
            context.isAdmin = true;
          }
          if (payload.sub && !context.userId) {
            context.userId = payload.sub;
          }
        }
      } catch {
        // Token parsing fails silently; auth guards enforce valid signature
      }
    }

    dbContextStorage.run(context, () => next());
  }
}
