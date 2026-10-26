import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useYardStore } from '../../stores/yardStore';
import { useGarden } from '../../context/GardenContext';
import { SolarEngine, SOLAR_SEASON_PRESETS } from '../../logic/solarEngine';
import { CompanionEngine } from '../../logic/companionEngine';
import { toThreePosition } from '../../lib/three/coords';
import { Entity3DMesh } from './Entity3DMesh';
import { ControlOverlay } from './ControlOverlay';

const isSoftwareGl = (() => {
  if (typeof document === 'undefined') return false;
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param));
  gl.getExtension('WEBGL_lose_context')?.loseContext(); // free the probe
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
})();

interface Yard3DCanvasProps {
  onBackTo2D: () => void;
}

/**
 * 3D Scene content running inside the R3F Canvas context.
 */
const Yard3DScene: React.FC<{
  solarAltitude: number;
  solarAzimuth: number;
  shadowsEnabled: boolean;
  performanceMode?: boolean;
  cameraPreset?: 'top' | 'iso' | 'ground';
  showCompanionPins?: boolean;
}> = ({
  solarAltitude,
  solarAzimuth,
  shadowsEnabled,
  performanceMode = false,
  cameraPreset = 'iso',
  showCompanionPins = true
}) => {
  const plan = useYardStore((s) => s.plan);
  const selectedEntityId = useYardStore((s) => s.selectedEntityId);
  const hoveredEntityId = useYardStore((s) => s.hoveredEntityId);
  const setSelectedEntityId = useYardStore((s) => s.setSelectedEntityId);
  const setHoveredEntityId = useYardStore((s) => s.setHoveredEntityId);
  const { beds: gardenBeds, plants, language, isDarkMode } = useGarden();

  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  // Active entities only (exclude soft-deleted entities)
  const activeEntities = useMemo(() => {
    return (plan?.entities || []).filter((e) => !e.deletedAt && e.visible !== false);
  }, [plan?.entities]);

  // Yard dimensions
  const widthM = plan?.widthM || 20;
  const lengthM = plan?.lengthM || 30;
  const northAngleDeg = plan?.northAngleDeg || 0;

  // Calculate sun light direction in 3D space
  const { lightPos, lightColor, ambientIntensity, shadowFrustumWidth, shadowFrustumLength } = useMemo(() => {
    const effAzimuth = solarAzimuth - northAngleDeg;
    const clampedAlt = Math.max(3.5, solarAltitude);
    const altRad = (clampedAlt * Math.PI) / 180;
    const azRad = (effAzimuth * Math.PI) / 180;
    const distance = Math.max(widthM, lengthM) * 2.2;

    // In Three.js: +X is East, -X is West, +Z is South, -Z is North
    const x = distance * Math.cos(altRad) * Math.sin(azRad);
    const y = distance * Math.sin(altRad);
    const z = -distance * Math.cos(altRad) * Math.cos(azRad);

    // Dynamic light color based on altitude and solar angle
    let color = '#FFF8E7';
    let amb = 0.42;
    if (solarAltitude < 12) {
      color = '#FF8A3D'; // Rich amber golden sunset/sunrise
      amb = 0.28;
    } else if (solarAltitude < 25) {
      color = '#FFDE9E'; // Warm morning / afternoon light
      amb = 0.36;
    } else if (solarAltitude > 45) {
      color = '#FFFFF5'; // Crisp high zenith noon
      amb = 0.48;
    }

    // Dynamic shadow frustum expansion for low-angle long shadows (e.g. spring/autumn equinox)
    const shadowStretch = Math.max(1.2, Math.min(3.5, 1.0 / Math.tan(Math.max(0.12, altRad))));
    const frustumW = Math.max(widthM * 1.3, widthM * shadowStretch * 0.7);
    const frustumL = Math.max(lengthM * 1.3, lengthM * shadowStretch * 0.7);

    return {
      lightPos: [x, y, z] as [number, number, number],
      lightColor: color,
      ambientIntensity: amb,
      shadowFrustumWidth: frustumW,
      shadowFrustumLength: frustumL
    };
  }, [solarAltitude, solarAzimuth, northAngleDeg, widthM, lengthM]);

  const maxDimension = Math.max(widthM, lengthM);
  const shadowResolution = performanceMode ? 512 : isSoftwareGl ? 1024 : 2048;

  // Reposition camera when cameraPreset changes
  useEffect(() => {
    if (!controlsRef.current) return;
    const maxDim = Math.max(widthM, lengthM);

    if (cameraPreset === 'top') {
      camera.position.set(0, maxDim * 1.5, 0.001);
      controlsRef.current.target.set(0, 0, 0);
    } else if (cameraPreset === 'ground') {
      camera.position.set(0, 1.6, maxDim * 0.55);
      controlsRef.current.target.set(0, 0.8, 0);
    } else {
      // 'iso' default angle
      camera.position.set(maxDim * 0.75, maxDim * 0.85, maxDim * 1.05);
      controlsRef.current.target.set(0, 0, 0);
    }
    controlsRef.current.update();
  }, [cameraPreset, camera, widthM, lengthM]);

  // Compute companion harmony scores for bed entities to billboard floating pins in 3D
  const bedHarmonyPins = useMemo(() => {
    if (!showCompanionPins || !plan) return [];
    return activeEntities
      .filter((e) => e.category === 'bed' || e.category === 'structure')
      .map((entity) => {
        const plantings = entity.bedData?.plantings?.length
          ? entity.bedData.plantings
          : (gardenBeds.find((b) => b.id === entity.id)?.plantings || []);
        if (!plantings || plantings.length === 0) return null;

        const harmony = CompanionEngine.calculateBedHarmony(plantings, plants, language);
        const [x, y, z] = toThreePosition(entity, plan);
        const elevation = (entity.heightM || 0.4) / 2 + 0.5;

        return {
          entity,
          harmony,
          position: [x, y + elevation, z] as [number, number, number],
          plantCount: plantings.length
        };
      })
      .filter((pin): pin is NonNullable<typeof pin> => pin !== null);
  }, [showCompanionPins, plan, activeEntities, gardenBeds, plants, language]);

  return (
    <>
      {/* Soft Ambient Fill Lighting */}
      <ambientLight intensity={ambientIntensity} />

      {/* Primary Directional Sunlight with Seasonal Real-time Shadows */}
      <directionalLight
        position={lightPos}
        intensity={solarAltitude > 0 ? 1.35 : 0.2}
        color={lightColor}
        castShadow={shadowsEnabled}
        shadow-mapSize-width={shadowResolution}
        shadow-mapSize-height={shadowResolution}
        shadow-camera-near={1}
        shadow-camera-far={maxDimension * 5.5}
        shadow-camera-left={-shadowFrustumWidth}
        shadow-camera-right={shadowFrustumWidth}
        shadow-camera-top={shadowFrustumLength}
        shadow-camera-bottom={-shadowFrustumLength}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />

      {/* Hemisphere Light for realistic natural Nordic sky-ground color balance */}
      <hemisphereLight args={['#A8D5BA', '#4B3621', 0.35]} />

      {/* OrbitControls with responsive damping and smooth iPad/iPhone/Android touch gestures */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.07}
        maxPolarAngle={Math.PI / 2 - 0.04} // Prevent camera going underground
        minDistance={2.5}
        maxDistance={maxDimension * 4}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN
        }}
      />

      {/* Ground Lawn Plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow={shadowsEnabled}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedEntityId(null);
        }}
      >
        <planeGeometry args={[widthM, lengthM]} />
        <meshStandardMaterial
          color="#386334" // Deep Nordic meadow green
          roughness={0.88}
          metalness={0.04}
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

      {/* Render all 3D entities with shadow casting & receiving */}
      {plan &&
        activeEntities.map((entity) => (
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

      {/* 3D Floating Companion Harmony Badges */}
      {showCompanionPins &&
        bedHarmonyPins.map(({ entity, harmony, position, plantCount }) => {
          const isSelected = entity.id === selectedEntityId;
          const hasConflicts = harmony.negativePairs > 0;
          const hasSynergy = harmony.positivePairs > 0;

          const badgeTheme = isDarkMode
            ? hasConflicts
              ? 'bg-[#2D1C1D]/95 text-[#FFC4C4] border-[#F2A6A6] shadow-[0_0_12px_rgba(242,166,166,0.5)]'
              : hasSynergy
                ? 'bg-[#1A281C]/95 text-[#CDE6A8] border-[#A7C080] shadow-[0_0_12px_rgba(167,192,128,0.5)]'
                : 'bg-[#1E2820]/95 text-[#D2DACB] border-[#5A735C] shadow-[0_0_8px_rgba(90,115,92,0.4)]'
            : hasConflicts
              ? 'bg-[#C76D3A] text-[#FAF6ED] border-[#D97D4E]'
              : hasSynergy
                ? 'bg-[#3E5A35] text-[#FAF6ED] border-[#5A7C4F]'
                : 'bg-[#2E3C2F]/90 text-[#E7E2D6] border-[#4A5D4B]';

          return (
            <group key={`pin-${entity.id}`} position={position}>
              <Html center distanceFactor={15} zIndexRange={[50, 0]}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEntityId(entity.id);
                  }}
                  title={`${entity.name}: ${harmony.harmonyPercentage}% ${language === 'en' ? 'harmony' : 'koosmõju'}`}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-sans font-semibold tracking-wide backdrop-blur-md border transition-all duration-200 cursor-pointer pointer-events-auto select-none ${badgeTheme} ${
                    isSelected
                      ? (isDarkMode ? 'ring-2 ring-[#C5E0A5] scale-110 shadow-2xl' : 'ring-2 ring-[#FAF6ED] scale-110 shadow-xl')
                      : 'hover:scale-105'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                  <span className="font-serif-display font-semibold">{harmony.harmonyPercentage}%</span>
                  <span className="text-[10px] opacity-80">({plantCount})</span>
                </button>
              </Html>
            </group>
          );
        })}
    </>
  );
};

