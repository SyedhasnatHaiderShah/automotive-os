'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Fingerprint, Loader2, Save, ShieldCheck } from 'lucide-react';
import { BuyerProfileData, revokeBuyerEnquiryGrant, updateBuyerProfileApi } from '../lib/api';
import { BuyerAuthRequiredError } from '../lib/buyer-api-client';
import { AccountShell, AccountCard, StatusMessage, formatDubai, useAccountLocale } from './account-shell';

interface BuyerProfileViewProps {
  initialProfile: BuyerProfileData;
}

const EMIRATES = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-[#0a0e13] border border-[#31353b] text-[#e0e2ea] text-sm placeholder:text-[#99907c] focus:outline-none focus:border-[#f2ca50] focus-visible:ring-2 focus-visible:ring-[#f2ca50]/40';

const filsToAedInput = (fils: number | null) => (fils != null && fils > 0 ? String(Math.round(fils / 100)) : '');

export function BuyerProfileView({ initialProfile }: BuyerProfileViewProps) {
  return (
    <AccountShell
      displayName={initialProfile.displayName}
      title="Profile & privacy"
      titleAr="الملف الشخصي والخصوصية"
      subtitle="Your buying preferences and the contact details you have shared with dealers."
      subtitleAr="تفضيلات الشراء والبيانات التي شاركتها مع الوكلاء."
    >
      <ProfileBody initialProfile={initialProfile} />
    </AccountShell>
  );
}

function ProfileBody({ initialProfile }: BuyerProfileViewProps) {
  const { isArabic } = useAccountLocale();
  const router = useRouter();
  const [language, setLanguage] = useState(initialProfile.preferredLanguage || 'en');
  const [emirate, setEmirate] = useState(initialProfile.preferredEmirate || '');
  const [budgetMin, setBudgetMin] = useState(filsToAedInput(initialProfile.budgetMinFils));
  const [budgetMax, setBudgetMax] = useState(filsToAedInput(initialProfile.budgetMaxFils));
  const [makes, setMakes] = useState(initialProfile.preferredMakes.join(', '));
  const [grants, setGrants] = useState(initialProfile.grants);
  const [saving, setSaving] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [grantMessage, setGrantMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const toLogin = () => router.push(`/auth?tab=login&redirect=${encodeURIComponent('/account/profile')}`);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const minAed = budgetMin.trim() === '' ? undefined : Number(budgetMin);
    const maxAed = budgetMax.trim() === '' ? undefined : Number(budgetMax);
    if (
      (minAed !== undefined && (!Number.isInteger(minAed) || minAed < 0)) ||
      (maxAed !== undefined && (!Number.isInteger(maxAed) || maxAed < 0))
    ) {
      setMessage({ kind: 'error', text: isArabic ? 'أدخل ميزانية صحيحة بالدرهم.' : 'Enter budgets as whole AED amounts.' });
      return;
    }
    if (minAed !== undefined && maxAed !== undefined && minAed > maxAed) {
      setMessage({ kind: 'error', text: isArabic ? 'الحد الأدنى أكبر من الحد الأقصى.' : 'Minimum budget is above maximum.' });
      return;
    }
    setSaving(true);
    try {
      await updateBuyerProfileApi({
        preferredLanguage: language,
        preferredEmirate: emirate || undefined,
        budgetMinFils: minAed !== undefined ? minAed * 100 : undefined,
        budgetMaxFils: maxAed !== undefined ? maxAed * 100 : undefined,
        preferredMakes: makes
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean),
      });
      setMessage({ kind: 'success', text: isArabic ? 'تم حفظ التفضيلات.' : 'Preferences saved.' });
    } catch (err) {
      if (err instanceof BuyerAuthRequiredError) return toLogin();
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (leadId: string) => {
    setRevokingId(leadId);
    setGrantMessage(null);
    try {
      await revokeBuyerEnquiryGrant(leadId);
      const now = new Date().toISOString();
      setGrants((prev) => prev.map((g) => (g.leadId === leadId ? { ...g, revokedAt: now } : g)));
      setGrantMessage({ kind: 'success', text: isArabic ? 'تم سحب الصلاحية.' : 'Dealer access revoked.' });
    } catch (err) {
      if (err instanceof BuyerAuthRequiredError) return toLogin();
      setGrantMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Revoke failed.' });
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <AccountCard className="lg:col-span-2" aria-labelledby="prefs-title">
        <h2 id="prefs-title" className="text-lg font-bold text-[#e0e2ea] mb-1">
          {isArabic ? 'تفضيلات الشراء' : 'Buying preferences'}
        </h2>
        <p className="text-sm text-[#d0c5af] mb-6">
          {initialProfile.displayName}
          {initialProfile.email ? ` · ${initialProfile.email}` : ''}
        </p>
        <form onSubmit={handleSave} className="flex flex-col gap-5" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="pref-lang" className="text-xs font-semibold uppercase tracking-wider text-[#d0c5af]">
                {isArabic ? 'اللغة المفضلة' : 'Preferred language'}
              </label>
              <select id="pref-lang" className={inputClass} value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="pref-emirate" className="text-xs font-semibold uppercase tracking-wider text-[#d0c5af]">
                {isArabic ? 'الإمارة المفضلة' : 'Preferred emirate'}
              </label>
              <select id="pref-emirate" className={inputClass} value={emirate} onChange={(e) => setEmirate(e.target.value)}>
                <option value="">{isArabic ? 'غير محدد' : 'Not set'}</option>
                {EMIRATES.map((em) => (
                  <option key={em} value={em}>
                    {em}
                  </option>
                ))}
                {emirate && !EMIRATES.includes(emirate) && <option value={emirate}>{emirate}</option>}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="budget-min" className="text-xs font-semibold uppercase tracking-wider text-[#d0c5af]">
                {isArabic ? 'الحد الأدنى للميزانية (درهم)' : 'Minimum budget (AED)'}
              </label>
              <input
                id="budget-min"
                inputMode="numeric"
                className={inputClass}
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value.replace(/[^\d]/g, ''))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="budget-max" className="text-xs font-semibold uppercase tracking-wider text-[#d0c5af]">
                {isArabic ? 'الحد الأقصى للميزانية (درهم)' : 'Maximum budget (AED)'}
              </label>
              <input
                id="budget-max"
                inputMode="numeric"
                className={inputClass}
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value.replace(/[^\d]/g, ''))}
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label htmlFor="pref-makes" className="text-xs font-semibold uppercase tracking-wider text-[#d0c5af]">
                {isArabic ? 'العلامات المفضلة (مفصولة بفواصل)' : 'Preferred makes (comma separated)'}
              </label>
              <input id="pref-makes" className={inputClass} value={makes} onChange={(e) => setMakes(e.target.value)} />
            </div>
          </div>
          {message && <StatusMessage kind={message.kind}>{message.text}</StatusMessage>}
          <div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#f2ca50] text-[#241a00] font-bold text-sm uppercase tracking-wider hover:bg-[#e9c349] disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101419] focus-visible:ring-[#f2ca50]"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
              {isArabic ? 'حفظ' : 'Save preferences'}
            </button>
          </div>
        </form>
      </AccountCard>

      <div className="flex flex-col gap-6">
        <AccountCard aria-labelledby="identity-title">
          <h2 id="identity-title" className="text-lg font-bold text-[#e0e2ea] mb-2 flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-[#f2ca50]" aria-hidden="true" />
            {isArabic ? 'التحقق من الهوية' : 'Identity verification'}
          </h2>
          <p className="text-sm text-[#99907c] mb-4">
            {isArabic ? 'ربط الهوية الرقمية الإماراتية غير متاح بعد.' : 'UAE PASS connection is not available yet.'}
          </p>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="px-4 py-2 rounded-lg border border-[#31353b] text-[#99907c] text-xs font-semibold cursor-not-allowed"
          >
            {isArabic ? 'ربط UAE PASS — قريبًا' : 'Connect UAE PASS — Not available yet'}
          </button>
        </AccountCard>

        <AccountCard aria-labelledby="grants-title">
          <h2 id="grants-title" className="text-lg font-bold text-[#e0e2ea] mb-2 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#f2ca50]" aria-hidden="true" />
            {isArabic ? 'البيانات المشاركة' : 'Shared contact details'}
          </h2>
          {grantMessage && (
            <div className="mb-3">
              <StatusMessage kind={grantMessage.kind}>{grantMessage.text}</StatusMessage>
            </div>
          )}
          {grants.length === 0 ? (
            <p className="text-sm text-[#99907c]">
              {isArabic ? 'لم تشارك أي بيانات مع الوكلاء.' : 'You have not shared details with any dealer.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {grants.map((g) => (
                <li key={g.leadId} className="p-3 rounded-xl bg-[#0a0e13]/60 border border-[#262a30] flex flex-col gap-2">
                  <span className="text-sm font-semibold text-[#e0e2ea]">{g.dealershipName || '—'}</span>
                  <span className="text-xs text-[#d0c5af]">{g.listingTitle}</span>
                  <span className="text-xs text-[#99907c]">{g.fieldsGranted.join(', ') || '—'}</span>
                  <span className="text-[11px] font-mono text-[#99907c]">
                    {g.revokedAt
                      ? `${isArabic ? 'مسحوبة' : 'Revoked'} ${formatDubai(g.revokedAt)}`
                      : `${isArabic ? 'ممنوحة' : 'Granted'} ${formatDubai(g.grantedAt)}`}
                  </span>
                  {!g.revokedAt && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(g.leadId)}
                      disabled={revokingId === g.leadId}
                      className="self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#ffb4ab]/50 text-[#ffb4ab] text-xs font-semibold hover:bg-[#93000a]/20 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb4ab]"
                    >
                      {revokingId === g.leadId && <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />}
                      {isArabic ? 'سحب' : 'Revoke'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </AccountCard>
      </div>
    </div>
  );
}
