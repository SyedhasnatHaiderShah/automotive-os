import { PrismaClient, VehicleCondition, StockStatus, ListingStatus, LeadStatus, LeadIntent, ContactPreference, AppointmentStatus } from '@prisma/client';

const isProductionOrStaging = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';
const databaseUrl = process.env.DATABASE_URL;

if (isProductionOrStaging && !databaseUrl) {
  throw new Error(
    `[SECURITY_FATAL] DATABASE_URL must be explicitly configured in '${process.env.NODE_ENV}' environment. Fail-open localhost defaults are strictly prohibited.`
  );
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl || 'postgresql://postgres:postgres@localhost:5432/automotive_os?schema=public',
    },
  },
});

export const SEED_DATA = {
  dealerA: {
    tenantId: '11111111-1111-1111-1111-111111111111',
    branchId: '11111111-1111-1111-1111-000000000001',
    principalUserId: '10000000-0000-0000-0000-000000000001',
    vehicleAvailableId: '11111111-1111-1111-1111-aaaa00000001',
    vehicleSoldId: '11111111-1111-1111-1111-aaaa00000002',
    listingAvailableId: '11111111-1111-1111-1111-cccc00000001',
    listingSoldId: '11111111-1111-1111-1111-cccc00000002',
    leadId: '11111111-1111-1111-1111-dddd00000001',
    grantId: '11111111-1111-1111-1111-eeee00000001',
    appointmentId: '11111111-1111-1111-1111-ffff00000001',
  },
  dealerB: {
    tenantId: '22222222-2222-2222-2222-222222222222',
    branchId: '22222222-2222-2222-2222-000000000001',
    principalUserId: '20000000-0000-0000-0000-000000000002',
    vehicleAvailableId: '22222222-2222-2222-2222-bbbb00000001',
    listingAvailableId: '22222222-2222-2222-2222-cccc00000001',
  },
  buyers: {
    buyerAId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    buyerBId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  },
  admin: {
    adminUserId: '99999999-9999-9999-9999-999999999999',
  },
};

