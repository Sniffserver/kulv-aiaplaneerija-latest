import React, { useState, useEffect } from 'react';
import { X, Sparkles, Droplet, Sprout, Info, Check, Calculator, Clock, Thermometer, Package } from 'lucide-react';
import soilData from '../../assets/data/soilRecipes.json';
import { useGarden } from '../../context/GardenContext';

export interface SoilRecipesDialogProps {
  isOpen: boolean;
  onDismiss: () => void;
  initialBedDimensions?: {
    widthM: number;
    lengthM: number;
    heightM: number;
    label?: string;
  };
}

export const SoilRecipesDialog: React.FC<SoilRecipesDialogProps> = ({ isOpen, onDismiss, initialBedDimensions }) => {
  const { language, t } = useGarden();

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'muld' | 'vaetistee'>('all');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(soilData.recipes[0].id);
  const [batchVolumeL, setBatchVolumeL] = useState<number>(100);

  // Bed dimension calculator inputs
  const [showBedCalculator, setShowBedCalculator] = useState<boolean>(false);
  const [bedWidthM, setBedWidthM] = useState<number>(1.2);
  const [bedLengthM, setBedLengthM] = useState<number>(3.0);
  const [bedHeightM, setBedHeightM] = useState<number>(0.4);

  useEffect(() => {
    if (initialBedDimensions) {
      setBedWidthM(initialBedDimensions.widthM);
      setBedLengthM(initialBedDimensions.lengthM);
      setBedHeightM(initialBedDimensions.heightM);
      const vol = Math.round(
        initialBedDimensions.widthM * initialBedDimensions.lengthM * initialBedDimensions.heightM * 1000
      );
      if (vol > 0) {
        setBatchVolumeL(vol);
        setShowBedCalculator(true);
      }
    }
  }, [initialBedDimensions, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onDismiss]);

  if (!isOpen) return null;

  const recipes = soilData.recipes.filter((r) => selectedCategory === 'all' || r.category === selectedCategory);

  const activeRecipe = soilData.recipes.find((r) => r.id === selectedRecipeId) || soilData.recipes[0];

  // Scale factor based on standard 100L base recipe
  const scale = batchVolumeL / 100;

  // Scale amendments numbers if format is e.g. "150 g", "5-10 L"
  const scaleAmount = (amountStr: string): string => {
    const match = amountStr.match(/^([\d.]+)\s*([a-zA-Z]+)/);
    if (match) {
      const num = parseFloat(match[1]);
      const unit = match[2];
      const scaled = Math.round(num * scale * 10) / 10;
      return `${scaled} ${unit}`;
    }
    const rangeMatch = amountStr.match(/^([\d.]+)\s*-\s*([\d.]+)\s*([a-zA-Z]+)/);
    if (rangeMatch) {
      const min = Math.round(parseFloat(rangeMatch[1]) * scale * 10) / 10;
      const max = Math.round(parseFloat(rangeMatch[2]) * scale * 10) / 10;
      return `${min}–${max} ${rangeMatch[3]}`;
    }
    return amountStr;
  };

  const calculatedBedVolume = Math.round(bedWidthM * bedLengthM * bedHeightM * 1000);

  const applyBedVolume = () => {
    if (calculatedBedVolume > 0) {
      setBatchVolumeL(calculatedBedVolume);
      setShowBedCalculator(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('soil_modal_title')}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 1000
      }}
      onClick={onDismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--kulv-surface, #FFFDF8)',
          borderRadius: '16px',
          border: '1px solid var(--kulv-border, #C9BFA9)',
          boxShadow: 'var(--kulv-shadow-card, 0 8px 30px rgba(0,0,0,0.25))',
          maxWidth: '740px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--kulv-border, #C9BFA9)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(217, 122, 61, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--kulv-accent, #D97A3D)',
                flexShrink: 0
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <h2
                className="font-serif-display"
                style={{ margin: 0, fontSize: '19px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}
              >
                {t('soil_modal_title')}
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '2px' }}>
                {t('soil_modal_subtitle')}
              </div>
            </div>
          </div>
          <button
            onClick={onDismiss}
            aria-label={t('btn_close')}
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

        {/* Category Filters */}
        <div
          style={{
            padding: '10px 20px',
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid var(--kulv-surface-muted, #EFE6D4)',
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            overflowX: 'auto'
          }}
        >
          <button
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border:
                selectedCategory === 'all'
                  ? '1px solid var(--kulv-primary, #4F6B45)'
                  : '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor:
                selectedCategory === 'all' ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-surface-muted, #EFE6D4)',
              color: selectedCategory === 'all' ? 'white' : 'var(--kulv-text, #2A2E24)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {t('soil_cat_all')} ({soilData.recipes.length})
          </button>
          <button
            onClick={() => setSelectedCategory('muld')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border:
                selectedCategory === 'muld'
                  ? '1px solid var(--kulv-primary, #4F6B45)'
                  : '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor:
                selectedCategory === 'muld' ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-surface-muted, #EFE6D4)',
              color: selectedCategory === 'muld' ? 'white' : 'var(--kulv-text, #2A2E24)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {t('soil_cat_soil')}
          </button>
          <button
            onClick={() => setSelectedCategory('vaetistee')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border:
                selectedCategory === 'vaetistee'
                  ? '1px solid var(--kulv-primary, #4F6B45)'
                  : '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor:
                selectedCategory === 'vaetistee'
                  ? 'var(--kulv-primary, #4F6B45)'
                  : 'var(--kulv-surface-muted, #EFE6D4)',
              color: selectedCategory === 'vaetistee' ? 'white' : 'var(--kulv-text, #2A2E24)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {t('soil_cat_tea')}
          </button>
        </div>

        {/* Content body */}
        <div style={{ display: 'flex', flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {/* Left: Recipe List */}
          <div
            style={{
              width: '240px',
              borderRight: '1px solid var(--kulv-border, #C9BFA9)',
              overflowY: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              flexShrink: 0
            }}
          >
            {recipes.map((recipe) => {
              const isSelected = recipe.id === activeRecipe.id;
              return (
                <button
                  key={recipe.id}
                  onClick={() => setSelectedRecipeId(recipe.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: isSelected ? '1.5px solid var(--kulv-primary, #4F6B45)' : '1px solid transparent',
                    backgroundColor: isSelected ? 'var(--kulv-surface-muted, #EFE6D4)' : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                    {recipe.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                    {recipe.category === 'muld'
                      ? language === 'en'
                        ? 'Living Soil Base'
                        : 'Mullapõhi'
                      : language === 'en'
                        ? 'Liquid Tea'
                        : 'Vedelväetis'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Recipe Detail & Dynamic Batch Calculator */}
          <div
            style={{
              flex: 1,
              padding: '16px 20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor:
                      activeRecipe.category === 'muld' ? 'rgba(79, 107, 69, 0.15)' : 'rgba(217, 122, 61, 0.15)',
                    color:
                      activeRecipe.category === 'muld' ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-accent, #D97A3D)'
                  }}
                >
                  {activeRecipe.category === 'muld'
                    ? language === 'en'
                      ? 'Raised Bed & Pot Substrate'
                      : 'Kõrgpeenra & potimuld'
                    : language === 'en'
                      ? 'Organic Liquid Fertilizer'
                      : 'Looduslik väetistee'}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--kulv-text, #2A2E24)' }}>
                {activeRecipe.name}
              </h3>
              <p
                style={{
                  margin: '6px 0 0 0',
                  fontSize: '13px',
                  color: 'var(--kulv-text-muted, #5F675A)',
                  lineHeight: 1.4
                }}
              >
                {activeRecipe.description}
              </p>
            </div>

            {/* Dynamic Batch Volume Sizing with Slider and Presets */}
            <div
              style={{
                backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                border: '1px solid var(--kulv-border, #C9BFA9)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                  {language === 'en' ? 'Target Batch Volume:' : 'Valmista kogus:'}{' '}
                  <span className="font-mono" style={{ color: 'var(--kulv-primary, #4F6B45)', fontSize: '15px' }}>
                    {batchVolumeL} L
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowBedCalculator((prev) => !prev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--kulv-accent, #D97A3D)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Calculator size={14} />
                  <span>
                    {showBedCalculator
                      ? language === 'en'
                        ? 'Hide Bed Calc'
                        : 'Peida peenra kalkulaator'
                      : language === 'en'
                        ? 'Calc from Bed Dims'
                        : 'Arvuta peenra mõõtudest'}
                  </span>
                </button>
              </div>

              {/* Volume Slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--kulv-text-muted, #5F675A)' }}>
                  10 L
                </span>
                <input
                  type="range"
                  min={10}
                  max={2500}
                  step={10}
                  value={batchVolumeL}
                  onChange={(e) => setBatchVolumeL(Number(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--kulv-primary, #4F6B45)', cursor: 'pointer' }}
                  aria-label={t('soil_calc_liters')}
                />
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--kulv-text-muted, #5F675A)' }}>
                  2500 L
                </span>
              </div>

              {/* Bed Dimension Calculator Panel */}
              {showBedCalculator && (
                <div
                  style={{
                    backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                    borderRadius: '8px',
                    padding: '10px',
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                    {language === 'en'
                      ? 'Bed Dimensions (metres) → Calculated Volume'
                      : 'Peenra mõõtmed (meetrites) → Mulla kogus'}
                    :
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)', display: 'block' }}>
                        {t('soil_calc_width')}
                      </label>
                      <input
                        type="number"
                        step={0.1}
                        min={0.2}
                        max={5}
                        value={bedWidthM}
                        onChange={(e) => setBedWidthM(parseFloat(e.target.value) || 1)}
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          borderRadius: '6px',
                          border: '1px solid var(--kulv-border, #C9BFA9)',
                          fontSize: '12px',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)', display: 'block' }}>
                        {t('soil_calc_length')}
                      </label>
                      <input
                        type="number"
                        step={0.1}
                        min={0.5}
                        max={20}
                        value={bedLengthM}
                        onChange={(e) => setBedLengthM(parseFloat(e.target.value) || 2)}
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          borderRadius: '6px',
                          border: '1px solid var(--kulv-border, #C9BFA9)',
                          fontSize: '12px',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)', display: 'block' }}>
                        {t('soil_calc_height')}
                      </label>
                      <input
                        type="number"
                        step={0.05}
                        min={0.1}
                        max={1.5}
                        value={bedHeightM}
                        onChange={(e) => setBedHeightM(parseFloat(e.target.value) || 0.4)}
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          borderRadius: '6px',
                          border: '1px solid var(--kulv-border, #C9BFA9)',
                          fontSize: '12px',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>
                      {language === 'en' ? 'Calculated:' : 'Vajalik kogus:'}{' '}
                      <strong className="font-mono" style={{ color: 'var(--kulv-primary, #4F6B45)' }}>
                        {calculatedBedVolume} L
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={applyBedVolume}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: 'var(--kulv-primary, #4F6B45)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {t('soil_calc_apply_dims')}
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Presets */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { label: '15 L (Pott)', vol: 15 },
                  { label: '50 L (Kast)', vol: 50 },
                  { label: '100 L (Std)', vol: 100 },
                  { label: '350 L (Kõrgpeenar)', vol: 350 },
                  { label: '1000 L (1.2×2m)', vol: 1000 },
                  { label: '1500 L (1.2×3m)', vol: 1500 }
                ].map((item) => (
                  <button
                    key={item.vol}
                    type="button"
                    onClick={() => setBatchVolumeL(item.vol)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border:
                        batchVolumeL === item.vol
                          ? '1.5px solid var(--kulv-primary, #4F6B45)'
                          : '1px solid var(--kulv-border, #C9BFA9)',
                      backgroundColor:
                        batchVolumeL === item.vol ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-surface, #FFFDF8)',
                      color: batchVolumeL === item.vol ? 'white' : 'var(--kulv-text, #2A2E24)'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Shopping Bag Estimator for Soil */}
              {activeRecipe.category === 'muld' && (
                <div
                  style={{
                    backgroundColor: 'rgba(79, 107, 69, 0.08)',
                    border: '1px solid var(--kulv-primary, #4F6B45)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Package size={15} color="var(--kulv-primary, #4F6B45)" />
                    <span style={{ fontWeight: 600 }}>
                      {language === 'en' ? 'Packaging & Store Estimate:' : 'Ostunimekiri poest:'}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--kulv-primary, #4F6B45)' }}>
                    ~{Math.ceil(batchVolumeL / 50)} {language === 'en' ? 'bags (50L)' : 'kotti (50L)'} / ~
                    {Math.ceil(batchVolumeL / 60)} {language === 'en' ? 'bags (60L)' : 'kotti (60L)'}
                  </div>
                </div>
              )}

              {/* Hügelkultur & Lasagna Visual Layering Breakdown */}
              {activeRecipe.id === 'hugel_lasagna' && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    fontSize: '11px'
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--kulv-text, #2A2E24)', marginBottom: '4px' }}>
                    {language === 'en'
                      ? '🍰 Hügelkultur & Lasagna Bed Cross-Section:'
                      : '🍰 Hügelkultur & Lasanje peenra kihtide jaotus:'}
                  </div>
                  <div
                    style={{
                      backgroundColor: '#5c4033',
                      color: 'white',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>
                      1.{' '}
                      {language === 'en'
                        ? 'Top layer (30%): Mature compost + topsoil'
                        : 'Pealiskiht (30%): Valmis kompostimuld + aiamuld'}
                    </span>
                    <span className="font-mono">
                      {Math.round(batchVolumeL * 0.3)} L (~{Math.ceil((batchVolumeL * 0.3) / 50)} kotti)
                    </span>
                  </div>
                  <div
                    style={{
                      backgroundColor: '#8a6240',
                      color: 'white',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>
                      2.{' '}
                      {language === 'en'
                        ? 'Middle layer (30%): Leaves, lawn mulch, green manure'
                        : 'Vahekiht (30%): Muruhake, lehed, aiajäätmed'}
                    </span>
                    <span className="font-mono">{Math.round(batchVolumeL * 0.3)} L</span>
                  </div>
                  <div
                    style={{
                      backgroundColor: '#3d2817',
                      color: 'white',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>
                      3.{' '}
                      {language === 'en'
                        ? 'Base layer (40%): Rotting logs, hardwood branches'
                        : 'Põhjakiht (40%): Jämedad lehtpuupalgid, oksad'}
                    </span>
                    <span className="font-mono">{Math.round(batchVolumeL * 0.4)} L</span>
                  </div>
                </div>
              )}
            </div>

            {/* Base Ratios */}
            <div>
              <h4
                style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}
              >
                {t('soil_base_ingredients')}:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {activeRecipe.baseRatio.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                      border: '1px solid var(--kulv-border, #C9BFA9)',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--kulv-text, #2A2E24)' }}>{item.ingredient}</span>
                      <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '2px' }}>
                        {item.note}
                      </div>
                    </div>
                    <span
                      className="font-mono tabular-nums"
                      style={{
                        fontWeight: 700,
                        color: 'var(--kulv-primary, #4F6B45)',
                        backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.parts}{' '}
                      {item.parts === 1 ? (language === 'en' ? 'part' : 'osa') : language === 'en' ? 'parts' : 'osa'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Amendments (if any) */}
            {activeRecipe.amendmentsPer100L && activeRecipe.amendmentsPer100L.length > 0 && (
              <div>
                <h4
                  style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}
                >
                  {t('soil_amendments')} ({batchVolumeL} L):
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activeRecipe.amendmentsPer100L.map((amendment, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                        border: '1px solid var(--kulv-border, #C9BFA9)',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--kulv-text, #2A2E24)' }}>{amendment.name}</span>
                        <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '2px' }}>
                          {amendment.purpose}
                        </div>
                      </div>
                      <span
                        className="font-mono tabular-nums"
                        style={{
                          fontWeight: 700,
                          color: 'var(--kulv-accent, #D97A3D)',
                          backgroundColor: 'var(--kulv-accent-soft, #F3D8C2)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {scaleAmount(amendment.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tea Brewing & Fermentation Guide Card (for liquid teas) */}
            {activeRecipe.category === 'vaetistee' && (
              <div
                style={{
                  backgroundColor: 'rgba(217, 122, 61, 0.08)',
                  border: '1px solid var(--kulv-accent, #D97A3D)',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 700,
                    color: 'var(--kulv-accent, #D97A3D)'
                  }}
                >
                  <Clock size={15} />
                  <span>{t('soil_tea_ferment_title')}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '4px' }}>
                  <div
                    style={{
                      backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid var(--kulv-border, #C9BFA9)'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '11px' }}>
                      {language === 'en' ? 'Juurele kastmine' : 'Juurele kastmine'}:
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '2px' }}>
                      {language === 'en'
                        ? 'Dilute 1:10 with rainwater (1L tea to 10L water).'
                        : 'Lahjenda 1:10 vihmaveega (1L leotist 10L veele).'}
                    </div>
                  </div>
                  <div
                    style={{
                      backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid var(--kulv-border, #C9BFA9)'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '11px' }}>
                      {language === 'en' ? 'Lehekaudne pritsimine' : 'Lehekaudne pritsimine'}:
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '2px' }}>
                      {language === 'en'
                        ? 'Dilute 1:20 and filter through cloth. Spray in evening.'
                        : 'Lahjenda 1:20 ja kurna läbi riide. Pritsi õhtul.'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step-by-Step Instructions */}
            <div
              style={{
                backgroundColor: 'rgba(79, 107, 69, 0.08)',
                border: '1px solid var(--kulv-primary, #4F6B45)',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '12px',
                lineHeight: 1.5,
                color: 'var(--kulv-text, #2A2E24)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  marginBottom: '4px',
                  color: 'var(--kulv-primary, #4F6B45)'
                }}
              >
                <Info size={15} />
                <span>{t('soil_instructions')}:</span>
              </div>
              {activeRecipe.instructions}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