export const Yard3DCanvas: React.FC<Yard3DCanvasProps> = ({ onBackTo2D }) => {
  const plan = useYardStore((s) => s.plan);
  const selectedEntityId = useYardStore((s) => s.selectedEntityId);
  const solarHour = useYardStore((s) => s.solarHour);
  const setSolarHour = useYardStore((s) => s.setSolarHour);
  const solarSeasonId = useYardStore((s) => s.solarSeasonId);
  const { settings, language } = useGarden();

  const [shadowsEnabled, setShadowsEnabled] = useState(!isSoftwareGl);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<'top' | 'iso' | 'ground'>('iso');
  const [showCompanionPins, setShowCompanionPins] = useState(true);
  const [performanceMode, setPerformanceMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return isSoftwareGl || window.innerWidth < 768;
  });

  // Handle ESC key to exit full viewport mode
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  const selectedEntity = useMemo(() => {
    return plan.entities.find((e) => e.id === selectedEntityId);
  }, [plan.entities, selectedEntityId]);

  // Find active season definition from solar presets
  const activeSeason = useMemo(() => {
    return SOLAR_SEASON_PRESETS.find((s) => s.id === solarSeasonId) || SOLAR_SEASON_PRESETS[0];
  }, [solarSeasonId]);

  // Sun calculation using exact astronomical formulas for Estonia's coordinates
  const { solarAltitude, solarAzimuth, daylightHours } = useMemo(() => {
    const lat = settings.lat || 59.437; // Tallinn baseline
    const sunPos = SolarEngine.calculateSunPosition(lat, activeSeason.dayOfYear, solarHour);
    const dayHours = SolarEngine.calculateDaylightHours(lat, activeSeason.dayOfYear);

    return {
      solarAltitude: Math.max(0, sunPos.altitudeDeg),
      solarAzimuth: sunPos.azimuthDeg,
      daylightHours: dayHours
    };
  }, [settings.lat, activeSeason.dayOfYear, solarHour]);

  // Format solar hour display (e.g. 14:00 or 14:30)
  const hourDisplay = `${Math.floor(solarHour).toString().padStart(2, '0')}:${solarHour % 1 !== 0 ? '30' : '00'}`;

  // Sky color according to season and solar altitude
  const skyBackground = useMemo(() => {
    if (solarAltitude > 35) {
      return activeSeason.id === 'midsummer' ? '#6DBCE2' : '#7CB7D9'; // Vibrant Nordic clear sky
    }
    if (solarAltitude > 20) {
      return activeSeason.id === 'late_summer' ? '#97CAE3' : '#8FC1DC';
    }
    if (solarAltitude > 8) {
      return '#E59866'; // Golden twilight horizon
    }
    if (solarAltitude > 0) {
      return '#A06D60'; // Deep dusk glow
    }
    return '#1F2937'; // Night sky
  }, [solarAltitude, activeSeason.id]);

  const maxDimension = Math.max(plan?.widthM || 20, plan?.lengthM || 30);

  return (
    <div
      className={`transition-all duration-300 ${
        isFullScreen
          ? 'fixed inset-0 z-50 w-screen h-screen bg-[#1E2E20]'
          : 'relative w-full h-[calc(100dvh-130px)] min-h-[520px] bg-[#1E2E20] rounded-xl overflow-hidden shadow-2xl border border-[#C9BFA9]/60'
      }`}
    >
      {/* 3D R3F Canvas */}
      <Canvas
        shadows={shadowsEnabled}
        camera={{
          position: [0, maxDimension * 0.85, maxDimension * 1.15],
          fov: 45,
          near: 0.1,
          far: Math.max(plan?.widthM || 20, plan?.lengthM || 30) * 6
        }}
        gl={{
          powerPreference: performanceMode ? 'default' : 'high-performance',
          antialias: !isSoftwareGl && !performanceMode,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05
        }}
        dpr={
          performanceMode
            ? 1
            : typeof window !== 'undefined'
              ? isSoftwareGl
                ? 1
                : Math.min(window.devicePixelRatio, 1.75)
              : 1
        }
        style={{ background: skyBackground }}
      >
        <Yard3DScene
          solarAltitude={solarAltitude}
          solarAzimuth={solarAzimuth}
          shadowsEnabled={shadowsEnabled}
          performanceMode={performanceMode}
          cameraPreset={cameraPreset}
          showCompanionPins={showCompanionPins}
        />
      </Canvas>

      {/* Upgraded Glassmorphic Bottom Control Overlay */}
      <ControlOverlay
        onBackTo2D={onBackTo2D}
        solarHour={solarHour}
        setSolarHour={setSolarHour}
        hourDisplay={hourDisplay}
        solarAltitude={solarAltitude}
        solarAzimuth={solarAzimuth}
        daylightHours={daylightHours}
        shadowsEnabled={shadowsEnabled}
        onToggleShadows={() => setShadowsEnabled((prev) => !prev)}
        isFullScreen={isFullScreen}
        onToggleFullScreen={() => setIsFullScreen((prev) => !prev)}
        performanceMode={performanceMode}
        onTogglePerformance={() => setPerformanceMode((prev) => !prev)}
        cameraPreset={cameraPreset}
        onSelectCameraPreset={setCameraPreset}
        showCompanionPins={showCompanionPins}
        onToggleCompanionPins={() => setShowCompanionPins((prev) => !prev)}
      />

      {/* Floating Bottom HUD: Selected Entity Details */}
      {selectedEntity && (
        <div className="absolute top-4 right-4 bg-[#182319]/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[#4F6B45] text-xs shadow-2xl pointer-events-auto flex items-center gap-3.5 z-10 max-w-[320px]">
          <div>
            <div className="font-semibold text-[#FAF6ED] font-serif-display flex items-center gap-1.5">
              <span>{selectedEntity.icon || '🌱'}</span>
              <span>{selectedEntity.name}</span>
            </div>
            <div className="text-[11px] text-[#C9BFA9] mt-0.5">
              {selectedEntity.width}m × {selectedEntity.length}m · {language === 'en' ? 'Height' : 'Kõrgus'}:{' '}
              {selectedEntity.heightM}m
              {selectedEntity.elevationM
                ? ` · ${language === 'en' ? 'Elevation' : 'Tõus'}: +${selectedEntity.elevationM}m`
                : ''}
            </div>
          </div>
          <button
            onClick={() => useYardStore.getState().setSelectedEntityId(null)}
            className="text-[#C9BFA9] hover:text-[#FAF6ED] text-xs px-2.5 py-1 rounded-lg bg-[#2D3E2F] hover:bg-[#385A40] transition-colors border border-[#3E5A35]"
          >
            {language === 'en' ? 'Close' : 'Sulge'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Yard3DCanvas;
