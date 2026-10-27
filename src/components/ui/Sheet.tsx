import React, { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'max-w-md'
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Focus close button on open
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-title"
      aria-describedby={description ? 'sheet-description' : undefined}
      className="fixed inset-0 z-50 flex justify-end"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet panel */}
      <div
        ref={sheetRef}
        className={`relative z-10 w-full ${width} bg-[var(--kulv-surface,#FFFDF8)] border-l border-[var(--kulv-border,#C9BFA9)] shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-[var(--kulv-border,#C9BFA9)] bg-[var(--kulv-surface,#FFFDF8)]">
          <div>
            <h2
              id="sheet-title"
              className="font-serif-display text-lg font-bold text-[var(--kulv-text,#2A2E24)] m-0"
            >
              {title}
            </h2>
            {description && (
              <p
                id="sheet-description"
                className="text-xs text-[var(--kulv-text-muted,#5F675A)] mt-1 mb-0"
              >
                {description}
              </p>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Sulge / Close"
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-[var(--kulv-text-muted,#5F675A)] hover:text-[var(--kulv-text,#2A2E24)] hover:bg-[var(--kulv-surface-muted,#EFE6D4)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kulv-focus,#4F6B45)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 sm:p-5 border-t border-[var(--kulv-border,#C9BFA9)] bg-[var(--kulv-surface-muted,#EFE6D4)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
