'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '../../components/AdminSidebar';
import { AdminHeader } from '../../components/AdminHeader';
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
} from 'lucide-react';

interface UserItem {
  id: string;
  email: string | null;
  displayName: string;
  phoneE164: string | null;
  isPlatformAdmin: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED' | 'PENDING_VERIFICATION';
  createdAt: string;
  updatedAt: string;
  emailVerifiedAt: string | null;
  memberships: Array<{
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    role: string;
    active: boolean;
  }>;
  isBuyer: boolean;
}

export default function AdminUsersPage() {
  const [isRtl, setIsRtl] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('ao_token') : null;
      const headers: HeadersInit = { Accept: 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (roleFilter !== 'ALL') params.set('role', roleFilter);

      const res = await fetch(`/api/v1/admin/users?${params.toString()}`, {
        headers,
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        // Fallback demo users if unauthenticated preview
        setUsers([
          {
            id: 'admin-1',
            email: 'hasnathaider332@gmail.com',
            displayName: 'Hasnat Haider (Principal)',
            phoneE164: '+971501234567',
            isPlatformAdmin: true,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            emailVerifiedAt: new Date().toISOString(),
            memberships: [],
            isBuyer: false,
          },
          {
            id: 'admin-2',
            email: 'hasnatshah230@gmail.com',
            displayName: 'Hasnat Shah (Security Admin)',
            phoneE164: '+971509876543',
            isPlatformAdmin: true,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            emailVerifiedAt: new Date().toISOString(),
            memberships: [],
            isBuyer: false,
          },
          {
            id: 'dealer-1',
            email: 'principal@al-futtaim.ae',
            displayName: 'Tariq Al Futtaim',
            phoneE164: '+97142085000',
            isPlatformAdmin: false,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            emailVerifiedAt: new Date().toISOString(),
            memberships: [
              {
                tenantId: 'tenant-1',
                tenantName: 'Al-Futtaim Motors Dubai',
                tenantSlug: 'al-futtaim-motors',
                role: 'OWNER',
                active: true,
              },
            ],
            isBuyer: false,
          },
          {
            id: 'buyer-1',
            email: 'collector@sovereign.ae',
            displayName: 'Sheikh Mansoor Al-Ketbi',
            phoneE164: '+971505551234',
            isPlatformAdmin: false,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            emailVerifiedAt: new Date().toISOString(),
            memberships: [],
            isBuyer: true,
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, statusFilter, roleFilter]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleUpdateStatus = async (userId: string, newStatus: 'ACTIVE' | 'SUSPENDED' | 'DISABLED') => {
    setActionLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('ao_token') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || data?.error?.message || 'Failed to update user status');
      }

      showToast('success', `User status updated to ${newStatus}`);
      fetchUsers();
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, status: newStatus });
      }
    } catch (err: any) {
      showToast('error', err.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeSessions = async (userId: string) => {
    setActionLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('ao_token') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/admin/users/${userId}/revoke-sessions`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Failed to revoke sessions');
      }

      showToast('success', `Terminated ${data.revokedCount ?? 0} active user session(s)`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to revoke sessions');
    } finally {
      setActionLoading(false);
    }
  };

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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email, name, or phone..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-container-lowest border border-white/10 text-xs text-white placeholder:text-gray-500 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs text-outline font-mono">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-surface-container-lowest border border-white/10 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="DISABLED">DISABLED</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-outline font-mono">Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
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
                  {users.length === 0 ? (
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
                          ) : (
                            <span className="text-gray-400">BUYER (Retail)</span>
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
                                : u.status === 'SUSPENDED'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-gray-400 text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString('en-GB')}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
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
          </div>
        </main>
      </div>

      {/* User Management Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121824] border-l border-white/10 h-full p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold font-heading text-white">Identity Dossier</h2>
                </div>
                <button
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
                        : selectedUser.status === 'SUSPENDED'
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

              {selectedUser.status === 'ACTIVE' ? (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedUser.id, 'SUSPENDED')}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Suspend User Account</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedUser.id, 'ACTIVE')}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Reactivate User Account</span>
                </button>
              )}

              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleRevokeSessions(selectedUser.id)}
                className="w-full py-2.5 px-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Revoke Active Sessions</span>
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleUpdateStatus(selectedUser.id, 'DISABLED')}
                className="w-full py-2.5 px-4 rounded-xl bg-red-950/40 hover:bg-red-950/60 border border-red-500/30 text-red-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <UserX className="w-4 h-4" />
                <span>Permanently Disable (Soft Delete)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
