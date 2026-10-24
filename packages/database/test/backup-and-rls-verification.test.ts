import { execSync } from 'node:child_process';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';

console.log('========================================================================');
console.log('Automotive OS — Test Suite: Database Backup & RLS Verification Gates');
console.log('========================================================================\n');

// 1. Resolve test database configuration reliably to guarantee subprocess inheritance
const testDbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/automotive_os?schema=public';
const baseEnv = {
  ...process.env,
  DATABASE_URL: testDbUrl,
  NODE_ENV: 'test',
  BACKUP_PROVIDER_ADAPTER: 'mock',
};

const prisma = new PrismaClient({
  datasources: { db: { url: testDbUrl } },
});

// Helper for running verify-backup-snapshot in isolated subprocess
function runBackupVerification(envOverrides: Record<string, string>): { code: number; stdout: string; stderr: string } {
  try {
    const stdout = execSync('pnpm exec tsx scripts/verify-backup-snapshot.ts', {
      cwd: process.cwd(),
      env: {
        ...baseEnv,
        ...envOverrides,
      },
      stdio: 'pipe',
    }).toString();
    return { code: 0, stdout, stderr: '' };
  } catch (err: any) {
    return {
      code: err.status || 1,
      stdout: err.stdout ? err.stdout.toString() : '',
      stderr: err.stderr ? err.stderr.toString() : err.message,
    };
  }
}

// Helper for running verify-rls-post-migration in isolated subprocess
function runRlsVerification(envOverrides: Record<string, string> = {}): { code: number; stdout: string; stderr: string } {
  try {
    const stdout = execSync('pnpm exec tsx scripts/verify-rls-post-migration.ts', {
      cwd: process.cwd(),
      env: {
        ...baseEnv,
        ...envOverrides,
      },
      stdio: 'pipe',
    }).toString();
    return { code: 0, stdout, stderr: '' };
  } catch (err: any) {
    return {
      code: err.status || 1,
      stdout: err.stdout ? err.stdout.toString() : '',
      stderr: err.stderr ? err.stderr.toString() : err.message,
    };
  }
}