async function main() {
  console.log('[Seed] Seeding fictional UAE development data...');

  // 1. Catalog: Makes & Models
  const toyota = await prisma.make.upsert({
    where: { slug: 'toyota' },
    update: {},
    create: {
      name: 'Toyota',
      slug: 'toyota',
      models: {
        create: [
          { name: 'Land Cruiser', slug: 'land-cruiser' },
          { name: 'Camry', slug: 'camry' },
        ],
      },
    },
    include: { models: true },
  });

  const porsche = await prisma.make.upsert({
    where: { slug: 'porsche' },
    update: {},
    create: {
      name: 'Porsche',
      slug: 'porsche',
      models: {
        create: [
          { name: '911', slug: '911' },
          { name: 'Cayenne', slug: 'cayenne' },
        ],
      },
    },
    include: { models: true },
  });

  const lcModel = toyota.models.find((m) => m.slug === 'land-cruiser')!;
  const p911Model = porsche.models.find((m) => m.slug === '911')!;
  const cayenneModel = porsche.models.find((m) => m.slug === 'cayenne')!;

  // 2. Tenants & Branches
  // Dealer A (Dubai)
  await prisma.tenant.upsert({
    where: { id: SEED_DATA.dealerA.tenantId },
    update: { status: 'ACTIVE' },
    create: {
      id: SEED_DATA.dealerA.tenantId,
      slug: 'al-futtaim-prestige',
      legalName: 'Al Futtaim Prestige Motors LLC',
      displayName: 'Al Futtaim Prestige Motors',
      status: 'ACTIVE',
      currency: 'AED',
      branches: {
        create: {
          id: SEED_DATA.dealerA.branchId,
          name: 'Sheikh Zayed Road Flagship',
          emirate: 'Dubai',
          city: 'Dubai',
          address: 'Sheikh Zayed Rd, Exit 45, Dubai, UAE',
          latitude: 25.1972,
          longitude: 55.2744,
        },
      },
      verification: {
        create: {
          status: 'APPROVED',
          tradeLicenseRef: 'TL-DXB-987654',
          licenseExpiry: new Date('2028-12-31'),
          jurisdiction: 'Dubai DED',
          reviewNotes: 'Fully verified commercial dealership license.',
        },
      },
    },
  });

  // Dealer B (Sharjah)
  await prisma.tenant.upsert({
    where: { id: SEED_DATA.dealerB.tenantId },
    update: { status: 'ACTIVE' },
    create: {
      id: SEED_DATA.dealerB.tenantId,
      slug: 'gargash-autos',
      legalName: 'Gargash Emirates Autos FZCO',
      displayName: 'Gargash Emirates Autos',
      status: 'ACTIVE',
      currency: 'AED',
      branches: {
        create: {
          id: SEED_DATA.dealerB.branchId,
          name: 'Al Wahda Showroom',
          emirate: 'Sharjah',
          city: 'Sharjah',
          address: 'Al Wahda St, Industrial Area 4, Sharjah, UAE',
          latitude: 25.3374,
          longitude: 55.3919,
        },
      },
      verification: {
        create: {
          status: 'APPROVED',
          tradeLicenseRef: 'TL-SHJ-123456',
          licenseExpiry: new Date('2027-10-15'),
          jurisdiction: 'Sharjah SEDD',
          reviewNotes: 'Verified Sharjah automotive trade license.',
        },
      },
    },
  });

  // Explicitly ensure dealer verifications are APPROVED even if tenants pre-existed
  await prisma.dealerVerification.upsert({
    where: { tenantId: SEED_DATA.dealerA.tenantId },
    update: { status: 'APPROVED' },
    create: {
      tenantId: SEED_DATA.dealerA.tenantId,
      status: 'APPROVED',
      tradeLicenseRef: 'TL-DXB-987654',
      licenseExpiry: new Date('2028-12-31'),
      jurisdiction: 'Dubai DED',
      reviewNotes: 'Fully verified commercial dealership license.',
    },
  });

  await prisma.dealerVerification.upsert({
    where: { tenantId: SEED_DATA.dealerB.tenantId },
    update: { status: 'APPROVED' },
    create: {
      tenantId: SEED_DATA.dealerB.tenantId,
      status: 'APPROVED',
      tradeLicenseRef: 'TL-SHJ-123456',
      licenseExpiry: new Date('2027-10-15'),
      jurisdiction: 'Sharjah SEDD',
      reviewNotes: 'Verified Sharjah automotive trade license.',
    },
  });

  // 3. Users: Staff, Buyers, Admin
  // Dealer A Principal
  await prisma.user.upsert({
    where: { id: SEED_DATA.dealerA.principalUserId },
    update: {},
    create: {
      id: SEED_DATA.dealerA.principalUserId,
      identitySubject: 'auth0|dealer_a_tariq',
      email: 'tariq@alfuttaim-prestige.ae',
      phoneE164: '+971501111111',
      displayName: 'Tariq Al-Hashimi',
      memberships: {
        create: {
          tenantId: SEED_DATA.dealerA.tenantId,
          role: 'OWNER',
          active: true,
        },
      },
    },
  });

  // Dealer B Principal
  await prisma.user.upsert({
    where: { id: SEED_DATA.dealerB.principalUserId },
    update: {},
    create: {
      id: SEED_DATA.dealerB.principalUserId,
      identitySubject: 'auth0|dealer_b_zayd',
      email: 'zayd@gargash-autos.ae',
      phoneE164: '+971502222222',
      displayName: 'Zayd Mansoor',
      memberships: {
        create: {
          tenantId: SEED_DATA.dealerB.tenantId,
          role: 'OWNER',
          active: true,
        },
      },
    },
  });

  // Buyer A
  await prisma.user.upsert({
    where: { id: SEED_DATA.buyers.buyerAId },
    update: {},
    create: {
      id: SEED_DATA.buyers.buyerAId,
      identitySubject: 'auth0|buyer_a_rashid',
      email: 'rashid.buyer@example.ae',
      phoneE164: '+971503333333',
      displayName: 'Rashid Al-Maktoum',
      buyer: {
        create: {
          preferredLanguage: 'ar',
          preferredEmirate: 'Dubai',
          budgetMinFils: BigInt(20000000), // 200,000 AED
          budgetMaxFils: BigInt(40000000), // 400,000 AED
          preferredMakes: ['Toyota', 'Porsche'],
        },
      },
    },
  });

  // Buyer B
  await prisma.user.upsert({
    where: { id: SEED_DATA.buyers.buyerBId },
    update: {},
    create: {
      id: SEED_DATA.buyers.buyerBId,
      identitySubject: 'auth0|buyer_b_fatima',
      email: 'fatima.buyer@example.ae',
      phoneE164: '+971504444444',
      displayName: 'Fatima Al-Nuaimi',
      buyer: {
        create: {
          preferredLanguage: 'en',
          preferredEmirate: 'Sharjah',
          budgetMinFils: BigInt(15000000),
          budgetMaxFils: BigInt(30000000),
          preferredMakes: ['Porsche'],
        },
      },
    },
  });

  // Platform Admin
  await prisma.user.upsert({
    where: { id: SEED_DATA.admin.adminUserId },
    update: {},
    create: {
      id: SEED_DATA.admin.adminUserId,
      identitySubject: 'auth0|platform_admin',
      email: 'admin@autonexa.ae',
      phoneE164: '+971509999999',
      displayName: 'Maryam Al-Sabah',
      isPlatformAdmin: true,
    },
  });

  // 4. Vehicles & Media
  // Dealer A - Vehicle 1: 2024 Toyota Land Cruiser (AVAILABLE)
  await prisma.vehicle.upsert({
    where: { id: SEED_DATA.dealerA.vehicleAvailableId },
    update: { stockStatus: StockStatus.AVAILABLE },
    create: {
      id: SEED_DATA.dealerA.vehicleAvailableId,
      tenantId: SEED_DATA.dealerA.tenantId,
      branchId: SEED_DATA.dealerA.branchId,
      makeId: toyota.id,
      modelId: lcModel.id,
      vin: '1GNEK1337PREST01',
      stockNumber: 'AFP-2024-001',
      trim: 'GR-Sport Twin Turbo V6',
      modelYear: 2024,
      condition: VehicleCondition.NEW,
      mileageKm: 150,
      colorExterior: 'Pearl White',
      fuel: 'PETROL',
      transmission: 'AUTOMATIC',
      gccSpec: true,
      purchaseCostFils: BigInt(31000000), // 310,000 AED - CONFIDENTIAL
      askingPriceFils: BigInt(35000000), // 350,000 AED
      stockStatus: StockStatus.AVAILABLE,
      media: {
        create: [
          {
            kind: 'EXTERIOR',
            objectKey: 'vehicles/dealer_a/lc_exterior_1.jpg',
            altText: 'Toyota Land Cruiser Front 3/4 View',
            sortOrder: 1,
            isPublic: true,
          },
          {
            kind: 'DOCUMENT',
            objectKey: 'vehicles/dealer_a/lc_confidential_invoice.pdf',
            altText: 'Private Supplier Purchase Invoice',
            sortOrder: 99,
            isPublic: false,
          },
        ],
      },
    },
  });

  // Dealer A - Vehicle 2: 2023 Porsche 911 (SOLD)
  await prisma.vehicle.upsert({
    where: { id: SEED_DATA.dealerA.vehicleSoldId },
    update: { stockStatus: StockStatus.SOLD },
    create: {
      id: SEED_DATA.dealerA.vehicleSoldId,
      tenantId: SEED_DATA.dealerA.tenantId,
      branchId: SEED_DATA.dealerA.branchId,
      makeId: porsche.id,
      modelId: p911Model.id,
      vin: 'WP0AB2A99PS00002',
      stockNumber: 'AFP-2023-099',
      trim: 'Carrera S Cabriolet',
      modelYear: 2023,
      condition: VehicleCondition.USED,
      mileageKm: 8500,
      colorExterior: 'Guards Red',
      fuel: 'PETROL',
      transmission: 'AUTOMATIC',
      gccSpec: true,
      purchaseCostFils: BigInt(48000000), // 480,000 AED
      askingPriceFils: BigInt(52000000), // 520,000 AED
      stockStatus: StockStatus.SOLD,
    },
  });

  // Dealer B - Vehicle 3: 2024 Porsche Cayenne (AVAILABLE)
  await prisma.vehicle.upsert({
    where: { id: SEED_DATA.dealerB.vehicleAvailableId },
    update: {},
    create: {
      id: SEED_DATA.dealerB.vehicleAvailableId,
      tenantId: SEED_DATA.dealerB.tenantId,
      branchId: SEED_DATA.dealerB.branchId,
      makeId: porsche.id,
      modelId: cayenneModel.id,
      vin: 'WP1AA2AY5PS00003',
      stockNumber: 'GEA-2024-001',
      trim: 'Turbo GT',
      modelYear: 2024,
      condition: VehicleCondition.NEW,
      mileageKm: 50,
      colorExterior: 'Arctic Grey',
      fuel: 'PETROL',
      transmission: 'AUTOMATIC',
      gccSpec: true,
      purchaseCostFils: BigInt(55000000), // 550,000 AED
      askingPriceFils: BigInt(60000000), // 600,000 AED
      stockStatus: StockStatus.AVAILABLE,
      media: {
        create: [
          {
            kind: 'EXTERIOR',
            objectKey: 'vehicles/dealer_b/cayenne_exterior_1.jpg',
            altText: 'Porsche Cayenne Turbo GT Side Profile',
            sortOrder: 1,
            isPublic: true,
          },
        ],
      },
    },
  });

  // 5. Listings
  // Dealer A - Listing 1 (PUBLISHED for Vehicle 1)
  await prisma.listing.upsert({
    where: { id: SEED_DATA.dealerA.listingAvailableId },
    update: { status: ListingStatus.PUBLISHED },
    create: {
      id: SEED_DATA.dealerA.listingAvailableId,
      tenantId: SEED_DATA.dealerA.tenantId,
      vehicleId: SEED_DATA.dealerA.vehicleAvailableId,
      slug: '2024-toyota-land-cruiser-gr-sport-dubai',
      title: '2024 Toyota Land Cruiser GR-Sport V6 Twin-Turbo',
      description: 'Brand new 2024 GR-Sport in pristine Pearl White, full GCC specification with dealer warranty.',
      askingPriceFils: BigInt(35000000),
      status: ListingStatus.PUBLISHED,
      qualityScore: 98,
      verifiedAt: new Date(),
      publishedAt: new Date(),
    },
  });

  // Dealer A - Listing 2 (SOLD for Vehicle 2)
  await prisma.listing.upsert({
    where: { id: SEED_DATA.dealerA.listingSoldId },
    update: { status: ListingStatus.SOLD },
    create: {
      id: SEED_DATA.dealerA.listingSoldId,
      tenantId: SEED_DATA.dealerA.tenantId,
      vehicleId: SEED_DATA.dealerA.vehicleSoldId,
      slug: '2023-porsche-911-carrera-dubai',
      title: '2023 Porsche 911 Carrera S Cabriolet',
      description: 'Sold unit retained in private dealer ledger.',
      askingPriceFils: BigInt(52000000),
      status: ListingStatus.SOLD,
      qualityScore: 95,
      verifiedAt: new Date(),
    },
  });

  // Dealer B - Listing 3 (PUBLISHED for Vehicle 3)
  await prisma.listing.upsert({
    where: { id: SEED_DATA.dealerB.listingAvailableId },
    update: { status: ListingStatus.PUBLISHED },
    create: {
      id: SEED_DATA.dealerB.listingAvailableId,
      tenantId: SEED_DATA.dealerB.tenantId,
      vehicleId: SEED_DATA.dealerB.vehicleAvailableId,
      slug: '2024-porsche-cayenne-turbo-gt-sharjah',
      title: '2024 Porsche Cayenne Turbo GT',
      description: 'Brand new 2024 Cayenne Turbo GT in Arctic Grey.',
      askingPriceFils: BigInt(60000000),
      status: ListingStatus.PUBLISHED,
      qualityScore: 96,
      verifiedAt: new Date(),
      publishedAt: new Date(),
    },
  });

  // 6. CRM Lead, Consent Grant, and Appointment
  // Buyer A enquires about Dealer A's Land Cruiser
  await prisma.lead.upsert({
    where: { id: SEED_DATA.dealerA.leadId },
    update: {},
    create: {
      id: SEED_DATA.dealerA.leadId,
      tenantId: SEED_DATA.dealerA.tenantId,
      listingId: SEED_DATA.dealerA.listingAvailableId,
      buyerUserId: SEED_DATA.buyers.buyerAId,
      status: LeadStatus.NEW,
      intent: LeadIntent.TEST_DRIVE,
      preferredContact: ContactPreference.WHATSAPP,
      buyerMessage: 'Interested in test driving the Land Cruiser GR-Sport this Saturday.',
      grant: {
        create: {
          id: SEED_DATA.dealerA.grantId,
          fieldsGranted: ['name', 'phone'],
          purpose: 'vehicle_enquiry_and_test_drive',
          consentTextVer: '1.0_UAE_CONSENT',
        },
      },
      appointments: {
        create: {
          id: SEED_DATA.dealerA.appointmentId,
          buyerUserId: SEED_DATA.buyers.buyerAId,
          startsAt: new Date('2026-10-24T10:00:00Z'),
          endsAt: new Date('2026-10-24T11:00:00Z'),
          status: AppointmentStatus.CONFIRMED,
          note: 'VIP showroom test drive appointment.',
        },
      },
    },
  });

  console.log('[Seed] Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('[Seed] Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
