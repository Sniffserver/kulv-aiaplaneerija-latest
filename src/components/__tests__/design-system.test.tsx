import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { EmptyState } from '../common/EmptyState';
import {
  GardenEmptyIllustration,
  PlantsEmptyIllustration,
  CalendarEmptyIllustration,
  JournalEmptyIllustration,
  OfflineIllustration
} from '../common/EmptyStateIllustrations';
import {
  CarrotIcon,
  TomatoIcon,
  CucumberIcon,
  LettuceIcon,
  RadishIcon,
  PeaIcon,
  BeanIcon,
  OnionIcon,
  GarlicIcon,
  StrawberryIcon,
  BasilIcon,
  PotatoIcon
} from '../icons/PlantIcons';
import {
  ChiliIcon,
  PumpkinIcon,
  ZucchiniIcon,
  BeetrootIcon,
  KaleIcon,
  SpinachIcon,
  BlueberryIcon,
  AppleIcon,
  HerbPotIcon,
  FlowerIcon,
  SeedlingIcon,
  SproutIcon
} from '../icons/PlantIconsExtra';
import { PlantIcon } from '../icons/PlantIcon';
import {
  RaisedBedIcon,
  GreenhouseIcon,
  GrowTentIcon,
  ContainerIcon,
  SoilIcon,
  CompostIcon,
  WateringIcon,
  SunIcon,
  ShadeIcon,
  FenceIcon,
  PathIcon,
  PlantSupportIcon
} from '../icons/GardenIcons';
import {
  ClearSkyIcon,
  PartlyCloudyIcon,
  CloudyIcon,
  RainIcon,
  LightRainIcon,
  ThunderstormIcon,
  SnowIcon,
  WindIcon,
  FogIcon,
  FrostIcon,
  HeatIcon,
  DewIcon
} from '../icons/WeatherIcons';
import { HomeOverview } from '../home/HomeOverview';
import { PlantCard } from '../plants/PlantCard';
import { PlantsModule } from '../plants/PlantsModule';
import type { Plant } from '../../types';

describe('Design System - EmptyState & Illustrations', () => {
  it('renders EmptyState with illustration, title, description, and action button markup', () => {
    const html = renderToString(
      <EmptyState
        illustration={<GardenEmptyIllustration />}
        title="Aiaplaan on tühi"
        description="Lisa esimene peenar oma aeda."
        actionLabel="Lisa peenar"
        onAction={() => {}}
        testId="garden-empty"
      />
    );

    expect(html).toContain('data-testid="garden-empty"');
    expect(html).toContain('Aiaplaan on tühi');
    expect(html).toContain('Lisa esimene peenar oma aeda.');
    expect(html).toContain('Lisa peenar');
    expect(html).toContain('class="kulv-empty-state"');
  });

  it('renders all illustration SVGs properly with viewBox and presentation role', () => {
    const html = renderToString(
      <div>
        <GardenEmptyIllustration />
        <PlantsEmptyIllustration />
        <CalendarEmptyIllustration />
        <JournalEmptyIllustration />
        <OfflineIllustration />
      </div>
    );
    expect(html).toContain('viewBox="0 0 240 160"');
    expect(html).toContain('role="presentation"');
  });
});

