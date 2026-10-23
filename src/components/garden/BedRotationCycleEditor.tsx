import React, { useState } from 'react';
import { GardenBed, RotationCyclePlan, BotanicalFamilyId, AgronomicGuild } from '../../types';
import { useGarden } from '../../context/GardenContext';
import {
  ROTATION_TEMPLATES,
  createDefaultRotationPlan,
  BOTANICAL_FAMILY_DETAILS,
  CropRotationEngine
} from '../../logic/cropRotationEngine';
import {
  ShieldAlert,
  Sparkles,
  RotateCw,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Sprout,
  HelpCircle,
  Save,
  Check
} from 'lucide-react';

interface BedRotationCycleEditorProps {
  bed: GardenBed;
  onClose?: () => void;
}

export const BedRotationCycleEditor: React.FC<BedRotationCycleEditorProps> = ({ bed, onClose }) => {
  const { updateBedRotationPlan, language } = useGarden();

  const currentYear = new Date().getFullYear();
  const [currentPlan, setCurrentPlan] = useState<RotationCyclePlan>(() => {
    if (bed.rotationPlan) {
      return bed.rotationPlan;
    }
    return createDefaultRotationPlan(bed.id, 'standard_nordic_4y', currentYear);
  });

  const [selectedYearOffset, setSelectedYearOffset] = useState<number>(0);
  const [savedBanner, setSavedBanner] = useState<boolean>(false);

  const handleTemplateChange = (templateKey: string) => {
    if (ROTATION_TEMPLATES[templateKey]) {
      const template = ROTATION_TEMPLATES[templateKey];
      const newPlan: RotationCyclePlan = {
        bedId: bed.id,
        cycleLengthYears: template.cycleLengthYears as 3 | 4 | 5,
        templateId: template.templateId as any,
        templateNameEt: template.templateNameEt,
        templateNameEn: template.templateNameEn,
        startYear: currentYear,
        years: template.years.map((y) => ({ ...y })),
        soilHealthRating: template.soilHealthRating
      };
      setCurrentPlan(newPlan);
      setSelectedYearOffset(0);
    }
  };

  const handleYearFamilyToggle = (offset: number, family: BotanicalFamilyId) => {
    setCurrentPlan((prev) => {
      const updatedYears = prev.years.map((y) => {
        if (y.yearOffset === offset) {
          const exists = y.targetFamilies.includes(family);
          const newFamilies = exists
            ? y.targetFamilies.filter((f) => f !== family)
            : [...y.targetFamilies, family];
          return {
            ...y,
            targetFamilies: newFamilies.length > 0 ? newFamilies : ['Other' as BotanicalFamilyId]
          };
        }
        return y;
      });
      return {
        ...prev,
        templateId: 'custom',
        templateNameEt: 'Kohandatud viljavahelduskava',
        templateNameEn: 'Custom Crop Rotation Plan',
        years: updatedYears
      };
    });
  };

  const handleSoilTreatmentChange = (offset: number, treatmentText: string) => {
    setCurrentPlan((prev) => {
      const updatedYears = prev.years.map((y) => {
        if (y.yearOffset === offset) {
          return {
            ...y,
            soilTreatmentEt: treatmentText,
            soilTreatmentEn: treatmentText
          };
        }
        return y;
      });
      return {
        ...prev,
        years: updatedYears
      };
    });
  };

  const handleSavePlan = () => {
    updateBedRotationPlan(bed.id, currentPlan);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  // Build bed history record for auditing
  const bedHistoryRecords = [
    {
      bedId: bed.id,
      year: currentYear - 1,
      plantings: bed.plantings.map((p) => ({
        plantId: p.plantId,
        plantName: p.plantName,
        family: CropRotationEngine.resolveFamilyId(p.plantName),
        guild: CropRotationEngine.resolveGuild(p.plantName)
      }))
    }
  ];

  const activeYearPlan = currentPlan.years.find((y) => y.yearOffset === selectedYearOffset) || currentPlan.years[0];

  return (
    <div
      style={{
        backgroundColor: 'var(--kulv-surface, #FFFDF8)',
        borderRadius: '12px',
        border: '1px solid var(--kulv-border, #C9BFA9)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      {/* Title & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RotateCw size={18} color="var(--kulv-primary, #4F6B45)" />
            <h3
              className="font-serif-display"
              style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}
            >
              {language === 'en' ? 'Multi-Year Crop Rotation Planner' : 'Mitmeaastane viljavahelduse planeerija'}
            </h3>
            <span
              style={{
                backgroundColor: 'rgba(79, 107, 69, 0.12)',
                color: 'var(--kulv-primary, #3E5A35)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              {bed.name} • {currentPlan.cycleLengthYears} {language === 'en' ? 'Years' : 'aastat'}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '3px' }}>
            {language === 'en'
              ? 'Institutional crop rotation prevents soil exhaustion and breaks fungal clubroot & late blight spores.'
              : 'Teaduspõhine külvikord hoiab ära mulla kurnatuse ja hävitab kapsanuutri ning lehemädaniku puhkespoorid.'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleSavePlan}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--kulv-primary, #4F6B45)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {savedBanner ? <Check size={14} /> : <Save size={14} />}
            <span>{savedBanner ? (language === 'en' ? 'Plan Saved!' : 'Kava salvestatud!') : (language === 'en' ? 'Save Plan' : 'Salvesta kava')}</span>
          </button>
        </div>
      </div>

      {/* Preset Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--kulv-text-muted, #5F675A)' }}>
          {language === 'en' ? 'Choose Template:' : 'Vali agronoomiline mall:'}
        </span>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {Object.entries(ROTATION_TEMPLATES).map(([key, tpl]) => {
            const isSelected = currentPlan.templateId === key;
            return (
              <button
                key={key}
                onClick={() => handleTemplateChange(key)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: isSelected ? '2px solid var(--kulv-primary, #4F6B45)' : '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: isSelected ? 'rgba(79, 107, 69, 0.12)' : 'var(--kulv-surface-muted, #F8F5EC)',
                  color: isSelected ? 'var(--kulv-primary, #3E5A35)' : 'var(--kulv-text, #2A2E24)',
                  fontSize: '11px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {tpl.cycleLengthYears}a • {language === 'en' ? tpl.templateNameEn : tpl.templateNameEt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Year Timeline Steps */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${currentPlan.years.length}, 1fr)`,
          gap: '8px',
          backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
          padding: '8px',
          borderRadius: '10px',
          border: '1px solid var(--kulv-border, #C9BFA9)'
        }}
      >
        {currentPlan.years.map((yearPlan) => {
          const calendarYear = currentPlan.startYear + yearPlan.yearOffset;
          const isSelected = yearPlan.yearOffset === selectedYearOffset;
          const primaryFamily = yearPlan.targetFamilies[0] || 'Other';
          const famInfo = BOTANICAL_FAMILY_DETAILS[primaryFamily] || BOTANICAL_FAMILY_DETAILS.Other;

          return (
            <button
              key={yearPlan.yearOffset}
              onClick={() => setSelectedYearOffset(yearPlan.yearOffset)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '10px 8px',
                borderRadius: '8px',
                border: isSelected ? `2px solid ${famInfo.borderColor || '#4F6B45'}` : '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: isSelected ? '#FFFFFF' : 'var(--kulv-surface, #FFFDF8)',
                boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--kulv-text-muted, #5F675A)' }}>
                {calendarYear} ({yearPlan.cycleStep}. aasta)
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: famInfo.borderColor || 'var(--kulv-primary, #4F6B45)',
                  marginTop: '4px'
                }}
              >
                {famInfo.nameEt}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: famInfo.bgTint || 'rgba(0,0,0,0.05)',
                  marginTop: '4px',
                  fontWeight: 600
                }}
              >
                {yearPlan.targetGuild === 'heavy_feeder'
                  ? 'Rasketoiteline'
                  : yearPlan.targetGuild === 'nitrogen_fixer'
                  ? 'Lämmastikurikastaja'
                  : 'Mõõdukas toituja'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Year Inspector & Scientific Customizer */}
      {activeYearPlan && (
        <div
          style={{
            padding: '16px',
            borderRadius: '10px',
            border: '1px solid var(--kulv-border, #C9BFA9)',
            backgroundColor: 'var(--kulv-surface-muted, #FAF7EE)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
              📅 {currentPlan.startYear + activeYearPlan.yearOffset}. Aasta: {language === 'en' ? activeYearPlan.nameEn : activeYearPlan.nameEt}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)' }}>
              Tsükli samm {activeYearPlan.cycleStep} / {currentPlan.cycleLengthYears}
            </span>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--kulv-text-muted, #5F675A)', marginBottom: '6px' }}>
              Valitud botaanilised sugukonnad selleks aastaks (klõpsa kohandamiseks):
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(
                [
                  'Brassicaceae',
                  'Solanaceae',
                  'Fabaceae',
                  'Apiaceae',
                  'Allioideae',
                  'Cucurbitaceae',
                  'Amaranthaceae',
                  'Asteraceae'
                ] as BotanicalFamilyId[]
              ).map((fam) => {
                const isFamilyActive = activeYearPlan.targetFamilies.includes(fam);
                const info = BOTANICAL_FAMILY_DETAILS[fam];
                return (
                  <button
                    key={fam}
                    onClick={() => handleYearFamilyToggle(activeYearPlan.yearOffset, fam)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: isFamilyActive ? `2px solid ${info.borderColor}` : '1px solid var(--kulv-border, #C9BFA9)',
                      backgroundColor: isFamilyActive ? info.bgTint : '#FFFFFF',
                      color: isFamilyActive ? info.borderColor : 'var(--kulv-text, #2A2E24)',
                      fontSize: '11px',
                      fontWeight: isFamilyActive ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {isFamilyActive ? '✓ ' : ''}{info.nameEt}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#FFFFFF', border: '1px solid var(--kulv-border, #C9BFA9)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--kulv-primary, #3E5A35)', marginBottom: '4px' }}>
                🌾 Soovituslikud Põhjamaa kultuurid:
              </div>
              <div style={{ fontSize: '12px' }}>
                {activeYearPlan.recommendedCrops.join(', ')}
              </div>
            </div>

            <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#FFFFFF', border: '1px solid var(--kulv-border, #C9BFA9)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--kulv-primary, #3E5A35)', marginBottom: '4px' }}>
                🧪 Mulla ettevalmistus & Agronoomiline töötlus:
              </div>
              <input
                type="text"
                value={activeYearPlan.soilTreatmentEt}
                onChange={(e) => handleSoilTreatmentChange(activeYearPlan.yearOffset, e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  fontSize: '12px',
                  backgroundColor: 'var(--kulv-surface, #FFFDF8)'
                }}
                aria-label="Mulla töötlus"
              />
            </div>
          </div>

          {/* Institutional Citation Callout for active family */}
          {(() => {
            const fam = activeYearPlan.targetFamilies[0] || 'Other';
            const famInfo = BOTANICAL_FAMILY_DETAILS[fam] || BOTANICAL_FAMILY_DETAILS.Other;
            return (
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(79, 107, 69, 0.08)',
                  border: '1px solid rgba(79, 107, 69, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <BookOpen size={16} color="var(--kulv-primary, #4F6B45)" />
                <div style={{ fontSize: '11px', color: 'var(--kulv-text, #2A2E24)' }}>
                  <strong>{famInfo.nameEt} teaduslik viljavaheldusnorm:</strong> Minimaalne vahe <strong>{famInfo.minimumRotationYears} aastat</strong>. Peamised patogeenid: {famInfo.primaryDiseaseRisks.join(', ')}. (Allikas: {famInfo.evidenceCitation?.source || 'EMÜ'})
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