async function runTestSuite() {
  try {
    // -------------------------------------------------------------------------
    // TEST 1: Positive verification with valid recent snapshot ARN
    // -------------------------------------------------------------------------
    console.log('1. Testing valid recent provider snapshot verification...');
    const test1 = runBackupVerification({
      TARGET_ENV: 'staging',
      BACKUP_TOKEN: 'arn:aws:rds:me-central-1:123456789012:snapshot:rds-automotive-os-staging-2026-10-23',
    });
    assert.strictEqual(test1.code, 0, `Expected 0, got ${test1.code}: ${test1.stderr || test1.stdout}`);
    assert(test1.stdout.includes('PROVIDER-BACKED BACKUP VERIFICATION CONFIRMED: PASS'));
    console.log('  [PASS] Valid provider snapshot confirmed with verified status, age, and region.');

    // -------------------------------------------------------------------------
    // TEST 2: Positive verification with Point-In-Time-Recovery (PITR)
    // -------------------------------------------------------------------------
    console.log('\n2. Testing Point-In-Time-Recovery (PITR) window verification...');
    const nowIso = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const test2 = runBackupVerification({
      TARGET_ENV: 'staging',
      BACKUP_TOKEN: `pitr:${nowIso}`,
    });
    assert.strictEqual(test2.code, 0, `Expected 0, got ${test2.code}: ${test2.stderr || test2.stdout}`);
    assert(test2.stdout.includes('PROVIDER-BACKED BACKUP VERIFICATION CONFIRMED: PASS'));
    console.log('  [PASS] PITR capability and restorable window independently confirmed.');

    // -------------------------------------------------------------------------
    // TEST 3: Negative Test — Missing backup token in PRODUCTION fails closed
    // -------------------------------------------------------------------------
    console.log('\n3. Negative Test: Production fails closed when BACKUP_TOKEN is missing...');
    const test3 = runBackupVerification({
      TARGET_ENV: 'production',
      BACKUP_TOKEN: '',
    });
    assert.notStrictEqual(test3.code, 0, 'Production must reject empty BACKUP_TOKEN');
    assert(test3.stderr.includes('require verified independent provider backup evidence') || test3.stdout.includes('require verified independent provider backup evidence'));
    console.log('  [PASS] Production deployment safely rejected without backup token.');

    // -------------------------------------------------------------------------
    // TEST 4: Negative Test — Missing backup token in STAGING fails closed
    // -------------------------------------------------------------------------
    console.log('\n4. Negative Test: Staging fails closed when BACKUP_TOKEN is missing...');
    const test4 = runBackupVerification({
      TARGET_ENV: 'staging',
      BACKUP_TOKEN: '',
    });
    assert.notStrictEqual(test4.code, 0, 'Staging must reject empty BACKUP_TOKEN');
    assert(test4.stderr.includes('require verified independent provider backup evidence') || test4.stdout.includes('require verified independent provider backup evidence'));
    console.log('  [PASS] Staging deployment safely rejected without backup token.');

    // -------------------------------------------------------------------------
    // TEST 5: Negative Test — Forged / Non-existent backup token rejected
    // -------------------------------------------------------------------------
    console.log('\n5. Negative Test: Forged/unregistered backup token rejected...');
    const test5 = runBackupVerification({
      TARGET_ENV: 'staging',
      BACKUP_TOKEN: 'arn:aws:rds:me-central-1:123456789012:snapshot:forged-fake-snapshot-token-999',
    });
    assert.notStrictEqual(test5.code, 0, 'Forged snapshot token must be rejected');
    assert(test5.stderr.includes('not found in registry') || test5.stdout.includes('not found in registry'));
    console.log('  [PASS] Forged token safely rejected by provider adapter.');

    // -------------------------------------------------------------------------
    // TEST 6: Negative Test — Stale snapshot (> 24 hours old) rejected
    // -------------------------------------------------------------------------
    console.log('\n6. Negative Test: Stale snapshot (>24 hours old) rejected...');
    const test6 = runBackupVerification({
      TARGET_ENV: 'staging',
      BACKUP_TOKEN: 'rds-automotive-os-stale',
    });
    assert.notStrictEqual(test6.code, 0, 'Stale snapshot (>24h) must be rejected');
    assert(test6.stderr.includes('is stale') || test6.stdout.includes('is stale'));
    console.log('  [PASS] Stale snapshot safely rejected (age > 24.0 hours).');

    // -------------------------------------------------------------------------
    // TEST 7: Negative Test — Wrong database instance rejected
    // -------------------------------------------------------------------------
    console.log('\n7. Negative Test: Snapshot for wrong database instance rejected...');
    const test7 = runBackupVerification({
      TARGET_ENV: 'staging',
      BACKUP_TOKEN: 'rds-foreign-database-snapshot',
    });
    assert.notStrictEqual(test7.code, 0, 'Snapshot for foreign database instance must be rejected');
    assert(test7.stderr.includes('does not match expected target') || test7.stdout.includes('does not match expected target'));
    console.log('  [PASS] Foreign database snapshot safely rejected.');

    // -------------------------------------------------------------------------
    // TEST 8: Negative Test — Incorrect region rejected (sovereignty violation)
    // -------------------------------------------------------------------------
    console.log('\n8. Negative Test: Snapshot in non-UAE region rejected...');
    const test8 = runBackupVerification({
      TARGET_ENV: 'staging',
      BACKUP_TOKEN: 'rds-wrong-region-snapshot',
    });
    assert.notStrictEqual(test8.code, 0, 'Snapshot in non-UAE region must be rejected');
    assert(test8.stderr.includes('expected \'me-central-1\'') || test8.stdout.includes('expected \'me-central-1\''));
    console.log('  [PASS] Non-UAE region snapshot safely rejected.');

    // -------------------------------------------------------------------------
    // TEST 9: Positive RLS Post-Migration Verification
    // -------------------------------------------------------------------------
    console.log('\n9. Testing post-migration RLS verification on clean database...');
    const test9 = runRlsVerification();
    assert.strictEqual(test9.code, 0, `Expected 0, got ${test9.code}: ${test9.stderr || test9.stdout}`);
    assert(test9.stdout.includes('ALL RLS POST-MIGRATION POLICIES AND CONSTRAINTS CONFIRMED PASS'));
    assert(test9.stdout.includes('Application role \'automotive_app_user\' strictly lacks SUPERUSER and BYPASSRLS'));
    console.log('  [PASS] All 20 tables verified with RLS ENABLED & FORCED and active non-bypass role.');

    // -------------------------------------------------------------------------
    // TEST 10: Negative Test — Unforced RLS detected and rejected
    // -------------------------------------------------------------------------
    console.log('\n10. Negative Test: Unforced RLS on protected table rejected...');
    // Temporarily unforce RLS on a table to verify negative gate detection
    await prisma.$executeRawUnsafe('ALTER TABLE public.makes NO FORCE ROW LEVEL SECURITY;');
    try {
      const test10 = runRlsVerification();
      assert.notStrictEqual(test10.code, 0, 'Unforced RLS must cause verification failure');
      assert(test10.stderr.includes('relforcerowsecurity=false') || test10.stdout.includes('relforcerowsecurity=false'));
      console.log('  [PASS] Unforced RLS detected and correctly failed closed.');
    } finally {
      // Restore FORCE ROW LEVEL SECURITY
      await prisma.$executeRawUnsafe('ALTER TABLE public.makes FORCE ROW LEVEL SECURITY;');
    }

    // -------------------------------------------------------------------------
    // TEST 11: Negative Test — Missing runtime role detected and rejected
    // -------------------------------------------------------------------------
    console.log('\n11. Negative Test: Altering app role to BYPASSRLS rejected...');
    // Temporarily grant BYPASSRLS to automotive_app_user
    await prisma.$executeRawUnsafe('ALTER ROLE automotive_app_user BYPASSRLS;');
    try {
      const test11 = runRlsVerification();
      assert.notStrictEqual(test11.code, 0, 'App role with BYPASSRLS must cause verification failure');
      assert(test11.stderr.includes('has rolbypassrls=true') || test11.stdout.includes('has rolbypassrls=true'));
      console.log('  [PASS] BYPASSRLS violation on app role detected and rejected.');
    } finally {
      // Restore NOBYPASSRLS
      await prisma.$executeRawUnsafe('ALTER ROLE automotive_app_user NOBYPASSRLS;');
    }

    // -------------------------------------------------------------------------
    // TEST 12: Subprocess environment inheritance check (Task 1 reproduction fix)
    // -------------------------------------------------------------------------
    console.log('\n12. Testing reliable subprocess DATABASE_URL environment inheritance...');
    // Execute without explicitly passing DATABASE_URL in overrides, proving subprocess inherits baseEnv
    const test12 = runBackupVerification({
      TARGET_ENV: 'staging',
      BACKUP_TOKEN: 'rds-automotive-os-staging-2026-10-23',
    });
    assert.strictEqual(test12.code, 0);
    assert(!test12.stderr.includes('DATABASE_URL environment variable is not defined'));
    console.log('  [PASS] Subprocess reliably inherits DATABASE_URL configuration.');

    // -------------------------------------------------------------------------
    // TEST 13: Positive verification with Self-Hosted Containerized Backup Adapter
    // -------------------------------------------------------------------------
    console.log('\n13. Testing Self-Hosted Containerized PostgreSQL Backup Adapter...');
    const currentIso = new Date().toISOString();
    const test13 = runBackupVerification({
      TARGET_ENV: 'staging',
      BACKUP_PROVIDER_ADAPTER: 'self-hosted',
      BACKUP_TOKEN: `selfhosted-automotive_os_staging-${currentIso}`,
    });
    assert.strictEqual(test13.code, 0, `Expected 0, got ${test13.code}: ${test13.stderr || test13.stdout}`);
    assert(test13.stdout.includes('PROVIDER-BACKED BACKUP VERIFICATION CONFIRMED: PASS'));
    console.log('  [PASS] Self-hosted containerized PostgreSQL backup verification confirmed.');

    // -------------------------------------------------------------------------
    // TEST 14: Negative Test: Stale Self-Hosted backup rejected
    // -------------------------------------------------------------------------
    console.log('\n14. Negative Test: Stale Self-Hosted backup (>24h) rejected...');
    const staleIso = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const test14 = runBackupVerification({
      TARGET_ENV: 'staging',
      BACKUP_PROVIDER_ADAPTER: 'self-hosted',
      BACKUP_TOKEN: `selfhosted-automotive_os_staging-${staleIso}`,
    });
    assert.notStrictEqual(test14.code, 0, 'Stale self-hosted backup must be rejected');
    assert(test14.stderr.includes('is stale') || test14.stdout.includes('is stale'));
    console.log('  [PASS] Stale self-hosted backup safely rejected (age > 24h).');

    console.log('\n========================================================================');
    console.log('✅ ALL 14 DATABASE BACKUP & RLS VERIFICATION TESTS PASSED.');
    console.log('========================================================================');
    process.exit(0);
  } catch (err: any) {
    console.error(`\n❌ TEST SUITE FAILURE: ${err?.message || err}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTestSuite();
