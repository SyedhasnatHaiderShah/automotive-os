'use client';

import React, { useState, useEffect, useId, useRef } from 'react';
import { AdminSidebar } from '../../components/AdminSidebar';
import { AdminHeader } from '../../components/AdminHeader';
import { useLocale } from '../../lib/locale';
import {
  Building2,
  Search,
  Plus,
  Shield,
  ShieldCheck,
  ShieldX,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserPlus,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { AdminDialog } from '../../components/AdminDialog';
import { ConfirmReasonModal } from '../../components/ConfirmReasonModal';
import {
  AdminTenantSummary,
  TenantStatus,
  createDealer,
  errorMessage,
  inviteDealerStaff,
  listTenants,
  updateTenantStatus,
} from '../../lib/api';
import { kybBadgeClass, kybLabel } from '../../lib/kyb';

type DealerItem = AdminTenantSummary;

function KybIcon({ status }: { status: string }) {
  const cls = 'w-3 h-3';
  if (status === 'APPROVED') return <ShieldCheck className={cls} aria-hidden="true" />;
  if (status === 'IN_REVIEW') return <Clock className={cls} aria-hidden="true" />;
  if (status === 'REJECTED' || status === 'EXPIRED') return <ShieldX className={cls} aria-hidden="true" />;
  return <Shield className={cls} aria-hidden="true" />;
}

const TENANT_STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  ACTIVE: { en: 'Active', ar: 'نشطة' },
  SUSPENDED: { en: 'Suspended', ar: 'معلّقة' },
  PENDING: { en: 'Pending', ar: 'قيد الانتظار' },
  CLOSED: { en: 'Closed', ar: 'مغلقة' },
};

const INVITE_ROLES: Array<{ value: string; en: string; ar: string }> = [
  { value: 'SALES_AGENT', en: 'Sales Pipeline & Enquiries', ar: 'مسار المبيعات والاستفسارات' },
  { value: 'SALES_MANAGER', en: 'Approval & Offers', ar: 'الموافقات والعروض' },
  { value: 'INVENTORY_MANAGER', en: 'Stock & Media', ar: 'المخزون والوسائط' },
  { value: 'SERVICE_ADVISOR', en: 'Service & Bookings', ar: 'الخدمة والحجوزات' },
  { value: 'FINANCE_MANAGER', en: 'Escrow & Settlement', ar: 'الضمان والتسوية' },
  { value: 'ADMIN', en: 'Dealership Operational Admin', ar: 'مسؤول عمليات الوكالة' },
  { value: 'VIEWER', en: 'Read-Only Reports', ar: 'تقارير للقراءة فقط' },
];

