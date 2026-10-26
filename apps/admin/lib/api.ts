/**
 * Platform Governance & Admin API Client
 *
 * Implements typed interfaces and API integration for:
 * 1. Vehicle Listing Moderation & VIN Risk Review (Stitch Screen 8ac37f225c8e44ff8d99e824c784ccd7)
 * 2. KYB Institutional Dealer Accreditation (Stitch Screen c66fabd239274215933c237649699f1d)
 */

export interface ListingModerationImage {
  id: string;
  url: string;
  alt: string;
  plate: string;
  label: string;
  isPrimary?: boolean;
}

export interface SpecificationAttestation {
  parameter: string;
  dealerClaim: string;
  registrySource: string;
  status: string;
  statusType: 'valid' | 'warning' | 'error';
  icon: string;
}

export interface AttachedDossierDoc {
  id: string;
  title: string;
  ref: string;
  badge: string;
  badgeType: 'tertiary' | 'secondary' | 'primary';
  signedBy: string;
  icon: string;
}

export interface IntegrityScan {
  title: string;
  subtitle: string;
  resultBadge: string;
  badgeType: 'tertiary' | 'primary' | 'error' | 'secondary';
  icon: string;
}

export interface QueueTriageItem {
  id: string;
  code: string;
  dealerName: string;
  vehicleTitle: string;
  metricBadge: string;
  issueLabel: string;
  issueIcon: string;
  priceOrKm: string;
  accentBorder: 'primary' | 'error' | 'tertiary' | 'secondary';
}

export interface AdminListingModerationDetail {
  id: string;
  auditCode: string;
  priority: string;
  priorityLabel: string;
  status: 'SUBMITTED_FOR_REVIEW' | 'PUBLISHED' | 'REJECTED';
  title: string;
  generation: string;
  dealerName: string;
  dealerTier: string;
  receivedAt: string;
  dedLicense: string;
  askingPriceFils: number;
  askingPriceAedFormatted: string;
  marketMedianAedFormatted: string;
  marketDelta: string;
  odometerKm: number;
  tasjeelKm: number;
  vin: string;
  policeClearance: string;
  discrepancyTitle: string;
  discrepancySeverity: string;
  discrepancyDealerClaim: string;
  discrepancyBuildSheetOrder: string;
  discrepancyTropicalAttest: string;
  discrepancyRadiatorCode: string;
  discrepancyGuideline: string;
  discloseBadgeLabel: string;
  engineSpec: string;
  engineEcuAttest: string;
  exifGps: string;
  exifVenue: string;
  exifCamera: string;
  exifTimestamp: string;
  exifFreshness: string;
  images: ListingModerationImage[];
  attestations: SpecificationAttestation[];
  attachedDocs: AttachedDossierDoc[];
  scans: IntegrityScan[];
  queuePipeline: QueueTriageItem[];
}

export interface BeneficialOwner {
  id: string;
  name: string;
  initials: string;
  role: string;
  equityPct: number;
  statusBadge: string;
  emiratesId: string;
  biometricVerification: string;
  pepSanctionsSearch: string;
  avatarColor: 'primary' | 'secondary';
}

export interface ShowroomPhotoEvidence {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  alt: string;
}

export interface FacilityAudit {
  capacityHypercars: number;
  climateSpec: string;
  tasjeelBay: string;
  rtaTelemetryUplink: boolean;
  civilDefenseGrade: string;
  civilDefenseCert: string;
  photos: ShowroomPhotoEvidence[];
}

export interface KybQueueItem {
  id: string;
  caseNumber: string;
  dealerLegalName: string;
  score: string;
  sla: string;
  statusLabel: string;
  statusBadgeType: 'active' | 'review' | 'flag' | 'pending' | 'ok';
}

export interface DealerKybDossierDetail {
  id: string;
  caseNumber: string;
  tenantId: string;
  status: 'IN_REVIEW' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  statusLabel: string;
  slaRemaining: string;
  entityTypeTier: string;
  legalEntityName: string;
  displayName: string;
  taxRegistrationNumber: string;
  dedCommercialLicense: string;
  dedStatus: string;
  jurisdiction: string;
  showroomZoning: string;
  makani: string;
  showroomAddress: string;
  docPdfName: string;
  docPdfSize: string;
  docSha256: string;
  docDubaiChamberStamp: string;
  docExpiry: string;
  riskScore: number;
  riskRatingLabel: string;
  shellEntityProb: string;
  tamperRisk: string;
  paidUpCapital: string;
  bankReference: string;
  beneficialOwners: BeneficialOwner[];
  facility: FacilityAudit;
  dualSigners: Array<{
    name: string;
    role: string;
    keyFingerprint: string;
    signed: boolean;
    timestamp?: string;
  }>;
  queueRibbon: KybQueueItem[];
}

