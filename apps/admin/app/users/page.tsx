'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '../../components/AdminSidebar';
import { AdminHeader } from '../../components/AdminHeader';
import { useLocale } from '../../lib/locale';
import { ConfirmReasonModal } from '../../components/ConfirmReasonModal';
import {
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  UserX,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  AdminUser,
  errorMessage,
  getCurrentAdmin,
  listUsers,
  revokeUserSessions,
  updateUserStatus,
} from '../../lib/api';

type UserItem = AdminUser;

type PendingAction = { kind: 'SUSPENDED' | 'DISABLED' | 'ACTIVE' | 'REVOKE'; user: UserItem };

const PAGE_SIZE = 20;

const ACTION_COPY: Record<
  PendingAction['kind'],
  { title: string; confirm: string; titleAr: string; confirmAr: string }
> = {
  SUSPENDED: { title: 'Suspend this account?', confirm: 'Suspend account', titleAr: 'تعليق هذا الحساب؟', confirmAr: 'تعليق الحساب' },
  DISABLED: { title: 'Disable this account?', confirm: 'Disable account', titleAr: 'تعطيل هذا الحساب؟', confirmAr: 'تعطيل الحساب' },
  ACTIVE: { title: 'Reactivate this account?', confirm: 'Reactivate account', titleAr: 'إعادة تفعيل هذا الحساب؟', confirmAr: 'إعادة تفعيل الحساب' },
  REVOKE: { title: 'Revoke all active sessions?', confirm: 'Revoke sessions', titleAr: 'إلغاء جميع الجلسات النشطة؟', confirmAr: 'إلغاء الجلسات' },
};

