import { buyerApiFetch, BuyerApiError } from './buyer-api-client';
/**
 * Automotive OS Marketplace Typed API Client
 * Connects to NestJS Backend (/api/v1/public/listings & /api/v1/public/listings/:id/leads)
 * with verified Stitch fallback fixtures (screens f8eeabe57ad843a1b14e3323102c8151 & 1ff78cd6f95845538cc81b3849e62c88).
 */

export interface PublicPrice {
  currency: string;
  amountFils: string;
}

export interface PublicSeller {
  id: string;
  slug: string;
  displayName: string;
  emirate: string;
  city: string;
  verified: boolean;
  score?: number;
  allocationsCount?: number;
  dedLicense?: string;
  rtaLicense?: string;
  address?: string;
  directPhone?: string;
}

export interface PublicMedia {
  id: string;
  kind: string;
  url: string;
  altText: string | null;
  sortOrder?: number;
}

export interface PublicListingItem {
  id: string;
  slug: string;
  title: string;
  price: PublicPrice;
  year: number;
  mileageKm: number | null;
  condition: string;
  gccSpec?: boolean;
  emirate: string;
  seller: PublicSeller;
  media: PublicMedia[];
  publishedAt: string;
  isFixture?: boolean;
}

export interface PaintReadingItem {
  panel: string;
  value: string;
  status: string;
}

export interface FactoryOptionItem {
  title: string;
  description: string;
}

export interface ServiceHistoryItem {
  title: string;
  date: string;
  invoiceNumber: string;
  description: string;
}

export interface PublicListingDetail extends PublicListingItem {
  description: string | null;
  makeName: string;
  modelName: string;
  trim: string | null;
  colorExterior: string | null;
  colorInterior?: string | null;
  fuel: string | null;
  transmission: string | null;
  maskedVin: string | null;
  stockNumber: string;
  chassisCode?: string;
  powertrain?: string;
  engineSpec?: string;
  horsepower?: string;
  torque?: string;
  acceleration?: string;
  topSpeed?: string;
  downforce?: string;
  curbWeight?: string;
  brakingSpec?: string;
  wheelSpec?: string;
  inspectionScore?: string;
  monthlyEstimateAed?: number;
  warrantyInfo?: string;
  warrantyExpiry?: string;
  deliveryDate?: string;
  paintReadings?: PaintReadingItem[];
  factoryOptions?: FactoryOptionItem[];
  serviceHistory?: ServiceHistoryItem[];
  benchmarkMedianAed?: number;
}

export interface PublicListingSearchResponse {
  items: PublicListingItem[];
  total: number;
  page: number;
  limit: number;
}

export interface PublicListingQuery {
  emirate?: string;
  make?: string;
  q?: string;
  sort?: 'recent' | 'price-asc' | 'price-desc';
  model?: string;
  condition?: string;
  gccSpec?: boolean;
  dealerSlug?: string;
  minPriceFils?: number;
  maxPriceFils?: number;
  page?: number;
  limit?: number;
}

export interface CreateLeadEnquiryPayload {
  intent: 'TEST_DRIVE' | 'OFFER' | 'INSPECTION' | 'FINANCING' | 'EXPORT_INQUIRY';
  preferredContact: 'PHONE' | 'WHATSAPP' | 'EMAIL';
  message?: string;
  fieldsToShare: string[];
  consentTextVersion: string;
  buyerName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  licenseTier?: string;
  evaluationMode?: 'TRACK' | 'LOUNGE';
  targetDate?: string;
  targetSlot?: string;
}

export interface LeadEnquiryResponse {
  id: string;
  status: string;
  listingId: string;
  tenantId: string;
  createdAt: string;
  referenceCode: string;
  hostName?: string;
  scheduledDate?: string;
  scheduledSlot?: string;
  venue?: string;
  isFixture?: boolean;
}

/**
 * Detailed Porsche 911 GT3 RS Weissach Fixture strictly matching Stitch Screen f8eeabe57ad843a1b14e3323102c8151
 */
export const PORSCHE_GT3RS_DETAIL_FIXTURE: PublicListingDetail = {
  id: 'stitch-fix-porsche-911',
  slug: '2024-porsche-911-gt3-rs-weissach-dubai',
  title: '2024 Porsche 911 GT3 RS Weissach Package',
  price: { currency: 'AED', amountFils: '142000000' },
  year: 2024,
  mileageKm: 1850,
  condition: 'USED',
  gccSpec: true,
  emirate: 'Dubai',
  seller: {
    id: 'apex-gt-motors-fz-id',
    slug: 'apex-gt-motors',
    displayName: 'Apex GT Motors FZCO',
    emirate: 'Dubai',
    city: 'Dubai',
    verified: true,
    score: 4.96,
    allocationsCount: 42,
    dedLicense: 'DED Commercial Lic #984210',
    rtaLicense: 'RTA Lic #774912',
    address: 'Showroom 12, Street 8, Al Quoz Industrial 4, Dubai',
    directPhone: '+971 4 820 9000',
  },
  media: [
    {
      id: 'p-hero',
      kind: 'EXTERIOR',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDllvhLjk7Z0QILDoRO3uk4PbJCzoFJ0Yiq3INeuiwPqPEK5JeArDG4OlfGnpIa09HzYtqY0hwzRdnJTlSD7vdeG6X2hOYGBZ7LGaqw2-E3sdChyzyuNhuanyc3ick3lFl84cMTbztSjp9At1Y_bAGaH_Fwugqm7-ivIdgFkLGY3Htjxb1Rzr6opS1vMz2FGUr8Jm_kHvpg5jW-BJ1VHm2LgSaXfLsl9VTjieHHFuarqj1h6vwKJo-f',
      altText: '2024 Porsche 911 GT3 RS Weissach Package Front Profile in Dark Studio',
      sortOrder: 0,
    },
    {
      id: 'p-front-34',
      kind: 'EXTERIOR',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqaTC_xwjP62HsDrm_yHEtB5xIXhVl34hAwcPZCpyAfsNGZTdScWH3BB3_ELUC956GRajjV93aRRtwNO8uhkwUyEsxUAcrWeEbt2gNFvp3ND3Y1dzGIEO2Zx_6XXiIXILtNdzTZAnI5yZkbsWSyluEtOvHGa_dhRnCJGXYWeLNcCIMc3Cii5XXbHYWrRhduOo5JWMrl2EVfgiVgXDcJYquMqaR-jMBn2h2kCS85cJUJ9u2vXPyoxY2',
      altText: 'Porsche GT3 RS Weissach in Ice Grey with exposed carbon front bonnet',
      sortOrder: 1,
    },
    {
      id: 'p-rear-wing',
      kind: 'EXTERIOR',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATIxIg8xu9wt7pB9y7g50jkye3i7AQs-ZWMmjZIDNolK_IZTtDNl2MEh1uioNkc0o19N4_mNLKXh7lpz1r2DDFmSJYY54xKQj__Cds-y_zE0yfEJpDgOhRr__38Th-wqP6esp5c-uPT5Q9FfsqmsLvQqtCcZzygmCjX3p-t6oYT72D6O_NiikW2W4GtQHd3b9_ef3WISLUCVhLpIp3EfuQeVvV4JZn9eM6zPyHcd7UougU9O4Np4nx',
      altText: 'High downforce swan-neck active DRS carbon fiber rear wing',
      sortOrder: 2,
    },
    {
      id: 'p-interior',
      kind: 'INTERIOR',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwyYohrhmmc_arVyF3V2sUtASjLTqLJMF2GNduC-mV6j0fvTpJV0cBdESJSbwyBNtXDJN4JcJVLm76wEx_Uf6MG3whCdN39_MMS0qORV2m_G1n_H6hhLQlFxbOA4SDf9aUnPlMDpkGiMXEC_EtEWyHPWbRNDGZ1Ezu6wEmRdAPILgmvb_yTmj4kCgnT6VlaWbJfCbK4Krs_JgLf0q097iKrCcS3Ecgek2zMutF7QK9xZQFEMipMPAl',
      altText: 'Interior cabin with Weissach carbon bucket seats and Race-Tex steering wheel',
      sortOrder: 3,
    },
    {
      id: 'p-instruments',
      kind: 'INTERIOR',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTIBlcnHScxiO1T5LI9_SJdZ3SFWVMmVB-eeKoiNyQ5Zao7zF4trPJCmhyWXkUjGqaaeUvlln_JnlWhXhQVTInUgpF0EgsS7bykUEm7iFZMbn39gxkP1G98Da8LLamwHgW2Yvd59_S_rgC-zISgqYU-1pMXhtGpIVPY-kaaSKjlA0qL1ppxNw6DRa8-6YUPhAtbZUZBxFIiNgsGLXooc90nBxp7f8Pt_Jyn1eMXDTa837L43_Hy1oy',
      altText: 'Porsche digital and analog central 9000 RPM tachometer display',
      sortOrder: 4,
    },
    {
      id: 'p-engine',
      kind: 'MECHANICAL',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA87n8czgclFPA8Z6VNH3tSfqxHTN0jo2ZB9oOgrf85iNCzBqF6P5VN9ic9JQwVYvEeOXWVfVK1U_mJS61PC6lpvy_sQfsk9D4QXVFcr7oh7O1X858_VsIr7sGrBgdGCAGH1lCQiLnVb7RSYW3mubiwkQSYxb0kh0LK7QVB_kPkVMxDhA4dAdFBQfO89r6HerNgBKxbliweCxk-rS7IG68RpPBdx30RcnFsnPDK6703j-sPvu__ZYNt',
      altText: '4.0L naturally aspirated atmospheric flat-six boxer engine',
      sortOrder: 5,
    },
    {
      id: 'p-chassis-tag',
      kind: 'DOCUMENT',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFSZsH83MyZ5Gqh2CD0U2KKRE-TppSNihszp1LVINmn6t2Adb22kfzhhCtnvzi0HGgWVV1F4SWY8pITvcAgozeNPMCO6ShTc2c2x71uveN8LJwJb6MymQQzWjsBth-iA4AbJlkIxVHDkcz0xzBKUHbg-KHBtfYNE7Yk4yGaj7Kmslb1Kp6auKd_WAy2Qy2QZtPYKrp4CUguCHXsQGQF_0GcOZ_LYmhfodT0qHwZRSertxgbz1Vrc8T',
      altText: 'Original Stuttgart aluminum door jamb chassis plate and GCC Gulf Conformity seal',
      sortOrder: 6,
    },
  ],
  publishedAt: '2025-02-18T10:00:00.000Z',
  description:
    'An immaculate, single-owner 2024 Porsche 911 GT3 RS Weissach Package in Ice Grey Metallic with exposed satin carbon bonnet and magnesium wheels. Delivered new via Ali & Sons Porsche Centre Dubai with full factory warranty, Tasjeel Class 1 pass certification, and full-body XPEL Stealth paint protection film.',
  makeName: 'Porsche',
  modelName: '911 GT3 RS',
  trim: 'Weissach Package (992.1)',
  colorExterior: 'Ice Grey Metallic (M7X) / Satin Pyro Red',
  colorInterior: 'Race-Tex / Black Leather / Guards Red Stitching',
  fuel: 'PETROL',
  transmission: '7-Speed PDK Motorsport',
  maskedVin: 'WP0AF2A97RS••••••',
  stockNumber: 'Stock #DXB-911-RS',
  chassisCode: '992.1 RS',
  powertrain: '4.0L Naturally Aspirated Flat-6 Boxer',
  engineSpec: 'Flat-6 Boxer / Dry Sump / Individual Throttle Bodies',
  horsepower: '518 BHP @ 8,500 RPM',
  torque: '465 Nm @ 6,300 RPM',
  acceleration: '3.2 Seconds (0-100 km/h)',
  topSpeed: '296 km/h',
  downforce: '860 kg @ 285 km/h',
  curbWeight: '1,450 kg (Weissach Weight Reduction)',
  brakingSpec: 'PCCB Carbon Ceramics (410mm Front / 390mm Rear)',
  wheelSpec: '20"/21" Forged Magnesium in Satin Pyro Red',
  inspectionScore: '99/100 Grade Tier 1 (Class 1 Pass)',
  monthlyEstimateAed: 24150,
  warrantyInfo: 'Ali & Sons Porsche Centre Official GCC Warranty',
  warrantyExpiry: 'Active until June 2027 (Porsche Approved extendable to 15 yrs)',
  deliveryDate: 'Delivered Oct 2024',
  paintReadings: [
    { panel: 'Front Hood', value: 'Carbon OEM', status: 'XPEL PPF Installed' },
    { panel: 'LF Fender', value: '120 µm', status: 'Factory Range' },
    { panel: 'RF Fender', value: '122 µm', status: 'Factory Range' },
    { panel: 'Driver Door', value: '118 µm', status: 'Factory Range' },
    { panel: 'Pass Door', value: '121 µm', status: 'Factory Range' },
    { panel: 'Rear Quarters', value: '124 µm', status: 'Factory Range' },
  ],
  factoryOptions: [
    {
      title: 'Full Weissach Package (P70)',
      description:
        'Carbon exterior hood, roof, rear wing, roll cage, anti-roll bars, carbon paddle shifters with magnetic technology.',
    },
    {
      title: 'PCCB Ceramic Composite Brakes (0PC)',
      description:
        'Yellow calipers, 410mm cross-drilled ceramic discs with extreme high-heat threshold.',
    },
    {
      title: 'Hydraulic Front Axle Lift System (2UH)',
      description:
        'Smart GPS memory front suspension lifter with automatic location speedbump clearing.',
    },
    {
      title: 'LED Matrix Headlights in Black (8JU)',
      description:
        'Porsche Dynamic Light System Plus (PDLS+) with tinted aerodynamic surrounds.',
    },
    {
      title: 'Bose® High-End Surround Sound (9VL)',
      description:
        '12 active speakers with lightweight acoustic enclosure integration.',
    },
    {
      title: 'Club Sport Package + 6-Point Harnesses',
      description:
        'Factory roll cage bolted to chassis points with fire extinguisher and FIA driver harness.',
    },
  ],
  serviceHistory: [
    {
      title: 'Pre-Delivery & Running-in Inspection (1,500 KM)',
      date: 'Completed 12 Jan 2025',
      invoiceNumber: 'Inv #PCD-90223',
      description:
        'Authorized Porsche Centre Dubai. Replaced initial break-in engine oil (Mobil 1 C40 GT 0W-40), differential fluid inspection, electronic torque validation on center-lock magnesium wheels.',
    },
  ],
  benchmarkMedianAed: 1460000,
  isFixture: true,
};

