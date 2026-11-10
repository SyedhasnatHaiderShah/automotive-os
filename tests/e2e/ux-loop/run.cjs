/**
 * UX quality loop: one full pass over every user-facing URL of the local stack.
 *
 * Each role flow starts from a fresh browser context (no cookies, storage or saved login).
 * Every screen is loaded at each size and mode, scored with one checklist, and screenshotted.
 *
 * Usage (from repo root, local QA stack running, see docs/qa/LOCAL_QA_DATA.md):
 *   node tests/e2e/ux-loop/run.cjs <output-dir> [--only=anon,buyer,dealer,admin]
 *
 * Reads accounts from .qa-credentials.local.json. Prints no credential values.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '../../..');
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const OUT = path.resolve(process.argv[2] || 'test-results/ux-loop');
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '').replace('--only=', '').split(',').filter(Boolean);
const creds = JSON.parse(fs.readFileSync(path.join(ROOT, '.qa-credentials.local.json'), 'utf8'));

const SIZES = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
];
const MODES = [
  { name: 'en', locale: 'en', dir: 'ltr' },
  { name: 'ar', locale: 'ar', dir: 'rtl' },
];

/** The one checklist. Every screen gets every item; an item that cannot apply counts as passed. */
const CHECKS = [
  ['loads', 'Page renders without an error state or 4xx/5xx document'],
  ['noErrors', 'No uncaught script errors or console errors'],
  ['noFailedRequests', 'No failed API or asset requests'],
  ['noOverflow', 'No horizontal page scroll'],
  ['landmarks', 'One main landmark and exactly one visible h1'],
  ['title', 'Document has a specific title'],
  ['names', 'Every control has an accessible name'],
  ['imagesAlt', 'Every image has an alt attribute'],
  ['tapTargets', 'Controls are at least 24x24 px (mobile)'],
  ['contrast', 'Text contrast meets WCAG AA'],
  ['locale', 'html lang and dir match the selected language'],
  ['focusVisible', 'Keyboard focus is visible (desktop, English)'],
];

