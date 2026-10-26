const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3002';
const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'qa', 'cf06', 'implemented');

async function runDevToolsAudit() {
  console.log(`[Chrome DevTools Audit] Launching Chrome browser...`);
  const browser = await chromium.launch({
    headless: true,
  });

  const results = {
    timestamp: new Date().toISOString(),
    screensTested: [],
    findings: [],
  };

  try {
    // ----------------------------------------------------
    // S01: Marketplace Home
    // ----------------------------------------------------
    console.log(`[Chrome DevTools Audit] Probing S01 (Marketplace Home) at ${BASE_URL}...`);
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });

    const s01Response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);

    const s01Audit = await page.evaluate(() => {
      const heroTabs = Array.from(document.querySelectorAll('form button[type="button"]')).map(b => b.textContent?.trim());
      const hasVerifiedDealersSection = !!document.evaluate(
        "//h2[contains(., 'Verified UAE Dealerships')]",
        document,
        null,
        XPathResult.BOOLEAN_TYPE,
        null
      ).booleanValue;

      const dealerHeadings = Array.from(
        document.querySelectorAll('a[href^="/dealers/"] h3')
      ).map(h => h.textContent?.trim());

      const dossierButtons = Array.from(
        document.querySelectorAll('a')
      ).filter(a => a.textContent?.includes('View Dossier & VIN')).length;

      const inertLinks = Array.from(document.querySelectorAll('a[href="#"]')).map(a => a.textContent?.trim());
      const anonymousButtons = Array.from(document.querySelectorAll('button')).filter(
        b => !(b.textContent || b.getAttribute('aria-label') || b.title)?.trim()
      ).length;

      const overflow = Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);

      return {
        heroTabs,
        hasVerifiedDealersSection,
        dealerHeadings,
        dossierButtons,
        inertLinks,
        anonymousButtons,
        overflow,
      };
    });

    console.log(`[Chrome DevTools Audit] S01 Findings:`, JSON.stringify(s01Audit, null, 2));

    // Capture S01 Desktop & Mobile
    const s01DesktopPath = path.join(OUTPUT_DIR, 'S01-Marketplace_Home-1440px.png');
    await page.screenshot({ path: s01DesktopPath, fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    const s01MobilePath = path.join(OUTPUT_DIR, 'S01-Marketplace_Home-390px.png');
    await page.screenshot({ path: s01MobilePath, fullPage: true });

    results.screensTested.push({
      id: 'S01',
      name: 'Marketplace Home',
      url: BASE_URL,
      status: s01Response.status(),
      audit: s01Audit,
    });

    // ----------------------------------------------------
    // S02: Search & Filters (/cars)
    // ----------------------------------------------------
    console.log(`[Chrome DevTools Audit] Probing S02 (Search & Filters) at ${BASE_URL}/cars...`);
    await page.setViewportSize({ width: 1440, height: 900 });
    const s02Response = await page.goto(`${BASE_URL}/cars`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);

    const s02Audit = await page.evaluate(() => {
      const mainHeading = document.querySelector('h1')?.textContent?.trim();
      const sortOptions = Array.from(document.querySelectorAll('select option')).map(o => o.textContent?.trim());
      const dossierButtons = Array.from(
        document.querySelectorAll('a')
      ).filter(a => a.textContent?.includes('View Dossier & VIN')).length;

      const inertLinks = Array.from(document.querySelectorAll('a[href="#"]')).map(a => a.textContent?.trim());
      const anonymousButtons = Array.from(document.querySelectorAll('button')).filter(
        b => !(b.textContent || b.getAttribute('aria-label') || b.title)?.trim()
      ).length;

      const overflow = Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);

      return {
        mainHeading,
        sortOptions,
        dossierButtons,
        inertLinks,
        anonymousButtons,
        overflow,
      };
    });

    console.log(`[Chrome DevTools Audit] S02 Findings:`, JSON.stringify(s02Audit, null, 2));

    const s02DesktopPath = path.join(OUTPUT_DIR, 'S02-Search_Results-1440px.png');
    await page.screenshot({ path: s02DesktopPath, fullPage: true });

    results.screensTested.push({
      id: 'S02',
      name: 'Search Results & Filters',
      url: `${BASE_URL}/cars`,
      status: s02Response.status(),
      audit: s02Audit,
    });

    // ----------------------------------------------------
    // Showroom Directory: /dealers
    // ----------------------------------------------------
    console.log(`[Chrome DevTools Audit] Probing Showroom Directory at ${BASE_URL}/dealers...`);
    const dealersResponse = await page.goto(`${BASE_URL}/dealers`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);

    const dealersAudit = await page.evaluate(() => {
      const heading = document.querySelector('h1')?.textContent?.trim();
      const showroomCards = Array.from(document.querySelectorAll('h3')).map(h => h.textContent?.trim());
      const inertLinks = Array.from(document.querySelectorAll('a[href="#"]')).map(a => a.textContent?.trim());
      const overflow = Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);
      return {
        heading,
        showroomCards,
        inertLinks,
        overflow,
      };
    });

    console.log(`[Chrome DevTools Audit] /dealers Findings:`, JSON.stringify(dealersAudit, null, 2));

    results.screensTested.push({
      id: 'DEALERS_DIR',
      name: 'Verified Dealership Directory',
      url: `${BASE_URL}/dealers`,
      status: dealersResponse.status(),
      audit: dealersAudit,
    });

    // ----------------------------------------------------
    // S06: Verified Dealer Storefront (/dealers/al-quoz)
    // ----------------------------------------------------
    console.log(`[Chrome DevTools Audit] Probing S06 Storefront at ${BASE_URL}/dealers/al-quoz...`);
    const s06Response = await page.goto(`${BASE_URL}/dealers/al-quoz`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);

    const s06Audit = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent?.trim();
      const address = document.querySelector('p')?.textContent?.trim();
      const overflow = Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);
      return {
        title,
        address,
        overflow,
      };
    });

    console.log(`[Chrome DevTools Audit] S06 Storefront Findings:`, JSON.stringify(s06Audit, null, 2));

    const s06DesktopPath = path.join(OUTPUT_DIR, 'S06-Verified_Dealer_Storefront-1440px.png');
    await page.screenshot({ path: s06DesktopPath, fullPage: true });

    results.screensTested.push({
      id: 'S06',
      name: 'Verified Dealer Storefront (Al Quoz)',
      url: `${BASE_URL}/dealers/al-quoz`,
      status: s06Response.status(),
      audit: s06Audit,
    });

    await page.close();
  } finally {
    await browser.close();
  }

  const reportPath = path.join(__dirname, '..', 'docs', 'qa', 'cf06', 'CHROME_DEVTOOLS_AUDIT_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`[Chrome DevTools Audit] Audit complete! Report written to ${reportPath}`);
}

runDevToolsAudit().catch(err => {
  console.error('[Chrome DevTools Audit Error]', err);
  process.exit(1);
});
