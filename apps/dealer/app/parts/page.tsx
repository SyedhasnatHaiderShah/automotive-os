'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { DealerSidebar } from '../../components/dealer-sidebar';
import { DealerHeader } from '../../components/dealer-header';
import { previewSafeMessage } from '../../lib/preview';
import {
  VERIFIED_PARTS_FIXTURE,
  PartsProcurementData,
  PartItem,
} from '../../lib/api';

export default function PartsAndProcurementPage() {
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [role] = useState<'PRINCIPAL' | 'SALES_REP'>('PRINCIPAL');
  const isRtl = locale === 'ar';

  const [partsData, setPartsData] = useState<PartsProcurementData>(VERIFIED_PARTS_FIXTURE);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarque, setSelectedMarque] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedHub, setSelectedHub] = useState<string>('ALL');
  const [demonstratorState, setDemonstratorState] = useState<'ALL' | 'LOW_STOCK' | 'INBOUND' | 'AUDIT'>('ALL');

  // Modals & User Feedback
  const [feedbackMessage, setFeedbackMessageState] = useState<string | null>(null);
  // Preview module: feedback never claims an external action happened.
  const setFeedbackMessage = (message: string | null) => setFeedbackMessageState(previewSafeMessage(message));
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [binIntakeModalOpen, setBinIntakeModalOpen] = useState(false);
  const [epcModalOpen, setEpcModalOpen] = useState(false);
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [selectedPartForAction, setSelectedPartForAction] = useState<PartItem | null>(null);
  const [bayanModalOpen, setBayanModalOpen] = useState(false);

  // New PO State
  const [newPoSupplier, setNewPoSupplier] = useState('Al Nabooda Automobiles');
  const [newPoSku, setNewPoSku] = useState('#SKU-POR-992-BRK');
  const [newPoQty, setNewPoQty] = useState(2);
  const [newPoCost, setNewPoCost] = useState(24500);
  const [newPoCustomsRoute, setNewPoCustomsRoute] = useState('DWC Free Zone Bonded Terminal');

  // Stock Allocation State
  const [allocRoNumber, setAllocRoNumber] = useState('RO-4094');
  const [allocQty, setAllocQty] = useState(1);
  const [allocTechnician, setAllocTechnician] = useState('Tariq M. (Master Tech)');

  // Barcode / EPC Lookup State
  const [epcVinInput, setEpcVinInput] = useState('WP0AF2A97RS192841');
  const [epcLookupResult, setEpcLookupResult] = useState<string | null>(null);

  // Audit Stocktake Mode State
  const [auditVerifiedSkus, setAuditVerifiedSkus] = useState<Record<string, boolean>>({});

  // Filter parts based on search, marque, category, hub, and demonstrator mode
  const filteredParts = useMemo(() => {
    return partsData.parts.filter((part) => {
      // Demonstrator state filtering
      if (demonstratorState === 'LOW_STOCK' && part.status !== 'LOW_STOCK') {
        return false;
      }
      if (demonstratorState === 'INBOUND' && part.status !== 'ON_ORDER' && !part.inboundPoRef) {
        return false;
      }

      // Marque filter
      if (selectedMarque !== 'ALL' && part.marque !== selectedMarque) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && part.category !== selectedCategory) {
        return false;
      }

      // Hub / Zone filter
      if (selectedHub !== 'ALL') {
        if (selectedHub === 'VAULT' && !part.zoneName.includes('Vault')) return false;
        if (selectedHub === 'AISLE_B' && !part.binLocation.includes('B-')) return false;
        if (selectedHub === 'TYRE' && !part.binLocation.includes('C-')) return false;
        if (selectedHub === 'DRUM' && !part.binLocation.includes('D-')) return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchSku = part.sku.toLowerCase().includes(query);
        const matchOem = part.oemCode.toLowerCase().includes(query);
        const matchName = part.name.toLowerCase().includes(query);
        const matchSub = part.subDescription.toLowerCase().includes(query);
        const matchBin = part.binLocation.toLowerCase().includes(query);
        if (!matchSku && !matchOem && !matchName && !matchSub && !matchBin) {
          return false;
        }
      }

      return true;
    });
  }, [partsData.parts, searchQuery, selectedMarque, selectedCategory, selectedHub, demonstratorState]);

  // Handlers
  const handleCreatePo = () => {
    setPoModalOpen(false);
    const generatedPo = `PO-2025-${Math.floor(1000 + Math.random() * 9000)}`;
    setFeedbackMessage(
      isRtl
        ? `تم إنشاء أمر الشراء ${generatedPo} بنجاح لدى المورد (${newPoSupplier}) بقيمة ${(newPoCost * newPoQty).toLocaleString()} درهم وتم ربط البيان الجمركي.`
        : `Purchase Order ${generatedPo} successfully submitted to ${newPoSupplier} for AED ${(newPoCost * newPoQty).toLocaleString()}. Customs clearance initiated.`
    );
  };

  const handleReceiveIntake = () => {
    setBinIntakeModalOpen(false);
    setFeedbackMessage(
      isRtl
        ? `تم مسح واستلام شحنة بيان جمركي #BAY-98124 وإيداع الأصناف في أرفف التخزين المخصصة بنجاح.`
        : `Stock consignment #BAY-98124 received and verified into climate-controlled bin locations.`
    );
  };

  const handleAllocateRo = () => {
    if (!selectedPartForAction) return;
    setAllocateModalOpen(false);
    setPartsData((prev) => ({
      ...prev,
      parts: prev.parts.map((p) => {
        if (p.id === selectedPartForAction.id) {
          const newAvail = Math.max(0, p.availableQty - allocQty);
          const newRes = p.reservedQty + allocQty;
          return {
            ...p,
            availableQty: newAvail,
            reservedQty: newRes,
            reservedRef: allocRoNumber,
          };
        }
        return p;
      }),
    }));

    setFeedbackMessage(
      isRtl
        ? `تم تخصيص عدد ${allocQty} من (${selectedPartForAction.name}) بنجاح لأمر الإصلاح ${allocRoNumber} تحت إشراف ${allocTechnician}.`
        : `Allocated ${allocQty} unit(s) of ${selectedPartForAction.name} to Repair Order ${allocRoNumber} (${allocTechnician}).`
    );
  };

  const handle1TapReorder = (part: PartItem) => {
    const poNum = `#2025-PO-${Math.floor(3000 + Math.random() * 500)}`;
    setPartsData((prev) => ({
      ...prev,
      parts: prev.parts.map((p) =>
        p.id === part.id ? { ...p, status: 'ON_ORDER', inboundPoRef: poNum } : p
      ),
    }));
    setFeedbackMessage(
      isRtl
        ? `تم إطلاق إعادة الطلب التلقائية بنقرة واحدة للقطعة ${part.sku} عبر أمر الشراء السريع ${poNum}.`
        : `1-Tap Reorder dispatched for ${part.sku}. Expedited PO ${poNum} lodged with Tier-1 vendor.`
    );
  };

  const handleToggleAudit = (partId: string) => {
    setAuditVerifiedSkus((prev) => ({
      ...prev,
      [partId]: !prev[partId],
    }));
  };

  return (
    <div
      className={`min-h-screen bg-surface font-body-md text-on-surface antialiased ${
        isRtl ? 'rtl' : 'ltr'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <DealerSidebar locale={locale} />

      <div className={isRtl ? 'pr-64 min-h-screen flex flex-col' : 'pl-64 min-h-screen flex flex-col'}>
        <DealerHeader
          locale={locale}
          onLocaleToggle={() => setLocale(locale === 'en' ? 'ar' : 'en')}
        />

        <main className="w-full pt-16 bg-surface px-space-lg pb-space-xl flex-1">
          <div className="flex flex-col w-full">
            {/* Feedback Notification Banner */}
            {feedbackMessage && (
              <div className="mt-space-md mb-2 p-space-md rounded-xl bg-primary-container/20 border border-primary text-on-surface flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
                  <div>
                    <span className="font-headline-sm text-body-md font-semibold text-primary block">
                      {isRtl ? 'تم توثيق عملية المستودع والتوريد' : 'Parts & Procurement Ledger Updated'}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {feedbackMessage}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedbackMessage(null)}
                  className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-body-sm text-on-surface border border-white/[0.08]"
                >
                  {isRtl ? 'إغلاق' : 'Dismiss'}
                </button>
              </div>
            )}

            {/* P1 Specification Roadmap Header Notice */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-surface-container via-surface-container-high to-surface-container p-space-md my-space-md shadow-xl border border-white/[0.05]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md relative z-10">
                <div className="flex items-start gap-space-sm min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                    <span className="material-symbols-outlined text-primary text-[24px]">
                      precision_manufacturing
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-label-caps text-label-caps tracking-widest uppercase font-semibold">
                        [FUTURE ROADMAP • P1 SPECIFICATION — CONCEPT TEMPLATE]
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-data-mono-num text-body-sm">
                        REV-0.94 / PHASE 1 SPEC
                      </span>
                      <span className="text-on-surface-variant font-body-sm">
                        DED #612048 • SilberArrows Al Quoz Hub
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-snug">
                      {isRtl
                        ? 'نموذج مفهوم نظام الوكالة (المرحلة الأولى): مواصفات تفاعلية للتكامل مع الكتالوجات الإلكترونية EPC وتقييم المخزون وخلايا التخزين الدقيقة وأوامر الشراء المؤتمتة.'
                        : 'CONCEPT TEMPLATE ONLY: Phase 1 Dealership Management System Roadmap. Interactive specification mockups for EPC integration, inventory valuation, physical bin matrix & automated PO purchasing.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-space-sm shrink-0">
                  <div className="hidden sm:flex flex-col text-right pr-space-sm">
                    <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider">
                      {isRtl ? 'تكامل مواصفات الخليج' : 'GCC Spec Integration'}
                    </span>
                    <span className="font-data-mono-num text-body-sm text-tertiary flex items-center justify-end gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                      RTA & UAE Customs Bayan
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBayanModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface hover:bg-surface-bright transition-colors font-body-sm text-body-sm flex items-center gap-1.5 border border-white/[0.08]"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">terminal</span>
                    <span>{isRtl ? 'مخطط DMS والبيان الجمركي' : 'DMS & Bayan Schema'}</span>
                  </button>
                </div>
              </div>
              <div className="absolute -right-8 -bottom-10 w-48 h-48 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            </div>

            {/* Breadcrumbs & Quick Execution Strip */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg">
              <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
                <span className="hover:text-on-surface cursor-pointer transition-colors">
                  {isRtl ? 'جناح إدارة الوكالة' : 'Dealership Suite'}
                </span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="hover:text-on-surface cursor-pointer transition-colors">
                  {isRtl ? 'خطة P1 المستقبلية' : 'Future DMS (P1)'}
                </span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-semibold">
                  {isRtl ? 'قطع الغيار والتوريد' : 'Parts & Procurement'}
                </span>
                <span className="font-label-caps text-label-caps uppercase px-1.5 py-0.5 rounded bg-surface-container-high text-primary/90 ml-1">
                  قطع الغيار والتوريد
                </span>
              </div>

              {/* Top Action CTA Toolbar */}
              <div className="flex flex-wrap items-center gap-space-xs">
                <button
                  type="button"
                  onClick={() => setPoModalOpen(true)}
                  className="px-space-md py-2.5 rounded-lg bg-primary-container text-on-primary-container font-headline-sm text-body-md font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                  <span>{isRtl ? 'إنشاء أمر شراء (PO)' : 'Create Purchase Order (PO)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBinIntakeModalOpen(true)}
                  className="px-space-md py-2.5 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors font-body-md text-body-md flex items-center gap-2 border border-white/[0.06] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-tertiary">qr_code_scanner</span>
                  <span>{isRtl ? 'استلام الشحنة / إدخال الرف' : 'Receive Stock / Bin Intake'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEpcModalOpen(true)}
                  className="px-space-md py-2.5 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors font-body-md text-body-md flex items-center gap-2 border border-white/[0.06] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary">document_scanner</span>
                  <span>{isRtl ? 'مسح الباركود / الكتالوج EPC' : 'Scan OEM Barcode / EPC'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDemonstratorState(demonstratorState === 'AUDIT' ? 'ALL' : 'AUDIT');
                    setFeedbackMessage(
                      demonstratorState === 'AUDIT'
                        ? (isRtl ? 'تم الخروج من وضع الجرد السنوي' : 'Exited Stocktake Audit Mode')
                        : (isRtl ? 'تم تفعيل وضع تدقيق الجرد السنوي. يمكنك مطابقة الكميات الفعلية.' : 'Stocktake Audit Mode active. Match physical bin counts against ledger.')
                    );
                  }}
                  className={`px-3 py-2.5 rounded-lg transition-colors font-body-md text-body-md border border-white/[0.06] cursor-pointer ${
                    demonstratorState === 'AUDIT'
                      ? 'bg-primary text-on-primary font-bold'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                  }`}
                  title={isRtl ? 'إجراء جرد وتدقيق المخزون' : 'Run Stocktake Audit'}
                >
                  <span className="material-symbols-outlined text-[18px]">inventory</span>
                </button>
              </div>
            </div>

            {/* Inventory Valuation & Operational KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg">
              {/* Card 1: Valuation */}
              <div className="p-space-lg rounded-xl bg-surface-container-low shadow-md relative overflow-hidden group hover:bg-surface-container transition-all border border-white/[0.04]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider font-semibold">
                    {isRtl ? 'تقييم المخزون (التكلفة)' : 'Inventory Valuation (Cost)'}
                  </span>
                  <span className="material-symbols-outlined text-[20px] text-primary">account_balance_wallet</span>
                </div>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="font-label-caps text-label-caps text-primary uppercase font-bold">AED</span>
                  <span className="font-data-currency-lg text-data-currency-lg text-on-surface font-bold">
                    {role === 'SALES_REP'
                      ? '••••••'
                      : partsData.valuation.inventoryCostAed.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm pt-2">
                  <span>{partsData.valuation.activeSkusCount.toLocaleString()} {isRtl ? 'رمز نشط' : 'Active SKUs'}</span>
                  <span className="text-tertiary font-data-mono-num flex items-center gap-0.5 font-semibold">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span> +{partsData.valuation.momGrowthPct}% MoM
                  </span>
                </div>
                <div className="w-full h-1 bg-surface-container-highest rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${partsData.valuation.costCapacityPct}%` }} />
                </div>
              </div>

              {/* Card 2: Low Stock */}
              <div className="p-space-lg rounded-xl bg-surface-container-low shadow-md relative overflow-hidden group hover:bg-surface-container transition-all border border-white/[0.04]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider font-semibold">
                    {isRtl ? 'حد إعادة الطلب الحرج' : 'Critical Reorder Threshold'}
                  </span>
                  <span className="material-symbols-outlined text-[20px] text-error">warning</span>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-data-currency-lg text-data-currency-lg text-error font-bold">
                    {partsData.valuation.belowSafetyMinCount}
                  </span>
                  <span className="font-body-md text-body-md text-on-surface-variant">
                    {isRtl ? 'أصناف دون حد الأمان' : 'SKUs Below Safety Min'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm pt-2">
                  <span>{partsData.valuation.criticalNotes}</span>
                  <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-caps text-label-caps uppercase font-bold">
                    {isRtl ? 'إجراء عاجل' : 'Immediate Action'}
                  </span>
                </div>
                <div className="w-full h-1 bg-surface-container-highest rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-error" style={{ width: '28%' }} />
                </div>
              </div>

              {/* Card 3: Open POs */}
              <div className="p-space-lg rounded-xl bg-surface-container-low shadow-md relative overflow-hidden group hover:bg-surface-container transition-all border border-white/[0.04]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider font-semibold">
                    {isRtl ? 'الشحنات القادمة (جوي / منطقة حرة)' : 'Inbound Shipments (Air / Bonded)'}
                  </span>
                  <span className="material-symbols-outlined text-[20px] text-secondary">flight_land</span>
                </div>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="font-label-caps text-label-caps text-secondary uppercase font-bold">AED</span>
                  <span className="font-data-currency-lg text-data-currency-lg text-on-surface font-bold">
                    {partsData.valuation.inboundShipmentsAed.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm pt-2">
                  <span>{partsData.valuation.openPoConsignmentsCount} {isRtl ? 'إرساليات مفتوحة' : 'Open PO Consignments'}</span>
                  <span className="font-data-mono-num text-secondary font-semibold">ETA 24-72h</span>
                </div>
                <div className="w-full h-1 bg-surface-container-highest rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-secondary" style={{ width: '60%' }} />
                </div>
              </div>

              {/* Card 4: First Pick Fill Rate */}
              <div className="p-space-lg rounded-xl bg-surface-container-low shadow-md relative overflow-hidden group hover:bg-surface-container transition-all border border-white/[0.04]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider font-semibold">
                    {isRtl ? 'معدل تلبية الطلب من أول اختيار' : 'First-Pick Fill Rate (ROs)'}
                  </span>
                  <span className="material-symbols-outlined text-[20px] text-tertiary">task_alt</span>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-data-currency-lg text-data-currency-lg text-tertiary font-data-mono-num font-bold">
                    {partsData.valuation.firstPickFillRatePct}%
                  </span>
                  <span className="font-body-sm text-body-sm text-tertiary font-medium">
                    {isRtl ? 'الهدف ≥95%' : 'Benchmark ≥95%'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm pt-2">
                  <span>{isRtl ? 'ورشة العمل منصات 1–8' : 'Workshop Bays 1–8'}</span>
                  <span className="font-data-mono-num text-on-surface font-semibold">
                    {isRtl ? `متوسط ${partsData.valuation.avgDrawMinutes} دقيقة` : `Avg ${partsData.valuation.avgDrawMinutes} min draw`}
                  </span>
                </div>
                <div className="w-full h-1 bg-surface-container-highest rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-tertiary" style={{ width: `${partsData.valuation.firstPickFillRatePct}%` }} />
                </div>
              </div>
            </div>

            {/* Main Workstation Layout: 8 cols Data Matrix + 4 cols Procurement Drawer */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start mb-space-lg">
              {/* LEFT PANEL: Main Stock Matrix & Filtering (8 cols) */}
              <div className="xl:col-span-8 flex flex-col gap-space-md">
                {/* Search, Marque Switcher & Dense Filter Bar */}
                <div className="p-space-md rounded-xl bg-surface-container-low shadow-md flex flex-col gap-space-sm border border-white/[0.04]">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-sm">
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                        search
                      </span>
                      <input
                        className="w-full h-11 pl-10 pr-10 rounded-lg bg-surface-container text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary shadow-inner border border-white/[0.06]"
                        id="parts-search-input"
                        placeholder={
                          isRtl
                            ? 'ابحث حسب رمز SKU، رقم القطعة OEM، الوصف، أو توافق شاسيه VIN...'
                            : 'Search by SKU, OEM Part #, Description, VIN fitment...'
                        }
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      )}
                    </div>

                    {/* Quick Marque Badges */}
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                      <button
                        type="button"
                        onClick={() => setSelectedMarque('ALL')}
                        className={`px-3 py-2 rounded-lg font-headline-sm text-body-sm font-semibold whitespace-nowrap shadow-sm transition-colors ${
                          selectedMarque === 'ALL'
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                        }`}
                      >
                        {isRtl ? 'جميع العلامات' : 'All Marques'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedMarque('Porsche')}
                        className={`px-3 py-2 rounded-lg transition-colors font-body-sm text-body-sm whitespace-nowrap ${
                          selectedMarque === 'Porsche'
                            ? 'bg-primary text-on-primary font-bold'
                            : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                        }`}
                      >
                        Porsche (840)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedMarque('Ferrari')}
                        className={`px-3 py-2 rounded-lg transition-colors font-body-sm text-body-sm whitespace-nowrap ${
                          selectedMarque === 'Ferrari'
                            ? 'bg-primary text-on-primary font-bold'
                            : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                        }`}
                      >
                        Ferrari (285)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedMarque('Mercedes-AMG')}
                        className={`px-3 py-2 rounded-lg transition-colors font-body-sm text-body-sm whitespace-nowrap ${
                          selectedMarque === 'Mercedes-AMG'
                            ? 'bg-primary text-on-primary font-bold'
                            : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                        }`}
                      >
                        Mercedes-AMG (210)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedMarque('Aston Martin')}
                        className={`px-3 py-2 rounded-lg transition-colors font-body-sm text-body-sm whitespace-nowrap ${
                          selectedMarque === 'Aston Martin'
                            ? 'bg-primary text-on-primary font-bold'
                            : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                        }`}
                      >
                        Aston Martin (85)
                      </button>
                    </div>
                  </div>

                  {/* Secondary Filter Pills Row */}
                  <div className="flex flex-wrap items-center justify-between gap-space-sm pt-2 text-on-surface-variant text-body-sm">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant mr-1 font-semibold">
                        {isRtl ? 'الفئات:' : 'Categories:'}
                      </span>
                      {[
                        { label: isRtl ? 'المكابح (32)' : 'Brakes (32)', val: 'Brakes' },
                        { label: isRtl ? 'المحرك وناقل الحركة (114)' : 'Powertrain (114)', val: 'Powertrain' },
                        { label: isRtl ? 'الكربون والانسيابية (68)' : 'Aero & Carbon (68)', val: 'Aero & Carbon' },
                        { label: isRtl ? 'السوائل والمستهلكات (42)' : 'Fluids & Consumables (42)', val: 'Fluids & Consumables' },
                        { label: isRtl ? 'الأنظمة الكهربائية (84)' : 'Electrical (84)', val: 'Electrical' },
                      ].map((cat) => (
                        <button
                          type="button"
                          key={cat.val}
                          onClick={() => setSelectedCategory(selectedCategory === cat.val ? 'ALL' : cat.val)}
                          className={`px-2.5 py-1 rounded-md text-body-sm cursor-pointer transition-colors border border-white/[0.04] ${
                            selectedCategory === cat.val
                              ? 'bg-primary/20 text-primary font-semibold border-primary/40'
                              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold">
                        {isRtl ? 'الموقع بالمستودع:' : 'Hub Location:'}
                      </span>
                      <select
                        value={selectedHub}
                        onChange={(e) => setSelectedHub(e.target.value)}
                        className="bg-surface-container text-on-surface rounded-md px-2.5 py-1 font-body-sm text-body-sm focus:outline-none border border-white/[0.06]"
                      >
                        <option value="ALL">All Locations (Al Quoz Hub 1)</option>
                        <option value="AISLE_B">Aisle B (Ceramic & Chassis)</option>
                        <option value="TYRE">Aisle C (Tyres & Wheels)</option>
                        <option value="DRUM">Drum Bay D-01 (Fluids Area)</option>
                        <option value="VAULT">Vault Locker (Exotic Carbon)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Parts Inventory High-Density SKU Data Table */}
                <div className="rounded-xl bg-surface-container-low shadow-xl overflow-hidden flex flex-col border border-white/[0.04]">
                  <div className="p-space-md flex items-center justify-between bg-surface-container/40 border-b border-white/[0.05]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        format_list_bulleted
                      </span>
                      <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                        {isRtl ? 'مستودع قطع الغيار والمكونات' : 'Parts & Components Repository'}
                      </h3>
                      <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-data-mono-num text-body-sm">
                        {isRtl
                          ? `عرض ${filteredParts.length} من 1,420 صنف`
                          : `Showing ${filteredParts.length} of 1,420 items`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFeedbackMessage(
                            isRtl
                              ? 'تم تصدير تقرير المخزون المتوافق مع الهيئة الاتحادية للضرائب FTA بتنسيق CSV.'
                              : 'UAE FTA Tax compliant inventory audit report exported to CSV.'
                          )
                        }
                        className="p-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors border border-white/[0.05]"
                        title={isRtl ? 'تصدير لتدقيق ضريبة القيمة المضافة FTA' : 'Export CSV for UAE Tax / FTA Audit'}
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setFeedbackMessage(
                            isRtl
                              ? 'حاسبة هامش الأسعار المجمعة: تم تطبيق هامش الأرباح بنسبة +32.5% على كافة تسعيرات ورشة العمل.'
                              : 'Batch Margin Calculator active: +32.5% benchmark markup applied to repair order retail rates.'
                          )
                        }
                        className="p-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors border border-white/[0.05]"
                        title={isRtl ? 'حاسبة هامش الربح المجمع' : 'Batch Pricing Margin Calculator'}
                      >
                        <span className="material-symbols-outlined text-[18px]">calculate</span>
                      </button>
                    </div>
                  </div>

                  {/* Table Viewport */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-body-md text-body-md" id="parts-table">
                      <thead>
                        <tr className="bg-surface-container-lowest text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider border-b border-white/[0.04]">
                          <th className="py-3 px-space-md">
                            {isRtl ? 'رمز SKU / كود OEM / العلامة' : 'SKU / OEM Code / Marque'}
                          </th>
                          <th className="py-3 px-3">
                            {isRtl ? 'موقع الرف والحاوية' : 'Bin Location'}
                          </th>
                          <th className="py-3 px-3 text-center">
                            {isRtl ? 'مستوى المخزون' : 'Stock Levels'}
                          </th>
                          <th className="py-3 px-3 text-right">
                            {isRtl ? 'التكلفة (درهم)' : 'Cost (AED)'}
                          </th>
                          <th className="py-3 px-3 text-right">
                            {isRtl ? 'سعر أمر الإصلاح (درهم)' : 'RO Retail (AED)'}
                          </th>
                          <th className="py-3 px-3 text-center">
                            {isRtl ? 'الحالة' : 'Status'}
                          </th>
                          <th className="py-3 px-space-md text-right">
                            {isRtl ? 'الإجراء المباشر' : 'Direct Action'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container-highest/30">
                        {filteredParts.map((part) => {
                          const isLowStock = part.status === 'LOW_STOCK';
                          const isOnOrder = part.status === 'ON_ORDER';
                          const isAuditChecked = auditVerifiedSkus[part.id];

                          return (
                            <tr
                              key={part.id}
                              className={`hover:bg-surface-container/60 transition-colors ${
                                isLowStock
                                  ? 'bg-error/5'
                                  : isOnOrder
                                  ? 'bg-secondary/5'
                                  : ''
                              }`}
                            >
                              <td className="py-3 px-space-md">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`font-data-mono-num text-body-sm font-semibold ${
                                        isLowStock ? 'text-error' : isOnOrder ? 'text-secondary' : 'text-primary'
                                      }`}
                                    >
                                      {part.sku}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded font-label-caps text-label-caps ${
                                        isLowStock
                                          ? 'bg-error-container/20 text-error'
                                          : 'bg-surface-container-highest text-on-surface-variant'
                                      }`}
                                    >
                                      {part.oemCode}
                                    </span>
                                    {demonstratorState === 'AUDIT' && (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleAudit(part.id)}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                                          isAuditChecked
                                            ? 'bg-tertiary text-on-tertiary'
                                            : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                                        }`}
                                      >
                                        {isAuditChecked ? '✓ Audited' : 'Verify'}
                                      </button>
                                    )}
                                  </div>
                                  <span className="font-body-md text-on-surface font-medium truncate max-w-xs">
                                    {part.name}
                                  </span>
                                  <span
                                    className={`font-body-sm ${
                                      isOnOrder ? 'text-secondary' : 'text-on-surface-variant'
                                    }`}
                                  >
                                    {part.subDescription}
                                  </span>
                                </div>
                              </td>

                              <td className="py-3 px-3 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="font-data-mono-num text-body-sm text-secondary font-medium">
                                    {part.binLocation}
                                  </span>
                                  <span className="font-body-sm text-on-surface-variant">
                                    {part.zoneName}
                                  </span>
                                </div>
                              </td>

                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                <div className="inline-flex flex-col items-center">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`font-data-mono-num text-body-md font-semibold ${
                                        isLowStock
                                          ? 'text-error'
                                          : isOnOrder
                                          ? 'text-on-surface-variant'
                                          : 'text-on-surface'
                                      }`}
                                    >
                                      {part.stockOnHand}
                                    </span>
                                    <span
                                      className={`text-body-sm ${
                                        isLowStock ? 'text-error font-semibold' : 'text-on-surface-variant'
                                      }`}
                                    >
                                      {part.stockUnitLabel}
                                    </span>
                                  </div>
                                  <span
                                    className={`font-body-sm font-data-mono-num ${
                                      isLowStock
                                        ? 'text-on-surface-variant'
                                        : isOnOrder
                                        ? 'text-secondary font-medium'
                                        : part.reservedQty > 0
                                        ? 'text-secondary'
                                        : 'text-tertiary'
                                    }`}
                                  >
                                    {isOnOrder
                                      ? `1 On Order (ETA ${part.leadTimeDays || 3}d)`
                                      : isLowStock
                                      ? '1 avail • Safety Breach'
                                      : part.reservedQty > 0
                                      ? `${part.availableQty} avail • ${part.reservedQty} res (${part.reservedRef})`
                                      : `${part.availableQty} avail (0 res)`}
                                  </span>
                                </div>
                              </td>

                              <td className="py-3 px-3 text-right font-data-mono-num text-body-sm text-on-surface whitespace-nowrap">
                                {role === 'SALES_REP' ? (
                                  <span className="text-outline text-xs flex items-center justify-end gap-1" title="Confidential acquisition cost masked for sales reps">
                                    <span className="material-symbols-outlined text-[13px]">lock</span>
                                    ••••••
                                  </span>
                                ) : (
                                  part.costAed.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                )}
                              </td>

                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                <div className="flex flex-col items-end">
                                  <span className="font-data-mono-num text-body-sm text-primary font-semibold">
                                    {part.retailAed.toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </span>
                                  {role === 'SALES_REP' ? (
                                    <span className="font-label-caps text-label-caps text-outline">Standard Rate</span>
                                  ) : (
                                    <span className="font-label-caps text-label-caps text-tertiary">
                                      +{part.marginPct}% Margin
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                {isLowStock ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-body-sm text-body-sm font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-error" /> Low Stock
                                  </span>
                                ) : isOnOrder ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/15 text-secondary font-body-sm text-body-sm font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> On Order
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary/10 text-tertiary font-body-sm text-body-sm font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Optimal
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-space-md text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1">
                                  {isLowStock ? (
                                    <button
                                      type="button"
                                      onClick={() => handle1TapReorder(part)}
                                      className="px-2.5 py-1.5 rounded bg-primary text-on-primary font-headline-sm text-body-sm font-semibold hover:opacity-90 transition-colors shadow-sm cursor-pointer"
                                    >
                                      {isRtl ? 'إعادة طلب فوري' : '1-Tap Reorder'}
                                    </button>
                                  ) : isOnOrder ? (
                                    <button
                                      type="button"
                                      onClick={() => setBayanModalOpen(true)}
                                      className="px-2.5 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-secondary text-body-sm font-medium transition-colors cursor-pointer border border-white/[0.05]"
                                    >
                                      {isRtl ? 'تتبع بيان' : 'Track Bayan'}
                                    </button>
                                  ) : part.category === 'Fluids & Consumables' ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedPartForAction(part);
                                        setAllocateModalOpen(true);
                                      }}
                                      className="px-2.5 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-body-sm font-medium transition-colors cursor-pointer border border-white/[0.05]"
                                    >
                                      {isRtl ? 'صرف لترات' : 'Dispense Litres'}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedPartForAction(part);
                                        setAllocateModalOpen(true);
                                      }}
                                      className="px-2.5 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-body-sm font-medium transition-colors cursor-pointer border border-white/[0.05]"
                                      title={isRtl ? 'تخصيص لأمر إصلاح' : 'Allocate to Repair Order'}
                                    >
                                      {isRtl ? 'تخصيص RO' : 'Allocate RO'}
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewPoSku(part.sku);
                                      setNewPoCost(part.costAed);
                                      setPoModalOpen(true);
                                    }}
                                    className="p-1.5 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                                    title={isRtl ? 'إضافة إلى سلة التوريد' : 'Add to Reorder Cart'}
                                  >
                                    <span className="material-symbols-outlined text-[18px]">
                                      add_shopping_cart
                                    </span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer / Telemetry Bar */}
                  <div className="p-space-sm px-space-md bg-surface-container-lowest/80 flex flex-wrap items-center justify-between gap-space-sm text-on-surface-variant font-body-sm text-body-sm border-t border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-medium">
                        <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" /> EPC Live Sync Active
                      </span>
                      <span className="text-outline">|</span>
                      <span>
                        {isRtl
                          ? 'ضريبة القيمة المضافة: 5% المطبقة بدولة الإمارات على مسحوبات التجزئة'
                          : 'VAT Treatment: UAE Standard 5% Applicable on Retail Draw'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span>{isRtl ? 'صفحة 1 من 237' : 'Page 1 of 237'}</span>
                      <div className="inline-flex rounded-md shadow-sm">
                        <button
                          type="button"
                          className="px-2 py-1 rounded-l bg-surface-container hover:bg-surface-container-high text-on-surface border border-white/[0.05]"
                        >
                          {isRtl ? 'التالي' : 'Prev'}
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 rounded-r bg-surface-container hover:bg-surface-container-high text-on-surface border border-white/[0.05]"
                        >
                          {isRtl ? 'السابق' : 'Next'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Marque EPC Visual Teaser Card (Photo Rich) */}
                <div className="p-space-lg rounded-xl bg-surface-container-low shadow-md relative overflow-hidden flex flex-col md:flex-row items-center gap-space-lg border border-white/[0.04]">
                  <div className="w-full md:w-56 h-36 rounded-lg overflow-hidden shrink-0 relative bg-surface-container">
                    <Image
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6pUM7uTTIJe1806nZZnhp0jbNE_oSZ7Hcl2-h3oU8IxZihh1TpWseYlGMkwriCwjrkG22Gsx7Hi7kVnrTW5zdjbVdylgEGdM_aeTGX0oJRTAC4lad90D3fxHhL5PFsDVDRVTVyNPiZxsuEJFJmRmuXQUEyJkyP6AHow85FGfS4SS5UVTvGG9UNgMRxenCqdlaHkS-7HSfL7uHmb0UcZBRtIz0568z-OkpLUGGvhDw1QuUoCpbqSe_"
                      alt="Porsche 911 GT3 RS carbon-ceramic brake assembly and titanium suspension upright"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent pointer-events-none" />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 font-label-caps text-label-caps text-primary uppercase font-semibold">
                      {isRtl ? 'رسم بياني تشريحي EPC' : 'EPC Exploded Diagram'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-secondary text-[18px]">hub</span>
                      <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                        {isRtl
                          ? 'الاتصال المباشر مع شبكات الكتالوج الإلكتروني EPC للمصانع'
                          : 'Direct Factory EPC Microcat Connectivity'}
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant mb-space-sm leading-relaxed">
                      {isRtl
                        ? 'يتصل نظام الوكالة مباشرة بشبكات Porsche PET2 و Ferrari ModisCS و Mercedes WIS/ASRA. تمنع المطابقة اللحظية للأرقام البديلة أي أخطاء في صرف القطع لمنصات الصيانة.'
                        : 'Phase 1 DMS connects directly to Porsche PET2, Ferrari ModisCS, and Mercedes WIS/ASRA networks. Real-time superseded part number reconciliation prevents incorrect shop bay draws.'}
                    </p>
                    <div className="flex flex-wrap items-center gap-space-md text-body-sm text-on-surface-variant font-data-mono-num">
                      <span className="flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                        {isRtl ? 'فك تشفير VIN إلى SKU آلياً' : 'Automated VIN-to-SKU Decoding'}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                        {isRtl ? 'تغذية مستودعات المنطقة الحرة DWC الحية' : 'Real-time DWC Bonded Warehouse Feeds'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT PANEL: Inbound PO Procurement Drawer & Vendor SLA (4 cols) */}
              <div className="xl:col-span-4 flex flex-col gap-space-md">
                {/* Active Inbound Consignment Card */}
                <div className="rounded-xl bg-surface-container-low shadow-xl overflow-hidden border border-white/[0.04]">
                  <div className="p-space-md bg-surface-container/60 flex items-center justify-between border-b border-white/[0.05]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[20px]">
                        local_shipping
                      </span>
                      <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                        {isRtl ? 'الشحنة الواردة النشطة' : 'Active Inbound Shipment'}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-label-caps text-label-caps uppercase font-semibold">
                      {isRtl ? 'بيان مخلّص مسبقاً' : 'Bayan Pre-Cleared'}
                    </span>
                  </div>

                  <div className="p-space-md flex flex-col gap-space-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-data-mono-num text-body-sm text-primary font-semibold">
                          {partsData.inboundShipment.poNumber}
                        </span>
                        <div className="font-body-md text-on-surface font-semibold mt-0.5">
                          {partsData.inboundShipment.supplierName}
                        </div>
                        <div className="font-body-sm text-on-surface-variant">
                          {partsData.inboundShipment.hubLocation}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-medium">
                          {isRtl ? 'القيمة الإجمالية' : 'Total Value'}
                        </span>
                        <div className="font-data-mono-num text-body-lg text-on-surface font-bold">
                          AED {partsData.inboundShipment.totalValueAed.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Customs Clearance Badge Box */}
                    <div className="p-space-sm rounded-lg bg-surface-container flex flex-col gap-1 border border-white/[0.04]">
                      <div className="flex items-center justify-between text-body-sm">
                        <span className="text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-tertiary">shield</span>
                          {isRtl ? 'رقم بيان الجمارك الاتحادية:' : 'UAE Federal Customs Bayan Ref:'}
                        </span>
                        <span className="font-data-mono-num text-on-surface font-semibold">
                          {partsData.inboundShipment.bayanRef}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-body-sm">
                        <span className="text-on-surface-variant">
                          {isRtl ? 'موعد الوصول المتوقع للرصيف:' : 'Estimated Dock Arrival:'}
                        </span>
                        <span className="font-body-sm text-tertiary font-semibold">
                          {partsData.inboundShipment.etaDescription}
                        </span>
                      </div>
                      <div className="font-body-sm text-on-surface-variant text-[11px] pt-1">
                        {partsData.inboundShipment.logisticsCarrier}
                      </div>
                    </div>

                    {/* Inbound Manifest Preview */}
                    <div className="flex flex-col gap-1.5 pt-1">
                      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold">
                        {isRtl
                          ? `أبرز بنود البيان (${partsData.inboundShipment.lineItemCount} بنود):`
                          : `Manifest Highlights (${partsData.inboundShipment.lineItemCount} Lines):`}
                      </span>
                      {partsData.inboundShipment.manifestHighlights.map((line) => (
                        <div
                          key={line.oemCode}
                          className="flex items-center justify-between p-2 rounded bg-surface-container/40 text-body-sm border border-white/[0.03]"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-body-sm text-on-surface font-medium truncate">
                              {line.title}
                            </div>
                            <div className="text-on-surface-variant text-[11px] font-data-mono-num">
                              {line.units} {line.unitLabel} • {line.oemCode}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-tertiary/15 text-tertiary font-label-caps text-label-caps uppercase font-bold">
                            {isRtl ? 'تم التحقق' : 'Verified'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Inbound Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFeedbackMessage(
                            isRtl
                              ? 'تم عرض بوليصة الشحن وتفاصيل التعبئة لـ PO #2025-PO-0428.'
                              : 'Packing slip and customs manifests loaded for PO #2025-PO-0428.'
                          )
                        }
                        className="py-2 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-body-sm font-semibold transition-colors flex items-center justify-center gap-1 border border-white/[0.05] cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                        <span>{isRtl ? 'بوليصة الشحن' : 'Packing Slip'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBinIntakeModalOpen(true)}
                        className="py-2 px-3 rounded-lg bg-tertiary text-on-tertiary font-semibold text-body-sm hover:opacity-90 transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                        <span>{isRtl ? 'مسح رمز الاستلام' : 'Scan Intake QR'}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setBayanModalOpen(true)}
                      className="w-full py-1.5 text-center text-error hover:text-error/80 font-body-sm text-body-sm transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">flag</span>
                      <span>{isRtl ? 'الإبلاغ عن فارق جمركي أو نقص بالبنود' : 'Flag Customs or Line Discrepancy'}</span>
                    </button>
                  </div>
                </div>

                {/* Automated Replenishment & Authorized UAE Agency Vendors */}
                <div className="rounded-xl bg-surface-container-low shadow-xl p-space-md flex flex-col gap-space-sm border border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        verified_user
                      </span>
                      <h4 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                        {isRtl ? 'الموردون المعتمدون من الفئة الأولى' : 'Tier-1 Agency Vendors'}
                      </h4>
                    </div>
                    <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold">
                      {isRtl ? 'اتفاقية مستوى الخدمة' : 'UAE SLA'}
                    </span>
                  </div>

                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    {isRtl
                      ? 'تطلق خوارزميات التوريد المؤتمتة طلبات الإرسال بناءً على أوامر إصلاح ورشة العمل (RO) الحالية ومواعيد تجارب القيادة المجدولة.'
                      : 'Automated purchasing algorithms trigger dispatch requests based on current workshop repair orders (RO) & scheduled test drives.'}
                  </p>

                  {/* Vendor Items */}
                  {partsData.agencyVendors.map((vendor) => (
                    <div
                      key={vendor.id}
                      className="p-space-sm rounded-lg bg-surface-container/60 hover:bg-surface-container transition-colors flex items-center justify-between border border-white/[0.03]"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-body-md text-on-surface font-semibold">{vendor.name}</span>
                          <span className={`px-1 py-0.2 rounded font-label-caps text-[10px] font-bold ${vendor.marqueBadgeClass}`}>
                            {vendor.marque}
                          </span>
                        </div>
                        <div className="font-body-sm text-on-surface-variant text-[12px]">
                          {vendor.routeSla}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-data-mono-num text-tertiary text-body-sm font-bold">
                          {vendor.onTimeScore}
                        </div>
                        <div className="font-label-caps text-label-caps text-on-surface-variant">
                          {vendor.avgSlaDays}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Quick PO Creation Direct Link */}
                  <button
                    type="button"
                    onClick={() => {
                      setFeedbackMessage(
                        isRtl
                          ? 'تم تحميل 24 عقداً نشطاً مع الموردين المعتمدين في الإمارات (النابودة، الطاير، قرقاش، الفطيم، الكندي).'
                          : 'Viewing all 24 active Tier-1 UAE Agency vendor master procurement agreements.'
                      );
                    }}
                    className="w-full mt-1 py-2 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-body-sm text-body-sm font-semibold transition-colors flex items-center justify-center gap-1.5 border border-white/[0.05] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">receipt</span>
                    <span>
                      {isRtl ? 'عرض كافة عقود الموردين النشطة (24)' : 'View All 24 Active Vendor Contracts'}
                    </span>
                  </button>
                </div>

                {/* Workshop Bay Material Draw Mini Widget */}
                <div className="p-space-md rounded-xl bg-surface-container-low shadow-xl flex flex-col gap-space-xs border border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold">
                      {isRtl ? 'طلبات قطع الغيار لأوامر الإصلاح' : 'Active Repair Order Demands'}
                    </span>
                    <span className="material-symbols-outlined text-primary text-[18px]">build</span>
                  </div>
                  <div className="font-body-md text-on-surface font-medium">
                    {partsData.activeRoDemands.bays}: {partsData.activeRoDemands.jobTitle}
                  </div>
                  <div className="font-body-sm text-on-surface-variant">
                    {isRtl
                      ? `تم التعيين إلى ${partsData.activeRoDemands.technicianName} • تم تخصيص ${partsData.activeRoDemands.partsAllocatedCount} قطع، بانتظار مشبك مستشعر الفرامل الكربونية.`
                      : `Assigned to ${partsData.activeRoDemands.technicianName} • ${partsData.activeRoDemands.partsAllocatedCount} parts allocated, awaiting carbon brake sensor clip.`}
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-tertiary h-full rounded-full"
                      style={{ width: `${partsData.activeRoDemands.fillPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Interactive Demonstrator Dock / State Switcher */}
            <div className="sticky bottom-4 z-30 mx-auto max-w-3xl w-full p-2 rounded-2xl bg-surface-container-high/90 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-2 border border-outline-variant/30">
              <div className="flex items-center gap-2 pl-space-sm min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shrink-0" />
                <span className="font-label-caps text-label-caps uppercase text-on-surface font-semibold truncate">
                  {isRtl ? 'حالة النموذج التجريبي P1:' : 'P1 Prototype State:'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setDemonstratorState('ALL')}
                  className={`demo-state-btn px-3 py-1.5 rounded-lg font-headline-sm text-body-sm font-semibold whitespace-nowrap shadow-sm transition-colors cursor-pointer ${
                    demonstratorState === 'ALL'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                  }`}
                >
                  {isRtl ? 'المخزون الكامل' : 'Populated Inventory'}
                </button>

                <button
                  type="button"
                  onClick={() => setDemonstratorState('LOW_STOCK')}
                  className={`demo-state-btn px-3 py-1.5 rounded-lg transition-colors font-body-sm text-body-sm whitespace-nowrap cursor-pointer ${
                    demonstratorState === 'LOW_STOCK'
                      ? 'bg-primary text-on-primary font-bold shadow-sm'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                  }`}
                >
                  {isRtl ? 'المخزون المنخفض والحرج' : 'Low Stock & Urgent'}
                </button>

                <button
                  type="button"
                  onClick={() => setDemonstratorState('INBOUND')}
                  className={`demo-state-btn px-3 py-1.5 rounded-lg transition-colors font-body-sm text-body-sm whitespace-nowrap cursor-pointer ${
                    demonstratorState === 'INBOUND'
                      ? 'bg-primary text-on-primary font-bold shadow-sm'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                  }`}
                >
                  {isRtl ? 'الشحنات القادمة قيد التوريد' : 'Inbound PO Staging'}
                </button>

                <button
                  type="button"
                  onClick={() => setDemonstratorState('AUDIT')}
                  className={`demo-state-btn px-3 py-1.5 rounded-lg transition-colors font-body-sm text-body-sm whitespace-nowrap cursor-pointer ${
                    demonstratorState === 'AUDIT'
                      ? 'bg-primary text-on-primary font-bold shadow-sm'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                  }`}
                >
                  {isRtl ? 'تدقيق الجرد السنوي' : 'Annual Stocktake Audit'}
                </button>
              </div>

              <div className="pr-space-xs hidden sm:block">
                <button
                  type="button"
                  onClick={() =>
                    setFeedbackMessage(
                      isRtl
                        ? 'مواصفات P1: تكامل كامل مع الكتالوجات الإلكترونية، إدارة الخلايا والأرفف الذكية، وتتبع الشحنات مع الجمارك الاتحادية.'
                        : 'P1 Specification: Full EPC integration, smart bin matrix, and automated PO replenishment with Bayan customs sync.'
                    )
                  }
                  className="material-symbols-outlined text-on-surface-variant text-[20px] cursor-pointer hover:text-primary transition-colors"
                  title="Toggle Concept Specs Info"
                >
                  info
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* =========================================================================
          MODALS
      ========================================================================== */}

      {/* Modal 1: Create Purchase Order (PO) */}
      {poModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">
                  add_shopping_cart
                </span>
                <h3 className="font-headline-sm text-lg font-semibold text-on-surface">
                  {isRtl ? 'إنشاء أمر شراء جديد (PO)' : 'Create Purchase Order (PO)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPoModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 font-body-sm text-on-surface">
              <div>
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                  {isRtl ? 'المورد المعتمد' : 'Authorized Agency Vendor'}
                </label>
                <select
                  value={newPoSupplier}
                  onChange={(e) => setNewPoSupplier(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option>Al Nabooda Automobiles (Porsche Official)</option>
                  <option>Al Tayer Motors (Ferrari Official)</option>
                  <option>Gargash Enterprises (Mercedes-AMG Official)</option>
                  <option>Porsche AG Factory Logistics (Direct Stuttgart)</option>
                </select>
              </div>

              <div>
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                  {isRtl ? 'رمز الصنف / رقم القطعة' : 'Target SKU / OEM Part #'}
                </label>
                <input
                  type="text"
                  value={newPoSku}
                  onChange={(e) => setNewPoSku(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary font-data-mono-num"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                    {isRtl ? 'الكمية المطلوبة' : 'Order Quantity'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newPoQty}
                    onChange={(e) => setNewPoQty(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary font-data-mono-num"
                  />
                </div>
                <div>
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                    {isRtl ? 'سعر الوحدة المقدر (درهم)' : 'Est. Unit Cost (AED)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newPoCost}
                    onChange={(e) => setNewPoCost(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary font-data-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                  {isRtl ? 'مسار الشحن والجمارك' : 'Customs / Bayan Freight Route'}
                </label>
                <select
                  value={newPoCustomsRoute}
                  onChange={(e) => setNewPoCustomsRoute(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option>DWC Free Zone Bonded Terminal (Dubai)</option>
                  <option>Jebel Ali Port Terminal (Sea Freight FCL)</option>
                  <option>DXB Cargo Village (Air Express Bonded)</option>
                  <option>Direct Local GCC Courier (Same-Day Hub)</option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-surface-container/60 border border-white/[0.05] flex items-center justify-between">
                <span className="text-on-surface-variant">{isRtl ? 'إجمالي أمر الشراء:' : 'Total PO Commitment:'}</span>
                <span className="font-data-mono-num text-primary font-bold text-base">
                  AED {(newPoQty * newPoCost).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setPoModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-sm"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleCreatePo}
                className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-semibold font-body-sm text-sm hover:opacity-90 transition-opacity"
              >
                {isRtl ? 'اعتماد وإرسال أمر الشراء' : 'Confirm & Transmit PO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Receive Stock / Bin Intake */}
      {binIntakeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-[24px]">
                  qr_code_scanner
                </span>
                <h3 className="font-headline-sm text-lg font-semibold text-on-surface">
                  {isRtl ? 'استلام شحنة واردة وإدخال الرف' : 'Receive Consignment & Bin Intake'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBinIntakeModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 font-body-sm text-on-surface">
              <div className="p-3 rounded-lg bg-surface-container border border-white/[0.06] flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary font-data-mono-num">
                    PO #2025-PO-0428 • Porsche AG Logistics
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary text-xs font-bold uppercase">
                    Bayan Cleared
                  </span>
                </div>
                <span className="text-on-surface-variant text-xs">
                  UAE Customs Ref #BAY-98124 • DWC Bonded Terminal
                </span>
              </div>

              <div>
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                  {isRtl ? 'تحديد حاوية التخزين الفيزيائية' : 'Assign Destination Bin Location'}
                </label>
                <select className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary font-data-mono-num">
                  <option>Rack B-04-3 (Climate Supercar Vault)</option>
                  <option>Rack B-02-1 (Supercar Security Cage)</option>
                  <option>Bin C-01-Floor (Tyre Stack Bay 2)</option>
                  <option>Rack A-08-2 (Engine Subassembly Aisle)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block">
                  {isRtl ? 'مطابقة البنود المستلمة' : 'Incoming Line Items Verification'}
                </label>
                <div className="p-2.5 rounded bg-surface-container/60 flex items-center justify-between text-xs">
                  <span>GT3 RS Weissach Carbon Wing Uprights (2 Units)</span>
                  <span className="text-tertiary font-bold">✓ Barcode Matched</span>
                </div>
                <div className="p-2.5 rounded bg-surface-container/60 flex items-center justify-between text-xs">
                  <span>Titanium Roll Cage Bolt Kit (12 Kits)</span>
                  <span className="text-tertiary font-bold">✓ Seals Intact</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setBinIntakeModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-sm"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleReceiveIntake}
                className="px-4 py-2 rounded-lg bg-tertiary text-on-tertiary font-semibold font-body-sm text-sm hover:opacity-90 transition-opacity"
              >
                {isRtl ? 'تأكيد الاستلام وتحديث الرصيد' : 'Confirm Intake & Update Ledger'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Scan OEM Barcode / EPC Microcat Lookup */}
      {epcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[24px]">
                  document_scanner
                </span>
                <h3 className="font-headline-sm text-lg font-semibold text-on-surface">
                  {isRtl ? 'مسح الكتالوج الإلكتروني EPC ورمز VIN' : 'Factory EPC Microcat Lookup'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEpcModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 font-body-sm text-on-surface">
              <div>
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                  {isRtl ? 'رقم شاسيه المركبة (VIN) أو رقم القطعة OEM' : 'Vehicle VIN or OEM Part Code'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={epcVinInput}
                    onChange={(e) => setEpcVinInput(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary font-data-mono-num"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setEpcLookupResult(
                        `Decoded: Porsche 992 GT3 RS (2024 GCC Spec). Compatible Part: #992-351-409-G (Front Carbon Ceramic Rotor). No superseded advisory.`
                      );
                    }}
                    className="px-3 h-10 rounded-lg bg-secondary text-on-secondary font-bold text-xs hover:opacity-90 transition-opacity"
                  >
                    {isRtl ? 'بحث' : 'Query EPC'}
                  </button>
                </div>
              </div>

              {epcLookupResult ? (
                <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/30 text-on-surface flex flex-col gap-1.5">
                  <span className="font-bold text-secondary text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    Factory Match Confirmed (Porsche PET2)
                  </span>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {epcLookupResult}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-secondary/20 text-xs">
                    <span className="text-on-surface-variant">Bin Availability:</span>
                    <span className="text-tertiary font-bold font-data-mono-num">Rack B-04-3 (2 Available)</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-surface-container/50 border border-white/[0.04] text-center text-xs text-on-surface-variant">
                  {isRtl
                    ? 'أدخل رقم الشاسيه أو امسح الباركود للتحقق الفوري من التوافق وتفاصيل الكتالوج'
                    : 'Enter VIN or barcode to query live microcat compatibility, exploded schematics and superseded part supersessions.'}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setEpcModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-sm"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Allocate to Repair Order (RO) */}
      {allocateModalOpen && selectedPartForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">
                  build
                </span>
                <h3 className="font-headline-sm text-lg font-semibold text-on-surface">
                  {isRtl ? 'تخصيص قطعة لأمر إصلاح (RO)' : 'Allocate Part to Repair Order'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAllocateModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 font-body-sm text-on-surface">
              <div className="p-3 rounded-lg bg-surface-container border border-white/[0.05] flex flex-col gap-1">
                <span className="font-data-mono-num text-primary font-semibold text-xs">
                  {selectedPartForAction.sku}
                </span>
                <span className="font-semibold text-sm">{selectedPartForAction.name}</span>
                <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1">
                  <span>Bin: {selectedPartForAction.binLocation}</span>
                  <span className="font-data-mono-num font-semibold text-tertiary">
                    {selectedPartForAction.availableQty} Available
                  </span>
                </div>
              </div>

              <div>
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                  {isRtl ? 'بطاقة أمر الإصلاح (RO)' : 'Target Repair Order (RO)'}
                </label>
                <select
                  value={allocRoNumber}
                  onChange={(e) => setAllocRoNumber(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary font-data-mono-num"
                >
                  <option value="RO-4094">RO-4094 • 2024 Porsche 911 GT3 RS (Bay 01)</option>
                  <option value="RO-4098">RO-4098 • 2023 Ferrari 296 GTB (Bay 02)</option>
                  <option value="RO-4100">RO-4100 • 2024 Mercedes-AMG GT Black (Bay 04)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                    {isRtl ? 'الكمية المراد سحبها' : 'Quantity to Draw'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedPartForAction.availableQty || 1}
                    value={allocQty}
                    onChange={(e) => setAllocQty(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary font-data-mono-num"
                  />
                </div>
                <div>
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                    {isRtl ? 'الفني المستلم' : 'Technician Sign-off'}
                  </label>
                  <input
                    type="text"
                    value={allocTechnician}
                    onChange={(e) => setAllocTechnician(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setAllocateModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-sm"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleAllocateRo}
                className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-semibold font-body-sm text-sm hover:opacity-90 transition-opacity"
              >
                {isRtl ? 'تأكيد الصرف وحجز القطعة' : 'Confirm Draw & Allocate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Customs / Bayan Discrepancy & Schema */}
      {bayanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[24px]">
                  terminal
                </span>
                <h3 className="font-headline-sm text-lg font-semibold text-on-surface">
                  {isRtl ? 'تكامل البيان الجمركي ونظام DMS' : 'DMS & UAE Customs Bayan Interface'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBayanModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 font-body-sm text-on-surface">
              <div className="p-3 rounded-lg bg-surface-container font-data-mono-num text-xs flex flex-col gap-1 text-on-surface-variant">
                <div className="text-secondary font-bold">API Status: CONNECTED (Bayan UAE Customs Staging)</div>
                <div>Customs Broker: Transguard Bonded Logistics</div>
                <div>Active Consignment: #BAY-98124 (Porsche AG Logistics)</div>
                <div>Duty Status: 5% Customs Tariffs Pre-settled • Bonded Free Zone</div>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed">
                {isRtl
                  ? 'ملاحظة الامتثال: تتطلب عمليات الجمارك الحية والربط مع نظام البيان شهادة مشغل اقتصادي معتمد (AEO) وتفويض جمركي نشط لدى جمارك دبي.'
                  : 'Compliance Note: Production automated Bayan customs clearance requires an Authorized Economic Operator (AEO) certificate and active Dubai Customs broker gateway credentials per INTEGRATION_TRUTH_TABLE.md.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setBayanModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-sm"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
