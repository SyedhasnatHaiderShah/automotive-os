'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BuyerEnquiryItem, BUYER_ENQUIRIES_FIXTURE, revokeBuyerEnquiryGrant } from '../lib/api';

interface BuyerEnquiriesViewProps {
  initialEnquiries: BuyerEnquiryItem[];
}

export function BuyerEnquiriesView({ initialEnquiries }: BuyerEnquiriesViewProps) {
  const [enquiries, setEnquiries] = useState<BuyerEnquiryItem[]>(initialEnquiries);
  const [dossierState, setDossierState] = useState<'active' | 'empty' | 'cancelled' | 'complete'>('active');
  const [isInspectionOpen, setIsInspectionOpen] = useState(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isRtl, setIsRtl] = useState(false);

  // Chat message state
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'SYSTEM',
      text: 'May 18, 10:14 AM — Smart Contract Allocation Initialized under DIFC Rules',
      time: '10:14 AM',
    },
    {
      sender: 'DEALER',
      name: 'Tariq Mansoor',
      text: 'Salam Rashid. It is an honor. The GT3 RS (Chassis #DXB-911-RS) is officially earmarked for you. We just delivered the vehicle to Tasjeel Shamil Al Quoz for your scheduled 150-point technical audit.',
      time: '10:28 AM GST',
    },
    {
      sender: 'BUYER',
      name: 'Rashid Al Nuaimi',
      text: 'Thank you Tariq. Please ensure the paint thickness measurement log is uploaded directly to my portal before our Autodrome session tomorrow.',
      time: '10:45 AM GST',
    },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const activeLead = enquiries[0];

  const handleRevokeConsent = async () => {
    if (activeLead) {
      await revokeBuyerEnquiryGrant(activeLead.id);
      setDossierState('cancelled');
      setIsRevokeModalOpen(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'BUYER',
        name: 'Rashid Al Nuaimi',
        text: newMessage.trim(),
        time: 'Just now (Encrypted)',
      },
    ]);
    setNewMessage('');
  };

  const handleCancelSecondary = (id: string) => {
    setEnquiries((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'LOST',
              stageName: 'Data Wiped / Cancelled by Buyer',
              grant: { ...item.grant, revokedAt: new Date().toISOString() },
            }
          : item
      )
    );
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-[#101419] font-sans text-[#e0e2ea] antialiased selection:bg-[#d4af37] selection:text-[#101419] flex flex-col justify-between ${
        isRtl ? 'font-arabic' : ''
      }`}
    >
      {/* Top Header */}
      <header className="fixed top-0 w-full z-50 bg-[#101419]/90 backdrop-blur-xl border-b border-white/[0.07] shadow-lg">
        <div className="h-20 max-w-[1440px] mx-auto px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-[#262a30] border border-white/10 flex items-center justify-center text-[#d4af37] font-bold">
                AO
              </div>
              <div className="flex flex-col">
                <span className="text-base uppercase tracking-wider text-white font-semibold group-hover:text-[#d4af37] transition-colors">
                  Automotive<span className="text-[#d4af37]">.OS</span>
                </span>
                <span className="text-[11px] uppercase tracking-wider text-[#99907c]">
                  {isRtl ? 'منصة نخبة السيارات الإماراتية' : 'UAE Collector Exchange'}
                </span>
              </div>
            </Link>

            <div className="h-6 w-px bg-white/10 hidden lg:block"></div>

            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181c21] border border-white/[0.07] text-[#d0c5af]">
              <span className="text-[#d4af37] text-xs">📍</span>
              <span className="text-xs text-white">Dubai Hub</span>
              <span className="text-[10px] text-[#99907c] uppercase">DXB</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/cars" className="text-sm text-[#d0c5af] hover:text-white transition-colors py-2">
              Browse Stock
            </Link>
            <Link href="/cars" className="text-sm text-[#d0c5af] hover:text-white transition-colors py-2">
              Verified Dealers
            </Link>
            <span className="text-sm text-[#f2ca50] font-semibold py-2 border-b-2 border-[#d4af37]">
              Buyer Portal
            </span>
            <Link href="/compare" className="text-sm text-[#d0c5af] hover:text-white transition-colors py-2">
              Compare
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsRtl(!isRtl)}
              className="px-3 py-1.5 rounded-lg bg-[#181c21] border border-white/[0.07] text-[#d0c5af] hover:text-white text-xs font-semibold"
            >
              {isRtl ? 'EN' : 'العربية'}
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-[#d4af37] text-[#101419] flex items-center justify-center font-bold text-xs">
                RN
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-white">Rashid Al Nuaimi</span>
                <span className="text-[10px] text-[#d4af37] uppercase font-bold">VIP Collector</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="w-full pt-20 bg-[#101419] flex-1">
        <div className="flex flex-col w-full">
          {/* Interactive State Tabs Banner */}
          <div className="w-full bg-[#0a0e13] py-2.5 px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#99907c] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#58e7aa] animate-pulse"></span>
              <span>{isRtl ? 'حالة ملف التخصيص:' : 'Dossier Context:'}</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto p-1 bg-[#181c21] rounded-lg">
              <button
                type="button"
                onClick={() => setDossierState('active')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  dossierState === 'active'
                    ? 'bg-[#d4af37] text-[#101419] font-bold shadow-sm'
                    : 'text-[#d0c5af] hover:text-white'
                }`}
              >
                Active Progress
              </button>
              <button
                type="button"
                onClick={() => setDossierState('empty')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  dossierState === 'empty'
                    ? 'bg-[#d4af37] text-[#101419] font-bold shadow-sm'
                    : 'text-[#d0c5af] hover:text-white'
                }`}
              >
                Onboarding / Empty
              </button>
              <button
                type="button"
                onClick={() => setDossierState('cancelled')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  dossierState === 'cancelled'
                    ? 'bg-[#d4af37] text-[#101419] font-bold shadow-sm'
                    : 'text-[#d0c5af] hover:text-white'
                }`}
              >
                Data Revoked State
              </button>
              <button
                type="button"
                onClick={() => setDossierState('complete')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  dossierState === 'complete'
                    ? 'bg-[#d4af37] text-[#101419] font-bold shadow-sm'
                    : 'text-[#d0c5af] hover:text-white'
                }`}
              >
                RTA Title Transferred
              </button>
            </div>
          </div>

          {/* Main Container */}
          <div className="max-w-[1440px] mx-auto w-full px-6 lg:px-8 py-8 flex flex-col gap-8">
            {/* Top Breadcrumb & Sovereign Badges */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <nav className="flex items-center gap-2 text-xs text-[#99907c]">
                <Link href="/cars" className="hover:text-[#d4af37] transition-colors">
                  Buyer Portal
                </Link>
                <span>/</span>
                <span>Transactions & Allocations</span>
                <span>/</span>
                <span className="text-white font-medium">Enquiry Status Timeline</span>
              </nav>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#262a30] text-xs font-mono border border-white/5">
                  <span className="text-[#58e7aa]">🛡️</span>
                  <span>FAB ESCROW #ESC-89214</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#262a30] text-xs font-mono border border-white/5">
                  <span className="text-[#d4af37]">✓</span>
                  <span>UAE PASS VERIFIED</span>
                </div>
              </div>
            </div>

            {/* Editorial Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="flex flex-col gap-2 max-w-3xl">
                <div className="flex items-center gap-2 text-[#d4af37] text-xs uppercase tracking-widest font-semibold">
                  <span>🔒</span>
                  <span>Sovereign Protocol • Allocation Escrow Registry</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  Institutional Enquiry Timeline & Allocation Tracking
                </h1>
                <p className="text-lg text-[#d4af37]/90 font-light" dir="rtl">
                  مسار وتتبع طلبات الشراء والضمان البنكي المعتمد
                </p>
                <p className="text-sm text-[#d0c5af] leading-relaxed">
                  Monitor live dealership responses, Tasjeel inspection booking milestones, escrow deposits, and immutable RTA title release records with shielded buyer privacy.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-lg bg-[#262a30] hover:bg-[#31353b] text-white transition-colors text-xs font-medium flex items-center gap-2 border border-white/5"
                >
                  <span>🖨️</span>
                  <span>Export Legal Dossier</span>
                </button>
                <a
                  href="#communications-channel"
                  className="px-4 py-2.5 rounded-lg bg-[#d4af37] text-[#101419] font-bold text-xs hover:bg-[#f2ca50] transition-colors flex items-center gap-2 shadow-lg shadow-[#d4af37]/20"
                >
                  <span>💬</span>
                  <span>VIP Concierge Chat</span>
                </a>
              </div>
            </div>

            {/* CONDITIONAL RENDERING BASED ON DOSSIER STATE */}
            {dossierState === 'empty' ? (
              <div className="bg-[#181c21] rounded-2xl p-12 text-center border border-white/5 shadow-2xl flex flex-col items-center max-w-2xl mx-auto my-8">
                <span className="text-5xl mb-4">📭</span>
                <h3 className="text-xl font-bold text-white mb-2">No Active Vehicle Allocations</h3>
                <p className="text-sm text-[#99907c] mb-6 leading-relaxed">
                  You have not submitted any active VIP purchase inquiries. Browse our verified UAE dealer vault to request chassis allocations with escrow and RTA protection.
                </p>
                <Link
                  href="/cars"
                  className="px-6 py-3 rounded-xl bg-[#d4af37] text-[#101419] font-bold text-sm hover:bg-[#f2ca50] transition-all"
                >
                  Browse Verified Stock
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {/* Active Allocation Hero Card */}
                <div className="relative w-full rounded-2xl bg-[#1c2025] p-6 lg:p-8 shadow-2xl overflow-hidden border border-white/[0.07]">
                  {/* Ambient Glows */}
                  <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#d4af37]/10 blur-3xl pointer-events-none"></div>
                  <div className="absolute -left-24 -bottom-24 w-96 h-96 rounded-full bg-[#58e7aa]/10 blur-3xl pointer-events-none"></div>

                  <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start justify-between">
                    {/* Vehicle Visual & Price */}
                    <div className="w-full lg:w-5/12 flex flex-col gap-4">
                      <div className="relative rounded-xl overflow-hidden bg-[#0a0e13] aspect-[16/10] shadow-md group border border-white/5">
                        <img
                          src={activeLead?.listing.heroUrl || 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800'}
                          alt={activeLead?.listing.title || 'Vehicle'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#101419] via-transparent to-black/30"></div>

                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-[#0a0e13]/90 text-[#58e7aa] font-mono text-[10px] font-semibold flex items-center gap-1 border border-white/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#58e7aa]"></span>
                            {dossierState === 'cancelled'
                              ? 'DATA REVOKED'
                              : dossierState === 'complete'
                              ? 'RTA TITLE TRANSFERRED'
                              : 'ALLOCATED CUSTODY'}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-[#0a0e13]/90 text-white font-mono text-[10px] border border-white/10">
                            {activeLead?.listing.vinChassis || 'DXB-911-RS'}
                          </span>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                          <div>
                            <span className="text-[10px] text-[#99907c] uppercase tracking-wider block">
                              Agreed Transaction Price
                            </span>
                            <div className="flex items-baseline gap-1 text-[#d4af37] font-bold text-2xl">
                              <span className="text-xs">AED</span>
                              <span>
                                {activeLead?.listing.priceAed?.toLocaleString('en-US') || '1,420,000'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-[#58e7aa] uppercase tracking-wider block">
                              Down Payment Locked
                            </span>
                            <span className="font-mono text-xs text-white font-semibold">
                              20% (AED 284,000)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Micro Specs */}
                      <div className="grid grid-cols-3 gap-1 p-2 rounded-xl bg-[#181c21] text-center text-xs border border-white/5">
                        <div className="flex flex-col py-1">
                          <span className="text-[10px] text-[#99907c] uppercase">Powerhouse</span>
                          <span className="font-semibold text-white">518 HP • 4.0L</span>
                        </div>
                        <div className="flex flex-col py-1 border-x border-white/5">
                          <span className="text-[10px] text-[#99907c] uppercase">0-100 km/h</span>
                          <span className="font-semibold text-white">3.2 Seconds</span>
                        </div>
                        <div className="flex flex-col py-1">
                          <span className="text-[10px] text-[#99907c] uppercase">Origin / Spec</span>
                          <span className="font-semibold text-[#d4af37]">GCC Al Nabooda</span>
                        </div>
                      </div>
                    </div>

                    {/* Allocation Details & Privacy Shield */}
                    <div className="w-full lg:w-7/12 flex flex-col justify-between gap-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <span className="text-xs uppercase tracking-wider text-[#d4af37] font-semibold">
                              Active Verified Allocation
                            </span>
                            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                              {activeLead?.listing.title || '2024 Porsche 911 GT3 RS Clubsport'}
                            </h2>
                          </div>

                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#262a30] text-xs border border-white/5">
                            <span className="w-2 h-2 rounded-full bg-[#7bd0ff] animate-ping"></span>
                            <span className="text-[#7bd0ff] font-medium">
                              {dossierState === 'complete'
                                ? 'Stage 6 of 6 Completed'
                                : dossierState === 'cancelled'
                                ? 'Allocation Withdrawn'
                                : 'Stage 3 of 6 In Progress'}
                            </span>
                          </div>
                        </div>

                        {/* Dealership & Custodian Bar */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-[#181c21] border border-white/5">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#262a30] flex items-center justify-center text-lg text-[#d4af37] shrink-0">
                              🏢
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-white">
                                {activeLead?.listing.dealershipName || 'Apex GT Motors'}
                              </span>
                              <span className="text-xs text-[#99907c]">
                                DED License #984210 • Dubai Autodrome Paddock 3
                              </span>
                              <span className="text-xs text-[#d4af37] font-medium mt-1">
                                Rep: Tariq Mansoor (VIP Client Executive)
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#262a30] flex items-center justify-center text-lg text-[#7bd0ff] shrink-0">
                              🏛️
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-white">FAB Sovereign Vault</span>
                              <span className="text-xs text-[#99907c]">Central Bank of UAE Regulated Escrow</span>
                              <span className="font-mono text-xs text-white mt-1">
                                IBAN: AE94 0300 0000 8921 4010 9
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Shielded Buyer Privacy Card */}
                        <div className="p-4 rounded-xl bg-[#0a0e13]/80 border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37] shrink-0">
                              🛡️
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-white">
                                {dossierState === 'cancelled'
                                  ? 'Consent Revoked — Contact Details Purged from Dealer CRM'
                                  : 'Data Shielding Protocol Active (UAE PDPL Compliant)'}
                              </span>
                              <p className="text-xs text-[#99907c] max-w-xl mt-0.5 leading-relaxed">
                                {dossierState === 'cancelled'
                                  ? 'Your profile details and phone number have been purged from the dealership CRM under statutory erasure rules.'
                                  : 'Dealership received ONLY: Full Legal Name & Verified UAE Mobile (+971 50 ••••). Home address, Emirates ID, and banking telemetry remain shielded.'}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsTokenModalOpen(true)}
                            className="px-3 py-1.5 rounded-lg bg-[#262a30] text-[#d4af37] text-xs font-semibold hover:bg-[#31353b] transition-colors shrink-0 border border-white/5"
                          >
                            Inspect Access Token
                          </button>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2 text-xs text-[#99907c]">
                          <span>⏱️</span>
                          <span>Active Status SLA: Dealership bound to respond within 45 mins</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsInspectionOpen(!isInspectionOpen)}
                            className="px-4 py-2 rounded-lg bg-[#262a30] text-white hover:bg-[#31353b] transition-colors text-xs font-medium border border-white/5"
                          >
                            Telemetry Checklist
                          </button>

                          {dossierState !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => setIsRevokeModalOpen(true)}
                              className="px-4 py-2 rounded-lg bg-[#93000a]/40 hover:bg-[#93000a]/60 text-[#ffb4ab] transition-colors text-xs font-medium border border-[#ffb4ab]/20 flex items-center gap-1.5"
                            >
                              <span>✕</span>
                              <span>Withdraw Allocation</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Inspection Drawer */}
                {isInspectionOpen && (
                  <div className="bg-[#262a30] rounded-2xl p-6 border border-white/10 shadow-2xl flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl text-[#d4af37]">📋</span>
                        <div>
                          <h3 className="text-base font-bold text-white">Live Tasjeel Shamil Telemetry Stream</h3>
                          <p className="text-xs text-[#99907c]">
                            Chassis VIN: DXB-911-RS • Station: Al Quoz 4 Vault Bay #02
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsInspectionOpen(false)}
                        className="p-1 rounded text-[#99907c] hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-[#181c21] border border-white/5">
                        <div className="flex items-center justify-between text-xs text-[#58e7aa] font-semibold mb-1">
                          <span>Chassis & Frame</span>
                          <span>✓ Verified</span>
                        </div>
                        <span className="text-lg font-bold text-white block">0.00mm Distortion</span>
                        <span className="text-xs text-[#99907c]">Factory laser tolerance: 100% compliant</span>
                      </div>

                      <div className="p-4 rounded-xl bg-[#181c21] border border-white/5">
                        <div className="flex items-center justify-between text-xs text-[#58e7aa] font-semibold mb-1">
                          <span>ECU Over-Rev Log</span>
                          <span>✓ Verified</span>
                        </div>
                        <span className="text-lg font-bold text-white block">Zero Range 4-6</span>
                        <span className="text-xs text-[#99907c]">Engine operating strictly within track spec</span>
                      </div>

                      <div className="p-4 rounded-xl bg-[#181c21] border border-white/5">
                        <div className="flex items-center justify-between text-xs text-[#d4af37] font-semibold mb-1">
                          <span>Paint Film Gauge</span>
                          <span>110-125 µm</span>
                        </div>
                        <span className="text-lg font-bold text-white block">OEM Factory Spec</span>
                        <span className="text-xs text-[#99907c]">OEM Weissach Carbon package verified</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 1: Detailed Interactive Multi-Step Timeline */}
                <div className="flex flex-col gap-4 bg-[#1c2025] p-6 lg:p-8 rounded-2xl shadow-xl border border-white/[0.07]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs uppercase tracking-widest text-[#d4af37] font-semibold">
                        Sovereign Milestones
                      </span>
                      <h3 className="text-xl font-bold text-white mt-1">Allocation Progression & Audit Log</h3>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#99907c]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#58e7aa]"></span> Completed
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37] animate-pulse"></span> Active Stage
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#31353b]"></span> Upcoming
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Progress Stepper Bar */}
                  <div className="hidden lg:grid grid-cols-6 gap-3 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="h-2 w-full rounded-full bg-[#58e7aa]"></div>
                      <span className="text-[10px] text-[#58e7aa] uppercase font-semibold">01. Pass Validation</span>
                      <span className="text-xs text-white font-medium truncate">UAE PASS Verified</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="h-2 w-full rounded-full bg-[#58e7aa]"></div>
                      <span className="text-[10px] text-[#58e7aa] uppercase font-semibold">02. Dealer Ack</span>
                      <span className="text-xs text-white font-medium truncate">Slot Reserved</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div
                        className={`h-2 w-full rounded-full ${
                          dossierState === 'cancelled'
                            ? 'bg-[#93000a]'
                            : dossierState === 'complete'
                            ? 'bg-[#58e7aa]'
                            : 'bg-[#d4af37] shadow-[0_0_12px_rgba(212,175,55,0.5)]'
                        }`}
                      ></div>
                      <span className="text-[10px] text-[#d4af37] uppercase font-bold">03. Tasjeel Shamil</span>
                      <span className="text-xs text-[#d4af37] font-semibold truncate">
                        {dossierState === 'cancelled' ? 'Audit Terminated' : 'Vault Inspection'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div
                        className={`h-2 w-full rounded-full ${
                          dossierState === 'complete' ? 'bg-[#58e7aa]' : 'bg-[#31353b]'
                        }`}
                      ></div>
                      <span className="text-[10px] text-[#99907c] uppercase">04. Viewing</span>
                      <span className="text-xs text-[#99907c] truncate">Autodrome Track Test</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div
                        className={`h-2 w-full rounded-full ${
                          dossierState === 'complete' ? 'bg-[#58e7aa]' : 'bg-[#31353b]'
                        }`}
                      ></div>
                      <span className="text-[10px] text-[#99907c] uppercase">05. Escrow</span>
                      <span className="text-xs text-[#99907c] truncate">FAB Deposit Release</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div
                        className={`h-2 w-full rounded-full ${
                          dossierState === 'complete' ? 'bg-[#58e7aa]' : 'bg-[#31353b]'
                        }`}
                      ></div>
                      <span className="text-[10px] text-[#99907c] uppercase">06. RTA Title</span>
                      <span className="text-xs text-[#99907c] truncate">Digital Ownership Handover</span>
                    </div>
                  </div>

                  {/* Vertical Timeline Nodes */}
                  <div className="flex flex-col gap-3 pt-2">
                    {/* Node 1 */}
                    <div className="flex flex-col md:flex-row items-start gap-4 p-4 rounded-xl bg-[#181c21] border border-white/5">
                      <div className="flex items-center gap-3 md:w-64 shrink-0">
                        <div className="w-9 h-9 rounded-full bg-[#58e7aa]/20 text-[#58e7aa] flex items-center justify-center font-bold text-sm">
                          ✓
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#58e7aa] uppercase font-semibold">Stage 01 • Passed</span>
                          <span className="text-sm font-bold text-white">VIP Transmitted</span>
                        </div>
                      </div>
                      <div className="flex-1 text-xs text-[#d0c5af]">
                        Encrypted purchase interest dispatched through UAE PASS cryptographic auth key{' '}
                        <code className="font-mono text-[#d4af37]">#KEY-99420-UAEP</code>. Dealership accepted escrow terms under DIFC standard conditions.
                        <div className="flex items-center gap-3 text-[#99907c] font-mono mt-1">
                          <span>Timestamp: May 18, 2024 - 10:14:22 GST</span>
                          <span>•</span>
                          <span className="text-[#58e7aa]">✓ RTA Verified Buyer ID</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-[#262a30] text-[#58e7aa] text-[10px] uppercase font-bold shrink-0">
                        100% Immutable
                      </span>
                    </div>

                    {/* Node 2 */}
                    <div className="flex flex-col md:flex-row items-start gap-4 p-4 rounded-xl bg-[#181c21] border border-white/5">
                      <div className="flex items-center gap-3 md:w-64 shrink-0">
                        <div className="w-9 h-9 rounded-full bg-[#58e7aa]/20 text-[#58e7aa] flex items-center justify-center font-bold text-sm">
                          ✓
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#58e7aa] uppercase font-semibold">Stage 02 • Passed</span>
                          <span className="text-sm font-bold text-white">Slot Confirmed</span>
                        </div>
                      </div>
                      <div className="flex-1 text-xs text-[#d0c5af]">
                        Dealer representative Tariq Mansoor accepted session at Dubai Autodrome Club Circuit. Assigned vehicle chassis lock token{' '}
                        <code className="font-mono text-[#d4af37]">#LCK-911-002</code>.
                        <div className="flex items-center gap-3 text-[#99907c] font-mono mt-1">
                          <span>Timestamp: May 18, 2024 - 10:28:05 GST</span>
                          <span>•</span>
                          <span className="text-[#58e7aa]">✓ Dedicated Host Assigned</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-[#262a30] text-[#58e7aa] text-[10px] uppercase font-bold shrink-0">
                        Slot Reserved
                      </span>
                    </div>

                    {/* Node 3 */}
                    <div
                      className={`flex flex-col md:flex-row items-start gap-4 p-4 rounded-xl border ${
                        dossierState === 'cancelled'
                          ? 'bg-[#181c21] border-[#93000a]/30'
                          : dossierState === 'complete'
                          ? 'bg-[#181c21] border-white/5'
                          : 'bg-[#262a30] border-[#d4af37]/40 shadow-lg'
                      }`}
                    >
                      <div className="flex items-center gap-3 md:w-64 shrink-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                            dossierState === 'cancelled'
                              ? 'bg-[#93000a]/20 text-[#ffb4ab]'
                              : dossierState === 'complete'
                              ? 'bg-[#58e7aa]/20 text-[#58e7aa]'
                              : 'bg-[#d4af37]/20 text-[#d4af37]'
                          }`}
                        >
                          {dossierState === 'complete' ? '✓' : dossierState === 'cancelled' ? '✕' : '3'}
                        </div>
                        <div className="flex flex-col">
                          <span
                            className={`text-[10px] uppercase font-semibold ${
                              dossierState === 'cancelled'
                                ? 'text-[#ffb4ab]'
                                : dossierState === 'complete'
                                ? 'text-[#58e7aa]'
                                : 'text-[#d4af37]'
                            }`}
                          >
                            Stage 03 • {dossierState === 'cancelled' ? 'Revoked' : 'Active Stage'}
                          </span>
                          <span className="text-sm font-bold text-white">Tasjeel Shamil Lift Audit</span>
                        </div>
                      </div>
                      <div className="flex-1 text-xs text-[#d0c5af]">
                        Vehicle undergoing on-site laser chassis alignment, engine ECU diagnostic logs, and paint meter verification.
                        <div className="flex items-center gap-3 text-[#99907c] font-mono mt-1">
                          <span>Bay: Al Quoz 4 Vault Bay #02</span>
                          <span>•</span>
                          <span className="text-[#d4af37]">Live Telemetry Active</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-[#181c21] text-[#d4af37] text-[10px] uppercase font-bold shrink-0 border border-white/5">
                        In Progress
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lower Split Grid: Secondary Pipeline & Dealer Chat */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left: Concurrent Enquiries */}
                  <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-widest text-[#d4af37] font-semibold">
                          Secondary Pipeline
                        </span>
                        <h3 className="text-lg font-bold text-white">Concurrent Vehicle Requests</h3>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#262a30] text-xs font-mono text-[#d0c5af]">
                        2 Enquiries
                      </span>
                    </div>

                    {/* Secondary 1 */}
                    <div className="p-4 rounded-xl bg-[#1c2025] flex flex-col gap-3 shadow-md border border-white/5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                          <div className="w-14 h-14 rounded-lg bg-[#0a0e13] overflow-hidden shrink-0">
                            <img
                              src={BUYER_ENQUIRIES_FIXTURE[1]?.listing?.heroUrl || ''}
                              alt="Mercedes G 63"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white">2023 Mercedes-AMG G 63</span>
                            <span className="text-xs text-[#99907c]">SilberArrows Motors • Dubai</span>
                            <span className="font-mono text-xs text-[#d4af37] font-bold mt-1">AED 890,000</span>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#7bd0ff]/15 text-[#7bd0ff] text-[10px] uppercase font-bold shrink-0">
                          Awaiting Dealer SLA
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#99907c] pt-2 border-t border-white/5">
                        <span className="font-mono">⏱️ SLA response &lt; 2 hrs</span>
                        <button
                          type="button"
                          onClick={() => handleCancelSecondary(BUYER_ENQUIRIES_FIXTURE[1]?.id || '')}
                          className="text-[#ffb4ab] hover:text-[#ffdad6] font-medium transition-colors"
                        >
                          Cancel Enquiry
                        </button>
                      </div>
                    </div>

                    {/* Secondary 2: Cancelled & Data Wiped */}
                    <div className="p-4 rounded-xl bg-[#1c2025]/60 flex flex-col gap-3 shadow-sm border border-white/5 opacity-80">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                          <div className="w-14 h-14 rounded-lg bg-[#0a0e13] overflow-hidden shrink-0 grayscale">
                            <img
                              src={BUYER_ENQUIRIES_FIXTURE[2]?.listing?.heroUrl || ''}
                              alt="Defender 110"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-[#99907c] line-through">
                              2024 Defender 110 V8
                            </span>
                            <span className="text-xs text-[#99907c]">Premier Motors Abu Dhabi</span>
                            <span className="font-mono text-xs text-[#99907c] mt-1">AED 620,000</span>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#31353b] text-[#99907c] text-[10px] uppercase font-bold shrink-0">
                          Data Wiped
                        </span>
                      </div>
                      <div className="p-2 rounded bg-[#181c21] text-xs text-[#99907c] flex items-center gap-2">
                        <span className="text-[#58e7aa]">✓</span>
                        <span>Cancelled by Buyer • Identity Purged from Premier Motors CRM</span>
                      </div>
                    </div>

                    {/* Escrow Guarantee Box */}
                    <div className="p-4 rounded-xl bg-[#181c21] border border-white/5 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-[#d4af37] text-xs font-bold uppercase">
                        <span>🛡️</span>
                        <span>Zero-Obligation Escrow Guarantee</span>
                      </div>
                      <p className="text-xs text-[#99907c] leading-relaxed">
                        Every prospective vehicle allocation is backed by sovereign non-custodial protection. In the event of vehicle failure at Tasjeel or buyer withdrawal before final escrow agreement, your deposit is released within 60 seconds with zero dealer retention fees.
                      </p>
                    </div>
                  </div>

                  {/* Right: Dealer Communication Dossier & Chat Log */}
                  <div
                    id="communications-channel"
                    className="lg:col-span-7 flex flex-col gap-4 bg-[#1c2025] p-6 lg:p-8 rounded-2xl shadow-xl border border-white/[0.07]"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37] font-bold text-sm">
                          TM
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">Tariq Mansoor</span>
                            <span className="w-2 h-2 rounded-full bg-[#58e7aa]"></span>
                            <span className="text-[10px] text-[#58e7aa] uppercase font-bold">Online</span>
                          </div>
                          <span className="text-xs text-[#99907c]">
                            Apex GT Motors VIP Allocation Desk • Dubai
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => alert('Encrypted sovereign voice link requested.')}
                          className="p-2 rounded-lg bg-[#262a30] hover:bg-[#31353b] text-white text-xs border border-white/5"
                          title="Voice Call"
                        >
                          📞
                        </button>
                        <button
                          type="button"
                          onClick={() => alert('Document attachment portal opened.')}
                          className="p-2 rounded-lg bg-[#262a30] hover:bg-[#31353b] text-white text-xs border border-white/5"
                          title="Attach Document"
                        >
                          📎
                        </button>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#181c21] max-h-[360px] overflow-y-auto border border-white/5">
                      {chatMessages.map((msg, idx) => {
                        if (msg.sender === 'SYSTEM') {
                          return (
                            <div
                              key={idx}
                              className="self-center px-3 py-1 rounded-full bg-[#262a30] text-[#99907c] font-mono text-[11px] text-center"
                            >
                              {msg.text}
                            </div>
                          );
                        }

                        const isBuyer = msg.sender === 'BUYER';
                        return (
                          <div
                            key={idx}
                            className={`flex items-start gap-2 max-w-[85%] ${
                              isBuyer ? 'self-end flex-row-reverse' : 'self-start'
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                isBuyer
                                  ? 'bg-[#d4af37] text-[#101419]'
                                  : 'bg-[#262a30] text-[#d4af37]'
                              }`}
                            >
                              {isBuyer ? 'RN' : 'TM'}
                            </div>
                            <div className={`flex flex-col gap-1 ${isBuyer ? 'items-end' : ''}`}>
                              <div
                                className={`p-3 rounded-xl text-xs leading-relaxed shadow-sm ${
                                  isBuyer
                                    ? 'bg-[#d4af37] text-[#101419] font-medium rounded-tr-none'
                                    : 'bg-[#262a30] text-white rounded-tl-none'
                                }`}
                              >
                                {msg.text}
                              </div>
                              <span className="font-mono text-[10px] text-[#99907c]">{msg.time}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Live Message Input */}
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type an encrypted message to Tariq Mansoor..."
                        className="flex-1 px-4 py-2.5 rounded-lg bg-[#181c21] text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#d4af37] border border-white/5"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 rounded-lg bg-[#d4af37] text-[#101419] font-bold text-xs hover:bg-[#f2ca50] transition-colors shadow-md"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal: Withdraw Allocation & Revoke Consent */}
      {isRevokeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#181c21] w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-white/10 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-[#ffb4ab]">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-lg font-bold text-white">Withdraw Allocation & Purge Data</h3>
            </div>
            <p className="text-xs text-[#d0c5af] leading-relaxed">
              Are you sure you want to withdraw your inquiry for{' '}
              <strong className="text-white">2024 Porsche 911 GT3 RS Clubsport</strong>?
            </p>
            <div className="p-3 bg-[#0a0e13] rounded-lg text-xs text-[#99907c] space-y-1">
              <p>• Your holding escrow deposit (AED 284,000) will be released back to your bank within 60s.</p>
              <p>• Your legal name and contact phone will be immediately purged from Apex GT Motors CRM.</p>
              <p>• An immutable revocation receipt will be recorded in your buyer privacy audit log.</p>
            </div>
            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setIsRevokeModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#262a30] text-[#99907c] hover:text-white text-xs"
              >
                Keep Allocation
              </button>
              <button
                type="button"
                onClick={handleRevokeConsent}
                className="px-5 py-2 rounded-lg bg-[#93000a] text-white font-bold text-xs hover:bg-[#ba1a1a] transition-colors"
              >
                Confirm Revocation & Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Access Token Audit */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#181c21] w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-white/10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Encrypted Data Grant Token</h3>
              <button
                type="button"
                onClick={() => setIsTokenModalOpen(false)}
                className="text-[#99907c] hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-3 bg-[#0a0e13] rounded-lg font-mono text-xs text-[#58e7aa] space-y-1 overflow-x-auto">
              <p>Token ID: #TKN-9421-UAE-ENC</p>
              <p>Purpose: UAE_VEHICLE_INSPECTION_TESTDRIVE</p>
              <p>Granted Fields: [&quot;name&quot;, &quot;phone&quot;]</p>
              <p>Redacted Fields: [&quot;email&quot;, &quot;emirates_id&quot;, &quot;home_address&quot;, &quot;income&quot;]</p>
              <p>Statutory Law: UAE Federal Decree Law No. 45 of 2021</p>
              <p>Status: ACTIVE_PURPOSE_SCOPED</p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsTokenModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#262a30] text-white text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full bg-[#0a0e13] border-t border-white/[0.07] text-[#99907c] py-6 px-6 lg:px-8 text-xs text-center mt-12">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span>© 2025 Automotive OS FZ-LLC. Sovereign Buyer Privacy & Escrow Infrastructure.</span>
          <div className="flex items-center gap-6">
            <span>UAE PDPL Compliance</span>
            <span>Escrow Protocol Terms</span>
            <span>RTA Data Privacy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
