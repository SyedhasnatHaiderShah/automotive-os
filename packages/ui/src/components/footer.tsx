import React from 'react';

export interface MarketplaceFooterProps {
  locale?: 'en' | 'ar';
}

export const MarketplaceFooter: React.FC<MarketplaceFooterProps> = ({
  locale = 'en',
}) => {
  const isArabic = locale === 'ar';

  return (
    <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/30 text-on-surface-variant pt-12 pb-16">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-outline-variant/20">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary text-on-primary font-bold text-xs flex items-center justify-center">
                AO
              </div>
              <span className="font-headline-sm text-lg font-bold text-on-surface">
                Automotive<span className="text-primary">.OS</span>
              </span>
            </div>
            <p className="text-xs text-outline max-w-md">
              {isArabic
                ? 'المنصة الرقمية الأولى في دولة الإمارات العربية المتحدة لتداول السيارات الفاخرة عبر وكلاء مرخصين ومطابقة دقيقة لمواصفات دول مجلس التعاون الخليجي.'
                : 'The premier UAE platform for verified dealership inventory, GCC specification validation, and luxury automotive commerce.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-label-caps uppercase text-outline">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
              {isArabic ? 'بوابة وكلاء معتمدة وموثقة' : 'Verified Dealer Exchange'}
            </span>
            <span>•</span>
            <span>AED / Asia-Dubai UTC+4</span>
            <span>•</span>
            <span>GCC SPEC ONLY</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-outline font-body-sm">
          <p>© {new Date().getFullYear()} Automotive OS UAE. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="/account/profile" className="hover:text-primary transition-colors">
              {isArabic ? 'سياسة الخصوصية' : 'Privacy Notice'}
            </a>
            <a href="/account/settings" className="hover:text-primary transition-colors">
              {isArabic ? 'شروط الخدمة' : 'Terms of Service'}
            </a>
            <a href="/account/settings" className="hover:text-primary transition-colors">
              {isArabic ? 'إفصاح حماية المستهلك' : 'UAE Consumer Rights'}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
