import React from 'react';
import { Button } from './button';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  locale?: 'en' | 'ar';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  locale = 'en',
}) => {
  const isArabic = locale === 'ar';

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
      <div className="w-16 h-16 rounded-full bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-outline mb-4">
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <h3 className="font-headline-sm text-lg font-semibold text-on-surface mb-2">
        {title || (isArabic ? 'لم يتم العثور على سيارات' : 'No matching vehicles found')}
      </h3>
      <p className="text-sm text-outline mb-6">
        {description ||
          (isArabic
            ? 'جرب تعديل خيارات التصفية أو توسيع نطاق البحث لاستكشاف المزيد من السيارات المعتمدة.'
            : 'Try adjusting your search criteria or clearing filters to discover available certified dealer stock.')}
      </p>
      {onAction && (
        <Button variant="outline" size="md" onClick={onAction}>
          {actionText || (isArabic ? 'إعادة ضبط الفلاتر' : 'Reset All Filters')}
        </Button>
      )}
    </div>
  );
};
