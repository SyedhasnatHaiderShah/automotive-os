/**
 * Production-scale, fully fictional QA data set for LOCAL databases.
 *
 *   pnpm --filter @automotive-os/database run seed:scale
 *
 * What it adds (idempotent, deterministic ids, re-runnable):
 *   - a shared catalogue of 26 makes / ~105 models with realistic AED price bands
 *   - 14 dealerships in every tenant / verification state across all seven emirates
 *   - staff for every membership role, buyers, platform admins and edge-case accounts
 *   - ~640 vehicles in every stock status, media rows, listings in every listing status
 *   - leads, consent grants, appointments, favourites, saved searches, subscriptions,
 *     invitations, audit and outbox rows at admin-pagination scale
 *
 * Every seeded account (including the baseline seed accounts) gets ONE shared
 * password. It is taken from SEED_PASSWORD, or generated, and written only to
 * `<repo>/.qa-credentials.local.json` (gitignored). It is never printed.
 *
 * Safety: refuses to run when NODE_ENV is production/staging or when
 * DATABASE_URL looks like a hosted database. Only inserts/updates its own rows.
 * Set SEED_SCALE=2 (or more) to multiply vehicle, lead and buyer volume.
 */
import {
  PrismaClient,
  Prisma,
  VehicleCondition,
  StockStatus,
  ListingStatus,
  LeadStatus,
  LeadIntent,
  ContactPreference,
  AppointmentStatus,
  MembershipRole,
  TenantStatus,
  VerificationStatus,
  UserStatus,
  FuelType,
  Transmission,
  MediaKind,
  SubscriptionStatus,
  OutboxStatus,
} from '@prisma/client';
import { createHash, randomBytes, scrypt } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------
const nodeEnv = process.env.NODE_ENV || 'development';
const databaseUrl = process.env.DATABASE_URL;
if (nodeEnv === 'production' || nodeEnv === 'staging') {
  throw new Error('[seed-scale] Refusing to run in production/staging.');
}
if (!databaseUrl) {
  throw new Error('[seed-scale] DATABASE_URL must be set explicitly (no fallback for bulk seeding).');
}
if (/staging|railway|rlwy|proxy|amazonaws|supabase|neon\.tech|render\.com/i.test(databaseUrl)) {
  throw new Error('[seed-scale] DATABASE_URL looks like a hosted database. Local databases only.');
}

const SCALE = Math.max(1, Number(process.env.SEED_SCALE || 1));
const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

// ---------------------------------------------------------------------------
// Deterministic helpers
// ---------------------------------------------------------------------------
function uuid(...parts: Array<string | number>): string {
  const h = createHash('sha256').update(`automotive-os-qa|${parts.join('|')}`).digest('hex');
  // RFC 4122 shape (version 4 nibble, variant bits) so UUID validators accept it.
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${((parseInt(h[16], 16) & 0x3) | 0x8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

let rngState = 0x9e3779b9;
function rand(): number {
  // mulberry32
  rngState |= 0;
  rngState = (rngState + 0x6d2b79f5) | 0;
  let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const randInt = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
function weighted<T>(entries: Array<[T, number]>): T {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [v, w] of entries) {
    r -= w;
    if (r <= 0) return v;
  }
  return entries[entries.length - 1][0];
}
const NOW = new Date('2026-10-31T08:00:00Z');
const daysAgo = (d: number, hourUtc = 6) => new Date(NOW.getTime() - d * 86_400_000 + (hourUtc - 6) * 3_600_000);
const daysAhead = (d: number, hourUtc = 6) => new Date(NOW.getTime() + d * 86_400_000 + (hourUtc - 6) * 3_600_000);
const aed = (amount: number) => BigInt(Math.round(amount) * 100);
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  return new Promise((ok, fail) =>
    scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, key) =>
      err ? fail(err) : ok(`scrypt$16384$8$1$${salt}$${key.toString('hex')}`),
    ),
  );
}
function generatePassword(): string {
  const body = randomBytes(18).toString('base64url').replace(/[-_]/g, 'x');
  return `Qa${body}9!`;
}

// ---------------------------------------------------------------------------
// Catalogue (fictional stock, real make/model names only)
// ---------------------------------------------------------------------------
type Segment = 'budget' | 'mainstream' | 'premium' | 'luxury' | 'exotic' | 'ev';
interface MakeSpec {
  name: string;
  segment: Segment;
  fuel: FuelType;
  models: Array<[string, number, number]>; // name, min AED, max AED (new)
}
const MAKES: MakeSpec[] = [
  { name: 'Toyota', segment: 'mainstream', fuel: FuelType.PETROL, models: [['Land Cruiser', 240000, 420000], ['Camry', 105000, 165000], ['Prado', 165000, 240000], ['Corolla', 72000, 105000], ['Hilux', 95000, 150000], ['RAV4', 115000, 160000]] },
  { name: 'Lexus', segment: 'premium', fuel: FuelType.PETROL, models: [['LX 600', 420000, 620000], ['ES', 165000, 230000], ['RX', 230000, 330000], ['IS', 160000, 210000]] },
  { name: 'Nissan', segment: 'mainstream', fuel: FuelType.PETROL, models: [['Patrol', 210000, 380000], ['Altima', 95000, 140000], ['X-Trail', 110000, 150000], ['Kicks', 68000, 85000]] },
  { name: 'Mitsubishi', segment: 'budget', fuel: FuelType.PETROL, models: [['Pajero', 110000, 150000], ['Montero Sport', 120000, 165000], ['Attrage', 48000, 60000]] },
  { name: 'Honda', segment: 'mainstream', fuel: FuelType.PETROL, models: [['Accord', 110000, 150000], ['Civic', 85000, 120000], ['CR-V', 120000, 165000]] },
  { name: 'Hyundai', segment: 'mainstream', fuel: FuelType.PETROL, models: [['Tucson', 100000, 140000], ['Elantra', 72000, 98000], ['Santa Fe', 130000, 175000], ['Sonata', 95000, 130000]] },
  { name: 'Kia', segment: 'mainstream', fuel: FuelType.PETROL, models: [['Sportage', 95000, 135000], ['Seltos', 72000, 95000], ['Sorento', 130000, 170000], ['K5', 92000, 125000]] },
  { name: 'Chevrolet', segment: 'mainstream', fuel: FuelType.PETROL, models: [['Tahoe', 230000, 330000], ['Silverado', 190000, 280000], ['Captiva', 75000, 95000]] },
  { name: 'Ford', segment: 'mainstream', fuel: FuelType.PETROL, models: [['F-150', 190000, 320000], ['Explorer', 180000, 260000], ['Expedition', 250000, 350000], ['Bronco', 200000, 290000]] },
  { name: 'GMC', segment: 'premium', fuel: FuelType.PETROL, models: [['Yukon', 260000, 390000], ['Sierra', 210000, 320000]] },
  { name: 'Mercedes-Benz', segment: 'luxury', fuel: FuelType.PETROL, models: [['G 63 AMG', 900000, 1250000], ['S 500', 520000, 700000], ['GLE', 330000, 480000], ['E 300', 260000, 340000], ['C 200', 210000, 270000]] },
  { name: 'BMW', segment: 'luxury', fuel: FuelType.PETROL, models: [['X7', 450000, 620000], ['7 Series', 560000, 780000], ['X5', 360000, 500000], ['M4', 420000, 560000], ['5 Series', 300000, 400000]] },
  { name: 'Audi', segment: 'luxury', fuel: FuelType.PETROL, models: [['Q8', 380000, 520000], ['A6', 240000, 330000], ['Q7', 300000, 420000], ['RS 6 Avant', 560000, 700000]] },
  { name: 'Porsche', segment: 'exotic', fuel: FuelType.PETROL, models: [['911', 520000, 1100000], ['Cayenne', 380000, 700000], ['Macan', 300000, 440000], ['Panamera', 450000, 800000], ['Taycan', 420000, 760000]] },
  { name: 'Land Rover', segment: 'luxury', fuel: FuelType.PETROL, models: [['Range Rover', 560000, 950000], ['Range Rover Sport', 420000, 650000], ['Defender', 300000, 520000]] },
  { name: 'Bentley', segment: 'exotic', fuel: FuelType.PETROL, models: [['Bentayga', 950000, 1400000], ['Continental GT', 1000000, 1500000]] },
  { name: 'Rolls-Royce', segment: 'exotic', fuel: FuelType.PETROL, models: [['Cullinan', 1700000, 2600000], ['Ghost', 1500000, 2300000]] },
  { name: 'Lamborghini', segment: 'exotic', fuel: FuelType.PETROL, models: [['Urus', 1100000, 1500000], ['Huracan', 1200000, 1900000]] },
  { name: 'Ferrari', segment: 'exotic', fuel: FuelType.PETROL, models: [['Purosangue', 1900000, 2500000], ['Roma', 1100000, 1500000]] },
  { name: 'Tesla', segment: 'ev', fuel: FuelType.ELECTRIC, models: [['Model Y', 180000, 240000], ['Model 3', 160000, 210000], ['Model X', 380000, 450000]] },
  { name: 'BYD', segment: 'ev', fuel: FuelType.ELECTRIC, models: [['Seal', 150000, 190000], ['Atto 3', 110000, 140000], ['Han', 180000, 220000]] },
  { name: 'MG', segment: 'budget', fuel: FuelType.PETROL, models: [['ZS', 62000, 80000], ['HS', 85000, 110000], ['RX8', 110000, 140000]] },
  { name: 'Jetour', segment: 'budget', fuel: FuelType.PETROL, models: [['T2', 120000, 150000], ['Dashing', 85000, 105000]] },
  { name: 'Chery', segment: 'budget', fuel: FuelType.PETROL, models: [['Tiggo 8 Pro', 95000, 125000], ['Tiggo 7', 72000, 92000]] },
  { name: 'Changan', segment: 'budget', fuel: FuelType.PETROL, models: [['CS75 Plus', 85000, 110000], ['Uni-K', 110000, 140000]] },
  { name: 'Geely', segment: 'budget', fuel: FuelType.PETROL, models: [['Coolray', 65000, 85000], ['Monjaro', 125000, 160000]] },
];
const SEGMENT_MAKES: Record<Segment, string[]> = {
  budget: ['Mitsubishi', 'MG', 'Jetour', 'Chery', 'Changan', 'Geely', 'Nissan', 'Hyundai', 'Kia'],
  mainstream: ['Toyota', 'Nissan', 'Honda', 'Hyundai', 'Kia', 'Chevrolet', 'Ford', 'Mitsubishi'],
  premium: ['Lexus', 'GMC', 'Toyota', 'Nissan', 'Ford', 'Chevrolet', 'BMW', 'Audi'],
  luxury: ['Mercedes-Benz', 'BMW', 'Audi', 'Land Rover', 'Lexus', 'Porsche'],
  exotic: ['Porsche', 'Bentley', 'Rolls-Royce', 'Lamborghini', 'Ferrari', 'Mercedes-Benz', 'Land Rover'],
  ev: ['Tesla', 'BYD', 'Porsche'],
};
const COLORS = ['Pearl White', 'Obsidian Black', 'Silver Metallic', 'Graphite Grey', 'Desert Sand', 'Midnight Blue', 'Burgundy Red', 'Champagne Gold', 'Emerald Green', 'Arctic Grey', 'Guards Red', 'Nardo Grey'];
const TRIMS = ['Standard', 'Limited', 'Platinum', 'GR-Sport', 'Sport', 'Executive', 'Luxury', 'Premium Plus', 'Black Edition', 'Launch Edition', 'VXR', 'SE'];