/**
 * Standard Verified Stitch design fixtures matching approved Stitch screens
 */
export const VERIFIED_STITCH_FIXTURES: PublicListingItem[] = [
  {
    id: '11111111-1111-1111-1111-cccc00000001',
    slug: '2024-toyota-land-cruiser-gr-sport-dubai',
    title: '2024 Toyota Land Cruiser GR-Sport V6 Twin-Turbo',
    price: { currency: 'AED', amountFils: '35000000' },
    year: 2024,
    mileageKm: 150,
    condition: 'NEW',
    gccSpec: true,
    emirate: 'Dubai',
    seller: {
      id: '11111111-1111-1111-1111-111111111111',
      slug: 'al-futtaim-prestige',
      displayName: 'Al Futtaim Prestige Motors',
      emirate: 'Dubai',
      city: 'Dubai',
      verified: true,
      score: 4.92,
      allocationsCount: 58,
      dedLicense: 'DED Lic #550212',
    },
    media: [
      {
        id: 'm1',
        kind: 'EXTERIOR',
        url: 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=1200&q=80',
        altText: '2024 Toyota Land Cruiser GR-Sport Front 3/4 Studio View',
      },
    ],
    publishedAt: new Date().toISOString(),
    isFixture: true,
  },
  {
    ...PORSCHE_GT3RS_DETAIL_FIXTURE,
  },
  {
    id: 'stitch-fix-g63',
    slug: '2024-mercedes-amg-g63-golden-jubilee-dubai',
    title: '2024 Mercedes-AMG G 63 UAE Golden Jubilee Edition',
    price: { currency: 'AED', amountFils: '115000000' },
    year: 2024,
    mileageKm: 850,
    condition: 'NEW',
    gccSpec: true,
    emirate: 'Dubai',
    seller: {
      id: '22222222-2222-2222-2222-222222222222',
      slug: 'gargash-autos',
      displayName: 'Gargash Emirates Autos',
      emirate: 'Dubai',
      city: 'Dubai',
      verified: true,
      score: 4.95,
      allocationsCount: 36,
    },
    media: [
      {
        id: 'm3',
        kind: 'EXTERIOR',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACbFO15MxFD7ArKzLXKvSNdJlJxTey3pk8BxZhhKpFTMo5MEicPi6dVNBDMX7Ha3NaLF_e9WFaRcMs3uKUc-OEFuduhERntWRsqu-hveueQ4zwnznoX37wK-ZrryWlxZMbiaAlW1g2S_hlkH_C8HaMLqyMTOV-6_jq9Pxw4iQXG-afQ_Sj7QXMiXqowjwoeoxqluIRvzkrUqGc-tjjwvrICViWTRoeMWMI7seT6WPFyFG-C6S7sREh',
        altText: 'Mercedes-AMG G 63 Matte Magno Black',
      },
    ],
    publishedAt: new Date().toISOString(),
    isFixture: true,
  },
  {
    id: 'stitch-fix-defender',
    slug: '2024-land-rover-defender-110-v8-abu-dhabi',
    title: '2024 Land Rover Defender 110 V8 Carpathian Edition',
    price: { currency: 'AED', amountFils: '56500000' },
    year: 2024,
    mileageKm: 2100,
    condition: 'USED',
    gccSpec: true,
    emirate: 'Abu Dhabi',
    seller: {
      id: '11111111-1111-1111-1111-111111111111',
      slug: 'al-futtaim-prestige',
      displayName: 'Al Futtaim Prestige Motors',
      emirate: 'Abu Dhabi',
      city: 'Abu Dhabi',
      verified: true,
    },
    media: [
      {
        id: 'm4',
        kind: 'EXTERIOR',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqTgu-b73jKDOyEduVjgcIo1ZAGQFI2uwQC11LhSAlok2W89HD0cUPuTxW6Ah62TuRin9-_QmkNh5DDyshcDFPb3zA4hA9jb_LSZRdnB-buHDITgx-MOhrLmPICux1DGrXRZwCxN5mcqpBRgXnfYmeV8NNTi-WossZ6OH5JdtA8pY-3PbwpY7HnGZbmja9D62qtw1XmhAoocX-J-o0nSr8XLhwhE8PVFsg7n2l70orujqm9gWOgV3I',
        altText: '2024 Land Rover Defender 110 V8 Carpathian Edition',
      },
    ],
    publishedAt: new Date().toISOString(),
    isFixture: true,
  },
  {
    id: 'stitch-fix-ferrari-296',
    slug: '2024-ferrari-296-gtb-assetto-fiorano-dubai',
    title: '2024 Ferrari 296 GTB Assetto Fiorano Hybrid',
    price: { currency: 'AED', amountFils: '169000000' },
    year: 2024,
    mileageKm: 920,
    condition: 'USED',
    gccSpec: true,
    emirate: 'Dubai',
    seller: {
      id: '22222222-2222-2222-2222-222222222222',
      slug: 'gargash-autos',
      displayName: 'Gargash Emirates Autos',
      emirate: 'Dubai',
      city: 'Dubai',
      verified: true,
    },
    media: [
      {
        id: 'm5',
        kind: 'EXTERIOR',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdDRtsJzsBuN-OToyyUZnzNhKqq4GkFkLQjoJps2VA1-47y_ZsN3DEdUJPXdQpsvAwVbEiloWmwX4TKWrFNQTkLBBmhDKkMmtFxHRvK6u3YFWuNKnxXnxz5rgyy-EcTwOROd2RVyy3O6-xYmxM7hU2yFKyV-68eJfIc5yQGHSnD2aE4IHTGHPBgfszWgR1SjO0INAEWPKmCHz_WEzNk3Fu3-2keLAw6_8jY2fWNPiGSJHT9MCKHfU2',
        altText: 'Ferrari 296 GTB Rosso Corsa',
      },
    ],
    publishedAt: new Date().toISOString(),
    isFixture: true,
  },
  {
    id: '22222222-2222-2222-2222-cccc00000001',
    slug: '2024-porsche-cayenne-turbo-gt-sharjah',
    title: '2024 Porsche Cayenne Turbo GT',
    price: { currency: 'AED', amountFils: '60000000' },
    year: 2024,
    mileageKm: 50,
    condition: 'NEW',
    gccSpec: true,
    emirate: 'Sharjah',
    seller: {
      id: '22222222-2222-2222-2222-222222222222',
      slug: 'gargash-autos',
      displayName: 'Gargash Emirates Autos',
      emirate: 'Sharjah',
      city: 'Sharjah',
      verified: true,
    },
    media: [
      {
        id: 'm6',
        kind: 'EXTERIOR',
        url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80',
        altText: '2024 Porsche Cayenne Turbo GT in Arctic Grey',
      },
    ],
    publishedAt: new Date().toISOString(),
    isFixture: true,
  },
];

