import React, { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      icon,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      className = '',
      type = 'button',
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'min-h-[40px] px-3 py-1.5 text-xs',
      md: 'min-h-[44px] px-4 py-2 text-sm',
      lg: 'min-h-[48px] px-5 py-2.5 text-base'
    }[size];

    const variantClasses = {
      primary:
        'bg-[var(--kulv-primary)] text-white hover:bg-[var(--kulv-primary-hover)] active:scale-[0.99]',
      secondary:
        'bg-[var(--kulv-surface)] text-[var(--kulv-text)] border border-[var(--kulv-border)] hover:bg-[var(--kulv-surface-muted)] hover:border-[var(--kulv-border-hover)]',
      accent:
        'bg-[var(--kulv-accent)] text-white hover:bg-[var(--kulv-accent-strong)]',
      danger:
        'bg-[var(--kulv-danger)] text-white hover:opacity-90',
      ghost:
        'bg-transparent text-[var(--kulv-text-muted)] hover:text-[var(--kulv-text)] hover:bg-[var(--kulv-surface-muted)]'
    }[variant];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium tracking-tight whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kulv-focus)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${
          fullWidth ? 'w-full' : ''
        } ${className}`}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
      </button>
    );
  }
);
Button.displayName = 'Button';

export const PrimaryButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="primary" {...props} />
);
PrimaryButton.displayName = 'PrimaryButton';

export const SecondaryButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="secondary" {...props} />
);
SecondaryButton.displayName = 'SecondaryButton';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  'aria-label': string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      'aria-label': ariaLabel,
      variant = 'secondary',
      size = 'md',
      className = '',
      type = 'button',
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'w-10 h-10 min-w-[40px] min-h-[40px]',
      md: 'w-11 h-11 min-w-[44px] min-h-[44px]',
      lg: 'w-12 h-12 min-w-[48px] min-h-[48px]'
    }[size];

    const variantClasses = {
      primary: 'bg-[var(--kulv-primary)] text-white hover:bg-[var(--kulv-primary-hover)]',
      secondary:
        'bg-[var(--kulv-surface)] text-[var(--kulv-text)] border border-[var(--kulv-border)] hover:bg-[var(--kulv-surface-muted)]',
      ghost: 'bg-transparent text-[var(--kulv-text-muted)] hover:text-[var(--kulv-text)] hover:bg-[var(--kulv-surface-muted)]'
    }[variant];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`inline-flex items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kulv-focus)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {icon}
      </button>
    );
  }
);
IconButton.displayName = 'IconButton';
