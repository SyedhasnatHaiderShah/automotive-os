'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '../../components/AdminSidebar';
import { AdminHeader } from '../../components/AdminHeader';
import {
  Building2,
  Search,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserPlus,
  X,
  Copy,
  Check,
} from 'lucide-react';
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

type DealerItem = AdminTenantSummary;

export default function AdminDealersPage() {
  const [isRtl, setIsRtl] = useState(false);
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

  const fetchDealers = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listTenants();
      setDealers(Array.isArray(data) ? data : []);
    } catch (err) {
      setDealers([]);
      setLoadError(errorMessage(err, 'Dealerships could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreateDealer = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const data = await createDealer({
        slug: newSlug.trim().toLowerCase(),
        legalName: newLegalName.trim(),
        displayName: newDisplayName.trim(),
        adminEmail: newAdminEmail.trim().toLowerCase(),
        adminName: newAdminName.trim(),
      });

      showToast('success', `API created dealership '${data?.displayName ?? newDisplayName.trim()}'.`);
      setShowCreateModal(false);
      setNewSlug('');
      setNewLegalName('');
      setNewDisplayName('');
      setNewAdminEmail('');
      setNewAdminName('');
      fetchDealers();
    } catch (err) {
      showToast('error', `Not created: ${errorMessage(err, 'Dealership creation failed')}`);
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
      showToast('success', `API confirmed ${dealer.displayName} is now ${nextStatus}.`);
      setPendingStatus(null);
      fetchDealers();
    } catch (err) {
      setStatusError(`Not saved: ${errorMessage(err, 'Status update failed')}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showInviteModal) return;
    setActionLoading(true);
    try {
      const data = await inviteDealerStaff(showInviteModal, {
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });

      if (!data?.activationToken) {
        throw new Error('The API did not return an activation token.');
      }
      const activationLink = `${window.location.origin}/auth/activate?token=${encodeURIComponent(data.activationToken)}`;
      setGeneratedTokenUrl(activationLink);
      showToast('success', 'API issued the invitation token.');
    } catch (err) {
      showToast('error', `Invitation not issued: ${errorMessage(err, 'Invitation failed')}`);
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
                onClick={fetchDealers}
                className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-xs text-on-surface flex items-center gap-2 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-[#b39129] text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
              >
                <Plus className="w-4 h-4" />
                <span>Provision Dealership</span>
              </button>
            </div>
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

          {/* Search bar */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/40 mb-6">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dealerships by name or slug..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-container-lowest border border-white/10 text-xs text-white placeholder:text-gray-500 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Dealerships Table */}
          <div className="rounded-xl border border-surface-container-high/40 bg-surface-container-low overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-surface-container-lowest border-b border-white/10 text-outline uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Dealership Entity</th>
                    <th className="py-3 px-4">Slug Identifier</th>
                    <th className="py-3 px-4">KYB Accreditation</th>
                    <th className="py-3 px-4">Staff Count</th>
                    <th className="py-3 px-4">Inventory Size</th>
                    <th className="py-3 px-4">Operational Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadError ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center">
                        <div role="alert" className="inline-flex flex-col items-center gap-2 text-red-300">
                          <span className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {loadError}
                          </span>
                          <button
                            type="button"
                            onClick={fetchDealers}
                            className="px-3 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-white text-xs"
                          >
                            Retry
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : loading && dealers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-outline">
                        Loading dealerships…
                      </td>
                    </tr>
                  ) : filteredDealers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-outline">
                        No dealerships found matching criteria.
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

                        <td className="py-3 px-4 text-primary">/{d.slug}</td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/30">
                            <ShieldCheck className="w-3 h-3" />
                            <span>{d.verificationStatus}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-white">{d.staffCount} Staff</td>

                        <td className="py-3 px-4 text-white">{d.vehicleCount} Vehicles</td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              d.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setShowInviteModal(d.id);
                                setGeneratedTokenUrl(null);
                              }}
                              className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-white text-xs flex items-center gap-1"
                              title="Invite Dealer Employee"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Invite</span>
                            </button>

                            <button
                              disabled={actionLoading}
                              onClick={() => {
                                setStatusError(null);
                                setPendingStatus({ dealer: d, nextStatus: d.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' });
                              }}
                              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                                d.status === 'ACTIVE'
                                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
                              }`}
                            >
                              {d.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="px-4 py-3 border-t border-white/10 text-[11px] font-mono text-outline">
              {dealers.length} dealership{dealers.length === 1 ? '' : 's'} loaded. The tenants API returns the full list without server-side pagination; search filters this page locally.
            </p>
          </div>
        </main>
      </div>

      {/* Provision Dealership Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#121824] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold font-heading text-white">Provision New Dealership</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDealer} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-gray-400 mb-1">Dealership Slug (URL Identifier)</label>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="e.g. example-motors"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Legal Registered Entity Name</label>
                <input
                  type="text"
                  value={newLegalName}
                  onChange={(e) => setNewLegalName(e.target.value)}
                  placeholder="e.g. Example Motors Trading LLC"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Customer Display Name</label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Example Motors Dubai"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:border-primary focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-white/10">
                <span className="text-primary font-bold block mb-2">Initial Dealer Principal Assignment</span>
                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-400 mb-1">Principal Contact Name</label>
                    <input
                      type="text"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="e.g. Principal full name"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Principal Email Address</label>
                    <input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="e.g. principal@example.com"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-primary text-black font-bold disabled:opacity-50"
                >
                  {actionLoading ? 'Provisioning...' : 'Confirm Provisioning'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Staff Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121824] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold font-heading text-white">Issue Staff Invitation</h2>
              </div>
              <button onClick={() => setShowInviteModal(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {generatedTokenUrl ? (
              <div className="space-y-4 text-xs font-mono">
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200">
                  <span className="font-bold block mb-1">Cryptographic Token Generated!</span>
                  <span>Share this single-use activation link with the employee (expires in 48 hours):</span>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-white/10 break-all select-all text-gray-300 text-[11px]">
                  {generatedTokenUrl}
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedTokenUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="w-full py-2 px-4 rounded-lg bg-primary text-black font-bold flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Activation Link'}</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleInviteStaff} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-gray-400 mb-1">Staff Member Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="agent@example.com"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Assigned Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none"
                  >
                    <option value="SALES_AGENT">SALES_AGENT (Sales Pipeline & Enquiries)</option>
                    <option value="SALES_MANAGER">SALES_MANAGER (Approval & Offers)</option>
                    <option value="INVENTORY_MANAGER">INVENTORY_MANAGER (Stock & Media)</option>
                    <option value="SERVICE_ADVISOR">SERVICE_ADVISOR (Service & Bookings)</option>
                    <option value="FINANCE_MANAGER">FINANCE_MANAGER (Escrow & Settlement)</option>
                    <option value="ADMIN">ADMIN (Dealership Operational Admin)</option>
                    <option value="VIEWER">VIEWER (Read-Only Reports)</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(null)}
                    className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-lg bg-primary text-black font-bold disabled:opacity-50"
                  >
                    {actionLoading ? 'Issuing...' : 'Generate Invitation Token'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <ConfirmReasonModal
        open={pendingStatus !== null}
        title={pendingStatus?.nextStatus === 'SUSPENDED' ? 'Suspend this dealership?' : 'Reactivate this dealership?'}
        description={
          pendingStatus
            ? pendingStatus.nextStatus === 'SUSPENDED'
              ? `${pendingStatus.dealer.displayName} will be suspended. The API unpublishes its active listings.`
              : `${pendingStatus.dealer.displayName} will be set to ACTIVE.`
            : ''
        }
        confirmLabel={pendingStatus?.nextStatus === 'SUSPENDED' ? 'Suspend dealership' : 'Reactivate dealership'}
        tone={pendingStatus?.nextStatus === 'SUSPENDED' ? 'danger' : 'neutral'}
        busy={actionLoading}
        error={statusError}
        onCancel={() => setPendingStatus(null)}
        onConfirm={handleConfirmStatusChange}
      />
    </div>
  );
}
