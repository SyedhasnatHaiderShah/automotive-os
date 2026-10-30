import { buyerApiFetch, BuyerApiError } from './buyer-api-client';
/**
 * Automotive OS Marketplace Typed API Client
 * Connects to NestJS Backend (/api/v1/public/listings & /api/v1/public/listings/:id/leads)
 * with verified Stitch fallback fixtures (screens f8eeabe57ad843a1b14e3323102c8151 & 1ff78cd6f95845538cc81b3849e62c88).
 */

/**
 * Stitch fixtures are only ever shown in a deliberate local preview: NODE_ENV is
 * development AND NEXT_PUBLIC_ENABLE_FIXTURES is 'true'. Every other environment
 * surfaces the real API result or error.
 */
export function fixturesEnabled(): boolean {
  return process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_FIXTURES === 'true';
}

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
  whatsappNumber?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
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
    if (!fixturesEnabled()) {
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
        stockNumber: item.stockNumber || '',
        isFixture: false,
      };
    }
    if (response.status === 404) return null;
    throw new Error(`Vehicle details API returned HTTP ${response.status}`);
  } catch (err) {
    if (!fixturesEnabled()) {
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

  // Unknown slug: not found, even in fixture preview mode.
  return null;
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
  /** Total published listings reported by the API (may exceed inventory.length). */
  inventoryTotal?: number;
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
    // PF-04: dealer profile and its published inventory load in parallel.
    const [dealerRes, inventoryRes] = await Promise.all([
      fetch(`${apiUrl}/api/v1/public/dealers/${encodeURIComponent(slug)}`, {
        next: { revalidate: 10 },
        signal: AbortSignal.timeout(5000),
      }),
      // Tenant-scoped published listings; an empty stock list stays empty.
      fetch(`${apiUrl}/api/v1/public/listings?dealerSlug=${encodeURIComponent(slug)}&limit=20`, {
        next: { revalidate: 10 },
        signal: AbortSignal.timeout(5000),
      }),
    ]);

    if (dealerRes.status === 404) return null;
    if (!dealerRes.ok) throw new Error(`Dealer storefront API returned HTTP ${dealerRes.status}`);
    const dealer = await dealerRes.json();
    if (!inventoryRes.ok) throw new Error(`Dealer inventory API returned HTTP ${inventoryRes.status}`);
    const invData = await inventoryRes.json();
    const items: PublicListingItem[] = Array.isArray(invData.items) ? invData.items : [];
    const inventoryTotal: number = typeof invData.total === 'number' ? invData.total : items.length;

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
        liveGroundedStock: dealer.stats?.liveGroundedStock ?? inventoryTotal,
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
      inventoryTotal,
      isFixture: false,
    };
  } catch (err) {
    // Only deliberate local previews may show the Stitch storefront fixture.
    if (!fixturesEnabled()) {
      throw err;
    }
  }

  return { ...SILBERARROWS_DEALER_FIXTURE, isFixture: true };
}

// ==========================================
// Authenticated buyer zone (real API only; no fixtures, no personas)
// ==========================================

export interface BuyerMe {
  id: string;
  email: string | null;
  displayName: string;
}

/** GET /api/v1/me — the signed-in identity (display name only for chrome). */
export async function fetchBuyerMe(sessionToken?: string): Promise<BuyerMe> {
  const data = await buyerApiFetch<any>('/api/v1/me', {}, sessionToken);
  return {
    id: data?.id,
    email: data?.email ?? null,
    displayName: data?.displayName || '',
  };
}

export interface BuyerAppointmentSummary {
  id: string;
  leadId: string;
  startsAt: string;
  endsAt: string;
  status: string;
  note: string | null;
}

export interface BuyerEnquiryItem {
  id: string;
  tenantId: string;
  listing: {
    id: string;
    slug: string;
    title: string;
    dealershipName: string;
  };
  status: string;
  intent: string;
  preferredContact: string;
  message?: string;
  grant: {
    fields: string[];
    purpose: string | null;
    grantedAt: string | null;
    revokedAt: string | null;
  } | null;
  appointments: BuyerAppointmentSummary[];
  createdAt: string;
  updatedAt: string;
}

/** GET /api/v1/me/enquiries */
export async function fetchBuyerEnquiries(sessionToken?: string): Promise<BuyerEnquiryItem[]> {
  const data = await buyerApiFetch<any[]>('/api/v1/me/enquiries', {}, sessionToken);
  return (Array.isArray(data) ? data : []).map((item: any) => ({
    id: item.id,
    tenantId: item.tenantId,
    listing: {
      id: item.listing?.id ?? '',
      slug: item.listing?.slug ?? '',
      title: item.listing?.title ?? '',
      dealershipName: item.listing?.dealershipName ?? '',
    },
    status: item.status,
    intent: item.intent,
    preferredContact: item.preferredContact,
    message: item.buyerMessage ?? undefined,
    grant: item.grant
      ? {
          fields: Array.isArray(item.grant.fieldsGranted) ? item.grant.fieldsGranted : [],
          purpose: item.grant.purpose ?? null,
          grantedAt: item.grant.grantedAt ?? null,
          revokedAt: item.grant.revokedAt ?? null,
        }
      : null,
    appointments: (Array.isArray(item.appointments) ? item.appointments : []).map((a: any) => ({
      id: a.id,
      leadId: a.leadId,
      startsAt: a.startsAt,
      endsAt: a.endsAt,
      status: a.status,
      note: a.note ?? null,
    })),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt ?? item.createdAt,
  }));
}

