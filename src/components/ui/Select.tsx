import React, { forwardRef, type SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  helperText?: string;
  error?: string;
  id: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, helperText, error, id, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        <label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-wider text-[var(--kulv-text-muted,#5F675A)]"
        >
          {label}
        </label>
        <select
          ref={ref}
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${id}-error` : helperText ? `${id}-helper` : undefined
          }
          className={`min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--kulv-surface,#FFFDF8)] border border-[var(--kulv-border,#C9BFA9)] text-[var(--kulv-text,#2A2E24)] focus:outline-none focus:ring-2 focus:ring-[var(--kulv-focus,#4F6B45)] focus:border-transparent transition-all cursor-pointer ${
            error ? 'border-[var(--kulv-danger,#B85C33)]' : ''
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${id}-error`} className="text-xs text-[var(--kulv-danger,#B85C33)] mt-0.5">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${id}-helper`} className="text-xs text-[var(--kulv-text-muted,#5F675A)] mt-0.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
