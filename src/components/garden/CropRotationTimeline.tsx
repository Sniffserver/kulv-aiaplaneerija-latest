import React, { useState, useMemo, useEffect } from 'react';
import { GardenBed, Plant } from '../../types';
import { useGarden } from '../../context/GardenContext';
import { BedSuccessionSlot, EstonianRegionId, CropProtectionType, BotanicalFamilyId } from '../../types/rotation';
import { useCropRotationStore } from '../../stores/cropRotationStore';
import { CropRotationEngine, BOTANICAL_FAMILY_DETAILS } from '../../logic/cropRotationEngine';
import {
  EstonianFrostEngine,
  ESTONIAN_REGIONS,
  PROTECTION_OFFSETS,
  getDayOfYear
} from '../../logic/estonianFrostEngine';
import { AddSuccessionDialog } from '../dialogs/AddSuccessionDialog';
import { BedRotationCycleEditor } from './BedRotationCycleEditor';
import { SeasonalSowingPrintDialog } from '../dialogs/SeasonalSowingPrintDialog';
import {
  Calendar,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Shield,
  Sprout,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle2,
  Leaf,
  RotateCw,
  Printer
} from 'lucide-react';

interface CropRotationTimelineProps {
  beds: GardenBed[];
  plants: Plant[];
  language?: 'et' | 'en';
}

const TIMELINE_START_DOY = 60; // March 1st approx
const TIMELINE_END_DOY = 334; // November 30th approx
const TOTAL_TIMELINE_DAYS = TIMELINE_END_DOY - TIMELINE_START_DOY;

const MONTHS_CONFIG = [
  { nameEt: 'Märts', nameEn: 'March', startDoy: 60, days: 31 },
  { nameEt: 'Aprill', nameEn: 'April', startDoy: 91, days: 30 },
  { nameEt: 'Mai', nameEn: 'May', startDoy: 121, days: 31 },
  { nameEt: 'Juuni', nameEn: 'June', startDoy: 152, days: 30 },
  { nameEt: 'Juuli', nameEn: 'July', startDoy: 182, days: 31 },
  { nameEt: 'August', nameEn: 'August', startDoy: 213, days: 31 },
  { nameEt: 'September', nameEn: 'September', startDoy: 244, days: 30 },
  { nameEt: 'Oktoober', nameEn: 'October', startDoy: 274, days: 31 },
  { nameEt: 'November', nameEn: 'November', startDoy: 305, days: 30 }
];