// ---------------------------------------------------------------------------
// Dealerships (fictional)
// ---------------------------------------------------------------------------
interface BranchSpec { name: string; emirate: string; city: string; address: string; lat: number; lng: number }
interface TenantSpec {
  slug: string;
  legalName: string;
  displayName: string;
  status: TenantStatus;
  verification: VerificationStatus;
  licenseRef?: string;
  jurisdiction?: string;
  licenseExpiry?: string;
  segment: Segment;
  vehicles: number;
  stockPrefix: string;
  roles: MembershipRole[];
  branches: BranchSpec[];
  plan: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  subscription: SubscriptionStatus;
}
const ALL_ROLES: MembershipRole[] = [
  MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.SALES_MANAGER, MembershipRole.SALES_AGENT,
  MembershipRole.SALES_AGENT, MembershipRole.INVENTORY_MANAGER, MembershipRole.SERVICE_ADVISOR,
  MembershipRole.FINANCE_MANAGER, MembershipRole.VIEWER,
];
const SMALL_ROLES: MembershipRole[] = [MembershipRole.OWNER, MembershipRole.SALES_AGENT, MembershipRole.INVENTORY_MANAGER];

const TENANTS: TenantSpec[] = [
  { slug: 'falcon-ridge-motors', legalName: 'Falcon Ridge Motors LLC', displayName: 'Falcon Ridge Motors', status: TenantStatus.ACTIVE, verification: VerificationStatus.APPROVED, licenseRef: 'CN-1180452', jurisdiction: 'Dubai DET', licenseExpiry: '2027-06-30', segment: 'premium', vehicles: 160, stockPrefix: 'FRM', roles: ALL_ROLES, plan: 'ENTERPRISE', subscription: SubscriptionStatus.ACTIVE,
    branches: [
      { name: 'Sheikh Zayed Road Showroom', emirate: 'Dubai', city: 'Dubai', address: 'Sheikh Zayed Rd, Al Quoz 1, Dubai', lat: 25.1601, lng: 55.2325 },
      { name: 'Motor City Hub', emirate: 'Dubai', city: 'Dubai', address: 'Motor City, Dubai', lat: 25.0458, lng: 55.2397 },
      { name: 'Deira Used Car Centre', emirate: 'Dubai', city: 'Dubai', address: 'Al Ittihad Rd, Deira, Dubai', lat: 25.2697, lng: 55.3288 },
    ] },
  { slug: 'corniche-prestige-autos', legalName: 'Corniche Prestige Autos LLC', displayName: 'Corniche Prestige Autos', status: TenantStatus.ACTIVE, verification: VerificationStatus.APPROVED, licenseRef: 'CN-2209871', jurisdiction: 'Abu Dhabi ADDED', licenseExpiry: '2027-03-15', segment: 'luxury', vehicles: 90, stockPrefix: 'CPA', roles: ALL_ROLES, plan: 'GROWTH', subscription: SubscriptionStatus.ACTIVE,
    branches: [
      { name: 'Corniche Flagship', emirate: 'Abu Dhabi', city: 'Abu Dhabi', address: 'Corniche Rd West, Abu Dhabi', lat: 24.4764, lng: 54.3212 },
      { name: 'Mussafah Service & Sales', emirate: 'Abu Dhabi', city: 'Abu Dhabi', address: 'M-9, Mussafah Industrial, Abu Dhabi', lat: 24.3463, lng: 54.5056 },
    ] },
  { slug: 'gulf-crescent-cars', legalName: 'Gulf Crescent Cars FZE', displayName: 'Gulf Crescent Cars', status: TenantStatus.ACTIVE, verification: VerificationStatus.APPROVED, licenseRef: 'SAIF-55812', jurisdiction: 'Sharjah SEDD', licenseExpiry: '2026-12-31', segment: 'mainstream', vehicles: 70, stockPrefix: 'GCC', roles: ALL_ROLES, plan: 'GROWTH', subscription: SubscriptionStatus.ACTIVE,
    branches: [
      { name: 'Al Wahda Street Showroom', emirate: 'Sharjah', city: 'Sharjah', address: 'Al Wahda St, Sharjah', lat: 25.3326, lng: 55.3901 },
      { name: 'Souq Al Haraj Lot 41', emirate: 'Sharjah', city: 'Sharjah', address: 'Souq Al Haraj, Al Ruqa Al Hamra, Sharjah', lat: 25.3066, lng: 55.4652 },
    ] },
  { slug: 'hajar-mountain-motors', legalName: 'Hajar Mountain Motors LLC', displayName: 'Hajar Mountain Motors', status: TenantStatus.ACTIVE, verification: VerificationStatus.APPROVED, licenseRef: 'RAK-77120', jurisdiction: 'RAK DED', licenseExpiry: '2027-09-01', segment: 'mainstream', vehicles: 30, stockPrefix: 'HMM', roles: [MembershipRole.OWNER, MembershipRole.SALES_MANAGER, MembershipRole.SALES_AGENT, MembershipRole.INVENTORY_MANAGER, MembershipRole.VIEWER], plan: 'STARTER', subscription: SubscriptionStatus.ACTIVE,
    branches: [{ name: 'Al Nakheel Showroom', emirate: 'Ras Al Khaimah', city: 'Ras Al Khaimah', address: 'Sheikh Muhammad Bin Salem Rd, Al Nakheel, RAK', lat: 25.7895, lng: 55.9432 }] },
  { slug: 'desert-oasis-automotive', legalName: 'Desert Oasis Automotive LLC', displayName: 'Desert Oasis Automotive', status: TenantStatus.ACTIVE, verification: VerificationStatus.APPROVED, licenseRef: 'CN-3301190', jurisdiction: 'Abu Dhabi ADDED', licenseExpiry: '2028-01-31', segment: 'mainstream', vehicles: 45, stockPrefix: 'DOA', roles: ALL_ROLES, plan: 'GROWTH', subscription: SubscriptionStatus.ACTIVE,
    branches: [{ name: 'Al Ain Sanaiya Showroom', emirate: 'Abu Dhabi', city: 'Al Ain', address: 'Sanaiya Industrial Area, Al Ain', lat: 24.1931, lng: 55.7266 }] },
  { slug: 'pearl-coast-auto-trading', legalName: 'Pearl Coast Auto Trading LLC', displayName: 'Pearl Coast Auto Trading', status: TenantStatus.ACTIVE, verification: VerificationStatus.APPROVED, licenseRef: 'AJM-41009', jurisdiction: 'Ajman DED', licenseExpiry: '2027-05-20', segment: 'budget', vehicles: 25, stockPrefix: 'PCA', roles: SMALL_ROLES, plan: 'STARTER', subscription: SubscriptionStatus.ACTIVE,
    branches: [{ name: 'Ajman Industrial 2 Yard', emirate: 'Ajman', city: 'Ajman', address: 'Industrial Area 2, Ajman', lat: 25.3920, lng: 55.4660 }] },
  { slug: 'fujairah-harbour-cars', legalName: 'Fujairah Harbour Cars LLC', displayName: 'Fujairah Harbour Cars', status: TenantStatus.ACTIVE, verification: VerificationStatus.APPROVED, licenseRef: 'FUJ-19022', jurisdiction: 'Fujairah Municipality', licenseExpiry: '2027-02-28', segment: 'mainstream', vehicles: 20, stockPrefix: 'FHC', roles: SMALL_ROLES, plan: 'STARTER', subscription: SubscriptionStatus.TRIALING,
    branches: [{ name: 'Hamad Bin Abdullah Rd Showroom', emirate: 'Fujairah', city: 'Fujairah', address: 'Hamad Bin Abdullah Rd, Fujairah', lat: 25.1288, lng: 56.3265 }] },
  { slug: 'zayed-avenue-ev-hub', legalName: 'Zayed Avenue EV Hub LLC', displayName: 'Zayed Avenue EV Hub', status: TenantStatus.ACTIVE, verification: VerificationStatus.APPROVED, licenseRef: 'CN-4410233', jurisdiction: 'Abu Dhabi ADDED', licenseExpiry: '2027-11-30', segment: 'ev', vehicles: 40, stockPrefix: 'ZEV', roles: ALL_ROLES, plan: 'GROWTH', subscription: SubscriptionStatus.ACTIVE,
    branches: [{ name: 'Yas Mall EV Lounge', emirate: 'Abu Dhabi', city: 'Abu Dhabi', address: 'Yas Island, Abu Dhabi', lat: 24.4886, lng: 54.6080 }] },
  { slug: 'marina-luxury-collection', legalName: 'Marina Luxury Collection FZ-LLC', displayName: 'Marina Luxury Collection', status: TenantStatus.ACTIVE, verification: VerificationStatus.APPROVED, licenseRef: 'DMCC-98811', jurisdiction: 'Dubai DMCC', licenseExpiry: '2027-08-15', segment: 'exotic', vehicles: 35, stockPrefix: 'MLC', roles: ALL_ROLES, plan: 'GROWTH', subscription: SubscriptionStatus.ACTIVE,
    branches: [{ name: 'Dubai Marina Gallery', emirate: 'Dubai', city: 'Dubai', address: 'Marina Walk, Dubai Marina, Dubai', lat: 25.0772, lng: 55.1397 }] },
  { slug: 'al-qusais-budget-cars', legalName: 'Al Qusais Budget Cars LLC', displayName: 'Al Qusais Budget Cars', status: TenantStatus.ACTIVE, verification: VerificationStatus.APPROVED, licenseRef: 'CN-5520944', jurisdiction: 'Dubai DET', licenseExpiry: '2026-11-15', segment: 'budget', vehicles: 80, stockPrefix: 'AQB', roles: ALL_ROLES, plan: 'GROWTH', subscription: SubscriptionStatus.PAST_DUE,
    branches: [
      { name: 'Al Qusais Industrial 4', emirate: 'Dubai', city: 'Dubai', address: 'Al Qusais Industrial Area 4, Dubai', lat: 25.2897, lng: 55.3929 },
      { name: 'Ras Al Khor Auto Zone', emirate: 'Dubai', city: 'Dubai', address: 'Ras Al Khor Industrial 3, Dubai', lat: 25.1749, lng: 55.3617 },
    ] },
  { slug: 'uaq-family-motors', legalName: 'Umm Al Quwain Family Motors LLC', displayName: 'UAQ Family Motors', status: TenantStatus.ACTIVE, verification: VerificationStatus.IN_REVIEW, licenseRef: 'UAQ-30011', jurisdiction: 'UAQ DED', licenseExpiry: '2027-04-10', segment: 'budget', vehicles: 12, stockPrefix: 'UFM', roles: SMALL_ROLES, plan: 'STARTER', subscription: SubscriptionStatus.TRIALING,
    branches: [{ name: 'King Faisal Street Lot', emirate: 'Umm Al Quwain', city: 'Umm Al Quwain', address: 'King Faisal St, Umm Al Quwain', lat: 25.5647, lng: 55.5553 }] },
  { slug: 'sandstorm-autos', legalName: 'Sandstorm Autos LLC', displayName: 'Sandstorm Autos', status: TenantStatus.SUSPENDED, verification: VerificationStatus.APPROVED, licenseRef: 'SAIF-60277', jurisdiction: 'Sharjah SEDD', licenseExpiry: '2027-01-31', segment: 'budget', vehicles: 20, stockPrefix: 'SSA', roles: [MembershipRole.OWNER, MembershipRole.SALES_AGENT], plan: 'STARTER', subscription: SubscriptionStatus.SUSPENDED,
    branches: [{ name: 'Industrial Area 10 Lot', emirate: 'Sharjah', city: 'Sharjah', address: 'Industrial Area 10, Sharjah', lat: 25.3100, lng: 55.4200 }] },
  { slug: 'dune-gate-motors', legalName: 'Dune Gate Motors LLC', displayName: 'Dune Gate Motors', status: TenantStatus.PENDING, verification: VerificationStatus.NOT_SUBMITTED, segment: 'mainstream', vehicles: 0, stockPrefix: 'DGM', roles: [], plan: 'STARTER', subscription: SubscriptionStatus.TRIALING,
    branches: [{ name: 'Jebel Ali Showroom (planned)', emirate: 'Dubai', city: 'Dubai', address: 'Jebel Ali Industrial 1, Dubai', lat: 25.0150, lng: 55.1150 }] },
  { slug: 'iron-anchor-motors', legalName: 'Iron Anchor Motors LLC', displayName: 'Iron Anchor Motors', status: TenantStatus.CLOSED, verification: VerificationStatus.EXPIRED, licenseRef: 'CN-0099812', jurisdiction: 'Dubai DET', licenseExpiry: '2025-12-31', segment: 'mainstream', vehicles: 10, stockPrefix: 'IAM', roles: [MembershipRole.OWNER], plan: 'STARTER', subscription: SubscriptionStatus.CANCELED,
    branches: [{ name: 'Al Awir Lot (closed)', emirate: 'Dubai', city: 'Dubai', address: 'Al Awir Used Car Complex, Dubai', lat: 25.1845, lng: 55.5050 }] },
];

