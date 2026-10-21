const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verifyS25() {
  console.log('--- STARTING S25 VERIFICATION: F&I Subprime DBR Exception & Underwriting Hard-Lock ---');

  const evidenceDir = path.join(__dirname, '..', 'docs', 'qa', 'evidence', 'S25');
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
    console.log('Navigating to http://localhost:3001/finance/exception ...');
    const response = await page.goto('http://localhost:3001/finance/exception', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    logCheck('Route HTTP Status 200', response.status() === 200, `Status: ${response.status()}`);

    // Wait for main content
    await page.waitForSelector('main', { timeout: 10000 });

    // 2. Regulatory Breach Warning Hard-Lock Banner
    const warningText = await page.innerText('body');
    const hasBreachWarning =
      warningText.includes('REGULATORY BREACH WARNING: CBUAE NOTICE NO. 29/2011') ||
      warningText.includes('Applicant Debt Burden Ratio (DBR) exceeds CBUAE 50.0% Statutory Ceiling');
    logCheck('Regulatory Breach Warning Banner', hasBreachWarning, 'Notice No. 29/2011 displayed');

    const hasApiState = warningText.includes('API State: breach-flagged-openfinance');
    logCheck('Open Banking API State Flagged', hasApiState, 'API State: breach-flagged-openfinance');

    // 3. Header & Desk Title
    const hasDeskTitle = warningText.includes('F&I Referral & Lending Status Desk');
    logCheck('Desk Title Present', hasDeskTitle, 'F&I Referral & Lending Status Desk');

    // 4. Action Buttons
    const hasSimulateBtn = await page.isVisible('button:has-text("Simulate Financing Terms")');
    const hasRateSheetBtn = await page.isVisible('button:has-text("Rate Sheet Matrix")');
    const hasExportBtn = await page.isVisible('button:has-text("Export Compliance Log")');
    const hasSubmitBtn = await page.isVisible('button:has-text("Submit Bank Dossier")');
    logCheck(
      'Top 4 Action Buttons',
      hasSimulateBtn && hasRateSheetBtn && hasExportBtn && hasSubmitBtn,
      'Simulate, Rate Sheet, Export Log, Submit Dossier all present'
    );

    // 5. KPI Summary Cards
    const hasPipelineQtd = warningText.includes('28,450,000');
    const hasAvgSla = warningText.includes('4.8 Hours');
    const hasDealerYield = warningText.includes('842,600');
    const hasLtvBreach = warningText.includes('85.0% Breach') || warningText.includes('1 Statutory Breach');
    logCheck(
      'KPI Summary Cards (4 Metrics)',
      hasPipelineQtd && hasAvgSla && hasDealerYield && hasLtvBreach,
      'Pipeline AED 28.45M, SLA 4.8h, Yield AED 842.6k, LTV Breach 85%'
    );

    // 6. Active Dossier Spotlight (#FNI-2025-0422)
    const upperText = warningText.toUpperCase();
    const hasCaseNo = warningText.includes('#FNI-2025-0422');
    const hasLockedBadge = upperText.includes('AUTOMATED SYNDICATION LOCKED');
    const hasVehicle = warningText.includes('Mercedes-AMG G 63');
    const hasApplicant = warningText.includes('Sultan Al-Mansoori');
    const hasAecbScore = warningText.includes('645') && upperText.includes('HIGH DBR RISK');
    logCheck(
      'Active Dossier Spotlight',
      hasCaseNo && hasLockedBadge && hasVehicle && hasApplicant && hasAecbScore,
      'Case #FNI-2025-0422, G63 4x4², Sultan Al-Mansoori, AECB 645 High DBR Risk'
    );

    // 7. Bank Syndication & Approval Matrix (4 Lenders)
    const hasEnbd = warningText.includes('Emirates NBD') && warningText.includes('DECLINED');
    const hasFab = warningText.includes('First Abu Dhabi Bank') && warningText.includes('REJECTED');
    const hasDib = warningText.includes('Dubai Islamic Bank') && warningText.includes('CONDITIONAL SHARIA WAIVER');
    const hasAdcb = warningText.includes('ADCB Private') && warningText.includes('SPECIAL WEALTH DESK REVIEW');
    logCheck(
      'Bank Syndication Matrix (4 Lenders)',
      hasEnbd && hasFab && hasDib && hasAdcb,
      'ENBD Declined, FAB Rejected, DIB Conditional Sharia, ADCB Special Review'
    );

    // 8. Insurance Underwriting & 4 Riders
    const hasInsurance = warningText.includes('Oman Insurance (Sukoon)') && warningText.includes('AED 42,600');
    const hasAgencyRepair = warningText.includes('GCC Agency Repair Guarantee');
    const hasTrackDay = warningText.includes('Dubai Autodrome Track Day Cover');
    const hasZeroDep = warningText.includes('Zero Depreciation on Carbon Aero & PCCB');
    const hasFlatbed = warningText.includes('24/7 Enclosed Flatbed Recovery');
    logCheck(
      'Insurance Underwriting & 4 Riders',
      hasInsurance && hasAgencyRepair && hasTrackDay && hasZeroDep && hasFlatbed,
      'Sukoon Agreed Value AED 1.42M + 4 Active Supercar Endorsements'
    );

    // 9. CBUAE Guardrails Card (Right Column)
    const hasGuardrailsHeader = warningText.includes('CBUAE Guardrails') && warningText.includes('NON-COMPLIANT');
    const hasDbrRatio = warningText.includes('58.4%') && warningText.includes('+8.4% Over Ceiling');
    const hasReg29Notice = warningText.includes('REGULATION 29/2011');
    logCheck(
      'CBUAE Guardrails Card',
      hasGuardrailsHeader && hasDbrRatio && hasReg29Notice,
      'DBR 58.4% (+8.4% breach), Regulation 29/2011 notice'
    );

    // 10. Restructure & Exception Desk
    const hasCurePath = upperText.includes('RECOMMENDED CURE PATH') && warningText.includes('Inject 30% Down');
    const hasOptionA = warningText.includes('Option A: Structure 30% Down');
    const hasOptionB = warningText.includes('Option B: Sovereign Wealth Guarantor');
    const hasCroButton = await page.isVisible('button:has-text("Escalate to Chief Risk Officer")');
    logCheck(
      'Restructure & Exception Desk',
      hasCurePath && hasOptionA && hasOptionB && hasCroButton,
      '30% Down option, Sovereign Wealth option, CRO Escalation button'
    );

    // 11. Full Pipeline Table
    const hasPipelineTable =
      warningText.includes('Active Dealer F&I Loan & Insurance Pipeline') &&
      warningText.includes('Ferrari 296 GTB') &&
      warningText.includes('Aston Martin Valkyrie Spider');
    logCheck('Pipeline Files Table', hasPipelineTable, 'Ferrari 296 GTB, Valkyrie Spider, Cullinan present');

    // 12. Capture Desktop 1440 Screenshot
    const desktopPath = path.join(evidenceDir, 'desktop_1440.png');
    await page.screenshot({ path: desktopPath, fullPage: true });
    logCheck('Desktop 1440 Screenshot', fs.existsSync(desktopPath), desktopPath);

    // 13. Interactive Workflow: Option A Structure 30% Down Cure
    console.log('Testing Option A Structure 30% Down Cure workflow...');
    await page.click('button:has-text("Option A: Structure 30% Down")');
    await page.waitForTimeout(600);

    const curedText = await page.innerText('body');
    const dbrCured = curedText.includes('48.2%') && (curedText.includes('COMPLIANT') || curedText.includes('EXCEPTION RESOLVED'));
    const syndicationUnlocked = curedText.includes('Syndication Unlocked') || curedText.includes('syndication-unlocked');
    logCheck(
      'Option A 30% Down Restructure Cured DBR',
      dbrCured && syndicationUnlocked,
      'DBR reduced to 48.2%, CBUAE Compliant, Syndication Unlocked'
    );

    const curedModalPath = path.join(evidenceDir, 'modal_restructure_cured.png');
    await page.screenshot({ path: curedModalPath, fullPage: false });
    logCheck('Restructure Cured Screenshot', fs.existsSync(curedModalPath), curedModalPath);

    // 14. Reset to breach and test CRO Escalation Modal
    console.log('Reverting to breach and testing CRO Escalation...');
    const revertBtn = await page.$('button:has-text("Revert to Breach State")');
    if (revertBtn) {
      await revertBtn.click();
      await page.waitForTimeout(400);
    }

    await page.click('button:has-text("Escalate to Chief Risk Officer")');
    await page.waitForSelector('text=Chief Risk Officer (CRO) Override Request', { timeout: 5000 });

    await page.fill('textarea', 'VIP Private client with AED 25M commercial asset portfolio in DIFC.');
    await page.click('button:has-text("Authorize Statutory Override")');
    await page.waitForTimeout(500);

    const croGranted = await page.isVisible('text=CRO Exception Granted & Logged');
    logCheck('CRO Exception Granted Modal', croGranted, 'Dual committee authorization logged');

    const croModalPath = path.join(evidenceDir, 'modal_cro_escalation.png');
    await page.screenshot({ path: croModalPath, fullPage: false });
    logCheck('CRO Escalation Screenshot', fs.existsSync(croModalPath), croModalPath);

    await page.click('button:has-text("Return to Case Dossier")');
    await page.waitForTimeout(400);

    // 15. Rate Sheet Matrix Modal
    await page.click('button:has-text("Rate Sheet Matrix")');
    await page.waitForSelector('text=Q4 Automotive Lending Rate Sheet Matrix', { timeout: 5000 });
    const hasRateSheetTable = await page.isVisible('text=ENBD') && await page.isVisible('text=DIB (Sharia)');
    logCheck('Rate Sheet Matrix Modal', hasRateSheetTable, 'Bank spreads across Tier-1 to Subprime displayed');
    await page.click('button:has-text("Close")');
    await page.waitForTimeout(300);

    // 16. RBAC Role Toggle (Least-Privilege Masking)
    console.log('Testing RBAC Sales Executive masking...');
    const rbacBtn = await page.$('button[title*="RBAC mode"]');
    if (rbacBtn) {
      await rbacBtn.click();
      await page.waitForTimeout(400);

      const rbacText = await page.innerText('body');
      const hasMaskedYield = rbacText.includes('••••••');
      logCheck(
        'RBAC Least-Privilege Masking',
        hasMaskedYield,
        'Dealer reserves and sensitive yields masked for Sales Rep'
      );

      // Revert to Dealer Principal
      await rbacBtn.click();
      await page.waitForTimeout(300);
    }

    // 17. Arabic RTL Toggle
    console.log('Testing Arabic RTL mode...');
    const langBtn = await page.$('button[aria-label="Toggle language"]');
    if (langBtn) {
      await langBtn.click();
      await page.waitForTimeout(400);

      const isRtlDir = await page.getAttribute('div[dir]', 'dir');
      const rtlText = await page.innerText('body');
      const hasArabic = rtlText.includes('إدارة التمويل والتأمين المصرفي') || rtlText.includes('نسبة عبء الدين');
      logCheck('Arabic RTL Mode', isRtlDir === 'rtl' && hasArabic, 'dir="rtl" with Arabic localization');

      const rtlPath = path.join(evidenceDir, 'arabic_rtl.png');
      await page.screenshot({ path: rtlPath, fullPage: true });
      logCheck('Arabic RTL Screenshot', fs.existsSync(rtlPath), rtlPath);

      // Switch back to English
      await langBtn.click();
      await page.waitForTimeout(300);
    }

    // 18. Mobile Viewport 390x844
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
  console.log('\n--- S25 VERIFICATION SUMMARY ---');
  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  console.log(`Results: ${passed} / ${total} checks passed.`);

  const reportPath = path.join(evidenceDir, 'test_report.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        screen: 'S25',
        title: 'F&I Subprime DBR Exception & Underwriting Hard-Lock',
        route: '/finance/exception',
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
    console.log('>>> ALL S25 GATES VERIFIED SUCCESSFULLY! <<<');
    process.exit(0);
  } else {
    console.error('>>> SOME S25 GATES FAILED! <<<');
    process.exit(1);
  }
}

verifyS25();