const account = (pred) => creds.accounts.find((a) => a.status === 'ACTIVE' && pred(a));
const hasRole = (role) => (a) => (a.memberships || []).length === 1 && a.memberships[0].endsWith(':' + role);
const ACCOUNTS = {
  buyer: account((a) => a.kind === 'buyer' && !/no\.profile|locked|unverified/.test(a.email)),
  dealer: account(hasRole('OWNER')),
  admin: account((a) => a.kind === 'platform-admin'),
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function signIn(page, email) {
  await page.goto(BASE + '/auth?tab=login', { waitUntil: 'domcontentloaded' });
  await page.locator('input[type=email]').first().fill(email);
  await page.locator('input[type=password]').first().fill(creds.sharedPassword);
  const resp = page.waitForResponse('**/api/v1/auth/login');
  await page.locator('form button[type=submit]').first().click();
  const status = (await resp).status();
  if (status !== 200) throw new Error(`login returned ${status}`);
  await page.waitForURL((u) => !u.pathname.startsWith('/auth'), { timeout: 60000 });
}

/** First href on `listPath` matching `pattern`, as a path. */
async function discover(page, listPath, pattern) {
  await page.goto(BASE + listPath, { waitUntil: 'domcontentloaded' });
  try {
    await page.waitForFunction((src) => [...document.querySelectorAll('a[href]')].some((a) => new RegExp(src).test(a.getAttribute('href'))), pattern.source, { timeout: 20000 });
  } catch {
    return null;
  }
  return page.evaluate((src) => {
    const a = [...document.querySelectorAll('a[href]')].find((el) => new RegExp(src).test(el.getAttribute('href')));
    return a ? new URL(a.href).pathname : null;
  }, pattern.source);
}

/** Runs inside the page: everything the checklist needs that the DOM can answer. */
function inspect(expect) {
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      if (n.hasAttribute('inert') || n.getAttribute('aria-hidden') === 'true') return false;
    }
    return true;
  };
  const srOnly = (el) => {
    const r = el.getBoundingClientRect();
    return r.width <= 1 && r.height <= 1;
  };
  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className.split(/\s+/).slice(0, 3).join('.') : '';
    const text = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.getAttribute('name') || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''} "${text}"`;
  };
  const out = {};

  const body = (document.body.innerText || '');
  out.errorText = (body.match(/Something went wrong|Application error|Unhandled Runtime Error|Internal Server Error|HTTP 5\d\d|This page could not be found/i) || [null])[0];
  out.overflow = Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
  out.notFound = /\b404\b/.test(body) && /not found/i.test(body);
  // Landmarks are counted even behind an open modal, which makes the page inert but not absent.
  const rendered = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  };
  out.mains = [...document.querySelectorAll('main, [role=main]')].filter(rendered).length;
  out.h1s = [...document.querySelectorAll('h1')].filter(rendered).length;
  out.title = document.title;
  out.lang = document.documentElement.lang;
  out.dir = document.documentElement.dir || getComputedStyle(document.documentElement).direction;

  // Accessible names.
  const labelText = (el) => {
    const ids = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
    const viaIds = ids.map((id) => document.getElementById(id)?.textContent || '').join(' ').trim();
    if (viaIds) return viaIds;
    if (el.getAttribute('aria-label')?.trim()) return el.getAttribute('aria-label').trim();
    if (el.id) {
      const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (l?.textContent.trim()) return l.textContent.trim();
    }
    const wrap = el.closest('label');
    if (wrap?.textContent.trim()) return wrap.textContent.trim();
    if (el.getAttribute('title')?.trim()) return el.getAttribute('title').trim();
    return '';
  };
  const contentName = (el) => {
    const text = (el.textContent || '').trim();
    if (text) return text;
    const img = el.querySelector('img[alt], svg[aria-label], [aria-label]');
    return img ? (img.getAttribute('alt') || img.getAttribute('aria-label') || '').trim() : '';
  };
  const controls = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=link], [role=tab], [role=switch], [role=checkbox]')].filter(visible);
  out.unnamed = controls
    .filter((el) => {
      const tag = el.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
        if (['submit', 'button', 'reset'].includes(el.type)) return !(el.value || labelText(el));
        return !labelText(el);
      }
      return !(labelText(el) || contentName(el));
    })
    .map(describe);

  out.imagesNoAlt = [...document.querySelectorAll('img')]
    .filter((el) => visible(el) && (!el.hasAttribute('alt') || (el.complete && el.naturalWidth === 0)))
    .map((el) => `${el.hasAttribute('alt') ? 'broken' : 'no alt'} ${(el.getAttribute('src') || '').slice(-50)}`);

  // Tap targets (WCAG 2.2 AA 2.5.8). Links inside a line of text are exempt.
  out.smallTargets = !expect.mobile ? [] : controls
    .filter((el) => {
      if (srOnly(el)) return false;
      let r = el.getBoundingClientRect();
      if ((el.type === 'checkbox' || el.type === 'radio') && el.closest('label')) r = el.closest('label').getBoundingClientRect();
      if (r.width >= 24 && r.height >= 24) return false;
      if (el.tagName === 'A' && getComputedStyle(el).display === 'inline') {
        const parentText = (el.parentElement?.textContent || '').trim();
        if (parentText.length > (el.textContent || '').trim().length) return false;
      }
      return true;
    })
    .map((el) => `${describe(el)} ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`);

  // Contrast. Background is resolved by blending ancestors; text over images or gradients is skipped.
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const over = (top, bottom) => ({
    r: top.r * top.a + bottom.r * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a),
    a: 1,
  });
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const background = (el) => {
    const layers = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.backgroundImage !== 'none' || s.backdropFilter !== 'none' && s.backdropFilter !== undefined && s.backdropFilter !== '') return null;
      if (Number(s.opacity) < 1) return null;
      const c = parse(s.backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a === 1) break;
      }
      if (s.position === 'fixed' || s.position === 'absolute') {
        if (!layers.length || layers[layers.length - 1].a < 1) return null;
      }
    }
    if (!layers.length || layers[layers.length - 1].a < 1) layers.push({ r: 255, g: 255, b: 255, a: 1 });
    return layers.reverse().reduce((acc, l) => over(l, acc));
  };
  const lowContrast = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue.trim();
    if (text.length < 2) continue;
    const el = node.parentElement;
    if (!el || !visible(el) || srOnly(el) || el.closest('[disabled], [aria-disabled=true]')) continue;
    const s = getComputedStyle(el);
    if (/material-symbols|material-icons/.test(el.className)) continue;
    const fg = parse(s.color);
    const bg = background(el);
    if (!fg || !bg) continue;
    const color = fg.a < 1 ? over(fg, bg) : fg;
    const l1 = lum(color), l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const size = parseFloat(s.fontSize);
    const large = size >= 24 || (size >= 18.66 && Number(s.fontWeight) >= 700);
    if (ratio < (large ? 3 : 4.5)) {
      const key = `${s.color} on rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`;
      if (!lowContrast.has(key)) lowContrast.set(key, `${ratio.toFixed(2)}:1 ${key} ${describe(el)}`);
    }
  }
  out.lowContrast = [...lowContrast.values()];
  return out;
}

/** Tabs through the first controls and reports any that show no focus indicator. */
async function focusProblems(page) {
  await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0); });
  const problems = [];
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    const res = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      // The Next.js dev indicator is not part of the product.
      if (el.tagName.toLowerCase().startsWith('nextjs-')) return null;
      const s = getComputedStyle(el);
      const outline = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
      const ring = s.boxShadow && s.boxShadow !== 'none';
      const cls = typeof el.className === 'string' ? el.className.split(/\s+/).slice(0, 3).join('.') : '';
      return { ok: outline || ring, what: `${el.tagName.toLowerCase()}.${cls} "${(el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 30)}"` };
    });
    if (res && !res.ok) problems.push(res.what);
  }
  return [...new Set(problems)];
}

async function scoreScreen(page, screen, size, mode, shotPath) {
  const consoleErrors = [];
  const failed = [];
  const onConsole = (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 160)); };
  const onPageError = (e) => consoleErrors.push('pageerror: ' + String(e).slice(0, 160));
  const onResponse = (r) => {
    const url = r.url();
    if (r.status() < 400 || !url.startsWith(BASE)) return;
    // Anonymous session probes legitimately answer 401.
    if (r.status() === 401 && /\/api\/v1\/(auth\/(me|refresh|session)|me\b)/.test(url)) return;
    // The local QA stack has no object storage (docs/qa/LOCAL_QA_DATA.md), so seeded photo URLs answer 404.
    // What the user sees is scored instead: a broken image fails the image check.
    if (r.status() === 404 && url.includes('/api/v1/public/media/')) return;
    failed.push(`${r.status()} ${url.replace(BASE, '').slice(0, 90)}`);
  };
  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  page.on('response', onResponse);

  let status = 0;
  let navError = null;
  try {
    const resp = await page.goto(BASE + screen.path, { waitUntil: 'domcontentloaded', timeout: 90000 });
    status = resp ? resp.status() : 0;
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(250);
  } catch (e) {
    navError = String(e).slice(0, 160);
  }

  const finalPath = new URL(page.url()).pathname;
  let dom = null;
  try {
    dom = await page.evaluate(inspect, { mobile: size.name === 'mobile' });
  } catch (e) {
    navError = navError || String(e).slice(0, 160);
  }
  const focus = dom && size.name === 'desktop' && mode.name === 'en' ? await focusProblems(page).catch(() => []) : [];
  await page.screenshot({ path: shotPath, type: 'jpeg', quality: 55 }).catch(() => {});

  page.off('console', onConsole);
  page.off('pageerror', onPageError);
  page.off('response', onResponse);

  const wrongPlace = screen.expectPath && !new RegExp(screen.expectPath).test(finalPath);
  const consoleReal = consoleErrors.filter((t) => !/Failed to load resource/.test(t));
  const d = dom || {};
  // A route that is switched off must answer with the not-found page; every other route must not.
  const notFoundOk = screen.expectNotFound ? d.notFound : !d.notFound && status < 400;
  const results = {
    loads: [!navError && notFoundOk && !d.errorText && !wrongPlace, navError || (wrongPlace ? `ended at ${finalPath}` : d.errorText ? `"${d.errorText}"` : d.notFound ? 'not-found page' : `HTTP ${status}`)],
    noErrors: [consoleReal.length === 0, consoleReal.slice(0, 3).join(' | ')],
    noFailedRequests: [failed.length === 0, [...new Set(failed)].slice(0, 4).join(' | ')],
    noOverflow: [d.overflow === 0, `${d.overflow}px`],
    landmarks: [d.mains === 1 && d.h1s === 1, `main=${d.mains} h1=${d.h1s}`],
    title: [Boolean(d.title) && !/^(localhost|Create Next App|Untitled)?$/i.test(d.title || ''), `"${d.title}"`],
    names: [(d.unnamed || []).length === 0, (d.unnamed || []).slice(0, 4).join(' | ')],
    imagesAlt: [(d.imagesNoAlt || []).length === 0, (d.imagesNoAlt || []).slice(0, 3).join(' | ')],
    tapTargets: [(d.smallTargets || []).length === 0, (d.smallTargets || []).slice(0, 4).join(' | ')],
    contrast: [(d.lowContrast || []).length === 0, (d.lowContrast || []).slice(0, 4).join(' | ')],
    locale: [d.lang === mode.locale && d.dir === mode.dir, `lang=${d.lang} dir=${d.dir}`],
    focusVisible: [focus.length === 0, focus.slice(0, 3).join(' | ')],
  };
  const fails = Object.entries(results).filter(([, [ok]]) => !ok).map(([key, [, detail]]) => ({ check: key, detail }));
  return { flow: screen.flow, path: screen.path, finalPath, size: size.name, mode: mode.name, passed: CHECKS.length - fails.length, total: CHECKS.length, fails, shot: path.basename(shotPath) };
}

async function runFlow(browser, name, build) {
  // Fresh state: a new context has no cookies, storage or saved login.
  const context = await browser.newContext({ viewport: SIZES[0] });
  const page = await context.newPage();
  const rows = [];
  try {
    const screens = (await build(page)).map((s) => ({ ...s, flow: name }));
    for (const mode of MODES) {
      await context.addCookies([{ name: 'ao_locale', value: mode.locale, url: BASE }]);
      for (const size of SIZES) {
        await page.setViewportSize({ width: size.width, height: size.height });
        for (const screen of screens) {
          const slug = screen.path.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home';
          const shot = path.join(OUT, 'shots', `${name}__${slug.slice(0, 60)}__${size.name}__${mode.name}.jpg`);
          const row = await scoreScreen(page, screen, size, mode, shot);
          rows.push(row);
          process.stdout.write(row.passed === row.total ? '.' : 'x');
        }
      }
    }
  } catch (e) {
    rows.push({ flow: name, path: '(flow setup)', size: '-', mode: '-', passed: 0, total: CHECKS.length, fails: [{ check: 'loads', detail: String(e).slice(0, 200) }] });
  }
  await context.close();
  process.stdout.write(` ${name}\n`);
  return rows;
}

const FLOWS = {
  anon: async (page) => {
    const car = await discover(page, '/cars', /^\/cars\/[^/?#]+$/);
    const dealer = await discover(page, '/dealers', /^\/dealers\/[^/?#]+$/);
    return [
      { path: '/' }, { path: '/cars' }, { path: '/dealers' }, { path: '/compare' },
      ...(car ? [{ path: car }, { path: car + '/enquire' }, { path: car + '/enquiry' }] : [{ path: '/cars/(none-found)' }]),
      ...(dealer ? [{ path: dealer }] : [{ path: '/dealers/(none-found)' }]),
      { path: '/auth' }, { path: '/auth/login' }, { path: '/auth/register' }, { path: '/auth/forgot-password' },
      { path: '/auth/verify-email' }, { path: '/auth/activate' },
      { path: '/access-denied' }, { path: '/access-suspended' },
      // Signed-out visitors to private areas must land on sign-in, not on an error.
      { path: '/account/garage', expectPath: '^/auth' }, { path: '/dashboard', expectPath: '^/auth' },
      { path: '/dealer', expectPath: '^/auth' }, { path: '/admin', expectPath: '^/auth' },
    ];
  },
  buyer: async (page) => {
    await signIn(page, ACCOUNTS.buyer.email);
    return ['/dashboard', '/account/garage', '/account/enquiries', '/account/saved', '/account/profile', '/account/profile/dossier', '/account/settings']
      .map((p) => ({ path: p }));
  },
  dealer: async (page) => {
    await signIn(page, ACCOUNTS.dealer.email);
    // Preview modules (sales, workshop, parts, finance, accounting, fleet) are switched off unless
    // NEXT_PUBLIC_ENABLE_PREVIEW_MODULES=true (DL-07), so each must show the not-found page.
    const preview = ['/dealer/sales', '/dealer/workshop', '/dealer/parts', '/dealer/finance', '/dealer/finance/exception', '/dealer/accounting',
      '/dealer/accounting/exception/export', '/dealer/fleet', '/dealer/fleet/exception'];
    return [
      ...['/dealer', '/dealer/dashboard', '/dealer/inventory', '/dealer/inventory?intake=1', '/dealer/leads', '/dealer/appointments', '/dealer/settings'].map((p) => ({ path: p })),
      ...preview.map((p) => ({ path: p, expectNotFound: true })),
    ];
  },
  admin: async (page) => {
    await signIn(page, ACCOUNTS.admin.email);
    const listing = await discover(page, '/admin/moderation', /^\/admin\/moderation\/listings\/[^/?#]+$/);
    const verification = await discover(page, '/admin/verifications', /^\/admin\/verifications\/[^/?#]+$/);
    const model = await discover(page, '/admin/data', /^\/admin\/data\/[^/?#]+$/);
    const record = model ? await discover(page, model, new RegExp(`^${model}/(?!new$)[^/?#]+$`)) : null;
    return [
      '/admin', '/admin/users', '/admin/dealers', '/admin/verifications', '/admin/moderation', '/admin/disputes', '/admin/audit-logs', '/admin/data',
      ...(verification ? [verification] : []), ...(listing ? [listing] : []),
      ...(model ? [model, model + '/new'] : []), ...(record ? [record] : []),
    ].map((p) => ({ path: p }));
  },
};

