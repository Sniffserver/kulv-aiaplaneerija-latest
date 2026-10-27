import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BedInspector } from '../BedInspector';
import { GardenEntity, GardenBed } from '../../../types';

describe('BedInspector Component', () => {
  const mockEntity: GardenEntity = {
    id: 'bed_test_1',
    name: 'Kapsapeenar',
    category: 'bed',
    subType: 'raisedBed',
    width: 1.5,
    length: 3.0,
    heightM: 0.4,
    x: 2,
    y: 2,
    rotation: 0,
    shapeType: 'rectangle',
    materialType: 'wood',
    color: '#8A5D3B',
    shadowCasting: false,
    zIndex: 20,
    layerId: 'beds',
    locked: false,
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockBed: GardenBed = {
    id: 'bed_test_1',
    name: 'Kapsapeenar',
    type: 'raisedBed',
    x: 2,
    y: 2,
    width: 1.5,
    length: 3.0,
    height: 0.4,
    rotation: 0,
    coverType: 'none',
    notes: '',
    calculatedSunHours: 8,
    plantings: [
      {
        id: 'p1',
        bedId: 'bed_test_1',
        plantId: 'cabbage',
        plantName: 'Peakapsas',
        plantIcon: '🥬',
        gridX: 0,
        gridY: 0,
        year: 2026,
        dateAdded: '2026-05-01'
      }
    ]
  };

  it('renders nothing when entity is null', () => {
    const { container } = render(
      <BedInspector
        isOpen={true}
        onClose={vi.fn()}
        entity={null}
        language="et"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders bed details, dimensions, and area correctly', () => {
    render(
      <BedInspector
        isOpen={true}
        onClose={vi.fn()}
        entity={mockEntity}
        bed={mockBed}
        language="et"
      />
    );

    expect(screen.getByText('Kapsapeenar')).toBeInTheDocument();
    expect(screen.getByText('4.50 m²')).toBeInTheDocument();
    expect(screen.getByText(/1\.80 m³/)).toBeInTheDocument();
    expect(screen.getByText('Peakapsas')).toBeInTheDocument();
  });

  it('triggers onRotate when rotate button is clicked', () => {
    const onRotate = vi.fn();
    render(
      <BedInspector
        isOpen={true}
        onClose={vi.fn()}
        entity={mockEntity}
        onRotate={onRotate}
        language="et"
      />
    );

    const rotateBtn = screen.getByTestId('inspector_rotate_btn');
    fireEvent.click(rotateBtn);
    expect(onRotate).toHaveBeenCalledWith('bed_test_1', 90);
  });

  it('triggers onToggleLock when lock button is clicked', () => {
    const onToggleLock = vi.fn();
    render(
      <BedInspector
        isOpen={true}
        onClose={vi.fn()}
        entity={mockEntity}
        onToggleLock={onToggleLock}
        language="et"
      />
    );

    const lockBtn = screen.getByTestId('inspector_lock_btn');
    fireEvent.click(lockBtn);
    expect(onToggleLock).toHaveBeenCalledWith('bed_test_1');
  });

  it('triggers onOpenSoilRecipes when soil calculator button is clicked', () => {
    const onOpenSoilRecipes = vi.fn();
    render(
      <BedInspector
        isOpen={true}
        onClose={vi.fn()}
        entity={mockEntity}
        onOpenSoilRecipes={onOpenSoilRecipes}
        language="en"
      />
    );

    const soilBtn = screen.getByTestId('inspector_soil_btn');
    fireEvent.click(soilBtn);
    expect(onOpenSoilRecipes).toHaveBeenCalledWith({
      widthM: 1.5,
      lengthM: 3.0,
      heightM: 0.4,
      label: 'Kapsapeenar'
    });
  });

  it('triggers onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    const onClose = vi.fn();
    render(
      <BedInspector
        isOpen={true}
        onClose={onClose}
        entity={mockEntity}
        onDelete={onDelete}
        language="en"
      />
    );

    const deleteBtn = screen.getByRole('button', { name: /Delete/i });
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith('bed_test_1');
    expect(onClose).toHaveBeenCalled();
  });
});