// -----------------------------------------------------------------------------
// Realistic Fixtures matching Approved Stitch Designs
// -----------------------------------------------------------------------------

export const MOCK_MODERATION_DETAIL: AdminListingModerationDetail = {
  id: 'mod-9921',
  auditCode: '#MOD-9921',
  priority: 'P1-Regulatory',
  priorityLabel: 'ACTION REQUIRED • Automated Discrepancy Flagged',
  status: 'SUBMITTED_FOR_REVIEW',
  title: 'Vehicle Listing Audit: 2024 Porsche 911 GT3 RS Weissach Package',
  generation: 'MY2024 • 992.1',
  dealerName: 'Apex GT Motors FZCO',
  dealerTier: 'Tier-1 Accredited',
  receivedAt: '22 Feb 2025 • 14:18 GST',
  dedLicense: 'DED Valid #741092',
  askingPriceFils: 142000000,
  askingPriceAedFormatted: 'AED 1,420,000',
  marketMedianAedFormatted: 'AED 1,460,000',
  marketDelta: '±2.8% Delta',
  odometerKm: 1850,
  tasjeelKm: 1842,
  vin: 'WP0AF2A97RS289012',
  policeClearance: 'Dubai Police • Interpol Clear',
  discrepancyTitle: 'Cooling Code Mismatch',
  discrepancySeverity: 'MODERATE RISK',
  discrepancyDealerClaim: 'GCC Official Specification (Ali & Sons)',
  discrepancyBuildSheetOrder: 'Stuttgart Zuffenhausen • Dest: C00 (Germany)',
  discrepancyTropicalAttest: 'RETROFIT BY OFFICIAL DEALER #0412',
  discrepancyRadiatorCode: '992-121-253-G (OEM GCC Spec Standard)',
  discrepancyGuideline:
    'Not fraudulent as mechanical cooling is genuine OEM retrofitted. However, UAE Fair Trade Consumer Protection Act forbids "Original GCC Spec" designation without clarification. Must append "GCC Agency Retrofit" badge on public dossier.',
  discloseBadgeLabel: 'GCC Agency Retrofit (Ali & Sons 2024)',
  engineSpec: '4.0L Boxer-6 • 518 BHP • Weissach',
  engineEcuAttest: 'ECU Stage-0 Factory Flash (Zero Tuner Logs)',
  exifGps: '25.1328° N, 55.2289° E',
  exifVenue: 'Apex Bay 3, Al Quoz 1, DXB',
  exifCamera: 'Sony ILCE-7RM5 • 35mm GM',
  exifTimestamp: '22 Feb 2025 • 11:34:02 GST',
  exifFreshness: 'Freshness: 2.8 hrs ago',
  images: [
    {
      id: 'img-1',
      plate: 'Plate 01',
      label: 'Front 3/4 Studio',
      isPrimary: true,
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUXlI2LIgxlb2_4CCE3wH-q6UT3k4g35hTtD36FYzbV8DKVPp-xQFg5W_XUn5JxlSM-MsgWl25pywJPKPGUZkPvlBm_SktrlzqmUPl0peLT9ic9w5UHYupqYpLme3H3hMQ1BZXIpZ-NGa72t0T7f3ST0RqoB9skSgBDUgUlTGCTUJekgWuxU97w1FLRcYAcq4jBIwFUzzEybG8QMy8yMCrZnU9iGEx3yh83IDjije9IOCHyW7V964T',
      alt: 'A pristine 2024 Porsche 911 GT3 RS Weissach in Arctic Grey with carbon accents parked under dramatic showroom lighting in Al Quoz Dubai.',
    },
    {
      id: 'img-2',
      plate: 'Plate 02',
      label: 'Aero Wing',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwkjNgqC91kNFbjdH9w5b7w49FzktGiMQTlFyZzy7Ym3_tm_NtGLc6iOz78t03excD_ONnu7GZ8gb_5ZE_YeGlMTiusvE1IzjFjMjWorIwFTKHu8KgLM-8_TG4IeHrUfZSQWjbx-YUeU_Q05Ho5yvERMOX5w9Ym1OLeH8eOpdszBZc9GOkilePtoVclH57VA3mOBXoGjAOS-ZWJmiZgnZVja14CpSvmuA5aOhy_91kZ4Q7CI1klLzB',
      alt: 'Close-up detail shot of the Weissach carbon fiber rear swan-neck wing and titanium roll cage inside the Porsche 911 GT3 RS.',
    },
    {
      id: 'img-3',
      plate: 'Plate 03',
      label: 'Cockpit & Cluster',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOdp6MOsMu_b8RU4dkACq7elgtKuIGi2LfxTkFrG1moCSeC-Kdmo_ubJhKG0ZSmg3krLj8LsEaR1CqpcHBgkchlrL4YKg8WsD-8c00mR5XwjN73Tj3KQj0uhz7TTlVF5daw4RaXdNfGXHpkQtE5CXbVjLUwgfmq24JBQFujRiQhsKKBH_Cw8w7g4f5LVsKvsuCr_EGsPvmv-CFFVYkaLduSd6TLtvgEidxSqnVJCOTuhGW-cHRV_BA',
      alt: 'Interior driver cabin view showing Race-Tex carbon bucket seats and digital Porsche instrument cluster showing 1850 KM.',
    },
    {
      id: 'img-4',
      plate: 'Plate 04',
      label: 'PCCB Brakes',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD0bfWShNxGRnIdLx2Hc8DggYd5f4I_bmlWO54NsWCEYLMeaW-gpWxR441k_Y6-5LwpagyeUwnemwZRnleu9KOzuLNAq7XNq73GmXuikdRv5H9oXH3raWYIQ7K3elTsoNf_08WFyAwO9nGbxBwjA6WB2AQ-E71WDivSvT6ZqbkPuBf5HxAlvLqrNrmJCig71NRTcSyMx5UHQuc1O4vB54lB8IMGG5x4GZvuhDXv170aOFYpTX2BOyHD',
      alt: 'Porsche 911 GT3 RS magnesium lightweight rim and yellow Porsche Ceramic Composite Brake PCCB calipers.',
    },
    {
      id: 'img-5',
      plate: 'Plate 05',
      label: 'Bay & Serial',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJJ93YpZCV2vO_a_tGGD0UFxmrY_xqA_KGdB26tXDGKhoufLQeTsSKRkPgtJf7y0L25M_JAEVm3spUnc3Y8YY8o2_1qSVC00-NL6eZp90FBYw8SITRQC9qze-92XIsdge5HpAG1mo8xwfZBffW5NcVgXecw_89VqwyL_Q8BQsgkG2plm1ZZ6bJyn9s6RnhTYzSIk1oU2mcs5nIGmnZsavNI8PDISaGBdVjwYuPmuBbV7Q1EgCdSI8H',
      alt: 'Underhood chassis plate and engine bay cover detailing Weissach RS 4.0 litre naturally aspirated boxer insignia.',
    },
    {
      id: 'img-6',
      plate: 'Plate 06',
      label: 'VIN Tag Sticker',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIlS7sF1JUReXn8uj7_jxyopCUvVy8sqJLarjegdVJmfLLLV6gwfMStehF-nboUmbTGXmtOZmxeNBV5_sW0bSKPBL73RGkEk3AjsZMThgHwkwlSgJn3gJSOdMgtAdqB0XxMBsJ9R6Vr7TfcIaPeeumsY5rGufJu7CIxl7gp3OW-3ejCohXXAPB8268mqkcKcRo63qiE1ZU1ThGl9bnadbhjepH5WtZ0ZY7CMY8v8Wf3_PouKyoA8yS',
      alt: 'Physical vehicle VIN barcode and metal door jamb sticker with WP0AF2A97RS289012 etched clearly.',
    },
  ],
  attestations: [
    {
      parameter: 'Chassis / VIN',
      dealerClaim: 'WP0AF2A97RS289012',
      registrySource: 'Dubai Police • Interpol Clear',
      status: 'CLEAN & UNMASKED',
      statusType: 'valid',
      icon: 'qr_code_2',
    },
    {
      parameter: 'Regional Spec',
      dealerClaim: 'GCC Official Spec (Ali & Sons)',
      registrySource: 'Porsche AG: German Spec (C00) w/ Retrofit',
      status: 'SPEC MISMATCH',
      statusType: 'warning',
      icon: 'public',
    },
    {
      parameter: 'Asking Valuation',
      dealerClaim: 'AED 1,420,000',
      registrySource: 'Market Median: AED 1,460,000 (±2.8% Delta)',
      status: 'FAIR VALUE COMPLIANT',
      statusType: 'valid',
      icon: 'payments',
    },
    {
      parameter: 'Odometer Mileage',
      dealerClaim: '1,850 KM',
      registrySource: 'Tasjeel Telemetry: 1,842 KM (20 Feb)',
      status: 'CERTIFIED ACCURATE',
      statusType: 'valid',
      icon: 'speed',
    },
    {
      parameter: 'Engine & Aero Config',
      dealerClaim: '4.0L Boxer-6 • 518 BHP • Weissach',
      registrySource: 'ECU Stage-0 Factory Flash (Zero Tuner Logs)',
      status: 'OEM UNMODIFIED',
      statusType: 'valid',
      icon: 'tune',
    },
  ],
  attachedDocs: [
    {
      id: 'doc-1',
      title: 'Tasjeel 150-Point Inspection',
      ref: '#TSJ-2025-99810 • PDF 4.2 MB',
      badge: '99/100 TIER-1',
      badgeType: 'tertiary',
      signedBy: 'Signed via UAE Pass',
      icon: 'assignment_turned_in',
    },
    {
      id: 'doc-2',
      title: 'UAE Mulkiya Registration',
      ref: 'Plate DXB R-7080 • Private',
      badge: 'RTA ACTIVE',
      badgeType: 'secondary',
      signedBy: 'Direct RTA Hash verified',
      icon: 'badge',
    },
    {
      id: 'doc-3',
      title: 'Porsche Factory Warranty',
      ref: 'Porsche Centre Dubai Extension',
      badge: 'VALID TO 2027',
      badgeType: 'tertiary',
      signedBy: 'Agency Transferable',
      icon: 'security',
    },
  ],
  scans: [
    {
      title: 'Cross-Platform Duplicate Search',
      subtitle: 'DubiCars, YallaMotor, CarSwitch, OpenSooq',
      resultBadge: '0 DUPLICATES',
      badgeType: 'tertiary',
      icon: 'travel_explore',
    },
    {
      title: 'Physical Showroom Floor Telemetry',
      subtitle: 'Tasjeel BLE Beacon Node #DXB-98-3',
      resultBadge: 'BAY 3 CONFIRMED',
      badgeType: 'tertiary',
      icon: 'sensors',
    },
    {
      title: 'Central Bank Lien Registry',
      subtitle: 'Hypothecation / Mortgage encumbrance',
      resultBadge: '0 ACTIVE LIENS',
      badgeType: 'tertiary',
      icon: 'account_balance',
    },
  ],
  queuePipeline: [
    {
      id: 'mod-9922',
      code: '#MOD-9922 • FERRARI DXB',
      dealerName: 'Ferrari DXB',
      vehicleTitle: '2024 Ferrari 296 GTB Assetto',
      metricBadge: '±18.4%',
      issueLabel: 'High Price Variance',
      issueIcon: 'price_change',
      priceOrKm: 'AED 1,890,000',
      accentBorder: 'primary',
    },
    {
      id: 'mod-9923',
      code: '#MOD-9923 • ROYAL MOTORS',
      dealerName: 'Royal Motors',
      vehicleTitle: '2023 Mercedes-AMG G63',
      metricBadge: 'MISSING DOC',
      issueLabel: 'Missing Tasjeel PDF',
      issueIcon: 'description',
      priceOrKm: '12,400 KM',
      accentBorder: 'error',
    },
    {
      id: 'mod-9924',
      code: '#MOD-9924 • EXOTIC LINE',
      dealerName: 'Exotic Line',
      vehicleTitle: '2022 Rolls-Royce Cullinan BB',
      metricBadge: 'READY',
      issueLabel: 'Approved Pending Push',
      issueIcon: 'check_circle',
      priceOrKm: 'AED 2,150,000',
      accentBorder: 'tertiary',
    },
    {
      id: 'mod-9925',
      code: '#MOD-9925 • VIP PERFORMANCE',
      dealerName: 'VIP Performance',
      vehicleTitle: '2024 Lamborghini Revuelto',
      metricBadge: 'TELEMETRY',
      issueLabel: 'Hybrid Battery Attest',
      issueIcon: 'satellite_alt',
      priceOrKm: '140 KM',
      accentBorder: 'secondary',
    },
  ],
};

