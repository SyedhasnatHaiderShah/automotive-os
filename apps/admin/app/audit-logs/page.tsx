'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '../../components/AdminSidebar';
import { AdminHeader } from '../../components/AdminHeader';
import {
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';
import { AuditEvent, errorMessage, listAuditLogs } from '../../lib/api';

const PAGE_SIZE = 50;

type AuditItem = AuditEvent;

export default function AdminAuditLogsPage() {
  const [isRtl, setIsRtl] = useState(false);
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [targetType, setTargetType] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    listAuditLogs({ limit: PAGE_SIZE, offset, targetType: targetType.trim() || undefined })
      .then((data) => {
        if (!active) return;
        setLogs(Array.isArray(data?.events) ? data.events : []);
        setTotal(data?.total ?? 0);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setLogs([]);
        setTotal(0);
        setLoadError(errorMessage(err, 'Audit events could not be loaded.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [offset, targetType, reloadKey]);

  const fetchLogs = () => setReloadKey((k) => k + 1);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.targetType.toLowerCase().includes(search.toLowerCase()) ||
      (l.targetId || '').toLowerCase().includes(search.toLowerCase())
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
              type="button"
              onClick={fetchLogs}
              className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-xs text-on-surface flex items-center gap-2 transition-colors self-start"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Ledger</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/40 mb-6 flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter this page by action, target type, or ID..."
                aria-label="Filter loaded audit events"
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-container-lowest border border-white/10 text-xs text-white placeholder:text-gray-500 focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-outline font-mono">Target type:</span>
              <input
                type="text"
                defaultValue={targetType}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setTargetType((e.target as HTMLInputElement).value);
                    setOffset(0);
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value !== targetType) {
                    setTargetType(e.target.value);
                    setOffset(0);
                  }
                }}
                placeholder="e.g. tenant (server filter)"
                aria-label="Filter by target type on the server"
                className="w-48 px-3 py-2 rounded-lg bg-surface-container-lowest border border-white/10 text-xs text-white placeholder:text-gray-500 focus:border-primary focus:outline-none"
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
                            onClick={fetchLogs}
                            className="px-3 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-white text-xs"
                          >
                            Retry
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : loading && logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-outline">
                        Loading audit events…
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
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
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-white/10 text-xs font-mono text-outline">
              <span>
                {total === 0 ? '0 events' : `Events ${offset + 1}–${Math.min(offset + PAGE_SIZE, total)} of ${total}`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={loading || offset === 0}
                  onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                  className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-white flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <button
                  type="button"
                  disabled={loading || offset + PAGE_SIZE >= total}
                  onClick={() => setOffset((o) => o + PAGE_SIZE)}
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
    </div>
  );
}
