import React, { useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useYardStore } from '../../stores/yardStore';
import { useGarden } from '../../context/GardenContext';
import { SolarEngine } from '../../logic/solarEngine';
import { Entity3DMesh } from './Entity3DMesh';
import { Sun, RotateCcw, Compass, Eye, Grid } from 'lucide-react';

interface Yard3DCanvasProps {
  onBackTo2D: () => void;
}

/**
 * 3D Scene content running inside the R3F Canvas context.
 */
const Yard3DScene: React.FC<{ solarAltitude: number; solarAzimuth: number }> = ({
  solarAltitude,
  solarAzimuth
}) => {
  const plan = useYardStore((s) => s.plan);
  const selectedEntityId = useYardStore((s) => s.selectedEntityId);
  const hoveredEntityId = useYardStore((s) => s.hoveredEntityId);
  const setSelectedEntityId = useYardStore((s) => s.setSelectedEntityId);
  const setHoveredEntityId = useYardStore((s) => s.setHoveredEntityId);

  // Active entities only (exclude soft-deleted entities)
  const activeEntities = useMemo(() => {
    return (plan?.entities || []).filter((e) => !e.deletedAt && e.visible !== false);
  }, [plan?.entities]);

  // Yard dimensions
  const widthM = plan?.widthM || 20;
  const lengthM = plan?.lengthM || 30;
  const northAngleDeg = plan?.northAngleDeg || 0;

  // Calculate sun light direction in 3D space
  const { lightPos, lightColor, ambientIntensity } = useMemo(() => {
    const effAzimuth = solarAzimuth - northAngleDeg;
    const altRad = (Math.max(4.0, solarAltitude) * Math.PI) / 180;
    const azRad = (effAzimuth * Math.PI) / 180;
    const distance = Math.max(widthM, lengthM) * 1.8;

    // In Three.js: +X is East, -X is West, +Z is South, -Z is North
    // When effAzimuth = 180° (South), cos(180) = -1, so -distance * -1 = +distance (South)
    const x = distance * Math.cos(altRad) * Math.sin(azRad);
    const y = distance * Math.sin(altRad);
    const z = -distance * Math.cos(altRad) * Math.cos(azRad);

    // Warm golden hour sunlight when low on horizon, bright daylight when high
    let color = '#FFF9E6';
    let amb = 0.45;
    if (solarAltitude < 15) {
      color = '#FF9E50'; // Golden sunrise/sunset
      amb = 0.3;
    } else if (solarAltitude < 30) {
      color = '#FFE8C2';
      amb = 0.4;
    }

    return {
      lightPos: [x, y, z] as [number, number, number],
      lightColor: color,
      ambientIntensity: amb
    };
  }, [solarAltitude, solarAzimuth, northAngleDeg, widthM, lengthM]);

  const maxDimension = Math.max(widthM, lengthM);

  return (
    <>
      {/* Soft Ambient Fill Lighting */}
      <ambientLight intensity={ambientIntensity} />

      {/* Primary Directional Sunlight with Real-time Shadows */}
      <directionalLight
        position={lightPos}
        intensity={1.25}
        color={lightColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={maxDimension * 4}
        shadow-camera-left={-widthM * 0.9}
        shadow-camera-right={widthM * 0.9}
        shadow-camera-top={lengthM * 0.9}
        shadow-camera-bottom={-lengthM * 0.9}
        shadow-bias={-0.0004}
      />

      {/* OrbitControls for smooth panning, zooming, rotating */}
      <OrbitControls
        enableDamping
        dampingFactor={0.07}
        maxPolarAngle={Math.PI / 2 - 0.05} // Prevent camera going underground
        minDistance={3}
        maxDistance={maxDimension * 3.5}
      />

      {/* Ground Lawn Plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          setSelectedEntityId(null);
        }}
      >
        <planeGeometry args={[widthM, lengthM]} />
        <meshStandardMaterial
          color="#3A6B35" // Deep Nordic meadow green
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>

      {/* Ground Property Perimeter Border */}
      {widthM > 0 && lengthM > 0 && (
        <lineSegments position={[0, 0.005, 0]}>
          <boxGeometry args={[widthM, 0.01, lengthM]} />
          <lineBasicMaterial color="#E2E8F0" linewidth={2} transparent opacity={0.65} />
        </lineSegments>
      )}

      {/* Metric Grid Overlay on the Ground */}
      <gridHelper
        args={[Math.max(widthM, lengthM), Math.round(Math.max(widthM, lengthM)), '#94A3B8', '#475569']}
        position={[0, 0.002, 0]}
      />

      {/* Render all 3D entities */}
      {plan && activeEntities.map((entity) => (
        <Entity3DMesh
          key={entity.id}
          entity={entity}
          plan={plan}
          isSelected={entity.id === selectedEntityId}
          isHovered={entity.id === hoveredEntityId}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEntityId(entity.id);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveredEntityId(entity.id);
          }}
          onPointerOut={() => {
            setHoveredEntityId(null);
          }}
        />
      ))}
    </>
  );
};

