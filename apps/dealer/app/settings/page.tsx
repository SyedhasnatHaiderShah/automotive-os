import React from 'react';
import type { Metadata } from 'next';
import { getDealerSession } from '../../lib/session';
import { fetchTenantContext } from '../../lib/dealer-api-server';
import { formatUtcDate, humanizeEnum } from '../../lib/dealer-api';
import { DealerServiceError } from '../../components/dealer-service-error';
import { DealerShell } from '../../components/dealer-shell';
import { dealerStrings } from '../../lib/i18n';
import { getDealerLocale } from '../../lib/locale-server';

export const metadata: Metadata = {
  title: 'Dealership Settings | Automotive OS Dealer DMS',
  description: 'Dealership profile, verification and branches.',
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-label-caps text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">{label}</dt>
      <dd className="text-sm text-on-surface break-words">{value}</dd>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-2xl bg-surface-container-low border border-white/[0.07] p-5 shadow-xl">
      <h2 id={id} className="mb-4 text-base font-semibold text-on-surface">{title}</h2>
      {children}
    </section>
  );
}

export default async function DealerSettingsPage() {
  const locale = await getDealerLocale();
  const t = dealerStrings(locale);
  try {
    const session = await getDealerSession();
    const context = await fetchTenantContext(session.tenantId, session.token);
    const verification = context.verification;

    return (
      <DealerShell
        identity={{
          tenantName: session.tenantName,
          displayName: session.displayName,
          role: session.role,
          hasMultipleTenants: session.hasMultipleTenants,
        }}
        locale={locale}
      >
        <div className="relative w-full overflow-hidden rounded-2xl bg-surface-container-lowest p-6 mb-6 mt-4 shadow-xl border border-white/[0.05]">
          <div className="absolute -end-20 -top-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-1">
            <span className="font-label-caps text-xs uppercase text-primary tracking-widest font-bold">{context.displayName}</span>
            <h1 className="font-headline-lg text-xl sm:text-2xl font-bold text-on-surface tracking-tight">{t.navSettings}</h1>
            <p className="text-sm text-on-surface-variant">{t.settingsReadOnly}</p>
          </div>
        </div>

        <div className="flex flex-col gap-5 mb-8">
          <Section id="settings-profile" title={t.settingsProfile}>
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label={t.settingsDisplayName} value={context.displayName} />
              <Field label={t.settingsLegalName} value={context.legalName} />
              <Field label={t.settingsSlug} value={<span dir="ltr">{context.slug}</span>} />
              <Field label={t.settingsStatus} value={humanizeEnum(context.status)} />
              <Field label={t.settingsCountry} value={context.country ?? t.settingsNotProvided} />
              <Field label={t.settingsCurrency} value={context.currency ?? t.settingsNotProvided} />
            </dl>
          </Section>

          <Section id="settings-verification" title={t.settingsVerification}>
            {verification ? (
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label={t.settingsStatus} value={humanizeEnum(verification.status)} />
                <Field label={t.settingsLicense} value={verification.tradeLicenseRef ?? t.settingsNotProvided} />
                <Field label={t.settingsLicenseExpiry} value={verification.licenseExpiry ? formatUtcDate(verification.licenseExpiry) : t.settingsNotProvided} />
                <Field label={t.settingsJurisdiction} value={verification.jurisdiction ?? t.settingsNotProvided} />
              </dl>
            ) : (
              <p className="text-sm text-on-surface-variant">{t.settingsNoVerification}</p>
            )}
          </Section>

          <Section id="settings-branches" title={t.settingsBranches}>
            {context.branches.length === 0 ? (
              <p className="text-sm text-on-surface-variant">{t.settingsNoBranches}</p>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {context.branches.map((branch) => (
                  <li key={branch.id} className="rounded-xl border border-white/[0.05] bg-surface-container p-4">
                    <div className="text-sm font-semibold text-on-surface">{branch.name}</div>
                    <div className="text-xs text-on-surface-variant">{branch.city}, {branch.emirate}</div>
                    {branch.address && <div className="mt-1 text-xs text-on-surface-variant">{branch.address}</div>}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </DealerShell>
    );
  } catch (error: unknown) {
    return (
      <DealerServiceError
        title={t.errSettingsTitle}
        error={error}
        fallbackMessage={t.errSettingsFallback}
        retryPath="/dealer/settings"
        locale={locale}
      />
    );
  }
}
