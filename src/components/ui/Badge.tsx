import React, { type HTMLAttributes, type ReactNode } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  icon?: ReactNode;
  variant?: 'neutral' | 'primary' | 'accent' | 'warning' | 'danger';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  icon,
  variant = 'neutral',
  className = '',
  ...props
}) => {
  const variantStyles = {
    neutral:
      'bg-[var(--kulv-surface-muted,#EFE6D4)] text-[var(--kulv-text-muted,#5F675A)] border border-[var(--kulv-border,#C9BFA9)]',
    primary:
      'bg-[var(--kulv-primary-soft,#E2ECE3)] text-[var(--kulv-primary-strong,#243D2B)] border border-[var(--kulv-primary,#4F6B45)]',
    accent:
      'bg-[var(--kulv-accent-soft,#F4D5C2)] text-[var(--kulv-accent-strong,#9E4C1F)] border border-[var(--kulv-accent,#E08A3C)]',
    warning:
      'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700',
    danger:
      'bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-700'
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${variantStyles} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
