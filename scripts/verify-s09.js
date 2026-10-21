const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const evidenceDir = path.resolve(__dirname, '../docs/qa/evidence/S09');
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

async function runVerification() {
  console.log('--- Starting S09 Appointments & Virtual Garage Verification ---');
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. Navigation & HTTP Status
    const response = await page.goto('http://localhost:3000/account/garage', {
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
    const titleMatch = h1Text && h1Text.includes('Appointments, Test Drives & Virtual Garage');
    results.push({
      check: 'Appointments & Garage Header Rendered',
      passed: Boolean(titleMatch),
      details: `Title: "${h1Text?.trim()}"`,
    });

    // 3. Arabic Subtitle Presence
    const bodyText = await page.locator('body').innerText();
    const arabicSubtitle = bodyText.includes('المواعيد والتجارب الحركية والمرآب الرقمي الموثق');
    results.push({
      check: 'Arabic Mirror Subtitle Rendered',
      passed: arabicSubtitle,
      details: `Arabic text: ${arabicSubtitle ? 'Present' : 'Missing'}`,
    });

    // 4. Telemetry status pills
    const tcfPill = bodyText.includes('TCF #701982-DXB');
    const rtaConnected = bodyText.toLowerCase().includes('rta telemetry sync: connected');
    results.push({
      check: 'RTA Telemetry & TCF Badges Rendered',
      passed: tcfPill && rtaConnected,
      details: `TCF Pill: ${tcfPill}, RTA Sync: ${rtaConnected}`,
    });

    // 5. Quick Summary Mini-Widget
    const activeBookings = bodyText.includes('02') || bodyText.includes('Active Bookings');
    const garageFleet = bodyText.includes('03 Units');
    const escrowHolds = bodyText.includes('AED 0.00');
    results.push({
      check: 'Summary Mini-Widget Metrics',
      passed: activeBookings && garageFleet && escrowHolds,
      details: `Bookings: ${activeBookings}, Fleet: ${garageFleet}, Escrow: ${escrowHolds}`,
    });

    // 6. Section 1: Porsche 911 GT3 RS Dynamic Track Run Card
    const porscheCard = bodyText.includes('2024 Porsche 911 GT3 RS (992)') &&
      bodyText.includes('Dubai Autodrome Dynamic Track Run') &&
      bodyText.includes('#TRK-9812-DXB') &&
      bodyText.includes('#APX-9812');
    results.push({
      check: 'Porsche GT3 RS Dynamic Track Run Card',
      passed: porscheCard,
      details: `Porsche Track Card: ${porscheCard ? 'Verified' : 'Missing'}`,
    });

    // 7. Section 1: Mercedes-AMG G 63 Showroom Suite Card
    const g63Card = (bodyText.includes('G 63') || bodyText.includes('SilberArrows')) &&
      bodyText.includes('#SR-4091-DXB');
    results.push({
      check: 'Mercedes-AMG G 63 Showroom Suite Card',
      passed: g63Card,
      details: `G63 Suite Card: ${g63Card ? 'Verified' : 'Missing'}`,
    });

    // 8. Section 2: Virtual Collector Garage Header & Portfolio Total
    const garageSection = bodyText.includes('Virtual Collector Garage') &&
      bodyText.includes('RTA LINKED') &&
      bodyText.includes('4,950,000') &&
      bodyText.includes('+6.4% (+AED 298,000)');
    results.push({
      check: 'Virtual Collector Garage Portfolio Summary',
      passed: garageSection,
      details: `Garage Valuation Header: ${garageSection ? 'Verified' : 'Missing'}`,
    });

    // 9. Section 2: 3 Authenticated Garage Vehicles Rendered
    const car1 = bodyText.includes('2022 Porsche 911 Turbo S (992)') && bodyText.includes('D 9821');
    const car2 = bodyText.includes('2021 Ferrari F8 Tributo') && bodyText.includes('P 1104');
    const car3 = bodyText.includes('2023 Range Rover SV LWB') && bodyText.includes('5 4492');
    results.push({
      check: '3 Authenticated Garage Vehicles with RTA Plates',
      passed: car1 && car2 && car3,
      details: `Car 1: ${car1}, Car 2: ${car2}, Car 3: ${car3}`,
    });

    // 10. Sync Vehicle via RTA Action Card
    const rtaSyncCard = bodyText.includes('Integrate New Asset via RTA Electronic Traffic File');
    results.push({
      check: 'RTA Traffic File Integration Card',
      passed: rtaSyncCard,
      details: `RTA Sync Card: ${rtaSyncCard ? 'Verified' : 'Missing'}`,
    });

    // 11. Modal: Open RTA Sync Modal
    const syncBtn = page.locator('button:has-text("Sync New Vehicle")').first();
    await syncBtn.click();
    await page.waitForTimeout(500);

    const rtaModalVisible = await page.locator('#addVehicleModal').isVisible();
    results.push({
      check: 'RTA Gateway Title Sync Modal Opened',
      passed: rtaModalVisible,
      details: `Modal visible: ${rtaModalVisible}`,
    });

    // Close RTA Modal
    const cancelModalBtn = page.locator('#addVehicleModal button:has-text("Cancel")');
    await cancelModalBtn.click();
    await page.waitForTimeout(500);

    // 12. Modal: Open Appointment Cancellation & Escrow Release Modal
    const cancelSessionBtn = page.locator('button:has-text("Cancel Session")').first();
    await cancelSessionBtn.click();
    await page.waitForTimeout(500);

    const cancelModalVisible = await page.locator('#cancellationModal').isVisible();
    results.push({
      check: 'Appointment Cancellation & Escrow Modal',
      passed: cancelModalVisible,
      details: `Cancellation Modal visible: ${cancelModalVisible}`,
    });

    // 13. Execute Cancellation
    const confirmCancelBtn = page.locator('#cancellationModal button:has-text("Confirm Cancellation & Release")');
    await confirmCancelBtn.click();
    await page.waitForTimeout(1000);

    const cancelBannerVisible = await page.locator('#cancellationSuccessBanner').isVisible();
    results.push({
      check: 'Post-Cancellation Escrow Release Banner Rendered',
      passed: cancelBannerVisible,
      details: `Cancellation Banner: ${cancelBannerVisible ? 'Displayed' : 'Missing'}`,
    });

    // 14. Demo State Switcher: Empty State
    const btnStateEmpty = page.locator('#btnStateEmpty');
    await btnStateEmpty.click();
    await page.waitForTimeout(500);

    const emptyText = await page.locator('body').innerText();
    const emptyStateVisible = emptyText.includes('No Scheduled Viewings Active') &&
      emptyText.includes('Explore Vault Allocations');
    results.push({
      check: 'Interactive Switcher: Empty Viewings State',
      passed: emptyStateVisible,
      details: `Empty State text: ${emptyStateVisible ? 'Verified' : 'Missing'}`,
    });

    // Reset back to populated view
    const btnStatePop = page.locator('#btnStatePopulated');
    await btnStatePop.click();
    await page.waitForTimeout(500);

    // 15. Responsive Screen Captures
    // Desktop 1440px
    await page.screenshot({
      path: path.join(evidenceDir, 'desktop-1440.png'),
      fullPage: true,
    });
    results.push({
      check: 'Desktop 1440px Screenshot Captured',
      passed: true,
      details: 'Saved desktop-1440.png',
    });

    // Tablet 1024px
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

    // Mobile 390px
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

    // Arabic RTL Layout
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

  // Print results
  console.log('\n--- S09 Verification Summary ---');
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
