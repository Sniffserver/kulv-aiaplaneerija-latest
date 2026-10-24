import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  RotateCcw,
  Database,
  Globe,
  Compass,
  Thermometer
} from 'lucide-react';
import { useGarden } from '../context/GardenContext';
import { NORDIC_REGIONAL_FROST_DATA } from '../logic/plantingCalendar';

export type ColorPalette = 'meadow' | 'kulv' | 'gruvbox' | 'catppuccin';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPalette?: ColorPalette;
  onPaletteChange?: (palette: ColorPalette) => void;
  locationName?: string;
  springFrostDate?: string;
  autumnFrostDate?: string;
  onSaveSettings?: (settings: {
    palette: ColorPalette;
    location: string;
    lat: number;
    lng: number;
    springFrost: string;
    autumnFrost: string;
  }) => void;
}

export const PALETTE_OPTIONS: { id: ColorPalette; name: string; description: string }[] = [
  { id: 'meadow', name: 'Päevakas aed', description: 'Soe kreem paber, pehme rohe ja päikeseline oranž' },
  { id: 'kulv', name: 'KÜLV klassikaline', description: 'Põhjamaine aiarahu ja sügav roheline' },
  { id: 'gruvbox', name: 'Gruvbox', description: 'Maa- ja paberitoonid' },
  { id: 'catppuccin', name: 'Catppuccin', description: 'Pehmed pastelsed toonid' }
];

export const PRESET_LOCATIONS: { name: string; lat: number; lng: number }[] = [
  { name: 'Tallinn', lat: 59.437, lng: 24.754 },
  { name: 'Tartu', lat: 58.378, lng: 26.729 },
  { name: 'Pärnu', lat: 58.385, lng: 24.497 },
  { name: 'Kuressaare', lat: 58.253, lng: 22.485 }
];

