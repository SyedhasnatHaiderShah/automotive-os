const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const evidenceDir = path.resolve(__dirname, '../docs/qa/evidence/S10');
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

async function runVerification() {
  console.log('--- Starting S10 Saved Searches & Favorites Verification ---');
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. Navigation & HTTP Status
    const response = await page.goto('http://localhost:3000/account/saved', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    const status = response ? response.status() : 0;
    results.push({
      check: 'HTTP 200 Response',
      passed: status === 200,
      details: `Status code: ${status}`,
    });

    // 2. Editorial Header & Titles
    await page.waitForSelector('h1', { timeout: 10000 });
    const h1Text = await page.locator('h1').textContent();
    const titleMatch = h1Text && h1Text.includes('Saved Searches & Vehicle Favorites');
    results.push({
      check: 'Saved Searches & Favorites Header Rendered',
      passed: Boolean(titleMatch),
      details: `Title: "${h1Text?.trim()}"`,
    });

    // 3. Arabic Subtitle Presence
    const bodyText = await page.locator('body').innerText();
    const arabicSubtitle = bodyText.includes('المركبات المحفوظة والتنبيهات المخصصة');
    results.push({
      check: 'Arabic Mirror Subtitle Rendered',
      passed: arabicSubtitle,
      details: `Arabic text: ${arabicSubtitle ? 'Present' : 'Missing'}`,
    });

    // 4. Registry Status & GCC Live Badges
    const rtaRegistry = bodyText.includes('RTA & TASJEEL REGISTRY SYNC: ACTIVE');
    const gccLive = bodyText.includes('GCC LIVE');
    results.push({
      check: 'RTA & TASJEEL Registry Sync Badges',
      passed: rtaRegistry && gccLive,
      details: `Registry Sync: ${rtaRegistry}, GCC Live: ${gccLive}`,
    });

    // 5. Portfolio Value Metric Tile
    const portfolioVal = bodyText.includes('4,585,000') && bodyText.includes('-AED 25,000 net variance (7d)');
    results.push({
      check: 'Portfolio Value Tracked Metric Tile',
      passed: portfolioVal,
      details: `Portfolio Metric: ${portfolioVal ? 'Verified' : 'Missing'}`,
    });

    // 6. Navigation Tabs
    const tabFavs = bodyText.includes('Favorites / Bookmarked Cars');
    const tabRadars = bodyText.includes('Automated Saved Searches');
    const tabArchived = bodyText.includes('Archived & Sold');
    results.push({
      check: 'Main Navigation Tabs (Favs, Radars, Archived)',
      passed: tabFavs && tabRadars && tabArchived,
      details: `Favs: ${tabFavs}, Radars: ${tabRadars}, Archived: ${tabArchived}`,
    });

    // 7. Active Surveillance Radars
    const radar1 = bodyText.includes('RADAR #DXB-911') && bodyText.includes('Porsche 911 GT3 / GT3 RS');
    const radar2 = bodyText.includes('RADAR #G63-ED50') && bodyText.includes('Mercedes-AMG G 63 UAE Edition');
    const radar3 = bodyText.includes('RADAR #MARANELLO-V6') && bodyText.includes('Ferrari 296 GTB / 812 GTS');
    results.push({
      check: '3 Active Surveillance Radars Rendered',
      passed: radar1 && radar2 && radar3,
      details: `Radar 1: ${radar1}, Radar 2: ${radar2}, Radar 3: ${radar3}`,
    });

    // 8. Vehicle Favorites Grid
    const fav1 = bodyText.includes('Porsche 911 GT3 RS') && bodyText.includes('1,420,000');
    const fav2 = bodyText.includes('Mercedes-AMG G 63 UAE 50th') && bodyText.includes('895,000') && bodyText.includes('-AED 25,000 this week');
    const fav3 = bodyText.includes('Defender 110 V8 Carpathian') && bodyText.includes('620,000');
    const fav4 = bodyText.includes('Ferrari 296 GTB Hybrid') && bodyText.includes('1,650,000');
    results.push({
      check: '4 Luxury Vehicles with Live Valuations & Price Drops',
      passed: fav1 && fav2 && fav3 && fav4,
      details: `Porsche: ${fav1}, AMG G63 Drop: ${fav2}, Defender: ${fav3}, Ferrari: ${fav4}`,
    });

    // 9. Alert Criteria Modal
    const createRadarBtn = page.locator('button:has-text("Create New Radar")');
    await createRadarBtn.click();
    await page.waitForTimeout(500);

    const alertModalVisible = await page.locator('#alert-modal').isVisible();
    results.push({
      check: 'Telemetry Radar Settings Modal Opened',
      passed: alertModalVisible,
      details: `Alert Modal visible: ${alertModalVisible}`,
    });

    // Save preferences in modal
    const saveRadarBtn = page.locator('#alert-modal button:has-text("Save Radar Preferences")');
    await saveRadarBtn.click();
    await page.waitForTimeout(600);

    const toastVisible = await page.locator('#toast-notification').isVisible();
    results.push({
      check: 'Preferences Saved & Toast Displayed',
      passed: toastVisible,
      details: `Toast visible: ${toastVisible}`,
    });

    // 10. Interactive Demonstrator: Empty State
    const btnEmpty = page.locator('#btn-demo-empty');
    await btnEmpty.click();
    await page.waitForTimeout(500);

    const emptyStateVisible = await page.locator('#empty-state-view').isVisible();
    results.push({
      check: 'Interactive Demonstrator: Empty State View',
      passed: emptyStateVisible,
      details: `Empty State visible: ${emptyStateVisible}`,
    });

    // 11. Interactive Demonstrator: Loading Skeleton
    const btnLoading = page.locator('#btn-demo-loading');
    await btnLoading.click();
    await page.waitForTimeout(500);

    const skeletonVisible = await page.locator('#skeleton-state-view').isVisible();
    results.push({
      check: 'Interactive Demonstrator: Skeleton Loading View',
      passed: skeletonVisible,
      details: `Skeleton visible: ${skeletonVisible}`,
    });

    // Reset back to default
    const btnDefault = page.locator('#btn-demo-default');
    await btnDefault.click();
    await page.waitForTimeout(500);

    // 12. Desktop Screenshot 1440px
    await page.screenshot({
      path: path.join(evidenceDir, 'desktop-1440.png'),
      fullPage: true,
    });
    results.push({
      check: 'Desktop 1440px Screenshot Captured',
      passed: true,
      details: 'Saved desktop-1440.png',
    });

    // 13. Tablet Screenshot 1024px
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(evidenceDir, 'tablet-1024.png'),
      fullPage: true,
    });
    results.push({
      check: 'Tablet 1024px Screenshot Captured',
      passed: true,
      details: 'Saved tablet-1024.png',
    });

    // 14. Mobile Screenshot 390px
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(evidenceDir, 'mobile-390.png'),
      fullPage: true,
    });
    results.push({
      check: 'Mobile 390px Screenshot Captured',
      passed: true,
      details: 'Saved mobile-390.png',
    });

    // 15. Arabic RTL Layout
    await page.setViewportSize({ width: 1440, height: 900 });
    const arBtn = page.getByRole('button', { name: 'العربية' }).first();
    await arBtn.click();
    await page.waitForTimeout(500);
    const rtlEl = page.locator('div[dir="rtl"]').first();
    const isRtl = (await rtlEl.count()) > 0;
    const dirAttr = isRtl ? await rtlEl.getAttribute('dir') : 'none';
    await page.screenshot({
      path: path.join(evidenceDir, 'desktop-rtl.png'),
      fullPage: true,
    });
    results.push({
      check: 'Arabic RTL Layout & Screenshot',
      passed: Boolean(isRtl),
      details: `Saved desktop-rtl.png, dir: ${dirAttr}`,
    });

  } catch (err) {
    console.error('Verification error:', err);
    results.push({
      check: 'Execution Error',
      passed: false,
      details: err.message,
    });
  } finally {
    await browser.close();
  }

  // Summary
  console.log('\n--- S10 Verification Summary ---');
  let passCount = 0;
  results.forEach((r, idx) => {
    const symbol = r.passed ? '✓' : '✗';
    if (r.passed) passCount++;
    console.log(`${symbol} [${idx + 1}/${results.length}] ${r.check}: ${r.details}`);
  });
  console.log(`\nOverall: ${passCount}/${results.length} checks passed.`);
  return results;
}

runVerification();
