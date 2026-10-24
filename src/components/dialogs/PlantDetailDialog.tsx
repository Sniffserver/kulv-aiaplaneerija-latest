import React, { useState, useEffect } from 'react';
import { Plant } from '../../types';
import {
  X,
  Sun,
  Droplets,
  Calendar,
  Ruler,
  Sprout,
  AlertTriangle,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  Bug,
  BookOpen,
  Leaf,
  Sparkles,
  Info,
  HeartHandshake
} from 'lucide-react';
import { GddEngine } from '../../logic/gddEngine';
import { useGarden } from '../../context/GardenContext';
import { getPlantEncyclopediaEntry } from '../../data/plantEncyclopedia';
import { BOTANICAL_FAMILY_DETAILS } from '../../logic/cropRotationEngine';

interface PlantDetailDialogProps {
  plant: Plant | null;
  onDismiss: () => void;
}

type EncyclopediaDomain =
  | 'cultivation'
  | 'habitat'
  | 'growthCycle'
  | 'culinary'
  | 'ecology'
  | 'companions'
  | 'healthProblems'
  | 'safety'
  | 'botany'
  | 'reliability';

export const PlantDetailDialog: React.FC<PlantDetailDialogProps> = ({ plant, onDismiss }) => {
  const { language } = useGarden();
  const [activeTab, setActiveTab] = useState<EncyclopediaDomain>('cultivation');

  useEffect(() => {
    if (!plant) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [plant, onDismiss]);

  if (!plant) return null;

  const entry = getPlantEncyclopediaEntry(plant.id || plant.name.toLowerCase(), plant.name);
  const displayName = language === 'en' && plant.nameEn ? plant.nameEn : plant.name;
  const secondaryName = language === 'en' && plant.nameEn ? plant.name : plant.nameEn;
  const cropGdd = GddEngine.getCropStandard(plant.id || plant.name);
  const familyInfo = BOTANICAL_FAMILY_DETAILS[entry.family] || BOTANICAL_FAMILY_DETAILS.Other;

  const tabs: { id: EncyclopediaDomain; labelEt: string; labelEn: string; icon: string }[] = [
    { id: 'cultivation', labelEt: 'Kasvatamine', labelEn: 'Cultivation', icon: '🌱' },
    { id: 'habitat', labelEt: 'Kasvukoht', labelEn: 'Habitat', icon: '🌤️' },
    { id: 'growthCycle', labelEt: 'Kasvutsükkel', labelEn: 'Growth Cycle', icon: '📅' },
    { id: 'culinary', labelEt: 'Köögikasutus', labelEn: 'Culinary', icon: '🍃' },
    { id: 'ecology', labelEt: 'Ökoloogia', labelEn: 'Ecology', icon: '🐝' },
    { id: 'companions', labelEt: 'Kooslused', labelEn: 'Companions', icon: '🪴' },
    { id: 'healthProblems', labelEt: 'Tervis & Kahjurid', labelEn: 'Health & Pests', icon: '🐛' },
    { id: 'safety', labelEt: 'Ohutus', labelEn: 'Safety', icon: '⚠️' },
    { id: 'botany', labelEt: 'Botaanika', labelEn: 'Botany', icon: '🧬' },
    { id: 'reliability', labelEt: 'Allikad & Teadus', labelEn: 'Evidence', icon: '📚' }
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="plant-detail-dialog-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(20, 24, 18, 0.65)',
        backdropFilter: 'blur(3px)',
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
          boxShadow: 'var(--kulv-shadow-card, 0 8px 32px rgba(0,0,0,0.22))',
          maxWidth: '780px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header Section */}
        <div
          style={{
            padding: '20px 24px 14px 24px',
            borderBottom: '1px solid var(--kulv-border, #C9BFA9)',
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}
        >
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <span style={{ fontSize: '42px', lineHeight: 1 }}>{plant.icon}</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                <h2
                  id="plant-detail-dialog-title"
                  className="font-serif-display"
                  style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}
                >
                  {displayName}
                </h2>
                {secondaryName && (
                  <span style={{ fontSize: '14px', color: 'var(--kulv-text-muted, #5F675A)', fontStyle: 'italic' }}>
                    ({secondaryName})
                  </span>
                )}
              </div>
              {/* Quiet Botanical Metadata Line */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  fontSize: '12px',
                  color: 'var(--kulv-text-muted, #5F675A)',
                  marginTop: '4px'
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--kulv-primary, #4F6B45)' }}>
                  {familyInfo.nameEt} ({familyInfo.scientificName})
                </span>
                <span aria-hidden="true">·</span>
                <span style={{ fontStyle: 'italic' }}>{plant.scientificName || entry.scientificName}</span>
                <span aria-hidden="true">·</span>
                <span style={{ color: 'var(--kulv-primary-dark, #2D4026)', fontWeight: 600 }}>
                  {entry.reliability.evidenceTier === 'peer_reviewed'
                    ? language === 'en'
                      ? 'Peer-Reviewed Research'
                      : 'Teaduspõhine (Peer-reviewed)'
                    : language === 'en'
                      ? 'Institutional Review'
                      : 'Institutsionaalne kontroll'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onDismiss}
            aria-label={language === 'en' ? 'Close window' : 'Sulge aken'}
            className="touch-target"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--kulv-text-muted, #5F675A)',
              padding: '6px',
              borderRadius: '8px',
              minWidth: '40px',
              minHeight: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* 10-Domain Scrollable Tab Navigation */}
        <div
          role="tablist"
          aria-label="10 valdkonda"
          style={{
            display: 'flex',
            overflowX: 'auto',
            borderBottom: '1px solid var(--kulv-border, #C9BFA9)',
            backgroundColor: 'var(--kulv-surface-muted, #F4EEDF)',
            padding: '4px 12px 0 12px',
            gap: '4px',
            scrollbarWidth: 'none'
          }}
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  minHeight: '40px',
                  fontSize: '12px',
                  fontWeight: active ? 700 : 500,
                  color: active ? 'var(--kulv-primary, #3E5A35)' : 'var(--kulv-text-muted, #5F675A)',
                  backgroundColor: active ? 'var(--kulv-surface, #FFFDF8)' : 'transparent',
                  borderTop: active ? '2px solid var(--kulv-primary, #4F6B45)' : '2px solid transparent',
                  borderLeft: active ? '1px solid var(--kulv-border, #C9BFA9)' : 'none',
                  borderRight: active ? '1px solid var(--kulv-border, #C9BFA9)' : 'none',
                  borderBottom: 'none',
                  borderRadius: '6px 6px 0 0',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.icon}</span>
                <span>{language === 'en' ? tab.labelEn : tab.labelEt}</span>
              </button>
            );
          })}
        </div>

        {/* Active Domain Body */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            flex: 1,
            lineHeight: 1.6,
            color: 'var(--kulv-text, #2A2E24)'
          }}
        >
          {/* TAB 1: Kasvatamine (Cultivation) */}
          {activeTab === 'cultivation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}
              >
                <div
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', fontWeight: 600 }}>
                    Külvisügavus
                  </div>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      marginTop: '2px',
                      color: 'var(--kulv-primary, #3E5A35)'
                    }}
                  >
                    {entry.cultivation.sowingDepthCm} cm
                  </div>
                </div>

                <div
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', fontWeight: 600 }}>
                    Idanemisaeg
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '2px' }}>
                    {entry.cultivation.germinationDays}
                  </div>
                </div>

                <div
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', fontWeight: 600 }}>
                    Idanemistemperatuur
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>
                    {entry.cultivation.germinationTempC}
                  </div>
                </div>

                <div
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', fontWeight: 600 }}>
                    Taimede vahekaugus
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '2px' }}>
                    {entry.cultivation.spacingInRowCm} cm real × {entry.cultivation.spacingBetweenRowsCm} cm ridade
                    vahel
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(79, 107, 69, 0.08)',
                  border: '1px solid var(--kulv-border, #C9BFA9)'
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--kulv-primary, #3E5A35)',
                    marginBottom: '4px'
                  }}
                >
                  ✂️ Harvendamine ja pikeerimine:
                </div>
                <div style={{ fontSize: '13px' }}>{entry.cultivation.thinningAdvice}</div>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)',
                  border: '1px solid var(--kulv-border, #C9BFA9)'
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--kulv-primary, #3E5A35)',
                    marginBottom: '4px'
                  }}
                >
                  💧 Kastmisrežiim ja hüdroloogia:
                </div>
                <div style={{ fontSize: '13px' }}>{entry.cultivation.wateringFrequency}</div>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)',
                  border: '1px solid var(--kulv-border, #C9BFA9)'
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--kulv-primary, #3E5A35)',
                    marginBottom: '4px'
                  }}
                >
                  🌾 Väetamine ja toitainete bilanss:
                </div>
                <div style={{ fontSize: '13px' }}>{entry.cultivation.fertilizationAdvice}</div>
              </div>
            </div>
          )}

          {/* TAB 2: Kasvukoht (Habitat) */}
          {activeTab === 'habitat' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}
              >
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      color: 'var(--kulv-text-muted, #5F675A)',
                      fontWeight: 600
                    }}
                  >
                    <Sun size={15} /> Päikesevajadus
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '3px' }}>
                    {entry.habitat.sunRequirement} (min {plant.sunHoursMin} h otsest valgust)
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      color: 'var(--kulv-text-muted, #5F675A)',
                      fontWeight: 600
                    }}
                  >
                    <ShieldCheck size={15} /> Mulla pH ja happesus
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      marginTop: '3px',
                      color: 'var(--kulv-primary, #3E5A35)'
                    }}
                  >
                    pH {entry.habitat.optimalPh}
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--kulv-primary, #3E5A35)',
                    marginBottom: '4px'
                  }}
                >
                  🪴 Mulla tüüp ja struktuur:
                </div>
                <div style={{ fontSize: '13px' }}>{entry.habitat.soilType}</div>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--kulv-primary, #3E5A35)',
                    marginBottom: '4px'
                  }}
                >
                  🌊 Drenaaž ja niiskustaluvus:
                </div>
                <div style={{ fontSize: '13px' }}>{entry.habitat.drainage}</div>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'rgba(79, 107, 69, 0.08)'
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--kulv-primary, #3E5A35)',
                    marginBottom: '4px'
                  }}
                >
                  🪴 Sobivus potis või terrassikastis kasvatamiseks:
                </div>
                <div style={{ fontSize: '13px' }}>
                  {entry.habitat.containerSuitability
                    ? `Sobib suurepäraselt potikasvatuseks (soovitatav min anuma maht ${entry.habitat.containerVolumeLiters || 10} L).`
                    : 'Ei ole soovitatav potis kasvatamiseks ulatusliku juurekava või suure mullamahu vajaduse tõttu.'}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Kasvutsükkel (Growth Cycle) */}
          {activeTab === 'growthCycle' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)',
                  border: '1px solid var(--kulv-border, #C9BFA9)'
                }}
              >
                <Thermometer size={20} color="var(--kulv-primary, #4F6B45)" />
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', fontWeight: 600 }}>
                    Soojussumma nõue (GDD)
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--kulv-primary, #3E5A35)' }}>
                    ~{cropGdd.targetGdd} °d (baastemperatuur {cropGdd.baseTemp} °C)
                  </div>
                </div>
              </div>

              <div
                style={{ borderLeft: '3px solid var(--kulv-primary, #4F6B45)', paddingLeft: '14px', margin: '4px 0' }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--kulv-primary, #3E5A35)' }}>
                  1. Idanemisfaas:
                </div>
                <div style={{ fontSize: '13px' }}>{entry.growthCycle.germinationPhase}</div>
              </div>

              <div
                style={{ borderLeft: '3px solid var(--kulv-primary, #4F6B45)', paddingLeft: '14px', margin: '4px 0' }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--kulv-primary, #3E5A35)' }}>
                  2. Vegetatiivne lehe- ja juurekasv:
                </div>
                <div style={{ fontSize: '13px' }}>{entry.growthCycle.vegetativeGrowth}</div>
              </div>

              <div
                style={{ borderLeft: '3px solid var(--kulv-primary, #4F6B45)', paddingLeft: '14px', margin: '4px 0' }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--kulv-primary, #3E5A35)' }}>
                  3. Õitsemisfaas:
                </div>
                <div style={{ fontSize: '13px' }}>{entry.growthCycle.floweringPhase}</div>
              </div>

              <div
                style={{ borderLeft: '3px solid var(--kulv-primary, #4F6B45)', paddingLeft: '14px', margin: '4px 0' }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--kulv-primary, #3E5A35)' }}>
                  4. Saagi valmimine ja noppimine:
                </div>
                <div style={{ fontSize: '13px' }}>
                  {entry.growthCycle.harvestPhase} (~{entry.growthCycle.daysToMaturity} päeva tärkamisest)
                </div>
              </div>

              <div style={{ borderLeft: '3px solid #8A5E12', paddingLeft: '14px', margin: '4px 0' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#8A5E12' }}>
                  5. Seemnete kogumise optimaalne aeg:
                </div>
                <div style={{ fontSize: '13px' }}>{entry.growthCycle.seedSavingTime}</div>
              </div>
            </div>
          )}

          {/* TAB 4: Köögikasutus (Culinary) */}
          {activeTab === 'culinary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--kulv-primary, #3E5A35)',
                    marginBottom: '4px'
                  }}
                >
                  🥗 Söödavad taimeosad:
                </div>
                <div style={{ fontSize: '13px' }}>{entry.culinary.edibleParts.join(' · ')}</div>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--kulv-primary, #3E5A35)',
                    marginBottom: '4px'
                  }}
                >
                  👅 Maitseprofiil:
                </div>
                <div style={{ fontSize: '13px' }}>{entry.culinary.flavorProfile}</div>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--kulv-primary, #3E5A35)',
                    marginBottom: '4px'
                  }}
                >
                  🍳 Retseptiideed ja kokakunst:
                </div>
                <ul style={{ margin: '4px 0 0 18px', padding: 0, fontSize: '13px' }}>
                  {entry.culinary.culinaryUses.map((use, idx) => (
                    <li key={idx} style={{ marginBottom: '2px' }}>
                      {use}
                    </li>
                  ))}
                </ul>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'rgba(79, 107, 69, 0.08)'
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--kulv-primary, #3E5A35)',
                    marginBottom: '4px'
                  }}
                >
                  ❄️ Säilitamine ja hoidistamine:
                </div>
                <div style={{ fontSize: '13px' }}>{entry.culinary.storageAndPreservation}</div>
              </div>
            </div>
          )}

          {/* TAB 5: Ökoloogia (Ecology) */}
          {activeTab === 'ecology' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--kulv-primary, #3E5A35)',
                    marginBottom: '4px'
                  }}
                >
                  🐝 Tolmeldajad ja meetaimed:
                </div>
                <div style={{ fontSize: '13px' }}>{entry.ecology.pollinators.join(', ')}</div>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--kulv-primary, #3E5A35)',
                    marginBottom: '4px'
                  }}
                >
                  🐞 Kasulikud putukad ja looduslikud vaenlased:
                </div>
                <div style={{ fontSize: '13px' }}>{entry.ecology.beneficialInsects.join(', ')}</div>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--kulv-primary, #3E5A35)',
                    marginBottom: '4px'
                  }}
                >
                  🌿 Mõju aia elurikkusele ja mullaelustikule:
                </div>
                <div style={{ fontSize: '13px' }}>{entry.ecology.biodiversityImpact}</div>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--kulv-text-muted, #5F675A)',
                    marginBottom: '4px'
                  }}
                >
                  ⚠️ Invasiivsusrisk ja kontroll:
                </div>
                <div style={{ fontSize: '13px' }}>{entry.ecology.potentialInvasiveRisk}</div>
              </div>
            </div>
          )}

          {/* TAB 6: Taimekooslused (Companions) */}
          {activeTab === 'companions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: 'var(--kulv-primary, #3E5A35)',
                    marginBottom: '8px'
                  }}
                >
                  <Sprout size={16} /> Head naabrid ja teaduslikult tõestatud sünergia
                </div>
                {entry.companions.beneficial.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {entry.companions.beneficial.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(79, 107, 69, 0.08)',
                          border: '1px solid rgba(79, 107, 69, 0.2)'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '4px'
                          }}
                        >
                          <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--kulv-primary, #3E5A35)' }}>
                            🌱 + {c.plantName}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: 'var(--kulv-text-muted, #5F675A)',
                              textTransform: 'uppercase'
                            }}
                          >
                            {c.evidence.tier} ({c.evidence.source})
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                          <strong>Bioloogiline mehhanism:</strong> {c.biologicalMechanism}
                        </div>
                        <div
                          style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', fontStyle: 'italic' }}
                        >
                          Allikas: {c.evidence.publication || c.evidence.source} ({c.evidence.verifiedYear})
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                    Üldine hea kooslus enamiku madala nõudlusega aiaviljadega.
                  </div>
                )}
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#B85C33',
                    marginBottom: '8px'
                  }}
                >
                  <AlertTriangle size={16} /> Halvad naabrid ja patogeensed riskid
                </div>
                {entry.companions.antagonistic.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {entry.companions.antagonistic.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(184, 92, 51, 0.08)',
                          border: '1px solid rgba(184, 92, 51, 0.25)'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '4px'
                          }}
                        >
                          <span style={{ fontWeight: 700, fontSize: '13px', color: '#B85C33' }}>
                            ⚠️ VÄLDI: {c.plantName}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: 'var(--kulv-text-muted, #5F675A)',
                              textTransform: 'uppercase'
                            }}
                          >
                            {c.evidence.tier} ({c.evidence.source})
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                          <strong>Bioloogiline mehhanism:</strong> {c.biologicalMechanism}
                        </div>
                        <div
                          style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', fontStyle: 'italic' }}
                        >
                          Allikas: {c.evidence.publication || c.evidence.source} ({c.evidence.verifiedYear})
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                    Teaduslikult dokumenteeritud allelopaatilisi konflikte pole leitud.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: Terviseprobleemid (Health Problems) */}
          {activeTab === 'healthProblems' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '13px', color: 'var(--kulv-text-muted, #5F675A)', marginBottom: '4px' }}>
                Levinud kahjurid, haigused ja sümptomipõhine integreeritud taimekaitse (IPM):
              </div>
              {entry.healthProblems.map((hp, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px'
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '14px',
                        color: hp.type === 'disease' ? '#B85C33' : '#8A5E12'
                      }}
                    >
                      {hp.type === 'disease' ? '🔬 Haigus:' : hp.type === 'pest' ? '🐛 Kahjur:' : '⚠️ Toitepuudus:'}{' '}
                      {hp.name}
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'var(--kulv-text-muted, #5F675A)',
                        textTransform: 'uppercase'
                      }}
                    >
                      {hp.evidence.source}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '6px' }}>
                    <strong>Sümptomid:</strong> {hp.symptoms}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--kulv-primary, #3E5A35)',
                      backgroundColor: 'rgba(79, 107, 69, 0.08)',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      marginBottom: '4px'
                    }}
                  >
                    <strong>🌿 Bioloogiline / agrotehniline abi:</strong> {hp.biologicalRemedy}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', fontStyle: 'italic' }}>
                    Allikas: {hp.evidence.publication || hp.evidence.source} ({hp.evidence.verifiedYear})
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 8: Ohutus (Safety) */}
          {activeTab === 'safety' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--kulv-primary, #3E5A35)',
                    marginBottom: '4px'
                  }}
                >
                  🧑 Ohutus inimesele & mürgisus:
                </div>
                <div style={{ fontSize: '13px' }}>{entry.safety.toxicityHuman}</div>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#B85C33', marginBottom: '4px' }}>
                  🐾 Lemmikloomade ohutus (koerad, kassid):
                </div>
                <div style={{ fontSize: '13px' }}>{entry.safety.toxicityPets}</div>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--kulv-primary, #3E5A35)',
                    marginBottom: '4px'
                  }}
                >
                  🤧 Allergeenid ja ülitundlikkus:
                </div>
                <div style={{ fontSize: '13px' }}>{entry.safety.allergies}</div>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--kulv-text-muted, #5F675A)',
                    marginBottom: '4px'
                  }}
                >
                  ⚠️ Vastunäidustused ja koostoimed:
                </div>
                <div style={{ fontSize: '13px' }}>{entry.safety.contraindications}</div>
              </div>
            </div>
          )}

          {/* TAB 9: Botaanika (Botany) */}
          {activeTab === 'botany' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}
              >
                <div
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', fontWeight: 600 }}>
                    Sugukond (Familia)
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>
                    {entry.botany.familyEstonian} ({entry.botany.familyScientific})
                  </div>
                </div>

                <div
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', fontWeight: 600 }}>
                    Elutsükkel
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{entry.botany.lifeCycle}</div>
                </div>

                <div
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', fontWeight: 600 }}>
                    Täiskasvanud taime kõrgus
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{entry.botany.matureHeightCm}</div>
                </div>

                <div
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', fontWeight: 600 }}>
                    Õitsemisaeg
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{entry.botany.floweringPeriod}</div>
                </div>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'rgba(79, 107, 69, 0.08)'
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--kulv-primary, #3E5A35)',
                    marginBottom: '4px'
                  }}
                >
                  🇪🇪 Soovitatud Põhjamaade ja Eesti sordid:
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--kulv-primary, #3E5A35)' }}>
                  {entry.botany.recommendedNordicVarieties.join(', ')}
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: Usaldusväärsus & Allikad (Reliability & Evidence) */}
          {activeTab === 'reliability' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface-muted, #F8F5EC)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <ShieldCheck size={20} color="var(--kulv-primary, #4F6B45)" />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--kulv-primary, #3E5A35)' }}>
                    Tõenduspõhine Aianduskontroll (Anti-Myth Protocol)
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--kulv-text, #2A2E24)' }}>
                  KÜLV välistab kontrollimata aiandusmüüdid. Iga esitatud viljavahelduse reegel, naabrustaime
                  bioloogiline mehhanism ja haigustõrje tugineb akadeemilistele ja riiklikele taimekaitseasutustele.
                </p>
              </div>

              <div>
                <div
                  style={{ fontSize: '13px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)', marginBottom: '8px' }}
                >
                  Peamised teadus- ja katseasutused selle taime kohta:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {entry.reliability.primarySources.map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid var(--kulv-border, #C9BFA9)',
                        backgroundColor: 'var(--kulv-surface, #FFFDF8)'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '3px'
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--kulv-primary, #3E5A35)' }}>
                          🏛️ {s.source}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            color: 'var(--kulv-primary, #3E5A35)',
                            textTransform: 'uppercase'
                          }}
                        >
                          {s.tier}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--kulv-text, #2A2E24)' }}>{s.publication}</div>
                      <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '2px' }}>
                        Kinnitatud aasta: {s.verifiedYear} {s.notes ? `• ${s.notes}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--kulv-text-muted, #5F675A)',
                  fontStyle: 'italic',
                  borderTop: '1px solid var(--kulv-border, #C9BFA9)',
                  paddingTop: '10px'
                }}
              >
                Viimati valideeritud andmed: {entry.reliability.lastUpdated} • {entry.reliability.peerReviewNotes}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--kulv-border, #C9BFA9)',
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--kulv-text-muted, #5F675A)' }}>
            10-valdkondlik Põhjamaine Taimeentsüklopeedia
          </div>
          <button
            onClick={onDismiss}
            style={{
              minHeight: '40px',
              padding: '8px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--kulv-primary, #4F6B45)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            {language === 'en' ? 'Close' : 'Sulge'}
          </button>
        </div>
      </div>
    </div>
  );
};
