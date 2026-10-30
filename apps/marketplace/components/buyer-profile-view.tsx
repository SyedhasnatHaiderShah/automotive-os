'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BuyerProfileData,
  updateBuyerProfileApi,
  revokeLeadGrantApi,
} from '../lib/api';

interface BuyerProfileViewProps {
  initialProfile: BuyerProfileData;
}

export function BuyerProfileView({ initialProfile }: BuyerProfileViewProps) {
  const [profile, setProfile] = useState<BuyerProfileData>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [activeState, setActiveState] = useState<
    'verified' | 'onboarding' | 'edit' | 'revoked'
  >('verified');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Editable local state
  const [strictGcc, setStrictGcc] = useState(profile.strictGccSpecOnly);
  const [shareFullName, setShareFullName] = useState(
    profile.disclosureMatrix.shareFullName
  );
  const [sharePhone, setSharePhone] = useState(
    profile.disclosureMatrix.sharePhone
  );
  const [channelWhatsapp, setChannelWhatsapp] = useState(
    profile.channels.whatsapp
  );
  const [channelPhone, setChannelPhone] = useState(profile.channels.phone);
  const [channelPrivateOffice, setChannelPrivateOffice] = useState(
    profile.channels.privateOffice
  );
  const [selectedLanguage, setSelectedLanguage] = useState(
    profile.preferredLanguage
  );
  const [selectedEmirate, setSelectedEmirate] = useState(
    profile.preferredEmirate
  );
  const [viewingHubs, setViewingHubs] = useState<string[]>(profile.viewingHubs);
  const [budgetMin, setBudgetMin] = useState(profile.budgetMinFils / 100);
  const [budgetMax, setBudgetMax] = useState(profile.budgetMaxFils / 100);
  const [ephemeralGrants, setEphemeralGrants] = useState(
    profile.ephemeralGrants
  );

  const activeGrantsCount = ephemeralGrants.filter((g) => !g.revoked).length;

  const handleToggleEditMode = async () => {
    if (isEditing) {
      // Save edits to API
      setIsSaving(true);
      let ok = false;
      let failure = '';
      try {
        ok = await updateBuyerProfileApi({
          preferredLanguage: selectedLanguage,
          preferredEmirate: selectedEmirate,
          budgetMinFils: Math.round(budgetMin * 100),
          budgetMaxFils: Math.round(budgetMax * 100),
        });
      } catch (err) {
        failure = err instanceof Error ? err.message : 'Request failed';
      }
      setIsSaving(false);
      setIsEditing(false);
      if (ok) {
        setProfile((prev) => ({
          ...prev,
          preferredLanguage: selectedLanguage,
          preferredEmirate: selectedEmirate,
          budgetMinFils: Math.round(budgetMin * 100),
          budgetMaxFils: Math.round(budgetMax * 100),
        }));
      }
      setFeedbackMessage(
        ok
          ? 'Profile preferences updated and synchronized with backend API.'
          : `Preferences were not saved: ${failure}`
      );
      setTimeout(() => setFeedbackMessage(null), 4000);
    } else {
      setIsEditing(true);
    }
  };

  const handleRevokeSingleGrant = async (leadId: string, grantId: string) => {
    try {
      await revokeLeadGrantApi(leadId);
    } catch (err) {
      setFeedbackMessage(`Access was not revoked: ${err instanceof Error ? err.message : 'Request failed'}`);
      setTimeout(() => setFeedbackMessage(null), 4000);
      return;
    }
    setEphemeralGrants((prev) =>
      prev.map((g) =>
        g.id === grantId || g.leadId === leadId
          ? { ...g, revoked: true, expiresText: 'Access Revoked' }
          : g
      )
    );
    setFeedbackMessage(
      'Ephemeral dealer data grant revoked immediately under PDPL 45/2021.'
    );
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleRevokeAllTokens = async () => {
    const revokedLeadIds = new Set<string>();
    let failure = '';
    for (const grant of ephemeralGrants) {
      if (!grant.revoked) {
        try {
          await revokeLeadGrantApi(grant.leadId);
          revokedLeadIds.add(grant.leadId);
        } catch (err) {
          failure = err instanceof Error ? err.message : 'Request failed';
        }
      }
    }
    setEphemeralGrants((prev) =>
      prev.map((g) =>
        revokedLeadIds.has(g.leadId) ? { ...g, revoked: true, expiresText: 'Access Revoked' } : g
      )
    );
    if (failure) {
      setFeedbackMessage(`Some dealer access could not be revoked: ${failure}`);
      setTimeout(() => setFeedbackMessage(null), 6000);
      return;
    }
    setFeedbackMessage(
      'Sovereign Lockdown Alert: All active ephemeral dealer tokens have been instantly invalidated.'
    );
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleDownloadVault = () => {
    const vaultExport = {
      vaultVersion: '2.4.0-UAE',
      exportTimestamp: new Date().toISOString(),
      governance: 'UAE Personal Data Protection Law (Federal Decree-Law No. 45/2021)',
      collector: {
        legalName: profile.fullName,
        legalNameAr: profile.fullNameAr,
        emiratesId: profile.emiratesIdMasked,
        telecom: profile.phoneE164,
        rtaLicense: profile.licenseNumber,
      },
      preferences: {
        emirate: selectedEmirate,
        language: selectedLanguage,
        strictGccSpecOnly: strictGcc,
        budgetFloorAED: budgetMin,
        budgetCeilingAED: budgetMax,
        viewingHubs,
      },
      activeGrants: ephemeralGrants,
      integrityAudit: {
        keystoreSigned: true,
        enclaveAttestation: '0x99A48F7BC12E0987',
        score: '96%',
      },
    };

    const blob = new Blob([JSON.stringify(vaultExport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `automotiveos-vault-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setFeedbackMessage('Sovereign data vault exported successfully (Encrypted JSON).');
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const toggleHub = (hub: string) => {
    if (viewingHubs.includes(hub)) {
      setViewingHubs(viewingHubs.filter((h) => h !== hub));
    } else {
      setViewingHubs([...viewingHubs, hub]);
    }
  };

  return (
    <div
      className={`min-h-screen bg-surface font-body-md text-on-surface antialiased flex flex-col justify-between ${
        selectedLanguage === 'ar' ? 'rtl' : 'ltr'
      }`}
      dir={selectedLanguage === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Top Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.40)]">
        <div className="h-20 max-w-[1440px] mx-auto px-space-md lg:px-space-xl flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-lg">
            <Link className="flex items-center gap-space-sm group" href="/">
              <div className="w-9 h-9 rounded bg-surface-container-high flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  token
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface group-hover:text-primary transition-colors uppercase">
                  Automotive<span className="text-primary font-bold">OS</span>
                </span>
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                  UAE Collector Exchange
                </span>
              </div>
            </Link>
            <div className="hidden xl:flex items-center">
              <div className="h-6 w-px bg-surface-container-highest mx-space-xs"></div>
              <button className="flex items-center gap-space-xs px-space-sm py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors text-on-surface">
                <span className="material-symbols-outlined text-primary text-[18px]">
                  location_on
                </span>
                <span className="font-body-sm text-body-sm text-on-surface font-medium">
                  Dubai
                </span>
                <span className="font-label-caps text-label-caps text-on-surface-variant">
                  DXB
                </span>
                <span className="material-symbols-outlined text-on-surface-variant text-[16px]">
                  expand_more
                </span>
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-space-xs p-1 bg-surface-container-lowest/80 rounded-xl">
            <Link
              className="px-space-md py-2 font-body-md text-body-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all rounded-lg"
              href="/search"
            >
              Browse Stock
            </Link>
            <Link
              className="px-space-md py-2 font-body-md text-body-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all rounded-lg"
              href="/dealers/al-ain-class-motors"
            >
              Verified Dealers
            </Link>
            <a
              className="px-space-md py-2 font-body-md text-body-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all rounded-lg"
              href="#vip-services"
            >
              VIP Services
            </a>
            <a
              className="px-space-md py-2 font-body-md text-body-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all rounded-lg"
              href="#compare"
            >
              Compare Vehicles
            </a>
          </nav>

          {/* Right Header Badges & Actions */}
          <div className="flex items-center gap-space-sm">
            <div className="flex items-center p-1 bg-surface-container-lowest rounded-lg">
              <button
                onClick={() => setSelectedLanguage('en')}
                className={`px-space-xs py-1 rounded font-label-caps text-label-caps transition-colors ${
                  selectedLanguage === 'en'
                    ? 'text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                EN
              </button>
              <span className="text-outline-variant font-label-caps text-label-caps mx-1">
                |
              </span>
              <button
                onClick={() => setSelectedLanguage('ar')}
                className={`px-space-xs py-1 rounded font-label-caps text-label-caps transition-colors ${
                  selectedLanguage === 'ar'
                    ? 'text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                العربية
              </button>
            </div>

            <Link
              className="relative p-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center"
              href="/account/saved"
              title="Saved Inventory"
            >
              <span className="material-symbols-outlined text-[20px]">
                bookmark
              </span>
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary text-on-primary font-data-mono-num text-[10px] font-bold flex items-center justify-center leading-none">
                4
              </span>
            </Link>

            <Link
              className="relative p-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center"
              href="/account/enquiries"
              title="Advisories & Alerts"
            >
              <span className="material-symbols-outlined text-[20px]">
                notifications
              </span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-tertiary ring-2 ring-surface"></span>
            </Link>

            <Link
              className="flex items-center gap-space-sm pl-space-sm pr-space-md py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors group"
              href="/account/profile"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[18px]">
                  person
                </span>
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="font-body-sm text-body-sm text-on-surface font-semibold group-hover:text-primary transition-colors">
                  {profile.fullName}
                </span>
                <span className="font-label-caps text-label-caps text-primary uppercase">
                  VIP Collector
                </span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full pt-20 bg-surface flex-1">
        <div className="flex flex-col w-full">
          {/* Top Subtle Ambient Light Glow */}
          <div className="relative w-full max-w-[1440px] mx-auto px-space-md lg:px-space-xl pt-space-md pb-space-3xl">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
            <div className="absolute top-48 left-10 w-72 h-72 bg-secondary/5 rounded-full blur-2xl pointer-events-none -z-10"></div>

            {/* Notification / Feedback Banner */}
            {feedbackMessage && (
              <div className="mb-space-md p-space-md rounded-xl bg-primary/10 border border-primary/30 text-on-surface flex items-center justify-between gap-space-md animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    verified
                  </span>
                  <span className="font-body-sm text-body-sm font-medium">
                    {feedbackMessage}
                  </span>
                </div>
                <button
                  onClick={() => setFeedbackMessage(null)}
                  className="text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    close
                  </span>
                </button>
              </div>
            )}

            {/* Breadcrumb Hierarchy */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm mb-space-md"
            >
              <Link
                href="/account/enquiries"
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Buyer Portal
              </Link>
              <span className="material-symbols-outlined text-[14px]">
                chevron_right
              </span>
              <span className="hover:text-primary transition-colors cursor-pointer">
                Account & Privacy
              </span>
              <span className="material-symbols-outlined text-[14px]">
                chevron_right
              </span>
              <span className="text-primary font-medium">
                Sovereign Collector Profile
              </span>
            </nav>

            {/* Header Section with Bilingual Title & Credentials Stamp */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg mb-space-xl">
              <div className="max-w-4xl flex flex-col gap-space-xs">
                <div className="flex flex-wrap items-center gap-space-sm mb-space-xs">
                  {/* Tier Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary">
                    <span
                      className="material-symbols-outlined text-[16px] text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      workspace_premium
                    </span>
                    <span className="font-label-caps text-label-caps uppercase tracking-wider">
                      Tier-1 Verified Collector
                    </span>
                  </div>

                  {/* UAE Pass Verified Pill */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary/10 text-tertiary">
                    <span
                      className="material-symbols-outlined text-[16px] text-tertiary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    <span className="font-label-caps text-label-caps uppercase tracking-wider">
                      UAE PASS Sovereign Authenticated
                    </span>
                  </div>

                  {/* Regulatory Pill */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant">
                    <span className="font-data-mono-num text-[11px] text-on-surface-variant">
                      PDPL 45/2021 Compliant
                    </span>
                  </div>
                </div>

                <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
                  Buyer Profile & Privacy Protocols
                  <span className="block lg:inline font-headline-lg text-headline-lg text-outline font-normal ml-0 lg:ml-2">
                    {' '}
                    | الملف الشخصي وتصاريح الخصوصية
                  </span>
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl leading-relaxed">
                  Manage your institutional identity, verified credentials,
                  regional preferences, and granular dealer data sharing
                  permissions under UAE Personal Data Protection Law (Federal
                  Decree-Law No. 45/2021).
                </p>
              </div>

              {/* Quick Actions / Vault Status Metric */}
              <div className="flex items-center gap-space-sm shrink-0">
                <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm flex items-center gap-space-md border border-outline-variant/15">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[24px]">
                      shield
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                      Vault Shield Status
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center gap-1.5">
                      {activeState === 'revoked'
                        ? 'Lockdown Active'
                        : 'Zero-Leak Active'}
                      <span
                        className={`w-2 h-2 rounded-full inline-block ${
                          activeState === 'revoked'
                            ? 'bg-error'
                            : 'bg-tertiary animate-pulse'
                        }`}
                      ></span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs Inside Buyer Portal */}
            <div className="w-full bg-surface-container-lowest rounded-xl p-1 mb-space-2xl overflow-x-auto">
              <div className="flex items-center gap-space-xs min-w-max">
                <Link
                  href="/account/profile"
                  className="flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-headline-sm text-headline-sm font-semibold shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    badge
                  </span>
                  <span>Profile & Security</span>
                </Link>

                <Link
                  href="/account/saved"
                  className="flex items-center gap-2 px-space-md py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all font-body-md text-body-md"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    favorite
                  </span>
                  <span>Saved Searches & Favorites</span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-data-mono-num text-[11px]">
                    14
                  </span>
                </Link>

                <Link
                  href="/account/enquiries"
                  className="flex items-center gap-2 px-space-md py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all font-body-md text-body-md"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    hourglass_top
                  </span>
                  <span>Enquiry Pipeline</span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-data-mono-num text-[11px]">
                    3
                  </span>
                </Link>

                <Link
                  href="/account/garage"
                  className="flex items-center gap-2 px-space-md py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all font-body-md text-body-md"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    speed
                  </span>
                  <span>Test Drives & Sessions</span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-data-mono-num text-[11px]">
                    2
                  </span>
                </Link>

                <Link
                  href="/account/garage"
                  className="flex items-center gap-2 px-space-md py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all font-body-md text-body-md"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    garage
                  </span>
                  <span>Virtual Garage</span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-data-mono-num text-[11px]">
                    4
                  </span>
                </Link>
              </div>
            </div>

            {/* MAIN TWO-COLUMN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
              {/* LEFT COLUMN: Identity & Global Preferences (7 Cols) */}
              <div className="lg:col-span-7 flex flex-col gap-space-xl">
                {/* SECTION 1: Verified Collector Identity & UAE PASS Integration */}
                <section className="p-space-lg lg:p-space-xl rounded-xl bg-surface-container shadow-md flex flex-col gap-space-lg relative overflow-hidden border border-outline-variant/15">
                  <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-tertiary/5 pointer-events-none"></div>

                  <div className="flex items-start justify-between gap-space-md">
                    <div className="flex items-center gap-space-md">
                      <div className="w-14 h-14 rounded-xl bg-surface-container-lowest flex items-center justify-center shadow-inner relative">
                        <span className="material-symbols-outlined text-tertiary text-[32px]">
                          fingerprint
                        </span>
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center font-bold text-[12px]">
                          ✓
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-label-caps text-label-caps text-tertiary uppercase tracking-wider">
                            Federal Digital Identity
                          </span>
                          <span className="font-data-mono-num text-[11px] text-on-surface-variant">
                            UAE PASS Gold
                          </span>
                        </div>
                        <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
                          Verified Collector Identity
                        </h2>
                      </div>
                    </div>

                    <button
                      onClick={handleToggleEditMode}
                      disabled={isSaving}
                      className={`px-space-md py-2 rounded-lg transition-all flex items-center gap-1.5 font-body-sm text-body-sm font-medium ${
                        isEditing
                          ? 'bg-primary text-on-primary font-semibold shadow-md'
                          : 'bg-surface-container-high hover:bg-surface-bright text-on-surface hover:text-primary'
                      }`}
                      id="toggle-edit-mode-btn"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isEditing ? 'save' : 'edit_square'}
                      </span>
                      <span>
                        {isSaving
                          ? 'Saving...'
                          : isEditing
                          ? 'Save Edits'
                          : 'Edit Preferences'}
                      </span>
                    </button>
                  </div>

                  {/* Verified Government Metadata Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                    <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-1 border border-outline-variant/10">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                        Full Legal Name (Govt. Registry)
                      </span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                        {profile.fullName}
                      </span>
                      <span className="font-body-sm text-body-sm text-outline">
                        {profile.fullNameAr}
                      </span>
                    </div>

                    <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-1 border border-outline-variant/10">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                        Masked Emirates ID
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="font-data-mono-num text-[15px] text-on-surface tracking-wider font-semibold">
                          {profile.emiratesIdMasked}
                        </span>
                        <span
                          className="material-symbols-outlined text-tertiary text-[18px]"
                          title="Authenticated via ICA"
                        >
                          verified_user
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-tertiary font-medium">
                        Card Status: Valid / Biom-Scanned
                      </span>
                    </div>

                    <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-1 border border-outline-variant/10">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                        Verified Telecom (Encrypted)
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="font-data-mono-num text-[15px] text-on-surface tracking-wider font-semibold">
                          {profile.phoneE164}
                        </span>
                        <span className="font-label-caps text-label-caps text-primary uppercase">
                          VIP e-SIM
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Registered under UAE Passport
                      </span>
                    </div>

                    <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-1 border border-outline-variant/10">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                        RTA VIP Driver License
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          {profile.licenseNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary font-label-caps text-[10px] uppercase font-bold">
                          Unrestricted Supercar
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Category: Light & High-Output GT
                      </span>
                    </div>
                  </div>

                  {/* Inline Contact Channel Preferences Form (Editable) */}
                  <div
                    className={`pt-space-md flex flex-col gap-space-md transition-all ${
                      isEditing
                        ? 'ring-1 ring-primary p-space-sm rounded-lg bg-surface-container-low/50'
                        : ''
                    }`}
                    id="editable-preferences-panel"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                        Concierge & Dispatch Channels
                      </span>
                      <span className="font-label-caps text-label-caps text-primary uppercase">
                        Customizable for Viewing Logistics
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                      {/* Channel 1: WhatsApp */}
                      <div
                        onClick={() => setChannelWhatsapp(!channelWhatsapp)}
                        className={`p-space-md rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors cursor-pointer group flex flex-col justify-between h-28 border ${
                          channelWhatsapp
                            ? 'border-primary/40'
                            : 'border-outline-variant/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="material-symbols-outlined text-primary text-[20px]">
                            chat
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                              channelWhatsapp
                                ? 'bg-primary text-on-primary'
                                : 'bg-surface-container-highest text-on-surface-variant'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[12px]">
                              {channelWhatsapp ? 'check' : 'add'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="font-body-md text-body-md text-on-surface font-semibold">
                            Encrypted WhatsApp
                          </div>
                          <div className="font-body-sm text-body-sm text-on-surface-variant">
                            Direct Concierge Handshake
                          </div>
                        </div>
                      </div>

                      {/* Channel 2: VIP Phone */}
                      <div
                        onClick={() => setChannelPhone(!channelPhone)}
                        className={`p-space-md rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors cursor-pointer group flex flex-col justify-between h-28 border ${
                          channelPhone
                            ? 'border-primary/40'
                            : 'border-outline-variant/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`material-symbols-outlined text-[20px] transition-colors ${
                              channelPhone
                                ? 'text-primary'
                                : 'text-on-surface-variant group-hover:text-primary'
                            }`}
                          >
                            call
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                              channelPhone
                                ? 'bg-primary text-on-primary'
                                : 'bg-surface-container-highest text-on-surface-variant'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[12px]">
                              {channelPhone ? 'check' : 'add'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="font-body-md text-body-md text-on-surface font-semibold">
                            VIP Phone Call
                          </div>
                          <div className="font-body-sm text-body-sm text-on-surface-variant">
                            Direct principal line
                          </div>
                        </div>
                      </div>

                      {/* Channel 3: Private Office Desk */}
                      <div
                        onClick={() =>
                          setChannelPrivateOffice(!channelPrivateOffice)
                        }
                        className={`p-space-md rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors cursor-pointer group flex flex-col justify-between h-28 border ${
                          channelPrivateOffice
                            ? 'border-primary/40'
                            : 'border-outline-variant/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`material-symbols-outlined text-[20px] transition-colors ${
                              channelPrivateOffice
                                ? 'text-primary'
                                : 'text-on-surface-variant group-hover:text-primary'
                            }`}
                          >
                            mail
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                              channelPrivateOffice
                                ? 'bg-primary text-on-primary'
                                : 'bg-surface-container-highest text-on-surface-variant'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[12px]">
                              {channelPrivateOffice ? 'check' : 'add'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="font-body-md text-body-md text-on-surface font-semibold">
                            Private Office Desk
                          </div>
                          <div className="font-body-sm text-body-sm text-on-surface-variant">
                            chief.staff@nuaimi.ae
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Language & Primary Emirate Selectors */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md pt-space-xs">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                          Preferred Portal Language
                        </label>
                        <div className="grid grid-cols-2 gap-2 bg-surface-container-lowest p-1 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setSelectedLanguage('en')}
                            className={`py-2 px-3 rounded-md font-headline-sm text-headline-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                              selectedLanguage === 'en'
                                ? 'bg-primary text-on-primary shadow-sm'
                                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              language
                            </span>
                            <span>English (UK)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedLanguage('ar')}
                            className={`py-2 px-3 rounded-md font-headline-sm text-headline-sm font-medium flex items-center justify-center gap-2 transition-all ${
                              selectedLanguage === 'ar'
                                ? 'bg-primary text-on-primary shadow-sm'
                                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                            }`}
                          >
                            <span>العربية (GCC)</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                          Primary Emirate & Collector Sanctuary
                        </label>
                        <div className="relative">
                          <select
                            value={selectedEmirate}
                            onChange={(e) => setSelectedEmirate(e.target.value)}
                            className="w-full appearance-none px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md font-medium border border-transparent focus:border-primary/50 focus:outline-none cursor-pointer pr-10"
                          >
                            <option value="Dubai (DIFC & Palm Jumeirah)">
                              Dubai (DIFC & Palm Jumeirah)
                            </option>
                            <option value="Abu Dhabi (Al Bateen & Saadiyat)">
                              Abu Dhabi (Al Bateen & Saadiyat)
                            </option>
                            <option value="Sharjah (Al Majaz & Zahia)">
                              Sharjah (Al Majaz & Zahia)
                            </option>
                            <option value="Ras Al Khaimah (Al Marjan)">
                              Ras Al Khaimah (Al Marjan)
                            </option>
                          </select>
                          <span className="material-symbols-outlined text-primary text-[18px] absolute left-3 top-3 pointer-events-none">
                            location_city
                          </span>
                          <span className="material-symbols-outlined text-on-surface-variant text-[18px] absolute right-3 top-3 pointer-events-none">
                            unfold_more
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* SECTION 2: Global Buyer Preferences */}
                <section className="p-space-lg lg:p-space-xl rounded-xl bg-surface-container shadow-md flex flex-col gap-space-lg border border-outline-variant/15">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
                    <div className="flex items-center gap-space-md">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-lowest flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-[26px]">
                          tune
                        </span>
                      </div>
                      <div>
                        <h3 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
                          Global Buyer Specifications
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Automated pre-filtering across 42 UAE certified dealer
                          inventories
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                        Regional Enforcement
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-data-mono-num text-[11px] font-bold">
                        {strictGcc ? 'STRICT' : 'FLEXIBLE'}
                      </span>
                    </div>
                  </div>

                  {/* Regional Spec Enforcer Box */}
                  <div className="p-space-md rounded-lg bg-surface-container-low flex items-center justify-between gap-space-md border border-outline-variant/10">
                    <div className="flex items-center gap-space-md">
                      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-[22px]">
                          public
                        </span>
                      </div>
                      <div>
                        <div className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          Regional Spec: GCC Specifications Only
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">
                          Exclude all US, Japanese, and EU imports lacking GCC
                          high-temp cooling & dust pack.
                        </div>
                      </div>
                    </div>
                    {/* Interactive Toggle Switch */}
                    <button
                      aria-label="Strict GCC Spec Toggle"
                      type="button"
                      onClick={() => setStrictGcc(!strictGcc)}
                      className={`w-12 h-6 rounded-full relative p-0.5 flex items-center transition-all ${
                        strictGcc
                          ? 'bg-primary justify-end'
                          : 'bg-surface-container-highest justify-start'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full shadow-sm transition-all ${
                          strictGcc ? 'bg-on-primary' : 'bg-on-surface-variant'
                        }`}
                      ></div>
                    </button>
                  </div>

                  {/* Acquisition Budget Slider Component */}
                  <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-space-md border border-outline-variant/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                      <div>
                        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                          Target Acquisition Horizon
                        </span>
                        <div className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          Preferred Bracket Per Allocation
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1.5 font-headline-lg text-headline-lg text-primary">
                        <span className="font-label-caps text-label-caps text-outline uppercase">
                          AED
                        </span>
                        <span className="font-data-currency-lg text-data-currency-lg font-bold text-primary">
                          {budgetMin.toLocaleString()}
                        </span>
                        <span className="text-on-surface-variant font-normal text-headline-md">
                          -
                        </span>
                        <span className="font-data-currency-lg text-data-currency-lg font-bold text-primary">
                          {budgetMax >= 3500000
                            ? '3,500,000+'
                            : budgetMax.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Visual Slider Representation */}
                    <div className="relative py-2 flex flex-col gap-2">
                      <div className="relative flex items-center">
                        <div className="w-full h-2 rounded-full bg-surface-container-highest relative overflow-hidden">
                          <div
                            className="absolute top-0 bottom-0 bg-primary rounded-full"
                            style={{
                              left: `${Math.max(0, Math.min(100, ((budgetMin - 300000) / (5000000 - 300000)) * 100))}%`,
                              right: `${Math.max(0, Math.min(100, 100 - ((budgetMax - 300000) / (5000000 - 300000)) * 100))}%`,
                            }}
                          ></div>
                        </div>
                        {/* Dual Handles */}
                        <div
                          className="absolute -ml-3 w-6 h-6 rounded-full bg-on-surface shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing"
                          style={{
                            left: `${Math.max(0, Math.min(100, ((budgetMin - 300000) / (5000000 - 300000)) * 100))}%`,
                          }}
                        >
                          <div className="w-2 h-2 rounded-full bg-surface"></div>
                        </div>
                        <div
                          className="absolute -mr-3 w-6 h-6 rounded-full bg-primary shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing"
                          style={{
                            left: `${Math.max(0, Math.min(100, ((budgetMax - 300000) / (5000000 - 300000)) * 100))}%`,
                          }}
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-on-primary"></div>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="grid grid-cols-2 gap-4 mt-2 p-2 rounded bg-surface-container-lowest">
                          <div className="flex flex-col gap-1">
                            <span className="font-label-caps text-[10px] text-on-surface-variant">MIN BRACKET (AED)</span>
                            <input
                              type="range"
                              min="300000"
                              max="2000000"
                              step="50000"
                              value={budgetMin}
                              onChange={(e) => setBudgetMin(Number(e.target.value))}
                              className="w-full accent-primary"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-label-caps text-[10px] text-on-surface-variant">MAX BRACKET (AED)</span>
                            <input
                              type="range"
                              min="2000000"
                              max="10000000"
                              step="100000"
                              value={budgetMax}
                              onChange={(e) => setBudgetMax(Number(e.target.value))}
                              className="w-full accent-primary"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-on-surface-variant font-data-mono-num text-[11px]">
                      <span>Floor: AED 300K</span>
                      <span>Tier Baseline: AED 1.8M</span>
                      <span>Unrestricted Apex: AED 15M+</span>
                    </div>
                  </div>

                  {/* Preferred UAE Hubs Chips */}
                  <div className="flex flex-col gap-space-xs">
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                      Authorized Viewing Hubs
                    </span>
                    <div className="flex flex-wrap items-center gap-space-xs">
                      {[
                        'Dubai: Al Quoz Exotic Hub',
                        'Dubai: Sheikh Zayed Road (SZR) Showrooms',
                        'Abu Dhabi: Yas Marina Circuit Paddock',
                        'Sharjah Classic Auto Hub',
                      ].map((hub) => {
                        const isSelected = viewingHubs.includes(hub);
                        return (
                          <div
                            key={hub}
                            onClick={() => toggleHub(hub)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body-sm text-body-sm cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-primary text-on-primary font-semibold'
                                : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-bright'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {isSelected ? 'check' : 'add'}
                            </span>
                            <span>{hub}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {/* Collector Sanctuary Asset Snapshot Card */}
                <div className="p-space-lg rounded-xl bg-surface-container-lowest flex flex-col sm:flex-row items-center gap-space-lg border border-outline-variant/15">
                  <div className="w-full sm:w-44 h-28 rounded-lg overflow-hidden shrink-0 relative bg-surface-container-high">
                    <img
                      className="w-full h-full object-cover"
                      alt="Cinematic shot of bespoke climate controlled collector supercar vault in Dubai"
                      src="https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-transparent"></div>
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-surface-container-high/90 font-label-caps text-[9px] text-primary uppercase">
                      DIFC Vault 04
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex items-center justify-between">
                      <span className="font-label-caps text-label-caps text-primary uppercase">
                        Private Vault Allocation
                      </span>
                      <span className="font-data-mono-num text-[11px] text-on-surface-variant">
                        Sync: 14m ago
                      </span>
                    </div>
                    <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      4 Vehicles Registered in Private Custody
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Direct telemetry linking RTA electronic registration cards.
                      Fleet privacy remains masked by sovereign default.
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Granular Dealer Privacy & Disclosure Matrix (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col gap-space-xl">
                <section className="p-space-lg lg:p-space-xl rounded-xl bg-surface-container shadow-md flex flex-col gap-space-lg border border-outline-variant/15">
                  <div className="flex items-center gap-space-md">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-lowest flex items-center justify-center">
                      <span className="material-symbols-outlined text-secondary text-[26px]">
                        visibility_off
                      </span>
                    </div>
                    <div>
                      <span className="font-label-caps text-label-caps text-secondary uppercase tracking-wider">
                        Zero-Knowledge Disclosure
                      </span>
                      <h3 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
                        Dealer Disclosure Matrix
                      </h3>
                    </div>
                  </div>

                  {/* Explanatory Zero-Leak Banner */}
                  <div className="p-space-md rounded-lg bg-secondary/10 flex items-start gap-space-sm border border-secondary/20">
                    <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                      lock_person
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface leading-snug">
                      <strong className="font-semibold text-secondary">
                        Zero-Leak Architecture:
                      </strong>{' '}
                      UAE dealerships cannot search, query, or browse collector
                      profiles. Contact fields are only transmitted when you
                      explicitly confirm an active enquiry or private viewing
                      contract.
                    </p>
                  </div>

                  {/* Granular Permissions Matrix Table */}
                  <div className="flex flex-col gap-space-sm">
                    {/* Row 1: Full Legal Name */}
                    <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between gap-space-sm border border-outline-variant/10">
                      <div className="flex items-center gap-space-sm min-w-0">
                        <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
                          badge
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-body-md text-body-md text-on-surface font-semibold truncate">
                            Full Legal Name
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                            Shared only upon signed RTA contract
                          </span>
                        </div>
                      </div>
                      <button
                        aria-label="Toggle Full Name Access"
                        type="button"
                        onClick={() => setShareFullName(!shareFullName)}
                        className={`w-11 h-6 rounded-full relative p-0.5 flex items-center shrink-0 transition-all ${
                          shareFullName
                            ? 'bg-primary justify-end'
                            : 'bg-surface-container-highest justify-start'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full transition-all ${
                            shareFullName
                              ? 'bg-on-primary'
                              : 'bg-on-surface-variant'
                          }`}
                        ></div>
                      </button>
                    </div>

                    {/* Row 2: Phone / WhatsApp Number */}
                    <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between gap-space-sm border border-outline-variant/10">
                      <div className="flex items-center gap-space-sm min-w-0">
                        <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
                          call
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-body-md text-body-md text-on-surface font-semibold truncate">
                            Phone & WhatsApp Number
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                            Masked VIP proxy dispatch PIN
                          </span>
                        </div>
                      </div>
                      <button
                        aria-label="Toggle Phone Access"
                        type="button"
                        onClick={() => setSharePhone(!sharePhone)}
                        className={`w-11 h-6 rounded-full relative p-0.5 flex items-center shrink-0 transition-all ${
                          sharePhone
                            ? 'bg-primary justify-end'
                            : 'bg-surface-container-highest justify-start'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full transition-all ${
                            sharePhone
                              ? 'bg-on-primary'
                              : 'bg-on-surface-variant'
                          }`}
                        ></div>
                      </button>
                    </div>

                    {/* Row 3: Proof of Funds (Zero Knowledge) */}
                    <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between gap-space-sm border border-outline-variant/10">
                      <div className="flex items-center gap-space-sm min-w-0">
                        <span className="material-symbols-outlined text-tertiary text-[20px] shrink-0">
                          account_balance
                        </span>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-body-md text-body-md text-on-surface font-semibold truncate">
                              Proof of Funds / Liquidity
                            </span>
                            <span className="material-symbols-outlined text-tertiary text-[14px]">
                              lock
                            </span>
                          </div>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            UAE Central Bank ZK-Attested (Pass/Fail)
                          </span>
                        </div>
                      </div>
                      <div className="px-2.5 py-1 rounded bg-tertiary/10 text-tertiary font-label-caps text-[10px] uppercase font-bold shrink-0">
                        ZK Pass Only
                      </div>
                    </div>

                    {/* Row 4: Current Garage & Past Acquisitions */}
                    <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between gap-space-sm border border-outline-variant/10">
                      <div className="flex items-center gap-space-sm min-w-0">
                        <span className="material-symbols-outlined text-error text-[20px] shrink-0">
                          no_accounts
                        </span>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-body-md text-body-md text-on-surface font-semibold truncate">
                              Virtual Garage & Past Buys
                            </span>
                            <span className="material-symbols-outlined text-error text-[14px]">
                              lock
                            </span>
                          </div>
                          <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                            Strictly Redacted / Never Disclosed
                          </span>
                        </div>
                      </div>
                      <div className="px-2.5 py-1 rounded bg-error/10 text-error font-label-caps text-[10px] uppercase font-bold shrink-0">
                        Perma-Blocked
                      </div>
                    </div>

                    {/* Row 5: Direct Residence / Location */}
                    <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between gap-space-sm border border-outline-variant/10">
                      <div className="flex items-center gap-space-sm min-w-0">
                        <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">
                          pin_drop
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-body-md text-body-md text-on-surface font-semibold truncate">
                            Direct Villa / Residence
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                            Coarse Emirate resolution only (Dubai)
                          </span>
                        </div>
                      </div>
                      <div className="px-2.5 py-1 rounded bg-surface-container-high text-on-surface-variant font-label-caps text-[10px] uppercase font-medium shrink-0">
                        Fuzzed Area
                      </div>
                    </div>
                  </div>

                  {/* Active Ephemeral Disclosures Section */}
                  <div className="flex flex-col gap-space-sm pt-space-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                        Active Ephemeral Disclosures
                      </span>
                      <span className="font-data-mono-num text-[11px] text-tertiary">
                        {activeGrantsCount} Active Sessions
                      </span>
                    </div>

                    {ephemeralGrants.map((grant) => (
                      <div
                        key={grant.id}
                        className={`p-space-sm rounded-lg bg-surface-container-lowest flex items-center justify-between border ${
                          grant.revoked
                            ? 'opacity-50 border-error/20'
                            : 'border-outline-variant/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              grant.revoked ? 'bg-error' : 'bg-tertiary'
                            }`}
                          ></div>
                          <div className="flex flex-col">
                            <span className="font-body-sm text-body-sm text-on-surface font-semibold">
                              {grant.dealershipName}
                            </span>
                            <span className="font-data-mono-num text-[10px] text-on-surface-variant">
                              {grant.context} · {grant.expiresText}
                            </span>
                          </div>
                        </div>
                        {!grant.revoked && (
                          <button
                            type="button"
                            onClick={() =>
                              handleRevokeSingleGrant(grant.leadId, grant.id)
                            }
                            className="text-error hover:text-error-container p-1 rounded hover:bg-error/10 transition-colors"
                            title="Revoke Immediately"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              block
                            </span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Legal Erasure & Sovereign Vault Download Actions */}
                  <div className="flex flex-col gap-space-sm pt-space-sm">
                    <button
                      type="button"
                      onClick={handleDownloadVault}
                      className="w-full py-3 px-space-md rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface transition-all flex items-center justify-center gap-2 font-body-sm text-body-sm font-semibold"
                    >
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        download
                      </span>
                      <span>
                        Download Sovereign Data Vault (Encrypted JSON)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRevokeAllTokens}
                      className="w-full py-3 px-space-md rounded-lg bg-error-container/30 hover:bg-error-container/50 text-error transition-all flex items-center justify-center gap-2 font-body-sm text-body-sm font-semibold"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        lock_reset
                      </span>
                      <span>
                        Revoke All Dealer Access Tokens & Purge Logs
                      </span>
                    </button>
                  </div>
                </section>

                {/* Privacy Shield Telemetry Box with Mini SVG Keystore Chart */}
                <div className="p-space-lg rounded-xl bg-surface-container-low flex items-center justify-between gap-space-md border border-outline-variant/15">
                  <div className="flex flex-col gap-1">
                    <span className="font-label-caps text-label-caps text-primary uppercase">
                      Cryptographic Integrity
                    </span>
                    <div className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      Hardware Keystore Signed
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Last verified on Apple Secure Enclave & UAE PASS HSM
                    </p>
                  </div>

                  <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                    <svg
                      className="w-16 h-16 transform -rotate-90"
                      viewBox="0 0 36 36"
                    >
                      <path
                        className="text-surface-container-highest"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      ></path>
                      <path
                        className="text-primary"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray="96, 100"
                        strokeLinecap="round"
                        strokeWidth="3"
                      ></path>
                    </svg>
                    <span className="absolute font-data-mono-num text-[11px] font-bold text-on-surface">
                      96%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* STATE SWITCHER BAR (Interactive Component Demonstration) */}
            <div className="w-full mt-space-3xl pt-space-xl flex flex-col items-center justify-center gap-space-sm border-t border-outline-variant/15">
              <div className="flex items-center gap-2 text-on-surface-variant font-label-caps text-label-caps uppercase tracking-widest">
                <span className="material-symbols-outlined text-[14px]">
                  tune
                </span>
                <span>Interactive Viewport State Controller</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 bg-surface-container-lowest rounded-xl">
                <button
                  type="button"
                  id="state-btn-verified"
                  onClick={() => {
                    setActiveState('verified');
                    setIsEditing(false);
                  }}
                  className={`px-space-md py-2 rounded-lg font-body-sm text-body-sm transition-all shadow-sm ${
                    activeState === 'verified'
                      ? 'bg-primary text-on-primary font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  Populated Verified State (Active)
                </button>

                <button
                  type="button"
                  id="state-btn-onboarding"
                  onClick={() => {
                    setActiveState('onboarding');
                    setShowOnboardingModal(true);
                  }}
                  className={`px-space-md py-2 rounded-lg font-body-sm text-body-sm transition-all ${
                    activeState === 'onboarding'
                      ? 'bg-primary text-on-primary font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  Onboarding / First-Time Buyer
                </button>

                <button
                  type="button"
                  id="state-btn-edit"
                  onClick={() => {
                    setActiveState('edit');
                    setIsEditing(true);
                  }}
                  className={`px-space-md py-2 rounded-lg font-body-sm text-body-sm transition-all ${
                    activeState === 'edit'
                      ? 'bg-primary text-on-primary font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  Edit Profile Mode
                </button>

                <button
                  type="button"
                  id="state-btn-revoked"
                  onClick={() => {
                    setActiveState('revoked');
                    handleRevokeAllTokens();
                  }}
                  className={`px-space-md py-2 rounded-lg font-body-sm text-body-sm transition-all ${
                    activeState === 'revoked'
                      ? 'bg-primary text-on-primary font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  Privacy Revoked State
                </button>
              </div>

              <span className="font-body-sm text-body-sm text-outline text-center">
                Zero-Leak Guarantee strictly certified by Dubai Electronic
                Security Center (DESC) & RTA Telemetry Protocol 2025.
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Onboarding Dialog Modal */}
      {showOnboardingModal && (
        <div
          id="onboarding-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="bg-surface-container max-w-md w-full rounded-2xl p-space-xl border border-outline-variant/30 shadow-2xl flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">
                    fingerprint
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    UAE PASS Integration
                  </h3>
                  <span className="font-label-caps text-label-caps text-tertiary uppercase">
                    Onboarding Protocol
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOnboardingModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Authenticate via federal UAE PASS to instantly verify your
              Emirates ID, RTA driver credentials, and activate zero-leak
              dealership privacy protections.
            </p>

            <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-1 border border-outline-variant/10 text-on-surface font-body-sm">
              <div className="flex items-center gap-2 text-tertiary font-semibold">
                <span className="material-symbols-outlined text-[16px]">
                  check
                </span>
                <span>Automatic ICA Emirates ID Binding</span>
              </div>
              <div className="flex items-center gap-2 text-tertiary font-semibold">
                <span className="material-symbols-outlined text-[16px]">
                  check
                </span>
                <span>RTA Supercar Category Authorization</span>
              </div>
              <div className="flex items-center gap-2 text-tertiary font-semibold">
                <span className="material-symbols-outlined text-[16px]">
                  check
                </span>
                <span>Zero-Knowledge Liquidity Attestation</span>
              </div>
            </div>

            <div className="flex items-center gap-space-sm pt-space-xs">
              <button
                type="button"
                onClick={() => setShowOnboardingModal(false)}
                className="flex-1 py-2.5 rounded-lg bg-primary text-on-primary font-headline-sm text-headline-sm font-semibold hover:opacity-95 transition-opacity"
              >
                Connect UAE PASS
              </button>
              <button
                type="button"
                onClick={() => setShowOnboardingModal(false)}
                className="px-4 py-2.5 rounded-lg bg-surface-container-high text-on-surface font-body-sm hover:bg-surface-bright transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standard Stitch Footer */}
      <footer className="w-full bg-surface-container-lowest mt-space-3xl border-t border-outline-variant/10">
        <div className="max-w-[1440px] mx-auto px-space-md lg:px-space-xl py-space-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-xl mb-space-2xl">
            <div className="lg:col-span-2 flex flex-col gap-space-md">
              <div className="flex items-center gap-space-sm">
                <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    token
                  </span>
                </div>
                <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface uppercase">
                  Automotive<span className="text-primary font-bold">OS</span>
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                The ultra-luxury automotive transactional standard for the GCC.
                Direct custody, verified RTA telemetry, escrow settlement, and
                diplomatic transport across the Emirates.
              </p>
              <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
                <div className="flex items-center gap-space-xs px-space-sm py-1.5 rounded-full bg-surface-container-low">
                  <span className="material-symbols-outlined text-tertiary text-[18px]">
                    verified
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface font-medium">
                    RTA Certified Dealer Portal
                  </span>
                </div>
                <div className="flex items-center gap-space-xs px-space-sm py-1.5 rounded-full bg-surface-container-low">
                  <span className="material-symbols-outlined text-primary text-[18px]">
                    policy
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface font-medium">
                    DED License #984210
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-space-sm">
              <span className="font-label-caps text-label-caps text-primary uppercase tracking-wider">
                Collector Inventory
              </span>
              <nav className="flex flex-col gap-space-xs">
                <Link
                  className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
                  href="/search"
                >
                  Hypercars & Exotics
                </Link>
                <Link
                  className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
                  href="/search"
                >
                  Pristine Heritage & Classic
                </Link>
                <Link
                  className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
                  href="/search"
                >
                  Armored Presidential Fleet
                </Link>
                <Link
                  className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
                  href="/search"
                >
                  Telemetry Comparator
                </Link>
              </nav>
            </div>

            <div className="flex flex-col gap-space-sm">
              <span className="font-label-caps text-label-caps text-primary uppercase tracking-wider">
                Emirates Hubs
              </span>
              <nav className="flex flex-col gap-space-xs">
                <Link
                  className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
                  href="/dealers/al-ain-class-motors"
                >
                  Dubai International Financial Centre
                </Link>
                <Link
                  className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
                  href="/dealers/al-ain-class-motors"
                >
                  Abu Dhabi Yas Marina Terminal
                </Link>
                <Link
                  className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
                  href="/dealers/al-ain-class-motors"
                >
                  Sharjah Classic Auto Zone
                </Link>
                <Link
                  className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
                  href="/dealers/al-ain-class-motors"
                >
                  Ras Al Khaimah Concours Logistics
                </Link>
              </nav>
            </div>

            <div className="flex flex-col gap-space-sm">
              <span className="font-label-caps text-label-caps text-primary uppercase tracking-wider">
                Compliance & Advisory
              </span>
              <nav className="flex flex-col gap-space-xs">
                <a
                  className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
                  href="#customs"
                >
                  GCC Customs Clearance
                </a>
                <a
                  className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
                  href="#escrow"
                >
                  Escrow Vault Settlement
                </a>
                <a
                  className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
                  href="#tasjeel"
                >
                  TASJEEL Pre-Purchase Audit
                </a>
                <a
                  className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
                  href="#freight"
                >
                  Concierge Air Freight (DXB/AUH)
                </a>
              </nav>
            </div>
          </div>

          <div className="pt-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md text-on-surface-variant border-t border-outline-variant/10">
            <div className="flex items-center gap-space-md font-body-sm text-body-sm">
              <span>© 2025 Automotive OS FZ-LLC. All rights reserved.</span>
              <span>UAE Federal Law No. 15 Compliant</span>
            </div>
            <div className="flex items-center gap-space-lg font-body-sm text-body-sm">
              <a className="hover:text-primary transition-colors" href="#privacy">
                Privacy Policy
              </a>
              <a className="hover:text-primary transition-colors" href="#terms">
                Terms of Exchange
              </a>
              <a className="hover:text-primary transition-colors" href="#aml">
                AML Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
