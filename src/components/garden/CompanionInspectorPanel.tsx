import React, { useState, useMemo } from 'react';
import { GardenEntity, Plant } from '../../types';
import {
  CompanionEngine,
  BedHarmonyScore,
  CompanionRecommendation,
  CrossBedInteraction
} from '../../logic/companionEngine';
import {
  Leaf,
  AlertTriangle,
  Info,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Compass,
  Filter
} from 'lucide-react';

interface CompanionInspectorPanelProps {
  selectedEntity: GardenEntity | null;
  allEntities: GardenEntity[];
  allPlants: Plant[];
  language: 'et' | 'en';
  filter: 'all' | 'beneficial' | 'incompatible' | 'uncertain';
  onFilterChange: (filter: 'all' | 'beneficial' | 'incompatible' | 'uncertain') => void;
  onClose: () => void;
  onSelectEntity: (entityId: string) => void;
}

export const CompanionInspectorPanel: React.FC<CompanionInspectorPanelProps> = ({
  selectedEntity,
  allEntities,
  allPlants,
  language,
  filter,
  onFilterChange,
  onClose,
  onSelectEntity
}) => {
  const [showLegend, setShowLegend] = useState(false);

  // If a bed is selected, calculate its within-bed harmony
  const activePlantings = useMemo(() => {
    return selectedEntity?.bedData?.plantings || [];
  }, [selectedEntity]);

  const bedHarmony: BedHarmonyScore | null = useMemo(() => {
    if (!selectedEntity || activePlantings.length === 0) return null;
    return CompanionEngine.calculateBedHarmony(activePlantings, allPlants, language);
  }, [selectedEntity, activePlantings, allPlants, language]);

  // Calculate nearby bed interactions (within 1.5m)
  const nearbyInteractions: CrossBedInteraction[] = useMemo(() => {
    if (!selectedEntity) return [];
    const allCross = CompanionEngine.evaluateCrossBedInteractions(allEntities, allPlants, 1.5, language);
    return allCross.filter(
      (int) => int.bedAId === selectedEntity.id || int.bedBId === selectedEntity.id
    );
  }, [selectedEntity, allEntities, allPlants, language]);

  // Combine and filter recommendations
  const displayedPairings: Array<{
    rec: CompanionRecommendation;
    isCrossBed?: boolean;
    neighborBedName?: string;
    neighborBedId?: string;
  }> = useMemo(() => {
    const list: Array<{
      rec: CompanionRecommendation;
      isCrossBed?: boolean;
      neighborBedName?: string;
      neighborBedId?: string;
    }> = [];

    // 1. Within-bed pairings
    if (bedHarmony) {
      for (const rec of bedHarmony.recommendations) {
        list.push({ rec, isCrossBed: false });
      }
    }

    // 2. Cross-bed pairings from neighbor beds <= 1.5m
    for (const cross of nearbyInteractions) {
      const neighborName = cross.bedAId === selectedEntity?.id ? cross.bedBName : cross.bedAName;
      const neighborId = cross.bedAId === selectedEntity?.id ? cross.bedBId : cross.bedAId;
      for (const rec of cross.pairings) {
        list.push({
          rec,
          isCrossBed: true,
          neighborBedName: neighborName,
          neighborBedId: neighborId
        });
      }
    }

    // Apply active filter
    return list.filter(({ rec }) => {
      if (filter === 'all') return true;
      if (filter === 'beneficial') return rec.classification === 'beneficial';
      if (filter === 'incompatible') return rec.classification === 'incompatible';
      if (filter === 'uncertain') return rec.confidence === 'insufficient' || rec.confidence === 'traditional';
      return true;
    });
  }, [bedHarmony, nearbyInteractions, selectedEntity, filter]);

  return (
    <div
      className="companion-inspector-panel absolute right-3 bottom-3 sm:top-20 sm:bottom-auto w-[calc(100vw-24px)] sm:w-[380px] max-h-[82vh] overflow-y-auto bg-[var(--kulv-surface,#FFFDF8)]/95 backdrop-blur-md rounded-xl border border-[var(--kulv-border,#C9BFA9)] shadow-2xl z-20 flex flex-col p-4 text-[var(--kulv-text,#2A2E24)]"
      data-testid="companion_inspector_panel"
      role="region"
      aria-label={language === 'en' ? 'Companion Planting Intelligence Panel' : 'Kaaslastaimede sünergia paneel'}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[var(--kulv-border,#C9BFA9)]/60">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-[var(--kulv-primary,#4F6B45)]/15 text-[var(--kulv-primary,#4F6B45)]">
            <Leaf size={16} />
          </span>
          <div>
            <h3 className="text-xs font-bold tracking-tight">
              {language === 'en' ? 'Companion Intelligence' : 'Kaaslastaimede Sünergia'}
            </h3>
            <p className="text-[10px] text-[var(--kulv-text-muted,#5F675A)]">
              {language === 'en' ? 'Botanical synergies & proximity (1.5m)' : 'Teaduspõhine naabrus & 1.5m lähedus'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="p-1 text-[var(--kulv-text-muted,#5F675A)] hover:text-[var(--kulv-text,#2A2E24)] rounded hover:bg-black/5 text-[11px] font-semibold flex items-center gap-1"
            title={language === 'en' ? 'View Legend & Science Guide' : 'Vaata legendi ja teaduse selgitust'}
            aria-expanded={showLegend}
          >
            <BookOpen size={14} />
            <span className="hidden xs:inline">{language === 'en' ? 'Legend' : 'Legend'}</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--kulv-text-muted,#5F675A)] hover:text-[var(--kulv-text,#2A2E24)] hover:bg-black/5"
            aria-label={language === 'en' ? 'Close panel' : 'Sulge paneel'}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Collapsible Scientific & Horticultural Legend */}
      {showLegend && (
        <div className="my-2.5 p-3 rounded-lg bg-[var(--kulv-surface-muted,#EFE6D4)]/80 border border-[var(--kulv-border,#C9BFA9)] text-[11px] flex flex-col gap-2">
          <div className="font-bold text-xs flex items-center gap-1.5 text-[var(--kulv-text,#2A2E24)]">
            <ShieldCheck size={14} className="text-[var(--kulv-primary,#4F6B45)]" />
            <span>{language === 'en' ? 'Scientific Methodology & Legend' : 'Teaduslik metoodika ja legend'}</span>
          </div>

          <div className="flex flex-col gap-1.5 text-[10.5px] text-[var(--kulv-text-muted,#5F675A)]">
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-[var(--kulv-primary,#4F6B45)]">🌿 Soodne (+):</span>
              <span>{language === 'en' ? 'Parasite masking, pollinator attraction, or complementary root zones.' : 'Kahjuripeletus, tolmeldajate ligimeelitamine või toitainete jagamine.'}</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-[var(--kulv-accent,#D97A3D)]">⚠️ Ebasoodne (!):</span>
              <span>{language === 'en' ? 'Shared blights/viruses (Phytophthora) or allelopathic root exudates.' : 'Ühised haigustekitajad (lehemädanik) või allelopaatiline juurepärssimine.'}</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-gray-500">⚪ Neutraalne / Määramata:</span>
              <span>{language === 'en' ? 'No established negative or positive effect; safe with normal spacing.' : 'Eraldi mõju puudub; tavapärase vahekaugusega ohutu kõrvuti kasvatada.'}</span>
            </div>
            <div className="pt-1 border-t border-[var(--kulv-border,#C9BFA9)] text-[10px] italic">
              {language === 'en'
                ? 'All guidelines are grounded in METK, EMÜ, RHS and peer-reviewed agronomy, clearly distinguishing established science from folklore.'
                : 'Põhineb METK (Eesti Maaelu Teadmuskeskus), EMÜ ja RHS teadusallikatel, eristades selgelt teaduspõhiseid fakte rahvapärastest oletustest.'}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 my-2.5 overflow-x-auto pb-1">
        <button
          onClick={() => onFilterChange('all')}
          className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 ${
            filter === 'all'
              ? 'bg-[var(--kulv-primary,#4F6B45)] text-white shadow-sm'
              : 'bg-[var(--kulv-surface-muted,#EFE6D4)] text-[var(--kulv-text,#2A2E24)] hover:bg-[var(--kulv-border,#C9BFA9)]/40'
          }`}
        >
          <span>{language === 'en' ? 'All' : 'Kõik'}</span>
        </button>

        <button
          onClick={() => onFilterChange('beneficial')}
          className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 ${
            filter === 'beneficial'
              ? 'bg-[var(--kulv-primary,#4F6B45)] text-white shadow-sm'
              : 'bg-[var(--kulv-surface-muted,#EFE6D4)] text-[var(--kulv-text,#2A2E24)] hover:bg-[var(--kulv-border,#C9BFA9)]/40'
          }`}
        >
          <span>🌿 {language === 'en' ? 'Beneficial (+)' : 'Soodsad (+)'}</span>
        </button>

        <button
          onClick={() => onFilterChange('incompatible')}
          className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 ${
            filter === 'incompatible'
              ? 'bg-[var(--kulv-accent,#D97A3D)] text-white shadow-sm'
              : 'bg-[var(--kulv-surface-muted,#EFE6D4)] text-[var(--kulv-text,#2A2E24)] hover:bg-[var(--kulv-border,#C9BFA9)]/40'
          }`}
        >
          <span>⚠️ {language === 'en' ? 'Conflicts (!)' : 'Ebasoodsad (!)'}</span>
        </button>

        <button
          onClick={() => onFilterChange('uncertain')}
          className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 ${
            filter === 'uncertain'
              ? 'bg-stone-600 text-white shadow-sm'
              : 'bg-[var(--kulv-surface-muted,#EFE6D4)] text-[var(--kulv-text,#2A2E24)] hover:bg-[var(--kulv-border,#C9BFA9)]/40'
          }`}
        >
          <span>ℹ️ {language === 'en' ? 'Uncertain (?)' : 'Määramata (?)'}</span>
        </button>
      </div>

      {/* Selected Entity Card */}
      {selectedEntity ? (
        <div className="flex flex-col gap-2.5">
          <div className="p-3 rounded-lg bg-[var(--kulv-surface-muted,#EFE6D4)]/60 border border-[var(--kulv-border,#C9BFA9)]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs truncate max-w-[200px]">
                {selectedEntity.name}
              </span>
              {bedHarmony && (
                <span
                  className="font-extrabold text-xs px-2 py-0.5 rounded-full font-mono flex items-center gap-1"
                  style={{
                    backgroundColor:
                      bedHarmony.harmonyPercentage >= 80
                        ? 'rgba(79, 107, 69, 0.2)'
                        : bedHarmony.harmonyPercentage >= 50
                        ? 'rgba(217, 160, 61, 0.2)'
                        : 'rgba(217, 122, 61, 0.2)',
                    color:
                      bedHarmony.harmonyPercentage >= 80
                        ? 'var(--kulv-primary, #4F6B45)'
                        : bedHarmony.harmonyPercentage >= 50
                        ? '#8F5800'
                        : 'var(--kulv-danger, #B85C33)'
                  }}
                >
                  {bedHarmony.harmonyPercentage >= 80 ? '🌿' : bedHarmony.harmonyPercentage >= 50 ? '⚖️' : '⚠️'} {bedHarmony.harmonyPercentage}%
                </span>
              )}
            </div>

            {/* Harmony score bar */}
            {bedHarmony && (
              <div className="w-full bg-[var(--kulv-border,#C9BFA9)]/40 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${bedHarmony.harmonyPercentage}%`,
                    backgroundColor:
                      bedHarmony.harmonyPercentage >= 80
                        ? 'var(--kulv-primary, #4F6B45)'
                        : bedHarmony.harmonyPercentage >= 50
                        ? '#D9A03D'
                        : 'var(--kulv-accent, #D97A3D)'
                  }}
                />
              </div>
            )}

            <div className="text-[11px] text-[var(--kulv-text-muted,#5F675A)]">
              {bedHarmony ? (
                <div className="flex items-center justify-between">
                  <span>{activePlantings.length} {language === 'en' ? 'plants in bed' : 'taime peenras'}</span>
                  <div className="flex items-center gap-2 font-bold font-mono">
                    <span className="text-[var(--kulv-primary,#4F6B45)]">+{bedHarmony.positivePairs}</span>
                    <span className="text-[var(--kulv-accent,#D97A3D)]">-{bedHarmony.negativePairs}</span>
                  </div>
                </div>
              ) : (
                <span className="italic">
                  {language === 'en'
                    ? 'No plantings in this bed yet. Open planting grid to add crops.'
                    : 'Peenras puuduvad külvid. Ava peenar taimede lisamiseks.'}
                </span>
              )}
            </div>

            {bedHarmony?.summary && (
              <p className="mt-1.5 text-[11px] font-medium text-[var(--kulv-text,#2A2E24)]">
                {bedHarmony.summary}
              </p>
            )}
          </div>

          {/* Pairings List */}
          <div className="flex flex-col gap-2 mt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-[var(--kulv-text-muted,#5F675A)] px-0.5">
              <span>{language === 'en' ? 'Detected Pairings & Dynamics:' : 'Tuvastatud seosed ja sünergia:'}</span>
              <span className="font-mono text-[10px]">{displayedPairings.length}</span>
            </div>

            {displayedPairings.length === 0 ? (
              <div className="p-4 text-center text-xs text-[var(--kulv-text-muted,#5F675A)] bg-black/5 rounded-lg">
                {language === 'en'
                  ? 'No companion relationships match the active filter.'
                  : 'Valitud filtriga naabrussuhteid ei leitud.'}
              </div>
            ) : (
              displayedPairings.map(({ rec, isCrossBed, neighborBedName, neighborBedId }, idx) => {
                const isGood = rec.classification === 'beneficial';
                const isBad = rec.classification === 'incompatible';

                return (
                  <div
                    key={`pair_${idx}_${rec.canonicalIdA}_${rec.canonicalIdB}`}
                    className="p-3 rounded-lg border text-xs flex flex-col gap-1.5 transition-all"
                    style={{
                      backgroundColor: isBad
                        ? 'rgba(217, 122, 61, 0.08)'
                        : isGood
                        ? 'rgba(79, 107, 69, 0.08)'
                        : 'var(--kulv-surface-muted, #EFE6D4)',
                      borderColor: isBad
                        ? 'rgba(217, 122, 61, 0.35)'
                        : isGood
                        ? 'rgba(79, 107, 69, 0.35)'
                        : 'var(--kulv-border, #C9BFA9)'
                    }}
                  >
                    {/* Header: Plant A & Plant B + Relationship pill */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span className="text-sm">🌱</span>
                        <span>{rec.plantA}</span>
                        <span className="text-[var(--kulv-text-muted,#5F675A)] font-normal">&</span>
                        <span>{rec.plantB}</span>
                      </div>

                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold tracking-tight whitespace-nowrap"
                        style={{
                          backgroundColor: isBad ? '#FCEEE8' : isGood ? '#EDF5EB' : '#F1EFEA',
                          color: isBad ? '#B85C33' : isGood ? '#3D5A34' : '#5F675A',
                          border: `1px solid ${isBad ? '#D97A3D' : isGood ? '#4F6B45' : '#C9BFA9'}`
                        }}
                      >
                        {isBad ? '⚠️ Ebasoodne (!)' : isGood ? '🌿 Soodne (+)' : '⚪ Neutraalne'}
                      </span>
                    </div>

                    {/* Proximity context (within bed vs cross-bed neighbor within 1.5m) */}
                    {isCrossBed && neighborBedName && (
                      <div className="flex items-center gap-1 text-[10px] text-[var(--kulv-accent,#D97A3D)] font-semibold">
                        <Compass size={12} />
                        <span>
                          {language === 'en'
                            ? `Neighbor bed proximity (≤1.5m): ${neighborBedName}`
                            : `Naaberpeenra lähedus (≤1.5m): ${neighborBedName}`}
                        </span>
                        {neighborBedId && (
                          <button
                            onClick={() => onSelectEntity(neighborBedId)}
                            className="underline ml-1 hover:text-[var(--kulv-primary,#4F6B45)]"
                          >
                            {language === 'en' ? 'view' : 'vaata'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Scientific Mechanism Explanation */}
                    <p className="text-[11px] leading-relaxed text-[var(--kulv-text,#2A2E24)]">
                      {rec.explanation}
                    </p>

                    {/* Growing Conditions if available */}
                    {rec.conditions && (
                      <div className="text-[10px] text-[var(--kulv-text-muted,#5F675A)] bg-white/60 p-1.5 rounded border border-[var(--kulv-border,#C9BFA9)]/40">
                        <span className="font-semibold">{language === 'en' ? 'Conditions: ' : 'Kasvukoht: '}</span>
                        <span>{rec.conditions}</span>
                      </div>
                    )}

                    {/* Footer: Evidence Confidence Tier + Source Reference */}
                    <div className="flex items-center justify-between text-[9.5px] pt-1.5 border-t border-black/5 text-[var(--kulv-text-muted,#5F675A)] flex-wrap gap-1">
                      <div className="flex items-center gap-1">
                        {rec.confidence === 'established' ? (
                          <span className="text-[var(--kulv-primary,#4F6B45)] flex items-center gap-1 font-semibold">
                            <CheckCircle2 size={12} />
                            <span>{language === 'en' ? 'Established Science' : 'Teaduslikult kinnitatud'}</span>
                          </span>
                        ) : rec.confidence === 'traditional' ? (
                          <span className="text-amber-700 flex items-center gap-1 font-medium">
                            <BookOpen size={12} />
                            <span>{language === 'en' ? 'Traditional Lore' : 'Rahvatarkus'}</span>
                          </span>
                        ) : (
                          <span className="text-stone-500 flex items-center gap-1">
                            <HelpCircle size={12} />
                            <span>{language === 'en' ? 'Insufficient Evidence' : 'Dokumenteerimata'}</span>
                          </span>
                        )}
                      </div>

                      <span className="truncate max-w-[200px] text-right font-mono" title={rec.source}>
                        {rec.source}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-xs text-[var(--kulv-text-muted,#5F675A)] flex flex-col items-center gap-2">
          <span className="p-2.5 rounded-full bg-[var(--kulv-surface-muted,#EFE6D4)] text-[var(--kulv-primary,#4F6B45)]">
            <Compass size={24} />
          </span>
          <span className="font-bold text-sm text-[var(--kulv-text,#2A2E24)]">
            {language === 'en' ? 'Select a Bed to Inspect' : 'Vali peenar uurimiseks'}
          </span>
          <span className="max-w-[260px] text-[11px] leading-relaxed">
            {language === 'en'
              ? 'Click any bed on the canvas to view its Bed Harmony Score, neighbor pairings within 1.5m, and horticultural evidence.'
              : 'Klõpsa krundiplaanil mis tahes peenrale, et näha selle sünergiaskoori, 1.5m raadiuses naabrusseoseid ja teaduslikke soovitusi.'}
          </span>
        </div>
      )}
    </div>
  );
};
