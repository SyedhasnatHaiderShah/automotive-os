import { PrismaClient } from '@prisma/client';
import { getBackupProviderAdapter } from '../src/backup';

function parseTokenComponents(token: string): { identifier: string; region?: string; isPitr: boolean } {
  const trimmed = token.trim();

  // PITR syntax: pitr:2026-10-23T18:00:00Z
  if (trimmed.startsWith('pitr:')) {
    return {
      identifier: trimmed.substring(5),
      isPitr: true,
    };
  }

  // AWS RDS Snapshot ARN: arn:aws:rds:me-central-1:123456789012:snapshot:snapshot-name
  const rdsArnRegex = /^arn:aws:rds:([a-z0-9-]+):\d{12}:snapshot:(.+)$/;
  const rdsMatch = trimmed.match(rdsArnRegex);
  if (rdsMatch) {
    return {
      identifier: rdsMatch[2],
      region: rdsMatch[1],
      isPitr: false,
    };
  }

  // Standard identifier (e.g. rds-automotive-os-prod-2026-10-23)
  return {
    identifier: trimmed,
    isPitr: false,
  };
}

async function verifyBackupSnapshot() {
  const targetEnv = (process.env.TARGET_ENV || 'staging').toLowerCase();
  const rawToken = process.env.BACKUP_TOKEN?.trim() || '';
  const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

  console.log('========================================================================');
  console.log('Automotive OS — Provider-Backed Database Backup & PITR Verification Gate');
  console.log(`Target Environment: ${targetEnv}`);
  console.log('========================================================================\n');

  if (!databaseUrl) {
    console.error('❌ FATAL: DATABASE_URL environment variable is not defined.');
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
  });

  try {
    // 1. Probe active target database connection & identity
    console.log('1. Connecting to target database to verify identity...');
    const identityResult: any = await prisma.$queryRawUnsafe(`
      SELECT 
        current_database() as db_name,
        current_user as db_user,
        inet_server_addr() as server_ip,
        version() as pg_version;
    `);

    if (!identityResult || identityResult.length === 0) {
      throw new Error('Failed to query database identity.');
    }

    const dbIdentity = identityResult[0];
    console.log(`   Connected Database: ${dbIdentity.db_name}`);
    console.log(`   Connected User:     ${dbIdentity.db_user}`);
    console.log(`   PostgreSQL Version: ${dbIdentity.pg_version.split(',')[0]}`);

    // Environment Sanity Isolation Gate:
    // Prevent accidental cross-targeting of production/staging databases
    if (targetEnv === 'production') {
      if (dbIdentity.db_name.includes('staging') || dbIdentity.db_name.includes('test')) {
        console.error(`❌ FATAL MISMATCH: Target environment is 'production' but connected database is '${dbIdentity.db_name}'.`);
        process.exit(1);
      }
    } else if (targetEnv === 'staging') {
      if (dbIdentity.db_name.includes('production') || dbIdentity.db_name.includes('prod')) {
        console.error(`❌ FATAL SAFETY VIOLATION: Target environment is 'staging' but connected database is '${dbIdentity.db_name}'!`);
        process.exit(1);
      }
    }

    // 2. Enforce backup presence (fail-closed in staging and production)
    console.log('\n2. Verifying independent provider backup / PITR evidence...');
    if (!rawToken) {
      if (targetEnv === 'production' || targetEnv === 'staging') {
        console.error(`❌ REJECTED: Environment '${targetEnv}' migrations require verified independent provider backup evidence.`);
        console.error(`   Please provide a valid AWS RDS snapshot ARN or PITR token via BACKUP_TOKEN.`);
        process.exit(1);
      } else {
        console.warn(`⚠️ WARNING: Running without explicit BACKUP_TOKEN in development.`);
        process.exit(0);
      }
    }

    // 3. Obtain appropriate provider adapter
    const adapter = getBackupProviderAdapter(targetEnv);
    console.log(`   Provider Adapter:  ${adapter.providerName}`);

    const { identifier, region, isPitr } = parseTokenComponents(rawToken);
    const expectedRegion = region || process.env.AWS_REGION || 'me-central-1';

    if (isPitr) {
      // Verify Point-in-Time-Recovery (PITR)
      const targetTime = new Date(identifier);
      if (isNaN(targetTime.getTime())) {
        throw new Error(`Invalid PITR restore timestamp format: '${identifier}'. Expected ISO 8601.`);
      }

      console.log(`   Verifying PITR target time: ${targetTime.toISOString()}...`);
      const pitrResult = await adapter.describePitr(targetTime, {
        targetDatabase: dbIdentity.db_name,
        expectedRegion,
      });

      console.log(`   ✅ Provider Status:          ${pitrResult.status}`);
      console.log(`   ✅ Restorable Window Start:  ${pitrResult.earliestRestorableTime.toISOString()}`);
      console.log(`   ✅ Restorable Window End:    ${pitrResult.latestRestorableTime.toISOString()}`);
      console.log(`   ✅ Region:                   ${pitrResult.region}`);
      console.log(`   ✅ Restore Eligibility:      ${pitrResult.restoreEligible}`);
    } else {
      // Verify Snapshot with provider
      console.log(`   Querying provider for snapshot '${identifier}' in region '${expectedRegion}'...`);
      const snapshot = await adapter.describeSnapshot(identifier, {
        targetDatabase: dbIdentity.db_name,
        expectedRegion,
        maxAgeHours: 24.0,
      });

      console.log(`   ✅ Provider Status:          ${snapshot.status}`);
      console.log(`   ✅ Provider Created At:      ${snapshot.snapshotCreateTime.toISOString()}`);
      console.log(`   ✅ Snapshot Freshness:       ${snapshot.ageHours.toFixed(2)} hours (safety limit: 24h)`);
      console.log(`   ✅ Target Instance:          ${snapshot.dbInstanceIdentifier}`);
      console.log(`   ✅ Engine Version:           ${snapshot.engine} ${snapshot.engineVersion}`);
      console.log(`   ✅ Region:                   ${snapshot.region}`);
      console.log(`   ✅ Encrypted:                ${snapshot.encrypted}`);
      console.log(`   ✅ Restore Eligibility:      ${snapshot.restoreEligible}`);
    }

    // 4. Optional Isolated Restore Verification
    const restoreTestUrl = process.env.RESTORE_TEST_DATABASE_URL;
    if (restoreTestUrl) {
      console.log('\n3. Verifying restoration in isolated test database...');
      const restorePrisma = new PrismaClient({ datasources: { db: { url: restoreTestUrl } } });
      try {
        await restorePrisma.$queryRawUnsafe(`SELECT 1;`);
        console.log('   ✅ Isolated test restore database connectivity verified.');
      } finally {
        await restorePrisma.$disconnect();
      }
    }

    console.log('\n========================================================================');
    console.log('✅ PROVIDER-BACKED BACKUP VERIFICATION CONFIRMED: PASS');
    console.log('========================================================================');
    process.exit(0);
  } catch (err: any) {
    console.error(`\n❌ FATAL BACKUP VERIFICATION ERROR: ${err?.message || err}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyBackupSnapshot();