export default function AdminUsersPage() {
  const { isRtl, toggleLocale, t } = useLocale();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  // AD-02: mutations stay hidden until the signed-in admin id is known, so the
  // self-action guard cannot fail open when /auth/me errors.
  const [currentAdminState, setCurrentAdminState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Debounce free-text search (~300ms); a new term restarts at page 1.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const next = searchInput.trim();
      if (next !== search) {
        setSearch(next);
        setPage(1);
      }
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput, search]);

  useEffect(() => {
    let active = true;
    getCurrentAdmin()
      .then((me) => {
        if (!active) return;
        setCurrentAdminId(me.id);
        setCurrentAdminState(me.id ? 'ok' : 'error');
      })
      .catch(() => {
        if (!active) return;
        setCurrentAdminId(null);
        setCurrentAdminState('error');
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);
    listUsers(
      {
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
      },
      controller.signal,
    )
      .then((data) => {
        setUsers(Array.isArray(data?.users) ? data.users : []);
        setTotal(data?.total ?? 0);
        setTotalPages(data?.totalPages ?? 0);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setUsers([]);
        setTotal(0);
        setTotalPages(0);
        setLoadError(errorMessage(err, t('Users could not be loaded.', 'تعذر تحميل المستخدمين.')));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter, roleFilter, reloadKey]);

  const fetchUsers = () => setReloadKey((k) => k + 1);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const openAction = (kind: PendingAction['kind'], user: UserItem) => {
    setActionError(null);
    setPendingAction({ kind, user });
  };

  const runPendingAction = async (reason: string) => {
    if (!pendingAction) return;
    const { kind, user } = pendingAction;
    setActionLoading(true);
    setActionError(null);
    try {
      if (kind === 'REVOKE') {
        const data = await revokeUserSessions(user.id);
        const count = data?.revokedCount ?? 0;
        showToast(
          'success',
          t(
            `API revoked ${count} active session(s) for ${user.displayName}.`,
            `ألغت الواجهة ${count} جلسة نشطة لـ ${user.displayName}.`,
          ),
        );
      } else {
        await updateUserStatus(user.id, kind, reason);
        showToast(
          'success',
          t(`API confirmed status ${kind} for ${user.displayName}.`, `أكدت الواجهة الحالة ${kind} لـ ${user.displayName}.`),
        );
        setSelectedUser((sel) => (sel && sel.id === user.id ? { ...sel, status: kind } : sel));
      }
      setPendingAction(null);
      fetchUsers();
    } catch (err) {
      setActionError(`${t('Not saved:', 'لم يُحفظ:')} ${errorMessage(err, t('Operation failed', 'فشلت العملية'))}`);
    } finally {
      setActionLoading(false);
    }
  };

  const isSelf = (u: UserItem | null) => Boolean(u && currentAdminId && u.id === currentAdminId);
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

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
                  {isRtl ? 'إدارة وحوكمة المستخدمين' : 'Platform User Governance'}
                </h1>
              </div>
              <p className="text-xs text-outline mt-1 font-mono">
                {isRtl
                  ? 'مراقبة هويات المشترين وموظفي الوكالات وإدارة الجلسات والأذونات'
                  : 'Universal Identity Oversight, RBAC Enforcement, Session Control & Soft-Deletion'}
              </p>
            </div>

            <button
              type="button"
              onClick={fetchUsers}
              className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-xs text-on-surface flex items-center gap-2 transition-colors self-start"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{t('Refresh Roster', 'تحديث القائمة')}</span>
            </button>
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
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
              <span>{toastMessage.text}</span>
            </div>
          )}

          {/* Filters & Search Toolbar */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/40 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search
                className={`w-4 h-4 text-outline absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`}
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('Search by email, name, or phone...', 'ابحث بالبريد أو الاسم أو الهاتف...')}
                aria-label={t('Search users by email, name, or phone', 'ابحث عن المستخدمين بالبريد أو الاسم أو الهاتف')}
                className={`w-full ${isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 rounded-lg bg-surface-container-lowest border border-white/10 text-xs text-white placeholder:text-gray-500 focus:border-primary focus:outline-none`}
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs text-outline font-mono" aria-hidden="true">{t('Status:', 'الحالة:')}</span>
                <select
                  value={statusFilter}
                  aria-label={t('Filter by status', 'تصفية حسب الحالة')}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-surface-container-lowest border border-white/10 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">{t('All Statuses', 'كل الحالات')}</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="DISABLED">DISABLED</option>
                  <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-outline font-mono" aria-hidden="true">{t('Role:', 'الدور:')}</span>
                <select
                  value={roleFilter}
                  aria-label={t('Filter by role', 'تصفية حسب الدور')}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-surface-container-lowest border border-white/10 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">{t('All Roles', 'كل الأدوار')}</option>
                  <option value="PLATFORM_ADMIN">{t('Platform Admin', 'مشرف المنصة')}</option>
                  <option value="OWNER">{t('Dealer Owner', 'مالك الوكالة')}</option>
                  <option value="ADMIN">{t('Dealer Admin', 'مسؤول الوكالة')}</option>
                  <option value="SALES_MANAGER">{t('Sales Manager', 'مدير المبيعات')}</option>
                  <option value="SALES_AGENT">{t('Sales Agent', 'مندوب مبيعات')}</option>
                  <option value="BUYER">{t('Retail Buyer', 'مشترٍ')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-xl border border-surface-container-high/40 bg-surface-container-low overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs font-mono">
                <thead className="bg-surface-container-lowest border-b border-white/10 text-outline uppercase tracking-wider text-[11px]">
                  <tr>
                    <th scope="col" className="py-3 px-4 text-start">{t('User Identity', 'هوية المستخدم')}</th>
                    <th scope="col" className="py-3 px-4 text-start">{t('Role Tier', 'الدور')}</th>
                    <th scope="col" className="py-3 px-4 text-start">{t('Dealership Affiliation', 'الوكالة التابع لها')}</th>
                    <th scope="col" className="py-3 px-4 text-start">{t('Status', 'الحالة')}</th>
                    <th scope="col" className="py-3 px-4 text-start">{t('Created', 'تاريخ الإنشاء')}</th>
                    <th scope="col" className="py-3 px-4 text-end">{t('Actions', 'الإجراءات')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadError ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center">
                        <div role="alert" className="inline-flex flex-col items-center gap-2 text-red-300">
                          <span className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {loadError}
                          </span>
                          <button
                            type="button"
                            onClick={fetchUsers}
                            className="px-3 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-white text-xs"
                          >
                            {t('Retry', 'إعادة المحاولة')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : loading && users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-outline">
                        {t('Loading users…', 'جارٍ تحميل المستخدمين…')}
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-outline">
                        {t('No platform users matching criteria.', 'لا يوجد مستخدمون مطابقون.')}
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-surface-container-high/40 transition-colors cursor-pointer"
                        onClick={() => setSelectedUser(u)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-sans font-bold text-sm text-white flex items-center gap-2">
                              {u.displayName}
                              {u.isPlatformAdmin && (
                                <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/40 text-[10px] uppercase font-mono">
                                  {t('Admin', 'مشرف')}
                                </span>
                              )}
                              {isSelf(u) && (
                                <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-outline text-[10px] uppercase font-mono">
                                  {t('You', 'أنت')}
                                </span>
                              )}
                            </span>
                            <span className="text-gray-400 text-xs">{u.email || t('No email registered', 'لا يوجد بريد مسجل')}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {u.isPlatformAdmin ? (
                            <span className="text-primary font-bold">PLATFORM_ADMIN</span>
                          ) : u.memberships.length > 0 ? (
                            <span className="text-tertiary">
                              {u.memberships.map((m) => m.role).join(', ')}
                            </span>
                          ) : u.isBuyer ? (
                            <span className="text-gray-400">{t('BUYER (Retail)', 'مشترٍ (تجزئة)')}</span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {u.memberships.length > 0 ? (
                            <div className="flex flex-col">
                              {u.memberships.map((m) => (
                                <span key={m.tenantId} className="text-white">
                                  {m.tenantName}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : u.status === 'SUSPENDED' || u.status === 'PENDING_VERIFICATION'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-gray-400 text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Dubai' })}
                        </td>

                        <td className="py-3 px-4 text-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(u);
                            }}
                            className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-white text-xs"
                          >
                            {t('Manage', 'إدارة')}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-white/10 text-xs font-mono text-outline">
              <span>
                {t(
                  `${total} user${total === 1 ? '' : 's'} · page ${totalPages === 0 ? 0 : page} of ${totalPages}`,
                  `${total} مستخدم · الصفحة ${totalPages === 0 ? 0 : page} من ${totalPages}`,
                )}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={loading || page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-white flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <PrevIcon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t('Prev', 'السابق')}</span>
                </button>
                <button
                  type="button"
                  disabled={loading || page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-white flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>{t('Next', 'التالي')}</span>
                  <NextIcon className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* User Management Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('Identity dossier', 'ملف الهوية')}
            dir={isRtl ? 'rtl' : 'ltr'}
            className="w-full max-w-md bg-[#121824] border-l border-white/10 h-full p-6 flex flex-col justify-between overflow-y-auto"
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold font-heading text-white">{t('Identity Dossier', 'ملف الهوية')}</h2>
                </div>
                <button
                  type="button"
                  aria-label={t('Close identity dossier', 'إغلاق ملف الهوية')}
                  onClick={() => setSelectedUser(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Details */}
              <div className="space-y-4 text-xs font-mono">
                <div>
                  <span className="text-gray-400 block uppercase tracking-wider text-[10px]">{t('Display Name', 'الاسم المعروض')}</span>
                  <span className="text-white text-sm font-sans font-bold">{selectedUser.displayName}</span>
                </div>

                <div>
                  <span className="text-gray-400 block uppercase tracking-wider text-[10px]">{t('Email Address', 'البريد الإلكتروني')}</span>
                  <span className="text-white">{selectedUser.email || t('N/A', 'غير متوفر')}</span>
                </div>

                <div>
                  <span className="text-gray-400 block uppercase tracking-wider text-[10px]">UUID</span>
                  <span className="text-gray-400 text-[11px] select-all">{selectedUser.id}</span>
                </div>

                <div>
                  <span className="text-gray-400 block uppercase tracking-wider text-[10px]">{t('Current Status', 'الحالة الحالية')}</span>
                  <span
                    className={`inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-bold ${
                      selectedUser.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : selectedUser.status === 'SUSPENDED' || selectedUser.status === 'PENDING_VERIFICATION'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {selectedUser.status}
                  </span>
                </div>

                {selectedUser.memberships.length > 0 && (
                  <div className="pt-2">
                    <span className="text-gray-400 block uppercase tracking-wider text-[10px] mb-2">{t('Dealership Roles', 'أدوار الوكالة')}</span>
                    {selectedUser.memberships.map((m) => (
                      <div key={m.tenantId} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 mb-2">
                        <span className="text-white font-sans font-bold block">{m.tenantName}</span>
                        <div className="flex justify-between text-gray-400">
                          <span>{t('Role:', 'الدور:')}</span>
                          <span className="text-tertiary font-bold">{m.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-white/10 space-y-3">
              <span className="text-gray-400 block uppercase tracking-wider text-[10px] font-mono">
                {t('Administrative Mutations', 'الإجراءات الإدارية')}
              </span>

              {currentAdminState !== 'ok' ? (
                <p className="text-xs text-outline font-mono" role={currentAdminState === 'error' ? 'alert' : undefined}>
                  {currentAdminState === 'loading'
                    ? t('Confirming your administrator identity…', 'جارٍ التحقق من هويتك الإدارية…')
                    : t(
                        'Your administrator identity could not be confirmed, so account actions are hidden. Reload the page to retry.',
                        'تعذر التحقق من هويتك الإدارية، لذا أُخفيت إجراءات الحساب. أعد تحميل الصفحة للمحاولة مجدداً.',
                      )}
                </p>
              ) : isSelf(selectedUser) ? (
                <p className="text-xs text-outline font-mono">
                  {t(
                    'This is your own account. Suspend, disable and session revocation are not offered for the signed-in administrator.',
                    'هذا حسابك. لا تتوفر خيارات التعليق أو التعطيل أو إلغاء الجلسات للمشرف المسجّل دخوله.',
                  )}
                </p>
              ) : (
                <>
                  {selectedUser.status === 'ACTIVE' ? (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => openAction('SUSPENDED', selectedUser)}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>{t('Suspend User Account', 'تعليق حساب المستخدم')}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => openAction('ACTIVE', selectedUser)}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{t('Reactivate User Account', 'إعادة تفعيل حساب المستخدم')}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => openAction('REVOKE', selectedUser)}
                    className="w-full py-2.5 px-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('Revoke Active Sessions', 'إلغاء الجلسات النشطة')}</span>
                  </button>

                  {selectedUser.status !== 'DISABLED' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => openAction('DISABLED', selectedUser)}
                      className="w-full py-2.5 px-4 rounded-xl bg-red-950/40 hover:bg-red-950/60 border border-red-500/30 text-red-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <UserX className="w-4 h-4" />
                      <span>{t('Disable Account (Soft Delete)', 'تعطيل الحساب (حذف مبدئي)')}</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmReasonModal
        open={pendingAction !== null}
        title={pendingAction ? t(ACTION_COPY[pendingAction.kind].title, ACTION_COPY[pendingAction.kind].titleAr) : ''}
        description={
          pendingAction
            ? pendingAction.kind === 'REVOKE'
              ? t(
                  `${pendingAction.user.displayName} will be signed out of every device immediately.`,
                  `سيتم تسجيل خروج ${pendingAction.user.displayName} من جميع الأجهزة فوراً.`,
                )
              : t(
                  `${pendingAction.user.displayName} will be set to ${pendingAction.kind}.`,
                  `سيتم تعيين ${pendingAction.user.displayName} إلى ${pendingAction.kind}.`,
                )
            : ''
        }
        note={
          pendingAction?.kind === 'REVOKE'
            ? t(
                'The API audit-logs session revocation but does not yet store the reason text.',
                'تسجّل الواجهة إلغاء الجلسات في سجل التدقيق لكنها لا تحفظ نص السبب بعد.',
              )
            : undefined
        }
        confirmLabel={
          pendingAction ? t(ACTION_COPY[pendingAction.kind].confirm, ACTION_COPY[pendingAction.kind].confirmAr) : t('Confirm', 'تأكيد')
        }
        tone={pendingAction?.kind === 'ACTIVE' ? 'neutral' : pendingAction?.kind === 'SUSPENDED' ? 'warning' : 'danger'}
        busy={actionLoading}
        error={actionError}
        onCancel={() => setPendingAction(null)}
        onConfirm={runPendingAction}
      />
    </div>
  );
}