// ---------------------------------------------------------------------------
// People (fictional)
// ---------------------------------------------------------------------------
const FIRST = ['Khalid', 'Maryam', 'Omar', 'Noura', 'Saeed', 'Hessa', 'Hamdan', 'Latifa', 'Yousef', 'Shamma', 'Rashid', 'Amna', 'Faisal', 'Alia', 'Majid', 'Reem', 'Ahmed', 'Salama', 'Ali', 'Fatima', 'Priya', 'Arjun', 'Neha', 'Imran', 'Ayesha', 'Daniel', 'Sophie', 'Mohammed', 'Zainab', 'Tariq', 'Layla', 'Hassan', 'Mariam', 'Bilal', 'Sara', 'Kareem', 'Dina', 'Nasser', 'Huda', 'Samir'];
const LAST = ['Al Mansoori', 'Al Shamsi', 'Al Suwaidi', 'Al Ketbi', 'Al Marri', 'Al Zaabi', 'Al Dhaheri', 'Al Ameri', 'Al Hammadi', 'Al Balushi', 'Sharma', 'Nair', 'Khan', 'Siddiqui', 'Hughes', 'Martin', 'Haddad', 'Khoury', 'Rahman', 'Qureshi', 'Mahmoud', 'Farouk', 'Obeid', 'Saleh'];
function personName(seed: string): string {
  const h = createHash('md5').update(seed).digest();
  return `${FIRST[h[0] % FIRST.length]} ${LAST[h[1] % LAST.length]}`;
}
let phoneCounter = 0;
const nextPhone = () => `+9715${String(20000000 + ++phoneCounter).padStart(8, '0')}`;

