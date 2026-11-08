import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlantDetailDialog } from './PlantDetailDialog';
import type { Plant } from '../../types';

const mockAddTask = vi.fn();

vi.mock('../../context/GardenContext', () => ({
  useGarden: () => ({
    language: 'et',
    addTask: mockAddTask,
    weather: {
      temperature: 18,
      feelsLike: 18,
      humidity: 50,
      precipitation: 0,
      windSpeed: 4,
      condition: 'clear',
      description: 'Selge taevas',
      forecast: [],
      alerts: [],
      tempMin: 8,
      tempMax: 21,
      source: 'test'
    }
  })
}));

const mockPlant: Plant = {
  id: 'porgand',
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
  description: 'Mahlane aiavili',
  isNordicSuitable: true
};

describe('PlantDetailDialog Quick Actions', () => {
  it('renders quick action buttons and dispatches garden tasks on click', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(<PlantDetailDialog plant={mockPlant} onDismiss={onDismiss} />);

    // Verify quick action container is present
    const quickActions = screen.getByTestId('plant_detail_quick_actions');
    expect(quickActions).toBeInTheDocument();

    // Verify buttons are rendered
    const waterBtn = screen.getByTestId('quick_action_water');
    const pruneBtn = screen.getByTestId('quick_action_prune');
    const soilBtn = screen.getByTestId('quick_action_soil');

    expect(waterBtn).toBeInTheDocument();
    expect(pruneBtn).toBeInTheDocument();
    expect(soilBtn).toBeInTheDocument();

    // Click 'Water'
    await user.click(waterBtn);
    expect(mockAddTask).toHaveBeenCalledWith(
      expect.stringContaining('Porgand'),
      expect.any(String),
      'water'
    );

    // Verify status feedback message appears
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
