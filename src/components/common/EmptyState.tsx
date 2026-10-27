import type { ReactNode } from 'react';

type EmptyStateProps = {
  illustration: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  testId?: string;
};

export function EmptyState({
  illustration,
  title,
  description,
  actionLabel,
  onAction,
  testId = 'empty-state'
}: EmptyStateProps) {
  return (
    <section
      className="kulv-empty-state"
      data-testid={testId}
      aria-labelledby={`${testId}-title`}
      aria-describedby={`${testId}-description`}
    >
      <div className="kulv-empty-state__illustration" aria-hidden="true">
        {illustration}
      </div>

      <h2 id={`${testId}-title`} className="kulv-empty-state__title">
        {title}
      </h2>

      <p id={`${testId}-description`} className="kulv-empty-state__description">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          className="kulv-button kulv-button--primary"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </section>
  );
}
