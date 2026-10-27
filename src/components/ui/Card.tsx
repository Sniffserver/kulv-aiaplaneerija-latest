import React, { type HTMLAttributes, type ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'surface' | 'muted' | 'focus';
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'surface',
  padding = 'md',
  className = '',
  ...props
}) => {
  const variantClasses = {
    surface:
      'bg-[var(--kulv-surface,#FFFDF8)] border border-[var(--kulv-border,#C9BFA9)] text-[var(--kulv-text,#2A2E24)]',
    muted:
      'bg-[var(--kulv-surface-muted,#EFE6D4)] border border-[var(--kulv-border,#C9BFA9)] text-[var(--kulv-text,#2A2E24)]',
    focus:
      'bg-[var(--kulv-surface,#FFFDF8)] border-2 border-[var(--kulv-primary,#4F6B45)] text-[var(--kulv-text,#2A2E24)] shadow-sm'
  }[variant];

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6 sm:p-8'
  }[padding];

  return (
    <div
      className={`rounded-2xl transition-all shadow-[var(--kulv-shadow-card,0_1px_3px_rgba(0,0,0,0.06))] ${variantClasses} ${paddingClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
