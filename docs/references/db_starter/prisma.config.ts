// Prisma CLI datasource URL configuration. Requires Prisma CLI matching your installed version.
import { defineConfig, env } from "prisma/config";
export default defineConfig({
  schema: "db/schema.prisma",
  datasource: { url: env("DATABASE_URL") },
});
