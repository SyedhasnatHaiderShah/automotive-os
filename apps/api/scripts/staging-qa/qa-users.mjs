// Creates or deletes temporary QA accounts on STAGING.
//
//   node scripts/staging-qa/qa-users.mjs create   -> buyer, dealer OWNER, platform admin
//   node scripts/staging-qa/qa-users.mjs delete   -> removes every @qa.automotive-os.test user
//
// Reads DATABASE_URL from the environment (owner connection; bypasses RLS).
// Passwords are random, written only to <repo>/.qa-credentials.local.json
// (gitignored) and never printed.
import { randomBytes, randomUUID, scrypt } from 'node:crypto';
import { writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@automotive-os/database';

const QA_DOMAIN = 'qa.automotive-os.test';
const DEALER_TENANT_SLUG = process.env.QA_DEALER_TENANT_SLUG || 'gargash-autos';
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const credentialsFile = resolve(repoRoot, '.qa-credentials.local.json');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Load .env.staging-qa.local first.');
  process.exit(1);
}
if (!/staging|railway|rlwy|proxy/i.test(process.env.DATABASE_URL)) {
  console.error('Refusing to run: DATABASE_URL does not look like the staging database.');
  process.exit(1);
}

// Same format as apps/api/src/auth/password.util.ts hashPassword().
function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return new Promise((ok, fail) =>
    scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, key) =>
      err ? fail(err) : ok(`scrypt$16384$8$1$${salt}$${key.toString('hex')}`),
    ),
  );
}

// 24 chars with upper, lower, digit and symbol to satisfy the password policy.
function generatePassword() {
  const body = randomBytes(18).toString('base64url').replace(/[-_]/g, 'x');
  return `Qa${body}9!`;
}

const prisma = new PrismaClient();

async function create() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: DEALER_TENANT_SLUG } });
  if (!tenant) throw new Error(`Tenant '${DEALER_TENANT_SLUG}' not found`);

  const stamp = Date.now().toString(36);
  const specs = [
    { key: 'buyer', displayName: 'QA Buyer', buyer: true },
    { key: 'dealer', displayName: 'QA Dealer Owner', membership: 'OWNER' },
    { key: 'admin', displayName: 'QA Platform Admin', admin: true },
  ];

  const out = { createdAt: new Date().toISOString(), tenantSlug: DEALER_TENANT_SLUG, accounts: {} };
  for (const spec of specs) {
    const email = `qa.${spec.key}.${stamp}@${QA_DOMAIN}`;
    const password = generatePassword();
    const user = await prisma.user.create({
      data: {
        identitySubject: `qa:${randomUUID()}`,
        email,
        displayName: spec.displayName,
        status: 'ACTIVE',
        isPlatformAdmin: Boolean(spec.admin),
        passwordHash: await hashPassword(password),
        emailVerifiedAt: new Date(),
        ...(spec.buyer
          ? { buyer: { create: { preferredLanguage: 'en', pdplConsentAt: new Date() } } }
          : {}),
        ...(spec.membership
          ? { memberships: { create: { tenantId: tenant.id, role: spec.membership, active: true } } }
          : {}),
      },
    });
    out.accounts[spec.key] = { id: user.id, email, password };
    console.log(`created ${spec.key}: ${email}`);
  }

  writeFileSync(credentialsFile, JSON.stringify(out, null, 2), { mode: 0o600 });
  console.log(`credentials written to ${credentialsFile} (gitignored; passwords not printed)`);
}

async function remove() {
  const users = await prisma.user.findMany({
    where: { email: { endsWith: `@${QA_DOMAIN}` } },
    select: { id: true, email: true },
  });
  for (const u of users) {
    // Memberships, buyer profile, sessions, favourites, leads and appointments cascade.
    await prisma.user.delete({ where: { id: u.id } });
    console.log(`deleted ${u.email}`);
  }
  if (users.length === 0) console.log('no QA users found');
  if (existsSync(credentialsFile)) {
    unlinkSync(credentialsFile);
    console.log('removed local credentials file');
  }
}

const mode = process.argv[2];
try {
  if (mode === 'create') await create();
  else if (mode === 'delete') await remove();
  else {
    console.error('usage: qa-users.mjs create|delete');
    process.exitCode = 1;
  }
} finally {
  await prisma.$disconnect();
}
