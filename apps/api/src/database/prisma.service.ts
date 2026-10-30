import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@automotive-os/database';
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

/**
 * Interactive transaction client currently open for this async call chain.
 * While set, every model operation (including ones issued through
 * `this.prisma` rather than `tx`) joins that transaction instead of opening
 * its own, so `$transaction(async (tx) => ...)` blocks stay atomic (SEC-03).
 */
const activeTxStorage = new AsyncLocalStorage<Prisma.TransactionClient>();

async function applyDbContext(tx: Prisma.TransactionClient, ctx: DatabaseContext): Promise<void> {
  if (ctx.tenantId) {
    // Defense-in-depth: Validate tenant UUID strictly before parameterization
    if (!UUID_REGEX.test(ctx.tenantId)) {
      throw new Error(`[SECURITY] Invalid tenantId format in database context: ${ctx.tenantId}`);
    }
    await tx.$executeRaw(Prisma.sql`SELECT set_config('app.tenant_id', ${ctx.tenantId}, true)`);
  }
  if (ctx.userId) {
    await tx.$executeRaw(Prisma.sql`SELECT set_config('app.user_id', ${ctx.userId}, true)`);
  }
  if (ctx.isAdmin) {
    await tx.$executeRaw(Prisma.sql`SELECT set_config('app.is_admin', 'true', true)`);
  }
}

function hasDbContext(ctx: DatabaseContext | undefined): ctx is DatabaseContext {
  return Boolean(ctx?.tenantId || ctx?.isAdmin || ctx?.userId);
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
            // Join an enclosing interactive transaction (context already applied).
            const activeTx = activeTxStorage.getStore();
            if (activeTx) {
              return (activeTx as any)[model][operation](args);
            }
            const ctx = dbContextStorage.getStore();
            if (hasDbContext(ctx)) {
              return base.$transaction(async (tx) => {
                await applyDbContext(tx, ctx);
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
        if (prop === '$transaction') {
          return (input: unknown, options?: unknown) => {
            if (typeof input !== 'function') {
              return (target.extendedClient as any).$transaction(input, options);
            }
            const fn = input as (tx: Prisma.TransactionClient) => Promise<unknown>;
            // Already inside a transaction: reuse it (no nested commits).
            const activeTx = activeTxStorage.getStore();
            if (activeTx) {
              return fn(activeTx);
            }
            // One real database transaction for the whole block; the RLS
            // context is set once with transaction-local set_config.
            return base.$transaction(async (tx) => {
              const ctx = dbContextStorage.getStore();
              if (hasDbContext(ctx)) {
                await applyDbContext(tx, ctx);
              }
              return activeTxStorage.run(tx, () => fn(tx));
            }, options as any);
          };
        }
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