export const Yard3DCanvas: React.FC<Yard3DCanvasProps> = ({ onBackTo2D }) => {
  const plan = useYardStore((s) => s.plan);
  const selectedEntityId = useYardStore((s) => s.selectedEntityId);
  const solarHour = useYardStore((s) => s.solarHour);
  const setSolarHour = useYardStore((s) => s.setSolarHour);
  const { settings, language } = useGarden();

  const selectedEntity = useMemo(() => {
    return plan.entities.find((e) => e.id === selectedEntityId);
  }, [plan.entities, selectedEntityId]);

  // Sun calculation aligned with 2D SolarEngine formula
  const { solarAltitude, solarAzimuth } = useMemo(() => {
    const lat = settings.lat || 59.437;
    const hourDelta = solarHour - 13.25;
    const peakAltitude = SolarEngine.calculateSolarNoonAltitude(lat, 172);
    const altitude = Math.max(5.0, peakAltitude - Math.pow(hourDelta, 2) * 1.05);
    const azimuth = 180 + hourDelta * 15;

    return {
      solarAltitude: altitude,
      solarAzimuth: azimuth
    };
  }, [settings.lat, solarHour]);

  // Format solar hour display (e.g. 14:00)
  const hourDisplay = `${Math.floor(solarHour).toString().padStart(2, '0')}:${solarHour % 1 !== 0 ? '30' : '00'}`;

  // Sky color according to solar altitude
  const skyBackground = useMemo(() => {
    if (solarAltitude > 35) return '#7ec8e3'; // Clear blue midsummer sky
    if (solarAltitude > 20) return '#a2d6ec';
    if (solarAltitude > 10) return '#f4a261'; // Golden sunset sky
    return '#3f4e65'; // Dusk sky
  }, [solarAltitude]);

  const maxDimension = Math.max(plan?.widthM || 20, plan?.lengthM || 30);
  const activeEntitiesCount = plan.entities.filter((e) => !e.deletedAt).length;

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[500px] bg-[#1E2E20] rounded-xl overflow-hidden shadow-xl border border-[#C9BFA9]/60">
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{
          position: [0, maxDimension * 0.8, maxDimension * 1.1],
          fov: 45,
          near: 0.1,
          far: Math.max(plan?.widthM || 20, plan?.lengthM || 30) * 5
        }}
        gl={{
          powerPreference: 'high-performance',
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05
        }}
        dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1}
        style={{ background: skyBackground }}
      >
        <Yard3DScene solarAltitude={solarAltitude} solarAzimuth={solarAzimuth} />
      </Canvas>

      {/* Floating Header & Navigation Controls */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: View Mode Switcher and Plot Title */}
        <div className="flex items-center gap-2.5 bg-[#1A261C]/92 backdrop-blur-md px-3.5 py-2 rounded-lg border border-[#3E5A35]/60 shadow-lg pointer-events-auto">
          <div className="flex items-center gap-2 pr-2 border-r border-[#3E5A35]/50">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold text-[#FAF6ED] font-serif-display">
              {language === 'en' ? '3D View' : '3D Vaade'}
            </span>
          </div>
          <button
            onClick={onBackTo2D}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#FAF6ED] hover:text-white bg-[#2D3E2F] hover:bg-[#385A40] rounded transition-colors min-h-[32px]"
            title={language === 'en' ? 'Switch back to 2D plot plan' : 'Lülitu tagasi 2D krundiplaanile'}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{language === 'en' ? '2D Plan' : '2D Plaan'}</span>
          </button>
          <span className="text-xs text-[#C9BFA9] ml-1">
            {plan.widthM}m × {plan.lengthM}m · {activeEntitiesCount} {language === 'en' ? 'objects' : 'objekti'}
          </span>
        </div>

        {/* Right: Solar Time Slider HUD */}
        <div className="flex items-center gap-3 bg-[#1A261C]/92 backdrop-blur-md px-4 py-2 rounded-lg border border-[#3E5A35]/60 shadow-lg pointer-events-auto">
          <div className="flex items-center gap-2 text-amber-300">
            <Sun className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-mono font-bold">{hourDisplay}</span>
          </div>
          <input
            type="range"
            min="6.0"
            max="22.0"
            step="0.5"
            value={solarHour}
            onChange={(e) => setSolarHour(parseFloat(e.target.value))}
            className="w-28 sm:w-36 h-2 bg-[#2D3E2F] rounded-lg appearance-none cursor-pointer accent-[#D97A3D]"
            title={language === 'en' ? `Change solar position (${hourDisplay})` : `Muuda päikese asendit (${hourDisplay})`}
            aria-label={language === 'en' ? 'Solar time in 3D view' : 'Päikese kellaaeg 3D vaates'}
          />
          <div className="text-[11px] text-[#C9BFA9] hidden sm:block">
            {language === 'en' ? 'Altitude' : 'Kõrgus'}: <span className="text-[#FAF6ED] font-medium">{Math.round(solarAltitude)}°</span> · {language === 'en' ? 'Azimuth' : 'Asimuut'}: <span className="text-[#FAF6ED] font-medium">{Math.round(solarAzimuth)}°</span>
          </div>
        </div>
      </div>

      {/* Floating Bottom HUD: Selected Entity Details & Controls Hint */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        {/* Navigation hint */}
        <div className="bg-[#1A261C]/90 backdrop-blur-md px-3.5 py-2 rounded-lg border border-[#3E5A35]/60 text-[11px] text-[#C9BFA9] pointer-events-auto hidden sm:flex items-center gap-2">
          <span>{language === 'en' ? '🖱️ Left-click: orbit' : '🖱️ Vasak klõps: pööra'}</span>
          <span>·</span>
          <span>{language === 'en' ? '🖱️ Right-click: pan' : '🖱️ Parem klõps: nihuta'}</span>
          <span>·</span>
          <span>{language === 'en' ? 'Scroll: zoom' : 'Rullik: suumi'}</span>
        </div>

        {/* Selected Entity Card */}
        {selectedEntity && (
          <div className="bg-[#1A261C]/95 backdrop-blur-md px-4 py-2.5 rounded-lg border border-[#4F6B45] text-xs shadow-xl pointer-events-auto flex items-center gap-3.5 ml-auto">
            <div>
              <div className="font-semibold text-[#FAF6ED] font-serif-display flex items-center gap-1.5">
                <span>{selectedEntity.icon || '🌱'}</span>
                <span>{selectedEntity.name}</span>
              </div>
              <div className="text-[11px] text-[#C9BFA9] mt-0.5">
                {selectedEntity.width}m × {selectedEntity.length}m · {language === 'en' ? 'Height' : 'Kõrgus'}: {selectedEntity.heightM}m
                {selectedEntity.elevationM ? ` · ${language === 'en' ? 'Elevation' : 'Tõus'}: +${selectedEntity.elevationM}m` : ''}
              </div>
            </div>
            <button
              onClick={() => useYardStore.getState().setSelectedEntityId(null)}
              className="text-[#C9BFA9] hover:text-[#FAF6ED] text-xs px-2.5 py-1 rounded bg-[#2D3E2F] hover:bg-[#385A40] transition-colors"
            >
              {language === 'en' ? 'Close' : 'Sulge'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Yard3DCanvas;