/** POST /api/v1/me/leads/:leadId/grant/revoke */
export async function revokeBuyerEnquiryGrant(leadId: string): Promise<boolean> {
  await buyerApiFetch(`/api/v1/me/leads/${encodeURIComponent(leadId)}/grant/revoke`, { method: 'POST' });
  return true;
}

export interface BuyerAppointmentItem extends BuyerAppointmentSummary {
  listing: {
    id: string;
    slug: string;
    title: string;
    vinMasked: string | null;
    imageUrl: string | null;
    dealershipName: string;
  } | null;
}

/** GET /api/v1/me/appointments */
export async function fetchBuyerAppointments(sessionToken?: string): Promise<BuyerAppointmentItem[]> {
  const data = await buyerApiFetch<any[]>('/api/v1/me/appointments', {}, sessionToken);
  return (Array.isArray(data) ? data : []).map((a: any) => ({
    id: a.id,
    leadId: a.leadId,
    startsAt: a.startsAt,
    endsAt: a.endsAt,
    status: a.status,
    note: a.note ?? null,
    listing: a.listing
      ? {
          id: a.listing.id,
          slug: a.listing.slug,
          title: a.listing.title || '',
          vinMasked: a.listing.vinMasked ?? null,
          imageUrl: a.listing.imageUrl ?? null,
          dealershipName: a.listing.dealershipName || '',
        }
      : null,
  }));
}

/** POST /api/v1/me/appointments/:id/cancel */
export async function cancelBuyerAppointment(appointmentId: string, reason?: string): Promise<boolean> {
  await buyerApiFetch(`/api/v1/me/appointments/${encodeURIComponent(appointmentId)}/cancel`, {
    method: 'POST',
    body: JSON.stringify(reason ? { reason } : {}),
  });
  return true;
}

/** POST /api/v1/me/appointments/:id/reschedule (startsAt/endsAt in UTC ISO 8601). */
export async function rescheduleBuyerAppointment(
  appointmentId: string,
  startsAt: string,
  endsAt: string
): Promise<BuyerAppointmentSummary> {
  const a = await buyerApiFetch<any>(
    `/api/v1/me/appointments/${encodeURIComponent(appointmentId)}/reschedule`,
    { method: 'POST', body: JSON.stringify({ startsAt, endsAt }) }
  );
  return {
    id: a?.id ?? appointmentId,
    leadId: a?.leadId ?? '',
    startsAt: a?.startsAt ?? startsAt,
    endsAt: a?.endsAt ?? endsAt,
    status: a?.status ?? '',
    note: a?.note ?? null,
  };
}

export interface SavedSearchItem {
  id: string;
  name: string;
  filterJson: Record<string, unknown>;
  alertsEnabled: boolean;
  createdAt: string;
}

/** GET /api/v1/me/saved-searches */
export async function fetchSavedSearches(sessionToken?: string): Promise<SavedSearchItem[]> {
  const data = await buyerApiFetch<any[]>('/api/v1/me/saved-searches', {}, sessionToken);
  return (Array.isArray(data) ? data : []).map((item: any) => ({
    id: item.id,
    name: item.name || '',
    filterJson: item.filterJson && typeof item.filterJson === 'object' ? item.filterJson : {},
    alertsEnabled: Boolean(item.alertsEnabled),
    createdAt: item.createdAt,
  }));
}

/** POST /api/v1/me/saved-searches — alerts stay off; no alert delivery is live. */
export async function createSavedSearchApi(payload: {
  name: string;
  filterJson: Record<string, unknown>;
}): Promise<boolean> {
  await buyerApiFetch('/api/v1/me/saved-searches', {
    method: 'POST',
    body: JSON.stringify({ name: payload.name, filterJson: payload.filterJson, alertsEnabled: false }),
  });
  return true;
}

