/**
 * Dealer console locale (DL-08).
 *
 * The chosen locale is persisted in the `ao_locale` cookie so it survives
 * navigation and full reloads. The root layout reads it server-side to set
 * `<html lang dir>`, and live pages read it to render their strings. This
 * module is safe to import from client and server components; the
 * cookie-reading helper lives in `locale-server.ts`.
 */

import { humanizeEnum } from './dealer-api';
import { INTAKE_UNAVAILABLE_MESSAGE } from './permissions';

export type DealerLocale = 'en' | 'ar';

export const LOCALE_COOKIE = 'ao_locale';

export function normalizeLocale(value: string | null | undefined): DealerLocale {
  return value === 'ar' ? 'ar' : 'en';
}

export function localeDir(locale: DealerLocale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/** Client-side: persist the locale for one year on the gateway origin. */
export function persistLocale(locale: DealerLocale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
  document.documentElement.lang = locale;
  document.documentElement.dir = localeDir(locale);
}

const EN = {
  // Shell
  langToggle: 'Toggle language',
  firstDealershipShown: 'First active dealership shown',
  dealershipSwitchUnavailable: 'Dealership switching is not available yet',
  yourRole: (role: string) => `Your role: ${role}`,
  roles: {
    OWNER: 'Owner',
    ADMIN: 'Admin',
    SALES_MANAGER: 'Sales Manager',
    SALES_AGENT: 'Sales Agent',
    INVENTORY_MANAGER: 'Inventory Manager',
    SERVICE_ADVISOR: 'Service Advisor',
    FINANCE_MANAGER: 'Finance Manager',
    VIEWER: 'Viewer',
  } as Record<string, string>,
  unknownRole: 'Unknown role',
  intakeUnavailable: INTAKE_UNAVAILABLE_MESSAGE,

  // Enum labels
  stockStatus: {
    INTAKE: 'Intake',
    AVAILABLE: 'Available',
    RESERVED: 'Reserved',
    SOLD: 'Sold',
    TRANSFERRED: 'Transferred',
    ARCHIVED: 'Archived',
  } as Record<string, string>,
  listingStatus: {
    DRAFT: 'Draft',
    PENDING_REVIEW: 'Pending Review',
    PUBLISHED: 'Published',
    REJECTED: 'Rejected',
    PAUSED: 'Paused',
    SOLD: 'Sold',
    ARCHIVED: 'Archived',
  } as Record<string, string>,
  leadStatus: {
    NEW: 'New',
    CONTACTED: 'Contacted',
    QUALIFIED: 'Qualified',
    TEST_DRIVE_NEGOTIATION: 'Test Drive Negotiation',
    WON: 'Won',
    LOST: 'Lost',
    SPAM: 'Spam',
  } as Record<string, string>,
  noListing: 'No listing',

  // Shared stat labels
  totalStock: 'Total stock',
  available: 'Available',
  reserved: 'Reserved',
  sold: 'Sold',

  // Dashboard
  dashboardTitle: 'Dealership Overview',
  navInventory: 'Inventory',
  navLeads: 'Leads',
  addVehicleUnavailable: 'Add vehicle (unavailable)',
  addVehicleAria: (reason: string) => `Add vehicle — ${reason}`,
  stockHeading: 'Stock',
  allVehicles: 'All vehicles',
  allVehiclesInDealership: 'All vehicles in this dealership',
  latestOfVehicles: (shown: number, total: number) => `Latest ${shown} of ${total} vehicles only`,
  availableAskingValue: 'Available asking value',
  leadsHeading: 'Leads',
  allLeads: 'All leads',
  allTime: 'All time',
  awaitingFirstContact: 'Awaiting first contact',
  testDriveNegotiation: 'Test drive / negotiation',
  leadsHiddenTitle: 'Leads hidden for your role',
  leadsHiddenMessage: 'Only owners, admins, sales managers and sales agents can view lead data.',
  listingStatusHeading: 'Listing status',
  noVehiclesYet: 'No vehicles yet.',
  recentLeads: 'Recent leads',
  viewAll: 'View all',
  notAvailableForRole: 'Not available for your role.',
  noLeadsYet: 'No leads yet.',

  // Inventory
  inventoryTitle: 'Vehicle Inventory',
  intakeVehicle: 'Intake Vehicle',
  allStockAvailable: 'All stock, status Available',
  allStockReserved: 'All stock, status Reserved',
  allStockSold: 'All stock, status Sold',
  listingsOnPage: 'Listings on this page',
  listingsOnPageNote: (shown: number) => `Published / in review among the ${shown} vehicles shown`,
  filterByStock: 'Filter by stock status',
  allStock: 'All stock',
  vehiclesCaption: 'Dealership vehicles',
  colVehicle: 'Vehicle & stock number',
  colVin: 'VIN',
  colSpec: 'Specification',
  colStock: 'Stock',
  colListing: 'Listing',
  colCostAsking: 'Cost / Asking',
  colAsking: 'Asking',
  colActions: 'Actions',
  noVehiclesWithStatus: 'No vehicles with this stock status',
  noVehiclesInStock: 'No vehicles in stock yet',
  gccSpec: 'GCC spec',
  nonGcc: 'Non-GCC',
  cost: 'Cost:',
  viewLeads: 'View leads',

  // Leads
  leadsTitle: 'Leads',
  leadsRoleTitle: 'Leads are not available for your role',
  leadsRoleMessage:
    'Only owners, admins, sales managers and sales agents can view buyer enquiries. Ask a dealership admin if you need access.',
  leadsSummary: (total: number, statusLabel: string | null) =>
    `${total} ${statusLabel ? `${statusLabel.toLowerCase()} ` : ''}lead${total === 1 ? '' : 's'}. Buyer names show only when the buyer granted that field.`,
  filterLeads: 'Filter leads by status',
  all: 'All',
  assignmentNote:
    'Assignment can only pick staff already assigned to a lead on this page or clear the assignment. A staff directory is not available yet.',
  leadsCaption: 'Dealership leads',
  colReceived: 'Received (Dubai)',
  colBuyer: 'Buyer',
  colIntent: 'Intent / Contact',
  colStatus: 'Status',
  colAssigned: 'Assigned to',
  noLeadsWithStatus: 'No leads with this status',
  prefers: (channel: string) => `Prefers ${channel}`,
  unassigned: 'Unassigned',

  // Pager
  pagination: (noun: string) => `${noun} pagination`,
  showing: (from: number, to: number, total: number, noun: string) => `Showing ${from}–${to} of ${total} ${noun}`,
  pageOf: (page: number, totalPages: number) => `Page ${page} / ${totalPages}`,
  previous: 'Previous',
  next: 'Next',
  pageOutOfRangeTitle: 'Page out of range',
  pageOutOfRange: (page: number, totalPages: number) =>
    `Page ${page} does not exist. There ${totalPages === 1 ? 'is 1 page' : `are ${totalPages} pages`}.`,
  goToFirstPage: 'Go to page 1',
  goToLastPage: 'Go to last page',
  nounVehicles: 'vehicles',
  nounLeads: 'leads',

  // Service errors
  errDashboardTitle: 'Dealership overview unavailable',
  errDashboardFallback: 'Unable to load stock and lead data from the API.',
  errInventoryTitle: 'Dealer inventory unavailable',
  errInventoryFallback: 'Unable to load dealership inventory from the API.',
  errLeadsTitle: 'Leads unavailable',
  errLeadsFallback: 'Unable to load leads from the API.',
  signInTitle: 'Dealer Sign-In Required',
  signInMessage: 'Sign in with a dealer account to open the dealer console.',
  sessionExpiredMessage: 'Your session has expired or was revoked. Sign in again.',
  signIn: 'Sign In',
  noAccessTitle: 'No active dealership access',
  noAccessMessage:
    'This account is not an active member of any dealership. Ask a dealership owner or admin to invite you, or sign in with a different account.',
  forbiddenTitle: 'Access to this dealership was refused',
  forbiddenMessage:
    'Your membership or role does not allow this page. Ask a dealership admin to check your access, or sign in with a different account.',
  accountRestrictedTitle: 'Account restricted',
  accountRestrictedMessage: 'This account is suspended or disabled. Contact platform support.',
  tenantSuspendedTitle: 'Dealership suspended',
  tenantSuspendedMessage:
    'Your dealership account is suspended, so the dealer console is unavailable. Contact platform support or your dealership owner.',
  serviceUnavailableMessage: 'The dealership service is not responding right now. Try again in a moment.',
  retry: 'Retry',
  signOut: 'Sign out',
  signingOut: 'Signing out…',
  backToMarketplace: 'Back to marketplace',
};

export type DealerStrings = typeof EN;

const AR: DealerStrings = {
  langToggle: 'تبديل اللغة',
  firstDealershipShown: 'يتم عرض أول وكالة نشطة',
  dealershipSwitchUnavailable: 'التبديل بين الوكالات غير متاح بعد',
  yourRole: (role) => `دورك: ${role}`,
  roles: {
    OWNER: 'المالك',
    ADMIN: 'مسؤول',
    SALES_MANAGER: 'مدير المبيعات',
    SALES_AGENT: 'مندوب مبيعات',
    INVENTORY_MANAGER: 'مدير المخزون',
    SERVICE_ADVISOR: 'مستشار الخدمة',
    FINANCE_MANAGER: 'المدير المالي',
    VIEWER: 'مشاهد',
  },
  unknownRole: 'دور غير معروف',
  intakeUnavailable: 'إدخال المركبات يتطلب واجهة الكتالوج — غير متاح بعد',

  stockStatus: {
    INTAKE: 'قيد الإدخال',
    AVAILABLE: 'متاحة',
    RESERVED: 'محجوزة',
    SOLD: 'مباعة',
    TRANSFERRED: 'منقولة',
    ARCHIVED: 'مؤرشفة',
  },
  listingStatus: {
    DRAFT: 'مسودة',
    PENDING_REVIEW: 'قيد المراجعة',
    PUBLISHED: 'منشور',
    REJECTED: 'مرفوض',
    PAUSED: 'متوقف مؤقتاً',
    SOLD: 'مباع',
    ARCHIVED: 'مؤرشف',
  },
  leadStatus: {
    NEW: 'جديد',
    CONTACTED: 'تم التواصل',
    QUALIFIED: 'مؤهل',
    TEST_DRIVE_NEGOTIATION: 'تجربة قيادة / تفاوض',
    WON: 'تم البيع',
    LOST: 'خسارة',
    SPAM: 'غير مرغوب',
  },
  noListing: 'لا يوجد إعلان',

  totalStock: 'إجمالي المخزون',
  available: 'متاحة',
  reserved: 'محجوزة',
  sold: 'مباعة',

  dashboardTitle: 'نظرة عامة على الوكالة',
  navInventory: 'المخزون',
  navLeads: 'العملاء المحتملون',
  addVehicleUnavailable: 'إضافة مركبة (غير متاح)',
  addVehicleAria: (reason) => `إضافة مركبة — ${reason}`,
  stockHeading: 'المخزون',
  allVehicles: 'جميع المركبات',
  allVehiclesInDealership: 'جميع مركبات هذه الوكالة',
  latestOfVehicles: (shown, total) => `أحدث ${shown} من أصل ${total} مركبة فقط`,
  availableAskingValue: 'قيمة الأسعار المطلوبة للمتاح',
  leadsHeading: 'العملاء المحتملون',
  allLeads: 'جميع العملاء المحتملين',
  allTime: 'منذ البداية',
  awaitingFirstContact: 'بانتظار التواصل الأول',
  testDriveNegotiation: 'تجربة قيادة / تفاوض',
  leadsHiddenTitle: 'العملاء المحتملون مخفيون لدورك',
  leadsHiddenMessage: 'يمكن فقط للمالكين والمسؤولين ومديري المبيعات ومندوبي المبيعات عرض بيانات العملاء المحتملين.',
  listingStatusHeading: 'حالة الإعلانات',
  noVehiclesYet: 'لا توجد مركبات بعد.',
  recentLeads: 'أحدث العملاء المحتملين',
  viewAll: 'عرض الكل',
  notAvailableForRole: 'غير متاح لدورك.',
  noLeadsYet: 'لا يوجد عملاء محتملون بعد.',

  inventoryTitle: 'مخزون المركبات',
  intakeVehicle: 'إدخال مركبة',
  allStockAvailable: 'كل المخزون، الحالة متاحة',
  allStockReserved: 'كل المخزون، الحالة محجوزة',
  allStockSold: 'كل المخزون، الحالة مباعة',
  listingsOnPage: 'الإعلانات في هذه الصفحة',
  listingsOnPageNote: (shown) => `منشور / قيد المراجعة من بين ${shown} مركبة معروضة`,
  filterByStock: 'تصفية حسب حالة المخزون',
  allStock: 'كل المخزون',
  vehiclesCaption: 'مركبات الوكالة',
  colVehicle: 'المركبة ورقم المخزون',
  colVin: 'رقم الهيكل (VIN)',
  colSpec: 'المواصفات',
  colStock: 'المخزون',
  colListing: 'الإعلان',
  colCostAsking: 'التكلفة / السعر المطلوب',
  colAsking: 'السعر المطلوب',
  colActions: 'الإجراءات',
  noVehiclesWithStatus: 'لا توجد مركبات بحالة المخزون هذه',
  noVehiclesInStock: 'لا توجد مركبات في المخزون بعد',
  gccSpec: 'مواصفات خليجية',
  nonGcc: 'غير خليجية',
  cost: 'التكلفة:',
  viewLeads: 'عرض العملاء المحتملين',

  leadsTitle: 'العملاء المحتملون',
  leadsRoleTitle: 'العملاء المحتملون غير متاحين لدورك',
  leadsRoleMessage:
    'يمكن فقط للمالكين والمسؤولين ومديري المبيعات ومندوبي المبيعات عرض استفسارات المشترين. اطلب من مسؤول الوكالة منحك الصلاحية إذا لزم الأمر.',
  leadsSummary: (total, statusLabel) =>
    `${total} ${statusLabel ? `(${statusLabel}) ` : ''}عميل محتمل. تظهر أسماء المشترين فقط عندما يوافق المشتري على مشاركتها.`,
  filterLeads: 'تصفية العملاء المحتملين حسب الحالة',
  all: 'الكل',
  assignmentNote:
    'يمكن للتعيين اختيار الموظفين المعيّنين مسبقاً لعميل محتمل في هذه الصفحة فقط أو إلغاء التعيين. دليل الموظفين غير متاح بعد.',
  leadsCaption: 'العملاء المحتملون للوكالة',
  colReceived: 'تاريخ الاستلام (دبي)',
  colBuyer: 'المشتري',
  colIntent: 'الغرض / وسيلة التواصل',
  colStatus: 'الحالة',
  colAssigned: 'المسؤول',
  noLeadsWithStatus: 'لا يوجد عملاء محتملون بهذه الحالة',
  prefers: (channel) => `يفضّل ${channel}`,
  unassigned: 'غير معيّن',

  pagination: (noun) => `ترقيم صفحات ${noun}`,
  showing: (from, to, total, noun) => `عرض ${from}–${to} من ${total} ${noun}`,
  pageOf: (page, totalPages) => `الصفحة ${page} / ${totalPages}`,
  previous: 'السابق',
  next: 'التالي',
  pageOutOfRangeTitle: 'الصفحة خارج النطاق',
  pageOutOfRange: (page, totalPages) => `الصفحة ${page} غير موجودة. عدد الصفحات المتاحة: ${totalPages}.`,
  goToFirstPage: 'الانتقال إلى الصفحة 1',
  goToLastPage: 'الانتقال إلى الصفحة الأخيرة',
  nounVehicles: 'مركبات',
  nounLeads: 'عملاء محتملين',

  errDashboardTitle: 'نظرة الوكالة العامة غير متاحة',
  errDashboardFallback: 'تعذّر تحميل بيانات المخزون والعملاء المحتملين من الخادم.',
  errInventoryTitle: 'مخزون الوكالة غير متاح',
  errInventoryFallback: 'تعذّر تحميل مخزون الوكالة من الخادم.',
  errLeadsTitle: 'العملاء المحتملون غير متاحين',
  errLeadsFallback: 'تعذّر تحميل العملاء المحتملين من الخادم.',
  signInTitle: 'يلزم تسجيل دخول الوكيل',
  signInMessage: 'سجّل الدخول بحساب وكيل لفتح لوحة الوكالة.',
  sessionExpiredMessage: 'انتهت صلاحية جلستك أو تم إلغاؤها. سجّل الدخول مرة أخرى.',
  signIn: 'تسجيل الدخول',
  noAccessTitle: 'لا توجد صلاحية وصول نشطة لأي وكالة',
  noAccessMessage:
    'هذا الحساب ليس عضواً نشطاً في أي وكالة. اطلب من مالك الوكالة أو مسؤولها دعوتك، أو سجّل الدخول بحساب آخر.',
  forbiddenTitle: 'تم رفض الوصول إلى هذه الوكالة',
  forbiddenMessage:
    'عضويتك أو دورك لا يسمح بهذه الصفحة. اطلب من مسؤول الوكالة مراجعة صلاحياتك، أو سجّل الدخول بحساب آخر.',
  accountRestrictedTitle: 'الحساب مقيّد',
  accountRestrictedMessage: 'هذا الحساب موقوف أو معطّل. تواصل مع دعم المنصة.',
  tenantSuspendedTitle: 'الوكالة موقوفة',
  tenantSuspendedMessage:
    'حساب وكالتك موقوف، لذا لوحة الوكالة غير متاحة. تواصل مع دعم المنصة أو مالك الوكالة.',
  serviceUnavailableMessage: 'خدمة الوكالة لا تستجيب حالياً. حاول مرة أخرى بعد قليل.',
  retry: 'إعادة المحاولة',
  signOut: 'تسجيل الخروج',
  signingOut: 'جارٍ تسجيل الخروج…',
  backToMarketplace: 'العودة إلى السوق',
};

export function dealerStrings(locale: DealerLocale): DealerStrings {
  return locale === 'ar' ? AR : EN;
}

/** Localised label for a stock / listing / lead status, falling back to the humanised enum. */
export function statusLabel(
  t: DealerStrings,
  kind: 'stockStatus' | 'listingStatus' | 'leadStatus',
  value: string | null | undefined,
): string {
  if (!value) return '—';
  return t[kind][value] ?? humanizeEnum(value);
}

export function localizedRoleLabel(t: DealerStrings, role: string | null | undefined): string {
  return (role && t.roles[role]) || t.unknownRole;
}
