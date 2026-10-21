import { PrismaClient } from '@prisma/client';
import { SEED_DATA } from '../prisma/seed';

// 1. Connection with non-bypass application user
const appDbUrl = 'postgresql://automotive_app_user:app_secure_dev_password@localhost:5432/automotive_os?schema=public';
const prismaApp = new PrismaClient({
  datasources: {
    db: {
      url: appDbUrl,
    },
  },
});

// 2. Connection with superuser/admin (for negative FK test setup)
const superDbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/automotive_os?schema=public';
const prismaAdmin = new PrismaClient({
  datasources: {
    db: {
      url: superDbUrl,
    },
  },
});

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, message: string) {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    results.push({ name, passed: true, message });
  } else {
    console.error(`  [FAIL] ${name} - ${message}`);
    results.push({ name, passed: false, message });
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('Automotive OS — Multi-Tenancy & RLS Verification Suite');
  console.log('======================================================\n');

  // ---------------------------------------------------------
  // Test 1: Composite Foreign Key Negative Test
  // ---------------------------------------------------------
  console.log('1. Testing Composite Foreign Key Integrity...');
  try {
    // Attempt to create a Vehicle under Dealer A pointing to Dealer B's Branch
    // This MUST be blocked by composite foreign key (tenant_id, branch_id) -> branches(tenant_id, id)
    await prismaAdmin.$executeRawUnsafe(`
      INSERT INTO public.vehicles (
        id, tenant_id, branch_id, make_id, model_id, vin, stock_number, model_year, condition, asking_price_fils, stock_status, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        '${SEED_DATA.dealerA.tenantId}'::uuid,
        '${SEED_DATA.dealerB.branchId}'::uuid, -- ILLEGAL: Branch belongs to Dealer B
        (SELECT id FROM public.makes LIMIT 1),
        (SELECT id FROM public.car_models LIMIT 1),
        'CROSS_TENANT_VIN1',
        'CROSS-001',
        2024,
        'NEW',
        10000000,
        'AVAILABLE',
        NOW(),
        NOW()
      );
    `);
    assert(false, 'Composite FK: Cross-Tenant Branch Linking', 'Expected database to reject cross-tenant branch FK');
  } catch (err: any) {
    const isFkViolation = err.message.includes('foreign key constraint') || err.message.includes('vehicles_tenant_id_branch_id_fkey') || err.message.includes('violates');
    assert(isFkViolation, 'Composite FK: Cross-Tenant Branch Linking Rejected', 'Database successfully rejected cross-tenant branch assignment via composite foreign key');
  }

  try {
    // Attempt to create a Lead under Dealer A pointing to Dealer B's Listing
    await prismaAdmin.$executeRawUnsafe(`
      INSERT INTO public.leads (
        id, tenant_id, listing_id, buyer_user_id, status, intent, preferred_contact, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        '${SEED_DATA.dealerA.tenantId}'::uuid,
        '${SEED_DATA.dealerB.listingAvailableId}'::uuid, -- ILLEGAL: Listing belongs to Dealer B
        '${SEED_DATA.buyers.buyerAId}'::uuid,
        'NEW',
        'ENQUIRY',
        'EMAIL',
        NOW(),
        NOW()
      );
    `);
    assert(false, 'Composite FK: Cross-Tenant Lead-Listing Linking', 'Expected database to reject cross-tenant listing FK');
  } catch (err: any) {
    const isFkViolation = err.message.includes('foreign key constraint') || err.message.includes('leads_tenant_id_listing_id_fkey') || err.message.includes('violates');
    assert(isFkViolation, 'Composite FK: Cross-Tenant Lead-Listing Rejected', 'Database successfully rejected cross-tenant lead-listing assignment via composite foreign key');
  }

  // ---------------------------------------------------------
  // Test 2: Dealer Cross-Tenant Asset Read & Change Denial
  // ---------------------------------------------------------
  console.log('\n2. Testing Dealer Asset Isolation (Non-Bypass App Role)...');
  await prismaApp.$transaction(async (tx) => {
    // Set transaction-local tenant context to Dealer A
    await tx.$executeRawUnsafe(`SELECT set_config('app.tenant_id', '${SEED_DATA.dealerA.tenantId}', true)`);

    // Dealer A queries vehicles
    const vehicles: any = await tx.$queryRawUnsafe(`SELECT id, tenant_id, vin, purchase_cost_fils FROM public.vehicles`);
    const hasDealerA = vehicles.some((v: any) => v.tenant_id === SEED_DATA.dealerA.tenantId);
    const hasDealerB = vehicles.some((v: any) => v.tenant_id === SEED_DATA.dealerB.tenantId);

    assert(hasDealerA, 'Dealer A: Can Read Own Vehicles', `Found ${vehicles.length} vehicles under Dealer A`);
    assert(!hasDealerB, 'Dealer A: CANNOT Read Dealer B Vehicles', 'Zero Dealer B vehicles visible to Dealer A');

    // Negative Test: Dealer A attempts to UPDATE Dealer B's vehicle
    const updatedCount: number = await tx.$executeRawUnsafe(`
      UPDATE public.vehicles
      SET asking_price_fils = 99999999
      WHERE id = '${SEED_DATA.dealerB.vehicleAvailableId}'::uuid
    `);
    assert(updatedCount === 0, 'Dealer A: CANNOT Change Dealer B Vehicles', `Update affected ${updatedCount} rows (expected 0)`);

    // Negative Test: Dealer A attempts to DELETE Dealer B's vehicle
    const deletedCount: number = await tx.$executeRawUnsafe(`
      DELETE FROM public.vehicles
      WHERE id = '${SEED_DATA.dealerB.vehicleAvailableId}'::uuid
    `);
    assert(deletedCount === 0, 'Dealer A: CANNOT Delete Dealer B Vehicles', `Delete affected ${deletedCount} rows (expected 0)`);
  });

  // Verify Dealer B context
  await prismaApp.$transaction(async (tx) => {
    // Set transaction-local tenant context to Dealer B
    await tx.$executeRawUnsafe(`SELECT set_config('app.tenant_id', '${SEED_DATA.dealerB.tenantId}', true)`);

    const vehicles: any = await tx.$queryRawUnsafe(`SELECT id, tenant_id FROM public.vehicles`);
    const hasDealerB = vehicles.some((v: any) => v.tenant_id === SEED_DATA.dealerB.tenantId);
    const hasDealerA = vehicles.some((v: any) => v.tenant_id === SEED_DATA.dealerA.tenantId);

    assert(hasDealerB, 'Dealer B: Can Read Own Vehicles', `Found ${vehicles.length} vehicles under Dealer B`);
    assert(!hasDealerA, 'Dealer B: CANNOT Read Dealer A Vehicles', 'Zero Dealer A vehicles visible to Dealer B');
  });

  // ---------------------------------------------------------
  // Test 3: Buyer Profile Resource Isolation
  // ---------------------------------------------------------
  console.log('\n3. Testing Buyer Profile Isolation (Non-Bypass App Role)...');
  await prismaApp.$transaction(async (tx) => {
    // Buyer A context
    await tx.$executeRawUnsafe(`SELECT set_config('app.user_id', '${SEED_DATA.buyers.buyerAId}', true)`);

    const profiles: any = await tx.$queryRawUnsafe(`SELECT user_id, preferred_emirate FROM public.buyer_profiles`);
    const hasBuyerA = profiles.some((p: any) => p.user_id === SEED_DATA.buyers.buyerAId);
    const hasBuyerB = profiles.some((p: any) => p.user_id === SEED_DATA.buyers.buyerBId);

    assert(hasBuyerA, 'Buyer A: Can Read Own Profile', 'Buyer A profile retrieved');
    assert(!hasBuyerB, 'Buyer A: CANNOT Read Buyer B Profile', 'Buyer B profile is invisible to Buyer A');
  });

  await prismaApp.$transaction(async (tx) => {
    // Buyer B context
    await tx.$executeRawUnsafe(`SELECT set_config('app.user_id', '${SEED_DATA.buyers.buyerBId}', true)`);

    const profiles: any = await tx.$queryRawUnsafe(`SELECT user_id, preferred_emirate FROM public.buyer_profiles`);
    const hasBuyerB = profiles.some((p: any) => p.user_id === SEED_DATA.buyers.buyerBId);
    const hasBuyerA = profiles.some((p: any) => p.user_id === SEED_DATA.buyers.buyerAId);

    assert(hasBuyerB, 'Buyer B: Can Read Own Profile', 'Buyer B profile retrieved');
    assert(!hasBuyerA, 'Buyer B: CANNOT Read Buyer A Profile', 'Buyer A profile is invisible to Buyer B');
  });

  // ---------------------------------------------------------
  // Test 4: Public Redacted Listing Projection & Unpublish Guarantee
  // ---------------------------------------------------------
  console.log('\n4. Testing Public Redacted Read Projection & Sold Unpublish...');
  await prismaApp.$transaction(async (tx) => {
    // Anonymous public context (no tenant_id, no user_id)
    await tx.$executeRawUnsafe(`SELECT set_config('app.tenant_id', '', true)`);
    await tx.$executeRawUnsafe(`SELECT set_config('app.user_id', '', true)`);

    const publicListings: any = await tx.$queryRawUnsafe(`
      SELECT id, title, asking_price_fils, status
      FROM public.listings
    `);

    const availableListingA = publicListings.some((l: any) => l.id === SEED_DATA.dealerA.listingAvailableId);
    const availableListingB = publicListings.some((l: any) => l.id === SEED_DATA.dealerB.listingAvailableId);
    const soldListingA = publicListings.some((l: any) => l.id === SEED_DATA.dealerA.listingSoldId);

    assert(availableListingA && availableListingB, 'Public: Can Read Available Published Listings', `Found ${publicListings.length} public listings`);
    assert(!soldListingA, 'Public: Sold Vehicles Do NOT Remain Public', 'Sold vehicle listing is completely hidden from public queries via RLS');

    // Verify private stock table is protected from anonymous public queries
    const publicVehicles: any = await tx.$queryRawUnsafe(`SELECT id FROM public.vehicles`);
    assert(publicVehicles.length === 0, 'Public: Cannot Directly Query Private Vehicle Ledger', 'Private vehicles table returned 0 rows to unauthenticated caller');
  });

  // ---------------------------------------------------------
  // Test 5: Audited Platform Admin Access
  // ---------------------------------------------------------
  console.log('\n5. Testing Platform Admin Access & Audit...');
  await prismaApp.$transaction(async (tx) => {
    // Set platform admin context
    await tx.$executeRawUnsafe(`SELECT set_config('app.is_admin', 'true', true)`);
    await tx.$executeRawUnsafe(`SELECT set_config('app.user_id', '${SEED_DATA.admin.adminUserId}', true)`);

    // Log admin audit event
    await tx.$executeRawUnsafe(`
      INSERT INTO public.audit_events (
        id, tenant_id, actor_user_id, action, target_type, target_id, correlation_id, metadata, created_at
      ) VALUES (
        gen_random_uuid(),
        NULL,
        '${SEED_DATA.admin.adminUserId}'::uuid,
        'PLATFORM_AUDIT_CROSS_TENANT_INSPECTION',
        'vehicles',
        'ALL',
        'corr-admin-check-001',
        '{"reason": "routine_platform_moderation"}'::jsonb,
        NOW()
      )
    `);

    // Platform admin queries vehicles across all tenants
    const allVehicles: any = await tx.$queryRawUnsafe(`SELECT id, tenant_id FROM public.vehicles`);
    const hasDealerA = allVehicles.some((v: any) => v.tenant_id === SEED_DATA.dealerA.tenantId);
    const hasDealerB = allVehicles.some((v: any) => v.tenant_id === SEED_DATA.dealerB.tenantId);

    assert(hasDealerA && hasDealerB, 'Platform Admin: Cross-Tenant Inspection Access', `Admin viewed ${allVehicles.length} total vehicles across all tenants`);
  });

  console.log('\n======================================================');
  const allPassed = results.every((r) => r.passed);
  console.log(`Summary: ${results.filter((r) => r.passed).length}/${results.length} tests passed.`);
  console.log(`Status: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  console.log('======================================================\n');

  await prismaApp.$disconnect();
  await prismaAdmin.$disconnect();

  if (!allPassed) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Test execution failed with unhandled error:', e);
  process.exit(1);
});
