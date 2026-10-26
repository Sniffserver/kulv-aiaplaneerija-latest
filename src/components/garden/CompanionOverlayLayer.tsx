import React, { useMemo, useState, useEffect } from 'react';
import { GardenEntity, Plant, Point2D } from '../../types';
import {
  CompanionEngine,
  CompanionClassification,
  CrossBedInteraction,
  BedHarmonyScore
} from '../../logic/companionEngine';
import { ExternalLink, X, Sprout, AlertTriangle, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';

interface CompanionOverlayLayerProps {
  entities: GardenEntity[];
  selectedEntityId: string | null;
  hoveredEntityId: string | null;
  zoom: number; // pixels per metre
  allPlants: Plant[];
  language: 'et' | 'en';
  filter: 'all' | 'beneficial' | 'incompatible' | 'uncertain';
  onSelectEntity: (entityId: string) => void;
  onOpenBedDetail?: (bedId: string) => void;
}

export const CompanionOverlayLayer: React.FC<CompanionOverlayLayerProps> = React.memo(
  ({ entities, selectedEntityId, hoveredEntityId, zoom, allPlants, language, filter, onSelectEntity, onOpenBedDetail }) => {
    const [activePopoverBedId, setActivePopoverBedId] = useState<string | null>(null);
    const [activeLinkPopoverId, setActiveLinkPopoverId] = useState<string | null>(null);
    const [hoveredBadgeId, setHoveredBadgeId] = useState<string | null>(null);

    // Responsive theme detection for dark mode styling
    const [isDark, setIsDark] = useState<boolean>(() => {
      if (typeof document !== 'undefined') {
        return document.documentElement.classList.contains('dark');
      }
      return false;
    });

    useEffect(() => {
      if (typeof document === 'undefined') return;
      const observer = new MutationObserver(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    }, []);

    // Only evaluate visible and non-deleted bed entities
    const bedEntities = useMemo(() => {
      return entities.filter(
        (e) => !e.deletedAt && e.visible !== false && (e.category === 'bed' || e.category === 'structure')
      );
    }, [entities]);

    // Precompute bed harmony scores for all beds
    const bedScores = useMemo(() => {
      const map = new Map<string, BedHarmonyScore>();
      for (const bed of bedEntities) {
        const plantings = bed.bedData?.plantings || [];
        if (plantings.length > 0) {
          const harmony = CompanionEngine.calculateBedHarmony(plantings, allPlants, language);
          map.set(bed.id, harmony);
        }
      }
      return map;
    }, [bedEntities, allPlants, language]);

    // Compute cross-bed interactions within 1.5 meters
    const crossBedInteractions = useMemo(() => {
      return CompanionEngine.evaluateCrossBedInteractions(bedEntities, allPlants, 1.5, language);
    }, [bedEntities, allPlants, language]);

    // Filter cross-bed interactions based on active filter
    const filteredInteractions = useMemo(() => {
      return crossBedInteractions.filter((interaction) => {
        if (filter === 'all') return true;
        if (filter === 'beneficial') {
          return interaction.pairings.some((p) => p.classification === 'beneficial');
        }
        if (filter === 'incompatible') {
          return interaction.pairings.some((p) => p.classification === 'incompatible');
        }
        if (filter === 'uncertain') {
          return interaction.pairings.some((p) => p.confidence === 'insufficient' || p.confidence === 'traditional');
        }
        return true;
      });
    }, [crossBedInteractions, filter]);

    return (
      <g className="companion-intelligence-overlay" data-testid="companion_overlay_layer">
        {/* Luminous glowing filters for night garden canvas reading */}
        <defs>
          <filter id="luminous-glow-green" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#A7C080" floodOpacity="0.65" />
          </filter>
          <filter id="luminous-glow-amber" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#E5BD70" floodOpacity="0.65" />
          </filter>
          <filter id="luminous-glow-coral" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#F2A6A6" floodOpacity="0.65" />
          </filter>
          <filter id="luminous-glow-neutral" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#5A735C" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* 1. Curved connecting lines between interacting neighbor beds within 1.5m */}
        {filteredInteractions.map((interaction) => {
          const linkId = `link_${interaction.bedAId}_${interaction.bedBId}`;
          const isConnectedToSelected =
            selectedEntityId === interaction.bedAId || selectedEntityId === interaction.bedBId;
          const isConnectedToHovered = hoveredEntityId === interaction.bedAId || hoveredEntityId === interaction.bedBId;
          const isHighlighted = isConnectedToSelected || isConnectedToHovered || !selectedEntityId;

          const x1 = interaction.centerA.x * zoom;
          const y1 = interaction.centerA.y * zoom;
          const x2 = interaction.centerB.x * zoom;
          const y2 = interaction.centerB.y * zoom;

          // Quadratic control point arched slightly for clear visual distinction
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const dx = x2 - x1;
          const dy = y2 - y1;
          const normalX = -dy * 0.15;
          const normalY = dx * 0.15;
          const ctrlX = midX + normalX;
          const ctrlY = midY + normalY;

          const hasWarning = interaction.pairings.some((p) => p.classification === 'incompatible');
          const hasBeneficial = interaction.pairings.some((p) => p.classification === 'beneficial');

          const strokeColor = isDark
            ? (hasWarning ? '#F2A6A6' : hasBeneficial ? '#A7C080' : '#708A72')
            : (hasWarning ? '#D97A3D' : hasBeneficial ? '#4F6B45' : '#8A857B');
          const strokeWidth = isConnectedToSelected ? 3.5 : isConnectedToHovered ? 2.5 : 1.8;
          const strokeDash = hasWarning ? '6 4' : hasBeneficial ? 'none' : '3 3';
          const opacity = isConnectedToSelected ? 1 : isConnectedToHovered ? 0.9 : selectedEntityId ? 0.25 : 0.75;

          // Midpoint badge coordinates (bezier point at t=0.5)
          const badgeX = 0.25 * x1 + 0.5 * ctrlX + 0.25 * x2;
          const badgeY = 0.25 * y1 + 0.5 * ctrlY + 0.25 * y2;

          const isLinkActive = activeLinkPopoverId === linkId;

          return (
            <g
              key={linkId}
              className="companion-relation-link"
              opacity={opacity}
              style={{ transition: 'opacity 0.2s ease' }}
            >
              {/* Shadow under curve for high contrast */}
              <path
                d={`M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`}
                fill="none"
                stroke={isDark ? 'rgba(19, 25, 20, 0.95)' : '#FFFDF8'}
                strokeWidth={strokeWidth + 2}
                strokeLinecap="round"
                opacity={0.8}
              />

              {/* Glowing / styled relation line */}
              <path
                d={`M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDash}
                strokeLinecap="round"
              />

              {/* Floating midpoint badge with interaction icon */}
              {isHighlighted && (
                <g
                  transform={`translate(${badgeX}, ${badgeY})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveLinkPopoverId(isLinkActive ? null : linkId);
                    setActivePopoverBedId(null);
                    onSelectEntity(interaction.bedAId);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    r={13}
                    fill={isDark ? (hasWarning ? '#2D1C1D' : '#1A281C') : (hasWarning ? '#FFF4EE' : '#F0F7EE')}
                    stroke={strokeColor}
                    strokeWidth={2}
                    filter={isDark ? (hasWarning ? 'url(#luminous-glow-coral)' : 'url(#luminous-glow-green)') : 'drop-shadow(0px 2px 4px rgba(0,0,0,0.25))'}
                  />
                  {hasWarning ? (
                    <path
                      d="M-5 4 L0 -5 L5 4 Z M0 0 L0 1.5 M0 3 L0 3.5"
                      stroke={strokeColor}
                      strokeWidth="1.2"
                      fill="none"
                      strokeLinecap="round"
                    />
                  ) : (
                    <path
                      d="M-4 3 C-4 -2, 0 -4, 4 -4 C4 1, 1 4, -4 3 Z M-4 3 L1 -1"
                      stroke={strokeColor}
                      strokeWidth="1.2"
                      fill="none"
                      strokeLinecap="round"
                    />
                  )}
                </g>
              )}

              {/* Cross-bed link quick popover */}
              {isLinkActive && (
                <foreignObject
                  x={badgeX - 120}
                  y={badgeY + 16}
                  width={240}
                  height={150}
                  style={{ overflow: 'visible', pointerEvents: 'auto', zIndex: 120 }}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                      border: `1.5px solid ${strokeColor}`,
                      borderRadius: '10px',
                      padding: '10px 12px',
                      boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.18)',
                      fontSize: '11px',
                      fontFamily: 'inherit',
                      color: 'var(--kulv-text, #2A2E24)',
                      lineHeight: '1.4'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '11px', color: strokeColor }}>
                        {hasWarning ? (language === 'en' ? 'Cross-Bed Conflict' : 'Peenarde vaheline konflikt') : (language === 'en' ? 'Cross-Bed Synergy' : 'Peenarde vaheline sünergia')}
                      </span>
                      <button
                        onClick={() => setActiveLinkPopoverId(null)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px', color: 'var(--kulv-text-muted, #5F675A)' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)', marginBottom: '6px' }}>
                      {language === 'en' ? 'Distance between beds:' : 'Peenarde vahekaugus:'} {interaction.distanceM.toFixed(1)} m
                    </div>
                    <div style={{ maxHeight: '75px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {interaction.pairings.slice(0, 3).map((p, idx) => (
                        <div
                          key={idx}
                          style={{
                            fontSize: '10px',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            backgroundColor: isDark
                              ? (p.classification === 'incompatible' ? 'rgba(242, 166, 166, 0.18)' : 'rgba(167, 192, 128, 0.18)')
                              : (p.classification === 'incompatible' ? '#FDF0E9' : '#EBF4E8'),
                            color: isDark
                              ? (p.classification === 'incompatible' ? '#FFC4C4' : '#CDE6A8')
                              : (p.classification === 'incompatible' ? '#9E3C12' : '#2F4F24')
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{p.plantA} + {p.plantB}:</span> {p.explanation || (p.classification === 'incompatible' ? 'Mõjutavad teineteist ebasoodsalt' : 'Soodne naabrus')}
                        </div>
                      ))}
                    </div>
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}

        {/* 2. Floating status badges over all garden bed entities */}
        {bedEntities.map((bed) => {
          const harmony = bedScores.get(bed.id);
          const plantings = bed.bedData?.plantings || [];
          const isSelected = selectedEntityId === bed.id;
          const isHovered = hoveredEntityId === bed.id || hoveredBadgeId === bed.id;
          const isPopoverOpen = activePopoverBedId === bed.id;

          // Position badge at top-center of bed
          const bedCenterX = (bed.x + bed.width / 2) * zoom;
          const bedTopY = bed.y * zoom;

          // Badge values
          const percentage = harmony ? harmony.harmonyPercentage : null;
          const hasWarning = harmony && harmony.negativePairs > 0;
          const hasBeneficial = harmony && harmony.positivePairs > 0;

          let badgeBg = isDark ? '#1A231B' : '#FAF6ED';
          let badgeBorder = isDark ? '#4B5F4C' : '#C9BFA9';
          let badgeTextColor = isDark ? '#D2DACB' : '#5F675A';
          let badgeFilter = isDark ? 'url(#luminous-glow-neutral)' : 'drop-shadow(0px 2px 6px rgba(0,0,0,0.18))';
          let iconType: 'leaf' | 'scale' | 'alert' | 'sprout' = 'sprout';

          if (percentage !== null) {
            if (percentage >= 80) {
              badgeBg = isDark ? '#1A281C' : '#EBF4E8';
              badgeBorder = isDark ? '#A7C080' : '#4F6B45';
              badgeTextColor = isDark ? '#CDE6A8' : '#2F4F24';
              badgeFilter = isDark ? 'url(#luminous-glow-green)' : 'drop-shadow(0px 2px 6px rgba(0,0,0,0.18))';
              iconType = 'leaf';
            } else if (percentage >= 50) {
              badgeBg = isDark ? '#2A2417' : '#FFF8E6';
              badgeBorder = isDark ? '#E5BD70' : '#D9A03D';
              badgeTextColor = isDark ? '#F8DF9F' : '#8F5800';
              badgeFilter = isDark ? 'url(#luminous-glow-amber)' : 'drop-shadow(0px 2px 6px rgba(0,0,0,0.18))';
              iconType = 'scale';
            } else {
              badgeBg = isDark ? '#2D1C1D' : '#FDF0E9';
              badgeBorder = isDark ? '#F2A6A6' : '#D97A3D';
              badgeTextColor = isDark ? '#FFC4C4' : '#9E3C12';
              badgeFilter = isDark ? 'url(#luminous-glow-coral)' : 'drop-shadow(0px 2px 6px rgba(0,0,0,0.18))';
              iconType = 'alert';
            }
          }

          const badgeScale = isHovered || isPopoverOpen ? 1.08 : 1.0;

          return (
            <g
              key={`bed_badge_${bed.id}`}
              transform={`translate(${bedCenterX}, ${bedTopY - 14})`}
              className="bed-companion-floating-badge"
              style={{ cursor: 'pointer', transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)' }}
              onMouseEnter={() => setHoveredBadgeId(bed.id)}
              onMouseLeave={() => setHoveredBadgeId(null)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectEntity(bed.id);
                setActivePopoverBedId(isPopoverOpen ? null : bed.id);
                setActiveLinkPopoverId(null);
              }}
            >
              {/* Badge container with dual cues: tactile pill, icon, and numerical percentage */}
              <g transform={`scale(${badgeScale})`} style={{ transformOrigin: '0 0' }}>
                <rect
                  x={-34}
                  y={-12}
                  width={68}
                  height={24}
                  rx={12}
                  fill={badgeBg}
                  stroke={isSelected || isPopoverOpen ? (isDark ? '#F5F2EB' : '#2A2E24') : badgeBorder}
                  strokeWidth={isSelected || isPopoverOpen ? 2 : 1.4}
                  filter={badgeFilter}
                />

                {/* SVG Vector Icon instead of raw emoji */}
                <g transform="translate(-23, -6)">
                  {iconType === 'leaf' && (
                    <path
                      d="M2 11 C2 5, 6 2, 11 2 C11 7, 8 11, 2 11 Z M2 11 L6 7"
                      stroke={badgeBorder}
                      strokeWidth="1.3"
                      fill="none"
                      strokeLinecap="round"
                    />
                  )}
                  {iconType === 'scale' && (
                    <path
                      d="M1 4 L4 9 L1 9 Z M8 4 L11 9 L8 9 Z M6 2 L6 11 M3 4 L9 4"
                      stroke={badgeBorder}
                      strokeWidth="1.2"
                      fill="none"
                      strokeLinecap="round"
                    />
                  )}
                  {iconType === 'alert' && (
                    <path
                      d="M6 1 L1 11 L11 11 Z M6 5 L6 8 M6 9.5 L6 10"
                      stroke={badgeBorder}
                      strokeWidth="1.2"
                      fill="none"
                      strokeLinecap="round"
                    />
                  )}
                  {iconType === 'sprout' && (
                    <path
                      d="M6 11 L6 6 M6 6 C4 4, 2 5, 2 7 C4 7, 5 6, 6 6 M6 6 C8 4, 10 5, 10 7 C8 7, 7 6, 6 6"
                      stroke={badgeBorder}
                      strokeWidth="1.2"
                      fill="none"
                      strokeLinecap="round"
                    />
                  )}
                </g>

                <text
                  x={6}
                  y={1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="10"
                  fontWeight="700"
                  fill={badgeTextColor}
                  fontFamily="'Plus Jakarta Sans', monospace"
                >
                  {percentage !== null ? `${percentage}%` : plantings.length > 0 ? `${plantings.length} tk` : (language === 'en' ? 'Empty' : 'Tühi')}
                </text>

                {/* Warning indicator dot if bed has an incompatible pairing */}
                {hasWarning && <circle cx={27} cy={-5} r={3.5} fill="#D97A3D" stroke={isDark ? '#131914' : '#FFFDF8'} strokeWidth={1} />}
              </g>

              {/* Interactive Quick-Card Popover */}
              {isPopoverOpen && (
                <foreignObject
                  x={-130}
                  y={16}
                  width={260}
                  height={220}
                  style={{ overflow: 'visible', pointerEvents: 'auto', zIndex: 150 }}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                      border: `1.5px solid ${badgeBorder}`,
                      borderRadius: '12px',
                      padding: '12px 14px',
                      boxShadow: isDark ? '0 8px 28px rgba(0,0,0,0.55)' : '0 8px 24px rgba(0,0,0,0.22)',
                      fontSize: '11px',
                      fontFamily: 'inherit',
                      color: 'var(--kulv-text, #2A2E24)',
                      lineHeight: '1.4'
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--kulv-text, #2A2E24)' }}>
                          {bed.name}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                          {percentage !== null ? `${percentage}% ${language === 'en' ? 'Harmony' : 'Koosmõju indeks'}` : (language === 'en' ? 'No plants yet' : 'Taimi pole veel istutatud')}
                        </div>
                      </div>
                      <button
                        onClick={() => setActivePopoverBedId(null)}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          color: 'var(--kulv-text-muted, #5F675A)'
                        }}
                        title={language === 'en' ? 'Close' : 'Sulge'}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Content details */}
                    <div style={{ maxHeight: '95px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
                      {harmony && harmony.positivePairs > 0 && (
                        <div
                          style={{
                            backgroundColor: isDark ? 'rgba(167, 192, 128, 0.2)' : '#EBF4E8',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            color: isDark ? '#CDE6A8' : '#2F4F24'
                          }}
                        >
                          <span style={{ fontWeight: 700 }}>🌿 {harmony.positivePairs} {language === 'en' ? 'synergistic pairing(s)' : 'soodsat kooslust'}</span>
                        </div>
                      )}
                      {harmony && harmony.negativePairs > 0 && (
                        <div
                          style={{
                            backgroundColor: isDark ? 'rgba(242, 166, 166, 0.2)' : '#FDF0E9',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            color: isDark ? '#FFC4C4' : '#9E3C12'
                          }}
                        >
                        </div>
                      )}
                      {harmony && harmony.recommendations && harmony.recommendations.length > 0 && (
                        <div style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)', fontStyle: 'italic' }}>
                          {harmony.recommendations[0].explanation || harmony.recommendations[0].message}
                        </div>
                      )}
                      {(!harmony || plantings.length === 0) && (
                        <div style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                          {language === 'en'
                            ? 'Open the bed grid to add plants and inspect companion synergies.'
                            : 'Ava peenra ruudustik, et lisada taimi ja jälgida kaaslaste koosmõju.'}
                        </div>
                      )}
                    </div>

                    {/* Drill-down CTA */}
                    {onOpenBedDetail && (
                      <button
                        onClick={() => {
                          setActivePopoverBedId(null);
                          onOpenBedDetail(bed.id);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--kulv-primary, #4F6B45)',
                          color: '#FFFFFF',
                          border: 'none',
                          fontWeight: 600,
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        <span>{language === 'en' ? 'Open Bed Grid' : 'Ava peenra ruudustik'}</span>
                        <ExternalLink size={12} />
                      </button>
                    )}
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </g>
    );
  }
);