export const CropRotationTimeline: React.FC<CropRotationTimelineProps> = ({ beds, plants, language = 'et' }) => {
  const {
    selectedYear,
    setSelectedYear,
    selectedRegion,
    setSelectedRegion,
    successionSlots,
    historyRecords,
    deleteSuccessionSlot,
    addSuccessionSlot,
    resetToDemoHistory
  } = useCropRotationStore();
  const { showWarnings, toggleShowWarnings } = useGarden();

  const [filterBedId, setFilterBedId] = useState<string>('all');
  const [activeSlotToEdit, setActiveSlotToEdit] = useState<BedSuccessionSlot | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [dialogBedId, setDialogBedId] = useState<string>(beds[0]?.id || 'bed_1');
  const [expandedHistoryBedId, setExpandedHistoryBedId] = useState<string | null>(null);
  const [expandedRotationCycleBedId, setExpandedRotationCycleBedId] = useState<string | null>(null);
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState<boolean>(false);

  // Region and frost dates
  const regionProfile = ESTONIAN_REGIONS[selectedRegion] || ESTONIAN_REGIONS.central;
  const frostData = useMemo(() => EstonianFrostEngine.getAdjustedFrostDates(selectedRegion, 'none'), [selectedRegion]);

  // Display beds
  const visibleBeds = useMemo(() => {
    if (filterBedId === 'all') return beds;
    return beds.filter((b) => b.id === filterBedId);
  }, [beds, filterBedId]);

  // Agronomic successor recommendations for the active/filtered bed
  const targetBedForRec = useMemo(() => {
    return filterBedId !== 'all' ? beds.find((b) => b.id === filterBedId) : beds[0];
  }, [beds, filterBedId]);

  const priorFamilyForRec = useMemo(() => {
    if (!targetBedForRec) return 'Fabaceae';
    const bedSlots = successionSlots.filter((s) => s.bedId === targetBedForRec.id);
    if (bedSlots.length > 0) {
      return bedSlots[bedSlots.length - 1].botanicalFamily;
    }
    const hist = historyRecords.filter((h) => h.bedId === targetBedForRec.id).sort((a, b) => b.year - a.year);
    return hist[0]?.plantings[0]?.family || 'Fabaceae';
  }, [targetBedForRec, successionSlots, historyRecords]);

  const timelineSuccessorRecs = useMemo(() => {
    return CropRotationEngine.getSuccessorRecommendations(priorFamilyForRec, plants, 4);
  }, [priorFamilyForRec, plants]);

  // Dynamic Year Choices starting strictly from current season (2026+), no past years
  const [availableYears, setAvailableYears] = useState<number[]>([2026, 2027, 2028, 2029]);

  // Ensure selectedYear is never in the past
  useEffect(() => {
    if (selectedYear < 2026) {
      setSelectedYear(2026);
    }
  }, [selectedYear, setSelectedYear]);

  const handleAddNextYear = () => {
    setAvailableYears((prev) => {
      const nextYear = Math.max(...prev) + 1;
      setSelectedYear(nextYear);
      return [...prev, nextYear];
    });
  };

  // Calculate pixel percentages on timeline
  const getTimelinePct = (doy: number): number => {
    const clamped = Math.max(TIMELINE_START_DOY, Math.min(TIMELINE_END_DOY, doy));
    return ((clamped - TIMELINE_START_DOY) / TOTAL_TIMELINE_DAYS) * 100;
  };

  const springFrostPct = getTimelinePct(frostData.springFrostDoy);
  const autumnFrostPct = getTimelinePct(frostData.autumnFrostDoy);

  const handleOpenAddForBed = (bedId: string, preselectedPlantId?: string) => {
    setDialogBedId(bedId);
    if (preselectedPlantId) {
      const pl = plants.find((p) => p.id === preselectedPlantId);
      if (pl) {
        setActiveSlotToEdit({
          id: '',
          bedId,
          year: selectedYear,
          seasonSlot: 'main_crop',
          plantId: preselectedPlantId,
          plantName: pl.name,
          plantNameEn: pl.nameEn,
          plantIcon: pl.icon || '🌱',
          botanicalFamily: CropRotationEngine.resolveFamilyId(pl),
          guild: CropRotationEngine.resolveGuild(pl),
          sowDate: pl.optimalPlantOutDate || '05-20',
          harvestDate: pl.optimalHarvestDate || '08-25',
          daysToMaturity: pl.daysToMaturity || 80,
          protectionType: 'none',
          notes: ''
        });
      } else {
        setActiveSlotToEdit(null);
      }
    } else {
      setActiveSlotToEdit(null);
    }
    setIsAddDialogOpen(true);
  };

  const handleEditSlot = (slot: BedSuccessionSlot) => {
    setActiveSlotToEdit(slot);
    setDialogBedId(slot.bedId);
    setIsAddDialogOpen(true);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        backgroundColor: 'var(--kulv-surface, #FFFDF8)',
        border: '1px solid var(--kulv-border, #C9BFA9)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}
    >
      {/* Top Controls Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          borderBottom: '1px solid var(--kulv-border, #C9BFA9)',
          paddingBottom: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>🔄</span>
            <h2
              className="font-serif-display"
              style={{
                fontSize: '22px',
                fontWeight: 700,
                margin: 0,
                color: 'var(--kulv-text, #252A22)'
              }}
            >
              {language === 'en'
                ? 'Multi-Year Crop Rotation & Succession Planner'
                : 'Mitmeaastane viljavaheldus ja järjestikülvi ajajoon'}
            </h2>
          </div>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '13px',
              color: 'var(--kulv-text-muted, #5F675A)'
            }}
          >
            {language === 'en'
              ? 'Plan continuous spring, main, and autumn succession slots while preventing botanical family disease buildup.'
              : 'Planeeri tihedat kevad-, põhi- ja sügissaaki ning väldi sugukondade haigustekitajate kogunemist mulda.'}
          </p>
        </div>

        {/* Year Carousel */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
              borderRadius: '10px',
              padding: '3px',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              gap: '2px'
            }}
          >
            {availableYears.map((yr) => {
              const isSelected = selectedYear === yr;
              const isCurrent = yr === 2026;
              return (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  data-testid={`timeline_year_btn_${yr}`}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    borderRadius: '7px',
                    border: 'none',
                    backgroundColor: isSelected ? 'var(--kulv-surface, #FFFDF8)' : 'transparent',
                    color: isSelected ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text, #252A22)',
                    boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {yr} {isCurrent && (language === 'en' ? '· Current' : '· Aktiivne')}
                </button>
              );
            })}

            <button
              onClick={handleAddNextYear}
              data-testid="timeline_add_year_btn"
              title={language === 'en' ? 'Add upcoming year to timeline' : 'Lisa järgmine aasta ajajoonele'}
              aria-label={language === 'en' ? 'Add upcoming year' : 'Lisa järgmine aasta'}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '7px',
                border: '1px dashed var(--kulv-primary, #4F6B45)',
                backgroundColor: 'rgba(79, 107, 69, 0.08)',
                color: 'var(--kulv-primary, #4F6B45)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <span>+ {language === 'en' ? 'Year' : 'Aasta'}</span>
            </button>
          </div>

          <button
            onClick={() => setShowPrintDialog(true)}
            data-testid="open_timeline_print_dialog_btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 600,
              minHeight: '38px',
              borderRadius: '8px',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
              cursor: 'pointer',
              color: 'var(--kulv-text, #2A2E24)',
              transition: 'all 0.15s ease'
            }}
          >
            <Printer size={15} />
            <span>{language === 'en' ? 'Print Schedule & CSV' : 'Külvikava eksport & print'}</span>
          </button>
          <button
            onClick={resetToDemoHistory}
            title={language === 'en' ? 'Restore authentic multi-year demo history' : 'Taasta näidisajalugu'}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 500,
              minHeight: '38px',
              borderRadius: '8px',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
              cursor: 'pointer',
              color: 'var(--kulv-text, #2A2E24)',
              transition: 'all 0.15s ease'
            }}
          >
            {language === 'en' ? 'Reset Demo' : 'Algseadista näidis'}
          </button>
          <button
            onClick={toggleShowWarnings}
            style={{
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 600,
              minHeight: '38px',
              borderRadius: '8px',
              border: showWarnings ? '1px solid var(--kulv-primary, #4F6B45)' : '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: showWarnings ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-surface, #FFFDF8)',
              color: showWarnings ? '#FFFFFF' : 'var(--kulv-text, #252A22)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {showWarnings
              ? language === 'en'
                ? 'Hide Alerts'
                : 'Peida hoiatused'
              : language === 'en'
                ? 'Show Alerts'
                : 'Näita hoiatusi'}
          </button>
        </div>
      </div>

      {/* Climate Zone & Microclimate Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--kulv-surface-muted, #F4EFE6)',
          borderRadius: '12px',
          padding: '12px 16px',
          gap: '12px',
          border: '1px solid var(--kulv-border, #C9BFA9)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            <Shield size={16} color="var(--kulv-primary, #4F6B45)" />
            <span>{language === 'en' ? 'Estonian Climate Zone:' : 'Eesti agrokliima vöönd:'}</span>
          </div>

          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value as EstonianRegionId)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            {Object.values(ESTONIAN_REGIONS).map((reg) => (
              <option key={reg.id} value={reg.id}>
                {language === 'en' ? reg.nameEn : reg.nameEt} — {reg.hardinessZone}
              </option>
            ))}
          </select>
        </div>

        {/* Frost Threshold Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#2563EB', fontWeight: 600 }}>
              ❄️ {language === 'en' ? 'Spring Frost:' : 'Kevadine öökülm:'}
            </span>
            <span className="font-mono tabular-nums" style={{ fontWeight: 700 }}>
              {frostData.springFrostMMDD}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#D97706', fontWeight: 600 }}>
              ☀️ {language === 'en' ? 'Frost-Free Days:' : 'Öökülmavaba periood:'}
            </span>
            <span className="font-mono tabular-nums" style={{ fontWeight: 700, color: 'var(--kulv-primary, #4F6B45)' }}>
              {frostData.frostFreeDays} {language === 'en' ? 'days' : 'päeva'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#DC2626', fontWeight: 600 }}>
              🍂 {language === 'en' ? 'Autumn Frost:' : 'Sügisene öökülm:'}
            </span>
            <span className="font-mono tabular-nums" style={{ fontWeight: 700 }}>
              {frostData.autumnFrostMMDD}
            </span>
          </div>
        </div>
      </div>

      {/* Agronomic Next-Crop Recommendations Drawer */}
      {targetBedForRec && timelineSuccessorRecs.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            border: '1.5px solid rgba(79, 107, 69, 0.35)',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: 'var(--kulv-shadow-card, 0 1px 3px rgba(0,0,0,0.05))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(79, 107, 69, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--kulv-primary, #4F6B45)'
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                {language === 'en'
                  ? `Agronomic Next-Crop Recommendations for "${targetBedForRec.name}":`
                  : `Agronoomilised järgluskultuuri soovitused peenrale "${targetBedForRec.name}":`}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                {language === 'en'
                  ? `Optimized for preceding family ${priorFamilyForRec} & soil regeneration cycle`
                  : `Optimeeritud eelvilja (${priorFamilyForRec}) ja mulla toitaineringluse põhjal`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {timelineSuccessorRecs.map((rec) => (
              <button
                key={rec.plant.id}
                onClick={() => handleOpenAddForBed(targetBedForRec.id, rec.plant.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                  color: 'var(--kulv-text, #2A2E24)',
                  transition: 'all 0.15s ease'
                }}
                title={language === 'en' ? rec.reasonEn : rec.reasonEt}
              >
                <span>{rec.plant.icon || '🌱'}</span>
                <span>{rec.plant.name}</span>
                <span
                  style={{
                    fontSize: '9px',
                    backgroundColor: 'rgba(79, 107, 69, 0.15)',
                    color: 'var(--kulv-primary, #4F6B45)',
                    borderRadius: '4px',
                    padding: '1px 5px',
                    fontWeight: 700
                  }}
                >
                  {rec.synergyBadge}
                </span>
                <Plus size={12} color="var(--kulv-primary, #4F6B45)" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Botanical Family Color Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
          fontSize: '11px',
          padding: '8px 12px',
          backgroundColor: 'var(--kulv-surface, #FFFDF8)',
          borderRadius: '8px',
          border: '1px solid var(--kulv-border, #C9BFA9)'
        }}
      >
        <span style={{ fontWeight: 700, color: 'var(--kulv-text-muted, #5F675A)', marginRight: '4px' }}>
          {language === 'en' ? 'Botanical Families:' : 'Sugukonnad:'}
        </span>
        {Object.entries(BOTANICAL_FAMILY_DETAILS)
          .filter(([k]) => k !== 'Other')
          .map(([famKey, fam]) => (
            <div
              key={famKey}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: fam.bgTint,
                border: `1px solid ${fam.borderColor}`,
                color: fam.borderColor,
                fontWeight: 600
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: fam.color
                }}
              />
              <span>{language === 'en' ? fam.nameEn : fam.nameEt}</span>
            </div>
          ))}
      </div>

      {/* Main Interactive Timeline Area */}
      <div
        style={{
          border: '1px solid var(--kulv-border, #C9BFA9)',
          borderRadius: '12px',
          overflowX: 'auto',
          backgroundColor: 'var(--kulv-workspace, #FAF6ED)'
        }}
      >
        <div style={{ minWidth: '940px', padding: '16px' }}>
          {/* Timeline Months Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '180px 1fr',
              alignItems: 'center',
              borderBottom: '2px solid var(--kulv-border, #C9BFA9)',
              padding: '8px 12px',
              marginBottom: '12px',
              backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
              borderRadius: '8px'
            }}
          >
            <div
              data-testid="timeline_bed_header_label"
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--kulv-text, #252A22)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}
            >
              {language === 'en' ? 'GARDEN BED & ROTATION' : 'PEENAR & SEISUND'}
            </div>

            {/* Months Strip with Frost Bands */}
            <div style={{ position: 'relative', width: '100%', height: '32px' }}>
              {/* Spring Frost Risk Band */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  width: `${springFrostPct}%`,
                  top: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  borderRight: '2px dashed #3B82F6',
                  pointerEvents: 'none',
                  zIndex: 1
                }}
                title={
                  language === 'en'
                    ? `Spring frost zone (until ${frostData.springFrostMMDD})`
                    : `Kevadine öökülmavöönd (kuni ${frostData.springFrostMMDD})`
                }
              />

              {/* Autumn Frost Risk Band */}
              <div
                style={{
                  position: 'absolute',
                  left: `${autumnFrostPct}%`,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  borderLeft: '2px dashed #EF4444',
                  pointerEvents: 'none',
                  zIndex: 1
                }}
                title={
                  language === 'en'
                    ? `Autumn frost zone (after ${frostData.autumnFrostMMDD})`
                    : `Sügisene öökülmavöönd (alates ${frostData.autumnFrostMMDD})`
                }
              />

              {/* Safe Outdoor Window Label */}
              <div
                style={{
                  position: 'absolute',
                  left: `${springFrostPct}%`,
                  width: `${autumnFrostPct - springFrostPct}%`,
                  top: '-4px',
                  display: 'flex',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--kulv-primary, #4F6B45)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                🌿 {language === 'en' ? 'Safe Outdoor Season' : 'Ohutu avamaahooaeg'}
              </div>

              {/* Month Columns */}
              <div style={{ display: 'flex', width: '100%', height: '100%' }}>
                {MONTHS_CONFIG.map((m) => {
                  const widthPct = (m.days / TOTAL_TIMELINE_DAYS) * 100;
                  return (
                    <div
                      key={m.nameEt}
                      style={{
                        width: `${widthPct}%`,
                        textAlign: 'center',
                        borderLeft: '1px solid rgba(0,0,0,0.06)',
                        paddingTop: '10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--kulv-text, #252A22)'
                      }}
                    >
                      {language === 'en' ? m.nameEn : m.nameEt}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bed Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {visibleBeds.map((bed) => {
              const bedSlots = successionSlots.filter((s) => s.bedId === bed.id && s.year === selectedYear);

              // Audit bed history for rotation alerts
              const alerts = CropRotationEngine.auditBedHistory(bed.id, bedSlots, historyRecords, selectedYear);

              const isHistoryOpen = expandedHistoryBedId === bed.id;
              const bedPast = historyRecords.filter((r) => r.bedId === bed.id && r.year < selectedYear);

              return (
                <div
                  key={bed.id}
                  style={{
                    backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                >
                  {/* Bed Row Grid: Left Info | Right Timeline */}
                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '14px', alignItems: 'center' }}>
                    {/* Left Column: Bed Info */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '16px' }}>
                          {bed.type === 'greenhouse' ? '🏡' : bed.type === 'pot' ? '🪴' : '🪵'}
                        </span>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--kulv-text, #252A22)' }}>
                          {bed.name}
                        </div>
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '2px' }}>
                        {bed.width}m × {bed.length}m · {bed.coverType === 'greenhouse' ? 'Kasvuhoone' : 'Avamaa peenar'}
                      </div>

                      {/* History & Suggestion Controls */}
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                        <button
                          onClick={() => setExpandedHistoryBedId(isHistoryOpen ? null : bed.id)}
                          style={{
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid var(--kulv-border, #C9BFA9)',
                            backgroundColor: isHistoryOpen ? 'var(--kulv-surface, #FFFDF8)' : 'transparent',
                            cursor: 'pointer',
                            color: 'var(--kulv-primary, #4F6B45)'
                          }}
                        >
                          {isHistoryOpen
                            ? language === 'en'
                              ? 'Hide History'
                              : 'Peida ajalugu'
                            : language === 'en'
                              ? '4-Yr History'
                              : '4-a ajalugu'}
                        </button>

                        <button
                          onClick={() =>
                            setExpandedRotationCycleBedId(expandedRotationCycleBedId === bed.id ? null : bed.id)
                          }
                          title={
                            language === 'en'
                              ? 'Configure 3-5 year rotation cycle'
                              : 'Seadista 3-5 aastane viljavahelduskava'
                          }
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid var(--kulv-border, #C9BFA9)',
                            backgroundColor:
                              expandedRotationCycleBedId === bed.id
                                ? 'var(--kulv-surface-muted, #EFE6D4)'
                                : 'transparent',
                            cursor: 'pointer',
                            color: 'var(--kulv-primary, #4F6B45)'
                          }}
                        >
                          <RotateCw size={12} />
                          <span>
                            {expandedRotationCycleBedId === bed.id
                              ? language === 'en'
                                ? 'Close Plan'
                                : 'Sulge kava'
                              : language === 'en'
                                ? '3–5 Yr Cycle'
                                : '3–5 a ring'}
                          </span>
                        </button>

                        <button
                          onClick={() => handleOpenAddForBed(bed.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'var(--kulv-primary, #4F6B45)',
                            color: '#FFFFFF',
                            cursor: 'pointer'
                          }}
                        >
                          <Plus size={12} />
                          <span>{language === 'en' ? 'Add Slot' : 'Külv'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Timeline Track */}
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '72px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--kulv-border, #D8D0BF)',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Spring Frost Risk Overlay */}
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          width: `${springFrostPct}%`,
                          top: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(59, 130, 246, 0.05)',
                          borderRight: '1px dashed rgba(59, 130, 246, 0.4)',
                          pointerEvents: 'none'
                        }}
                      />

                      {/* Autumn Frost Risk Overlay */}
                      <div
                        style={{
                          position: 'absolute',
                          left: `${autumnFrostPct}%`,
                          right: 0,
                          top: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(239, 68, 68, 0.05)',
                          borderLeft: '1px dashed rgba(239, 68, 68, 0.4)',
                          pointerEvents: 'none'
                        }}
                      />

                      {/* Render Succession Crop Bars */}
                      {bedSlots.length === 0 ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: 'var(--kulv-text-muted, #7A8275)',
                            fontSize: '12px',
                            fontStyle: 'italic'
                          }}
                        >
                          {language === 'en'
                            ? 'No crops scheduled for this bed in ' + selectedYear + '. Click "+ Add Slot" to begin.'
                            : 'Sellele peenrale pole ' + selectedYear + '. aastal külve lisatud. Klõpsa "+ Külv".'}
                        </div>
                      ) : (
                        bedSlots.map((slot) => {
                          const sowDoy = getDayOfYear(slot.sowDate);
                          const harvestDoy = getDayOfYear(slot.harvestDate);

                          const leftPct = getTimelinePct(sowDoy);
                          const rightPct = getTimelinePct(harvestDoy);
                          const widthPct = Math.max(8, rightPct - leftPct);

                          const famInfo =
                            BOTANICAL_FAMILY_DETAILS[slot.botanicalFamily] || BOTANICAL_FAMILY_DETAILS.Other;
                          const frostHazard = EstonianFrostEngine.evaluateSlotFrostRisk(slot, selectedRegion);

                          return (
                            <div
                              key={slot.id}
                              style={{
                                position: 'absolute',
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                                top: '8px',
                                height: '54px',
                                backgroundColor: famInfo.color,
                                color: '#FFFFFF',
                                borderRadius: '7px',
                                padding: '4px 8px',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                zIndex: hoveredSlotId === slot.id ? 10 : 3,
                                border: frostHazard ? '2px solid #EF4444' : `1px solid ${famInfo.borderColor}`,
                                transition: 'transform 0.15s ease'
                              }}
                              onMouseEnter={() => setHoveredSlotId(slot.id)}
                              onMouseLeave={() => setHoveredSlotId(null)}
                              onClick={() => handleEditSlot(slot)}
                            >
                              {/* Top Bar: Icon + Plant Name + Family */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden' }}>
                                  <span style={{ fontSize: '13px' }}>{slot.plantIcon || '🌱'}</span>
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                  >
                                    {language === 'en' ? slot.plantNameEn || slot.plantName : slot.plantName}
                                  </span>
                                </div>

                                {frostHazard && (
                                  <span
                                    title={language === 'en' ? frostHazard.titleEn : frostHazard.titleEt}
                                    style={{
                                      backgroundColor: '#EF4444',
                                      color: '#FFFFFF',
                                      borderRadius: '4px',
                                      padding: '1px 3px',
                                      fontSize: '10px',
                                      fontWeight: 800
                                    }}
                                  >
                                    ❄️ OHT
                                  </span>
                                )}
                              </div>

                              {/* Bottom Details: Dates + DTM */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  fontSize: '10px',
                                  opacity: 0.95
                                }}
                              >
                                <span className="font-mono tabular-nums">
                                  {slot.sowDate} → {slot.harvestDate}
                                </span>
                                <span className="font-mono tabular-nums" style={{ fontWeight: 700 }}>
                                  {slot.daysToMaturity}d
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Rotational Pathogen & Nutrient Depletion Alerts for this bed */}
                  {showWarnings && alerts.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                      {alerts.map((alert) => (
                        <div
                          key={alert.id}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            backgroundColor:
                              alert.severity === 'danger'
                                ? '#FEF2F2'
                                : alert.severity === 'good'
                                  ? '#F0FDF4'
                                  : '#FFFBEB',
                            border: `1px solid ${
                              alert.severity === 'danger'
                                ? '#F87171'
                                : alert.severity === 'good'
                                  ? '#86EFAC'
                                  : '#FCD34D'
                            }`,
                            color:
                              alert.severity === 'danger'
                                ? '#991B1B'
                                : alert.severity === 'good'
                                  ? '#166534'
                                  : '#92400E',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px'
                          }}
                        >
                          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <div style={{ fontWeight: 700 }}>{language === 'en' ? alert.titleEn : alert.titleEt}</div>
                            <div style={{ marginTop: '2px' }}>
                              {language === 'en' ? alert.messageEn : alert.messageEt}
                            </div>
                            <div style={{ marginTop: '4px', fontStyle: 'italic', opacity: 0.9 }}>
                              💡 {language === 'en' ? alert.recommendationEn : alert.recommendationEt}
                            </div>
                            {alert.biologicalMechanism && (
                              <div style={{ marginTop: '4px', fontSize: '11px', opacity: 0.95 }}>
                                🔬{' '}
                                <strong>
                                  {language === 'en' ? 'Biological Mechanism:' : 'Bioloogiline mehhanism:'}
                                </strong>{' '}
                                {alert.biologicalMechanism}
                              </div>
                            )}
                            {alert.evidence && (
                              <div style={{ marginTop: '4px', fontSize: '10px', fontStyle: 'italic', opacity: 0.85 }}>
                                📚 {language === 'en' ? 'Evidence:' : 'Teaduslik alus:'} {alert.evidence.source} (
                                {alert.evidence.verifiedYear}) • {alert.evidence.tier}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Multi-Year Rotation Cycle Editor Drawer */}
                  {expandedRotationCycleBedId === bed.id && (
                    <div style={{ marginTop: '10px' }}>
                      <BedRotationCycleEditor bed={bed} onClose={() => setExpandedRotationCycleBedId(null)} />
                    </div>
                  )}

                  {/* Expanded 4-Year Bed History Drawer */}
                  {isHistoryOpen && (
                    <div
                      style={{
                        marginTop: '10px',
                        padding: '12px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid var(--kulv-border, #C9BFA9)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--kulv-text, #252A22)' }}>
                        📜 {language === 'en' ? '4-Year Bed Crop History' : 'Peenra 4 aasta viljavahelduse logi'}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                        {[selectedYear - 3, selectedYear - 2, selectedYear - 1, selectedYear].map((yr) => {
                          const yearRecord = historyRecords.find((r) => r.bedId === bed.id && r.year === yr);
                          const isTargetYear = yr === selectedYear;

                          return (
                            <div
                              key={yr}
                              style={{
                                padding: '8px 10px',
                                borderRadius: '6px',
                                border: isTargetYear
                                  ? '2px solid var(--kulv-primary, #4F6B45)'
                                  : '1px solid var(--kulv-border, #D8D0BF)',
                                backgroundColor: isTargetYear ? 'var(--kulv-surface-muted, #F4EFE6)' : '#FAFAFA'
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: isTargetYear
                                    ? 'var(--kulv-primary, #4F6B45)'
                                    : 'var(--kulv-text-muted, #5F675A)'
                                }}
                              >
                                {yr} {isTargetYear && '★'}
                              </div>

                              <div style={{ marginTop: '4px', fontSize: '11px' }}>
                                {isTargetYear ? (
                                  bedSlots.length > 0 ? (
                                    bedSlots.map((s) => (
                                      <div key={s.id} style={{ fontWeight: 600 }}>
                                        {s.plantIcon} {s.plantName}
                                      </div>
                                    ))
                                  ) : (
                                    <span style={{ color: '#9CA3AF' }}>—</span>
                                  )
                                ) : yearRecord && yearRecord.plantings.length > 0 ? (
                                  yearRecord.plantings.map((p, idx) => (
                                    <div key={idx} style={{ fontWeight: 600 }}>
                                      {p.plantIcon || '🌱'} {p.plantName}
                                      <div style={{ fontSize: '10px', color: '#6B7280' }}>{p.family}</div>
                                    </div>
                                  ))
                                ) : (
                                  <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                                    {language === 'en' ? 'No records' : 'Andmed puuduvad'}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Succession Dialog */}
      <AddSuccessionDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        beds={beds}
        plants={plants}
        initialBedId={dialogBedId}
        initialSlot={activeSlotToEdit}
        targetYear={selectedYear}
        language={language}
      />

      {/* Seasonal Sowing Print & Export Dialog */}
      <SeasonalSowingPrintDialog
        isOpen={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        plants={plants}
        beds={beds}
        language={language}
      />
    </div>
  );
};
