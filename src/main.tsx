import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { GardenProvider } from './context/GardenContext';
import { useYardStore } from './stores/yardStore';
import { GardenEntity } from './types';
import './index.css';

if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event: any) => {
    console.warn('[KÜLV] Vite preload error intercepted:', event);
    // Reload once to fetch updated bundles if a hash mismatch occurs across builds
    const lastReloadKey = 'kulv_preload_error_reload';
    const lastReload = sessionStorage.getItem(lastReloadKey);
    const now = Date.now();
    if (!lastReload || now - Number(lastReload) > 8000) {
      sessionStorage.setItem(lastReloadKey, String(now));
      window.location.reload();
    }
  });

  (window as any).__useYardStore = useYardStore;
  (window as any).__loadBenchmarkPlan = (count: number) => {
    const categories: any[] = ['bed', 'structure', 'tree', 'shrub', 'hedge', 'path', 'water', 'furniture'];
    const entities: GardenEntity[] = [];
    for (let i = 0; i < count; i++) {
      const category = categories[i % categories.length];
      const col = i % 15;
      const row = Math.floor(i / 15);
      const x = col * 3.5 + (i % 3) * 0.5;
      const y = row * 3.5 + (i % 2) * 0.5;
      entities.push({
        id: `bench_${i}`,
        name: `Aiaobjekt ${i}`,
        category,
        subType: category === 'bed' ? 'raisedBed' : category === 'tree' ? 'apple_tree' : 'custom',
        x,
        y,
        rotation: (i * 15) % 360,
        shapeType: category === 'tree' ? 'circle' : 'rectangle',
        width: category === 'structure' ? 4 : 1.5,
        length: category === 'structure' ? 6 : 2.5,
        heightM: category === 'structure' ? 3.5 : 0.4,
        shadowCasting: true,
        zIndex: i,
        createdAt: '2026-05-01',
        updatedAt: '2026-05-01',
        deletedAt: null
      });
    }
    const currentPlan = useYardStore.getState().plan;
    useYardStore.getState().setPlan({
      ...currentPlan,
      widthM: 60,
      lengthM: 80,
      entities
    });
    return entities.length;
  };
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <GardenProvider>
      <App />
    </GardenProvider>
  </React.StrictMode>
);
