import React, { useMemo } from 'react';
import { GardenEntity, Plant, Point2D } from '../../types';
import {
  CompanionEngine,
  CompanionClassification,
  CrossBedInteraction,
  BedHarmonyScore
} from '../../logic/companionEngine';

interface CompanionOverlayLayerProps {
  entities: GardenEntity[];
  selectedEntityId: string | null;
  hoveredEntityId: string | null;
  zoom: number; // pixels per metre
  allPlants: Plant[];
  language: 'et' | 'en';
  filter: 'all' | 'beneficial' | 'incompatible' | 'uncertain';
  onSelectEntity: (entityId: string) => void;
}

export const CompanionOverlayLayer: React.FC<CompanionOverlayLayerProps> = React.memo(
  ({ entities, selectedEntityId, hoveredEntityId, zoom, allPlants, language, filter, onSelectEntity }) => {
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
        {/* 1. Curved connecting lines between interacting neighbor beds within 1.5m */}
        {filteredInteractions.map((interaction) => {
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

          const strokeColor = hasWarning ? '#D97A3D' : hasBeneficial ? '#4F6B45' : '#8A857B';
          const strokeWidth = isConnectedToSelected ? 3.5 : isConnectedToHovered ? 2.5 : 1.8;
          const strokeDash = hasWarning ? '6 4' : hasBeneficial ? 'none' : '3 3';
          const opacity = isConnectedToSelected ? 1 : isConnectedToHovered ? 0.9 : selectedEntityId ? 0.25 : 0.75;

          // Midpoint badge coordinates (bezier point at t=0.5)
          const badgeX = 0.25 * x1 + 0.5 * ctrlX + 0.25 * x2;
          const badgeY = 0.25 * y1 + 0.5 * ctrlY + 0.25 * y2;

          return (
            <g
              key={`rel_${interaction.bedAId}_${interaction.bedBId}`}
              className="companion-relation-link"
              opacity={opacity}
              style={{ transition: 'opacity 0.2s ease' }}
            >
              {/* Shadow under curve for high contrast */}
              <path
                d={`M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`}
                fill="none"
                stroke="#FFFDF8"
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
                    onSelectEntity(interaction.bedAId);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    r={12}
                    fill={hasWarning ? '#FFF4EE' : '#F0F7EE'}
                    stroke={strokeColor}
                    strokeWidth={2}
                    filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.25))"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="10"
                    fontWeight="bold"
                    fill={strokeColor}
                  >
                    {hasWarning ? '⚠️' : '🌿'}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* 2. Floating status badges over all garden bed entities */}
        {bedEntities.map((bed) => {
          const harmony = bedScores.get(bed.id);
          const plantings = bed.bedData?.plantings || [];
          const isSelected = selectedEntityId === bed.id;
          const isHovered = hoveredEntityId === bed.id;

          // Position badge at top-center of bed
          const bedCenterX = (bed.x + bed.width / 2) * zoom;
          const bedTopY = bed.y * zoom;

          // Badge values
          const percentage = harmony ? harmony.harmonyPercentage : null;
          const hasWarning = harmony && harmony.negativePairs > 0;
          const hasBeneficial = harmony && harmony.positivePairs > 0;

          let badgeBg = '#FAF6ED';
          let badgeBorder = '#C9BFA9';
          let badgeTextColor = '#5F675A';
          let iconSymbol = '🌱';

          if (percentage !== null) {
            if (percentage >= 80) {
              badgeBg = '#EBF4E8';
              badgeBorder = '#4F6B45';
              badgeTextColor = '#2F4F24';
              iconSymbol = '🌿';
            } else if (percentage >= 50) {
              badgeBg = '#FFF8E6';
              badgeBorder = '#D9A03D';
              badgeTextColor = '#8F5800';
              iconSymbol = '⚖️';
            } else {
              badgeBg = '#FDF0E9';
              badgeBorder = '#D97A3D';
              badgeTextColor = '#9E3C12';
              iconSymbol = '⚠️';
            }
          }

          return (
            <g
              key={`bed_badge_${bed.id}`}
              transform={`translate(${bedCenterX}, ${bedTopY - 14})`}
              className="bed-companion-floating-badge"
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectEntity(bed.id);
              }}
            >
              {/* Badge container with dual cues: color, icon, and numerical percentage */}
              <rect
                x={-34}
                y={-12}
                width={68}
                height={22}
                rx={11}
                fill={badgeBg}
                stroke={isSelected ? '#2A2E24' : badgeBorder}
                strokeWidth={isSelected ? 2.5 : 1.5}
                filter="drop-shadow(0px 2px 5px rgba(0,0,0,0.22))"
              />

              {/* Icon + text */}
              <text x={-24} y={2} fontSize="10" dominantBaseline="central">
                {iconSymbol}
              </text>

              <text
                x={4}
                y={2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="10"
                fontWeight="bold"
                fill={badgeTextColor}
                fontFamily="monospace"
              >
                {percentage !== null ? `${percentage}%` : plantings.length > 0 ? `${plantings.length} tk` : 'Tühi'}
              </text>

              {/* Warning indicator dot if bed has an incompatible pairing */}
              {hasWarning && <circle cx={26} cy={-4} r={4} fill="#D97A3D" stroke="#FFFDF8" strokeWidth={1} />}
            </g>
          );
        })}
      </g>
    );
  }
);
