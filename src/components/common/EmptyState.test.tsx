import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from './EmptyState';
import { GardenEmptyIllustration } from './EmptyStateIllustrations';

describe('EmptyState', () => {
  it('renders title, description and action', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();

    render(
      <EmptyState
        illustration={<GardenEmptyIllustration />}
        title="Aiaplaan on tühi"
        description="Lisa esimene peenar."
        actionLabel="Lisa peenar"
        onAction={onAction}
        testId="garden-empty-state"
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Aiaplaan on tühi' })
    ).toBeInTheDocument();
    expect(screen.getByText('Lisa esimene peenar.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Lisa peenar' }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('is accessible', async () => {
    const { axe } = await import('vitest-axe');
    const { container } = render(
      <EmptyState
        illustration={<GardenEmptyIllustration />}
        title="Aiaplaan on tühi"
        description="Lisa esimene peenar."
      />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
