import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'pill' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

    const variants = {
      primary:
        'bg-primary text-on-primary font-semibold hover:bg-primary-container hover:text-on-primary shadow-lg shadow-primary/10 rounded-lg',
      secondary:
        'bg-surface-container-low text-on-surface hover:bg-surface-container border border-outline-variant/40 rounded-lg',
      outline:
        'border border-outline/40 text-on-surface hover:bg-surface-container hover:border-outline rounded-lg',
      ghost:
        'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60 rounded-lg',
      pill:
        'rounded-full px-4 py-1.5 text-xs font-semibold bg-surface-container border border-outline-variant/30 text-on-surface hover:border-primary/50 hover:text-primary',
      danger:
        'bg-error-container text-on-error hover:bg-error hover:text-surface rounded-lg',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(
          clsx(
            baseStyles,
            variants[variant],
            variant !== 'pill' && sizes[size],
            className
          )
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
