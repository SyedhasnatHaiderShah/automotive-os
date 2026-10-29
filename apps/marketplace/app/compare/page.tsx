'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MarketplaceHeader,
  MarketplaceFooter,
  Button,
  Badge,
} from '@automotive-os/ui';
import {
  fetchPublicListings,
  fetchPublicListingBySlug,
  PublicListingItem,
  PublicListingDetail,
  PORSCHE_GT3RS_DETAIL_FIXTURE,
} from '../../lib/api';

export default function VehicleComparisonPage() {
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [selectedEmirate, setSelectedEmirate] = useState('All Emirates');
  const [highlightDifferences, setHighlightDifferences] = useState(false);
  const [comparedVehicles, setComparedVehicles] = useState<PublicListingDetail[]>([]);
  const [availableListings, setAvailableListings] = useState<PublicListingItem[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [, setLoading] = useState(true);

  const isArabic = locale === 'ar';

  useEffect(() => {
    async function initComparison() {
      setLoading(true);
      // Fetch available listings from API
      const searchRes = await fetchPublicListings();
      setAvailableListings(searchRes.items);

      // Check query params for initial slugs to compare, e.g. ?slugs=porsche,toyota
      let initialSlugs: string[] = [];
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const slugsParam = params.get('slugs');
        if (slugsParam) {
          initialSlugs = slugsParam.split(',').filter(Boolean);
        }
      }

      if (initialSlugs.length === 0 && searchRes.items.length >= 2) {
        const first = searchRes.items[0];
        const second = searchRes.items[1];
        if (first?.slug && second?.slug) {
          initialSlugs = [first.slug, second.slug];
        }
      }

      const loadedDetails: PublicListingDetail[] = [];
      for (const slug of initialSlugs.slice(0, 4)) {
        const detail = await fetchPublicListingBySlug(slug);
        if (detail) {
          loadedDetails.push(detail);
        }
      }

      if (loadedDetails.length === 0) {
        loadedDetails.push(PORSCHE_GT3RS_DETAIL_FIXTURE);
      }

      setComparedVehicles(loadedDetails);
      setLoading(false);
    }

    initComparison();
  }, []);

  const removeVehicle = (id: string) => {
    setComparedVehicles((prev) => prev.filter((v) => v.id !== id));
  };

  const addVehicle = async (item: PublicListingItem) => {
    if (comparedVehicles.length >= 4) return;
    if (comparedVehicles.some((v) => v.id === item.id)) return;

    setLoading(true);
    const detail = await fetchPublicListingBySlug(item.slug);
    if (detail) {
      setComparedVehicles((prev) => [...prev, detail]);
    }
    setAddModalOpen(false);
    setLoading(false);
  };

  // Optimization (⚡ Bolt): Memoize isDifferent function so it isn't recreated on every render
  const isDifferent = useCallback((extractor: (v: PublicListingDetail) => any) => {
    if (comparedVehicles.length <= 1 || !comparedVehicles[0]) return false;
    const firstVal = extractor(comparedVehicles[0]);
    return comparedVehicles.some((v) => extractor(v) !== firstVal);
  }, [comparedVehicles]);

  // Print/PDF Handler
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Optimization (⚡ Bolt): Memoize comparisonAttributes structure to avoid recreating array, category objects,
  // render functions, and extractor functions on every state change (e.g., toggling highlightDifferences or opening modal).
  const comparisonAttributes = useMemo(() => [
    {
      category: isArabic ? 'نظرة عامة والأسعار' : 'Overview & Pricing',
      items: [
        {
          label: isArabic ? 'السعر المعلن' : 'Asking Price',
          render: (v: PublicListingDetail) => (
            <span className="font-data-currency-lg text-lg font-bold text-primary">
              AED {(Number(v.price.amountFils) / 100).toLocaleString()}
            </span>
          ),
          extractor: (v: PublicListingDetail) => v.price.amountFils,
        },
        {
          label: isArabic ? 'القسط الشهري التقديري' : 'Monthly Est. (Indicative)',
          render: (v: PublicListingDetail) => {
            const monthly = v.monthlyEstimateAed || Math.round((Number(v.price.amountFils) / 100) * 0.0175);
            return (
              <div>
                <span className="font-data-mono-num text-sm text-on-surface">
                  AED {monthly.toLocaleString()} / mo*
                </span>
                <span className="block text-[10px] text-outline/80 mt-0.5">
                  {isArabic ? '*تقدير استرشادي بدون عرض مصرفي' : '*Indicative only, subject to lender'}
                </span>
              </div>
            );
          },
          extractor: (v: PublicListingDetail) => v.monthlyEstimateAed,
        },
        {
          label: isArabic ? 'المعرض والوكيل' : 'Showroom / Dealer',
          render: (v: PublicListingDetail) => (
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-on-surface">
                {v.seller.displayName}
              </span>
              {v.seller.verified && (
                <span className="text-tertiary text-xs" title="KYB Verified">
                  ✓
                </span>
              )}
            </div>
          ),
          extractor: (v: PublicListingDetail) => v.seller.displayName,
        },
        {
          label: isArabic ? 'الإمارة' : 'Emirate',
          render: (v: PublicListingDetail) => (
            <span className="text-sm text-on-surface font-data-mono-num">
              {v.emirate}
            </span>
          ),
          extractor: (v: PublicListingDetail) => v.emirate,
        },
      ],
    },
    {
      category: isArabic ? 'المواصفات الفنية ومجموعة الحركة' : 'Technical & Powertrain',
      items: [
        {
          label: isArabic ? 'سنة الصنع' : 'Model Year',
          render: (v: PublicListingDetail) => (
            <span className="text-sm font-data-mono-num">{v.year}</span>
          ),
          extractor: (v: PublicListingDetail) => v.year,
        },
        {
          label: isArabic ? 'المسافة المقطوعة' : 'Mileage',
          render: (v: PublicListingDetail) => (
            <span className="text-sm font-data-mono-num">
              {v.mileageKm !== null ? `${v.mileageKm.toLocaleString()} km` : 'Brand New'}
            </span>
          ),
          extractor: (v: PublicListingDetail) => v.mileageKm,
        },
        {
          label: isArabic ? 'الحالة' : 'Condition',
          render: (v: PublicListingDetail) => (
            <Badge variant={v.condition === 'NEW' ? 'gold' : 'outline'}>
              {v.condition === 'NEW' ? (isArabic ? 'جديدة' : 'New') : isArabic ? 'مستعملة' : 'Used'}
            </Badge>
          ),
          extractor: (v: PublicListingDetail) => v.condition,
        },
        {
          label: isArabic ? 'المواصفات الإقليمية' : 'Regional Specs',
          render: (v: PublicListingDetail) => (
            <span className={`text-sm font-semibold ${v.gccSpec ? 'text-tertiary' : 'text-outline'}`}>
              {v.gccSpec ? 'GCC Spec ✓' : 'Non-GCC / Import'}
            </span>
          ),
          extractor: (v: PublicListingDetail) => v.gccSpec,
        },
        {
          label: isArabic ? 'المحرك والقوة' : 'Engine & Output',
          render: (v: PublicListingDetail) => (
            <span className="text-sm text-on-surface">
              {v.engineSpec || v.horsepower || 'V6 / V8 Twin-Turbo'}
            </span>
          ),
          extractor: (v: PublicListingDetail) => v.engineSpec || v.horsepower,
        },
        {
          label: isArabic ? 'ناقل الحركة' : 'Transmission',
          render: (v: PublicListingDetail) => (
            <span className="text-sm text-on-surface">
              {v.transmission || 'Automatic / Dual-Clutch'}
            </span>
          ),
          extractor: (v: PublicListingDetail) => v.transmission,
        },
      ],
    },
    {
      category: isArabic ? 'الضمان والتحقق والتوثيق' : 'Warranty & Provenance',
      items: [
        {
          label: isArabic ? 'الضمان' : 'Warranty',
          render: (v: PublicListingDetail) => (
            <span className="text-sm text-on-surface">
              {v.warrantyInfo || (v.condition === 'NEW' ? 'Official Dealer Warranty' : 'Dealer Inspected')}
            </span>
          ),
          extractor: (v: PublicListingDetail) => v.warrantyInfo,
        },
        {
          label: isArabic ? 'فحص رقم الهيكل' : 'Chassis Masked VIN',
          render: (v: PublicListingDetail) => (
            <span className="font-data-mono-num text-xs text-outline tracking-wider" dir="ltr">
              {v.maskedVin || '1GNEK1337********'}
            </span>
          ),
          extractor: (v: PublicListingDetail) => v.maskedVin,
        },
      ],
    },
  ], [isArabic]);

  // Optimization (⚡ Bolt): Pre-compute selected vehicle IDs set and memoize available items for modal lookup
  const selectableListings = useMemo(() => {
    const comparedIds = new Set(comparedVehicles.map((v) => v.id));
    return availableListings.filter((item) => !comparedIds.has(item.id));
  }, [availableListings, comparedVehicles]);

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="min-h-screen bg-background text-on-surface flex flex-col selection:bg-primary-container selection:text-on-primary-container"
    >
      <MarketplaceHeader
        activePath="/compare"
        selectedEmirate={selectedEmirate}
        onEmirateChange={setSelectedEmirate}
        favoritesCount={0}
        locale={locale}
        onLocaleToggle={() => setLocale(locale === 'en' ? 'ar' : 'en')}
      />

      <main className="w-full pt-24 pb-20 flex-1 max-w-[1440px] mx-auto px-4 md:px-8">
        {/* Breadcrumb & Screen Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-outline-variant/30">
          <div>
            <div className="flex items-center gap-2 text-xs font-data-mono-num text-outline mb-2">
              <a href="/" className="hover:text-primary transition-colors">
                {isArabic ? 'الرئيسية' : 'Home'}
              </a>
              <span>/</span>
              <a href="/cars" className="hover:text-primary transition-colors">
                {isArabic ? 'السيارات' : 'Inventory'}
              </a>
              <span>/</span>
              <span className="text-primary">{isArabic ? 'مقارنة السيارات' : 'Comparison Matrix'}</span>
            </div>
            <h1 className="font-display-hero text-3xl sm:text-4xl font-bold tracking-tight text-on-surface">
              {isArabic ? 'مصفوفة المقارنة الفنية' : 'Vehicle Comparison Matrix'}
            </h1>
            <p className="text-sm text-outline mt-1 font-body-md">
              {isArabic
                ? 'قارن حتى 4 سيارات جنباً إلى جنب مع مطابقة المواصفات الخليجية، والأسعار، وسجل الوكلاء المعتمدين.'
                : 'Compare up to 4 vehicles side-by-side with verified GCC specs, asking prices, and showroom provenance.'}
            </p>
          </div>

          {/* Action Bar: Highlight Diff & PDF Export */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setHighlightDifferences(!highlightDifferences)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                highlightDifferences
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-surface-container border-outline-variant/40 text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${highlightDifferences ? 'bg-primary' : 'bg-outline'}`} />
              <span>{isArabic ? 'تمييز الفروقات فقط' : 'Highlight Differences'}</span>
            </button>

            <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>{isArabic ? 'طباعة / PDF' : 'Export PDF'}</span>
            </Button>
          </div>
        </div>

        {/* Comparison Matrix Table */}
        {comparedVehicles.length === 0 ? (
          <div className="p-12 text-center bg-surface-container/60 rounded-xl border border-outline-variant/30">
            <p className="text-outline text-sm">
              {isArabic ? 'لم يتم اختيار سيارات للمقارنة.' : 'No vehicles currently selected for comparison.'}
            </p>
            <Button variant="primary" className="mt-4" onClick={() => setAddModalOpen(true)}>
              {isArabic ? '+ إضافة سيارة للمقارنة' : '+ Add Vehicle to Compare'}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto pb-6">
            <table className="w-full min-w-[800px] border-collapse text-left" dir={isArabic ? 'rtl' : 'ltr'}>
              {/* Table Header: Vehicle Cards / Slots */}
              <thead>
                <tr>
                  <th className="w-64 p-4 align-top text-xs font-label-caps uppercase text-outline bg-surface-container-low/50 border-b border-outline-variant/30">
                    {isArabic ? 'المركبات المختارة' : 'Selected Vehicles'} ({comparedVehicles.length}/4)
                  </th>

                  {comparedVehicles.map((vehicle) => (
                    <th
                      key={vehicle.id}
                      className="p-4 align-top w-72 bg-surface-container/70 border-b border-r border-outline-variant/30 rounded-t-xl"
                    >
                      <div className="flex flex-col gap-3 relative">
                        {/* Remove Action */}
                        <button
                          type="button"
                          onClick={() => removeVehicle(vehicle.id)}
                          className="absolute -top-1 right-0 text-outline hover:text-error text-sm p-1 rounded-full bg-surface-container-high/80"
                          title={isArabic ? 'حذف من المقارنة' : 'Remove from comparison'}
                        >
                          ✕
                        </button>

                        {/* Vehicle Photo */}
                        <div className="w-full aspect-[16/10] rounded-lg overflow-hidden bg-surface-container-lowest border border-outline-variant/30">
                          <img
                            src={vehicle.media?.[0]?.url || 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=600&q=80'}
                            alt={vehicle.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Vehicle Title & Trim */}
                        <div>
                          <span className="text-[10px] font-label-caps uppercase text-secondary">
                            {vehicle.year} • {vehicle.emirate}
                          </span>
                          <h3 className="font-headline-sm text-sm font-bold text-on-surface line-clamp-1">
                            {vehicle.title}
                          </h3>
                        </div>

                        {/* CTAs */}
                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={`/cars/${vehicle.slug}`}
                            className="flex-1 py-1.5 text-center text-xs font-semibold rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors border border-outline-variant/30"
                          >
                            {isArabic ? 'التفاصيل' : 'Dossier'}
                          </a>
                          <a
                            href={`/cars/${vehicle.slug}/enquiry`}
                            className="flex-1 py-1.5 text-center text-xs font-semibold rounded-lg bg-primary hover:bg-primary-fixed text-on-primary transition-colors"
                          >
                            {isArabic ? 'طلب شراء' : 'Enquire'}
                          </a>
                        </div>
                      </div>
                    </th>
                  ))}

                  {/* Empty Slot for Adding 2nd, 3rd or 4th vehicle */}
                  {comparedVehicles.length < 4 && (
                    <th className="p-4 align-middle w-72 bg-surface-container-lowest/50 border-b border-dashed border-outline-variant/40 text-center rounded-t-xl">
                      <button
                        type="button"
                        onClick={() => setAddModalOpen(true)}
                        className="w-full h-44 rounded-xl border-2 border-dashed border-outline-variant/40 hover:border-primary/60 flex flex-col items-center justify-center gap-2 text-outline hover:text-primary transition-all p-4 group"
                      >
                        <span className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                          +
                        </span>
                        <span className="text-xs font-semibold">
                          {isArabic ? 'إضافة سيارة للمقارنة' : 'Add Vehicle to Compare'}
                        </span>
                        <span className="text-[10px] text-outline/60">
                          {isArabic ? `متبقي ${4 - comparedVehicles.length} خانات` : `${4 - comparedVehicles.length} slots remaining`}
                        </span>
                      </button>
                    </th>
                  )}
                </tr>
              </thead>

              {/* Specification Categories & Rows */}
              <tbody>
                {comparisonAttributes.map((category, catIdx) => (
                  <React.Fragment key={catIdx}>
                    {/* Category Title Row */}
                    <tr className="bg-surface-container-high/60">
                      <td
                        colSpan={1 + comparedVehicles.length + (comparedVehicles.length < 4 ? 1 : 0)}
                        className="py-2.5 px-4 text-xs font-label-caps uppercase tracking-wider text-primary font-bold border-y border-outline-variant/30"
                      >
                        {category.category}
                      </td>
                    </tr>

                    {/* Attribute Rows */}
                    {category.items.map((item, rowIdx) => {
                      const differs = isDifferent(item.extractor);
                      const isHighlighted = highlightDifferences && differs;

                      return (
                        <tr
                          key={rowIdx}
                          className={`border-b border-outline-variant/20 transition-colors ${
                            isHighlighted
                              ? 'bg-primary/5 border-l-2 border-l-primary'
                              : 'hover:bg-surface-container-low/40'
                          }`}
                        >
                          {/* Attribute Label Column */}
                          <td className="p-4 align-middle text-xs font-medium text-outline bg-surface-container-low/30 border-r border-outline-variant/20">
                            <div className="flex items-center justify-between">
                              <span>{item.label}</span>
                              {differs && (
                                <span className="text-[9px] font-data-mono-num text-primary/80 uppercase px-1.5 py-0.5 rounded bg-primary/10">
                                  {isArabic ? 'فروقات' : 'Diff'}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Values per Vehicle */}
                          {comparedVehicles.map((vehicle) => (
                            <td
                              key={vehicle.id}
                              className={`p-4 align-middle border-r border-outline-variant/20 ${
                                isHighlighted ? 'font-semibold text-on-surface' : ''
                              }`}
                            >
                              {item.render(vehicle)}
                            </td>
                          ))}

                          {/* Empty Slot Filler Cell */}
                          {comparedVehicles.length < 4 && (
                            <td className="p-4 align-middle text-center text-outline/30 text-xs italic">
                              —
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Regulatory & Disclaimer Banner */}
        <div className="mt-12 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs text-outline font-data-mono-num flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span>
            {isArabic
              ? 'ملاحظة: كافة التقديرات المالية والضمانات هي مؤشرات استرشادية تعتمد على تقييم صالة العرض والمؤسسة التمويلية.'
              : 'Regulatory Disclosure: All specifications and vehicle estimates are non-binding dealer quotations subject to final showroom contracts.'}
          </span>
          <span className="text-tertiary whitespace-nowrap">UAE Central Bank • AED Currency Standard</span>
        </div>
      </main>

      {/* Add Vehicle Selector Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl max-h-[80vh] bg-surface-container p-6 rounded-2xl border border-outline-variant/40 shadow-2xl flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                {isArabic ? 'اختر مركبة للمقارنة' : 'Select Vehicle to Compare'}
              </h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-outline hover:text-on-surface p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex flex-col gap-2.5 pr-1">
              {selectableListings.map((item) => (
                <div
                    key={item.id}
                    onClick={() => addVehicle(item)}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-10 rounded-lg overflow-hidden bg-surface-container-lowest flex-shrink-0">
                        <img
                          src={item.media?.[0]?.url || 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=200&q=80'}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-on-surface line-clamp-1">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-outline font-data-mono-num">
                          {item.year} • {item.emirate} • {item.seller.displayName}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-data-currency-lg font-bold text-primary block">
                        AED {(Number(item.price.amountFils) / 100).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-tertiary">
                        {isArabic ? '+ اختيار' : '+ Select'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <MarketplaceFooter locale={locale} />
    </div>
  );
}
