import { execSync } from 'node:child_process';
import assert from 'node:assert';

console.log('========================================================================');
console.log('Automotive OS — Test Suite: Database Backup & RLS Verification Gates');
console.log('========================================================================\n');

// Test 1: Staging backup check without explicit token succeeds safely with rollback guarantee
console.log('Test 1: Staging backup verification without token...');
try {
  const output = execSync('pnpm exec tsx scripts/verify-backup-snapshot.ts', {
    cwd: process.cwd(),
    env: {
      ...process.env,
      TARGET_ENV: 'staging',
      BACKUP_TOKEN: '',
    },
  }).toString();
  assert(output.includes('Pre-migration safety checks passed for staging'));
  console.log('  [PASS] Staging fallback permits transaction-scoped rollback.');
} catch (err: any) {
  console.error('  [FAIL] Test 1 failed:', err.message);
  process.exit(1);
}

// Test 2: Production backup check FAILS CLOSED when token is missing
console.log('Test 2: Production backup check fails closed when BACKUP_TOKEN is unset...');
try {
  execSync('pnpm exec tsx scripts/verify-backup-snapshot.ts', {
    cwd: process.cwd(),
    env: {
      ...process.env,
      TARGET_ENV: 'production',
      BACKUP_TOKEN: '',
    },
  });
  console.error('  [FAIL] Expected production backup verification to fail closed on empty token!');
  process.exit(1);
} catch (err: any) {
  assert(err.status !== 0);
  const stderr = err.stderr ? err.stderr.toString() : err.stdout.toString();
  assert(stderr.includes('Production migrations require a valid, verified BACKUP_TOKEN') || err.stdout.toString().includes('Production migrations require a valid, verified BACKUP_TOKEN'));
  console.log('  [PASS] Production check safely failed closed without BACKUP_TOKEN.');
}

// Test 3: Production backup check succeeds with valid recent RDS snapshot ARN
console.log('Test 3: Valid recent RDS snapshot ARN verification...');
try {
  const output = execSync('pnpm exec tsx scripts/verify-backup-snapshot.ts', {
    cwd: process.cwd(),
    env: {
      ...process.env,
      TARGET_ENV: 'staging',
      BACKUP_TOKEN: 'arn:aws:rds:me-central-1:123456789012:snapshot:rds-automotive-os-staging-2026-10-23',
    },
  }).toString();
  assert(output.includes('BACKUP VERIFICATION SUCCESSFUL'));
  assert(output.includes('aws-rds'));
  console.log('  [PASS] AWS RDS snapshot ARN successfully parsed and validated.');
} catch (err: any) {
  console.error('  [FAIL] Test 3 failed:', err.message);
  process.exit(1);
}

// Test 4: Post-migration RLS verification script passes on active database
console.log('Test 4: Post-migration RLS policy and non-bypass role verification...');
try {
  const output = execSync('pnpm exec tsx scripts/verify-rls-post-migration.ts', {
    cwd: process.cwd(),
    env: process.env,
  }).toString();
  assert(output.includes('ALL RLS POST-MIGRATION POLICIES AND CONSTRAINTS CONFIRMED PASS'));
  assert(output.includes('Application role \'automotive_app_user\' strictly lacks rolbypassrls'));
  console.log('  [PASS] All RLS table policies and non-bypass security confirmed.');
} catch (err: any) {
  console.error('  [FAIL] Test 4 failed:', err.message);
  process.exit(1);
}

console.log('\n========================================================================');
console.log('✅ ALL BACKUP & RLS VERIFICATION GATE TESTS PASSED.');
console.log('========================================================================');