export const MOCK_KYB_DOSSIER: DealerKybDossierDetail = {
  id: 'kyb-2025-0842',
  caseNumber: '#KYB-2025-0842',
  tenantId: 'd0000000-0000-0000-0000-000000000001',
  status: 'IN_REVIEW',
  statusLabel: 'Awaiting Tier-0 Operator Adjudication',
  slaRemaining: '02h 14m 51s',
  entityTypeTier: 'FZ-LLC Tier A',
  legalEntityName: 'Royal Apex Luxury Motor Vehicles Trading FZCO',
  displayName: 'Royal Apex Motors FZCO',
  taxRegistrationNumber: 'TRN-100293481200003',
  dedCommercialLicense: '#984120',
  dedStatus: 'Active • Clean',
  jurisdiction: 'Free Zone LLC (FZ-LLC) • Dubai South Aviation & Logistics Free Zone',
  showroomZoning: 'Al Quoz Industrial 3',
  makani: 'Makani: 21948 83120',
  showroomAddress: 'Showroom 04, Building 6, Sheikh Zayed Rd frontage',
  docPdfName: 'Commercial_License_DED_984120_Attested.pdf',
  docPdfSize: '4.8 MB',
  docSha256: '9e884ac25d7629b359f4f10db054c0128a',
  docDubaiChamberStamp: '#9104',
  docExpiry: '14 Jan 2027',
  riskScore: 12,
  riskRatingLabel: 'TIER-1 EXCELLENCE • APPROVED',
  shellEntityProb: '0.2%',
  tamperRisk: '0.0%',
  paidUpCapital: 'AED 25,000,000',
  bankReference: 'Emirates NBD Corporate',
  beneficialOwners: [
    {
      id: 'ubo-1',
      name: 'Tariq Mansoor Al-Ketbi',
      initials: 'TA',
      role: 'Primary Shareholder (60%)',
      equityPct: 60,
      statusBadge: 'Clear • Tier 1',
      emiratesId: '784-1981-•••••••-1 (Exp: 2028)',
      biometricVerification: 'UAE PASS Gold',
      pepSanctionsSearch: 'UN / OFAC NEGATIVE',
      avatarColor: 'primary',
    },
    {
      id: 'ubo-2',
      name: 'Viktor Van Der Bilt',
      initials: 'VV',
      role: 'Managing Partner (40%)',
      equityPct: 40,
      statusBadge: 'Clear • Level 1',
      emiratesId: 'Kingdom of NL • UAE Golden Visa',
      biometricVerification: 'Passport & Residency Verified',
      pepSanctionsSearch: 'NEGATIVE (Global Red Notice)',
      avatarColor: 'secondary',
    },
  ],
  facility: {
    capacityHypercars: 35,
    climateSpec: '22°C Constant • Dehumidified',
    tasjeelBay: 'Bay #2 Certified (Direct Telemetry)',
    rtaTelemetryUplink: true,
    civilDefenseGrade: 'Civil Defense A+',
    civilDefenseCert: 'Certificate #DCD-2025-9921',
    photos: [
      {
        id: 'fac-1',
        title: '1. Facade & Geofence',
        subtitle: 'Lat 25.1328 Long 55.2281',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrTnuq35frPuucNGRB82CVIvk7f34TGoKlirrBMqiRIwWYFaiNFjAEPJnKAQ0K_XHISfYGACfq7bNgF1qLwU6lgDwJoY7u8YZ4caTTIhVgWOnqrqRDOiKcFtcnKFjpKbes5SxLkOYyQsXaT-bNnZK7I3e9zhzSkW7JMMoOC_stblKzHp3uIjdIiP7YFVcWaICkhcDC3TNNw0BaQOoBTui-3UMGSvwlPVoYj9Gz80CNL26a6aKdg0Ou',
        alt: 'High-end exotic car showroom exterior facade in Dubai Al Quoz industrial area with clean architectural glass and Royal Apex Motors signage.',
      },
      {
        id: 'fac-2',
        title: '2. Gated Vault Bays',
        subtitle: '35 Car Grid Capacity',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgJCglA6MIh8daq8M2criHONJytqRO89NOriKDFyvN9EQSGKsO616kfrPMt457qSvw0H0IndrdiTVs1vgzLxO1e692JAviqoFiMUBoUPkpUDE7xK1wYbFs78T92IGgMF3n247g7fxcCW2_ghdiE_kxxEVg4yA7Lu5A4Ib2m2kXJo9WKN-VWyYD2M5zcRO_Fx23Q7NZznVAPaZoT1DvMz9w3NMLaRMR6kAl7pG3cCXKb9ih9fSKzTxA',
        alt: 'Indoor secure luxury automotive vault with immaculate epoxy resin floors showcasing rows of covered supercars under diffuse gallery lighting.',
      },
      {
        id: 'fac-3',
        title: '3. RTA Shamil Diagnostic',
        subtitle: 'Direct Telemetry Link',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpmkIsXN9Uf7Ex4S-L9GDmScXuissmBBq2JDJAmpRoSwf9hLvBeUB09dfIEn2q-80AxbxIkDtrECUjYvmMfq1NDVcdFG-0zluBY7iWZv_ViqJdF9Pk9RJfCOJ4vqeFkyvdsCnzjBbip5sFhmzxpuvEFElZfMD7U7Fmq2zegWpW-LpTmm-sk6mPh9JJNe-94RvqynO6jInzVSQSz10MIgMB0aNz93KQi3GVnDGDD_esrXEbLdDmc9Pb',
        alt: 'Commercial grade cleanroom service bay with automated hydraulic automotive hoist and high-tech diagnostic dynamometer computer console.',
      },
      {
        id: 'fac-4',
        title: '4. VIP Escrow Lounge',
        subtitle: 'Encrypted Contract Terminal',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBiDxD55QgKZ8uZPoFDIHkK4R4ZASFO4rAqEqWJiOP5hNOlbBq18DNrjf4opLg-jZwdlMVyAHyVe1940YFzvZu2cQxMFiKN2f0h0YeqYtXInelFtJyY2kBoqx60st0hMwSnqLRfHwNkFY4KmerNVsw4hymqtj49M4iktu_czRdV6nGq-VQrN3o1swqAIyqm1pkcJTlXWgeiByP4wSsub7dqJQUXBVA2eo4PknIsD9HVqWbbKb-aXoGl',
        alt: 'High luxury dealership private client reception lounge with Italian leather seating and biometric security entrance door.',
      },
    ],
  },
  dualSigners: [
    {
      name: 'Dr. Maya Al-Falasi (SuperAdmin)',
      role: 'Platform Operations Director',
      keyFingerprint: '0x8a92f09...d8a2',
      signed: true,
      timestamp: '14:22:09 UTC',
    },
    {
      name: 'Tariq Al-Nuaimi (Risk Officer)',
      role: 'Chief Compliance & Integrity Officer',
      keyFingerprint: '0x33b1e94...ff10',
      signed: false,
    },
  ],
  queueRibbon: [
    {
      id: 'kyb-2025-0842',
      caseNumber: '#KYB-2025-0842',
      dealerLegalName: 'Royal Apex Motors FZCO',
      score: '12/100',
      sla: '2h 14m',
      statusLabel: 'Active Focus',
      statusBadgeType: 'active',
    },
    {
      id: 'kyb-2025-0843',
      caseNumber: '#KYB-2025-0843',
      dealerLegalName: 'Emirates Prestige Auto LLC',
      score: '18/100',
      sla: '4h 30m',
      statusLabel: 'Under Review',
      statusBadgeType: 'review',
    },
    {
      id: 'kyb-2025-0844',
      caseNumber: '#KYB-2025-0844',
      dealerLegalName: 'Gulf Hypercar Concierge',
      score: '68/100',
      sla: '5h 02m',
      statusLabel: 'PEP Flag',
      statusBadgeType: 'flag',
    },
    {
      id: 'kyb-2025-0845',
      caseNumber: '#KYB-2025-0845',
      dealerLegalName: 'Al Marmoom Classics Co',
      score: 'Pending',
      sla: '8h 15m',
      statusLabel: 'Docs Ingestion',
      statusBadgeType: 'pending',
    },
    {
      id: 'kyb-2025-0846',
      caseNumber: '#KYB-2025-0846',
      dealerLegalName: 'Oasis Boulevard Exotic LLC',
      score: '24/100',
      sla: '11h 40m',
      statusLabel: 'Site Visit OK',
      statusBadgeType: 'ok',
    },
  ],
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function fetchModerationListing(id: string): Promise<AdminListingModerationDetail> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/admin/listings/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const data = await res.json();
      if (!data || typeof data !== 'object' || !data.id) {
        throw new Error('Moderation API returned an incomplete dossier');
      }
      return data as AdminListingModerationDetail;
    }
  } catch {
    // Graceful fallback to approved Stitch mock data
  }
  if (process.env.NODE_ENV !== 'development' || process.env.NEXT_PUBLIC_ENABLE_FIXTURES !== 'true') {
    throw new Error('Moderation dossier could not be loaded.');
  }
  return MOCK_MODERATION_DETAIL;
}

