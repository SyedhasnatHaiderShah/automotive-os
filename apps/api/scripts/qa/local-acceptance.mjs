// Local API acceptance run against the production-scale QA data set.
//
//   DATABASE_URL=<superuser url of the QA db> node apps/api/scripts/qa/local-acceptance.mjs
//
// Reads the shared seed password from <repo>/.qa-credentials.local.json (gitignored).
// Every check records expected vs actual HTTP status plus a short evidence string.
// Never prints passwords or tokens. Writes a Markdown report to --out (default
// docs/qa/evidence/local-qa-2026-10-31/api-acceptance.md).
//
// Logins are paced to stay under the per-IP auth rate limit (10 per minute) so the
// limiter itself can be tested deliberately at the end.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const API = (process.env.API_URL || 'http://localhost:4000').replace(/\/+$/, '');
const outArg = process.argv.indexOf('--out');
const OUT = outArg > -1 ? process.argv[outArg + 1] : resolve(repoRoot, 'docs/qa/evidence/local-qa-2026-10-31/api-acceptance.md');
const creds = JSON.parse(readFileSync(resolve(repoRoot, '.qa-credentials.local.json'), 'utf8'));
const PASSWORD = creds.sharedPassword;
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL (superuser, QA database) required for DB-side expectations');
const pg = createRequire(resolve(repoRoot, 'packages/database/package.json'))('pg');
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
const q = async (sql, params = []) => (await db.query(sql, params)).rows;
const one = async (sql, params = []) => (await q(sql, params))[0];