/** DELETE /api/v1/me/saved-searches/:id */
export async function deleteSavedSearchApi(id: string): Promise<boolean> {
  await buyerApiFetch(`/api/v1/me/saved-searches/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return true;
}

export interface FavoriteItem {
  id: string;
  listingId: string;
  slug: string;
  title: string;
  askingPriceFils: string;
  status: string;
  thumbnailUrl: string | null;
  createdAt: string;
}

/** GET /api/v1/me/favorites */
export async function fetchFavorites(sessionToken?: string): Promise<FavoriteItem[]> {
  const data = await buyerApiFetch<any[]>('/api/v1/me/favorites', {}, sessionToken);
  return (Array.isArray(data) ? data : []).map((item: any) => ({
    id: item.id,
    listingId: item.listingId,
    slug: item.slug,
    title: item.title || '',
    askingPriceFils: String(item.askingPriceFils ?? '0'),
    status: item.status || '',
    thumbnailUrl: item.thumbnailUrl ?? null,
    createdAt: item.createdAt,
  }));
}

/** POST /api/v1/me/favorites */
export async function addFavoriteApi(listingId: string): Promise<boolean> {
  await buyerApiFetch('/api/v1/me/favorites', {
    method: 'POST',
    body: JSON.stringify({ listingId }),
  });
  return true;
}

/** DELETE /api/v1/me/favorites/:listingId */
export async function removeFavoriteApi(listingId: string): Promise<boolean> {
  await buyerApiFetch(`/api/v1/me/favorites/${encodeURIComponent(listingId)}`, { method: 'DELETE' });
  return true;
}

export interface BuyerConsentGrant {
  leadId: string;
  dealershipName: string;
  listingTitle: string;
  fieldsGranted: string[];
  purpose: string | null;
  grantedAt: string | null;
  revokedAt: string | null;
}

export interface BuyerProfileData {
  userId: string;
  displayName: string;
  email: string | null;
  preferredLanguage: string;
  preferredEmirate: string;
  budgetMinFils: number | null;
  budgetMaxFils: number | null;
  preferredMakes: string[];
  marketingConsentAt: string | null;
  grants: BuyerConsentGrant[];
}

/** GET /api/v1/me + /me/buyer-profile + /me/enquiries (consent grants). */
export async function fetchBuyerProfileData(sessionToken?: string): Promise<BuyerProfileData> {
  const [meData, profileData, enquiries] = await Promise.all([
    buyerApiFetch<any>('/api/v1/me', {}, sessionToken),
    // A buyer without a saved profile gets 404; treat as empty preferences.
    buyerApiFetch<any>('/api/v1/me/buyer-profile', {}, sessionToken).catch((err) => {
      if (err instanceof BuyerApiError && err.status === 404) return null;
      throw err;
    }),
    fetchBuyerEnquiries(sessionToken),
  ]);

  return {
    userId: meData?.id,
    displayName: meData?.displayName || '',
    email: meData?.email ?? null,
    preferredLanguage: profileData?.preferredLanguage || 'en',
    preferredEmirate: profileData?.preferredEmirate || '',
    budgetMinFils: profileData?.budgetMinFils != null ? Number(profileData.budgetMinFils) : null,
    budgetMaxFils: profileData?.budgetMaxFils != null ? Number(profileData.budgetMaxFils) : null,
    preferredMakes: Array.isArray(profileData?.preferredMakes) ? profileData.preferredMakes : [],
    marketingConsentAt: profileData?.marketingConsentAt ?? null,
    grants: enquiries
      .filter((e) => e.grant)
      .map((e) => ({
        leadId: e.id,
        dealershipName: e.listing.dealershipName,
        listingTitle: e.listing.title,
        fieldsGranted: e.grant!.fields,
        purpose: e.grant!.purpose,
        grantedAt: e.grant!.grantedAt,
        revokedAt: e.grant!.revokedAt,
      })),
  };
}

/** PATCH /api/v1/me/buyer-profile — only UpdateBuyerProfileDto fields; null clears a field. */
export async function updateBuyerProfileApi(payload: {
  preferredLanguage?: string;
  preferredEmirate?: string | null;
  budgetMinFils?: number | null;
  budgetMaxFils?: number | null;
  preferredMakes?: string[];
}): Promise<boolean> {
  await buyerApiFetch('/api/v1/me/buyer-profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return true;
}

export interface AccountSettings {
  userId: string;
  displayName: string;
  email: string | null;
  phoneE164: string | null;
  affiliation: string | null;
  settlementCurrency: string;
  garageVisibility: boolean;
  whatsappCommsConsent: boolean;
  updatedAt: string;
}

function mapAccountSettings(d: any): AccountSettings {
  return {
    userId: d?.userId,
    displayName: d?.displayName || '',
    email: d?.email ?? null,
    phoneE164: d?.phoneE164 ?? null,
    affiliation: d?.affiliation ?? null,
    settlementCurrency: d?.settlementCurrency || 'AED',
    garageVisibility: Boolean(d?.garageVisibility),
    whatsappCommsConsent: Boolean(d?.whatsappCommsConsent),
    updatedAt: d?.updatedAt,
  };
}

/** GET /api/v1/me/settings */
export async function fetchAccountSettings(sessionToken?: string): Promise<AccountSettings> {
  return mapAccountSettings(await buyerApiFetch<any>('/api/v1/me/settings', {}, sessionToken));
}

/**
 * PATCH /api/v1/me/settings. Only fields this UI exposes are sent; `handle` is
 * the DTO field the API stores verbatim as the user's display name.
 */
export async function updateAccountSettingsApi(payload: {
  handle?: string;
  affiliation?: string;
  settlementCurrency?: string;
  garageVisibility?: boolean;
  whatsappComms?: boolean;
}): Promise<AccountSettings> {
  return mapAccountSettings(
    await buyerApiFetch<any>('/api/v1/me/settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  );
}

/** POST /api/v1/auth/logout — revokes the current session and clears the cookie. */
export async function logoutApi(): Promise<void> {
  await buyerApiFetch('/api/v1/auth/logout', { method: 'POST' });
}
