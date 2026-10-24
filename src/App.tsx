import React from 'react';
import { useGarden } from './context/GardenContext';
import { AppShell } from './components/layout/AppShell';

export const App: React.FC = () => {
  return <AppShell />;
};
