'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Save, Loader2 } from 'lucide-react';
import {
  AccountSettings,
  updateAccountSettingsApi,
  logoutApi,
} from '../lib/api';
import { BuyerAuthRequiredError } from '../lib/buyer-api-client';
import { AccountShell, AccountCard, StatusMessage, formatDubai, useAccountLocale } from './account-shell';

interface AccountSettingsViewProps {
  initialSettings: AccountSettings;
}

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-[#0a0e13] border border-[#31353b] text-[#e0e2ea] text-sm placeholder:text-[#99907c] focus:outline-none focus:border-[#f2ca50] focus-visible:ring-2 focus-visible:ring-[#f2ca50]/40';

export function AccountSettingsView({ initialSettings }: AccountSettingsViewProps) {
  return (
    <AccountShell
      displayName={initialSettings.displayName}
      title="Account settings"
      titleAr="إعدادات الحساب"
      subtitle="Details stored on your Automotive OS account."
      subtitleAr="البيانات المحفوظة في حسابك."
    >
      <SettingsBody initialSettings={initialSettings} />
    </AccountShell>
  );
}

function SettingsBody({ initialSettings }: AccountSettingsViewProps) {
  const { isArabic } = useAccountLocale();
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [displayName, setDisplayName] = useState(initialSettings.displayName);
  const [affiliation, setAffiliation] = useState(initialSettings.affiliation ?? '');
  const [currency, setCurrency] = useState(initialSettings.settlementCurrency || 'AED');
  const [whatsappComms, setWhatsappComms] = useState(initialSettings.whatsappCommsConsent);
  const [garageVisibility, setGarageVisibility] = useState(initialSettings.garageVisibility);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const goToLogin = () =>
    router.push(`/auth?tab=login&redirect=${encodeURIComponent('/account/settings')}`);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveResult(null);
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setSaveResult({ kind: 'error', text: isArabic ? 'الاسم المعروض مطلوب.' : 'Display name is required.' });
      return;
    }
    setSaving(true);
    try {
      const updated = await updateAccountSettingsApi({
        handle: trimmedName !== settings.displayName ? trimmedName : undefined,
        affiliation: affiliation.trim() !== (settings.affiliation ?? '') ? affiliation.trim() : undefined,
        settlementCurrency: currency,
        whatsappComms,
        garageVisibility,
      });
      setSettings(updated);
      setDisplayName(updated.displayName);
      setSaveResult({ kind: 'success', text: isArabic ? 'تم حفظ الإعدادات.' : 'Settings saved.' });
    } catch (err) {
      if (err instanceof BuyerAuthRequiredError) return goToLogin();
      setSaveResult({
        kind: 'error',
        text: err instanceof Error ? err.message : isArabic ? 'تعذر الحفظ.' : 'Could not save settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    setSignOutError(null);
    try {
      await logoutApi();
      router.push('/auth?tab=login');
    } catch (err) {
      if (err instanceof BuyerAuthRequiredError) return goToLogin();
      setSignOutError(err instanceof Error ? err.message : 'Sign-out failed.');
      setSigningOut(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <AccountCard className="lg:col-span-2" aria-labelledby="settings-general">
        <h2 id="settings-general" className="text-lg font-bold text-[#e0e2ea] mb-1">
          {isArabic ? 'المعلومات العامة' : 'General'}
        </h2>
        <p className="text-xs text-[#99907c] mb-6">
          {isArabic ? 'آخر تحديث' : 'Last updated'}: {formatDubai(settings.updatedAt)}
        </p>

        <form onSubmit={handleSave} className="flex flex-col gap-5" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="displayName" className="text-xs font-semibold uppercase tracking-wider text-[#d0c5af]">
                {isArabic ? 'الاسم المعروض' : 'Display name'}
              </label>
              <input
                id="displayName"
                className={inputClass}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="affiliation" className="text-xs font-semibold uppercase tracking-wider text-[#d0c5af]">
                {isArabic ? 'الجهة (اختياري)' : 'Company (optional)'}
              </label>
              <input
                id="affiliation"
                className={inputClass}
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                autoComplete="organization"
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#d0c5af]">
                {isArabic ? 'البريد الإلكتروني' : 'Email'}
              </span>
              <p className="px-4 py-3 rounded-xl bg-[#0a0e13]/60 border border-[#262a30] text-sm text-[#d0c5af]">
                {settings.email || '—'}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="currency" className="text-xs font-semibold uppercase tracking-wider text-[#d0c5af]">
                {isArabic ? 'عملة العرض' : 'Preferred currency'}
              </label>
              <select
                id="currency"
                className={inputClass}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="AED">AED</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <fieldset className="flex flex-col gap-3 pt-2">
            <legend className="text-xs font-semibold uppercase tracking-wider text-[#d0c5af] mb-2">
              {isArabic ? 'التفضيلات' : 'Preferences'}
            </legend>
            <label className="flex items-start gap-3 p-4 rounded-xl bg-[#0a0e13]/60 border border-[#262a30] cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 accent-[#f2ca50] w-4 h-4"
                checked={whatsappComms}
                onChange={(e) => setWhatsappComms(e.target.checked)}
              />
              <span className="text-sm text-[#e0e2ea]">
                {isArabic ? 'أوافق على تلقي الرسائل عبر واتساب' : 'I agree to receive messages on WhatsApp'}
              </span>
            </label>
            <label className="flex items-start gap-3 p-4 rounded-xl bg-[#0a0e13]/60 border border-[#262a30] cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 accent-[#f2ca50] w-4 h-4"
                checked={garageVisibility}
                onChange={(e) => setGarageVisibility(e.target.checked)}
              />
              <span className="text-sm text-[#e0e2ea]">
                {isArabic ? 'إظهار مرآبي في ملفي' : 'Show my garage on my profile'}
              </span>
            </label>
          </fieldset>

          {saveResult && <StatusMessage kind={saveResult.kind}>{saveResult.text}</StatusMessage>}

          <div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#f2ca50] text-[#241a00] font-bold text-sm uppercase tracking-wider hover:bg-[#e9c349] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101419] focus-visible:ring-[#f2ca50]"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
              {isArabic ? 'حفظ التغييرات' : 'Save changes'}
            </button>
          </div>
        </form>
      </AccountCard>

      <AccountCard aria-labelledby="settings-session">
        <h2 id="settings-session" className="text-lg font-bold text-[#e0e2ea] mb-2">
          {isArabic ? 'الجلسة' : 'Session'}
        </h2>
        <p className="text-sm text-[#d0c5af] mb-5">
          {isArabic
            ? 'تسجيل الخروج من هذه الجلسة وإبطالها.'
            : 'Sign out and revoke this session on the server.'}
        </p>
        {signOutError && (
          <div className="mb-4">
            <StatusMessage kind="error">{signOutError}</StatusMessage>
          </div>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#ffb4ab]/50 text-[#ffb4ab] text-sm font-semibold hover:bg-[#93000a]/20 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb4ab]"
        >
          {signingOut ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <LogOut className="w-4 h-4" aria-hidden="true" />}
          {isArabic ? 'تسجيل الخروج' : 'Sign out'}
        </button>
        <p className="text-xs text-[#99907c] mt-6">
          {isArabic
            ? 'تصدير البيانات وإلغاء تفعيل الحساب غير متاحين بعد. تواصل مع الدعم لهذه الطلبات.'
            : 'Data export and account deactivation are not available yet. Contact support for these requests.'}
        </p>
      </AccountCard>
    </div>
  );
}