describe('Design System - SVG Icons', () => {
  it('renders plant, garden, and weather icons with proper attributes and stroke styling', () => {
    const html = renderToString(
      <div>
        <CarrotIcon size={24} />
        <TomatoIcon />
        <CucumberIcon />
        <LettuceIcon />
        <RadishIcon />
        <PeaIcon />
        <BeanIcon />
        <OnionIcon />
        <GarlicIcon />
        <StrawberryIcon />
        <BasilIcon />
        <PotatoIcon />
        <RaisedBedIcon size={20} />
        <GreenhouseIcon />
        <GrowTentIcon />
        <ContainerIcon />
        <SoilIcon />
        <CompostIcon />
        <WateringIcon />
        <SunIcon />
        <ShadeIcon />
        <FenceIcon />
        <PathIcon />
        <PlantSupportIcon />
        <ClearSkyIcon />
        <PartlyCloudyIcon />
        <CloudyIcon />
        <RainIcon />
        <LightRainIcon />
        <ThunderstormIcon />
        <SnowIcon />
        <WindIcon />
        <FogIcon />
        <FrostIcon />
        <HeatIcon />
        <DewIcon />
      </div>
    );

    expect(html).toContain('width="24"');
    expect(html).toContain('stroke="currentColor"');
    expect(html).toContain('aria-hidden="true"');
  });

  it('renders all 12 PlantIconsExtra botanical icons properly', () => {
    const html = renderToString(
      <div>
        <ChiliIcon size={24} />
        <PumpkinIcon />
        <ZucchiniIcon />
        <BeetrootIcon />
        <KaleIcon />
        <SpinachIcon />
        <BlueberryIcon />
        <AppleIcon />
        <HerbPotIcon />
        <FlowerIcon />
        <SeedlingIcon />
        <SproutIcon />
      </div>
    );

    expect(html).toContain('width="24"');
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain('stroke="currentColor"');
  });

  it('resolves dynamic PlantIcon by key and falls back gracefully', () => {
    const chiliHtml = renderToString(<PlantIcon plantKey="chili" size={28} />);
    const estonianHtml = renderToString(<PlantIcon plantKey="kõrvits" size={24} />);
    const fallbackHtml = renderToString(<PlantIcon plantKey="unknown_plant_123" size={20} />);

    expect(chiliHtml).toContain('width="28"');
    expect(estonianHtml).toContain('width="24"');
    expect(fallbackHtml).toContain('width="20"');
    // fallback resolves to CarrotIcon which has path M14.5 9.5 6 18
    expect(fallbackHtml).toContain('M14.5 9.5 6 18');
  });
});

describe('Design System - HomeOverview', () => {
  it('renders dashboard overview cards with Estonian typography and metrics', () => {
    const html = renderToString(
      <HomeOverview
        bedCount={4}
        plantCount={15}
        taskCount={3}
        temperature={21}
        weatherSummary="Selge taevas"
        onOpenGarden={() => {}}
        onOpenTasks={() => {}}
      />
    );

    expect(html).toContain('Tänane fookus');
    expect(html).toContain('ülesannet');
    expect(html).toContain('21°C · Selge taevas');
    expect(html).toContain('Peenrad');
    expect(html).toContain('4');
    expect(html).toContain('15');
    expect(html).toContain('Ava aiaplaan');
    expect(html).toContain('Ava ülesanded');
  });
});

describe('Design System - PlantsModule & PlantCard', () => {
  const mockPlants: Plant[] = [
    {
      id: 'carrot',
      name: 'Porgand',
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
      companionsGood: ['Sibul'],
      companionsBad: ['Till'],
      description: 'Maitsev juurvili',
      isNordicSuitable: true
    }
  ];

  it('renders PlantCard markup and metadata correctly', () => {
    const html = renderToString(
      <PlantCard plant={mockPlants[0]} onSelect={() => {}} />
    );

    expect(html).toContain('data-testid="plant-card-carrot"');
    expect(html).toContain('Porgand');
    expect(html).toContain('Sarikalised');
    expect(html).toContain('75');
    expect(html).toContain('päeva');
    expect(html).toContain('class="kulv-plant-card"');
  });

  it('renders PlantsModule with header, filter bar and plant cards', () => {
    const html = renderToString(
      <PlantsModule
        plants={mockPlants}
        onSelectPlant={() => {}}
        onOpenAddPlant={() => {}}
      />
    );

    expect(html).toContain('id="plants-heading"');
    expect(html).toContain('Taimed');
    expect(html).toContain('Porgand');
    expect(html).toContain('Lisa taim');
  });

  it('renders EmptyState in PlantsModule when no plants are present', () => {
    const html = renderToString(
      <PlantsModule
        plants={[]}
        onSelectPlant={() => {}}
        onOpenAddPlant={() => {}}
      />
    );

    expect(html).toContain('data-testid="plants-empty-state"');
    expect(html).toContain('Taimede kataloog on tühi');
  });
});
