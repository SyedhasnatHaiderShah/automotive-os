'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '../../components/AdminSidebar';
import { AdminHeader } from '../../components/AdminHeader';
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

const ACTION_COPY: Record<PendingAction['kind'], { title: string; confirm: string }> = {
  SUSPENDED: { title: 'Suspend this account?', confirm: 'Suspend account' },
  DISABLED: { title: 'Disable this account?', confirm: 'Disable account' },
  ACTIVE: { title: 'Reactivate this account?', confirm: 'Reactivate account' },
  REVOKE: { title: 'Revoke all active sessions?', confirm: 'Revoke sessions' },
};

export default function AdminUsersPage() {
  const [isRtl, setIsRtl] = useState(false);
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
    getCurrentAdmin()
      .then((me) => setCurrentAdminId(me.id))
      .catch(() => setCurrentAdminId(null));
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
        setLoadError(errorMessage(err, 'Users could not be loaded.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
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
        showToast('success', `API revoked ${data?.revokedCount ?? 0} active session(s) for ${user.displayName}.`);
      } else {
        await updateUserStatus(user.id, kind, reason);
        showToast('success', `API confirmed status ${kind} for ${user.displayName}.`);
        setSelectedUser((sel) => (sel && sel.id === user.id ? { ...sel, status: kind } : sel));
      }
      setPendingAction(null);
      fetchUsers();
    } catch (err) {
      setActionError(`Not saved: ${errorMessage(err, 'Operation failed')}`);
    } finally {
      setActionLoading(false);
    }
  };

  const isSelf = (u: UserItem | null) => Boolean(u && currentAdminId && u.id === currentAdminId);

  return (
    <div className={`min-h-screen bg-background font-body-md text-on-surface ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <AdminSidebar isRtl={isRtl} />
      <div className={isRtl ? 'pr-60' : 'pl-60'}>
        <AdminHeader isRtl={isRtl} onToggleRtl={() => setIsRtl(!isRtl)} />

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
              <span>Refresh Roster</span>
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
              <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by email, name, or phone..."
                aria-label="Search users by email, name, or phone"
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-container-lowest border border-white/10 text-xs text-white placeholder:text-gray-500 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs text-outline font-mono">Status:</span>
                <select
                  value={statusFilter}
                  aria-label="Filter by status"
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-surface-container-lowest border border-white/10 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="DISABLED">DISABLED</option>
                  <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-outline font-mono">Role:</span>
                <select
                  value={roleFilter}
                  aria-label="Filter by role"
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-surface-container-lowest border border-white/10 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">All Roles</option>
                  <option value="PLATFORM_ADMIN">Platform Admin</option>
                  <option value="OWNER">Dealer Owner</option>
                  <option value="ADMIN">Dealer Admin</option>
                  <option value="SALES_MANAGER">Sales Manager</option>
                  <option value="SALES_AGENT">Sales Agent</option>
                  <option value="BUYER">Retail Buyer</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-xl border border-surface-container-high/40 bg-surface-container-low overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-surface-container-lowest border-b border-white/10 text-outline uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">User Identity</th>
                    <th className="py-3 px-4">Role Tier</th>
                    <th className="py-3 px-4">Dealership Affiliation</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4 text-right">Actions</th>
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
                            Retry
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : loading && users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-outline">
                        Loading users…
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-outline">
                        No platform users matching criteria.
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
                                  Admin
                                </span>
                              )}
                              {isSelf(u) && (
                                <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-outline text-[10px] uppercase font-mono">
                                  You
                                </span>
                              )}
                            </span>
                            <span className="text-gray-400 text-xs">{u.email || 'No email registered'}</span>
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
                            <span className="text-gray-400">BUYER (Retail)</span>
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

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(u);
                            }}
                            className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-white text-xs"
                          >
                            Manage
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
                {total} user{total === 1 ? '' : 's'} · page {totalPages === 0 ? 0 : page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={loading || page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-white flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <button
                  type="button"
                  disabled={loading || page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-white flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
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
            aria-label="Identity dossier"
            className="w-full max-w-md bg-[#121824] border-l border-white/10 h-full p-6 flex flex-col justify-between overflow-y-auto"
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold font-heading text-white">Identity Dossier</h2>
                </div>
                <button
                  type="button"
                  aria-label="Close identity dossier"
                  onClick={() => setSelectedUser(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Details */}
              <div className="space-y-4 text-xs font-mono">
                <div>
                  <span className="text-gray-400 block uppercase tracking-wider text-[10px]">Display Name</span>
                  <span className="text-white text-sm font-sans font-bold">{selectedUser.displayName}</span>
                </div>

                <div>
                  <span className="text-gray-400 block uppercase tracking-wider text-[10px]">Email Address</span>
                  <span className="text-white">{selectedUser.email || 'N/A'}</span>
                </div>

                <div>
                  <span className="text-gray-400 block uppercase tracking-wider text-[10px]">UUID</span>
                  <span className="text-gray-400 text-[11px] select-all">{selectedUser.id}</span>
                </div>

                <div>
                  <span className="text-gray-400 block uppercase tracking-wider text-[10px]">Current Status</span>
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
                    <span className="text-gray-400 block uppercase tracking-wider text-[10px] mb-2">Dealership Roles</span>
                    {selectedUser.memberships.map((m) => (
                      <div key={m.tenantId} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 mb-2">
                        <span className="text-white font-sans font-bold block">{m.tenantName}</span>
                        <div className="flex justify-between text-gray-400">
                          <span>Role:</span>
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
                Administrative Mutations
              </span>

              {isSelf(selectedUser) ? (
                <p className="text-xs text-outline font-mono">
                  This is your own account. Suspend, disable and session revocation are not offered for the signed-in administrator.
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
                      <span>Suspend User Account</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => openAction('ACTIVE', selectedUser)}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Reactivate User Account</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => openAction('REVOKE', selectedUser)}
                    className="w-full py-2.5 px-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Revoke Active Sessions</span>
                  </button>

                  {selectedUser.status !== 'DISABLED' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => openAction('DISABLED', selectedUser)}
                      className="w-full py-2.5 px-4 rounded-xl bg-red-950/40 hover:bg-red-950/60 border border-red-500/30 text-red-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <UserX className="w-4 h-4" />
                      <span>Disable Account (Soft Delete)</span>
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
        title={pendingAction ? ACTION_COPY[pendingAction.kind].title : ''}
        description={
          pendingAction
            ? pendingAction.kind === 'REVOKE'
              ? `${pendingAction.user.displayName} will be signed out of every device immediately.`
              : `${pendingAction.user.displayName} will be set to ${pendingAction.kind}.`
            : ''
        }
        note={
          pendingAction?.kind === 'REVOKE'
            ? 'The API audit-logs session revocation but does not yet store the reason text.'
            : undefined
        }
        confirmLabel={pendingAction ? ACTION_COPY[pendingAction.kind].confirm : 'Confirm'}
        tone={pendingAction?.kind === 'ACTIVE' ? 'neutral' : pendingAction?.kind === 'SUSPENDED' ? 'warning' : 'danger'}
        busy={actionLoading}
        error={actionError}
        onCancel={() => setPendingAction(null)}
        onConfirm={runPendingAction}
      />
    </div>
  );
}
