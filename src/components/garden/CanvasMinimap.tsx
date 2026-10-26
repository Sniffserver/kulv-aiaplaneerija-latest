import React, { useRef, useCallback, useState } from 'react';
import { YardPlan, GardenEntity } from '../../types';
import { Map, ChevronDown, ChevronUp, Compass } from 'lucide-react';

interface CanvasMinimapProps {
  plan: YardPlan;
  entities: GardenEntity[];
  zoom: number;
  panOffset: { x: number; y: number };
  canvasWidth: number;
  canvasHeight: number;
  onPanChange: (newPan: { x: number; y: number }) => void;
  language?: 'et' | 'en';
}

export const CanvasMinimap: React.FC<CanvasMinimapProps> = ({
  plan,
  entities,
  zoom,
  panOffset,
  canvasWidth,
  canvasHeight,
  onPanChange,
  language = 'et'
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Yard dimensions in metres
  const yardWidthM = Math.max(10, plan.widthM || 20);
  const yardLengthM = Math.max(10, plan.lengthM || 25);

  // Minimap size in pixels
  const miniWidth = 160;
  const aspectRatio = yardLengthM / yardWidthM;
  const miniHeight = Math.max(85, Math.min(140, Math.round(miniWidth * aspectRatio)));

  // Scale from yard metres to minimap pixels
  const scale = Math.min((miniWidth - 12) / yardWidthM, (miniHeight - 12) / yardLengthM);
  const offsetX = (miniWidth - yardWidthM * scale) / 2;
  const offsetY = (miniHeight - yardLengthM * scale) / 2;

  // Viewport camera rectangle calculation
  const viewMeterX = -panOffset.x / zoom;
  const viewMeterY = -panOffset.y / zoom;
  const viewMeterW = canvasWidth / zoom;
  const viewMeterH = canvasHeight / zoom;

  const vpX = offsetX + viewMeterX * scale;
  const vpY = offsetY + viewMeterY * scale;
  const vpW = Math.max(14, viewMeterW * scale);
  const vpH = Math.max(14, viewMeterH * scale);

  // Handle click / drag on minimap to center viewport
  const handleMinimapInteraction = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left - offsetX;
      const clickY = clientY - rect.top - offsetY;

      // Convert clicked minimap coordinate to metres
      const targetMetersX = clickX / scale;
      const targetMetersY = clickY / scale;

      // Center the viewport on this metre position
      const newPanX = Math.round(canvasWidth / 2 - targetMetersX * zoom);
      const newPanY = Math.round(canvasHeight / 2 - targetMetersY * zoom);

      onPanChange({ x: newPanX, y: newPanY });
    },
    [scale, offsetX, offsetY, canvasWidth, canvasHeight, zoom, onPanChange]
  );

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    handleMinimapInteraction(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    handleMinimapInteraction(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 1) {
      e.stopPropagation();
      setIsDragging(true);
      const t = e.touches[0];
      handleMinimapInteraction(t.clientX, t.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (isDragging && e.touches.length === 1) {
      e.stopPropagation();
      const t = e.touches[0];
      handleMinimapInteraction(t.clientX, t.clientY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      data-testid="canvas_minimap"
      style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        zIndex: 20,
        backgroundColor: 'var(--kulv-surface, #FFFDF8)',
        border: '1px solid var(--kulv-border, #C9BFA9)',
        borderRadius: '10px',
        boxShadow: 'var(--kulv-shadow-elevated, 0 4px 12px rgba(0,0,0,0.12))',
        overflow: 'hidden',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease, height 0.2s ease'
      }}
    >
      {/* Minimap header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
          backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
          borderBottom: isCollapsed ? 'none' : '1px solid var(--kulv-border, #C9BFA9)',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--kulv-text, #2A2E24)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Map size={13} color="var(--kulv-primary, #4F6B45)" />
          <span>{language === 'en' ? 'Plot Minimap' : 'Krundi minikaart'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {plan.northAngleDeg !== undefined && (
            <span
              title={`Põhjasuund: ${plan.northAngleDeg}°`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                transform: `rotate(${plan.northAngleDeg}deg)`,
                color: 'var(--kulv-accent, #D97A3D)'
              }}
            >
              <Compass size={12} />
            </span>
          )}
          <button
            onClick={() => setIsCollapsed((c) => !c)}
            title={isCollapsed ? 'Ava minikaart' : 'Peida minikaart'}
            aria-label="Minikaardi lüliti"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--kulv-text-muted, #5F675A)',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '24px',
              minHeight: '24px'
            }}
          >
            {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* SVG Minimap Canvas */}
      {!isCollapsed && (
        <div style={{ position: 'relative', width: `${miniWidth}px`, height: `${miniHeight}px`, cursor: 'crosshair' }}>
          <svg
            ref={svgRef}
            width={miniWidth}
            height={miniHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ display: 'block', backgroundColor: '#F4ECE1' }}
          >
            {/* Yard boundary outline */}
            {plan.boundaryPolygon && plan.boundaryPolygon.length >= 3 ? (
              <polygon
                points={plan.boundaryPolygon
                  .map((p) => `${offsetX + p.x * scale},${offsetY + p.y * scale}`)
                  .join(' ')}
                fill="rgba(79, 107, 69, 0.08)"
                stroke="var(--kulv-primary, #4F6B45)"
                strokeWidth={1.5}
                strokeDasharray="3 2"
              />
            ) : (
              <rect
                x={offsetX}
                y={offsetY}
                width={yardWidthM * scale}
                height={yardLengthM * scale}
                fill="rgba(79, 107, 69, 0.08)"
                stroke="var(--kulv-primary, #4F6B45)"
                strokeWidth={1}
                strokeDasharray="2 2"
              />
            )}

            {/* Entities mini shapes */}
            {entities.map((e) => {
              const ex = offsetX + e.x * scale;
              const ey = offsetY + e.y * scale;
              const ew = Math.max(2, e.width * scale);
              const el = Math.max(2, e.length * scale);

              let fillColor = '#657D5C'; // bed green
              if (e.category === 'structure') fillColor = '#7D7569'; // stone gray
              if (e.category === 'tree' || e.category === 'shrub') fillColor = '#3D5E34'; // tree dark green
              if (e.category === 'path') fillColor = '#C4BAA7'; // sand path

              return (
                <rect
                  key={e.id}
                  x={ex}
                  y={ey}
                  width={ew}
                  height={el}
                  fill={fillColor}
                  opacity={0.85}
                  rx={1}
                  transform={
                    e.rotation ? `rotate(${e.rotation}, ${ex + ew / 2}, ${ey + el / 2})` : undefined
                  }
                />
              );
            })}

            {/* Camera Viewport Indicator Box */}
            <rect
              x={vpX}
              y={vpY}
              width={vpW}
              height={vpH}
              fill="rgba(217, 122, 61, 0.16)"
              stroke="var(--kulv-accent, #D97A3D)"
              strokeWidth={1.5}
              rx={2}
              style={{ pointerEvents: 'none' }}
            />
          </svg>

          {/* Scale indication tag */}
          <div
            style={{
              position: 'absolute',
              bottom: '2px',
              left: '4px',
              fontSize: '9px',
              fontFamily: 'monospace',
              color: 'var(--kulv-text-muted, #5F675A)',
              pointerEvents: 'none'
            }}
          >
            {yardWidthM}×{yardLengthM}m
          </div>
        </div>
      )}
    </div>
  );
};