/**
 * Fetch public listings from NestJS API with verified fallback
 */
export async function fetchPublicListings(
  query?: PublicListingQuery
): Promise<PublicListingSearchResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  try {
    const params = new URLSearchParams();
    if (query?.emirate && query.emirate !== 'All Emirates') {
      params.append('emirate', query.emirate);
    }
    if (query?.make) params.append('make', query.make);
    if (query?.q) params.append('q', query.q);
    if (query?.sort) params.append('sort', query.sort);
    if (query?.model) params.append('model', query.model);
    if (query?.dealerSlug) params.append('dealerSlug', query.dealerSlug);
    if (query?.condition) params.append('condition', query.condition);
    if (query?.gccSpec !== undefined) params.append('gccSpec', String(query.gccSpec));
    if (query?.minPriceFils !== undefined) params.append('minPriceFils', String(query.minPriceFils));
    if (query?.maxPriceFils !== undefined) params.append('maxPriceFils', String(query.maxPriceFils));
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));

    const response = await fetch(`${apiUrl}/api/v1/public/listings?${params.toString()}`, {
      next: { revalidate: 10 },
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.items)) {
        return {
          items: data.items.map((item: any) => ({
            ...item,
            isFixture: false,
          })),
          total: data.total,
          page: data.page,
          limit: data.limit,
        };
      }
      throw new Error('Invalid marketplace API response: expected items array');
    }
    throw new Error(`Marketplace API returned HTTP ${response.status}`);
  } catch (err) {
    // Only deliberate local component previews or audit runs with explicit flag may show Stitch fixtures.
    if (process.env.NEXT_PUBLIC_ENABLE_FIXTURES !== 'true') {
      throw err;
    }
  }

  // Filter fixtures locally
  let filtered = [...VERIFIED_STITCH_FIXTURES];

  if (query?.emirate && query.emirate !== 'All Emirates') {
    filtered = filtered.filter(
      (item) => item.emirate.toLowerCase() === query.emirate?.toLowerCase()
    );
  }

  if (query?.make) {
    filtered = filtered.filter((item) =>
      item.title.toLowerCase().includes(query.make!.toLowerCase())
    );
  }

  if (query?.condition && query.condition !== 'ALL') {
    filtered = filtered.filter((item) => item.condition === query.condition);
  }

  if (query?.maxPriceFils) {
    filtered = filtered.filter(
      (item) => Number(item.price.amountFils) <= query.maxPriceFils!
    );
  }

  return {
    items: filtered,
    total: filtered.length,
    page: query?.page || 1,
    limit: query?.limit || 20,
  };
}

/**
 * Fetch detailed public listing by slug with verified Stitch fallback
 */
export async function fetchPublicListingBySlug(slug: string): Promise<PublicListingDetail | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  try {
    const response = await fetch(`${apiUrl}/api/v1/public/listings/${slug}`, {
      next: { revalidate: 10 },
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const item = await response.json();
      return {
        ...item,
        stockNumber: item.stockNumber || `Stock #${item.slug.slice(0, 10).toUpperCase()}`,
        isFixture: false,
      };
    }
    if (response.status === 404) return null;
    throw new Error(`Vehicle details API returned HTTP ${response.status}`);
  } catch (err) {
    if (process.env.NODE_ENV !== 'development' || process.env.NEXT_PUBLIC_ENABLE_FIXTURES !== 'true') {
      throw err;
    }
  }

  // Check if requested slug matches Porsche 911 GT3 RS
  if (
    slug === '2024-porsche-911-gt3-rs-weissach-dubai' ||
    slug === 'porsche-gt3-rs' ||
    slug === 'stitch-fix-porsche-911'
  ) {
    return PORSCHE_GT3RS_DETAIL_FIXTURE;
  }

  // Check general fixtures list
  const found = VERIFIED_STITCH_FIXTURES.find(
    (item) => item.slug === slug || item.id === slug
  );

  if (found) {
    return {
      ...found,
      description: `Official GCC dealer vehicle presented by ${found.seller.displayName}. Fully certified with comprehensive inspection and multi-point provenance audit.`,
      makeName: found.title.split(' ')[1] || 'Vehicle',
      modelName: found.title.split(' ').slice(2).join(' ') || 'Model',
      trim: 'Standard Edition',
      colorExterior: 'Obsidian Black Metallic',
      colorInterior: 'Ebony Leather',
      fuel: 'PETROL',
      transmission: 'Automatic Dual-Clutch',
      maskedVin: 'WP0AA2A98RS••••••',
      stockNumber: `Stock #${found.slug.slice(0, 8).toUpperCase()}`,
      powertrain: 'V6 / V8 Twin-Turbocharged',
      horsepower: '500+ BHP',
      acceleration: 'Under 4.0 Seconds',
      topSpeed: '280+ km/h',
      brakingSpec: 'High Performance Ventilated Discs',
      inspectionScore: 'Class 1 Passed (98/100)',
      monthlyEstimateAed: Math.round(Number(found.price.amountFils) / 100 / 60),
      isFixture: true,
    };
  }

  return PORSCHE_GT3RS_DETAIL_FIXTURE; // Default fallback to primary approved Stitch screen
}

/**
 * Submit VIP Lead Enquiry with explicit data grants to NestJS backend
 */
export async function submitVehicleLeadEnquiry(
  listingId: string,
  payload: CreateLeadEnquiryPayload
): Promise<LeadEnquiryResponse> {
  // Client-side call: same-origin session cookie; throws BuyerAuthRequiredError when signed out.
  const data = await buyerApiFetch<any>(`/api/v1/public/listings/${listingId}/leads`, {
    method: 'POST',
    body: JSON.stringify({
      intent: payload.intent,
      preferredContact: payload.preferredContact,
      message: payload.message || undefined,
      fieldsToShare: payload.fieldsToShare,
      consentTextVersion: payload.consentTextVersion,
    }),
  });

  return {
    id: data.id,
    status: data.status,
    listingId: data.listingId,
    tenantId: data.tenantId,
    createdAt: data.createdAt,
    referenceCode: `LEAD-${String(data.id).slice(0, 8).toUpperCase()}`,
    // Host, date, slot and venue are assigned by the dealer later; never invented here.
    hostName: '',
    scheduledDate: payload.targetDate || '',
    scheduledSlot: payload.targetSlot || '',
    venue: '',
    isFixture: false,
  };
}

export interface PublicDealerProfile {
  id: string;
  slug: string;
  legalName: string;
  displayName: string;
  country: string;
  currency: string;
  tagline?: string;
  description?: string;
  verification?: {
    status: string;
    tradeLicenseRef?: string;
    licenseExpiry?: string;
    jurisdiction?: string;
    isKybVerified: boolean;
  };
  branches: {
    id: string;
    name: string;
    emirate: string;
    city: string;
    address?: string;
    latitude?: string;
    longitude?: string;
  }[];
  stats: {
    liveGroundedStock: number;
    inventoryValueFils: string;
    collectorRating: number | null;
    facilitySqFt: number | null;
    establishedYears: number | null;
  };
  contact: {
    directPhone: string | null;
    whatsappNumber: string | null;
    makaniNumber: string | null;
    gpsCoordinates: string | null;
    address: string;
  };
  inventory: PublicListingItem[];
  isFixture?: boolean;
}

