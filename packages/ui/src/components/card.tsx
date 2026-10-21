import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'glass' | 'interactive';
}

export const Card: React.FC<CardProps> = ({
  className,
  variant = 'surface',
  children,
  ...props
}) => {
  const baseStyles = 'rounded-lg overflow-hidden transition-all duration-200';

  const variants = {
    surface:
      'bg-surface-container border border-outline-variant/30 text-on-surface',
    glass:
      'bg-surface-container/70 backdrop-blur-xl border border-outline-variant/40 shadow-xl text-on-surface',
    interactive:
      'bg-surface-container border border-outline-variant/30 text-on-surface hover:border-primary/50 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-0.5 cursor-pointer',
  };

  return (
    <div
      className={twMerge(clsx(baseStyles, variants[variant], className))}
      {...props}
    >
      {children}
    </div>
  );
};