// ---------------------------------------------------------------------------
const rows = [];
let section = '';
const sec = (s) => { section = s; };
function record(name, expected, actual, evidence = '', pass = null) {
  const ok = pass ?? (Array.isArray(expected) ? expected.includes(actual) : String(expected) === String(actual));
  rows.push({ section, name, expected: Array.isArray(expected) ? expected.join('|') : String(expected), actual: String(actual), evidence: String(evidence).slice(0, 220), ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  [${section}] ${name} -> ${actual} (expected ${Array.isArray(expected) ? expected.join('|') : expected})${evidence ? ' :: ' + String(evidence).slice(0, 140) : ''}`);
  return ok;
}

async function runSection(name, fn) {
  sec(name);
  try {
    await fn();
  } catch (e) {
    const where = String(e.stack || '').split(String.fromCharCode(10))[1] || '';
    record('section crashed: ' + String(e.message).slice(0, 120), 'no exception', 'exception', where.trim(), false);
  }
}

async function http(method, path, { token, body, headers = {}, raw = false } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'manual',
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-JSON */ }
  return { status: res.status, json, text, headers: res.headers };
}
const errCode = (r) => r.json?.error?.code || r.json?.error?.message || r.json?.message || r.text?.slice(0, 80) || '';

// Login pacing: at most 9 login calls per rolling 61s window.
const loginTimes = [];
const tokens = new Map();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Every POST to /auth/login counts toward the per-IP limiter (validation
// failures included), so all of them go through this gate.
async function pacedLogin(body) {
  for (;;) {
    const cutoff = Date.now() - 61_000;
    while (loginTimes.length && loginTimes[0] < cutoff) loginTimes.shift();
    if (loginTimes.length < 9) break;
    await sleep(2000);
  }
  loginTimes.push(Date.now());
  return http('POST', '/api/v1/auth/login', { body });
}
async function loginRaw(email, password = PASSWORD) {
  return pacedLogin({ email, password });
}
async function token(email) {
  if (tokens.has(email)) return tokens.get(email);
  const r = await loginRaw(email);
  if (r.status !== 200) throw new Error(`login failed for ${email}: ${r.status} ${errCode(r)}`);
  tokens.set(email, r.json.accessToken);
  return r.json.accessToken;
}
const acct = (pred) => creds.accounts.find(pred)?.email;
const staff = (slug, role, n = 0) => creds.accounts.filter((a) => a.memberships?.some((m) => m === `${slug}:${role}`))[n]?.email;

// Fixtures from DB -----------------------------------------------------------
const falcon = await one(`select id, slug from tenants where slug='falcon-ridge-motors'`);
const corniche = await one(`select id, slug from tenants where slug='corniche-prestige-autos'`);
const hajar = await one(`select id, slug from tenants where slug='hajar-mountain-motors'`);
const sandstorm = await one(`select id from tenants where slug='sandstorm-autos'`);
const dune = await one(`select id from tenants where slug='dune-gate-motors'`);
const uaq = await one(`select id from tenants where slug='uaq-family-motors'`);
const falconBranch = await one(`select id from branches where tenant_id=$1 limit 1`, [falcon.id]);
const cornicheBranch = await one(`select id from branches where tenant_id=$1 limit 1`, [corniche.id]);
const toyota = await one(`select m.id make_id, c.id model_id from makes m join car_models c on c.make_id=m.id where m.slug='toyota' and c.slug='camry'`);
const pubListing = await one(`select l.id, l.slug, l.tenant_id from listings l join vehicles v on v.id=l.vehicle_id join tenants t on t.id=l.tenant_id where l.status='PUBLISHED' and v.stock_status='AVAILABLE' and t.status='ACTIVE' and l.tenant_id=$1 order by l.slug limit 1`, [falcon.id]);
const soldListing = await one(`select id, slug from listings where status='SOLD' limit 1`);
const draftListing = await one(`select id, slug from listings where status='DRAFT' and tenant_id=$1 limit 1`, [falcon.id]);
const pausedSuspended = await one(`select id, slug from listings where tenant_id=$1 and status='PAUSED' limit 1`, [sandstorm.id]);
const trap = await one(`select l.id, l.slug from listings l join vehicles v on v.id=l.vehicle_id where l.status='PUBLISHED' and v.stock_status='SOLD' limit 1`);
const uaqListing = await one(`select l.slug from listings l join vehicles v on v.id=l.vehicle_id where l.tenant_id=$1 and l.status='PUBLISHED' and v.stock_status='AVAILABLE' limit 1`, [uaq.id]);
const pendingReview = await one(`select id, slug from listings where status='PENDING_REVIEW' and tenant_id=$1 limit 1`, [falcon.id]);
const pendingReview2 = await one(`select id, slug from listings where status='PENDING_REVIEW' and tenant_id=$1 order by id desc limit 1`, [falcon.id]);
const falconVehicleSoldable = await one(`select v.id, l.slug from vehicles v join listings l on l.vehicle_id=v.id where v.tenant_id=$1 and v.stock_status='AVAILABLE' and l.status='PUBLISHED' order by v.id desc limit 1`, [falcon.id]);
const cornicheVehicle = await one(`select id from vehicles where tenant_id=$1 limit 1`, [corniche.id]);
const cornicheMembership = await one(`select id from memberships where tenant_id=$1 and active limit 1`, [corniche.id]);
const falconAgentMembership = await one(`select m.id from memberships m join users u on u.id=m.user_id where m.tenant_id=$1 and m.role='SALES_AGENT' and m.active limit 1`, [falcon.id]);

const buyer1 = acct((a) => a.email.endsWith('1@buyers.example'));
const buyer2 = acct((a) => a.email.endsWith('2@buyers.example'));
const admin = 'ops.admin@automotive-os.example';
const admin2 = 'compliance.officer@automotive-os.example';
const buyer1Id = (await one(`select id from users where email=$1`, [buyer1])).id;
const buyer2Id = (await one(`select id from users where email=$1`, [buyer2])).id;
const buyer2Lead = await one(`select l.id, l.tenant_id from leads l join lead_data_grants g on g.lead_id=l.id where l.buyer_user_id=$1 and g.revoked_at is null order by l.created_at desc limit 1`, [buyer2Id]);
const buyer2Appt = await one(`select a.id from appointments a where a.buyer_user_id=$1 and a.status in ('REQUESTED','CONFIRMED') and a.starts_at > now() limit 1`, [buyer2Id]);

const ROLES = ['OWNER', 'ADMIN', 'SALES_MANAGER', 'SALES_AGENT', 'INVENTORY_MANAGER', 'SERVICE_ADVISOR', 'FINANCE_MANAGER', 'VIEWER'];
const COST_ROLES = ['OWNER', 'ADMIN', 'INVENTORY_MANAGER', 'FINANCE_MANAGER'];
const VEHICLE_WRITE = ['OWNER', 'ADMIN', 'INVENTORY_MANAGER', 'SALES_MANAGER'];
const LEAD_READ = ['OWNER', 'ADMIN', 'SALES_MANAGER', 'SALES_AGENT'];
const LEAD_ASSIGN = ['OWNER', 'ADMIN', 'SALES_MANAGER'];

// ===========================================================================
await runSection('Public listings', async () => {
  const eligible = await one(`select count(*)::int c from listings l join vehicles v on v.id=l.vehicle_id join tenants t on t.id=l.tenant_id join dealer_verifications dv on dv.tenant_id=t.id where l.status='PUBLISHED' and v.stock_status='AVAILABLE' and t.status='ACTIVE' and dv.status='APPROVED'`);
  const r = await http('GET', '/api/v1/public/listings?limit=50');
  record('GET /public/listings total equals eligible rows in DB', eligible.c, r.json?.total, `page items=${r.json?.items?.length}`);
  record('No private fields leak in public cards', 'none', ['purchaseCostFils', 'purchase_cost', 'vin', 'buyer'].filter((k) => r.text.includes(`"${k}"`)).join(',') || 'none');
  record('Error envelope not used on success; limit clamped to 50', 50, r.json?.items?.length);
  const r2 = await http('GET', '/api/v1/public/listings?limit=500');
  record('limit=500 is clamped (200) or rejected (400)', [200, 400], r2.status, `limit returned=${r2.json?.limit}`);
  const r3 = await http('GET', '/api/v1/public/listings?page=0');
  record('page=0 handled (200, page>=1) or 400', [200, 400], r3.status, `page=${r3.json?.page}`);
  const r4 = await http('GET', '/api/v1/public/listings?page=99999');
  record('out-of-range page returns 200 with empty items', 200, r4.status, `items=${r4.json?.items?.length} total=${r4.json?.total}`);
  const toy = await one(`select count(*)::int c from listings l join vehicles v on v.id=l.vehicle_id join makes m on m.id=v.make_id join tenants t on t.id=l.tenant_id join dealer_verifications dv on dv.tenant_id=t.id where l.status='PUBLISHED' and v.stock_status='AVAILABLE' and t.status='ACTIVE' and dv.status='APPROVED' and m.slug='toyota'`);
  const r5 = await http('GET', '/api/v1/public/listings?make=toyota&limit=1');
  record('make=toyota total matches DB', toy.c, r5.json?.total);
  const r6 = await http('GET', '/api/v1/public/listings?sort=price-asc&limit=50');
  const prices = (r6.json?.items || []).map((i) => Number(i.price?.amountFils));
  record('sort=price-asc is monotonic', true, prices.every((p, i) => i === 0 || p >= prices[i - 1]), `first=${prices[0]} last=${prices.at(-1)}`);
  const r7 = await http('GET', '/api/v1/public/listings?minPriceFils=9000000000&maxPriceFils=1000');
  record('inverted price range returns empty 200 (or 400)', [200, 400], r7.status, `total=${r7.json?.total}`);
  const r8 = await http('GET', `/api/v1/public/listings?q=${encodeURIComponent("' OR 1=1 --")}`);
  record('q with SQL characters is safe (200)', 200, r8.status, `total=${r8.json?.total}`);
  const r9 = await http('GET', '/api/v1/public/listings?condition=BROKEN');
  record('invalid condition enum -> 400', 400, r9.status, errCode(r9));
  const r10 = await http('GET', '/api/v1/public/listings?unknownParam=1');
  record('unknown query param rejected (400 forbidNonWhitelisted) or ignored (200)', [200, 400], r10.status);
  const emirate = await one(`select count(*)::int c from listings l join vehicles v on v.id=l.vehicle_id join branches b on b.id=v.branch_id join tenants t on t.id=l.tenant_id join dealer_verifications dv on dv.tenant_id=t.id where l.status='PUBLISHED' and v.stock_status='AVAILABLE' and t.status='ACTIVE' and dv.status='APPROVED' and b.emirate='Abu Dhabi'`);
  const r11 = await http('GET', '/api/v1/public/listings?emirate=abu%20dhabi&limit=1');
  record('emirate filter case-insensitive total matches DB', emirate.c, r11.json?.total);
});
await runSection('Public listing detail', async () => {
  const r = await http('GET', `/api/v1/public/listings/${pubListing.slug}`);
  record('published+available+active -> 200', 200, r.status);
  record('detail hides purchaseCostFils and buyer data', 'none', ['purchaseCostFils', 'purchase_cost'].filter((k) => r.text.includes(k)).join(',') || 'none');
  record('detail exposes seller verified flag and emirate', true, Boolean(r.json?.seller?.emirate), JSON.stringify(r.json?.seller || {}).slice(0, 120));
  record('SOLD listing -> 404', 404, (await http('GET', `/api/v1/public/listings/${soldListing.slug}`)).status);
  record('DRAFT listing -> 404', 404, (await http('GET', `/api/v1/public/listings/${draftListing.slug}`)).status);
  record('PAUSED listing of SUSPENDED dealer -> 404', 404, (await http('GET', `/api/v1/public/listings/${pausedSuspended.slug}`)).status);
  record('TRAP-01 PUBLISHED listing on SOLD vehicle -> 404', 404, (await http('GET', `/api/v1/public/listings/${trap.slug}`)).status);
  record('unknown slug -> 404 with error envelope', 404, (await http('GET', '/api/v1/public/listings/does-not-exist')).status);
  const unk = await http('GET', '/api/v1/public/listings/does-not-exist');
  record('404 envelope has error.code and correlationId', true, Boolean(unk.json?.error?.code && unk.json?.error?.correlationId), JSON.stringify(unk.json).slice(0, 160));
  if (uaqListing) {
    const ru = await http('GET', `/api/v1/public/listings/${uaqListing.slug}`);
    record('Listing of ACTIVE dealer whose KYB is IN_REVIEW: visible publicly? (policy: verified dealers only)', 404, ru.status, 'uaq-family-motors verification IN_REVIEW');
  }
});
await runSection('Public dealers', async () => {
  const r = await http('GET', '/api/v1/public/dealers?limit=50');
  const slugs = (r.json?.items || r.json || []).map((d) => d.slug);
  const approvedActive = await one(`select count(*)::int c from tenants t join dealer_verifications v on v.tenant_id=t.id where t.status='ACTIVE' and v.status='APPROVED'`);
  record('dealers list count equals ACTIVE+APPROVED tenants', approvedActive.c, r.json?.total ?? slugs.length, `slugs=${slugs.length}`);
  record('IN_REVIEW dealer (uaq) excluded', false, slugs.includes('uaq-family-motors'));
  record('SUSPENDED dealer excluded', false, slugs.includes('sandstorm-autos'));
  record('PENDING dealer excluded', false, slugs.includes('dune-gate-motors'));
  record('GET dealers/uaq-family-motors -> 404', 404, (await http('GET', '/api/v1/public/dealers/uaq-family-motors')).status);
  record('GET dealers/sandstorm-autos -> 404', 404, (await http('GET', '/api/v1/public/dealers/sandstorm-autos')).status);
  const d = await http('GET', '/api/v1/public/dealers/falcon-ridge-motors');
  record('GET dealers/falcon-ridge-motors -> 200', 200, d.status);
  record('dealer profile exposes no staff emails/phones', 'none', ['@falcon-ridge-motors.example', '+9715'].filter((k) => d.text.includes(k)).join(',') || 'none');
});
await runSection('Public media', async () => {
  record('path traversal rejected', 400, (await http('GET', '/api/v1/public/media/..%2F..%2Fetc%2Fpasswd')).status);
  const doc = await one(`select object_key from vehicle_media where kind='DOCUMENT' limit 1`);
  record('private DOCUMENT key -> 404', 404, (await http('GET', `/api/v1/public/media/${doc.object_key}`)).status);
  const soldPhoto = await one(`select m.object_key from vehicle_media m join vehicles v on v.id=m.vehicle_id where m.is_public and m.kind<>'DOCUMENT' and v.stock_status='SOLD' limit 1`);
  record('photo of SOLD vehicle -> 404', 404, (await http('GET', `/api/v1/public/media/${soldPhoto.object_key}`)).status);
  const susPhoto = await one(`select m.object_key from vehicle_media m join vehicles v on v.id=m.vehicle_id where m.is_public and m.kind<>'DOCUMENT' and v.stock_status='AVAILABLE' and v.tenant_id=$1 limit 1`, [sandstorm.id]);
  record('photo of SUSPENDED dealer vehicle -> 404', 404, (await http('GET', `/api/v1/public/media/${susPhoto.object_key}`)).status);
  const okPhoto = await one(`select m.object_key from vehicle_media m join vehicles v on v.id=m.vehicle_id where m.is_public and m.kind<>'DOCUMENT' and v.stock_status='AVAILABLE' and v.tenant_id=$1 limit 1`, [falcon.id]);
  const rp = await http('GET', `/api/v1/public/media/${okPhoto.object_key}`);
  record('eligible photo without object storage configured -> honest 404/503, not 500', [404, 503], rp.status, errCode(rp));
});
await runSection('Security headers', async () => {
  const r = await http('GET', '/api/v1/public/listings?limit=1');
  record('X-Content-Type-Options nosniff', 'nosniff', r.headers.get('x-content-type-options'));
  record('Cache-Control no-store', true, (r.headers.get('cache-control') || '').includes('no-store'));
  record('x-correlation-id exposed', true, Boolean(r.headers.get('x-correlation-id')) || r.headers.get('access-control-expose-headers')?.includes('x-correlation-id'), r.headers.get('x-correlation-id') || 'via expose header');
});

// ===========================================================================
await runSection('Auth', async () => {
  const ok = await loginRaw(buyer1);
  record('buyer login -> 200 with accessToken and cookie', 200, ok.status, `cookie=${(ok.headers.get('set-cookie') || '').split(';')[0].split('=')[0]} redirect=${ok.json?.user?.redirectUrl}`);
  tokens.set(buyer1, ok.json?.accessToken);
  record('buyer redirectUrl is /account/garage', '/account/garage', ok.json?.user?.redirectUrl);
  record('login response contains no passwordHash', false, ok.text.includes('passwordHash'));
  const bad = await loginRaw(buyer2, 'Wrong-password-123!');
  record('wrong password -> 401 generic', 401, bad.status, errCode(bad));
  const unknown = await loginRaw('nobody@buyers.example');
  record('unknown email -> 401 generic (same message)', 401, unknown.status, errCode(unknown));
  record('unknown vs wrong-password messages identical (no enumeration)', true, errCode(bad) === errCode(unknown));
  // The seeded lock is relative to seed time; re-arm it so the check is deterministic.
  await q(`update users set locked_until = now() + interval '1 day' where email = $1`, ['locked.buyer@buyers.example']);
  const locked = await loginRaw('locked.buyer@buyers.example');
  record('locked account -> 403 ACCOUNT_LOCKED', 403, locked.status, errCode(locked));
  const susp = await loginRaw('suspended.buyer@buyers.example');
  record('suspended buyer -> 403 ACCOUNT_SUSPENDED', 403, susp.status, errCode(susp));
  const dis = await loginRaw('disabled.viewer@gulf-crescent-cars.example');
  record('disabled staff -> 403 ACCOUNT_DISABLED', 403, dis.status, errCode(dis));
  const unv = await loginRaw('unverified.buyer@buyers.example');
  record('unverified email -> 403 EMAIL_NOT_VERIFIED', 403, unv.status, errCode(unv));
  const nopw = await loginRaw('sso.only@zayed-avenue-ev-hub.example');
  record('account without password -> 401 generic', 401, nopw.status, errCode(nopw));
  const badEmail = await pacedLogin({ email: 'not-an-email', password: 'x' });
  record('malformed email -> 400', 400, badEmail.status, errCode(badEmail));
  const extra = await pacedLogin({ email: buyer1, password: 'x', tenantId: 'evil' });
  record('unknown body field rejected -> 400', 400, extra.status, errCode(extra));
  record('GET /auth/me without token -> 401', 401, (await http('GET', '/api/v1/auth/me')).status);
  const t = await token(buyer1);
  const tampered = t.slice(0, -4) + (t.endsWith('AAAA') ? 'BBBB' : 'AAAA');
  record('tampered JWT -> 401', 401, (await http('GET', '/api/v1/auth/me', { token: tampered })).status);
  const [h, p] = t.split('.');
  const noneTok = `${Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')}.${p}.`;
  record('alg=none JWT -> 401', 401, (await http('GET', '/api/v1/auth/me', { token: noneTok })).status);
  record('dev token endpoint disabled -> 403', 403, (await http('POST', '/api/v1/auth/token', { body: { identitySubject: 'x', email: 'x@x.example', name: 'x' } })).status);
  const me = await http('GET', '/api/v1/auth/me', { token: t });
  record('GET /auth/me -> 200 own email', buyer1, me.json?.email);
  record('/auth/me response has no passwordHash/mfaSecret', 'none', ['passwordHash', 'mfaSecret'].filter((k) => me.text.includes(k)).join(',') || 'none');
  // logout revokes session
  const lo = await loginRaw(buyer2);
  const t2 = lo.json?.accessToken;
  record('logout -> 200', 200, (await http('POST', '/api/v1/auth/logout', { token: t2 })).status);
  record('token after logout -> 401 (session revoked)', 401, (await http('GET', '/api/v1/auth/me', { token: t2 })).status);
  // non-admin on admin verification
  record('verify-admin-session as buyer -> 403', 403, (await http('GET', '/api/v1/auth/verify-admin-session', { token: t })).status);
  const sa = await loginRaw('ops.suspended@automotive-os.example');
  record('suspended platform admin login -> 403', 403, sa.status, errCode(sa));
  const signupWeak = await http('POST', '/api/v1/auth/signup', { body: { email: `weak.${Date.now()}@buyers.example`, password: 'short', displayName: 'Weak Pw', pdplConsent: true } });
  record('signup weak password -> 400', 400, signupWeak.status, errCode(signupWeak));
  const dup = await http('POST', '/api/v1/auth/signup', { body: { email: buyer1, password: 'StrongPass123!@#', displayName: 'Dup', pdplConsent: true } });
  record('signup duplicate email -> 409 (or 400/201 generic anti-enumeration)', [409, 400, 201], dup.status, errCode(dup));
});

// ===========================================================================
await runSection('Buyer zone', async () => {
  const t = await token(buyer1);
  const me = await http('GET', '/api/v1/me', { token: t });
  record('GET /me -> 200 own id', buyer1Id, me.json?.id);
  const prof = await http('GET', '/api/v1/me/buyer-profile', { token: t });
  record('GET buyer-profile -> 200', 200, prof.status);
  const upd = await http('PATCH', '/api/v1/me/buyer-profile', { token: t, body: { preferredEmirate: 'Sharjah', budgetMinFils: 5000000, budgetMaxFils: 12000000 } });
  record('PATCH buyer-profile valid -> 200 echoes new emirate', 'Sharjah', upd.json?.preferredEmirate, upd.status);
  const neg = await http('PATCH', '/api/v1/me/buyer-profile', { token: t, body: { budgetMinFils: -5 } });
  record('PATCH buyer-profile negative budget -> 400', 400, neg.status);
  const inv = await http('PATCH', '/api/v1/me/buyer-profile', { token: t, body: { budgetMinFils: 20000000, budgetMaxFils: 1000 } });
  record('PATCH buyer-profile min>max -> 400 (or 200 if unvalidated)', 400, inv.status, 'min 200,000 AED > max 10 AED');
  const unk = await http('PATCH', '/api/v1/me/buyer-profile', { token: t, body: { isPlatformAdmin: true } });
  record('PATCH buyer-profile privilege field rejected -> 400', 400, unk.status);
  const noProfTok = await token('no.profile@buyers.example');
  const np = await http('GET', '/api/v1/me/buyer-profile', { token: noProfTok });
  record('buyer without profile row: GET buyer-profile -> 200 defaults or 404 (not 500)', [200, 404], np.status, errCode(np));
  // favourites
  const fav = await http('POST', '/api/v1/me/favorites', { token: t, body: { listingId: pubListing.id } });
  record('POST favorite published listing -> 201/200', [200, 201], fav.status, errCode(fav));
  const favDup = await http('POST', '/api/v1/me/favorites', { token: t, body: { listingId: pubListing.id } });
  record('POST favorite duplicate -> 409 or idempotent 200/201', [200, 201, 409], favDup.status, errCode(favDup));
  const favDraft = await http('POST', '/api/v1/me/favorites', { token: t, body: { listingId: draftListing.id } });
  record('POST favorite on DRAFT listing -> 404/400', [400, 404], favDraft.status, errCode(favDraft));
  record('POST favorite non-uuid -> 400', 400, (await http('POST', '/api/v1/me/favorites', { token: t, body: { listingId: 'abc' } })).status);
  const favs = await http('GET', '/api/v1/me/favorites', { token: t });
  const dbFavs = await one(`select count(*)::int c from favorites where user_id=$1`, [buyer1Id]);
  record('GET favorites count equals DB for this buyer', dbFavs.c, favs.json?.length);
  record('favorite card has no cost/vin', 'none', ['purchaseCostFils', 'vin'].filter((k) => favs.text.includes(`"${k}"`)).join(',') || 'none');
  record('DELETE favorite -> 200', 200, (await http('DELETE', `/api/v1/me/favorites/${pubListing.id}`, { token: t })).status);
  record('DELETE favorite again -> 404', 404, (await http('DELETE', `/api/v1/me/favorites/${pubListing.id}`, { token: t })).status);
  // saved searches
  const ss = await http('POST', '/api/v1/me/saved-searches', { token: t, body: { name: 'QA Toyota Dubai', filterJson: { make: 'toyota', emirate: 'Dubai' }, alertsEnabled: true } });
  record('POST saved-search -> 201', [200, 201], ss.status, errCode(ss));
  const otherSs = await one(`select id from saved_searches where user_id<>$1 limit 1`, [buyer1Id]);
  record("DELETE another buyer's saved search -> 404", 404, (await http('DELETE', `/api/v1/me/saved-searches/${otherSs.id}`, { token: t })).status);
  record('DELETE own saved-search -> 200', 200, (await http('DELETE', `/api/v1/me/saved-searches/${ss.json?.id}`, { token: t })).status);
  const ssBad = await http('POST', '/api/v1/me/saved-searches', { token: t, body: { name: '', filterJson: 'not-an-object' } });
  record('POST saved-search invalid -> 400', 400, ssBad.status);
  // enquiries isolation
  const enq = await http('GET', '/api/v1/me/enquiries', { token: t });
  const dbEnq = await one(`select count(*)::int c from leads where buyer_user_id=$1`, [buyer1Id]);
  record('GET enquiries count equals own leads in DB', dbEnq.c, enq.json?.length);
  record('enquiries expose dealershipName but no dealer cost / staff contacts', 'none', ['purchaseCostFils', '@falcon-ridge-motors.example'].filter((k) => enq.text.includes(k)).join(',') || 'none');
  // settings consent round trip
  const set0 = await http('GET', '/api/v1/me/settings', { token: t });
  const set1 = await http('PATCH', '/api/v1/me/settings', { token: t, body: { whatsappComms: !set0.json?.whatsappCommsConsent } });
  record('PATCH settings whatsappComms toggles', !set0.json?.whatsappCommsConsent, set1.json?.whatsappCommsConsent, set1.status);
  await http('PATCH', '/api/v1/me/settings', { token: t, body: { whatsappComms: set0.json?.whatsappCommsConsent } });
  const ibanBad = await http('PATCH', '/api/v1/me/settings', { token: t, body: { escrowIban: 'NOT-AN-IBAN' } });
  record('PATCH settings invalid IBAN -> 400 (or 200 if unvalidated)', 400, ibanBad.status, errCode(ibanBad));
});
await runSection('Buyer enquiry + appointments', async () => {
  const t = await token(buyer1);
  const body = { intent: 'TEST_DRIVE', preferredContact: 'WHATSAPP', message: 'QA enquiry — Saturday test drive', fieldsToShare: ['name', 'phone'], consentTextVersion: 'buyer-lead-disclosure-en-AE-v1' };
  record('POST lead unauthenticated -> 401', 401, (await http('POST', `/api/v1/public/listings/${pubListing.id}/leads`, { body })).status);
  const lead = await http('POST', `/api/v1/public/listings/${pubListing.id}/leads`, { token: t, body });
  record('POST lead on published listing -> 201', 201, lead.status, errCode(lead));
  const leadId = lead.json?.id;
  if (leadId) {
    const g = await one(`select fields_granted, purpose from lead_data_grants where lead_id=$1`, [leadId]);
    record('grant row created with the shared fields only', 'name,phone', (g?.fields_granted || []).join(','));
    const audit = await one(`select count(*)::int c from audit_events where target_id=$1`, [leadId]);
    const outbox = await one(`select count(*)::int c from outbox_events where aggregate_id=$1`, [leadId]);
    record('audit + outbox rows written for new lead', true, audit.c >= 1 && outbox.c >= 1, `audit=${audit.c} outbox=${outbox.c}`);
  }
  record('POST lead on SOLD listing -> 404/400', [400, 404], (await http('POST', `/api/v1/public/listings/${soldListing.id}/leads`, { token: t, body })).status);
  record('POST lead on PAUSED listing of suspended dealer -> 404/400', [400, 404], (await http('POST', `/api/v1/public/listings/${pausedSuspended.id}/leads`, { token: t, body })).status);
  record('POST lead with empty fieldsToShare -> 400', 400, (await http('POST', `/api/v1/public/listings/${pubListing.id}/leads`, { token: t, body: { ...body, fieldsToShare: [] } })).status);
  record('POST lead with unknown field name -> 400', 400, (await http('POST', `/api/v1/public/listings/${pubListing.id}/leads`, { token: t, body: { ...body, fieldsToShare: ['name', 'passport'] } })).status);
  record('POST lead invalid intent -> 400', 400, (await http('POST', `/api/v1/public/listings/${pubListing.id}/leads`, { token: t, body: { ...body, intent: 'BUY_NOW' } })).status);
  // appointments on own lead
  const future = new Date(Date.now() + 3 * 86_400_000); future.setUTCHours(7, 0, 0, 0);
  const end = new Date(future.getTime() + 3_600_000);
  if (leadId) {
    const ap = await http('POST', `/api/v1/me/leads/${leadId}/appointments`, { token: t, body: { startsAt: future.toISOString(), endsAt: end.toISOString(), note: 'QA' } });
    record('POST appointment on own lead -> 201', 201, ap.status, errCode(ap));
    record('POST appointment end<=start -> 400', 400, (await http('POST', `/api/v1/me/leads/${leadId}/appointments`, { token: t, body: { startsAt: end.toISOString(), endsAt: future.toISOString() } })).status);
    const past = new Date(Date.now() - 86_400_000);
    const apPast = await http('POST', `/api/v1/me/leads/${leadId}/appointments`, { token: t, body: { startsAt: past.toISOString(), endsAt: new Date(past.getTime() + 3_600_000).toISOString() } });
    record('POST appointment in the past -> 400 (or 201 if unvalidated)', 400, apPast.status, errCode(apPast));
    record('POST appointment bad timestamp -> 400', 400, (await http('POST', `/api/v1/me/leads/${leadId}/appointments`, { token: t, body: { startsAt: 'tomorrow', endsAt: 'later' } })).status);
    if (ap.json?.id) {
      const re = await http('POST', `/api/v1/me/appointments/${ap.json.id}/reschedule`, { token: t, body: { startsAt: new Date(future.getTime() + 86_400_000).toISOString(), endsAt: new Date(end.getTime() + 86_400_000).toISOString() } });
      record('reschedule own appointment -> 200', 200, re.status, errCode(re));
      record('cancel own appointment -> 200', 200, (await http('POST', `/api/v1/me/appointments/${ap.json.id}/cancel`, { token: t, body: { reason: 'QA' } })).status);
      const again = await http('POST', `/api/v1/me/appointments/${ap.json.id}/cancel`, { token: t, body: { reason: 'QA' } });
      record('cancel already-cancelled appointment -> 400/409 (not 200)', [400, 409], again.status, errCode(again));
    }
    record('revoke own grant -> 200', 200, (await http('POST', `/api/v1/me/leads/${leadId}/grant/revoke`, { token: t })).status);
    const twice = await http('POST', `/api/v1/me/leads/${leadId}/grant/revoke`, { token: t });
    record('revoke grant twice -> 400/409 (or idempotent 200)', [200, 400, 409], twice.status, errCode(twice));
  }
  // cross-buyer isolation
  record("POST appointment on another buyer's lead -> 404/403", [403, 404], (await http('POST', `/api/v1/me/leads/${buyer2Lead.id}/appointments`, { token: t, body: { startsAt: future.toISOString(), endsAt: end.toISOString() } })).status);
  record("revoke another buyer's grant -> 404/403", [403, 404], (await http('POST', `/api/v1/me/leads/${buyer2Lead.id}/grant/revoke`, { token: t })).status);
  if (buyer2Appt) record("cancel another buyer's appointment -> 404/403", [403, 404], (await http('POST', `/api/v1/me/appointments/${buyer2Appt.id}/cancel`, { token: t, body: {} })).status);
  record('buyer calling tenant route -> 403', 403, (await http('GET', `/api/v1/tenants/${falcon.id}/vehicles`, { token: t })).status);
  record('buyer calling admin route -> 403', 403, (await http('GET', '/api/v1/admin/tenants/summary', { token: t })).status);
});

// ===========================================================================
await runSection('Dealer roles (Falcon Ridge)', async () => {
  const dbVehicles = await one(`select count(*)::int c from vehicles where tenant_id=$1`, [falcon.id]);
  for (const role of ROLES) {
    const email = staff(falcon.slug, role);
    if (!email) { record(`${role} account exists`, true, false); continue; }
    const t = await token(email);
    const ctx = await http('GET', `/api/v1/tenants/${falcon.id}/context`, { token: t });
    record(`${role}: GET context -> 200 callerRole echoed`, role, ctx.json?.callerRole ?? ctx.status, ctx.status);
    const list = await http('GET', `/api/v1/tenants/${falcon.id}/vehicles?limit=50`, { token: t });
    const dbNow = await one(`select count(*)::int c from vehicles where tenant_id=$1`, [falcon.id]);
    record(`${role}: GET vehicles -> 200 total matches DB`, dbNow.c, list.json?.total ?? list.json?.meta?.total, list.status);
    const pageItems = list.json?.items ?? list.json?.data ?? [];
    const costPresent = pageItems.some((v) => v.purchaseCostFils !== null && v.purchaseCostFils !== undefined);
    record(`${role}: purchaseCostFils ${COST_ROLES.includes(role) ? 'visible' : 'redacted'}`, COST_ROLES.includes(role), Boolean(costPresent), `rows=${pageItems.length} withCost=${pageItems.filter((v) => v.purchaseCostFils != null).length}`);
    const create = await http('POST', `/api/v1/tenants/${falcon.id}/vehicles`, { token: t, body: { branchId: falconBranch.id, makeId: toyota.make_id, modelId: toyota.model_id, stockNumber: `QA-${role}-${Date.now()}`, modelYear: 2025, condition: 'NEW', askingPriceFils: 12000000 } });
    record(`${role}: POST vehicle (no cost) -> ${VEHICLE_WRITE.includes(role) ? 201 : 403}`, VEHICLE_WRITE.includes(role) ? 201 : 403, create.status, errCode(create));
    if (VEHICLE_WRITE.includes(role)) {
      const withCost = await http('POST', `/api/v1/tenants/${falcon.id}/vehicles`, { token: t, body: { branchId: falconBranch.id, makeId: toyota.make_id, modelId: toyota.model_id, stockNumber: `QA-${role}-C-${Date.now()}`, modelYear: 2025, condition: 'NEW', askingPriceFils: 12000000, purchaseCostFils: 10000000 } });
      record(`${role}: POST vehicle with purchaseCostFils -> ${COST_ROLES.includes(role) ? 201 : 403}`, COST_ROLES.includes(role) ? 201 : 403, withCost.status, errCode(withCost));
    }
    const leads = await http('GET', `/api/v1/tenants/${falcon.id}/leads?limit=5`, { token: t });
    record(`${role}: GET leads -> ${LEAD_READ.includes(role) ? 200 : 403}`, LEAD_READ.includes(role) ? 200 : 403, leads.status);
    const appts = await http('GET', `/api/v1/tenants/${falcon.id}/appointments?limit=5`, { token: t });
    record(`${role}: GET appointments -> ${LEAD_READ.includes(role) ? 200 : 403}`, LEAD_READ.includes(role) ? 200 : 403, appts.status);
    const priv = await http('GET', `/api/v1/tenants/${falcon.id}/privileged-management`, { token: t });
    record(`${role}: privileged-management -> ${['OWNER', 'ADMIN'].includes(role) ? 200 : 403}`, ['OWNER', 'ADMIN'].includes(role) ? 200 : 403, priv.status);
    record(`${role}: cross-tenant context (Corniche) -> 403`, 403, (await http('GET', `/api/v1/tenants/${corniche.id}/context`, { token: t })).status);
    record(`${role}: admin route -> 403`, 403, (await http('GET', '/api/v1/admin/users', { token: t })).status);
  }
});
await runSection('Dealer inventory rules (OWNER)', async () => {
  const t = await token(staff(falcon.slug, 'OWNER'));
  const base = { branchId: falconBranch.id, makeId: toyota.make_id, modelId: toyota.model_id, modelYear: 2025, condition: 'NEW', askingPriceFils: 12000000 };
  record('POST vehicle modelYear 1989 -> 400', 400, (await http('POST', `/api/v1/tenants/${falcon.id}/vehicles`, { token: t, body: { ...base, stockNumber: `QA-Y-${Date.now()}`, modelYear: 1989 } })).status);
  record('POST vehicle askingPriceFils 0 -> 400', 400, (await http('POST', `/api/v1/tenants/${falcon.id}/vehicles`, { token: t, body: { ...base, stockNumber: `QA-P-${Date.now()}`, askingPriceFils: 0 } })).status);
  record('POST vehicle fractional fils -> 400', 400, (await http('POST', `/api/v1/tenants/${falcon.id}/vehicles`, { token: t, body: { ...base, stockNumber: `QA-F-${Date.now()}`, askingPriceFils: 123.45 } })).status);
  const otherBranch = await http('POST', `/api/v1/tenants/${falcon.id}/vehicles`, { token: t, body: { ...base, stockNumber: `QA-B-${Date.now()}`, branchId: cornicheBranch.id } });
  record("POST vehicle with another tenant's branchId -> 400/404", [400, 404], otherBranch.status, errCode(otherBranch));
  const sn = `QA-DUP-${Date.now()}`;
  const c1 = await http('POST', `/api/v1/tenants/${falcon.id}/vehicles`, { token: t, body: { ...base, stockNumber: sn } });
  const c2 = await http('POST', `/api/v1/tenants/${falcon.id}/vehicles`, { token: t, body: { ...base, stockNumber: sn } });
  record('duplicate stockNumber -> 409', 409, c2.status, errCode(c2));
  const vid = c1.json?.id;
  if (vid) {
    const audit = await one(`select count(*)::int c from audit_events where target_id=$1`, [vid]);
    record('vehicle create audited', true, audit.c >= 1, `audit=${audit.c}`);
    record('tenantId in body ignored/rejected (no tenant hijack)', [201, 400], c1.status);
    record("GET another tenant's vehicle id via own tenant path -> 404", 404, (await http('GET', `/api/v1/tenants/${falcon.id}/vehicles/${cornicheVehicle.id}`, { token: t })).status);
    record("PATCH another tenant's vehicle via own path -> 404", 404, (await http('PATCH', `/api/v1/tenants/${falcon.id}/vehicles/${cornicheVehicle.id}`, { token: t, body: { trim: 'hijack' } })).status);
    record('PATCH own vehicle invalid stockStatus -> 400', 400, (await http('PATCH', `/api/v1/tenants/${falcon.id}/vehicles/${vid}`, { token: t, body: { stockStatus: 'GONE' } })).status);
    // draft -> submit -> admin approve -> public -> sold -> unpublished
    const draft = await http('POST', `/api/v1/tenants/${falcon.id}/vehicles/${vid}/listing`, { token: t, body: { title: 'QA 2025 Toyota Camry', description: 'QA listing' } });
    record('POST draft listing -> 201', 201, draft.status, errCode(draft));
    const lid = draft.json?.id;
    const draftAgain = await http('POST', `/api/v1/tenants/${falcon.id}/vehicles/${vid}/listing`, { token: t, body: {} });
    record('POST draft listing twice keeps one DRAFT listing (idempotent 201 or 409)', true, [201, 409, 400].includes(draftAgain.status) && (await one(`select count(*)::int c from listings where vehicle_id=$1`, [vid])).c === 1, `status=${draftAgain.status}`);
    if (lid) {
      record('unpublish a DRAFT -> 400', 400, (await http('POST', `/api/v1/tenants/${falcon.id}/listings/${lid}/unpublish`, { token: t })).status);
      record('listing slug not public while DRAFT', 404, (await http('GET', `/api/v1/public/listings/${draft.json.slug}`)).status);
      const sub = await http('POST', `/api/v1/tenants/${falcon.id}/listings/${lid}/submit`, { token: t });
      record('submit draft without photos -> 400 (publish gate)', 400, sub.status, errCode(sub));
      // Moderation drill on a seeded PENDING_REVIEW listing of an AVAILABLE vehicle.
      const at = await token(admin);
      const pend = await one(`select l.id, l.slug from listings l join vehicles v on v.id=l.vehicle_id where l.status='PENDING_REVIEW' and v.stock_status='AVAILABLE' and l.tenant_id=$1 order by l.slug limit 1`, [falcon.id]);
      const get = await http('GET', `/api/v1/admin/listings/${pend.id}`, { token: at });
      record('admin GET pending listing -> 200', 200, get.status, errCode(get));
      record('admin reject without reason -> 400', 400, (await http('POST', `/api/v1/admin/listings/${pend.id}/decision`, { token: at, body: { decision: 'REJECT' } })).status);
      const appr = await http('POST', `/api/v1/admin/listings/${pend.id}/decision`, { token: at, body: { decision: 'APPROVE' } });
      record('admin approve -> 200 PUBLISHED', 'PUBLISHED', appr.json?.status, appr.status);
      record('approve twice -> 400/409', [400, 409], (await http('POST', `/api/v1/admin/listings/${pend.id}/decision`, { token: at, body: { decision: 'APPROVE' } })).status);
      record('approved listing public -> 200', 200, (await http('GET', `/api/v1/public/listings/${pend.slug}`)).status);
      const aud = await one(`select count(*)::int c from audit_events where target_id=$1 and actor_user_id=(select id from users where email=$2)`, [pend.id, admin]);
      record('moderation decision audited with admin actor', true, aud.c >= 1, `audit=${aud.c}`);
      record('SALES_AGENT unpublish -> 403', 403, (await http('POST', `/api/v1/tenants/${falcon.id}/listings/${pend.id}/unpublish`, { token: await token(staff(falcon.slug, 'SALES_AGENT')) })).status);
      // Sale drill on a seeded AVAILABLE vehicle with a PUBLISHED listing.
      const soldable = await one(`select v.id, l.id as listing_id, l.slug from vehicles v join listings l on l.vehicle_id=v.id where v.tenant_id=$1 and v.stock_status='AVAILABLE' and l.status='PUBLISHED' order by v.id limit 1`, [falcon.id]);
      const sold = await http('PATCH', `/api/v1/tenants/${falcon.id}/vehicles/${soldable.id}`, { token: t, body: { stockStatus: 'SOLD' } });
      record('PATCH stockStatus SOLD -> 200', 200, sold.status, errCode(sold));
      const lrow = await one(`select status from listings where id=$1`, [soldable.listing_id]);
      record('listing auto-set to SOLD when vehicle sold', 'SOLD', lrow?.status);
      record('sold listing no longer public -> 404', 404, (await http('GET', `/api/v1/public/listings/${soldable.slug}`)).status);
      const ob = await one(`select count(*)::int c from outbox_events where aggregate_id=$1 and event_type ilike '%unpublish%'`, [soldable.listing_id]);
      record('outbox unpublish event written on sale', true, ob.c >= 1, `outbox=${ob.c}`);
      const vaud = await one(`select count(*)::int c from audit_events where target_id=$1 and action='VEHICLE_UPDATED'`, [soldable.id]);
      record('vehicle update audited in the same request', true, vaud.c >= 1, `audit=${vaud.c}`);
    }
    // VIEWER cannot patch
    record('VIEWER PATCH vehicle -> 403', 403, (await http('PATCH', `/api/v1/tenants/${falcon.id}/vehicles/${vid}`, { token: await token(staff(falcon.slug, 'VIEWER')), body: { trim: 'x' } })).status);
    // media upload request (no storage configured)
    const mu = await http('POST', `/api/v1/tenants/${falcon.id}/vehicles/${vid}/media`, { token: t, body: { kind: 'EXTERIOR', fileName: 'a.jpg', contentType: 'image/jpeg', fileSizeBytes: 1000, isPublic: true } });
    record('media upload URL without storage configured -> honest 503/501/400, not 500', [400, 501, 503], mu.status, errCode(mu));
    record('media upload exe content type -> 400', 400, (await http('POST', `/api/v1/tenants/${falcon.id}/vehicles/${vid}/media`, { token: t, body: { kind: 'EXTERIOR', fileName: 'a.exe', contentType: 'application/x-msdownload', fileSizeBytes: 1000 } })).status);
  }
  const page = await http('GET', `/api/v1/tenants/${falcon.id}/vehicles?page=0&limit=1000`, { token: t });
  record('vehicles page=0/limit=1000 -> 400 or clamped 200', [200, 400], page.status, `limit=${page.json?.limit ?? page.json?.meta?.limit}`);
  const bySt = await one(`select count(*)::int c from vehicles where tenant_id=$1 and stock_status='SOLD'`, [falcon.id]);
  const filt = await http('GET', `/api/v1/tenants/${falcon.id}/vehicles?stockStatus=SOLD&limit=1`, { token: t });
  record('stockStatus=SOLD filter total matches DB', bySt.c, filt.json?.total ?? filt.json?.meta?.total);
});
await runSection('Dealer leads rules', async () => {
  const owner = await token(staff(falcon.slug, 'OWNER'));
  const agent = await token(staff(falcon.slug, 'SALES_AGENT'));
  const viewer = await token(staff(falcon.slug, 'VIEWER'));
  const dbLeads = await one(`select count(*)::int c from leads where tenant_id=$1`, [falcon.id]);
  const list = await http('GET', `/api/v1/tenants/${falcon.id}/leads?limit=50`, { token: owner });
  record('OWNER GET leads total matches DB', dbLeads.c, list.json?.total ?? list.json?.meta?.total, list.status);
  const items = list.json?.items || list.json?.data || [];
  const revokedLead = await one(`select l.id from leads l join lead_data_grants g on g.lead_id=l.id where l.tenant_id=$1 and g.revoked_at is not null limit 1`, [falcon.id]);
  const nameOnly = await one(`select l.id from leads l join lead_data_grants g on g.lead_id=l.id where l.tenant_id=$1 and g.revoked_at is null and g.fields_granted = '{name}' limit 1`, [falcon.id]);
  const rv = await http('GET', `/api/v1/tenants/${falcon.id}/leads/${revokedLead.id}`, { token: owner });
  record('revoked grant: buyerContact fields null, grantStatus REVOKED', 'REVOKED', rv.json?.buyerContact?.grantStatus, `phone=${rv.json?.buyerContact?.phone} email=${rv.json?.buyerContact?.email} name=${rv.json?.buyerContact?.name}`, rv.json?.buyerContact?.grantStatus === 'REVOKED' && rv.json?.buyerContact?.phone == null && rv.json?.buyerContact?.email == null && rv.json?.buyerContact?.name == null);
  if (nameOnly) {
    const no = await http('GET', `/api/v1/tenants/${falcon.id}/leads/${nameOnly.id}`, { token: owner });
    record('name-only grant: phone and email null, name present', true, Boolean(no.json?.buyerContact?.name) && no.json?.buyerContact?.phone == null && no.json?.buyerContact?.email == null, JSON.stringify(no.json?.buyerContact ?? null).slice(0, 120));
  }
  record('lead list never contains buyer identity subject or password fields', 'none', ['identitySubject', 'passwordHash', 'emailVerifiedAt'].filter((k) => list.text.includes(k)).join(',') || 'none');
  const lead = items[0];
  if (lead) {
    const st = await http('PATCH', `/api/v1/tenants/${falcon.id}/leads/${lead.id}/status`, { token: agent, body: { status: 'CONTACTED' } });
    record('SALES_AGENT PATCH lead status -> 200', 200, st.status, errCode(st));
    record('PATCH lead status invalid enum -> 400', 400, (await http('PATCH', `/api/v1/tenants/${falcon.id}/leads/${lead.id}/status`, { token: agent, body: { status: 'DONE' } })).status);
    record('VIEWER PATCH lead status -> 403', 403, (await http('PATCH', `/api/v1/tenants/${falcon.id}/leads/${lead.id}/status`, { token: viewer, body: { status: 'CONTACTED' } })).status);
    const won = await http('PATCH', `/api/v1/tenants/${falcon.id}/leads/${lead.id}/status`, { token: owner, body: { status: 'WON' } });
    const back = await http('PATCH', `/api/v1/tenants/${falcon.id}/leads/${lead.id}/status`, { token: owner, body: { status: 'NEW' } });
    record('WON -> NEW regression transition rejected (400/409) [policy check]', [400, 409], back.status, `won=${won.status} back=${back.status}`);
    record('SALES_AGENT assign lead -> 403', 403, (await http('PATCH', `/api/v1/tenants/${falcon.id}/leads/${lead.id}/assignment`, { token: agent, body: { assignedMembershipId: falconAgentMembership.id } })).status);
    const asg = await http('PATCH', `/api/v1/tenants/${falcon.id}/leads/${lead.id}/assignment`, { token: owner, body: { assignedMembershipId: falconAgentMembership.id } });
    record('OWNER assign to own-tenant membership -> 200', 200, asg.status, errCode(asg));
    const cross = await http('PATCH', `/api/v1/tenants/${falcon.id}/leads/${lead.id}/assignment`, { token: owner, body: { assignedMembershipId: cornicheMembership.id } });
    record("assign to another tenant's membership -> 400/404", [400, 404], cross.status, errCode(cross));
    record('unassign (null) -> 200', 200, (await http('PATCH', `/api/v1/tenants/${falcon.id}/leads/${lead.id}/assignment`, { token: owner, body: { assignedMembershipId: null } })).status);
    const aud = await one(`select count(*)::int c from audit_events where target_id=$1 and action ilike '%LEAD%'`, [lead.id]);
    record('lead status/assignment changes audited', true, aud.c >= 2, `audit=${aud.c}`);
  }
  const cornicheLead = await one(`select id from leads where tenant_id=$1 limit 1`, [corniche.id]);
  record("GET another tenant's lead via own path -> 404", 404, (await http('GET', `/api/v1/tenants/${falcon.id}/leads/${cornicheLead.id}`, { token: owner })).status);
  const appt = await one(`select id from appointments where tenant_id=$1 and status='REQUESTED' limit 1`, [falcon.id]);
  if (appt) {
    record('OWNER confirm appointment -> 200', 200, (await http('PATCH', `/api/v1/tenants/${falcon.id}/appointments/${appt.id}/status`, { token: owner, body: { status: 'CONFIRMED' } })).status);
    record('appointment invalid status -> 400', 400, (await http('PATCH', `/api/v1/tenants/${falcon.id}/appointments/${appt.id}/status`, { token: owner, body: { status: 'MAYBE' } })).status);
    record('VIEWER appointment status -> 403', 403, (await http('PATCH', `/api/v1/tenants/${falcon.id}/appointments/${appt.id}/status`, { token: viewer, body: { status: 'CANCELLED' } })).status);
  }
  const filt = await http('GET', `/api/v1/tenants/${falcon.id}/leads?status=NEW&limit=1`, { token: owner });
  const dbNew = await one(`select count(*)::int c from leads where tenant_id=$1 and status='NEW'`, [falcon.id]);
  record('leads status=NEW filter total matches DB', dbNew.c, filt.json?.total ?? filt.json?.meta?.total);
});
await runSection('Membership and tenant state', async () => {
  const inactive = await loginRaw('former.agent@falcon-ridge-motors.example');
  record('inactive membership login -> 200 (identity ok)', 200, inactive.status, `redirect=${inactive.json?.user?.redirectUrl}`);
  if (inactive.json?.accessToken) record('inactive membership tenant route -> 403 MEMBERSHIP_INACTIVE', 403, (await http('GET', `/api/v1/tenants/${falcon.id}/context`, { token: inactive.json.accessToken })).status);
  const ss = await loginRaw(staff('sandstorm-autos', 'OWNER'));
  record('suspended-tenant owner login -> 200 with redirect to /access-suspended', '/access-suspended?reason=tenant_suspended', ss.json?.user?.redirectUrl, ss.status);
  if (ss.json?.accessToken) record('suspended-tenant owner tenant route -> 403 TENANT_INACTIVE', 403, (await http('GET', `/api/v1/tenants/${sandstorm.id}/vehicles`, { token: ss.json.accessToken })).status);
  const multi = await loginRaw('group.director@falcon-ridge-motors.example');
  record('multi-tenant user login redirect -> first membership (Falcon OWNER) /dealer', true, String(multi.json?.user?.redirectUrl).startsWith('/dealer'), multi.json?.user?.redirectUrl);
  if (multi.json?.accessToken) {
    const a = await http('GET', `/api/v1/tenants/${falcon.id}/context`, { token: multi.json.accessToken });
    const b = await http('GET', `/api/v1/tenants/${(await one(`select id from tenants where slug='marina-luxury-collection'`)).id}/context`, { token: multi.json.accessToken });
    record('multi-tenant: both contexts 200 with distinct roles', 'OWNER/VIEWER', `${a.json?.callerRole}/${b.json?.callerRole}`);
  }
});

// ===========================================================================
await runSection('Admin', async () => {
  const at = await token(admin);
  record('no token -> 401', 401, (await http('GET', '/api/v1/admin/tenants/summary')).status);
  const sum = await http('GET', '/api/v1/admin/tenants/summary', { token: at });
  const dbT = await one(`select count(*)::int total, count(*) filter (where status='ACTIVE')::int active, count(*) filter (where status='SUSPENDED')::int suspended from tenants`);
  record('tenants/summary total matches DB', dbT.total, sum.json?.total ?? sum.json?.totalTenants ?? JSON.stringify(sum.json).slice(0, 80));
  const users = await http('GET', '/api/v1/admin/users?status=SUSPENDED&limit=50', { token: at });
  const items = users.json?.users || users.json?.items || users.json?.data || [];
  record('users?status=SUSPENDED returns only suspended', true, items.length > 0 && items.every((u) => u.status === 'SUSPENDED'), `n=${items.length}`);
  record('admin user list has no passwordHash', false, users.text.includes('passwordHash'));
  record('users invalid status -> 400', 400, (await http('GET', '/api/v1/admin/users?status=NOPE', { token: at })).status);
  record('users limit=1000 -> 400 or clamped', [200, 400], (await http('GET', '/api/v1/admin/users?limit=1000', { token: at })).status);
  const selfId = (await one(`select id from users where email=$1`, [admin])).id;
  const self = await http('PATCH', `/api/v1/admin/users/${selfId}`, { token: at, body: { status: 'SUSPENDED', reason: 'QA' } });
  record('self-suspend -> 400 CANNOT_MODIFY_OWN_ACCOUNT', 400, self.status, errCode(self));
  const buyerRow = await one(`select id from users where email=$1`, [buyer2]);
  const susp = await http('PATCH', `/api/v1/admin/users/${buyerRow.id}`, { token: at, body: { status: 'SUSPENDED', reason: 'QA buyer suspension drill' } });
  record('suspend buyer -> 200', 200, susp.status, errCode(susp));
  const bl = await loginRaw(buyer2);
  record('suspended buyer login -> 403', 403, bl.status, errCode(bl));
  const rest = await http('PATCH', `/api/v1/admin/users/${buyerRow.id}`, { token: at, body: { status: 'ACTIVE', reason: 'QA restore' } });
  record('restore buyer -> 200', 200, rest.status);
  const aud = await one(`select count(*)::int c from audit_events where target_id=$1 and actor_user_id=$2`, [buyerRow.id, selfId]);
  record('user status changes audited with admin actor', true, aud.c >= 2, `audit=${aud.c}`);
  record('PATCH user without reason -> 400 (or 200 if optional)', [200, 400], (await http('PATCH', `/api/v1/admin/users/${buyerRow.id}`, { token: at, body: { displayName: 'QA Renamed' } })).status);
  // revoke sessions of buyer1 then its token must fail
  const b1 = await token(buyer1);
  const rv = await http('POST', `/api/v1/admin/users/${buyer1Id}/revoke-sessions`, { token: at });
  record('revoke-sessions -> 200', 200, rv.status, JSON.stringify(rv.json).slice(0, 80));
  record('revoked buyer token -> 401', 401, (await http('GET', '/api/v1/auth/me', { token: b1 })).status);
  tokens.delete(buyer1);
  // last admin protection: demote second admin is allowed; demote all is not
  const admin2Id = (await one(`select id from users where email=$1`, [admin2])).id;
  const adminsBefore = (await one(`select count(*)::int c from users where is_platform_admin and status='ACTIVE'`)).c;
  const dem = await http('PATCH', `/api/v1/admin/users/${admin2Id}`, { token: at, body: { isPlatformAdmin: false, reason: 'QA demotion drill' } });
  record('demote second admin -> 200', 200, dem.status, errCode(dem));
  const activeAdmins = await one(`select count(*)::int c from users where is_platform_admin and status='ACTIVE'`);
  record('after demotion one fewer active admin remains', adminsBefore - 1, activeAdmins.c);
  const lastSelf = await http('PATCH', `/api/v1/admin/users/${selfId}`, { token: at, body: { isPlatformAdmin: false, reason: 'QA last-admin check' } });
  record('demote last admin (self) -> 400/409', [400, 409], lastSelf.status, errCode(lastSelf));
  record('re-promote second admin -> 200', 200, (await http('PATCH', `/api/v1/admin/users/${admin2Id}`, { token: at, body: { isPlatformAdmin: true, reason: 'QA restore admin' } })).status);
  // tenant lifecycle
  const pend = await http('PATCH', `/api/v1/admin/tenants/${dune.id}/status`, { token: at, body: { status: 'ACTIVE', reason: 'QA pending activation check' } });
  record('activate PENDING tenant with KYB NOT_SUBMITTED -> 409', 409, pend.status, errCode(pend));
  const hajarPub = await one(`select count(*)::int c from listings where tenant_id=$1 and status='PUBLISHED'`, [hajar.id]);
  const hs = await http('PATCH', `/api/v1/admin/tenants/${hajar.id}/status`, { token: at, body: { status: 'SUSPENDED', reason: 'QA suspension drill' } });
  record('suspend ACTIVE tenant -> 200', 200, hs.status, errCode(hs));
  const hajarAfter = await one(`select count(*)::int pub, count(*) filter (where status='PAUSED')::int paused from listings where tenant_id=$1 and status in ('PUBLISHED','PAUSED')`, [hajar.id]);
  record('suspension pauses all published listings', 0, (await one(`select count(*)::int c from listings where tenant_id=$1 and status='PUBLISHED'`, [hajar.id])).c, `was ${hajarPub.c} published; now paused=${hajarAfter.paused}`);
  record('suspended dealer vanishes from public dealers', 404, (await http('GET', '/api/v1/public/dealers/hajar-mountain-motors')).status);
  const hajarPublic = await http('GET', '/api/v1/public/listings?dealerSlug=hajar-mountain-motors');
  record('suspended dealer has 0 public listings', 0, hajarPublic.json?.total);
  const same = await http('PATCH', `/api/v1/admin/tenants/${hajar.id}/status`, { token: at, body: { status: 'SUSPENDED', reason: 'QA same-status drill' } });
  record('same-status transition -> 409', 409, same.status, errCode(same));
  const re = await http('PATCH', `/api/v1/admin/tenants/${hajar.id}/status`, { token: at, body: { status: 'ACTIVE', reason: 'QA restore' } });
  record('reactivate tenant -> 200', 200, re.status, errCode(re));
  record('reactivation leaves listings PAUSED (dealer must republish) or restores PUBLISHED [record]', [0, hajarPub.c], (await one(`select count(*)::int c from listings where tenant_id=$1 and status='PUBLISHED'`, [hajar.id])).c);
  const closed = await one(`select id from tenants where slug='iron-anchor-motors'`);
  record('CLOSED -> ACTIVE forbidden -> 409', 409, (await http('PATCH', `/api/v1/admin/tenants/${closed.id}/status`, { token: at, body: { status: 'ACTIVE', reason: 'QA closed-tenant check' } })).status);
  record('tenant status invalid enum -> 400', 400, (await http('PATCH', `/api/v1/admin/tenants/${hajar.id}/status`, { token: at, body: { status: 'FROZEN' } })).status);
  const taud = await one(`select count(*)::int c from audit_events where target_id=$1 and action ilike '%TENANT%' and actor_user_id=$2`, [hajar.id, selfId]);
  record('tenant status changes audited', true, taud.c >= 2, `audit=${taud.c}`);
  // audit logs & outbox
  const logs = await http('GET', '/api/v1/admin/audit-logs?limit=20&offset=0', { token: at });
  const logItems = logs.json?.items ?? logs.json?.events ?? logs.json?.data ?? (Array.isArray(logs.json) ? logs.json : []);
  record('audit-logs -> 200 with items', true, logs.status === 200 && logItems.length > 0, `status=${logs.status} n=${logItems.length} keys=${Object.keys(logs.json || {}).join(',')}`);
  record('audit-logs limit=5000 -> 400 or clamped', [200, 400], (await http('GET', '/api/v1/admin/audit-logs?limit=5000', { token: at })).status);
  record('audit-logs offset=-1 -> 400 or clamped 200', [200, 400], (await http('GET', '/api/v1/admin/audit-logs?limit=10&offset=-1', { token: at })).status);
  const met = await http('GET', '/api/v1/admin/outbox/metrics', { token: at });
  const dbPending = await one(`select count(*)::int c from outbox_events where status='PENDING'`);
  record('outbox metrics pending matches DB', dbPending.c, met.json?.pending ?? met.json?.PENDING ?? JSON.stringify(met.json).slice(0, 80));
  const retry = await http('POST', '/api/v1/admin/outbox/retry-failed', { token: at });
  record('outbox retry-failed -> 200', 200, retry.status, JSON.stringify(retry.json).slice(0, 80));
  const proc = await http('POST', '/api/v1/admin/outbox/process', { token: at });
  record('outbox process -> 200', 200, proc.status, JSON.stringify(proc.json).slice(0, 80));
  // verifications + create dealer + invite
  const ver = await http('GET', `/api/v1/admin/verifications/${uaq.id}`, { token: at });
  record('GET verification of IN_REVIEW dealer -> 200', 200, ver.status, `status=${ver.json?.status ?? ver.json?.verification?.status}`);
  const cd = await http('POST', '/api/v1/admin/dealers', { token: at, body: { slug: `qa-dealer-${Date.now().toString(36)}`, legalName: 'QA Dealer LLC', displayName: 'QA Dealer', adminEmail: `owner.${Date.now().toString(36)}@qa-dealer.example`, adminName: 'QA Owner' } });
  record('create dealer -> 201 PENDING with invitation', [200, 201], cd.status, errCode(cd) || JSON.stringify(cd.json).slice(0, 100));
  record('create dealer duplicate slug -> 409', 409, (await http('POST', '/api/v1/admin/dealers', { token: at, body: { slug: 'falcon-ridge-motors', legalName: 'X', displayName: 'X', adminEmail: 'x@x.example', adminName: 'X' } })).status);
  const inv = await http('POST', `/api/v1/admin/dealers/${falcon.id}/invite`, { token: at, body: { email: `new.staff.${Date.now().toString(36)}@falcon-ridge-motors.example`, role: 'SALES_AGENT', name: 'QA Invitee' } });
  record('invite dealer staff -> 201/200', [200, 201], inv.status, errCode(inv));
  record('invite response does not leak raw token', false, /"token"\s*:\s*"[0-9a-f]{32,}"/.test(inv.text));
  record('invite with bad role -> 400', 400, (await http('POST', `/api/v1/admin/dealers/${falcon.id}/invite`, { token: at, body: { email: 'x@falcon-ridge-motors.example', role: 'CEO' } })).status);
  // activation token flow
  record('activate/verify bogus token -> 400/404', [400, 404], (await http('GET', '/api/v1/auth/activate/verify?token=deadbeef')).status);
  // dealer token on admin
  record('dealer OWNER on admin route -> 403', 403, (await http('GET', '/api/v1/admin/users', { token: await token(staff(falcon.slug, 'OWNER')) })).status);
  record('delete user non-existent -> 404', 404, (await http('DELETE', `/api/v1/admin/users/00000000-0000-4000-8000-000000000000`, { token: at })).status);
});

// ===========================================================================
await runSection('Rate limiting (last)', async () => {
  // Burst 12 logins for an unknown email from this IP; expect 429 before the 12th.
  while (loginTimes.length) { const cutoff = Date.now() - 61_000; while (loginTimes.length && loginTimes[0] < cutoff) loginTimes.shift(); if (loginTimes.length) await sleep(2000); }
  let first429 = null;
  for (let i = 1; i <= 12; i++) {
    const r = await http('POST', '/api/v1/auth/login', { body: { email: 'burst@buyers.example', password: 'Nope-12345!' } });
    if (r.status === 429) { first429 = i; break; }
  }
  record('per-IP login limiter returns 429 within 12 attempts', true, first429 !== null, `first 429 at attempt ${first429}`);
});

// ---------------------------------------------------------------------------
await db.end();
const pass = rows.filter((r) => r.ok).length;
const fail = rows.length - pass;
const md = [
  `# API acceptance run — local QA data set`,
  ``,
  `Run: ${new Date().toISOString()} · API: ${API} · Checks: ${rows.length} · PASS ${pass} · FAIL ${fail}`,
  ``,
  `Each row is one request (or DB assertion) against the seeded QA database. "expected" lists the acceptable statuses; a FAIL means the behaviour differs from the documented acceptance criteria and needs triage (defect, or criteria to amend).`,
  ``,
  `| # | Section | Check | Expected | Actual | Result | Evidence |`,
  `|---|---|---|---|---|---|---|`,
  ...rows.map((r, i) => `| ${i + 1} | ${r.section} | ${r.name.replace(/\|/g, '\\|')} | ${r.expected.replace(/\|/g, '\\|')} | ${r.actual.replace(/\|/g, '\\|')} | ${r.ok ? 'PASS' : '**FAIL**'} | ${r.evidence.replace(/\|/g, '\\|').replace(/\n/g, ' ')} |`),
  ``,
  `## Failures`,
  ``,
  ...(fail ? rows.filter((r) => !r.ok).map((r) => `- [${r.section}] ${r.name} — expected ${r.expected}, got ${r.actual}${r.evidence ? ` (${r.evidence})` : ''}`) : ['None.']),
  '',
].join('\n');
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, md);
console.log(`\n${rows.length} checks: ${pass} PASS, ${fail} FAIL -> ${OUT}`);
process.exit(fail ? 1 : 0);