export const SILBERARROWS_DEALER_FIXTURE: PublicDealerProfile = {
  id: 'silberarrows-dubai-id',
  slug: 'silberarrows',
  legalName: 'SilberArrows Classic & Modern Motors LLC',
  displayName: 'SilberArrows Luxury & Classic Cars',
  country: 'AE',
  currency: 'AED',
  tagline: 'Official Mercedes-Benz Classic & Modern Specialist | Curated UAE Sovereign Inventory',
  description:
    'Purpose-built 18,500 sq.ft facility situated behind Times Square Center. Dedicated to modern bespoke supercars and classic preservation with specialized clean-room climate controls.',
  verification: {
    status: 'APPROVED',
    tradeLicenseRef: 'RTA Lic #D-8422',
    licenseExpiry: '2028-06-30T00:00:00.000Z',
    jurisdiction: 'Dubai DED #612048',
    isKybVerified: true,
  },
  branches: [
    {
      id: 'branch-silber-al-quoz',
      name: 'Al Quoz 1 Showroom & Engineering Hub',
      emirate: 'Dubai',
      city: 'Dubai',
      address: 'Street 4B, Al Quoz Industrial 1, Sheikh Zayed Road Exit 43, Dubai',
      latitude: '25.1412',
      longitude: '55.2281',
    },
  ],
  stats: {
    liveGroundedStock: 28,
    inventoryValueFils: '4280000000', // AED 42.8M
    collectorRating: 4.98,
    facilitySqFt: 18500,
    establishedYears: 12,
  },
  contact: {
    directPhone: '+971 4 380 5515',
    whatsappNumber: '+971 50 123 4567',
    makaniNumber: '21948 83120',
    gpsCoordinates: '25.1412° N, 55.2281° E',
    address: 'Street 4B, Al Quoz Industrial 1, Sheikh Zayed Road Exit 43, Dubai, UAE',
  },
  inventory: [
    {
      id: 'inv-g63-falcon',
      slug: '2023-mercedes-amg-g63-golden-falcon',
      title: '2023 Mercedes-AMG G 63 UAE Golden Falcon Edition',
      price: { currency: 'AED', amountFils: '89500000' },
      year: 2023,
      mileageKm: 4200,
      condition: 'USED',
      gccSpec: true,
      emirate: 'Dubai',
      seller: {
        id: 'silberarrows-dubai-id',
        slug: 'silberarrows',
        displayName: 'SilberArrows Luxury & Classic Cars',
        emirate: 'Dubai',
        city: 'Dubai',
        verified: true,
        dedLicense: 'DED Commercial #612048',
        rtaLicense: 'RTA Lic #D-8422 Verified',
      },
      media: [
        {
          id: 'm-g63',
          kind: 'EXTERIOR',
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJ7VoRVdrdlyZdJuwRvoNOBd55bnNPUVPWcUSVqkvd7RbWNAdsQPe1kiwjjH2MvbCcJCGVUHIsy-EQO6yz4I1EIPzBgZ9ah2_bSP4vWbihfquFm7ifhyg5UzYSAAY4oiWFAWYXVlxA0VimeLtunNHdSY2XnRCWk0wKGZcdW7Z8J0Z4CFhbqYPGiZmjo5AWX1og8JB0o6_vc8Mm_bdhunN8QAEKwafFK3BmQFT1XVsiBdPxqdYimv64',
          altText: '2023 Mercedes-AMG G 63 UAE Golden Falcon Edition in matte satin gold finish',
        },
      ],
      publishedAt: '2026-10-18T10:00:00Z',
    },
    {
      id: 'inv-gt-black',
      slug: '2022-mercedes-amg-gt-black-series-track-pack',
      title: '2022 Mercedes-AMG GT Black Series Track Pack',
      price: { currency: 'AED', amountFils: '169000000' },
      year: 2022,
      mileageKm: 1120,
      condition: 'USED',
      gccSpec: true,
      emirate: 'Dubai',
      seller: {
        id: 'silberarrows-dubai-id',
        slug: 'silberarrows',
        displayName: 'SilberArrows Luxury & Classic Cars',
        emirate: 'Dubai',
        city: 'Dubai',
        verified: true,
        dedLicense: 'DED Commercial #612048',
        rtaLicense: 'RTA Lic #D-8422 Verified',
      },
      media: [
        {
          id: 'm-gt-black',
          kind: 'EXTERIOR',
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7tEIz46G20AoARUycwOUn9-8bPIC7FFdLZh3Jw4JANndmOLczOXVbvV294DESH7KZgkJYG02R-LcH2-eczBzZbO9ZN9iSxoweY5SkuTB1MqRu97VXLrm6A1ckxRREnoidjA5Qx4KcKUoYMy8Q1ESpq-Oisp2uulCLhq0XSxtMHgR_f4KDW-UX8-Y5zQU8-fqfCRp8Jzr1xDZjsFNbMz7ZGA3DRxxBYvXZ1-jvbxWCg5wDO2HYtJBO',
          altText: '2022 Mercedes-AMG GT Black Series Track Pack in Magmabeam orange',
        },
      ],
      publishedAt: '2026-10-19T10:00:00Z',
    },
    {
      id: 'inv-porsche-turbos',
      slug: '2024-porsche-911-turbo-s-992',
      title: '2024 Porsche 911 Turbo S (992)',
      price: { currency: 'AED', amountFils: '118000000' },
      year: 2024,
      mileageKm: 2400,
      condition: 'USED',
      gccSpec: true,
      emirate: 'Dubai',
      seller: {
        id: 'silberarrows-dubai-id',
        slug: 'silberarrows',
        displayName: 'SilberArrows Luxury & Classic Cars',
        emirate: 'Dubai',
        city: 'Dubai',
        verified: true,
        dedLicense: 'DED Commercial #612048',
        rtaLicense: 'RTA Lic #D-8422 Verified',
      },
      media: [
        {
          id: 'm-turbo-s',
          kind: 'EXTERIOR',
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSjEr6puw_Va-W0Rmz9NZEbEyPUSvbvdtPxQZIT6-M3fCznTmusbXAevlvr45N_PpUA9UHaGP120tYE0IhHsHsWNVKiDHZZ3zhjKtPds_erHYAjDJC99Tg0tG0GWRDcuWWXO0x-MXg8RghFBNGGziixy8Y5UcRkyrQu88q4BZCJa7dM7PZ5r0ymoewztcD4tJg1VrkvuPIG4KQWd8MsBRoFmLcQsu8R0i_Lj_1KGEJDK-rk9c3nf_b',
          altText: '2024 Porsche 911 Turbo S in GT Silver Metallic with ceramic brakes',
        },
      ],
      publishedAt: '2026-10-20T10:00:00Z',
    },
    {
      id: 'inv-sl63-roadster',
      slug: '2023-mercedes-amg-sl63-4matic-roadster',
      title: '2023 Mercedes-AMG SL 63 4MATIC+ Roadster',
      price: { currency: 'AED', amountFils: '76000000' },
      year: 2023,
      mileageKm: 6800,
      condition: 'USED',
      gccSpec: true,
      emirate: 'Dubai',
      seller: {
        id: 'silberarrows-dubai-id',
        slug: 'silberarrows',
        displayName: 'SilberArrows Luxury & Classic Cars',
        emirate: 'Dubai',
        city: 'Dubai',
        verified: true,
        dedLicense: 'DED Commercial #612048',
        rtaLicense: 'RTA Lic #D-8422 Verified',
      },
      media: [
        {
          id: 'm-sl63',
          kind: 'EXTERIOR',
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALamCNlowlg032NPvu2oXXu44qNkR0Ddibxh7ITNvNRIJFZ1r6e_vCkGdHXZq5BmM5KaBNCXcLTYtyZB01e43w4ELYY1-xzey73sDf4B3tD1MstciG0v8NVEdprQxKdNfcKQvRwUXiBLD8F1xtXuO6rm-fThjksMznduq_2hwF8Dr4X7c2cSbd36kbKhSCQ-d_UXXFFmAYa53BBKaNvFEEUi9zNmkDiFyYb1BBmB3TfDFrBZqeG7te',
          altText: '2023 Mercedes-AMG SL 63 4MATIC+ Roadster in obsidian black',
        },
      ],
      publishedAt: '2026-10-20T12:00:00Z',
    },
  ],
  isFixture: true,
};

/**
 * Fetch verified dealership profile and tenant-scoped live inventory
 */
export interface PublicDealerSummary {
  id: string;
  slug: string;
  displayName: string;
  isKybVerified: boolean;
  emirates: string[];
  cities: string[];
  liveGroundedStock: number;
}

export interface PublicDealerListResponse {
  items: PublicDealerSummary[];
  total: number;
  page: number;
  limit: number;
}

/**
 * List active KYB-approved dealerships (GET /api/v1/public/dealers).
 */
