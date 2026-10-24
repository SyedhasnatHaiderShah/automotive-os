import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function applyPolicies() {
  const isProductionOrStaging = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';
  let databaseUrl = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;

  if (isProductionOrStaging && !databaseUrl) {
    console.error(`❌ [SECURITY_FATAL] MIGRATION_DATABASE_URL or DATABASE_URL must be explicitly configured in '${process.env.NODE_ENV}' environment.`);
    process.exit(1);
  }

  if (!databaseUrl) {
    databaseUrl = 'postgresql://postgres:postgres@127.0.0.1:5432/automotive_os?schema=public';
  }

  if (databaseUrl.includes('localhost')) {
    databaseUrl = databaseUrl.replace('localhost', '127.0.0.1');
  }
  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    const sqlPath = path.join(__dirname, '../prisma/tenant_policies.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sql);
    console.log('✅ Successfully applied tenant_policies.sql');
  } catch (err: any) {
    console.error('❌ Failed to apply tenant_policies.sql:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyPolicies();
