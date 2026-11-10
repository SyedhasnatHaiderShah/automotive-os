import { test, expect, type Page } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Design / eye-visibility audit (run on demand: DESIGN_AUDIT=1).
 * For each page and viewport it measures, in the real DOM:
 *  - text contrast against the effective background (WCAG 2.x ratios)
 *  - text smaller than 12px, and body text smaller than 14px on mobile
 *  - interactive targets smaller than 24x24 (desktop) / 44x44 (mobile)
 *  - controls without an accessible name, inputs without a label
 *  - images without alt or without intrinsic dimensions
 *  - heading structure (one h1, no skipped levels)
 *  - keyboard focus visibility on the first 25 focusable elements
 *  - horizontal overflow at 390px
 *  - `transition: all` on interactive elements
 * Findings are written to docs/qa/evidence/design-audit-2026-11-06/findings.json
 * (or the folder named by DESIGN_AUDIT_OUT, relative to the repo root)
 * with a screenshot per page/viewport. It never asserts; it reports.
 */
const enabled = process.env.DESIGN_AUDIT === '1';
test.skip(!enabled, 'set DESIGN_AUDIT=1 to run the design audit');

const credentialsPath = resolve(__dirname, '../../.qa-credentials.local.json');
const creds = existsSync(credentialsPath) ? JSON.parse(readFileSync(credentialsPath, 'utf8')) : null;
// DESIGN_AUDIT_OUT lets a rerun keep the earlier evidence folder as its baseline.
const OUT = resolve(__dirname, '../..', process.env.DESIGN_AUDIT_OUT ?? 'docs/qa/evidence/design-audit-2026-11-06');
mkdirSync(OUT, { recursive: true });

