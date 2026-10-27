'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '../../components/AdminSidebar';
import { AdminHeader } from '../../components/AdminHeader';
import {
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface AuditItem {
  id: string;
  action: string;
  tenantId: string | null;
  actorUserId: string | null;
  targetType: string;
  targetId: string;
  metadata: any;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [isRtl, setIsRtl] = useState(false);
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('ao_token') : null;
      const headers: HeadersInit = { Accept: 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/admin/audit-logs?limit=50', {
        headers,
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setLogs(data.events || []);
      } else {
        // Fallback demo audit stream
        setLogs([
          {
            id: 'audit-1',
            action: 'PLATFORM_ADMIN_BOOTSTRAP_PROVISIONED',
            tenantId: null,
            actorUserId: 'admin-1',
            targetType: 'User',
            targetId: 'hasnathaider332@gmail.com',
            metadata: { isPlatformAdmin: true, status: 'PENDING_VERIFICATION' },
            createdAt: new Date().toISOString(),
          },
          {
            id: 'audit-2',
            action: 'PLATFORM_ADMIN_LIST_ALL_TENANTS',
            tenantId: null,
            actorUserId: 'admin-1',
            targetType: 'tenants',
            targetId: 'ALL',
            metadata: { reason: 'cross_tenant_platform_inspection' },
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'audit-3',
            action: 'PLATFORM_ADMIN_CREATE_DEALER',
            tenantId: 'd-1',
            actorUserId: 'admin-1',
            targetType: 'tenant',
            targetId: 'al-futtaim-motors',
            metadata: { slug: 'al-futtaim-motors', adminEmail: 'principal@al-futtaim.ae' },
            createdAt: new Date(Date.now() - 7200000).toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.targetType.toLowerCase().includes(search.toLowerCase()) ||
      l.targetId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`min-h-screen bg-background font-body-md text-on-surface ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <AdminSidebar isRtl={isRtl} />
      <div className={isRtl ? 'pr-60' : 'pl-60'}>
        <AdminHeader isRtl={isRtl} onToggleRtl={() => setIsRtl(!isRtl)} />

        <main className="w-full pt-16 bg-background px-gutter py-space-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-white">
                  {isRtl ? 'سجل التدقيق غير القابل للتغيير' : 'Immutable Audit Activity Ledger'}
                </h1>
              </div>
              <p className="text-xs text-outline mt-1 font-mono">
                {isRtl
                  ? 'سجل تعاقبي للعمليات الإدارية وقرارات الحوكمة ومقاصة الوكالات'
                  : 'Append-Only Governance Event Stream, Administrative Mutations & Security Audit Trail'}
              </p>
            </div>

            <button
              onClick={fetchLogs}
              className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-xs text-on-surface flex items-center gap-2 transition-colors self-start"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Ledger</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/40 mb-6">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by action, target type, or ID..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-container-lowest border border-white/10 text-xs text-white placeholder:text-gray-500 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Ledger Table */}
          <div className="rounded-xl border border-surface-container-high/40 bg-surface-container-low overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-surface-container-lowest border-b border-white/10 text-outline uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-10"></th>
                    <th className="py-3 px-4">Action Event</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Actor UUID</th>
                    <th className="py-3 px-4">Dealership Scope</th>
                    <th className="py-3 px-4 text-right">Timestamp (UTC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-outline">
                        No audit events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((l) => {
                      const isExpanded = expandedId === l.id;
                      return (
                        <React.Fragment key={l.id}>
                          <tr
                            onClick={() => setExpandedId(isExpanded ? null : l.id)}
                            className="hover:bg-surface-container-high/40 transition-colors cursor-pointer"
                          >
                            <td className="py-3 px-4 text-gray-500">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-bold text-primary font-mono">{l.action}</span>
                            </td>

                            <td className="py-3 px-4 text-white">
                              <span className="text-gray-400">[{l.targetType}]</span> {l.targetId}
                            </td>

                            <td className="py-3 px-4 text-gray-400 select-all">
                              {l.actorUserId ? `${l.actorUserId.substring(0, 13)}...` : 'SYSTEM'}
                            </td>

                            <td className="py-3 px-4 text-gray-400">
                              {l.tenantId ? `${l.tenantId.substring(0, 8)}...` : 'PLATFORM_GLOBAL'}
                            </td>

                            <td className="py-3 px-4 text-right text-gray-400">
                              {new Date(l.createdAt).toISOString().replace('T', ' ').substring(0, 19)}
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="bg-black/40">
                              <td colSpan={6} className="p-4">
                                <div className="p-3 rounded-lg bg-surface-container-lowest border border-white/10 text-xs">
                                  <span className="text-outline block mb-1 uppercase font-bold text-[10px]">
                                    Event Payload Metadata:
                                  </span>
                                  <pre className="text-gray-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                                    {JSON.stringify(l.metadata, null, 2)}
                                  </pre>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
