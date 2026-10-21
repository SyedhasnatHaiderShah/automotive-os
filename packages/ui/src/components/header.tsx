import React from 'react';

export interface MarketplaceHeaderProps {
  activePath?: string;
  selectedEmirate?: string;
  onEmirateChange?: (emirate: string) => void;
  favoritesCount?: number;
  locale?: 'en' | 'ar';
  onLocaleToggle?: () => void;
  userDisplayName?: string | null;
}

export const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
  activePath = '/',
  selectedEmirate = 'All Emirates',
  onEmirateChange,
  favoritesCount = 0,
  locale = 'en',
  onLocaleToggle,
  userDisplayName,
}) => {
  const isArabic = locale === 'ar';

  const navItems = [
    { label: isArabic ? 'تصفح السيارات' : 'Browse Stock', href: '/cars', path: '/cars' },
    { label: isArabic ? 'الوكلاء المعتمدون' : 'Verified Dealers', href: '#', path: '/dealers' },
    { label: isArabic ? 'بيع وتفويض' : 'Sell & Consign', href: '#', path: '/sell' },
    { label: isArabic ? 'مقارنة السيارات' : 'Compare Vehicles', href: '/compare', path: '/compare' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline-variant/30 shadow-2xl shadow-black/60">
      <div className="h-20 max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
        {/* Left: Brand Identity & Location Dropdown */}
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-3 focus:outline-none">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center font-bold text-on-primary text-sm shadow-md">
              AO
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-sm md:text-base font-bold tracking-wider text-on-surface uppercase">
                Automotive<span className="text-primary">.OS</span>
              </span>
              <span className="text-[10px] text-outline font-label-caps uppercase tracking-widest hidden sm:inline-block">
                {isArabic ? 'منصة وكلاء الإمارات المعتمدة' : 'UAE Collector Exchange'}
              </span>
            </div>
          </a>

          <div className="h-6 w-px bg-surface-variant/40 hidden lg:block" />

          {/* Emirate Selector */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface-variant">
            <svg
              className="w-4 h-4 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <select
              value={selectedEmirate}
              onChange={(e) => onEmirateChange?.(e.target.value)}
              className="bg-transparent text-xs text-on-surface font-body-sm focus:outline-none cursor-pointer pr-2"
              aria-label="Filter by UAE Emirate"
            >
              <option value="All Emirates" className="bg-surface-container-low text-on-surface">
                {isArabic ? 'كافة الإمارات' : 'All Emirates'}
              </option>
              <option value="Dubai" className="bg-surface-container-low text-on-surface">
                {isArabic ? 'دبي' : 'Dubai'}
              </option>
              <option value="Abu Dhabi" className="bg-surface-container-low text-on-surface">
                {isArabic ? 'أبوظبي' : 'Abu Dhabi'}
              </option>
              <option value="Sharjah" className="bg-surface-container-low text-on-surface">
                {isArabic ? 'الشارقة' : 'Sharjah'}
              </option>
            </select>
          </div>
        </div>

        {/* Center: Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = activePath === item.path;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-primary font-semibold border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Right: Language Toggle, Favorites Counter & Profile */}
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={onLocaleToggle}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all text-xs font-label-caps"
            aria-label="Toggle Arabic / English language"
          >
            <span className={isArabic ? 'text-primary font-bold' : ''}>العربية</span>
            <span className="text-outline/40">|</span>
            <span className={!isArabic ? 'text-primary font-bold' : ''}>EN</span>
          </button>

          {/* Favorites Counter */}
          <a
            href="/saved"
            className="relative p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`View ${favoritesCount} saved vehicles`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            {favoritesCount > 0 && (
              <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-primary text-on-primary font-data-mono-num text-[10px] font-bold">
                {favoritesCount}
              </span>
            )}
          </a>

          <div className="h-6 w-px bg-surface-variant/40 hidden sm:block" />

          {/* Profile / Account */}
          <a
            href="/profile"
            className="flex items-center gap-2 p-1.5 rounded-full hover:bg-surface-container transition-all text-on-surface"
            aria-label="User profile and garage"
          >
            <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-xs font-semibold text-primary">
              {userDisplayName ? userDisplayName.charAt(0).toUpperCase() : 'VIP'}
            </div>
            {userDisplayName && (
              <span className="text-xs font-medium hidden md:inline-block max-w-[100px] truncate">
                {userDisplayName}
              </span>
            )}
          </a>
        </div>
      </div>
    </header>
  );
};
