import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function applyPolicies() {
  let databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/automotive_os?schema=public';
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
