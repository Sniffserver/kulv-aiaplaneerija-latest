import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeOverview } from './HomeOverview';

describe('HomeOverview', () => {
  it('shows garden statistics and opens garden', async () => {
    const onOpenGarden = vi.fn();
    const user = userEvent.setup();

    render(
      <HomeOverview
        bedCount={3}
        plantCount={12}
        taskCount={2}
        temperature={12}
        weatherSummary="Vihmane"
        onOpenGarden={onOpenGarden}
        onOpenTasks={() => {}}
      />
    );

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('12°C · Vihmane')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /ava aiaplaan/i }));

    expect(onOpenGarden).toHaveBeenCalledTimes(1);
  });

  it('has no accessibility violations', async () => {
    const { axe } = await import('vitest-axe');
    const { container } = render(
      <HomeOverview
        bedCount={1}
        plantCount={2}
        taskCount={0}
        onOpenGarden={() => {}}
        onOpenTasks={() => {}}
      />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