export async function fetchPublicDealers(query?: {
  emirate?: string;
  page?: number;
  limit?: number;
}): Promise<PublicDealerListResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const params = new URLSearchParams();
  if (query?.emirate && query.emirate !== 'All Emirates') params.set('emirate', query.emirate);
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));

  const response = await fetch(`${apiUrl}/api/v1/public/dealers?${params.toString()}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Dealer directory API returned HTTP ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.items)) throw new Error('Invalid dealer directory response: expected items array');
  return data;
}

export async function fetchPublicDealerBySlug(slug: string): Promise<PublicDealerProfile | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  try {
    const dealerRes = await fetch(`${apiUrl}/api/v1/public/dealers/${encodeURIComponent(slug)}`, {
      next: { revalidate: 10 },
      signal: AbortSignal.timeout(5000),
    });

    if (dealerRes.status === 404) return null;
    if (!dealerRes.ok) throw new Error(`Dealer storefront API returned HTTP ${dealerRes.status}`);
    const dealer = await dealerRes.json();

    // Tenant-scoped published listings; an empty stock list stays empty.
    const inventoryRes = await fetch(
      `${apiUrl}/api/v1/public/listings?dealerSlug=${encodeURIComponent(slug)}&limit=20`,
      { next: { revalidate: 10 }, signal: AbortSignal.timeout(5000) }
    );
    if (!inventoryRes.ok) throw new Error(`Dealer inventory API returned HTTP ${inventoryRes.status}`);
    const invData = await inventoryRes.json();
    const items: PublicListingItem[] = Array.isArray(invData.items) ? invData.items : [];

    return {
      id: dealer.id,
      slug: dealer.slug,
      legalName: dealer.legalName,
      displayName: dealer.displayName,
      country: dealer.country || 'AE',
      currency: dealer.currency || 'AED',
      verification: dealer.verification
        ? {
            status: dealer.verification.status,
            tradeLicenseRef: dealer.verification.tradeLicenseRef,
            licenseExpiry: dealer.verification.licenseExpiry,
            jurisdiction: dealer.verification.jurisdiction,
            isKybVerified: Boolean(dealer.verification.isKybVerified),
          }
        : undefined,
      branches: dealer.branches || [],
      stats: {
        liveGroundedStock: dealer.stats?.liveGroundedStock ?? items.length,
        inventoryValueFils: dealer.stats?.inventoryValueFils ?? '0',
        collectorRating: dealer.stats?.collectorRating ?? null,
        facilitySqFt: dealer.stats?.facilitySqFt ?? null,
        establishedYears: dealer.stats?.establishedYears ?? null,
      },
      contact: {
        directPhone: dealer.contact?.directPhone ?? null,
        whatsappNumber: dealer.contact?.whatsappNumber ?? null,
        makaniNumber: dealer.contact?.makaniNumber ?? null,
        gpsCoordinates: dealer.contact?.gpsCoordinates ?? null,
        address: dealer.branches?.[0]?.address || [dealer.branches?.[0]?.city, dealer.branches?.[0]?.emirate].filter(Boolean).join(', '),
      },
      inventory: items,
      isFixture: false,
    };
  } catch (err) {
    // Only deliberate local previews may show the Stitch storefront fixture.
    if (process.env.NODE_ENV !== 'development' || process.env.NEXT_PUBLIC_ENABLE_FIXTURES !== 'true') {
      throw err;
    }
  }

  return { ...SILBERARROWS_DEALER_FIXTURE, isFixture: true };
}

export interface BuyerEnquiryItem {
  id: string;
  tenantId: string;
  listing: {
    id: string;
    slug: string;
    title: string;
    dealershipName: string;
    priceAed?: number;
    heroUrl?: string;
    vinChassis?: string;
  };
  status: 'NEW' | 'CONTACTED' | 'APPOINTMENT_SCHEDULED' | 'NEGOTIATION' | 'WON' | 'LOST';
  intent: string;
  preferredContact: string;
  message?: string;
  grant: {
    fields: string[];
    revokedAt?: string | null;
  };
  appointments: {
    id: string;
    startsAt: string;
    endsAt: string;
    status: string;
  }[];
  stageNumber?: number;
  stageName?: string;
  escrowNumber?: string;
  escrowIban?: string;
  escrowStatus?: string;
  createdAt: string;
}

export const BUYER_ENQUIRIES_FIXTURE: BuyerEnquiryItem[] = [
  {
    id: 'lead-fix-gt3rs-001',
    tenantId: 'apex-gt-motors-fz-id',
    listing: {
      id: 'stitch-fix-porsche-911',
      slug: '2024-porsche-911-gt3-rs-weissach-dubai',
      title: '2024 Porsche 911 GT3 RS Clubsport',
      dealershipName: 'Apex GT Motors',
      priceAed: 1420000,
      heroUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCU8hULJzJeVd2NCmr_A5lVWV0uXClXqc2Aj4wMwPYIqO-tAP7F0rmANYUb0E4HfliluXiWBc9blbdM73MVbSrNbdrymjgBuxH_pqi1fchwIYOed26EfFRRWZ1MhPiVV8h75jTgYrv-7_H8JNV2CFK8lDbYdXpYS_q81i8BGbHTb-ZOeH5PsXm_InIT9EDa7NEEHd2xUF1vshFaJNk07p9tivMvAwGlVwlL5jVtPiAXW7H26Jge-PK2',
      vinChassis: 'DXB-911-RS',
    },
    status: 'APPOINTMENT_SCHEDULED',
    intent: 'TEST_DRIVE',
    preferredContact: 'WHATSAPP',
    message: 'Viewing and dynamic track session at Dubai Autodrome Club Circuit',
    grant: {
      fields: ['name', 'phone'],
      revokedAt: null,
    },
    appointments: [
      {
        id: 'apt-001',
        startsAt: '2026-11-02T14:00:00Z',
        endsAt: '2026-11-02T16:00:00Z',
        status: 'CONFIRMED',
      },
    ],
    stageNumber: 3,
    stageName: 'Tasjeel Shamil Vault Inspection',
    escrowNumber: 'ESC-89214',
    escrowIban: 'AE94 0300 0000 8921 4010 9',
    escrowStatus: 'ACTIVE_DEPOSIT_LOCKED',
    createdAt: '2026-10-18T10:14:22Z',
  },
  {
    id: 'lead-fix-g63-002',
    tenantId: 'silberarrows-dubai-id',
    listing: {
      id: 'inv-g63-falcon',
      slug: '2023-mercedes-amg-g63-golden-falcon',
      title: '2023 Mercedes-AMG G 63 UAE Golden Falcon',
      dealershipName: 'SilberArrows Motors',
      priceAed: 890000,
      heroUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAbRRTsTjxNk_dkHkImw-GPgz0jivHJoyne9jxCD_Jmad2hzWR9Av7YjuC-Pc7KtZHkdsuqJTxtN4FNFCSB6dTVEItfTF1CT8SwMfBq3d--oowYgL0dM83MWe5t2lc15MRCgAHUW6Aig_Tq7OZHkKSIwrpfQxx7pfDiBqAYSrEPdOY24XyBsufyy8tkuM1KQhk_Vyj-j0oCO4Fb1rtcuo138ozNd-tUHSw1wZy3FgUyzJwLPQcIyutY',
      vinChassis: 'W1N-463-G63',
    },
    status: 'CONTACTED',
    intent: 'OFFER',
    preferredContact: 'PHONE',
    grant: {
      fields: ['name', 'phone'],
      revokedAt: null,
    },
    appointments: [],
    stageNumber: 2,
    stageName: 'Awaiting Dealer SLA',
    createdAt: '2026-10-19T09:30:00Z',
  },
  {
    id: 'lead-fix-defender-003',
    tenantId: 'premier-motors-id',
    listing: {
      id: 'inv-defender-110',
      slug: '2024-land-rover-defender-110-v8',
      title: '2024 Land Rover Defender 110 V8',
      dealershipName: 'Premier Motors Abu Dhabi',
      priceAed: 620000,
      heroUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuA5UBor0cvIiy0BDsAjwY2LY6WQUpT-m8hmy4uzkjD5IJzFmbKLhSmjnZvENpPyESvWi156oOZAdofz7mM0NH9mLbaGcKoWE_Hs36Zq8SFFruxtulxBuMpM6Qnv0mpEYVZ4_3Ha8I_nCK1pfZUUrXLDT1y3Mzqfr6igdRT9tMrOmsIKSBhXfc6_h_b5wvbgyYHL5Ax2CwrB4ytESoyyBXBdCzP4czK_OGOyJWHyNe8Cojx34K1ZDTdh',
      vinChassis: 'SAL-DEF-V8',
    },
    status: 'LOST',
    intent: 'TEST_DRIVE',
    preferredContact: 'EMAIL',
    grant: {
      fields: ['name'],
      revokedAt: '2026-10-20T11:00:00Z',
    },
    appointments: [],
    stageNumber: 0,
    stageName: 'Data Wiped / Revoked',
    createdAt: '2026-10-17T15:20:00Z',
  },
];

/**
 * Fetch authenticated buyer enquiries timeline
 */
export async function fetchBuyerEnquiries(sessionToken?: string): Promise<BuyerEnquiryItem[]> {
  const data = await buyerApiFetch<any[]>('/api/v1/me/enquiries', {}, sessionToken);
  return (Array.isArray(data) ? data : []).map((item: any) => ({
    id: item.id,
    tenantId: item.tenantId,
    listing: {
      id: item.listing?.id,
      slug: item.listing?.slug,
      title: item.listing?.title,
      dealershipName: item.listing?.dealershipName,
    },
    status: item.status,
    intent: item.intent,
    preferredContact: item.preferredContact,
    message: item.buyerMessage ?? undefined,
    grant: {
      fields: item.grant?.fieldsGranted ?? [],
      revokedAt: item.grant?.revokedAt ?? null,
    },
    appointments: Array.isArray(item.appointments) ? item.appointments : [],
    createdAt: item.createdAt,
  }));
}

/**
 * Revoke buyer enquiry data grant
 */
export async function revokeBuyerEnquiryGrant(leadId: string): Promise<boolean> {
  await buyerApiFetch(`/api/v1/me/leads/${leadId}/grant/revoke`, { method: 'POST' });
  return true;
}

// ==========================================
// S09 Appointments & Virtual Garage Contracts & Fixtures
// ==========================================

export interface BuyerAppointmentItem {
  id: string;
  bookingRef: string;
  carName: string;
  vin: string;
  dealerName: string;
  dealerLocation: string;
  sessionType: string;
  sessionDuration: string;
  sessionDescription: string;
  scheduledDate: string;
  scheduledSlot: string;
  venueName: string;
  venueDetails: string;
  hostName: string;
  hostRole: string;
  gatePassPin?: string;
  statusText: string;
  statusBadgeVariant: 'confirmed' | 'pending' | 'cancelled';
  escrowDepositAed?: number;
  imageUrl: string;
}

export interface BuyerGarageVehicle {
  id: string;
  plateEmirate: 'DUBAI' | 'ABU DHABI' | 'SHARJAH';
  plateNumber: string;
  statusText: string;
  statusVariant: 'active' | 'expiring';
  assetNumber: number;
  makeModel: string;
  specDetails: string;
  vin: string;
  mileageKm: number;
  mulkiyaRenewalMonth: string;
  mulkiyaStatus: string;
  estMarketValueAed: number;
  quarterGainPct: string;
  imageUrl: string;
}

export const DEFAULT_BUYER_APPOINTMENTS: BuyerAppointmentItem[] = [
  {
    id: 'appt-trk-9812',
    bookingRef: '#TRK-9812-DXB',
    carName: '2024 Porsche 911 GT3 RS (992)',
    vin: 'VIN: WP0AF2A93RS189021 • 525 PS • Weissach Package',
    dealerName: 'Apex GT Motors • Al Quoz 4',
    dealerLocation: 'Al Quoz 4, Dubai',
    sessionType: 'Dubai Autodrome Dynamic Track Run',
    sessionDuration: '45 MIN FIA SESSION',
    sessionDescription:
      'FIA Club Circuit Configuration with full telemetry logging, tire degradation index, and telemetry export to driver vault.',
    scheduledDate: 'Sunday, 19 May 2025',
    scheduledSlot: '06:00 PM - 07:00 PM GST (Sunset Prime)',
    venueName: 'VIP Pit Paddock 3, Motor City',
    venueDetails: 'Makani #19823 48120',
    hostName: 'Karim El-Sayed',
    hostRole: 'Porsche Certified Factory Instructor',
    gatePassPin: '#APX-9812',
    statusText: 'Confirmed • Track Allocated',
    statusBadgeVariant: 'confirmed',
    escrowDepositAed: 5000,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAsZD_E1lq8uJtq4jxq95PG0oFuIPLARhQrZYReq1JKeRsc6JsDa2SSuF9jIxNMPCtq2UA_H6gW6qFyHppOHA0YFtQofyTHkkRDV_dpQ5jJhA6-GpkLn7JaDCgWxmzBKguc8Wwa2fvVsD0ltD_TW5qkGXCY87_SIa5RAiZCwwXZzmqZyNM-2wAz6aFlG10o84hsUwgoVe_x5VXpbzKrOA-epsRI8e93yDz3b0Haw_xsKJWWlowQioPc',
  },
  {
    id: 'appt-sr-4091',
    bookingRef: '#SR-4091-DXB',
    carName: '2023 Mercedes-AMG G 63 UAE Edition',
    vin: 'VIN: WDB9634812K091244 • 585 HP • 1 of 50 GCC Exclusive',
    dealerName: 'SilberArrows • Al Quoz 1',
    dealerLocation: 'Al Quoz 1, Dubai',
    sessionType: 'Private Showroom Suite & Underbody Hoist Evaluation',
    sessionDuration: 'VIP SUITE #02',
    sessionDescription:
      'Includes paint thickness ultrasound analysis, chassis structural scan, and comprehensive TASJEEL pre-registration document review.',
    scheduledDate: 'Tuesday, 21 May 2025',
    scheduledSlot: '10:30 AM GST (Morning Evaluation)',
    venueName: 'SilberArrows Executive Center',
    venueDetails: 'Street 8, Al Quoz 1 • Makani #28190 39120',
    hostName: 'Marc Ackermann',
    hostRole: 'Senior Specialist • Classic & AMG Division',
    statusText: 'Pending Dealer Slot Confirmation',
    statusBadgeVariant: 'pending',
    escrowDepositAed: 0,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDvvzWoKAIxX-AsYkIaz4-gOPWiKOH9M7AEdx1GnyQSoTx0T5y5BrtdiGApSKXcryI414tuZ5rEgfxCzM2xX3wfc9cca1gCxFZJni6HAlFef0Ti6hOymB37PyknErecR6Y2Y9LF0QXVdWn4i_yI5kjYDMwwf8nhgKxuWhWYu2sqn3NQK_7RmhJb8on3UeHuhWGPdx1bynG2VR0u2qMfw5BwgMJIQkvG81WXJjUIuqYAAOmG5K85GRdG',
  },
];

export const DEFAULT_BUYER_GARAGE_VEHICLES: BuyerGarageVehicle[] = [
  {
    id: 'garage-01',
    plateEmirate: 'DUBAI',
    plateNumber: 'D 9821',
    statusText: 'ACTIVE • SALIK SYNC',
    statusVariant: 'active',
    assetNumber: 1,
    makeModel: '2022 Porsche 911 Turbo S (992)',
    specDetails: 'Agate Grey • GCC Specs',
    vin: 'WP0AD2A98NS249102',
    mileageKm: 14200,
    mulkiyaRenewalMonth: 'Nov 2025',
    mulkiyaStatus: 'Valid (6 Mos Left)',
    estMarketValueAed: 890000,
    quarterGainPct: '+3.1% this qtr',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA-5mYc3doftJf9c1uWLk2FSkXTDGSvSerrj9KABjnFXRzY39q10ytmnZZbOG6d452I3dpzd0RD8cwYMZzFllF0amMAm-7Liftl4bvdfDKkDqeJG660VKIDdk-cZTrLaEaEHE0v4WXfalHtcRhyxUG-qfroDljcpruuLiTHPThUtBR3b0bH1c9t3LP_QcjBFazhvw8nNLggMetWY-v9ck6oif9tHtIiyPq55ZMipM_kEno5IPFprh76',
  },
  {
    id: 'garage-02',
    plateEmirate: 'DUBAI',
    plateNumber: 'P 1104',
    statusText: 'ACTIVE • VERIFIED',
    statusVariant: 'active',
    assetNumber: 2,
    makeModel: '2021 Ferrari F8 Tributo',
    specDetails: 'Rosso Corsa • Carbon Ext.',
    vin: 'ZFF88ALA0M0261901',
    mileageKm: 6800,
    mulkiyaRenewalMonth: 'Jan 2026',
    mulkiyaStatus: 'Valid (8 Mos Left)',
    estMarketValueAed: 1280000,
    quarterGainPct: '+8.9% this qtr',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAkA6eLXcFOat00IQBoPooyc_rO_vwkoAjdr-G2jp4--Fr2ZvPvQYecmOVCP5k24si_wvehqpPKzptjZJ__Zq3Gj0FYj_9pll-ltuSCWv5F20pfCsuFhWmtLyfZS8X68TuzL-aPr_h_JIQ_T19X1krRdaRQRJoK4q5HSzhyG-NMzy5ulJfXhVnjdIfb0sIYA-mKBqtp56QorcDG7zniJ3rvdv9dkby8mENyiSQQ3gTE9jDyEqw3Kr_T',
  },
  {
    id: 'garage-03',
    plateEmirate: 'ABU DHABI',
    plateNumber: '5 4492',
    statusText: 'EXPIRING SOON',
    statusVariant: 'expiring',
    assetNumber: 3,
    makeModel: '2023 Range Rover SV LWB',
    specDetails: 'British Racing Green • SV Bespoke',
    vin: 'SALWR2V47PA109841',
    mileageKm: 19450,
    mulkiyaRenewalMonth: 'Aug 2025',
    mulkiyaStatus: 'Pre-Audit Recommended',
    estMarketValueAed: 1150000,
    quarterGainPct: 'Stable 0.0%',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAm3wizqm0_xnErWK44MlpV41jhrwFMqw_T0SQyYiOPzlcJyihWYVZk_xpADWc2iKE2VZKaWPiUPEN8bZIUtHOu4M-MXPPig3zHriiMGjpqhqzMnBWGEyzfZe6pXpNeOqdTYb2qPWvwV-5VkOhUv7tknJJRafoFbNdqPYUtetOGEFJgkLFJvNoKucY83Xhsn1IMRKgXhoVoaYFHg70DYCXO1XpeHsqMgjjP70lSFG3yq9e7WQzwNTvT',
  },
];

/**
 * Fetch buyer appointments from API with fallback to Stitch design baseline
 */
export async function fetchBuyerAppointments(sessionToken?: string): Promise<BuyerAppointmentItem[]> {
  const data = await buyerApiFetch<any[]>('/api/v1/me/appointments', {}, sessionToken);
  return (Array.isArray(data) ? data : []).map((a: any) => {
    const startsAt = new Date(a.startsAt);
    const endsAt = new Date(a.endsAt);
    const minutes = Math.max(0, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000));
    return {
      id: a.id,
      bookingRef: `#APPT-${String(a.id).slice(0, 8).toUpperCase()}`,
      carName: a.listing?.title || '',
      vin: a.listing?.vinMasked || '',
      dealerName: a.listing?.dealershipName || '',
      dealerLocation: '',
      sessionType: a.note || 'Showroom appointment',
      sessionDuration: minutes ? `${minutes} MIN` : '',
      sessionDescription: a.note || '',
      scheduledDate: startsAt.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Dubai',
      }),
      scheduledSlot: `${startsAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' })} GST`,
      venueName: '',
      venueDetails: '',
      hostName: '',
      hostRole: '',
      statusText:
        a.status === 'CONFIRMED'
          ? 'Confirmed'
          : a.status === 'CANCELLED'
          ? 'Cancelled'
          : 'Pending dealer confirmation',
      statusBadgeVariant:
        a.status === 'CONFIRMED' ? 'confirmed' : a.status === 'CANCELLED' ? 'cancelled' : 'pending',
      imageUrl: a.listing?.imageUrl || '',
    };
  });
}

