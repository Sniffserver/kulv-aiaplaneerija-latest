import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlantCard } from './PlantCard';
import type { Plant } from '../types';

vi.mock('../context/GardenContext', () => ({
  useGarden: () => ({
    language: 'et'
  })
}));

const mockPlant: Plant = {
  id: 'carrot',
  name: 'Porgand',
  nameEn: 'Carrot',
  scientificName: 'Daucus carota',
  family: 'Sarikalised',
  icon: '🥕',
  varieties: ['Nantes', 'Berlicum'],
  optimalSowDateStart: '04-15',
  optimalPlantOutDate: '05-01',
  optimalHarvestDate: '08-15',
  spacingCm: 5,
  rowSpacingCm: 20,
  depthCm: 2,
  daysToMaturity: 75,
  daysToHarvest: 75,
  sunNeed: 'full',
  sunHoursMin: 6,
  waterNeed: 'medium',
  weeksBeforeFrostSowIndoors: null,
  weeksAfterFrostPlantOut: null,
  greenhouseShiftWeeks: null,
  companionsGood: ['Sibul'],
  companionsBad: ['Till'],
  description: 'Maitsev juurvili',
  isNordicSuitable: true
};

describe('PlantCard Component', () => {
  it('renders as an accessible button with keyboard and click support', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<PlantCard plant={mockPlant} onClick={onClick} />);

    const cardButton = screen.getByRole('button', { name: /porgand/i });
    expect(cardButton).toBeInTheDocument();
    expect(cardButton.tagName).toBe('BUTTON');
    expect(cardButton).toHaveAttribute('data-testid', 'plant_card_carrot');
    expect(screen.getByText('Porgand')).toBeInTheDocument();
    expect(screen.getByText(/Sarikalised/)).toBeInTheDocument();
    expect(screen.getByText(/75p/)).toBeInTheDocument();

    await user.click(cardButton);
    expect(onClick).toHaveBeenCalledTimes(1);

    cardButton.focus();
    expect(cardButton).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('has no accessibility violations', async () => {
    const { axe } = await import('vitest-axe');
    const { container } = render(
      <PlantCard plant={mockPlant} onClick={() => {}} />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
