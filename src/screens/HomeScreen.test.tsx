import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeScreen } from './HomeScreen';
import type { Plant, GardenBed, Task } from '../types';

const mockPlants: Plant[] = [
  {
    id: 'carrot',
    name: 'Porgand',
    nameEn: 'Carrot',
    scientificName: 'Daucus carota',
    family: 'Sarikalised',
    icon: '🥕',
    varieties: ['Nantes'],
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
    companionsGood: [],
    companionsBad: [],
    description: 'Porgand',
    isNordicSuitable: true
  }
];

const mockBeds: GardenBed[] = [
  {
    id: 'bed-1',
    name: 'Peenar 1',
    type: 'raisedBed',
    x: 0,
    y: 0,
    width: 1.2,
    length: 2.4,
    height: 0.4,
    rotation: 0,
    coverType: 'none',
    notes: '',
    calculatedSunHours: 6,
    plantings: [
      {
        id: 'p1',
        bedId: 'bed-1',
        plantId: 'carrot',
        plantName: 'Porgand',
        plantIcon: '🥕',
        gridX: 0,
        gridY: 0,
        year: 2026,
        dateAdded: '2026-05-01'
      }
    ]
  }
];

const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Kasta tomateid',
    dueDate: '2026-10-27',
    completed: false,
    category: 'water',
    createdAt: '2026-10-27'
  }
];

vi.mock('../context/GardenContext', () => ({
  useGarden: () => ({
    weather: {
      locationName: 'Tartu',
      lat: 58.37,
      lng: 26.72,
      temperature: 14,
      tempMax: 16,
      tempMin: 8,
      precipitation: 0.2,
      windSpeed: 4.5,
      weatherDescription: 'Mõõdukas vihm',
      icon: '🌧️',
      alerts: [],
      tips: [],
      dailyForecast: [
        {
          date: '2026-10-27',
          dayName: 'Täna',
          tempMax: 16,
          tempMin: 8,
          weatherCode: 61,
          weatherDescription: 'Vihm',
          icon: '🌧️',
          precipitationSum: 1.2
        }
      ]
    },
    tasks: mockTasks,
    beds: mockBeds,
    plants: mockPlants,
    language: 'et',
    toggleTask: vi.fn(),
    deleteTask: vi.fn(),
    isWeatherLoading: false,
    refreshWeather: vi.fn(),
    quickWaterAllPlants: () => ({ message: '1 taim kastetud' })
  })
}));

describe('HomeScreen Component', () => {
  it('renders modern hero HomeOverview, toolstrip quick actions, and task section', () => {
    render(
      <HomeScreen
        onNavigateToGarden={() => {}}
        onNavigateToPlants={() => {}}
        onNavigateToJournal={() => {}}
        onNavigateToCalendar={() => {}}
        onOpenAddTask={() => {}}
        onOpenAddJournal={() => {}}
        onOpenSoilRecipes={() => {}}
        onOpenGrowTent={() => {}}
      />
    );

    expect(screen.getByText('Tere tulemast aeda!')).toBeInTheDocument();
    expect(screen.getByText('Tänane fookus')).toBeInTheDocument();
    expect(screen.getByTestId('quick_actions_section')).toBeInTheDocument();
    expect(screen.getByTestId('quick_action_water_plants')).toBeInTheDocument();
    expect(screen.getByTestId('quick_action_check_calendar')).toBeInTheDocument();
    expect(screen.getByText('Kasta tomateid')).toBeInTheDocument();
  });

  it('triggers quick water toast and action correctly', async () => {
    const user = userEvent.setup();
    render(
      <HomeScreen
        onNavigateToGarden={() => {}}
        onNavigateToPlants={() => {}}
        onNavigateToJournal={() => {}}
        onNavigateToCalendar={() => {}}
        onOpenAddTask={() => {}}
        onOpenAddJournal={() => {}}
        onOpenSoilRecipes={() => {}}
        onOpenGrowTent={() => {}}
      />
    );

    const waterBtn = screen.getByTestId('quick_action_water_plants');
    await user.click(waterBtn);

    expect(screen.getByText('Taimed märgitud kastetuks')).toBeInTheDocument();
    expect(screen.getByText('1 taim kastetud')).toBeInTheDocument();
  });

  it('passes axe accessibility checks without violations', async () => {
    const { axe } = await import('vitest-axe');
    const { container } = render(
      <HomeScreen
        onNavigateToGarden={() => {}}
        onNavigateToPlants={() => {}}
        onNavigateToJournal={() => {}}
        onNavigateToCalendar={() => {}}
        onOpenAddTask={() => {}}
        onOpenAddJournal={() => {}}
        onOpenSoilRecipes={() => {}}
        onOpenGrowTent={() => {}}
      />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