export default function AdminDealersPage() {
  const { isRtl, toggleLocale, t } = useLocale();
  const [dealers, setDealers] = useState<DealerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<{ dealer: DealerItem; nextStatus: TenantStatus } | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Create Form State
  const [newSlug, setNewSlug] = useState('');
  const [newLegalName, setNewLegalName] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('SALES_AGENT');
  const [generatedTokenUrl, setGeneratedTokenUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fieldId = useId();
  const createTitleId = `${fieldId}-create-title`;
  const inviteTitleId = `${fieldId}-invite-title`;
  const searchId = `${fieldId}-search`;
  const createSlugRef = useRef<HTMLInputElement>(null);
  const inviteEmailRef = useRef<HTMLInputElement>(null);

  const fetchDealers = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listTenants();
      setDealers(Array.isArray(data) ? data : []);
    } catch (err) {
      setDealers([]);
      setLoadError(errorMessage(err, t('Dealerships could not be loaded.', 'تعذر تحميل الوكالات.')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateError(null);
  };

  const closeInviteModal = () => {
    setShowInviteModal(null);
    setInviteError(null);
  };

  const handleCreateDealer = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setCreateError(null);
    try {
      const data = await createDealer({
        slug: newSlug.trim().toLowerCase(),
        legalName: newLegalName.trim(),
        displayName: newDisplayName.trim(),
        adminEmail: newAdminEmail.trim().toLowerCase(),
        adminName: newAdminName.trim(),
      });

      const name = data?.displayName ?? newDisplayName.trim();
      showToast('success', t(`API created dealership '${name}'.`, `أنشأت الواجهة الوكالة '${name}'.`));
      closeCreateModal();
      setNewSlug('');
      setNewLegalName('');
      setNewDisplayName('');
      setNewAdminEmail('');
      setNewAdminName('');
      fetchDealers();
    } catch (err) {
      // AD-03: the error stays inside the open dialog, not behind its backdrop.
      setCreateError(
        `${t('Not created:', 'لم يتم الإنشاء:')} ${errorMessage(err, t('Dealership creation failed', 'فشل إنشاء الوكالة'))}`,
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmStatusChange = async (reason: string) => {
    if (!pendingStatus) return;
    const { dealer, nextStatus } = pendingStatus;
    setActionLoading(true);
    setStatusError(null);
    try {
      await updateTenantStatus(dealer.id, nextStatus, reason);
      showToast(
        'success',
        t(
          `API confirmed ${dealer.displayName} is now ${nextStatus}.`,
          `أكدت الواجهة أن ${dealer.displayName} أصبحت الآن ${nextStatus}.`,
        ),
      );
      setPendingStatus(null);
      fetchDealers();
    } catch (err) {
      setStatusError(`${t('Not saved:', 'لم يُحفظ:')} ${errorMessage(err, t('Status update failed', 'فشل تحديث الحالة'))}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showInviteModal) return;
    setActionLoading(true);
    setInviteError(null);
    try {
      const data = await inviteDealerStaff(showInviteModal, {
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });

      if (!data?.activationToken) {
        throw new Error(t('The API did not return an activation token.', 'لم تُرجع الواجهة رمز التفعيل.'));
      }
      const activationLink = `${window.location.origin}/auth/activate?token=${encodeURIComponent(data.activationToken)}`;
      setGeneratedTokenUrl(activationLink);
      showToast('success', t('API issued the invitation token.', 'أصدرت الواجهة رمز الدعوة.'));
    } catch (err) {
      // AD-03: shown inline in the invite dialog.
      setInviteError(
        `${t('Invitation not issued:', 'لم تصدر الدعوة:')} ${errorMessage(err, t('Invitation failed', 'فشلت الدعوة'))}`,
      );
    } finally {
      setActionLoading(false);
    }
  };

  const filteredDealers = dealers.filter(
    (d) =>
      d.displayName.toLowerCase().includes(search.toLowerCase()) ||
      d.slug.toLowerCase().includes(search.toLowerCase()) ||
      d.legalName.toLowerCase().includes(search.toLowerCase())
  );

  const statusLabel = (status: string) => {
    const entry = TENANT_STATUS_LABELS[status];
    return entry ? t(entry.en, entry.ar) : status;
  };

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:border-primary focus:outline-none';

  return (
    <div className={`min-h-screen bg-background font-body-md text-on-surface ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <AdminSidebar isRtl={isRtl} />
      <div className={isRtl ? 'pr-60' : 'pl-60'}>
        <AdminHeader isRtl={isRtl} onToggleRtl={toggleLocale} />

        <main className="w-full pt-16 bg-background px-gutter py-space-lg">
          {/* Header Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-white">
                  {isRtl ? 'حوكمة واعتماد الوكالات' : 'Institutional Dealership Management'}
                </h1>
              </div>
              <p className="text-xs text-outline mt-1 font-mono">
                {isRtl
                  ? 'تهيئة وتفويض صالات العرض المعتمدة وإدارة المشرفين والامتيازات'
                  : 'Enterprise Dealership Provisioning, KYB Enforcement, Status Control & Staff Invitations'}
              </p>
            </div>

            <div className="flex items-center gap-3 self-start">
              <button
                type="button"
                onClick={fetchDealers}
                className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-xs text-on-surface flex items-center gap-2 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                <span>{t('Refresh', 'تحديث')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreateError(null);
                  setShowCreateModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-[#b39129] text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>{t('Provision Dealership', 'تهيئة وكالة')}</span>
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div
              role="status"
              className={`mb-5 p-4 rounded-xl border flex items-center gap-3 text-xs font-mono shadow-xl transition-all ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                  : 'bg-red-950/60 border-red-500/40 text-red-200'
              }`}
            >
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400" aria-hidden="true" />
              )}
              <span>{toastMessage.text}</span>
            </div>
          )}

          {/* Search bar */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/40 mb-6">
            <div className="relative w-full md:w-96">
              <label htmlFor={searchId} className="sr-only">
                {t('Search dealerships by name or slug', 'ابحث عن الوكالات بالاسم أو المعرّف')}
              </label>
              <Search
                className={`w-4 h-4 text-outline absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`}
                aria-hidden="true"
              />
              <input
                id={searchId}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('Search dealerships by name or slug...', 'ابحث عن الوكالات بالاسم أو المعرّف...')}
                className={`w-full ${isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 rounded-lg bg-surface-container-lowest border border-white/10 text-xs text-white placeholder:text-gray-500 focus:border-primary focus:outline-none`}
              />
            </div>
          </div>

          {/* Dealerships Table */}
          <div className="rounded-xl border border-surface-container-high/40 bg-surface-container-low overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs font-mono">
                <thead className="bg-surface-container-lowest border-b border-white/10 text-outline uppercase tracking-wider text-[11px]">
                  <tr>
                    <th scope="col" className="py-3 px-4 text-start">{t('Dealership Entity', 'الوكالة')}</th>
                    <th scope="col" className="py-3 px-4 text-start">{t('Slug Identifier', 'المعرّف')}</th>
                    <th scope="col" className="py-3 px-4 text-start">{t('KYB Accreditation', 'اعتماد التحقق')}</th>
                    <th scope="col" className="py-3 px-4 text-start">{t('Staff Count', 'عدد الموظفين')}</th>
                    <th scope="col" className="py-3 px-4 text-start">{t('Inventory Size', 'حجم المخزون')}</th>
                    <th scope="col" className="py-3 px-4 text-start">{t('Operational Status', 'الحالة التشغيلية')}</th>
                    <th scope="col" className="py-3 px-4 text-end">{t('Actions', 'الإجراءات')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadError ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center">
                        <div role="alert" className="inline-flex flex-col items-center gap-2 text-red-300">
                          <span className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" aria-hidden="true" />
                            {loadError}
                          </span>
                          <button
                            type="button"
                            onClick={fetchDealers}
                            className="px-3 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-white text-xs"
                          >
                            {t('Retry', 'إعادة المحاولة')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : loading && dealers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-outline">
                        {t('Loading dealerships…', 'جارٍ تحميل الوكالات…')}
                      </td>
                    </tr>
                  ) : filteredDealers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-outline">
                        {t('No dealerships found matching criteria.', 'لا توجد وكالات مطابقة.')}
                      </td>
                    </tr>
                  ) : (
                    filteredDealers.map((d) => (
                      <tr key={d.id} className="hover:bg-surface-container-high/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-sans font-bold text-sm text-white">{d.displayName}</span>
                            <span className="text-gray-400 text-xs">{d.legalName}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-primary" dir="ltr">/{d.slug}</td>

                        <td className="py-3 px-4">
                          {/* AD-05: per-status styling; only APPROVED looks verified. */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${kybBadgeClass(
                              d.verificationStatus,
                            )}`}
                            title={d.verificationStatus}
                          >
                            <KybIcon status={d.verificationStatus} />
                            <span>{kybLabel(d.verificationStatus, isRtl)}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-white">
                          {d.staffCount} {t('Staff', 'موظف')}
                        </td>

                        <td className="py-3 px-4 text-white">
                          {d.vehicleCount} {t('Vehicles', 'مركبة')}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              d.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : d.status === 'CLOSED'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {statusLabel(d.status)}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-end">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowInviteModal(d.id);
                                setGeneratedTokenUrl(null);
                                setInviteError(null);
                              }}
                              className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-white text-xs flex items-center gap-1"
                              aria-label={t(`Invite employee to ${d.displayName}`, `دعوة موظف إلى ${d.displayName}`)}
                            >
                              <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>{t('Invite', 'دعوة')}</span>
                            </button>

                            {/* AD-04: Suspend only from ACTIVE, Activate only from SUSPENDED.
                                PENDING needs an APPROVED KYB decision; CLOSED is terminal. */}
                            {d.status === 'ACTIVE' || d.status === 'SUSPENDED' ? (
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => {
                                  setStatusError(null);
                                  setPendingStatus({ dealer: d, nextStatus: d.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' });
                                }}
                                className={`px-2.5 py-1 rounded text-xs font-bold transition-colors disabled:opacity-50 ${
                                  d.status === 'ACTIVE'
                                    ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                                    : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
                                }`}
                              >
                                {d.status === 'ACTIVE' ? t('Suspend', 'تعليق') : t('Activate', 'تفعيل')}
                              </button>
                            ) : (
                              <span className="px-2.5 py-1 text-[11px] text-outline">
                                {d.status === 'CLOSED'
                                  ? t('Closed (final)', 'مغلقة (نهائي)')
                                  : t('Awaiting KYB approval', 'بانتظار اعتماد التحقق')}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="px-4 py-3 border-t border-white/10 text-[11px] font-mono text-outline">
              {t(
                `${dealers.length} dealership${dealers.length === 1 ? '' : 's'} loaded. The tenants API returns the full list without server-side pagination; search filters this page locally.`,
                `تم تحميل ${dealers.length} وكالة. تُرجع واجهة الوكالات القائمة دون ترقيم من الخادم؛ والبحث يرشّح هذه الصفحة محلياً.`,
              )}
            </p>
          </div>
        </main>
      </div>

      {/* Provision Dealership Modal (AD-12: dialog role, Escape, focus trap, labelled fields) */}
      <AdminDialog
        open={showCreateModal}
        labelledBy={createTitleId}
        onClose={closeCreateModal}
        dismissible={!actionLoading}
        initialFocusRef={createSlugRef}
        zIndexClass="z-[100]"
        className="w-full max-w-lg bg-[#121824] border border-white/10 rounded-2xl p-6 shadow-2xl relative"
      >
        <div dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" aria-hidden="true" />
              <h2 id={createTitleId} className="text-lg font-bold font-heading text-white">
                {t('Provision New Dealership', 'تهيئة وكالة جديدة')}
              </h2>
            </div>
            <button
              type="button"
              onClick={closeCreateModal}
              disabled={actionLoading}
              aria-label={t('Close provision dealership dialog', 'إغلاق نافذة تهيئة الوكالة')}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleCreateDealer} className="space-y-4 text-xs font-mono">
            <div>
              <label htmlFor={`${fieldId}-slug`} className="block text-gray-400 mb-1">
                {t('Dealership Slug (URL Identifier)', 'معرّف الوكالة (للرابط)')}
              </label>
              <input
                id={`${fieldId}-slug`}
                ref={createSlugRef}
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="e.g. example-motors"
                required
                dir="ltr"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor={`${fieldId}-legal`} className="block text-gray-400 mb-1">
                {t('Legal Registered Entity Name', 'الاسم القانوني المسجل')}
              </label>
              <input
                id={`${fieldId}-legal`}
                type="text"
                value={newLegalName}
                onChange={(e) => setNewLegalName(e.target.value)}
                placeholder="e.g. Example Motors Trading LLC"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor={`${fieldId}-display`} className="block text-gray-400 mb-1">
                {t('Customer Display Name', 'الاسم المعروض للعملاء')}
              </label>
              <input
                id={`${fieldId}-display`}
                type="text"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="e.g. Example Motors Dubai"
                required
                className={inputClass}
              />
            </div>

            <fieldset className="pt-2 border-t border-white/10">
              <legend className="text-primary font-bold block mb-2 pt-2">
                {t('Initial Dealer Principal Assignment', 'تعيين المدير الرئيسي للوكالة')}
              </legend>
              <div className="space-y-3">
                <div>
                  <label htmlFor={`${fieldId}-admin-name`} className="block text-gray-400 mb-1">
                    {t('Principal Contact Name', 'اسم المسؤول الرئيسي')}
                  </label>
                  <input
                    id={`${fieldId}-admin-name`}
                    type="text"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    placeholder={t('e.g. Principal full name', 'مثال: الاسم الكامل')}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor={`${fieldId}-admin-email`} className="block text-gray-400 mb-1">
                    {t('Principal Email Address', 'البريد الإلكتروني للمسؤول الرئيسي')}
                  </label>
                  <input
                    id={`${fieldId}-admin-email`}
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="e.g. principal@example.com"
                    required
                    dir="ltr"
                    className={inputClass}
                  />
                </div>
              </div>
            </fieldset>

            {createError && (
              <p role="alert" className="p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200">
                {createError}
              </p>
            )}

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:text-white disabled:opacity-50"
              >
                {t('Cancel', 'إلغاء')}
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-primary text-black font-bold disabled:opacity-50"
              >
                {actionLoading ? t('Provisioning...', 'جارٍ التهيئة...') : t('Confirm Provisioning', 'تأكيد التهيئة')}
              </button>
            </div>
          </form>
        </div>
      </AdminDialog>

      {/* Invite Staff Modal (AD-12) */}
      <AdminDialog
        open={showInviteModal !== null}
        labelledBy={inviteTitleId}
        onClose={closeInviteModal}
        dismissible={!actionLoading}
        initialFocusRef={inviteEmailRef}
        zIndexClass="z-[100]"
        className="w-full max-w-md bg-[#121824] border border-white/10 rounded-2xl p-6 shadow-2xl relative"
      >
        <div dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" aria-hidden="true" />
              <h2 id={inviteTitleId} className="text-lg font-bold font-heading text-white">
                {t('Issue Staff Invitation', 'إصدار دعوة موظف')}
              </h2>
            </div>
            <button
              type="button"
              onClick={closeInviteModal}
              disabled={actionLoading}
              aria-label={t('Close staff invitation dialog', 'إغلاق نافذة دعوة الموظف')}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {generatedTokenUrl ? (
            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200" role="status">
                <span className="font-bold block mb-1">{t('Cryptographic Token Generated!', 'تم إنشاء الرمز المشفّر!')}</span>
                <span>
                  {t(
                    'Share this single-use activation link with the employee (expires in 48 hours):',
                    'شارك رابط التفعيل هذا (للاستخدام مرة واحدة) مع الموظف (ينتهي خلال 48 ساعة):',
                  )}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-black/40 border border-white/10 break-all select-all text-gray-300 text-[11px]" dir="ltr">
                {generatedTokenUrl}
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedTokenUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="w-full py-2 px-4 rounded-lg bg-primary text-black font-bold flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                <span>{copied ? t('Copied to Clipboard!', 'تم النسخ!') : t('Copy Activation Link', 'نسخ رابط التفعيل')}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleInviteStaff} className="space-y-4 text-xs font-mono">
              <div>
                <label htmlFor={`${fieldId}-invite-email`} className="block text-gray-400 mb-1">
                  {t('Staff Member Email', 'بريد الموظف الإلكتروني')}
                </label>
                <input
                  id={`${fieldId}-invite-email`}
                  ref={inviteEmailRef}
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="agent@example.com"
                  required
                  dir="ltr"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor={`${fieldId}-invite-role`} className="block text-gray-400 mb-1">
                  {t('Assigned Role', 'الدور المعيّن')}
                </label>
                <select
                  id={`${fieldId}-invite-role`}
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:border-primary focus:outline-none"
                >
                  {INVITE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.value} ({t(r.en, r.ar)})
                    </option>
                  ))}
                </select>
              </div>

              {inviteError && (
                <p role="alert" className="p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200">
                  {inviteError}
                </p>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeInviteModal}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:text-white disabled:opacity-50"
                >
                  {t('Cancel', 'إلغاء')}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-primary text-black font-bold disabled:opacity-50"
                >
                  {actionLoading ? t('Issuing...', 'جارٍ الإصدار...') : t('Generate Invitation Token', 'إنشاء رمز الدعوة')}
                </button>
              </div>
            </form>
          )}
        </div>
      </AdminDialog>

      <ConfirmReasonModal
        open={pendingStatus !== null}
        title={
          pendingStatus?.nextStatus === 'SUSPENDED'
            ? t('Suspend this dealership?', 'تعليق هذه الوكالة؟')
            : t('Reactivate this dealership?', 'إعادة تفعيل هذه الوكالة؟')
        }
        description={
          pendingStatus
            ? pendingStatus.nextStatus === 'SUSPENDED'
              ? t(
                  `${pendingStatus.dealer.displayName} will be suspended. The API unpublishes its active listings.`,
                  `سيتم تعليق ${pendingStatus.dealer.displayName}. تُلغي الواجهة نشر إعلاناتها النشطة.`,
                )
              : t(
                  `${pendingStatus.dealer.displayName} will be set to ACTIVE.`,
                  `سيتم تعيين ${pendingStatus.dealer.displayName} إلى نشطة.`,
                )
            : ''
        }
        confirmLabel={
          pendingStatus?.nextStatus === 'SUSPENDED'
            ? t('Suspend dealership', 'تعليق الوكالة')
            : t('Reactivate dealership', 'إعادة تفعيل الوكالة')
        }
        tone={pendingStatus?.nextStatus === 'SUSPENDED' ? 'danger' : 'neutral'}
        busy={actionLoading}
        error={statusError}
        onCancel={() => setPendingStatus(null)}
        onConfirm={handleConfirmStatusChange}
      />
    </div>
  );
}