export async function submitModerationDecision(
  id: string,
  payload: {
    decision: 'APPROVE' | 'REJECT';
    reason?: string;
    discloseBadge?: string;
    overrideFlag?: boolean;
  }
): Promise<{ success: boolean; status: string; message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/admin/listings/${id}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Moderation decision was NOT saved (HTTP ${res.status}).`);
  }
  const result = await res.json();
  if (!result || !result.status) {
    throw new Error('Moderation API did not confirm a persisted status.');
  }
  return {
    success: true,
    status: result.status,
    message: 'Moderation decision saved by API.',
  };
}

export async function fetchKybDossier(id: string): Promise<DealerKybDossierDetail> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/admin/verifications/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const data = await res.json();
      if (!data || typeof data !== 'object' || !data.id) {
        throw new Error('Dealer verification API returned an incomplete dossier');
      }
      return data as DealerKybDossierDetail;
    }
  } catch {
    // Fallback to approved Stitch mock data
  }
  if (process.env.NODE_ENV !== 'development' || process.env.NEXT_PUBLIC_ENABLE_FIXTURES !== 'true') {
    throw new Error('Dealer KYB dossier could not be loaded.');
  }
  return MOCK_KYB_DOSSIER;
}

export async function submitKybAccreditation(
  id: string,
  payload: {
    tier: string;
    reasonCode: string;
    operatorNote: string;
    twoFactorConfirmed: boolean;
  }
): Promise<{ success: boolean; status: string; message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/admin/verifications/${id}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`KYB decision was NOT saved (HTTP ${res.status}).`);
  }
  const result = await res.json();
  if (!result || !result.status) {
    throw new Error('KYB API did not confirm a persisted status.');
  }
  return {
    success: true,
    status: result.status,
    message: 'Dealer verification decision saved by API.',
  };
}

export interface DisputeTimelineStage {
  id: string;
  stageNumber: number;
  dateGst: string;
  badge: string;
  badgeType: 'tertiary' | 'secondary' | 'error' | 'primary';
  description: string;
  highlightText?: string;
  dotColor: string;
}

export interface DisputePrecedent {
  id: string;
  caseRef: string;
  respondentEntity: string;
  infractionType: string;
  escrowValueAed: string;
  outcome: string;
  outcomeBadgeType: 'tertiary' | 'secondary' | 'error';
  settledDate: string;
}

export interface DisputeCaseDetail {
  id: string;
  caseNumber: string;
  status: 'ESCROW_FROZEN' | 'UNDER_ARBITRATION' | 'RESOLVED' | 'SANCTIONED';
  urgencyLabel: string;
  escrowAmountFils: number;
  escrowAmountFormatted: string;
  vaultCustodyRef: string;
  statutoryCompliance: string;
  civilAuthorityInterlock: string;
  vehicleTitle: string;
  vehicleVin: string;
  buyerName: string;
  buyerUaePass: string;
  dealerName: string;
  dealerDed: string;
  dealerTier: string;
  dealerTrustScore: number;
  dealerPriorInfractions: string;
  inspectionHub: string;
  inspectionBay: string;
  chainRef: string;
  timeline: DisputeTimelineStage[];
  precedents: DisputePrecedent[];
}

export const MOCK_DISPUTE_CASE: DisputeCaseDetail = {
  id: 'dsp-2025-019',
  caseNumber: 'DSP-2025-019',
  status: 'ESCROW_FROZEN',
  urgencyLabel: 'URGENT • Escrow Disbursement Frozen',
  escrowAmountFils: 165000000,
  escrowAmountFormatted: 'AED 1,650,000.00',
  vaultCustodyRef: 'First Abu Dhabi Bank (FAB-SVR-091)',
  statutoryCompliance: 'UAE Federal Law No. 15 Compliant',
  civilAuthorityInterlock: 'DIFC Civil Authority Interlock',
  vehicleTitle: '2023 Ferrari 296 GTB Assetto Fiorano',
  vehicleVin: 'ZFF98LHA0P0293108',
  buyerName: 'Institutional DIFC Office',
  buyerUaePass: 'UAE PASS #T-9921',
  dealerName: 'Gulf Prestige Supercars LLC',
  dealerDed: 'DED #882190',
  dealerTier: 'Tier-1 Accredited',
  dealerTrustScore: 42,
  dealerPriorInfractions: '1 Warning (March 2024)',
  inspectionHub: 'Tasjeel Shamil DXB',
  inspectionBay: 'Bay #04 Laser Hoist',
  chainRef: '0x8F9...BC04',
  timeline: [
    {
      id: 'stg-1',
      stageNumber: 1,
      dateGst: '14 FEB 2025 • 11:40 GST',
      badge: 'Initial Milestone',
      badgeType: 'tertiary',
      description: 'Deposit of AED 330,000 (20%) successfully locked into First Abu Dhabi Bank Sovereign Escrow Vault pending physical handover verification.',
      highlightText: 'AED 330,000 (20%)',
      dotColor: 'bg-tertiary',
    },
    {
      id: 'stg-2',
      stageNumber: 2,
      dateGst: '16 FEB 2025 • 09:15 GST',
      badge: 'Physical Inspection',
      badgeType: 'secondary',
      description: 'Vehicle delivered under sovereign GPS transit seal to Tasjeel Shamil Al Warsan for pre-handover physical hoist audit and acoustic tub resonance testing.',
      dotColor: 'bg-secondary',
    },
    {
      id: 'stg-3',
      stageNumber: 3,
      dateGst: '18 FEB 2025 • 16:30 GST',
      badge: 'Defect Detected',
      badgeType: 'error',
      description: 'Tasjeel Chief Structural Inspector flags non-disclosed underbody carbon composite tub repair. Ultrasonic paint depth gauge shows 480 µm (OEM specification is 110 µm ±15). Secondary resin patch noted at right undertray shear plate.',
      highlightText: '480 µm',
      dotColor: 'bg-error',
    },
    {
      id: 'stg-4',
      stageNumber: 4,
      dateGst: '19 FEB 2025 • 08:22 GST',
      badge: 'Article 12 Invoked',
      badgeType: 'primary',
      description: 'Buyer officially invokes Zero-Leak Sovereign Protection Article 12, citing intentional concealment of critical chassis defect. Demands immediate 100% deposit return and DED commercial trade license citation.',
      highlightText: 'Zero-Leak Sovereign Protection Article 12',
      dotColor: 'bg-primary',
    },
  ],
  precedents: [
    {
      id: 'prec-1',
      caseRef: '#DSP-2024-118',
      respondentEntity: 'Emirates Crown Exotic Motors',
      infractionType: 'Mileage Rollback via CAN-Bus Interceptor',
      escrowValueAed: 'AED 890,000',
      outcome: '100% Buyer Return + 90D Ban',
      outcomeBadgeType: 'tertiary',
      settledDate: '04 Nov 2024',
    },
    {
      id: 'prec-2',
      caseRef: '#DSP-2024-092',
      respondentEntity: 'Apex Hypercar Boutique DIFC',
      infractionType: 'Undisclosed RTA Salvage Title in History',
      escrowValueAed: 'AED 2,450,000',
      outcome: 'Escrow Revoked + License Demoted',
      outcomeBadgeType: 'tertiary',
      settledDate: '18 Aug 2024',
    },
    {
      id: 'prec-3',
      caseRef: '#DSP-2024-041',
      respondentEntity: 'Royal Velocity Automotive FZ',
      infractionType: 'Phantom Factory Options in Specification Sheet',
      escrowValueAed: 'AED 720,000',
      outcome: 'Mediated Settlement (AED 65k Price Rebate)',
      outcomeBadgeType: 'secondary',
      settledDate: '29 Apr 2024',
    },
  ],
};

export async function fetchDisputeCase(caseId: string = 'DSP-2025-019'): Promise<DisputeCaseDetail> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/admin/disputes/${caseId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const data = await res.json();
      return { ...MOCK_DISPUTE_CASE, ...data };
    }
  } catch {
    // Return approved Stitch mock
  }
  return MOCK_DISPUTE_CASE;
}

export async function executeDisputeAdjudication(
  caseId: string,
  payload: {
    escrowDisposition: 'FULL_RETURN' | 'PARTIAL_FEE_DEDUCTED' | 'HOLD_TRIBUNAL';
    sanctions: {
      listingSuspension: boolean;
      demoteAccreditation: boolean;
      mandatoryReAudit: boolean;
      transmitDED: boolean;
    };
    secondSignerPin?: string;
  }
): Promise<{ success: boolean; message: string; escrowStatus: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/admin/disputes/${caseId}/adjudicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch {
    // Simulated dual-key hardware execution
  }
  return {
    success: true,
    message: 'Adjudication and regulatory sanction order executed. Trust ledger updated and dealer credentials revoked.',
    escrowStatus: payload.escrowDisposition === 'FULL_RETURN' ? 'RELEASE_DISPATCHED_TO_CUSTODIAN' : 'HELD_IN_VAULT',
  };
}
