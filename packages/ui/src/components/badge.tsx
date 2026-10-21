import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'verified'
    | 'condition'
    | 'gcc'
    | 'gold'
    | 'outline'
    | 'status'
    | 'default'
    | 'success'
    | 'warning'
    | 'info';
  statusColor?: 'emerald' | 'amber' | 'blue' | 'rose' | 'slate';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'outline',
  statusColor = 'slate',
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide uppercase font-label-caps';

  const variants = {
    verified:
      'bg-tertiary-container/20 text-tertiary border border-tertiary/40 backdrop-blur-md',
    condition:
      'bg-surface-container-high text-on-surface border border-outline-variant/30',
    gcc: 'bg-secondary-container/20 text-secondary border border-secondary/40',
    gold: 'bg-primary/20 text-primary border border-primary/40',
    outline: 'border border-outline/30 text-on-surface-variant',
    default: 'bg-surface-container-high text-on-surface border border-outline-variant/30',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    info: 'bg-sky-500/10 text-sky-400 border border-sky-500/30',
    status: clsx({
      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30':
        statusColor === 'emerald',
      'bg-amber-500/10 text-amber-400 border border-amber-500/30':
        statusColor === 'amber',
      'bg-sky-500/10 text-sky-400 border border-sky-500/30':
        statusColor === 'blue',
      'bg-rose-500/10 text-rose-400 border border-rose-500/30':
        statusColor === 'rose',
      'bg-slate-500/10 text-slate-300 border border-slate-500/30':
        statusColor === 'slate',
    }),
  };

  return (
    <span
      className={twMerge(clsx(baseStyles, variants[variant], className))}
      {...props}
    >
      {variant === 'verified' && (
        <svg
          className="w-3.5 h-3.5 text-tertiary inline-block flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {children}
    </span>
  );
};
