import React, { useState, useEffect } from 'react';
import { Plant, GardenBed } from '../../types';
import {
  BedSuccessionSlot,
  SeasonSlot,
  CropProtectionType,
  EstonianRegionId
} from '../../types/rotation';
import { CropRotationEngine, BOTANICAL_FAMILY_DETAILS } from '../../logic/cropRotationEngine';
import { EstonianFrostEngine, PROTECTION_OFFSETS, ESTONIAN_REGIONS } from '../../logic/estonianFrostEngine';
import { useCropRotationStore } from '../../stores/cropRotationStore';
import { X, Calendar, AlertTriangle, ShieldCheck, Sprout, Info } from 'lucide-react';

interface AddSuccessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  beds: GardenBed[];
  plants: Plant[];
  initialBedId?: string;
  initialSlot?: BedSuccessionSlot | null;
  targetYear: number;
  language?: 'et' | 'en';
}

export const AddSuccessionDialog: React.FC<AddSuccessionDialogProps> = ({
  isOpen,
  onClose,
  beds,
  plants,
  initialBedId,
  initialSlot,
  targetYear,
  language = 'et'
}) => {
  const { addSuccessionSlot, updateSuccessionSlot, selectedRegion, historyRecords, successionSlots } =
    useCropRotationStore();

  const [bedId, setBedId] = useState<string>(() => initialBedId || beds[0]?.id || 'bed_1');
  const [seasonSlot, setSeasonSlot] = useState<SeasonSlot>(() => initialSlot?.seasonSlot || 'main_crop');
  const [plantId, setPlantId] = useState<string>(() => initialSlot?.plantId || plants[0]?.id || 'tomat');
  const [sowDate, setSowDate] = useState<string>(() => initialSlot?.sowDate || '05-20');
  const [harvestDate, setHarvestDate] = useState<string>(() => initialSlot?.harvestDate || '08-25');
  const [daysToMaturity, setDaysToMaturity] = useState<number>(() => initialSlot?.daysToMaturity || 80);
  const [protectionType, setProtectionType] = useState<CropProtectionType>(
    () => initialSlot?.protectionType || 'none'
  );
  const [notes, setNotes] = useState<string>(() => initialSlot?.notes || '');

  // Reset or populate when initialSlot or initialBedId changes
  useEffect(() => {
    if (initialSlot) {
      setBedId(initialSlot.bedId);
      setSeasonSlot(initialSlot.seasonSlot);
      setPlantId(initialSlot.plantId);
      setSowDate(initialSlot.sowDate);
      setHarvestDate(initialSlot.harvestDate);
      setDaysToMaturity(initialSlot.daysToMaturity);
      setProtectionType(initialSlot.protectionType);
      setNotes(initialSlot.notes || '');
    } else if (initialBedId) {
      setBedId(initialBedId);
      const targetBed = beds.find((b) => b.id === initialBedId);
      if (targetBed?.coverType === 'greenhouse') {
        setProtectionType('greenhouse');
      } else if (targetBed?.coverType === 'fleece') {
        setProtectionType('fleece');
      }
    }
  }, [initialSlot, initialBedId, beds]);

  if (!isOpen) return null;

  const selectedPlant = plants.find((p) => p.id === plantId) || plants[0];
  const selectedFamily = CropRotationEngine.resolveFamilyId(selectedPlant);
  const selectedGuild = CropRotationEngine.resolveGuild(selectedPlant);
  const familyInfo = BOTANICAL_FAMILY_DETAILS[selectedFamily] || BOTANICAL_FAMILY_DETAILS.Other;

  // Live evaluation of rotation alerts
  const rotationAlerts = CropRotationEngine.auditBedHistory(
    bedId,
    [
      ...successionSlots.filter((s) => s.id !== initialSlot?.id),
      {
        id: 'candidate',
        bedId,
        year: targetYear,
        seasonSlot,
        plantId,
        plantName: selectedPlant.name,
        botanicalFamily: selectedFamily,
        guild: selectedGuild,
        sowDate,
        harvestDate,
        daysToMaturity,
        protectionType
      }
    ],
    historyRecords,
    targetYear
  );

  // Live evaluation of frost hazard
  const frostAlert = EstonianFrostEngine.evaluateSlotFrostRisk(
    {
      id: 'candidate',
      bedId,
      year: targetYear,
      seasonSlot,
      plantId,
      plantName: selectedPlant.name,
      plantNameEn: selectedPlant.nameEn,
      botanicalFamily: selectedFamily,
      guild: selectedGuild,
      sowDate,
      harvestDate,
      daysToMaturity,
      protectionType
    },
    selectedRegion,
    selectedPlant
  );

  const handlePlantChange = (newPlantId: string) => {
    setPlantId(newPlantId);
    const p = plants.find((item) => item.id === newPlantId);
    if (p) {
      if (p.optimalPlantOutDate) {
        setSowDate(p.optimalPlantOutDate);
      }
      if (p.optimalHarvestDate) {
        setHarvestDate(p.optimalHarvestDate);
      }
      if (p.daysToMaturity) {
        setDaysToMaturity(p.daysToMaturity);
      }
    }
  };

  const handleSeasonChange = (slot: SeasonSlot) => {
    setSeasonSlot(slot);
    if (slot === 'early_spring') {
      setSowDate('04-10');
      setHarvestDate('05-20');
      setDaysToMaturity(40);
    } else if (slot === 'main_crop') {
      setSowDate('05-20');
      setHarvestDate('08-30');
      setDaysToMaturity(90);
    } else {
      setSowDate('09-01');
      setHarvestDate('10-25');
      setDaysToMaturity(50);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slotPayload: Omit<BedSuccessionSlot, 'id'> = {
      bedId,
      year: targetYear,
      seasonSlot,
      plantId,
      plantName: selectedPlant.name,
      plantNameEn: selectedPlant.nameEn,
      plantIcon: selectedPlant.icon || '🌱',
      botanicalFamily: selectedFamily,
      guild: selectedGuild,
      sowDate,
      harvestDate,
      daysToMaturity,
      protectionType,
      notes
    };

    if (initialSlot) {
      updateSuccessionSlot(initialSlot.id, slotPayload);
    } else {
      addSuccessionSlot(slotPayload);
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--kulv-surface, #FFFDF8)',
          border: '1px solid var(--kulv-border, #C9BFA9)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--kulv-border, #C9BFA9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--kulv-surface-muted, #F4EFE6)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>🌱</span>
            <div>
              <h2
                className="font-serif-display"
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--kulv-text, #252A22)'
                }}
              >
                {initialSlot
                  ? (language === 'en' ? 'Edit Succession Slot' : 'Muuda järjestikülvi vahetust')
                  : (language === 'en' ? 'Add Succession Sowing Slot' : 'Lisa järjestikülvi vahetus')}
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                {language === 'en'
                  ? `Bed schedule for ${targetYear} season`
                  : `Peenra külvi- ja koristusgraafik ${targetYear}. hooajal`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--kulv-text-muted, #5F675A)',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Bed & Season selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                {language === 'en' ? 'Target Bed' : 'Sihtpeenar'}
              </label>
              <select
                value={bedId}
                onChange={(e) => setBedId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                  fontSize: '13px'
                }}
              >
                {beds.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.type === 'greenhouse' ? 'Kasvuhoone' : 'Peenar'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                {language === 'en' ? 'Season Window' : 'Külviperiood'}
              </label>
              <div
                style={{
                  display: 'flex',
                  backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                  padding: '2px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)'
                }}
              >
                <button
                  type="button"
                  onClick={() => handleSeasonChange('early_spring')}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    fontSize: '11px',
                    fontWeight: seasonSlot === 'early_spring' ? 700 : 500,
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: seasonSlot === 'early_spring' ? 'var(--kulv-surface, #FFFDF8)' : 'transparent',
                    cursor: 'pointer',
                    color: seasonSlot === 'early_spring' ? 'var(--kulv-primary, #4F6B45)' : 'inherit'
                  }}
                >
                  {language === 'en' ? 'Early Spring' : 'Kevad'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSeasonChange('main_crop')}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    fontSize: '11px',
                    fontWeight: seasonSlot === 'main_crop' ? 700 : 500,
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: seasonSlot === 'main_crop' ? 'var(--kulv-surface, #FFFDF8)' : 'transparent',
                    cursor: 'pointer',
                    color: seasonSlot === 'main_crop' ? 'var(--kulv-primary, #4F6B45)' : 'inherit'
                  }}
                >
                  {language === 'en' ? 'Main' : 'Põhikultuur'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSeasonChange('autumn_late')}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    fontSize: '11px',
                    fontWeight: seasonSlot === 'autumn_late' ? 700 : 500,
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: seasonSlot === 'autumn_late' ? 'var(--kulv-surface, #FFFDF8)' : 'transparent',
                    cursor: 'pointer',
                    color: seasonSlot === 'autumn_late' ? 'var(--kulv-primary, #4F6B45)' : 'inherit'
                  }}
                >
                  {language === 'en' ? 'Autumn' : 'Sügis'}
                </button>
              </div>
            </div>
          </div>

          {/* Plant Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              {language === 'en' ? 'Select Plant' : 'Vali taim'}
            </label>
            <select
              value={plantId}
              onChange={(e) => handlePlantChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              {plants.map((p) => {
                const fam = CropRotationEngine.resolveFamilyId(p);
                return (
                  <option key={p.id} value={p.id}>
                    {p.icon || '🌱'} {p.name} {p.nameEn ? `(${p.nameEn})` : ''} — {fam}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Botanical Family & Guild Information Card */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: familyInfo.bgTint,
              border: `1px solid ${familyInfo.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: familyInfo.borderColor }}>
                  {language === 'en' ? familyInfo.nameEn : familyInfo.nameEt}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                  ({familyInfo.scientificName})
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--kulv-text, #252A22)', marginTop: '2px' }}>
                {language === 'en' ? familyInfo.descriptionEn : familyInfo.descriptionEt}
              </div>
            </div>
            <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                {language === 'en' ? 'Minimum break' : 'Min. puhkevahe'}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: familyInfo.borderColor }}>
                {familyInfo.minimumRotationYears} {language === 'en' ? 'years' : 'aastat'}
              </div>
            </div>
          </div>

          {/* Dates & DTM */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                {language === 'en' ? 'Sowing / Plant Out' : 'Külv / Istutus (KK-PP)'}
              </label>
              <input
                type="text"
                placeholder="05-20"
                value={sowDate}
                onChange={(e) => setSowDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  fontSize: '13px',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                {language === 'en' ? 'Harvest Date' : 'Saagikoristus (KK-PP)'}
              </label>
              <input
                type="text"
                placeholder="08-25"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  fontSize: '13px',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                {language === 'en' ? 'Days to Maturity' : 'Valmimisaeg (DTM)'}
              </label>
              <input
                type="number"
                min={20}
                max={200}
                value={daysToMaturity}
                onChange={(e) => setDaysToMaturity(parseInt(e.target.value, 10) || 60)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  fontSize: '13px',
                  fontFamily: 'monospace'
                }}
              />
            </div>
          </div>

          {/* Protection Type */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              {language === 'en' ? 'Cold & Frost Protection' : 'Külmakaitse / Mikrokliima meetod'}
            </label>
            <select
              value={protectionType}
              onChange={(e) => setProtectionType(e.target.value as CropProtectionType)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                fontSize: '13px'
              }}
            >
              {Object.entries(PROTECTION_OFFSETS).map(([key, val]) => (
                <option key={key} value={key}>
                  {language === 'en' ? val.labelEn : val.labelEt} (+{val.springDays}d kevad / +{val.autumnDays}d sügis)
                </option>
              ))}
            </select>
          </div>

          {/* Live Alerts & Biological Warnings */}
          {rotationAlerts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {rotationAlerts.map((alt) => (
                <div
                  key={alt.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    backgroundColor: alt.severity === 'danger' ? '#FEE2E2' : alt.severity === 'good' ? '#DCFCE7' : '#FEF3C7',
                    border: `1px solid ${alt.severity === 'danger' ? '#EF4444' : alt.severity === 'good' ? '#22C55E' : '#F59E0B'}`,
                    color: alt.severity === 'danger' ? '#991B1B' : alt.severity === 'good' ? '#166534' : '#92400E'
                  }}
                >
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={14} />
                    <span>{language === 'en' ? alt.titleEn : alt.titleEt}</span>
                  </div>
                  <div style={{ marginTop: '2px' }}>{language === 'en' ? alt.messageEn : alt.messageEt}</div>
                  <div style={{ marginTop: '4px', fontStyle: 'italic', opacity: 0.9 }}>
                    💡 {language === 'en' ? alt.recommendationEn : alt.recommendationEt}
                  </div>
                </div>
              ))}
            </div>
          )}

          {frostAlert && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                backgroundColor: frostAlert.severity === 'danger' ? '#FEF2F2' : '#FFFBEB',
                border: `1px solid ${frostAlert.severity === 'danger' ? '#F87171' : '#FBBF24'}`,
                color: frostAlert.severity === 'danger' ? '#B91C1C' : '#B45309'
              }}
            >
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={14} />
                <span>{language === 'en' ? frostAlert.titleEn : frostAlert.titleEt}</span>
              </div>
              <div style={{ marginTop: '2px' }}>{language === 'en' ? frostAlert.messageEn : frostAlert.messageEt}</div>
              <div style={{ marginTop: '4px', fontWeight: 600 }}>
                🛡️ {language === 'en' ? frostAlert.recommendedActionEn : frostAlert.recommendedActionEt}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
              {language === 'en' ? 'Agronomic Notes' : 'Märkmed ja tähelepanekud'}
            </label>
            <input
              type="text"
              placeholder={language === 'en' ? 'e.g. Sown under fleece for early harvest' : 'nt. Külvatud katteloori alla, hea mulla niiskus'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                fontSize: '13px'
              }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              {language === 'en' ? 'Cancel' : 'Tühista'}
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--kulv-primary, #4F6B45)',
                color: '#FFFFFF',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              {initialSlot
                ? (language === 'en' ? 'Save Changes' : 'Salvesta muudatused')
                : (language === 'en' ? 'Add Slot' : 'Kinnita külv')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
