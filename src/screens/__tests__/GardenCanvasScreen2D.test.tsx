import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GardenCanvasScreen } from '../GardenCanvasScreen';

vi.mock('../../context/GardenContext', () => ({
  useGarden: () => ({
    beds: [
      {
        id: 'bed-1',
        name: 'Kõrgpeenar 1',
        type: 'raisedBed',
        x: 2,
        y: 2,
        width: 1.5,
        length: 3,
        height: 0.4,
        rotation: 0,
        coverType: 'none',
        notes: '',
        calculatedSunHours: 8,
        plantings: []
      }
    ],
    plants: [],
    deleteBed: vi.fn(),
    plantInBed: vi.fn(),
    removePlantFromBed: vi.fn(),
    addYardEntity: vi.fn(),
    yardPlan: {
      id: 'plan-1',
      name: 'Minu krundiplaan',
      widthM: 20,
      lengthM: 30,
      entities: []
    },
    language: 'et',
    settings: {
      enableSunSimulation: true
    },
    updateYardEntity: vi.fn(),
    t: (key: string) => key
  })
}));

describe('GardenCanvasScreen 2D Only', () => {
  it('renders the 2D layout button and excludes any 3D view toggle', () => {
    render(<GardenCanvasScreen onOpenAddBed={vi.fn()} />);

    // 2D layout button should be present and active
    const yardBtn = screen.getByTestId('planner_mode_yard_btn');
    expect(yardBtn).toBeInTheDocument();
    expect(yardBtn).toHaveAttribute('aria-selected', 'true');

    // 3D toggle button must not exist anywhere in the DOM
    expect(screen.queryByTestId('planner_mode_3d_btn')).toBeNull();
    expect(screen.queryByText(/3D/i)).toBeNull();
  });

  it('switches between 2D Layout, Crop Rotation timeline, and Bed Detail grid', async () => {
    const user = userEvent.setup();
    render(<GardenCanvasScreen onOpenAddBed={vi.fn()} />);

    const timelineBtn = screen.getByTestId('planner_mode_timeline_btn');
    await user.click(timelineBtn);
    expect(timelineBtn).toHaveAttribute('aria-selected', 'true');

    const bedBtn = screen.getByTestId('planner_mode_bed_btn');
    await user.click(bedBtn);
    expect(bedBtn).toHaveAttribute('aria-selected', 'true');
  });
});
