export * from '@prisma/client';
import { PrismaClient } from '@prisma/client';

export const createPrismaClient = (databaseUrl?: string) => {
  return new PrismaClient({
    datasources: databaseUrl
      ? {
          db: {
            url: databaseUrl,
          },
        }
      : undefined,
  });
};
