import React, { useState } from 'react';
import { GARDEN_ENTITY_PRESETS, EntityPreset } from '../../data/gardenEntityPresets';
import { Plus, Home, Trees, Shovel, Box, Sparkles, ChevronRight, HelpCircle } from 'lucide-react';

interface YardObjectDockProps {
  onAddPreset: (preset: EntityPreset) => void;
  onDragStartPreset?: (e: React.DragEvent, preset: EntityPreset) => void;
}

type TabKey = 'structures' | 'plants' | 'infrastructure' | 'beds';

export const YardObjectDock: React.FC<YardObjectDockProps> = ({ onAddPreset, onDragStartPreset }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('structures');

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'structures', label: 'Ehitised', icon: <Home size={15} /> },
    { key: 'plants', label: 'Taimestik', icon: <Trees size={15} /> },
    { key: 'infrastructure', label: 'Taristu & Vesi', icon: <Shovel size={15} /> },
    { key: 'beds', label: 'Peenrad', icon: <Box size={15} /> }
  ];

  const currentPresets = GARDEN_ENTITY_PRESETS[activeTab] || [];

  return (
    <div
      data-testid="yard_object_dock"
      style={{
        backgroundColor: 'var(--kulv-surface, #FFFDF8)',
        border: '1px solid var(--kulv-border, #C9BFA9)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--kulv-shadow-card, 0 1px 3px rgba(0,0,0,0.06))',
        overflow: 'hidden'
      }}
    >
      {/* Category Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--kulv-border, #C9BFA9)',
          backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
          overflowX: 'auto'
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              data-testid={`dock_tab_${tab.key}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 14px',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--kulv-primary, #4F6B45)' : '2px solid transparent',
                backgroundColor: isActive ? 'var(--kulv-surface, #FFFDF8)' : 'transparent',
                color: isActive ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text-muted, #5F675A)',
                fontSize: '12px',
                fontWeight: isActive ? 700 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Preset Cards List */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: '8px',
          padding: '10px 12px',
          maxHeight: '260px',
          overflowY: 'auto'
        }}
      >
        {currentPresets.map((preset) => (
          <div
            key={preset.id}
            draggable
            onDragStart={(e) => onDragStartPreset && onDragStartPreset(e, preset)}
            data-testid={`preset_card_${preset.id}`}
            style={{
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              borderRadius: '8px',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              cursor: 'grab',
              transition: 'transform 0.1s ease, border-color 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  flexShrink: 0
                }}
              >
                {preset.icon}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--kulv-text, #2A2E24)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {preset.name}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '1px' }}>
                  {preset.defaultWidth} × {preset.defaultLength} m · K {preset.defaultHeight} m
                </div>
              </div>
            </div>

            <button
              onClick={() => onAddPreset(preset)}
              title={`Lisa aeda: ${preset.name}`}
              aria-label={`Lisa ${preset.name}`}
              className="touch-target"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                color: 'var(--kulv-primary, #4F6B45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <Plus size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* Helper text */}
      <div
        style={{
          borderTop: '1px solid var(--kulv-border, #C9BFA9)',
          backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
          padding: '6px 12px',
          fontSize: '11px',
          color: 'var(--kulv-text-muted, #5F675A)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <Sparkles size={12} color="var(--kulv-primary, #4F6B45)" />
        <span>Klõpsa "+" või lohista objekt otse krundiplaanile. Kõik mõõtmed on reaalsetes meetrites.</span>
      </div>
    </div>
  );
};