(async () => {
  fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
  const browser = await chromium.launch();
  const rows = [];
  for (const [name, build] of Object.entries(FLOWS)) {
    if (ONLY.length && !ONLY.includes(name)) continue;
    rows.push(...(await runFlow(browser, name, build)));
    await sleep(7000); // stay under the login rate limit between flows
  }
  await browser.close();

  const sum = (list) => list.reduce((a, r) => ({ passed: a.passed + r.passed, total: a.total + r.total }), { passed: 0, total: 0 });
  const pct = ({ passed, total }) => (total ? ((100 * passed) / total).toFixed(2) : '0.00');
  const byFlow = {};
  for (const r of rows) (byFlow[r.flow] ||= []).push(r);
  const byCheck = {};
  for (const [key] of CHECKS) byCheck[key] = rows.filter((r) => r.fails.some((f) => f.check === key)).length;
  const summary = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    screens: rows.length,
    score: pct(sum(rows)),
    flows: Object.fromEntries(Object.entries(byFlow).map(([k, v]) => [k, { screens: v.length, score: pct(sum(v)) }])),
    failingScreensByCheck: byCheck,
  };
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ summary, checks: CHECKS, rows }, null, 1));

  // Distinct problems, most widespread first.
  const problems = new Map();
  for (const r of rows) {
    for (const f of r.fails) {
      const key = `${r.flow} ${r.path} | ${f.check}`;
      const p = problems.get(key) || { count: 0, where: new Set(), detail: f.detail };
      p.count++;
      p.where.add(`${r.size}/${r.mode}`);
      problems.set(key, p);
    }
  }
  const lines = [...problems.entries()].sort((a, b) => b[1].count - a[1].count).map(([k, p]) => `${k} | ${p.count}x (${[...p.where].join(' ')}) | ${p.detail}`);
  fs.writeFileSync(path.join(OUT, 'problems.txt'), lines.join('\n') + '\n');
  console.log(JSON.stringify(summary, null, 1));
  console.log(`problems: ${lines.length} distinct, see ${path.join(OUT, 'problems.txt')}`);
})().catch((e) => { console.error(String(e).slice(0, 600)); process.exit(1); });