export function applyPaletteToDOM(palette: ColorPalette) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.palette = palette;
    try {
      localStorage.setItem('kulv-palette', palette);
      const isDark = document.documentElement.classList.contains('dark');
      const paletteThemeColors: Record<ColorPalette, { light: string; dark: string }> = {
        meadow: { light: '#F7F1E8', dark: '#191D17' },
        kulv: { light: '#FAF6ED', dark: '#171B17' },
        gruvbox: { light: '#FBF1C7', dark: '#282828' },
        catppuccin: { light: '#EFF1F5', dark: '#1E1E2E' }
      };
      const themeColor = document.querySelector('meta[name="theme-color"]');
      if (themeColor && paletteThemeColors[palette]) {
        themeColor.setAttribute('content', paletteThemeColors[palette][isDark ? 'dark' : 'light']);
      }
    } catch {
      // Storage unavailable in restricted sandbox
    }
  }
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentPalette = 'meadow',
  onPaletteChange,
  locationName = 'Tallinn',
  springFrostDate = '05-20',
  autumnFrostDate = '09-25',
  onSaveSettings
}) => {
  const { exportBackup, importBackup, beds, journal, tasks, resetToDefaults, saveStatus, language, setLanguage, t } =
    useGarden();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [selectedPalette, setSelectedPalette] = useState<ColorPalette>(() => {
    if (typeof document !== 'undefined' && document.documentElement.dataset.palette) {
      const p = document.documentElement.dataset.palette as ColorPalette;
      if (PALETTE_OPTIONS.some((opt) => opt.id === p)) return p;
    }
    try {
      const stored = localStorage.getItem('kulv-palette') as ColorPalette;
      if (stored && PALETTE_OPTIONS.some((opt) => opt.id === stored)) return stored;
    } catch {
      // ignore
    }
    return currentPalette;
  });

  const [location, setLocation] = useState(locationName);
  const [lat, setLat] = useState(() => PRESET_LOCATIONS.find((l) => l.name === locationName)?.lat || 59.437);
  const [lng, setLng] = useState(() => PRESET_LOCATIONS.find((l) => l.name === locationName)?.lng || 24.754);
  const [springFrost, setSpringFrost] = useState(springFrostDate);
  const [autumnFrost, setAutumnFrost] = useState(autumnFrostDate);

  const [backupStatus, setBackupStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentPalette) {
      setSelectedPalette(currentPalette);
    }
  }, [currentPalette]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    setLocation(locationName);
    const preset = PRESET_LOCATIONS.find((l) => l.name === locationName);
    if (preset) {
      setLat(preset.lat);
      setLng(preset.lng);
    }
  }, [locationName]);

  const handlePaletteSelect = (palette: ColorPalette) => {
    setSelectedPalette(palette);
    applyPaletteToDOM(palette);
    if (onPaletteChange) {
      onPaletteChange(palette);
    }
  };

  const handleSelectPreset = (preset: { name: string; lat: number; lng: number }) => {
    setLocation(preset.name);
    setLat(preset.lat);
    setLng(preset.lng);
  };

  const handleExport = () => {
    exportBackup();
    setBackupStatus({
      type: 'success',
      message: `Varukoopia edukalt alla laaditud! Salvestatud ${beds.length} peenart ja ${journal.length} päeviku sissekannet.`
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          const result = await importBackup(content);
          if (result.success) {
            setBackupStatus({ type: 'success', message: result.message });
          } else {
            setBackupStatus({ type: 'error', message: result.message });
          }
        } catch (err: any) {
          setBackupStatus({ type: 'error', message: err?.message || 'Varukoopia import ebaõnnestus.' });
        }
      }
    };

    reader.onerror = () => {
      setBackupStatus({ type: 'error', message: 'Faili lugemine ebaõnnestus.' });
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--kulv-surface, #FFFDF8)',
          color: 'var(--kulv-text, #2A2E24)',
          borderRadius: '16px',
          border: '1px solid var(--kulv-border, #C9BFA9)',
          boxShadow: 'var(--kulv-shadow-card, 0 4px 16px rgba(0,0,0,0.15))',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2
            id="settings-title"
            className="font-serif-display"
            style={{ fontSize: '21px', fontWeight: 700, margin: 0, color: 'var(--kulv-text, #2A2E24)' }}
          >
            Seaded ja andmehaldus
          </h2>
          <button
            onClick={onClose}
            aria-label="Sulge aken"
            className="touch-target"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--kulv-text-muted, #5F675A)',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Language Selection */}
        <div style={{ marginBottom: '18px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '6px',
              color: 'var(--kulv-text, #2A2E24)'
            }}
          >
            {language === 'en' ? 'Language / Keel:' : 'Rakenduse keel:'}
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setLanguage('et')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border:
                  language === 'et'
                    ? '1.5px solid var(--kulv-primary, #4F6B45)'
                    : '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: language === 'et' ? 'rgba(79, 107, 69, 0.15)' : 'var(--kulv-surface, #FFFDF8)',
                color: language === 'et' ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text, #2A2E24)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              🇪🇪 Eesti keel
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border:
                  language === 'en'
                    ? '1.5px solid var(--kulv-primary, #4F6B45)'
                    : '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: language === 'en' ? 'rgba(79, 107, 69, 0.15)' : 'var(--kulv-surface, #FFFDF8)',
                color: language === 'en' ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text, #2A2E24)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              🇬🇧 English
            </button>
          </div>
        </div>

        {/* Color Palette Selector */}
        <div style={{ marginBottom: '18px' }}>
          <label
            htmlFor="palette-select"
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '6px',
              color: 'var(--kulv-text, #2A2E24)'
            }}
          >
            {language === 'en' ? 'Color Palette:' : 'Värvipalett:'}
          </label>
          <select
            id="palette-select"
            data-testid="palette-select"
            name="palette"
            aria-label="Värvipalett"
            value={selectedPalette}
            onChange={(e) => handlePaletteSelect(e.target.value as ColorPalette)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              color: 'var(--kulv-text, #2A2E24)',
              fontSize: '14px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {PALETTE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
          <p style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '4px' }}>
            {PALETTE_OPTIONS.find((opt) => opt.id === selectedPalette)?.description}
          </p>
        </div>

        {/* Nordic Agroclimatic Regional Presets */}
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '6px',
              color: 'var(--kulv-text, #2A2E24)'
            }}
          >
            {language === 'en'
              ? 'Nordic Agroclimatic Zone (Auto Frost Dates):'
              : 'Agrokliima tsoon (automaatsed öökülmad ja GDD):'}
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '6px',
              marginBottom: '8px'
            }}
          >
            {Object.values(NORDIC_REGIONAL_FROST_DATA).map((zone) => {
              const isSelected = springFrost === zone.springFrostDate && autumnFrost === zone.autumnFrostDate;
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => {
                    setSpringFrost(zone.springFrostDate);
                    setAutumnFrost(zone.autumnFrostDate);
                    if (zone.id === 'north_coast') {
                      setLocation('Tallinn');
                      setLat(59.437);
                      setLng(24.754);
                    } else if (zone.id === 'southeast') {
                      setLocation('Tartu');
                      setLat(58.378);
                      setLng(26.729);
                    } else if (zone.id === 'central') {
                      setLocation('Paide');
                      setLat(58.887);
                      setLng(25.568);
                    } else if (zone.id === 'islands') {
                      setLocation('Kuressaare');
                      setLat(58.253);
                      setLng(22.485);
                    }
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    textAlign: 'left',
                    fontSize: '11px',
                    cursor: 'pointer',
                    border: isSelected
                      ? '1.5px solid var(--kulv-primary, #4F6B45)'
                      : '1px solid var(--kulv-border, #C9BFA9)',
                    backgroundColor: isSelected ? 'rgba(79, 107, 69, 0.15)' : 'var(--kulv-surface-muted, #EFE6D4)',
                    color: isSelected ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text, #2A2E24)'
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{language === 'en' ? zone.nameEn : zone.nameEt}</div>
                  <div style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '2px' }}>
                    ❄️ {zone.springFrostDate} – {zone.autumnFrostDate}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Regional Presets & Coordinates */}
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '6px',
              color: 'var(--kulv-text, #2A2E24)'
            }}
          >
            {language === 'en'
              ? 'Garden Location & Weather Coordinates:'
              : 'Aia asukoht ja koordinaadid (ilmaprognoos):'}
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {PRESET_LOCATIONS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border:
                    location === preset.name
                      ? '1px solid var(--kulv-primary, #4F6B45)'
                      : '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor:
                    location === preset.name ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-surface-muted, #EFE6D4)',
                  color: location === preset.name ? 'white' : 'var(--kulv-text, #2A2E24)'
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  color: 'var(--kulv-text-muted, #5F675A)',
                  marginBottom: '2px'
                }}
              >
                Nimi:
              </label>
              <input
                id="location-input"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                  color: 'var(--kulv-text, #2A2E24)',
                  fontSize: '13px'
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  color: 'var(--kulv-text-muted, #5F675A)',
                  marginBottom: '2px'
                }}
              >
                Laiuskraad (°N):
              </label>
              <input
                type="number"
                step="0.001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value) || 59.437)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                  color: 'var(--kulv-text, #2A2E24)',
                  fontSize: '13px'
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  color: 'var(--kulv-text-muted, #5F675A)',
                  marginBottom: '2px'
                }}
              >
                Pikkuskraad (°E):
              </label>
              <input
                type="number"
                step="0.001"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value) || 24.754)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                  color: 'var(--kulv-text, #2A2E24)',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Frost Dates Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '4px',
                color: 'var(--kulv-text, #2A2E24)'
              }}
            >
              Kevadine öökülmavaba (KK-PP):
            </label>
            <input
              type="text"
              value={springFrost}
              onChange={(e) => setSpringFrost(e.target.value)}
              placeholder="05-20"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                color: 'var(--kulv-text, #2A2E24)',
                fontSize: '13px'
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '4px',
                color: 'var(--kulv-text, #2A2E24)'
              }}
            >
              Sügisese öökülma algus (KK-PP):
            </label>
            <input
              type="text"
              value={autumnFrost}
              onChange={(e) => setAutumnFrost(e.target.value)}
              placeholder="09-25"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                color: 'var(--kulv-text, #2A2E24)',
                fontSize: '13px'
              }}
            />
          </div>
        </div>

        {/* Backup & Export Section */}
        <div
          style={{
            backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '18px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
              Varukoopia ja andmehaldus (JSON)
            </span>
            <span style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)' }}>
              {beds.length} peenart • {journal.length} sissekannet
            </span>
          </div>

          <p
            style={{
              fontSize: '11px',
              color: 'var(--kulv-text-muted, #5F675A)',
              margin: '0 0 10px 0',
              lineHeight: 1.4
            }}
          >
            Ekspordi kogu aia konfiguratsioon (peenrad, lahtrite istutused, seaded) ja aiapäeviku märkmed JSON failina
            varundamiseks või seadmete vahel liigutamiseks.
          </p>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleExport}
              data-testid="export_backup_btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--kulv-primary, #4F6B45)',
                color: 'white',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Download size={15} />
              <span>Ekspordi varukoopia (JSON)</span>
            </button>

            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                color: 'var(--kulv-text, #2A2E24)',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Upload size={15} />
              <span>Taasta varukoopiast</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {backupStatus && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '10px',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                backgroundColor:
                  backupStatus.type === 'success' ? 'rgba(79, 107, 69, 0.15)' : 'rgba(180, 35, 58, 0.15)',
                color: backupStatus.type === 'success' ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-danger, #B4233A)',
                fontWeight: 600
              }}
            >
              {backupStatus.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              <span>{backupStatus.message}</span>
            </div>
          )}

          {/* Durable Save Ledger & Storage Status Badge */}
          <div
            style={{
              marginTop: '12px',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              flexWrap: 'wrap',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--kulv-text, #2A2E24)' }}>
              <Database size={13} color="var(--kulv-primary, #4F6B45)" />
              <span>
                Lokaalne salvestusmälu:{' '}
                <strong>
                  {saveStatus === 'saved'
                    ? 'Sünkroniseeritud ja kaitstud'
                    : saveStatus === 'saving'
                      ? 'Salvestan muudatusi...'
                      : 'Salvestusviga'}
                </strong>
              </span>
            </div>
            <div
              style={{
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 700,
                backgroundColor:
                  saveStatus === 'saved'
                    ? 'rgba(79, 107, 69, 0.15)'
                    : saveStatus === 'saving'
                      ? 'rgba(217, 122, 61, 0.15)'
                      : 'rgba(180, 35, 58, 0.15)',
                color:
                  saveStatus === 'saved'
                    ? 'var(--kulv-primary, #4F6B45)'
                    : saveStatus === 'saving'
                      ? 'var(--kulv-accent, #D97A3D)'
                      : 'var(--kulv-danger, #B4233A)'
              }}
            >
              {saveStatus === 'saved' ? '● Salvestatud' : saveStatus === 'saving' ? '○ Salvestan...' : '⚠ Viga'}
            </div>
          </div>

          {/* Reset to Defaults (Zero window.confirm, accessible in-app confirmation banner) */}
          <div style={{ marginTop: '12px', borderTop: '1px dashed var(--kulv-border, #C9BFA9)', paddingTop: '10px' }}>
            {!showResetConfirm ? (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                data-testid="reset_data_defaults_btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  color: 'var(--kulv-text-muted, #5F675A)',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={12} />
                <span>Taasta aia algandmed ja näidispeenrad</span>
              </button>
            ) : (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(180, 35, 58, 0.08)',
                  border: '1px solid rgba(180, 35, 58, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--kulv-danger, #B85C33)', fontWeight: 600 }}>
                  Kas oled kindel? Kõik praegused peenrad, logid ja märkmed asendatakse KÜLVi algsete näidisandmetega.
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      resetToDefaults();
                      setShowResetConfirm(false);
                      setBackupStatus({
                        type: 'info',
                        message: 'Aia andmed on taastatud algseadetele.'
                      });
                    }}
                    data-testid="confirm_reset_data_btn"
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--kulv-danger, #B85C33)',
                      color: 'white',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Jah, taasta algandmed
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      color: 'var(--kulv-text, #2A2E24)',
                      border: '1px solid var(--kulv-border, #C9BFA9)',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    Tühista
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
          <button
            onClick={onClose}
            style={{
              minHeight: '44px',
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: 'transparent',
              color: 'var(--kulv-text, #2A2E24)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Sulge
          </button>
          <button
            onClick={() => {
              if (onSaveSettings) {
                onSaveSettings({
                  palette: selectedPalette,
                  location,
                  lat,
                  lng,
                  springFrost,
                  autumnFrost
                });
              }
              onClose();
            }}
            style={{
              minHeight: '44px',
              padding: '10px 22px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--kulv-primary, #4F6B45)',
              color: 'var(--kulv-button-text, #FFFFFF)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Salvesta seaded
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
