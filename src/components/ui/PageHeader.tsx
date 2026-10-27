import React, { type ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  kicker?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  kicker
}) => {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
      <div>
        {kicker && (
          <div className="text-xs uppercase tracking-wider font-semibold text-[var(--kulv-primary,#4F6B45)] mb-1">
            {kicker}
          </div>
        )}
        <h1 className="font-serif-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--kulv-text,#2A2E24)] m-0">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[var(--kulv-text-muted,#5F675A)] mt-1 mb-0">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </header>
  );
};
