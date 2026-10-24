import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@automotive-os/database';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface DatabaseContext {
  tenantId?: string;
  userId?: string;
  isAdmin?: boolean;
}

export const dbContextStorage = new AsyncLocalStorage<DatabaseContext>();

export function runWithDbContext<T>(context: DatabaseContext, fn: () => Promise<T>): Promise<T> {
  return dbContextStorage.run(context, fn);
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly extendedClient: any;

  constructor() {
    const isProductionOrStaging = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';
    const databaseUrl = process.env.DATABASE_URL;

    if (isProductionOrStaging && !databaseUrl) {
      throw new Error(
        `[SECURITY_FATAL] DATABASE_URL must be explicitly configured in '${process.env.NODE_ENV}' environment. Fail-open localhost defaults are strictly prohibited.`
      );
    }

    if (!databaseUrl && process.env.NODE_ENV !== 'test') {
      console.warn(
        `[DATABASE_WARNING] DATABASE_URL is not set. Operating in local development mode with fallback connection.`
      );
    }

    super({
      datasources: {
        db: {
          url: databaseUrl || 'postgresql://postgres:postgres@localhost:5432/automotive_os?schema=public',
        },
      },
    });

    const base = this;
    this.extendedClient = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const ctx = dbContextStorage.getStore();
            if (ctx?.tenantId || ctx?.isAdmin || ctx?.userId) {
              return base.$transaction(async (tx) => {
                if (ctx.tenantId) {
                  await tx.$executeRawUnsafe(`SELECT set_config('app.tenant_id', '${ctx.tenantId}', true)`);
                }
                if (ctx.userId) {
                  await tx.$executeRawUnsafe(`SELECT set_config('app.user_id', '${ctx.userId}', true)`);
                }
                if (ctx.isAdmin) {
                  await tx.$executeRawUnsafe(`SELECT set_config('app.is_admin', 'true', true)`);
                }
                return (tx as any)[model][operation](args);
              });
            }
            return query(args);
          },
        },
      },
    });

    return new Proxy(this, {
      getPrototypeOf(target) {
        return Object.getPrototypeOf(target);
      },
      get(target, prop, receiver) {
        if (prop === 'then') return undefined;
        if (prop in target.extendedClient) {
          const val = (target.extendedClient as any)[prop];
          if (typeof val === 'function') {
            return val.bind(target.extendedClient);
          }
          return val;
        }
        return Reflect.get(target, prop, receiver);
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