interface SeedUser {
  id: string;
  email: string;
  displayName: string;
  status?: UserStatus;
  isPlatformAdmin?: boolean;
  emailVerified?: boolean;
  lockedUntil?: Date | null;
  failedLoginAttempts?: number;
  memberships?: Array<{ tenantSlug: string; role: MembershipRole; active?: boolean }>;
  buyer?: Partial<Prisma.BuyerProfileCreateWithoutUserInput>;
  withPassword?: boolean; // default true
  note: string;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const started = Date.now();
  const password = process.env.SEED_PASSWORD || generatePassword();
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/.test(password)) {
    throw new Error('[seed-scale] SEED_PASSWORD must be 10+ chars with upper, lower, digit and symbol.');
  }
  console.log(`[seed-scale] scale=${SCALE} target=${databaseUrl!.replace(/\/\/[^@]+@/, '//<credentials>@')}`);

  // 1. Catalogue --------------------------------------------------------------
  const makeIds = new Map<string, string>();
  const modelIds = new Map<string, { id: string; min: number; max: number }>();
  for (const m of MAKES) {
    const makeId = uuid('make', m.name);
    const existing = await prisma.make.findUnique({ where: { slug: slugify(m.name) } });
    const make = existing ?? (await prisma.make.create({ data: { id: makeId, name: m.name, slug: slugify(m.name) } }));
    makeIds.set(m.name, make.id);
    for (const [model, min, max] of m.models) {
      const slug = slugify(model);
      const row = await prisma.carModel.upsert({
        where: { makeId_slug: { makeId: make.id, slug } },
        update: {},
        create: { id: uuid('model', m.name, model), makeId: make.id, name: model, slug },
      });
      modelIds.set(`${m.name}|${model}`, { id: row.id, min, max });
    }
  }
  console.log(`[seed-scale] catalogue: ${makeIds.size} makes, ${modelIds.size} models`);

  // 2. Subscription plans -----------------------------------------------------
  const PLANS = [
    { code: 'STARTER', title: 'Starter', fee: 1500, limit: 25 },
    { code: 'GROWTH', title: 'Growth', fee: 4500, limit: 150 },
    { code: 'ENTERPRISE', title: 'Enterprise', fee: 12000, limit: 1000 },
  ];
  const planIds = new Map<string, string>();
  for (const p of PLANS) {
    const row = await prisma.subscriptionPlan.upsert({
      where: { code: p.code },
      update: { title: p.title, monthlyFeeFils: aed(p.fee), listingLimit: p.limit, active: true },
      create: { id: uuid('plan', p.code), code: p.code, title: p.title, monthlyFeeFils: aed(p.fee), listingLimit: p.limit },
    });
    planIds.set(p.code, row.id);
  }

  // 3. Tenants, branches, verification, subscriptions -------------------------
  const tenantIds = new Map<string, string>();
  const branchIds = new Map<string, string[]>();
  for (const t of TENANTS) {
    const id = uuid('tenant', t.slug);
    await prisma.tenant.upsert({
      where: { slug: t.slug },
      update: { status: t.status, legalName: t.legalName, displayName: t.displayName },
      create: { id, slug: t.slug, legalName: t.legalName, displayName: t.displayName, status: t.status, currency: 'AED' },
    });
    const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: t.slug } });
    tenantIds.set(t.slug, tenant.id);
    await prisma.dealerVerification.upsert({
      where: { tenantId: tenant.id },
      update: { status: t.verification },
      create: {
        tenantId: tenant.id,
        status: t.verification,
        tradeLicenseRef: t.licenseRef ?? null,
        licenseExpiry: t.licenseExpiry ? new Date(t.licenseExpiry) : null,
        jurisdiction: t.jurisdiction ?? null,
        reviewNotes:
          t.verification === VerificationStatus.APPROVED
            ? 'Trade licence and Emirates ID of the authorised signatory checked against the submitted scans.'
            : t.verification === VerificationStatus.IN_REVIEW
              ? 'Documents received; awaiting compliance officer review.'
              : t.verification === VerificationStatus.EXPIRED
                ? 'Trade licence expired; dealership closed.'
                : null,
        reviewedAt: t.verification === VerificationStatus.APPROVED ? daysAgo(randInt(30, 400)) : null,
      },
    });
    const ids: string[] = [];
    for (const [i, b] of t.branches.entries()) {
      const bid = uuid('branch', t.slug, i);
      await prisma.branch.upsert({
        where: { id: bid },
        update: {},
        create: { id: bid, tenantId: tenant.id, name: b.name, emirate: b.emirate, city: b.city, address: b.address, latitude: new Prisma.Decimal(b.lat), longitude: new Prisma.Decimal(b.lng), isActive: t.status !== TenantStatus.CLOSED },
      });
      ids.push(bid);
    }
    branchIds.set(t.slug, ids);
    await prisma.subscription.upsert({
      where: { id: uuid('subscription', t.slug) },
      update: { status: t.subscription },
      create: {
        id: uuid('subscription', t.slug),
        tenantId: tenant.id,
        planId: planIds.get(t.plan)!,
        status: t.subscription,
        startsAt: daysAgo(randInt(40, 700)),
        endsAt: t.subscription === SubscriptionStatus.CANCELED ? daysAgo(20) : null,
        paymentProviderRef: t.subscription === SubscriptionStatus.TRIALING ? null : `manual-wire-${t.stockPrefix.toLowerCase()}-2026`,
      },
    });
  }
  console.log(`[seed-scale] tenants: ${tenantIds.size}`);

  // 4. Users ------------------------------------------------------------------
  const users: SeedUser[] = [];
  const staffByTenant = new Map<string, Array<{ userId: string; role: MembershipRole; membershipId: string }>>();

  for (const t of TENANTS) {
    const seen: Record<string, number> = {};
    for (const role of t.roles) {
      seen[role] = (seen[role] ?? 0) + 1;
      const key = `${t.slug}|${role}|${seen[role]}`;
      const name = personName(key);
      const local = slugify(name).replace(/-/g, '.') + (seen[role] > 1 ? seen[role] : '');
      users.push({
        id: uuid('user', key),
        email: `${local}@${t.slug}.example`,
        displayName: name,
        memberships: [{ tenantSlug: t.slug, role }],
        note: `${t.displayName} ${role}`,
      });
    }
  }
  // Multi-tenant staff: OWNER at Falcon Ridge and VIEWER at Marina Luxury.
  users.push({ id: uuid('user', 'multi-tenant'), email: 'group.director@falcon-ridge-motors.example', displayName: 'Hamdan Al Ketbi', memberships: [{ tenantSlug: 'falcon-ridge-motors', role: MembershipRole.OWNER }, { tenantSlug: 'marina-luxury-collection', role: MembershipRole.VIEWER }], note: 'Two memberships; dealer console must pick the first active one (Falcon Ridge OWNER)' });
  users.push({ id: uuid('user', 'inactive-membership'), email: 'former.agent@falcon-ridge-motors.example', displayName: 'Bilal Qureshi', memberships: [{ tenantSlug: 'falcon-ridge-motors', role: MembershipRole.SALES_AGENT, active: false }], note: 'Membership inactive -> MEMBERSHIP_INACTIVE / no dealer access' });
  users.push({ id: uuid('user', 'suspended-staff'), email: 'suspended.manager@corniche-prestige-autos.example', displayName: 'Dina Haddad', status: UserStatus.SUSPENDED, memberships: [{ tenantSlug: 'corniche-prestige-autos', role: MembershipRole.SALES_MANAGER }], note: 'User SUSPENDED -> login 403 ACCOUNT_SUSPENDED' });
  users.push({ id: uuid('user', 'disabled-staff'), email: 'disabled.viewer@gulf-crescent-cars.example', displayName: 'Samir Obeid', status: UserStatus.DISABLED, memberships: [{ tenantSlug: 'gulf-crescent-cars', role: MembershipRole.VIEWER }], note: 'User DISABLED -> login 403 ACCOUNT_DISABLED' });
  users.push({ id: uuid('user', 'no-password-staff'), email: 'sso.only@zayed-avenue-ev-hub.example', displayName: 'Sophie Martin', withPassword: false, memberships: [{ tenantSlug: 'zayed-avenue-ev-hub', role: MembershipRole.FINANCE_MANAGER }], note: 'No password set -> login 401 generic' });

  // Platform admins
  users.push({ id: uuid('user', 'admin-ops'), email: 'ops.admin@automotive-os.example', displayName: 'Noura Al Suwaidi', isPlatformAdmin: true, note: 'Primary platform admin' });
  users.push({ id: uuid('user', 'admin-second'), email: 'compliance.officer@automotive-os.example', displayName: 'Faisal Al Marri', isPlatformAdmin: true, note: 'Second platform admin (last-admin protection tests)' });
  users.push({ id: uuid('user', 'admin-suspended'), email: 'ops.suspended@automotive-os.example', displayName: 'Kareem Saleh', isPlatformAdmin: true, status: UserStatus.SUSPENDED, note: 'Suspended platform admin -> must not pass admin gate' });
  users.push({ id: uuid('user', 'admin-pending'), email: 'ops.invited@automotive-os.example', displayName: 'Platform Administrator', isPlatformAdmin: false, status: UserStatus.PENDING_VERIFICATION, emailVerified: false, withPassword: false, note: 'Invited admin, activation pending' });

  // Buyers
  const buyerCount = 60 * SCALE;
  const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];
  for (let i = 1; i <= buyerCount; i++) {
    const key = `buyer|${i}`;
    const name = personName(key);
    const budgetMin = pick([40000, 60000, 90000, 150000, 250000, 400000, 800000]);
    users.push({
      id: uuid('user', key),
      email: `${slugify(name).replace(/-/g, '.')}${i}@buyers.example`,
      displayName: name,
      buyer: {
        preferredLanguage: rand() < 0.35 ? 'ar' : 'en',
        preferredEmirate: pick(EMIRATES),
        budgetMinFils: aed(budgetMin),
        budgetMaxFils: aed(budgetMin * pick([1.5, 2, 3])),
        preferredMakes: [pick(MAKES).name, pick(MAKES).name].filter((v, idx, a) => a.indexOf(v) === idx),
        pdplConsentAt: rand() < 0.8 ? daysAgo(randInt(1, 300)) : null,
        marketingConsentAt: rand() < 0.3 ? daysAgo(randInt(1, 300)) : null,
        whatsappCommsConsent: rand() < 0.2,
        aecbRefreshConsent: false,
        corporateAffiliation: rand() < 0.1 ? 'Fleet procurement — fictional corporate account' : null,
        garageVisibility: rand() < 0.9,
      },
      note: 'Buyer',
    });
  }
  // Buyer edge cases
  users.push({ id: uuid('user', 'buyer-unverified'), email: 'unverified.buyer@buyers.example', displayName: 'Layla Farouk', status: UserStatus.PENDING_VERIFICATION, emailVerified: false, buyer: { preferredLanguage: 'en' }, note: 'Email not verified -> login 403 EMAIL_NOT_VERIFIED' });
  users.push({ id: uuid('user', 'buyer-locked'), email: 'locked.buyer@buyers.example', displayName: 'Nasser Rahman', lockedUntil: new Date(Date.now() + 86_400_000), failedLoginAttempts: 0, buyer: { preferredLanguage: 'ar' }, note: 'Locked until tomorrow -> login 401 generic' });
  users.push({ id: uuid('user', 'buyer-suspended'), email: 'suspended.buyer@buyers.example', displayName: 'Huda Mahmoud', status: UserStatus.SUSPENDED, buyer: { preferredLanguage: 'en' }, note: 'Suspended buyer -> login 403 ACCOUNT_SUSPENDED; /access-suspended' });
  users.push({ id: uuid('user', 'buyer-no-profile'), email: 'no.profile@buyers.example', displayName: 'Daniel Hughes', note: 'Buyer without BuyerProfile row (profile page must create/handle)' });

  console.log(`[seed-scale] hashing passwords for ${users.length} users…`);
  for (const u of users) {
    const passwordHash = u.withPassword === false ? null : await hashPassword(password);
    const emailVerifiedAt = u.emailVerified === false ? null : daysAgo(randInt(2, 400));
    await prisma.user.upsert({
      where: { id: u.id },
      update: { passwordHash, status: u.status ?? UserStatus.ACTIVE, isPlatformAdmin: u.isPlatformAdmin ?? false, lockedUntil: u.lockedUntil ?? null, emailVerifiedAt, displayName: u.displayName },
      create: {
        id: u.id,
        identitySubject: `local:${u.id}`,
        email: u.email,
        phoneE164: nextPhone(),
        displayName: u.displayName,
        isPlatformAdmin: u.isPlatformAdmin ?? false,
        status: u.status ?? UserStatus.ACTIVE,
        passwordHash,
        emailVerifiedAt,
        lockedUntil: u.lockedUntil ?? null,
        failedLoginAttempts: u.failedLoginAttempts ?? 0,
        ...(u.buyer ? { buyer: { create: u.buyer as Prisma.BuyerProfileCreateWithoutUserInput } } : {}),
      },
    });
    for (const m of u.memberships ?? []) {
      const tenantId = tenantIds.get(m.tenantSlug)!;
      const row = await prisma.membership.upsert({
        where: { tenantId_userId: { tenantId, userId: u.id } },
        update: { role: m.role, active: m.active ?? true },
        create: { id: uuid('membership', m.tenantSlug, u.id), tenantId, userId: u.id, role: m.role, active: m.active ?? true },
      });
      if (row.active && (u.status ?? UserStatus.ACTIVE) === UserStatus.ACTIVE) {
        const list = staffByTenant.get(m.tenantSlug) ?? [];
        list.push({ userId: u.id, role: m.role, membershipId: row.id });
        staffByTenant.set(m.tenantSlug, list);
      }
    }
  }
  // Baseline seed accounts get the same password so they are usable too.
  const baselineEmails = ['tariq@alfuttaim-prestige.ae', 'zayd@gargash-autos.ae', 'rashid.buyer@example.ae', 'fatima.buyer@example.ae', 'admin@autonexa.ae'];
  for (const email of baselineEmails) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) await prisma.user.update({ where: { id: u.id }, data: { passwordHash: await hashPassword(password), emailVerifiedAt: u.emailVerifiedAt ?? daysAgo(30), status: UserStatus.ACTIVE } });
  }
  const buyerIds = users.filter((u) => u.buyer && (u.status ?? UserStatus.ACTIVE) === UserStatus.ACTIVE && u.emailVerified !== false && !u.lockedUntil).map((u) => u.id);
  console.log(`[seed-scale] users: ${users.length} (buyers usable for leads: ${buyerIds.length})`);

  // 5. Vehicles, media, listings ---------------------------------------------
  type VehicleRow = Prisma.VehicleCreateManyInput;
  type MediaRow = Prisma.VehicleMediaCreateManyInput;
  type ListingRow = Prisma.ListingCreateManyInput;
  const vehicles: VehicleRow[] = [];
  const media: MediaRow[] = [];
  const listings: ListingRow[] = [];
  const listingMeta: Array<{ id: string; tenantSlug: string; status: ListingStatus; publishedAt: Date | null }> = [];
  const usedSlugs = new Set<string>();
  const VIN_CHARS = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  const vin = (seed: string) => {
    const h = createHash('sha256').update(seed).digest();
    let out = '';
    for (let i = 0; i < 17; i++) out += VIN_CHARS[h[i] % VIN_CHARS.length];
    return out;
  };

  for (const t of TENANTS) {
    const tenantId = tenantIds.get(t.slug)!;
    const branches = branchIds.get(t.slug)!;
    const count = Math.round(t.vehicles * SCALE);
    for (let n = 1; n <= count; n++) {
      const makeName = pick(SEGMENT_MAKES[t.segment]);
      const spec = MAKES.find((m) => m.name === makeName)!;
      const [modelName] = pick(spec.models);
      const model = modelIds.get(`${makeName}|${modelName}`)!;
      const condition = weighted<VehicleCondition>([[VehicleCondition.NEW, t.segment === 'budget' ? 15 : 40], [VehicleCondition.USED, 45], [VehicleCondition.CERTIFIED_USED, 15]]);
      const modelYear = condition === VehicleCondition.NEW ? randInt(2025, 2026) : randInt(2016, 2025);
      const age = 2026 - modelYear;
      const newPrice = randInt(model.min, model.max);
      const depreciation = condition === VehicleCondition.NEW ? 1 : Math.max(0.3, 1 - 0.12 * age - rand() * 0.08);
      const askingAed = Math.round((newPrice * depreciation) / 500) * 500;
      const stockStatus =
        t.status === TenantStatus.CLOSED
          ? StockStatus.ARCHIVED
          : weighted<StockStatus>([[StockStatus.AVAILABLE, 60], [StockStatus.RESERVED, 8], [StockStatus.SOLD, 20], [StockStatus.INTAKE, 7], [StockStatus.TRANSFERRED, 2], [StockStatus.ARCHIVED, 3]]);
      const id = uuid('vehicle', t.slug, n);
      const stockNumber = `${t.stockPrefix}-${modelYear}-${String(n).padStart(4, '0')}`;
      const fuel = spec.fuel === FuelType.ELECTRIC ? FuelType.ELECTRIC : weighted<FuelType>([[FuelType.PETROL, 85], [FuelType.HYBRID, 10], [FuelType.DIESEL, 5]]);
      vehicles.push({
        id,
        tenantId,
        branchId: pick(branches),
        makeId: makeIds.get(makeName)!,
        modelId: model.id,
        vin: stockStatus === StockStatus.INTAKE && rand() < 0.3 ? null : vin(`${t.slug}|${n}`),
        stockNumber,
        trim: `${pick(TRIMS)}${rand() < 0.2 ? ' ' + pick(['V6', 'V8', '2.5L', '3.5L', 'Twin-Turbo', 'Long Range']) : ''}`,
        modelYear,
        condition,
        mileageKm: condition === VehicleCondition.NEW ? randInt(0, 300) : randInt(8000, 180000),
        colorExterior: pick(COLORS),
        fuel,
        transmission: rand() < 0.95 ? Transmission.AUTOMATIC : Transmission.MANUAL,
        gccSpec: rand() < 0.85,
        firstRegistered: condition === VehicleCondition.NEW ? null : new Date(`${modelYear}-${String(randInt(1, 12)).padStart(2, '0')}-15`),
        purchaseCostFils: aed(askingAed * (0.84 + rand() * 0.09)),
        askingPriceFils: aed(askingAed),
        stockStatus,
        createdAt: daysAgo(randInt(1, 400)),
        updatedAt: daysAgo(randInt(0, 30)),
      });

      // media
      if (stockStatus !== StockStatus.INTAKE || rand() < 0.4) {
        const photos = randInt(1, 4);
        for (let p = 1; p <= photos; p++) {
          media.push({
            id: uuid('media', id, p),
            tenantId,
            vehicleId: id,
            kind: p === 1 ? MediaKind.EXTERIOR : weighted<MediaKind>([[MediaKind.EXTERIOR, 60], [MediaKind.INTERIOR, 40]]),
            objectKey: `vehicles/${t.slug}/${stockNumber.toLowerCase()}/photo-${p}.jpg`,
            altText: `${modelYear} ${makeName} ${modelName} ${p === 1 ? 'front three-quarter view' : 'detail view'}`,
            sortOrder: p,
            isPublic: true,
          });
        }
        if (rand() < 0.3) {
          media.push({ id: uuid('media', id, 'doc'), tenantId, vehicleId: id, kind: MediaKind.DOCUMENT, objectKey: `vehicles/${t.slug}/${stockNumber.toLowerCase()}/purchase-invoice.pdf`, altText: 'Supplier purchase invoice (private)', sortOrder: 99, isPublic: false });
        }
      }

      // listing
      let listingStatus: ListingStatus | null = null;
      if (t.status === TenantStatus.SUSPENDED) listingStatus = stockStatus === StockStatus.AVAILABLE ? ListingStatus.PAUSED : null;
      else if (t.status === TenantStatus.CLOSED) listingStatus = ListingStatus.ARCHIVED;
      else if (stockStatus === StockStatus.AVAILABLE) listingStatus = weighted<ListingStatus>([[ListingStatus.PUBLISHED, 72], [ListingStatus.PENDING_REVIEW, 10], [ListingStatus.DRAFT, 8], [ListingStatus.REJECTED, 5], [ListingStatus.PAUSED, 5]]);
      else if (stockStatus === StockStatus.RESERVED) listingStatus = rand() < 0.5 ? ListingStatus.PUBLISHED : ListingStatus.PAUSED;
      else if (stockStatus === StockStatus.SOLD) listingStatus = rand() < 0.8 ? ListingStatus.SOLD : null;
      else if (stockStatus === StockStatus.ARCHIVED) listingStatus = ListingStatus.ARCHIVED;
      else if (stockStatus === StockStatus.INTAKE) listingStatus = rand() < 0.5 ? ListingStatus.DRAFT : null;
      // TRAP-01: one PUBLISHED listing left on a SOLD vehicle (integrity scenario).
      if (t.slug === 'falcon-ridge-motors' && n === 7) {
        vehicles[vehicles.length - 1].stockStatus = StockStatus.SOLD;
        listingStatus = ListingStatus.PUBLISHED;
      }
      if (listingStatus) {
        const emirate = t.branches[0].emirate;
        let slug = slugify(`${modelYear} ${makeName} ${modelName} ${emirate} ${t.stockPrefix}${n}`);
        while (usedSlugs.has(slug)) slug = `${slug}-x`;
        usedSlugs.add(slug);
        const publishedAt = listingStatus === ListingStatus.PUBLISHED || listingStatus === ListingStatus.SOLD || listingStatus === ListingStatus.PAUSED ? daysAgo(randInt(1, 120)) : null;
        const lid = uuid('listing', id);
        listings.push({
          id: lid,
          tenantId,
          vehicleId: id,
          slug,
          title: `${modelYear} ${makeName} ${modelName} ${vehicles[vehicles.length - 1].trim}`,
          description:
            condition === VehicleCondition.NEW
              ? `Brand new ${modelYear} ${makeName} ${modelName} in ${vehicles[vehicles.length - 1].colorExterior}. ${vehicles[vehicles.length - 1].gccSpec ? 'Full GCC specification with manufacturer warranty.' : 'Imported specification; warranty on request.'} Finance and trade-in welcome.`
              : `Well-kept ${modelYear} ${makeName} ${modelName}, ${vehicles[vehicles.length - 1].mileageKm?.toLocaleString('en-US')} km, ${vehicles[vehicles.length - 1].colorExterior}. ${condition === VehicleCondition.CERTIFIED_USED ? 'Dealer certified with 150-point inspection and 12-month warranty.' : 'Service history available at the showroom.'}`,
          askingPriceFils: aed(askingAed),
          status: listingStatus,
          qualityScore: listingStatus === ListingStatus.REJECTED ? randInt(20, 55) : randInt(60, 99),
          verifiedAt: listingStatus === ListingStatus.DRAFT || listingStatus === ListingStatus.PENDING_REVIEW ? null : daysAgo(randInt(1, 150)),
          publishedAt,
          createdAt: daysAgo(randInt(1, 160)),
          updatedAt: daysAgo(randInt(0, 20)),
        });
        listingMeta.push({ id: lid, tenantSlug: t.slug, status: listingStatus, publishedAt });
      }
    }
  }
  // Edge rows on Falcon Ridge: lowest and highest prices in the market.
  {
    const t = TENANTS[0];
    const tenantId = tenantIds.get(t.slug)!;
    const cheap = modelIds.get('Mitsubishi|Attrage')!;
    const dear = modelIds.get('Rolls-Royce|Cullinan')!;
    const edge: Array<[string, string, string, number, string]> = [
      ['edge-min', 'Mitsubishi', 'Attrage', 9500, 'Trade-in special: 2016 Attrage, sold as seen'],
      ['edge-max', 'Rolls-Royce', 'Cullinan', 2850000, 'Bespoke 2026 Cullinan Black Badge, one of one commission'],
    ];
    for (const [key, make, model, price, desc] of edge) {
      const id = uuid('vehicle', t.slug, key);
      const isMax = key === 'edge-max';
      vehicles.push({ id, tenantId, branchId: branchIds.get(t.slug)![0], makeId: makeIds.get(make)!, modelId: (isMax ? dear : cheap).id, vin: vin(key), stockNumber: `FRM-${isMax ? 2026 : 2016}-${key.toUpperCase()}`, trim: isMax ? 'Black Badge' : 'GLX', modelYear: isMax ? 2026 : 2016, condition: isMax ? VehicleCondition.NEW : VehicleCondition.USED, mileageKm: isMax ? 12 : 198000, colorExterior: isMax ? 'Obsidian Black' : 'Silver Metallic', fuel: FuelType.PETROL, transmission: Transmission.AUTOMATIC, gccSpec: true, purchaseCostFils: aed(price * 0.9), askingPriceFils: aed(price), stockStatus: StockStatus.AVAILABLE });
      media.push({ id: uuid('media', id, 1), tenantId, vehicleId: id, kind: MediaKind.EXTERIOR, objectKey: `vehicles/${t.slug}/${key}/photo-1.jpg`, altText: `${make} ${model}`, sortOrder: 1, isPublic: true });
      const lid = uuid('listing', id);
      const slug = `${isMax ? 2026 : 2016}-${slugify(make)}-${slugify(model)}-dubai-${key}`;
      listings.push({ id: lid, tenantId, vehicleId: id, slug, title: `${isMax ? 2026 : 2016} ${make} ${model} ${isMax ? 'Black Badge' : 'GLX'}`, description: desc, askingPriceFils: aed(price), status: ListingStatus.PUBLISHED, qualityScore: isMax ? 99 : 61, verifiedAt: daysAgo(3), publishedAt: daysAgo(2) });
      listingMeta.push({ id: lid, tenantSlug: t.slug, status: ListingStatus.PUBLISHED, publishedAt: daysAgo(2) });
    }
  }
  const vehicleResult = await prisma.vehicle.createMany({ data: vehicles, skipDuplicates: true });
  const mediaResult = await prisma.vehicleMedia.createMany({ data: media, skipDuplicates: true });
  const listingResult = await prisma.listing.createMany({ data: listings, skipDuplicates: true });
  console.log(`[seed-scale] vehicles +${vehicleResult.count}/${vehicles.length}, media +${mediaResult.count}/${media.length}, listings +${listingResult.count}/${listings.length}`);

  // 6. Leads, grants, appointments -------------------------------------------
  const leads: Prisma.LeadCreateManyInput[] = [];
  const grants: Prisma.LeadDataGrantCreateManyInput[] = [];
  const appointments: Prisma.AppointmentCreateManyInput[] = [];
  const leadable = listingMeta.filter((l) => l.status === ListingStatus.PUBLISHED || l.status === ListingStatus.SOLD || l.status === ListingStatus.PAUSED);
  const MESSAGES = [
    'Is this vehicle still available? I would like to see it this weekend.',
    'Can you share the full service history and the number of previous owners?',
    'What is your best price for a cash deal this week?',
    'Do you offer bank finance and what is the indicative monthly instalment?',
    'هل السيارة ما زالت متوفرة؟ أرغب بتجربة القيادة يوم السبت.',
    'هل يمكن إرسال تقرير الفحص الكامل وسجل الصيانة؟',
    'Interested in a trade-in of my 2019 Patrol against this car.',
    'Please call me after 6 pm regarding the GCC spec and warranty.',
  ];
  const leadTarget = Math.round(450 * SCALE);
  for (let i = 1; i <= leadTarget; i++) {
    const l = pick(leadable);
    const tenantId = tenantIds.get(l.tenantSlug)!;
    const buyerUserId = pick(buyerIds);
    const status = weighted<LeadStatus>([[LeadStatus.NEW, 30], [LeadStatus.CONTACTED, 25], [LeadStatus.QUALIFIED, 15], [LeadStatus.TEST_DRIVE_NEGOTIATION, 10], [LeadStatus.WON, 8], [LeadStatus.LOST, 9], [LeadStatus.SPAM, 3]]);
    const intent = weighted<LeadIntent>([[LeadIntent.ENQUIRY, 55], [LeadIntent.TEST_DRIVE, 35], [LeadIntent.OFFER, 10]]);
    const createdAt = daysAgo(randInt(0, 180), randInt(5, 17));
    const staff = (staffByTenant.get(l.tenantSlug) ?? []).filter((s) => s.role === MembershipRole.SALES_AGENT || s.role === MembershipRole.SALES_MANAGER);
    const id = uuid('lead', l.id, buyerUserId, i);
    leads.push({
      id,
      tenantId,
      listingId: l.id,
      buyerUserId,
      status,
      intent,
      preferredContact: weighted<ContactPreference>([[ContactPreference.WHATSAPP, 50], [ContactPreference.PHONE, 35], [ContactPreference.EMAIL, 15]]),
      buyerMessage: rand() < 0.9 ? pick(MESSAGES) : null,
      assignedMembershipId: status !== LeadStatus.NEW && staff.length && rand() < 0.75 ? pick(staff).membershipId : null,
      createdAt,
      updatedAt: createdAt,
    });
    const fields = weighted<string[]>([[['name', 'phone'], 50], [['name', 'phone', 'email'], 30], [['name', 'email'], 15], [['name'], 5]]);
    const revoked = rand() < 0.12;
    grants.push({ id: uuid('grant', id), tenantId, leadId: id, fieldsGranted: fields, purpose: intent === LeadIntent.TEST_DRIVE ? 'vehicle_enquiry_and_test_drive' : 'vehicle_enquiry', consentTextVer: 'buyer-lead-disclosure-en-AE-v1', grantedAt: createdAt, revokedAt: revoked ? new Date(createdAt.getTime() + randInt(1, 20) * 86_400_000) : null });
    if (intent === LeadIntent.TEST_DRIVE && status !== LeadStatus.SPAM && rand() < 0.6) {
      const future = rand() < 0.45;
      const day = future ? daysAhead(randInt(1, 21)) : new Date(createdAt.getTime() + randInt(1, 10) * 86_400_000);
      // Dubai showroom hours 10:00–19:00 local = 06:00–15:00 UTC
      const startsAt = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), randInt(6, 14), pick([0, 30])));
      const endsAt = new Date(startsAt.getTime() + 60 * 60_000);
      const apptStatus = future
        ? weighted<AppointmentStatus>([[AppointmentStatus.REQUESTED, 45], [AppointmentStatus.CONFIRMED, 50], [AppointmentStatus.CANCELLED, 5]])
        : weighted<AppointmentStatus>([[AppointmentStatus.COMPLETED, 60], [AppointmentStatus.NO_SHOW, 15], [AppointmentStatus.CANCELLED, 20], [AppointmentStatus.CONFIRMED, 5]]);
      appointments.push({ id: uuid('appointment', id), tenantId, leadId: id, buyerUserId, startsAt, endsAt, status: apptStatus, note: rand() < 0.5 ? 'Test drive at the showroom; bring Emirates ID and driving licence.' : null, createdAt });
    }
  }
  const leadResult = await prisma.lead.createMany({ data: leads, skipDuplicates: true });
  const grantResult = await prisma.leadDataGrant.createMany({ data: grants, skipDuplicates: true });
  const apptResult = await prisma.appointment.createMany({ data: appointments, skipDuplicates: true });
  console.log(`[seed-scale] leads +${leadResult.count}/${leads.length}, grants +${grantResult.count}, appointments +${apptResult.count}/${appointments.length}`);

  // 7. Favourites and saved searches -----------------------------------------
  const favorites: Prisma.FavoriteCreateManyInput[] = [];
  const favKeys = new Set<string>();
  const published = listingMeta.filter((l) => l.status === ListingStatus.PUBLISHED);
  for (let i = 0; i < 250 * SCALE; i++) {
    const userId = pick(buyerIds);
    const listingId = pick(published).id;
    if (favKeys.has(`${userId}|${listingId}`)) continue;
    favKeys.add(`${userId}|${listingId}`);
    favorites.push({ id: uuid('favorite', userId, listingId), userId, listingId, createdAt: daysAgo(randInt(0, 90)) });
  }
  const searches: Prisma.SavedSearchCreateManyInput[] = [];
  for (let i = 1; i <= 90 * SCALE; i++) {
    const userId = pick(buyerIds);
    const make = pick(MAKES);
    const filter = weighted<Record<string, unknown>>([
      [{ make: slugify(make.name), emirate: pick(EMIRATES), sort: 'recent' }, 40],
      [{ maxPriceFils: pick([8000000, 15000000, 30000000, 60000000]), condition: 'USED', gccSpec: true }, 30],
      [{ q: pick(['Land Cruiser', 'Patrol', 'G 63', 'Range Rover', 'Model Y']), sort: 'price-asc' }, 20],
      [{ dealerSlug: pick(TENANTS.slice(0, 10)).slug }, 10],
    ]);
    searches.push({ id: uuid('saved-search', userId, i), userId, name: `${(filter.make as string) || (filter.q as string) || 'Budget'} watch ${i}`, filterJson: filter as Prisma.InputJsonValue, alertsEnabled: rand() < 0.5, createdAt: daysAgo(randInt(0, 120)) });
  }
  const favResult = await prisma.favorite.createMany({ data: favorites, skipDuplicates: true });
  const ssResult = await prisma.savedSearch.createMany({ data: searches, skipDuplicates: true });
  console.log(`[seed-scale] favourites +${favResult.count}/${favorites.length}, saved searches +${ssResult.count}/${searches.length}`);

  // 8. Invitations -----------------------------------------------------------
  const tokenHash = (s: string) => createHash('sha256').update(`invite|${s}`).digest('hex');
  const inviter = users.find((u) => u.email === 'ops.admin@automotive-os.example')!;
  const invitations: Prisma.UserInvitationCreateManyInput[] = [
    { id: uuid('invite', 'dune-owner'), email: 'owner@dune-gate-motors.example', tokenHash: tokenHash('dune-owner'), tenantId: tenantIds.get('dune-gate-motors')!, role: MembershipRole.OWNER, invitedById: inviter.id, expiresAt: daysAhead(3), createdAt: daysAgo(0) },
    { id: uuid('invite', 'falcon-agent-expired'), email: 'new.agent@falcon-ridge-motors.example', tokenHash: tokenHash('falcon-agent-expired'), tenantId: tenantIds.get('falcon-ridge-motors')!, role: MembershipRole.SALES_AGENT, invitedById: inviter.id, expiresAt: daysAgo(10), createdAt: daysAgo(13) },
    { id: uuid('invite', 'admin-pending'), email: 'ops.invited@automotive-os.example', tokenHash: tokenHash('admin-pending'), isPlatformAdmin: true, invitedById: inviter.id, invitedUserId: uuid('user', 'admin-pending'), expiresAt: daysAhead(2), createdAt: daysAgo(1) },
    { id: uuid('invite', 'corniche-accepted'), email: 'accepted.finance@corniche-prestige-autos.example', tokenHash: tokenHash('corniche-accepted'), tenantId: tenantIds.get('corniche-prestige-autos')!, role: MembershipRole.FINANCE_MANAGER, invitedById: inviter.id, expiresAt: daysAgo(40), acceptedAt: daysAgo(42), createdAt: daysAgo(45) },
  ];
  const invResult = await prisma.userInvitation.createMany({ data: invitations, skipDuplicates: true });
  console.log(`[seed-scale] invitations +${invResult.count}/${invitations.length}`);

  // 9. Audit and outbox history ----------------------------------------------
  const audit: Prisma.AuditEventCreateManyInput[] = [];
  const outbox: Prisma.OutboxEventCreateManyInput[] = [];
  const adminId = inviter.id;
  for (const l of listingMeta) {
    const staff = staffByTenant.get(l.tenantSlug) ?? [];
    const actor = staff.find((s) => s.role === MembershipRole.INVENTORY_MANAGER || s.role === MembershipRole.OWNER)?.userId ?? null;
    const tenantId = tenantIds.get(l.tenantSlug)!;
    if (l.publishedAt) {
      audit.push({ id: uuid('audit', 'publish', l.id), tenantId, actorUserId: actor, action: 'LISTING_PUBLISHED', targetType: 'Listing', targetId: l.id, correlationId: uuid('corr', l.id), metadata: { previousStatus: 'PENDING_REVIEW', newStatus: 'PUBLISHED' }, createdAt: l.publishedAt });
      outbox.push({ id: uuid('outbox', 'publish', l.id), tenantId, aggregateType: 'listing', aggregateId: l.id, eventType: 'listing.published', payload: { listingId: l.id, tenantId }, status: weighted<OutboxStatus>([[OutboxStatus.SENT, 85], [OutboxStatus.PENDING, 8], [OutboxStatus.FAILED, 5], [OutboxStatus.PROCESSING, 2]]), attempts: randInt(1, 4), occurredAt: l.publishedAt, processedAt: rand() < 0.85 ? new Date(l.publishedAt.getTime() + 2000) : null });
    }
    if (l.status === ListingStatus.SOLD) {
      audit.push({ id: uuid('audit', 'sold', l.id), tenantId, actorUserId: actor, action: 'VEHICLE_STOCK_STATUS_CHANGED', targetType: 'Vehicle', targetId: l.id, metadata: { previousStatus: 'AVAILABLE', newStatus: 'SOLD', listingUnpublished: true }, createdAt: daysAgo(randInt(0, 60)) });
    }
  }
  for (const lead of leads.slice(0, Math.round(leads.length * 0.6))) {
    audit.push({ id: uuid('audit', 'lead', lead.id), tenantId: lead.tenantId, actorUserId: null, action: 'LEAD_CREATED', targetType: 'Lead', targetId: lead.id, metadata: { intent: lead.intent, source: 'marketplace' }, createdAt: lead.createdAt as Date });
    if (lead.status !== LeadStatus.NEW) {
      audit.push({ id: uuid('audit', 'lead-status', lead.id), tenantId: lead.tenantId, actorUserId: (staffByTenant.get(TENANTS.find((t) => tenantIds.get(t.slug) === lead.tenantId)!.slug) ?? [])[0]?.userId ?? null, action: 'LEAD_STATUS_CHANGED', targetType: 'Lead', targetId: lead.id, metadata: { previousStatus: 'NEW', newStatus: lead.status }, createdAt: new Date((lead.createdAt as Date).getTime() + 3_600_000) });
    }
  }
  audit.push({ id: uuid('audit', 'tenant-suspended'), tenantId: tenantIds.get('sandstorm-autos')!, actorUserId: adminId, action: 'TENANT_STATUS_CHANGED', targetType: 'Tenant', targetId: tenantIds.get('sandstorm-autos')!, metadata: { previousStatus: 'ACTIVE', newStatus: 'SUSPENDED', reason: 'Repeated misrepresentation of mileage in three listings (fictional case).' }, createdAt: daysAgo(12) });
  audit.push({ id: uuid('audit', 'tenant-closed'), tenantId: tenantIds.get('iron-anchor-motors')!, actorUserId: adminId, action: 'TENANT_STATUS_CHANGED', targetType: 'Tenant', targetId: tenantIds.get('iron-anchor-motors')!, metadata: { previousStatus: 'SUSPENDED', newStatus: 'CLOSED', reason: 'Trade licence expired and not renewed.' }, createdAt: daysAgo(60) });
  for (let i = 0; i < 40; i++) {
    const u = pick(users);
    audit.push({ id: uuid('audit', 'login-failed', i), tenantId: null, actorUserId: u.id, action: 'AUTH_LOGIN_FAILED', targetType: 'User', targetId: u.id, metadata: { failedAttempts: randInt(1, 4), lockedUntil: null }, createdAt: daysAgo(randInt(0, 30), randInt(0, 23)) });
  }
  const auditResult = await prisma.auditEvent.createMany({ data: audit, skipDuplicates: true });
  const outboxResult = await prisma.outboxEvent.createMany({ data: outbox, skipDuplicates: true });
  console.log(`[seed-scale] audit +${auditResult.count}/${audit.length}, outbox +${outboxResult.count}/${outbox.length}`);

  // 10. Credentials file -----------------------------------------------------
  const repoRoot = resolve(__dirname, '../../..');
  const credentialsFile = process.env.SEED_CREDENTIALS_FILE || resolve(repoRoot, '.qa-credentials.local.json');
  const accounts = users
    .filter((u) => u.withPassword !== false)
    .map((u) => ({
      email: u.email,
      displayName: u.displayName,
      kind: u.isPlatformAdmin ? 'platform-admin' : u.memberships?.length ? 'dealer-staff' : 'buyer',
      memberships: (u.memberships ?? []).map((m) => `${m.tenantSlug}:${m.role}${m.active === false ? ':INACTIVE' : ''}`),
      status: u.status ?? 'ACTIVE',
      note: u.note,
    }))
    .filter((a) => a.kind !== 'buyer' || /edge|Locked|Suspended|verified|profile/i.test(a.note) || a.email.endsWith('1@buyers.example') || a.email.endsWith('2@buyers.example') || a.email.endsWith('3@buyers.example'));
  writeFileSync(
    credentialsFile,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        database: databaseUrl!.replace(/\/\/[^@]+@/, '//<credentials>@'),
        sharedPassword: password,
        baselineAccountsAlsoUsePassword: baselineEmails,
        buyerEmailPattern: '<first.last><n>@buyers.example (n = 1..' + buyerCount + ')',
        accounts,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  console.log(`[seed-scale] credentials written to ${credentialsFile} (gitignored; password not printed)`);
  console.log(`[seed-scale] done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

main()
  .catch((e) => {
    console.error('[seed-scale] failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
