const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verifyS26() {
  console.log('--- STARTING S26 VERIFICATION: Consignment Custody Freeze & Judicial Injunction ---');

  const evidenceDir = path.join(__dirname, '..', 'docs', 'qa', 'evidence', 'S26');
  fs.mkdirSync(evidenceDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const results = [];
  const logCheck = (name, pass, details) => {
    results.push({ name, pass, details });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}${details ? ` - ${details}` : ''}`);
  };

  try {
    // 1. Navigate to route
    console.log('Navigating to http://localhost:3001/fleet/exception ...');
    const response = await page.goto('http://localhost:3001/fleet/exception', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    logCheck('Route HTTP Status 200', response.status() === 200, `Status: ${response.status()}`);

    // Wait for main content
    await page.waitForSelector('main', { timeout: 10000 });
    const bodyText = await page.innerText('body');
    const upperText = bodyText.toUpperCase();

    // 2. Bailment & Insurance Callouts
    const hasBailment = bodyText.includes('UAE Fed. Law No. 50 (2022)') || bodyText.includes('Bailment Compliant');
    const hasAllianz = bodyText.includes('AED 100M Allianz Custody Floater');
    logCheck('Bailment & Allianz Floater Strip', hasBailment && hasAllianz, 'Federal Law No. 50 & AED 100M Allianz');

    // 3. Custody Dispute Freeze Banner
    const hasFreezeOrder = bodyText.includes('DXB-EXEC-2025-8841');
    const hasCustodyFreezeTitle = upperText.includes('CUSTODY DISPUTE FREEZE');
    const hasVaultLocation = bodyText.includes('Vault Bay 01-12');
    logCheck(
      'Custody Dispute Freeze Banner',
      hasFreezeOrder && hasCustodyFreezeTitle && hasVaultLocation,
      'Execution Order #DXB-EXEC-2025-8841, Vault Bay 01-12'
    );

    // 4. Action Buttons in Freeze Banner
    const hasEnforceQuarantineBtn = await page.isVisible('button:has-text("Enforce Quarantine Protocol")');
    const hasViewInjunctionBtn = await page.isVisible('button:has-text("View Court Injunction")');
    logCheck(
      'Freeze Banner Actions',
      hasEnforceQuarantineBtn && hasViewInjunctionBtn,
      'Enforce Quarantine and View Court Injunction present'
    );

    // 5. Desk Title & Top Actions
    const hasDeskTitle = bodyText.includes('Corporate Fleet Accounts & VIP Consignment Portfolio');
    const hasOnboardBtn = await page.isVisible('button:has-text("Onboard Consignment")');
    const hasCreateFleetBtn = await page.isVisible('button:has-text("Create Corporate Fleet")');
    const hasBulkRenewalBtn = await page.isVisible('button:has-text("Bulk Mulkiya Renewal")');
    logCheck(
      'Desk Title & Top Actions',
      hasDeskTitle && hasOnboardBtn && hasCreateFleetBtn && hasBulkRenewalBtn,
      'Consignment & Fleet desk with Onboard, Create Fleet, Bulk Renewal'
    );

    // 6. 4 KPI Metric Cards
    const hasPortfolioVal = bodyText.includes('64,200,000');
    const hasFleetUnits = bodyText.includes('128') && bodyText.includes('Vehicles');
    const hasYield = bodyText.includes('1,280,000');
    const hasMulkiyaCompliance = bodyText.includes('96.8%') && bodyText.includes('EXPIRING');
    logCheck(
      'KPI Summary Cards (4 Metrics)',
      hasPortfolioVal && hasFleetUnits && hasYield && hasMulkiyaCompliance,
      'Portfolio AED 64.2M, Fleet 128 units, Yield AED 1.28M, Mulkiya 96.8%'
    );

    // 7. VIP Consignment Custody Vault Spotlight (Ferrari 296 GTB)
    const hasCustodyLock = upperText.includes('CUSTODY LOCK ACTIVE');
    const hasVehicle = bodyText.includes('Ferrari 296 GTB Assetto Fiorano');
    const hasChassis = bodyText.includes('ZFF98LHA0P6293108');
    const hasConsignor = bodyText.includes('Sheikh Khalid Al-Nahyan');
    const hasReserveFrozen = bodyText.includes('1,480,000') && upperText.includes('FROZEN');
    const hasDelisted = upperText.includes('DELISTED FROM MARKETPLACE');
    const hasTasjeelGrade = bodyText.includes('GRADE A (98/100)');
    logCheck(
      'Custody Vault Frozen Spotlight',
      hasCustodyLock && hasVehicle && hasChassis && hasConsignor && hasReserveFrozen && hasDelisted && hasTasjeelGrade,
      'Ferrari 296 GTB, Sheikh Khalid Al-Nahyan, Reserve AED 1.48M Frozen, Delisted, Tasjeel Grade A'
    );

    // 8. Corporate Fleet Account Matrix
    const hasFalcon = bodyText.includes('Falcon Luxury Chauffeur & VIP Hospitality');
    const has36Units = bodyText.includes('36 Managed Units') || bodyText.includes('36 Units');
    const hasMaybach = bodyText.includes('Mercedes-Maybach S 680');
    const hasPriorityUnit = bodyText.includes('FLC-MAY-01') && bodyText.includes('FLC-RR-04');
    logCheck(
      'Corporate Fleet Account Matrix',
      hasFalcon && has36Units && hasMaybach && hasPriorityUnit,
      'Falcon Luxury Chauffeur, 36 Units, Priority units FLC-MAY-01 & FLC-RR-04'
    );

    // 9. Custody & Bailment Ledger (Right Column)
    const hasLegalDisputeHeader = upperText.includes('LEGAL DISPUTE') || upperText.includes('LIEN ATTACHMENT');
    const hasRestrictedInsurance = bodyText.includes('SUSPENDED FOR ROAD USE') || bodyText.includes('RESTRICTED');
    const hasCommissionEngine = upperText.includes('COMMISSION SPLIT ENGINE');
    const hasEscrowLocked = upperText.includes('1,650,000 LOCKED') || bodyText.includes('1,650,000 LOCKED');
    const hasHearingDate = bodyText.includes('12 May 2025');
    logCheck(
      'Custody & Bailment Ledger',
      hasLegalDisputeHeader && hasRestrictedInsurance && hasCommissionEngine && hasEscrowLocked && hasHearingDate,
      'Legal dispute lien, Restricted floater, Commission engine AED 1.65M locked, Hearing 12 May 2025'
    );

    // 10. Master Pipeline Table
    const hasHamdan = bodyText.includes('Sheikh Hamdan Al Maktoum Col.');
    const hasGt3Rs = bodyText.includes('Porsche 911 GT3 RS');
    const hasBentley = bodyText.includes('Bentley Flying Spur');
    const hasMclaren = bodyText.includes('McLaren 765LT Spider');
    logCheck(
      'Consolidated Master Pipeline Table',
      hasHamdan && hasGt3Rs && hasBentley && hasMclaren,
      'Porsche 911 GT3 RS, Bentley Flying Spur, McLaren 765LT Spider'
    );

    // 11. Desktop 1440 Screenshot
    const desktopPath = path.join(evidenceDir, 'desktop_1440.png');
    await page.screenshot({ path: desktopPath, fullPage: true });
    logCheck('Desktop 1440 Screenshot', fs.existsSync(desktopPath), desktopPath);

    // 12. Interactive Test: Interpleader Motion Workflow (Cure/Relief)
    console.log('Testing Interpleader Motion Deposit workflow...');
    await page.click('button:has-text("Submit Dealership Interpleader Motion")');
    await page.waitForSelector('text=Dealership Interpleader & Escrow Bond Motion', { timeout: 5000 });

    await page.click('button:has-text("Deposit Bond & Lift Quarantine")');
    await page.waitForTimeout(500);

    const interpleaderAdmitted = await page.isVisible('text=Interpleader Motion Admitted & Bond Deposited');
    logCheck('Interpleader Motion Admitted Modal', interpleaderAdmitted, 'AED 1.65M bond deposited in court escrow');

    await page.click('button:has-text("Return to Custody Ledger")');
    await page.waitForTimeout(500);

    const relievedText = await page.innerText('body');
    const isQuarantineCleared =
      relievedText.toUpperCase().includes('CUSTODY QUARANTINE CLEARED') ||
      relievedText.toUpperCase().includes('INTERPLEADER ESCROW BOUND');
    logCheck('Quarantine Cleared via Interpleader Deposit', isQuarantineCleared, 'Status: INTERPLEADER ESCROW BOUND / CLEARED');

    const interpleaderModalPath = path.join(evidenceDir, 'modal_interpleader_cured.png');
    await page.screenshot({ path: interpleaderModalPath, fullPage: false });
    logCheck('Interpleader Cured Screenshot', fs.existsSync(interpleaderModalPath), interpleaderModalPath);

    // Revert to freeze state
    const revertBtn = await page.$('button:has-text("Revert to Freeze State")');
    if (revertBtn) {
      await revertBtn.click();
      await page.waitForTimeout(400);
    }

    // 13. Interactive Test: Court Order Injunction Modal
    console.log('Testing Court Order Injunction modal...');
    await page.click('button:has-text("View Court Injunction")');
    await page.waitForSelector('text=Dubai Commercial Court Execution Order', { timeout: 5000 });
    const hasCourtDetails = (await page.innerText('body')).includes('DXB-EXEC-2025-8841');
    logCheck('Court Execution Order Modal', hasCourtDetails, 'Official judicial decree details displayed');

    const courtModalPath = path.join(evidenceDir, 'modal_court_order.png');
    await page.screenshot({ path: courtModalPath, fullPage: false });
    logCheck('Court Order Screenshot', fs.existsSync(courtModalPath), courtModalPath);

    await page.click('button:has-text("Close")');
    await page.waitForTimeout(300);

    // 14. Interactive Test: Quarantine Security Log Modal
    console.log('Testing Quarantine Security Log modal...');
    await page.click('button:has-text("Enforce Quarantine Protocol")');
    await page.waitForSelector('text=Quarantine Bailment Security Log', { timeout: 5000 });
    const hasLogSecurity = (await page.innerText('body')).includes('GM-DUAL-PIN-ACTIVE');
    logCheck('Quarantine Security Log Modal', hasLogSecurity, 'Biometric DUAL-PIN vault seal active');
    await page.click('button:has-text("Close")');
    await page.waitForTimeout(300);

    // 15. RBAC Role Toggle (Least-Privilege Masking)
    console.log('Testing RBAC Sales Executive masking...');
    const rbacBtn = await page.$('button[title*="RBAC mode"]');
    if (rbacBtn) {
      await rbacBtn.click();
      await page.waitForTimeout(400);

      const rbacText = await page.innerText('body');
      const hasMasked = rbacText.includes('••••••');
      logCheck('RBAC Least-Privilege Masking', hasMasked, 'Commission splits and yields masked as ••••••');

      // Revert to Principal
      await rbacBtn.click();
      await page.waitForTimeout(300);
    }

    // 16. Arabic RTL Toggle
    console.log('Testing Arabic RTL mode...');
    const langBtn = await page.$('button[aria-label="Toggle language"]');
    if (langBtn) {
      await langBtn.click();
      await page.waitForTimeout(400);

      const isRtlDir = await page.getAttribute('div[dir]', 'dir');
      const rtlText = await page.innerText('body');
      const hasArabic = rtlText.includes('إدارة أساطيل الشركات وعقود البيع بالأمانة') || rtlText.includes('أمر حجز قضائي');
      logCheck('Arabic RTL Mode', isRtlDir === 'rtl' && hasArabic, 'dir="rtl" with Arabic legal terminology');

      const rtlPath = path.join(evidenceDir, 'arabic_rtl.png');
      await page.screenshot({ path: rtlPath, fullPage: true });
      logCheck('Arabic RTL Screenshot', fs.existsSync(rtlPath), rtlPath);

      // Revert to English
      await langBtn.click();
      await page.waitForTimeout(300);
    }

    // 17. Mobile Viewport 390x844
    console.log('Testing mobile viewport 390x844...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);

    const mobilePath = path.join(evidenceDir, 'mobile_390.png');
    await page.screenshot({ path: mobilePath, fullPage: true });
    logCheck('Mobile 390 Screenshot', fs.existsSync(mobilePath), mobilePath);

  } catch (err) {
    console.error('Test execution error:', err);
    logCheck('Test Suite Execution', false, err.message);
  } finally {
    await browser.close();
  }

  // Summary
  console.log('\n--- S26 VERIFICATION SUMMARY ---');
  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  console.log(`Results: ${passed} / ${total} checks passed.`);

  const reportPath = path.join(evidenceDir, 'test_report.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        screen: 'S26',
        title: 'Consignment Custody Freeze & Judicial Injunction',
        route: '/fleet/exception',
        timestamp: new Date().toISOString(),
        total,
        passed,
        failed: total - passed,
        status: passed === total ? 'VERIFIED' : 'FAILED',
        checks: results,
      },
      null,
      2
    )
  );
  console.log(`Saved report to ${reportPath}`);

  if (passed === total) {
    console.log('>>> ALL S26 GATES VERIFIED SUCCESSFULLY! <<<');
    process.exit(0);
  } else {
    console.error('>>> SOME S26 GATES FAILED! <<<');
    process.exit(1);
  }
}

verifyS26();
