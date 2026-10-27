import React, { type ReactNode } from 'react';

export interface ToolbarProps {
  children: ReactNode;
  ariaLabel: string;
  className?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  children,
  ariaLabel,
  className = ''
}) => {
  return (
    <div
      role="toolbar"
      aria-label={ariaLabel}
      className={`flex items-center gap-2 p-2 bg-[var(--kulv-surface,#FFFDF8)] border border-[var(--kulv-border,#C9BFA9)] rounded-xl shadow-[var(--kulv-shadow-card,0_1px_3px_rgba(0,0,0,0.06))] flex-wrap ${className}`}
    >
      {children}
    </div>
  );
};