/**
 * Cancel buyer appointment with automatic escrow return
 */
export async function cancelBuyerAppointment(
  appointmentId: string,
  reason: string
): Promise<boolean> {
  await buyerApiFetch(`/api/v1/me/appointments/${appointmentId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return true;
}

// ==========================================
// S10 Saved Searches & Favorites Contracts & Fixtures
// ==========================================

export interface SavedRadarItem {
  id: string;
  radarCode: string;
  matchCountLabel: string;
  title: string;
  filters: string[];
  channelType: 'WHATSAPP' | 'SMS' | 'ESCROW';
  channelLabel: string;
  channelDestination: string;
  statusBadge: string;
  isPaused: boolean;
  accentColor: string;
}

export interface SavedVehicleFavorite {
  id: string;
  slug: string;
  year: number;
  badgeLabel?: string;
  badgeVariant?: 'primary' | 'secondary' | 'neutral';
  tasjeelScore?: string;
  mileageKm: number;
  specRegion: string;
  dealerName: string;
  dealerLocation: string;
  title: string;
  subtitle: string;
  engine: string;
  performance: string;
  warranty: string;
  marketTrendLabel: string;
  marketTrendColor: string;
  currentValuationAed: number;
  previousValuationAed?: number;
  monthlyEstimateAed: number;
  ctaActionText: string;
  ctaIcon: string;
  imageUrl: string;
  priceDropNote?: string;
}

export const DEFAULT_SAVED_RADARS: SavedRadarItem[] = [
  {
    id: 'radar-dxb-911',
    radarCode: 'RADAR #DXB-911',
    matchCountLabel: '4 New Matches Today',
    title: 'Porsche 911 GT3 / GT3 RS',
    filters: ['GCC Spec Only', 'Dubai & Abu Dhabi', '≤ AED 1.6M'],
    channelType: 'WHATSAPP',
    channelLabel: 'Daily WhatsApp Alerts',
    channelDestination: '+971 50 ••••4110',
    statusBadge: 'Active',
    isPaused: false,
    accentColor: '#f2ca50',
  },
  {
    id: 'radar-g63-ed50',
    radarCode: 'RADAR #G63-ED50',
    matchCountLabel: '1 Match Available',
    title: 'Mercedes-AMG G 63 UAE Edition / G63 4x4²',
    filters: ['< 15,000 KM', 'Gargash Agency Hist.', 'All Emirates'],
    channelType: 'SMS',
    channelLabel: 'Instant SMS Notification',
    channelDestination: '+971 50 ••••4110',
    statusBadge: 'Instant',
    isPaused: false,
    accentColor: '#7bd0ff',
  },
  {
    id: 'radar-maranello-v6',
    radarCode: 'RADAR #MARANELLO-V6',
    matchCountLabel: 'Scanning 12 Dealers',
    title: 'Ferrari 296 GTB / 812 GTS',
    filters: ['Al Tayer Maintained', 'Factory Warranty', 'Assetto Fiorano Pack'],
    channelType: 'ESCROW',
    channelLabel: 'Escrow Pre-Approved',
    channelDestination: 'Verified Supercars UAE Network',
    statusBadge: 'VIP Match',
    isPaused: false,
    accentColor: '#d4af37',
  },
];

export const DEFAULT_SAVED_FAVORITES: SavedVehicleFavorite[] = [
  {
    id: 'fav-porsche-gt3rs',
    slug: '2024-porsche-911-gt3-rs-weissach-dubai',
    year: 2024,
    badgeLabel: 'TASJEEL 99/100',
    badgeVariant: 'secondary',
    tasjeelScore: '99/100',
    mileageKm: 1850,
    specRegion: 'GCC SPEC',
    dealerName: 'Apex GT Motors',
    dealerLocation: 'Al Quoz 4, Dubai',
    title: 'Porsche 911 GT3 RS',
    subtitle: 'Ice Grey Metallic • Weissach Package',
    engine: '4.0L / 518hp',
    performance: '3.2s 0-100',
    warranty: 'Porsche UAE',
    marketTrendLabel: 'Stable Market',
    marketTrendColor: 'text-[#d0c5af]',
    currentValuationAed: 1420000,
    monthlyEstimateAed: 24150,
    ctaActionText: 'Enquire via VIP Concierge',
    ctaIcon: 'verified',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD00EM_8nmbyod9P3W98PjX-RxfBABE1QV3QTeiXGGbYmuIKPCU3IEua2ylhlUW3x7SwPkmYlF75dc_zdknIhDK7ToagWc4EmdZ7v3QPOe5_jYI7HPDZR0e2nNBj5cRo_x7V3IY2fgZ12F8kKzhqtBGBa1FX9jiVX-FM_K8Nuur6uLJ-KlkHFeS0OQHy1eEVHOO9BDRSXzvGK5F_HEb_V9yWaic7FqLXJW2GVCuV5NyOIgDkv6hdbPt',
  },
  {
    id: 'fav-amg-g63-50th',
    slug: '2023-mercedes-amg-g63-uae-golden-edition',
    year: 2023,
    badgeLabel: 'UAE 50TH EDITION',
    badgeVariant: 'secondary',
    mileageKm: 4200,
    specRegion: 'GCC SPEC',
    dealerName: 'SilberArrows',
    dealerLocation: 'Al Quoz, Dubai',
    title: 'Mercedes-AMG G 63 UAE 50th',
    subtitle: 'Designo Magno • Gargash Warranty 2027',
    engine: '4.0L V8 BiTurbo',
    performance: '585 BHP',
    warranty: '1 of 50',
    marketTrendLabel: '-AED 25,000 this week',
    marketTrendColor: 'text-[#58e7aa]',
    currentValuationAed: 895000,
    previousValuationAed: 920000,
    monthlyEstimateAed: 15200,
    ctaActionText: 'Schedule Private Viewing',
    ctaIcon: 'calendar_month',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDxpYREXIM6Qzl6E9xu-LRcN0_PF8ir4OcJVYBRZjwhfjvjkow0kXUpx19C8CdZmK_GYjzLsdjPEAKRiNgBKH0uifEITFzZppEYQYSji-g6qv0hohPZNffNYPolNHUv-nrIQFh4xnmTh3HrYgwkyUCYLmM6tetOKIXBsvNhg4qvp0ZJtJ72UtNXOOaCC6myGsAfpvPh5d3GcwwjhVN7BBNRdyRE3eb3LTkAS83y-hNBFcy81C21xXo6',
    priceDropNote: '-AED 25,000 this week',
  },
  {
    id: 'fav-defender-110-v8',
    slug: '2024-land-rover-defender-110-v8-carpathian',
    year: 2024,
    badgeLabel: 'V8 CARPATHIAN',
    badgeVariant: 'neutral',
    mileageKm: 4500,
    specRegion: 'GCC SPEC',
    dealerName: 'Premier Motors',
    dealerLocation: 'Abu Dhabi',
    title: 'Defender 110 V8 Carpathian',
    subtitle: 'Carpathian Grey Satin • Al Tayer Agency',
    engine: '5.0L Supercharged',
    performance: '525 HP',
    warranty: '5-Yr Pack',
    marketTrendLabel: 'Firm Price',
    marketTrendColor: 'text-[#d0c5af]',
    currentValuationAed: 620000,
    monthlyEstimateAed: 10540,
    ctaActionText: 'View Full Dossier & RTA',
    ctaIcon: 'description',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBPduP-yFsBmpkgbatKMyO3ufhzgnWUO8BKuGG6p05fSrtPBPM_xLxBKEM4kxkRAe2QPRUHOO9Jsq0KYCCl3SjtD3oAUsCGo2Nf0OZwSr5cKsVMVCqcHQG8jx8Lb9QHDV0LTQkuzLrjbiuddIniZxT3k-fhfZHhRo-nB6KJL898OViEwVwAdDxkEbBBt8PJrcdWDDv-FKPg8FPYuyFxDn4gwSWD4Ia23uYo6tti3VPKwcUvE6vlR9e7',
  },
  {
    id: 'fav-ferrari-296-gtb',
    slug: '2023-ferrari-296-gtb-assetto-fiorano',
    year: 2023,
    badgeLabel: 'ASSETTO FIORANO',
    badgeVariant: 'primary',
    mileageKm: 2100,
    specRegion: 'GCC SPEC',
    dealerName: 'Verified Supercars UAE',
    dealerLocation: 'DXB',
    title: 'Ferrari 296 GTB Hybrid',
    subtitle: 'Rosso Corsa • Carbon Wheels • Escrow Ready',
    engine: '3.0L V6 Hybrid',
    performance: '819 BHP',
    warranty: '7-Yr Maint.',
    marketTrendLabel: 'Prime Asset',
    marketTrendColor: 'text-[#d0c5af]',
    currentValuationAed: 1650000,
    monthlyEstimateAed: 28050,
    ctaActionText: 'Initiate Escrow Custody',
    ctaIcon: 'lock',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDvoML3zvntbPps4qBSS2rxRkg6L7IB8vYU7D6EDiiAK81fiKLBT2q9qplJAvjlLfG8d2mA9y7RnM1pIgBQU1kCEh-RZECKruy_XsjIalLSsWbuttd2wr0SOljYBCudcUbMwO-0ZX0bymIs92HJXYOVlmPjfTZ0b7xi4xuTUfUWj_tTNBRC7oeOcnel_TI_fs5om65nO2bL3JpjjaUL7wGxekuui0qqKhODXDj0wt9EvOBlC1d-nrvt',
  },
];

/**
 * Fetch saved searches / radars
 */
export async function fetchSavedRadars(sessionToken?: string): Promise<SavedRadarItem[]> {
  const data = await buyerApiFetch<any[]>('/api/v1/me/saved-searches', {}, sessionToken);
  return (Array.isArray(data) ? data : []).map((item: any) => {
    const filters = item.filterJson && typeof item.filterJson === 'object' ? item.filterJson : {};
    return {
      id: item.id,
      radarCode: `#RADAR-${String(item.id).slice(0, 8).toUpperCase()}`,
      matchCountLabel: '',
      title: item.name,
      filters: Object.entries(filters)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${k}: ${String(v)}`),
      channelType: 'SMS' as const,
      channelLabel: item.alertsEnabled ? 'Alerts enabled' : 'Alerts off',
      channelDestination: '',
      statusBadge: item.alertsEnabled ? 'Active' : 'Paused',
      isPaused: !item.alertsEnabled,
      accentColor: '#d4af37',
    };
  });
}

/**
 * Fetch vehicle favorites
 */
export async function fetchSavedFavorites(sessionToken?: string): Promise<SavedVehicleFavorite[]> {
  const data = await buyerApiFetch<any[]>('/api/v1/me/favorites', {}, sessionToken);
  return (Array.isArray(data) ? data : []).map((item: any) => ({
    id: item.listingId,
    slug: item.slug,
    year: 0,
    mileageKm: 0,
    specRegion: '',
    dealerName: '',
    dealerLocation: '',
    title: item.title,
    subtitle: item.status === 'PUBLISHED' ? '' : 'No longer listed',
    engine: '',
    performance: '',
    warranty: '',
    marketTrendLabel: '',
    marketTrendColor: '',
    currentValuationAed: Math.round(Number(item.askingPriceFils || 0) / 100),
    monthlyEstimateAed: 0,
    ctaActionText: 'View listing',
    ctaIcon: 'arrow_forward',
    imageUrl: item.thumbnailUrl || '',
  }));
}

/**
 * Remove favorite from backend database
 */
export async function removeFavoriteApi(listingId: string): Promise<boolean> {
  await buyerApiFetch(`/api/v1/me/favorites/${listingId}`, { method: 'DELETE' });
  return true;
}

/**
 * Delete saved search / radar from backend database
 */
export async function deleteSavedRadarApi(radarId: string): Promise<boolean> {
  await buyerApiFetch(`/api/v1/me/saved-searches/${radarId}`, { method: 'DELETE' });
  return true;
}

// ==========================================
// Buyer Profile & Privacy Permissions (S11)
// ==========================================

export interface EphemeralGrantItem {
  id: string;
  leadId: string;
  dealershipName: string;
  context: string;
  expiresText: string;
  fieldsGranted: string[];
  revoked: boolean;
}

export interface BuyerProfileData {
  userId: string;
  fullName: string;
  fullNameAr: string;
  emiratesIdMasked: string;
  phoneE164: string;
  licenseNumber: string;
  preferredLanguage: string;
  preferredEmirate: string;
  strictGccSpecOnly: boolean;
  budgetMinFils: number;
  budgetMaxFils: number;
  viewingHubs: string[];
  channels: {
    whatsapp: boolean;
    phone: boolean;
    privateOffice: boolean;
  };
  disclosureMatrix: {
    shareFullName: boolean;
    sharePhone: boolean;
    zkProofOfFunds: string;
    virtualGarage: string;
    residence: string;
  };
  ephemeralGrants: EphemeralGrantItem[];
}

export const FALLBACK_BUYER_PROFILE: BuyerProfileData = {
  userId: '0add6f82-f1c1-4020-ad45-dc3575aa7c71',
  fullName: 'Sheikh Tariq Al-Nuaimi',
  fullNameAr: 'الشيخ طارق النعيمي',
  emiratesIdMasked: '784-••••-•••••••-1',
  phoneE164: '+971 50 892 4110',
  licenseNumber: 'License #DXB-90218',
  preferredLanguage: 'en',
  preferredEmirate: 'Dubai (DIFC & Palm Jumeirah)',
  strictGccSpecOnly: true,
  budgetMinFils: 80000000,
  budgetMaxFils: 350000000,
  viewingHubs: [
    'Dubai: Al Quoz Exotic Hub',
    'Dubai: Sheikh Zayed Road (SZR) Showrooms',
    'Abu Dhabi: Yas Marina Circuit Paddock',
  ],
  channels: {
    whatsapp: true,
    phone: false,
    privateOffice: false,
  },
  disclosureMatrix: {
    shareFullName: true,
    sharePhone: true,
    zkProofOfFunds: 'ZK Pass Only',
    virtualGarage: 'Perma-Blocked',
    residence: 'Fuzzed Area',
  },
  ephemeralGrants: [
    {
      id: 'e924c38d-2a58-4a19-850d-dda218b2a69d',
      leadId: '708a3ec9-06d9-4470-b1b6-f7aa9bf7c87d',
      dealershipName: 'Al Ghandi Motors VIP',
      context: 'Enquiry #GCC-99042',
      expiresText: 'Expires in 4h 12m',
      fieldsGranted: ['name', 'phone'],
      revoked: false,
    },
    {
      id: '2a2ffee1-f876-461d-8296-a87d0b889aff',
      leadId: 'e80e05d3-00b8-4bba-afd6-cc73f37fabdf',
      dealershipName: 'Al Tayer Motors Ferrari Atelier',
      context: 'Session #SF90-0081',
      expiresText: 'Expires in 22h',
      fieldsGranted: ['name', 'phone'],
      revoked: false,
    },
  ],
};

/**
 * Fetch buyer profile and privacy permissions data
 */
export async function fetchBuyerProfileData(sessionToken?: string): Promise<BuyerProfileData> {
  const [meData, profileData, enquiries] = await Promise.all([
    buyerApiFetch<any>('/api/v1/me', {}, sessionToken),
    // A buyer without a saved profile gets 404; treat as empty preferences.
    buyerApiFetch<any>('/api/v1/me/buyer-profile', {}, sessionToken).catch((err) => {
      if (err instanceof BuyerApiError && err.status === 404) return null;
      throw err;
    }),
    buyerApiFetch<any[]>('/api/v1/me/enquiries', {}, sessionToken),
  ]);

  const ephemeralGrants: EphemeralGrantItem[] = (Array.isArray(enquiries) ? enquiries : [])
    .filter((e: any) => e.grant)
    .map((e: any) => ({
      id: e.grant.id,
      leadId: e.id,
      dealershipName: e.listing?.dealershipName || '',
      context: `Enquiry #${String(e.id).slice(0, 8).toUpperCase()}`,
      expiresText: e.grant.revokedAt ? 'Access revoked' : 'Active until revoked',
      fieldsGranted: e.grant.fieldsGranted || [],
      revoked: !!e.grant.revokedAt,
    }));

  return {
    userId: meData.id,
    fullName: meData.displayName || '',
    fullNameAr: '',
    emiratesIdMasked: '',
    phoneE164: meData.phoneE164 || '',
    licenseNumber: '',
    preferredLanguage: profileData?.preferredLanguage || 'en',
    preferredEmirate: profileData?.preferredEmirate || '',
    strictGccSpecOnly: false,
    budgetMinFils: profileData?.budgetMinFils ? Number(profileData.budgetMinFils) : 0,
    budgetMaxFils: profileData?.budgetMaxFils ? Number(profileData.budgetMaxFils) : 0,
    viewingHubs: [],
    channels: { whatsapp: false, phone: false, privateOffice: false },
    disclosureMatrix: {
      shareFullName: false,
      sharePhone: false,
      zkProofOfFunds: '',
      virtualGarage: '',
      residence: '',
    },
    ephemeralGrants,
  };
}

/**
 * Update buyer profile preferences via backend API
 */
export async function updateBuyerProfileApi(payload: {
  preferredLanguage?: string;
  preferredEmirate?: string;
  budgetMinFils?: number;
  budgetMaxFils?: number;
  preferredMakes?: string[];
}): Promise<boolean> {
  await buyerApiFetch('/api/v1/me/buyer-profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return true;
}

/**
 * Revoke data grant for specific lead enquiry
 */
export async function revokeLeadGrantApi(leadId: string): Promise<boolean> {
  await buyerApiFetch(`/api/v1/me/leads/${leadId}/grant/revoke`, { method: 'POST' });
  return true;
}