type Persona = 'public' | 'buyer' | 'owner' | 'admin';
const PAGES: Array<{ path: string; persona: Persona; name: string }> = [
  { path: '/', persona: 'public', name: 'home' },
  { path: '/cars?make=toyota', persona: 'public', name: 'cars' },
  { path: '/cars/2026-rolls-royce-cullinan-dubai-edge-max', persona: 'public', name: 'car-detail' },
  { path: '/dealers', persona: 'public', name: 'dealers' },
  { path: '/dealers/falcon-ridge-motors', persona: 'public', name: 'storefront' },
  { path: '/compare', persona: 'public', name: 'compare' },
  { path: '/auth?tab=login', persona: 'public', name: 'auth-login' },
  { path: '/auth?tab=register', persona: 'public', name: 'auth-register' },
  { path: '/auth/forgot-password', persona: 'public', name: 'forgot-password' },
  { path: '/account/garage', persona: 'buyer', name: 'buyer-garage' },
  { path: '/account/enquiries', persona: 'buyer', name: 'buyer-enquiries' },
  { path: '/account/saved', persona: 'buyer', name: 'buyer-saved' },
  { path: '/account/profile', persona: 'buyer', name: 'buyer-profile' },
  { path: '/account/settings', persona: 'buyer', name: 'buyer-settings' },
  { path: '/dealer', persona: 'owner', name: 'dealer-dashboard' },
  { path: '/dealer/inventory', persona: 'owner', name: 'dealer-inventory' },
  { path: '/dealer/leads', persona: 'owner', name: 'dealer-leads' },
  { path: '/admin', persona: 'admin', name: 'admin-home' },
  { path: '/admin/users', persona: 'admin', name: 'admin-users' },
  { path: '/admin/dealers', persona: 'admin', name: 'admin-dealers' },
  { path: '/admin/audit-logs', persona: 'admin', name: 'admin-audit' },
  { path: '/admin/verifications', persona: 'admin', name: 'admin-verifications' },
  { path: '/admin/moderation', persona: 'admin', name: 'admin-moderation' },
  { path: '/admin/data', persona: 'admin', name: 'admin-data' },
  { path: '/admin/data/Vehicle', persona: 'admin', name: 'admin-data-vehicle' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const EMAIL: Record<Exclude<Persona, 'public'>, string> = {
  buyer: creds?.accounts.find((a: any) => a.email.endsWith('1@buyers.example'))?.email ?? '',
  owner: creds?.accounts.find((a: any) => a.memberships?.includes('falcon-ridge-motors:OWNER'))?.email ?? '',
  admin: 'ops.admin@automotive-os.example',
};

async function signIn(page: Page, persona: Exclude<Persona, 'public'>) {
  await page.goto('/auth?tab=login', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => undefined);
  const email = page.getByPlaceholder('user@autonexa.ae');
  await email.fill(EMAIL[persona]);
  await expect(email).toHaveValue(EMAIL[persona]);
  await page.locator('form input[type="password"]').first().fill(creds.sharedPassword);
  await page.getByRole('button', { name: /Sign In to Dashboard/i }).click();
  await page.waitForURL(/\/(account|dealer|admin)/, { timeout: 25000 });
}

// Runs inside the page: returns structured findings for the current document.
const AUDIT_SCRIPT = `(() => {
  const findings = [];
  const isMobile = window.innerWidth < 700;
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0' && !el.closest('[aria-hidden="true"]') && !el.closest('.sr-only');
  };
  const sel = (el) => {
    const parts = [];
    let n = el;
    while (n && n.nodeType === 1 && parts.length < 4) {
      let s = n.tagName.toLowerCase();
      if (n.id) { s += '#' + n.id; parts.unshift(s); break; }
      const cls = [...n.classList].filter(c => /^(text|bg|font|rounded|border|opacity)-/.test(c)).slice(0, 2).join('.');
      if (cls) s += '.' + cls;
      parts.unshift(s);
      n = n.parentElement;
    }
    return parts.join(' > ');
  };
  const parse = (c) => {
    const m = c.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(',').map(x => parseFloat(x));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const blend = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const effBg = (el) => {
    let n = el; const layers = [];
    while (n && n.nodeType === 1) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null; // gradient/image: unknown
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
      n = n.parentElement;
    }
    let bg = { r: 16, g: 20, b: 25, a: 1 }; // #101419 canvas default
    for (let i = layers.length - 1; i >= 0; i--) bg = blend(layers[i], bg);
    return bg;
  };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };

  // text nodes
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  let t;
  while ((t = walker.nextNode())) {
    const txt = t.textContent.replace(/\\s+/g, ' ').trim();
    if (txt.length < 2) continue;
    const el = t.parentElement;
    if (!el || seen.has(el) || !vis(el)) continue;
    if (['SCRIPT','STYLE','NOSCRIPT','OPTION'].includes(el.tagName)) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize);
    const weight = parseInt(cs.fontWeight, 10) || 400;
    const fg = parse(cs.color);
    const bg = effBg(el);
    if (fg && bg) {
      const fgB = fg.a < 1 ? blend(fg, bg) : fg;
      const r = ratio(fgB, bg);
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      const need = large ? 3 : 4.5;
      if (r < need) findings.push({ type: 'contrast', severity: r < need * 0.75 ? 'High' : 'Medium', ratio: +r.toFixed(2), need, fontSize: size, text: txt.slice(0, 60), selector: sel(el), color: cs.color, bg: 'rgb(' + Math.round(bg.r) + ',' + Math.round(bg.g) + ',' + Math.round(bg.b) + ')' });
    }
    if (size < 12) findings.push({ type: 'tiny-text', severity: size < 10 ? 'High' : 'Medium', fontSize: size, text: txt.slice(0, 60), selector: sel(el) });
    else if (isMobile && size < 14 && txt.length > 40) findings.push({ type: 'small-body-mobile', severity: 'Low', fontSize: size, text: txt.slice(0, 60), selector: sel(el) });
  }

  // interactive targets & names
  const min = isMobile ? 44 : 24;
  for (const el of document.querySelectorAll('a[href], button, input, select, textarea, [role="button"], [role="link"], [role="tab"], [role="checkbox"]')) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    const tag = el.tagName.toLowerCase();
    if (tag !== 'input' || !['checkbox','radio'].includes(el.type)) {
      if (r.width < min || r.height < min) {
        if (!(tag === 'a' && getComputedStyle(el).display === 'inline' && (el.closest('p') || el.closest('td')))) {
          findings.push({ type: 'small-target', severity: isMobile ? 'Medium' : 'Low', size: Math.round(r.width) + 'x' + Math.round(r.height), min, text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40), selector: sel(el) });
        }
      }
    } else if (r.width < 20 || r.height < 20) {
      findings.push({ type: 'small-target', severity: 'Low', size: Math.round(r.width) + 'x' + Math.round(r.height), min: 20, text: tag + ':' + el.type, selector: sel(el) });
    }
    if (['a','button'].includes(tag) || el.getAttribute('role') === 'button') {
      const name = (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').replace(/\\s+/g,' ').trim();
      const img = el.querySelector('img[alt]');
      if (!name && !(img && img.getAttribute('alt'))) findings.push({ type: 'no-accessible-name', severity: 'High', selector: sel(el), html: el.outerHTML.slice(0, 120) });
    }
    if (['input','select','textarea'].includes(tag) && !['hidden','submit','button'].includes(el.type)) {
      const labelled = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || (el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]')) || el.closest('label');
      if (!labelled) findings.push({ type: 'unlabelled-input', severity: 'High', selector: sel(el), placeholder: el.getAttribute('placeholder') || '' });
    }
    const cs = getComputedStyle(el);
    if (/^all\\b/.test(cs.transitionProperty) && parseFloat(cs.transitionDuration) > 0) findings.push({ type: 'transition-all', severity: 'Low', selector: sel(el) });
  }

  // images
  for (const img of document.querySelectorAll('img')) {
    if (!vis(img)) continue;
    if (!img.hasAttribute('alt')) findings.push({ type: 'img-no-alt', severity: 'High', src: (img.getAttribute('src') || '').slice(0, 80), selector: sel(img) });
    if (!img.getAttribute('width') && !img.getAttribute('height') && !getComputedStyle(img).aspectRatio.match(/\\d/)) findings.push({ type: 'img-no-dimensions', severity: 'Low', src: (img.getAttribute('src') || '').slice(0, 80) });
  }

  // headings
  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(vis).map(h => parseInt(h.tagName[1], 10));
  const h1s = hs.filter(l => l === 1).length;
  if (h1s !== 1) findings.push({ type: 'heading-h1-count', severity: h1s === 0 ? 'Medium' : 'Low', count: h1s });
  for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i - 1] + 1) { findings.push({ type: 'heading-skip', severity: 'Low', from: 'h' + hs[i - 1], to: 'h' + hs[i] }); break; }

  // overflow
  if (document.documentElement.scrollWidth > window.innerWidth + 1) findings.push({ type: 'horizontal-overflow', severity: 'Medium', scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth });

  // landmarks
  if (!document.querySelector('main')) findings.push({ type: 'no-main-landmark', severity: 'Medium' });
  if (!document.querySelector('a[href^="#"]:is(.sr-only, .skip-link), a[href="#main"], a[href="#content"]')) findings.push({ type: 'no-skip-link', severity: 'Low' });

  return findings;
})()`;

const FOCUS_SCRIPT = `(async () => {
  const out = [];
  const els = [...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest('[aria-hidden="true"]') && !el.disabled && getComputedStyle(el).visibility === 'visible'; }).slice(0, 25);
  // A transparent outline (Tailwind's outline-none) is no indicator, so it must not count as a change.
  const clear = (c) => c === 'transparent' || c.endsWith(', 0)');
  const snap = (el) => { const cs = getComputedStyle(el); const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 && !clear(cs.outlineColor) ? [cs.outlineStyle, cs.outlineWidth, cs.outlineColor].join(' ') : 'none'; return [outline, cs.boxShadow, cs.backgroundColor, cs.borderColor, cs.color].join('|'); };
  for (const el of els) {
    const before = snap(el);
    el.focus({ preventScroll: true });
    // emulate keyboard focus so :focus-visible applies in Chromium
    let after = snap(el);
    const fv = el.matches(':focus-visible');
    // Elements that cannot take focus (disabled, hidden) are not keyboard stops: nothing to measure.
    if (document.activeElement !== el) continue;
    // An indicator that fades in (transition-all) has not changed yet: sample again once it has settled.
    if (before === after) { await new Promise((r) => setTimeout(r, 350)); after = snap(el); }
    el.blur();
    if (before === after) out.push({ type: 'focus-not-visible', severity: fv ? 'High' : 'Medium', focusVisibleMatched: fv, text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40), tag: el.tagName.toLowerCase() });
  }
  return out;
})()`;

test.describe('design audit', () => {
  test.setTimeout(20 * 60 * 1000);
  test('measure every page and viewport', async ({ browser }) => {
    const report: Record<string, unknown>[] = [];
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      let current: Persona = 'public';
      for (const p of PAGES) {
        if (p.persona !== 'public' && p.persona !== current) {
          if (!creds) continue;
          await signIn(page, p.persona);
          current = p.persona;
        }
        await page.goto(p.path, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => undefined);
        await page.waitForTimeout(800);
        const findings = (await page.evaluate(AUDIT_SCRIPT)) as Record<string, unknown>[];
        const focus = (await page.evaluate(FOCUS_SCRIPT)) as Record<string, unknown>[];
        await page.screenshot({ path: `${OUT}/${p.name}-${vp.name}.png`, fullPage: true }).catch(() => undefined);
        report.push({ page: p.name, path: p.path, viewport: vp.name, url: page.url(), findings: [...findings, ...focus] });
        console.log(`${vp.name} ${p.name}: ${findings.length} findings, ${focus.length} focus issues`);
      }
      // RTL pass on desktop for a few representative pages
      if (vp.name === 'desktop') {
        await context.addCookies([{ name: 'ao_locale', value: 'ar', domain: 'localhost', path: '/' }]);
        for (const p of PAGES.filter((x) => ['home', 'cars', 'car-detail', 'dealer-inventory', 'admin-users', 'admin-data-vehicle'].includes(x.name))) {
          await page.goto(p.path, { waitUntil: 'domcontentloaded' });
          await page.waitForLoadState('networkidle').catch(() => undefined);
          await page.waitForTimeout(800);
          const dir = await page.evaluate(() => document.documentElement.getAttribute('dir'));
          const findings = (await page.evaluate(AUDIT_SCRIPT)) as Record<string, unknown>[];
          await page.screenshot({ path: `${OUT}/${p.name}-rtl.png`, fullPage: true }).catch(() => undefined);
          report.push({ page: p.name, path: p.path, viewport: 'desktop-rtl', htmlDir: dir, url: page.url(), findings });
        }
        await context.clearCookies();
      }
      await context.close();
    }
    writeFileSync(`${OUT}/findings.json`, JSON.stringify(report, null, 2));
    expect(report.length).toBeGreaterThan(0);
  });
});
