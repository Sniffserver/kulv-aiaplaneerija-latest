import React, { useMemo } from 'react';
import { GardenEntity, YardPlan } from '../../types';
import { toThreePosition, toThreeRotationY } from '../../lib/three/coords';

interface Entity3DMeshProps {
  entity: GardenEntity;
  plan: YardPlan;
  isSelected: boolean;
  isHovered: boolean;
  onClick: (e: any) => void;
  onPointerOver: (e: any) => void;
  onPointerOut: (e: any) => void;
}

export const Entity3DMesh: React.FC<Entity3DMeshProps> = ({
  entity,
  plan,
  isSelected,
  isHovered,
  onClick,
  onPointerOver,
  onPointerOut
}) => {
  const [posX, posY, posZ] = useMemo(() => toThreePosition(entity, plan), [entity, plan]);
  const rotY = useMemo(() => toThreeRotationY(entity.rotation), [entity.rotation]);

  const width = Math.max(0.1, entity.width || 1);
  const length = Math.max(0.1, entity.length || 1);
  const heightM = Math.max(0.05, entity.heightM || 0.4);

  const shadowCasting = entity.shadowCasting !== false;

  // Highlight color when selected or hovered
  const highlightEmissive = isSelected ? '#15803d' : isHovered ? '#3b82f6' : '#000000';
  const highlightIntensity = isSelected ? 0.35 : isHovered ? 0.2 : 0;

  // Category-specific rendering
  switch (entity.category) {
    case 'structure': {
      const hasGableRoof = entity.subType === 'dwelling_house' || entity.subType === 'cabin';
      const wallHeight = hasGableRoof ? heightM * 0.65 : heightM;
      const roofHeight = hasGableRoof ? heightM * 0.35 : 0;

      return (
        <group
          position={[posX, posY, posZ]}
          rotation={[0, rotY, 0]}
          onClick={onClick}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
        >
          {/* Walls */}
          <mesh
            position={[0, -heightM / 2 + wallHeight / 2, 0]}
            castShadow={shadowCasting}
            receiveShadow
          >
            <boxGeometry args={[width, wallHeight, length]} />
            <meshStandardMaterial
              color={entity.color || '#F3F4F6'}
              roughness={0.7}
              emissive={highlightEmissive}
              emissiveIntensity={highlightIntensity}
            />
          </mesh>

          {/* Roof (Pitched gable roof for houses/cabins) */}
          {hasGableRoof && (
            <mesh
              position={[0, -heightM / 2 + wallHeight + roofHeight / 2, 0]}
              rotation={[0, 0, 0]}
              castShadow={shadowCasting}
              receiveShadow
            >
              {/* Triangular prism representation: Cylinder with 3 segments */}
              <cylinderGeometry args={[width * 0.55, width * 0.55, length, 3]} />
              <meshStandardMaterial
                color="#8B0000" // Classic Nordic terracotta / dark red roof
                roughness={0.6}
              />
            </mesh>
          )}

          {/* Selection indicator wireframe box */}
          {isSelected && (
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[width + 0.1, heightM + 0.1, length + 0.1]} />
              <meshBasicMaterial color="#22c55e" wireframe transparent opacity={0.6} />
            </mesh>
          )}
        </group>
      );
    }

    case 'bed': {
      const bedHeight = Math.min(0.4, Math.max(0.15, heightM));
      return (
        <group
          position={[posX, (entity.elevationM ?? 0) + bedHeight / 2, posZ]}
          rotation={[0, rotY, 0]}
          onClick={onClick}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
        >
          {/* Bed timber frame */}
          <mesh castShadow={shadowCasting} receiveShadow>
            <boxGeometry args={[width, bedHeight, length]} />
            <meshStandardMaterial
              color={entity.color || '#6B4423'}
              roughness={0.8}
              emissive={highlightEmissive}
              emissiveIntensity={highlightIntensity}
            />
          </mesh>

          {/* Soil top layer */}
          <mesh position={[0, bedHeight * 0.05, 0]} receiveShadow>
            <boxGeometry args={[width * 0.88, bedHeight, length * 0.88]} />
            <meshStandardMaterial color="#3E2723" roughness={0.9} />
          </mesh>

          {/* Selection highlight */}
          {isSelected && (
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[width + 0.06, bedHeight + 0.06, length + 0.06]} />
              <meshBasicMaterial color="#22c55e" wireframe transparent opacity={0.7} />
            </mesh>
          )}
        </group>
      );
    }

    case 'tree': {
      const trunkHeight = entity.botanicalData?.trunkHeightM || Math.min(2.0, heightM * 0.35);
      const canopyRadius = entity.botanicalData?.canopyRadiusM || Math.min(width, length) * 0.5;
      const canopyHeight = heightM - trunkHeight;

      return (
        <group
          position={[posX, 0, posZ]}
          rotation={[0, rotY, 0]}
          onClick={onClick}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
        >
          {/* Trunk */}
          <mesh position={[0, trunkHeight / 2, 0]} castShadow={shadowCasting} receiveShadow>
            <cylinderGeometry args={[0.12, 0.16, trunkHeight, 8]} />
            <meshStandardMaterial color="#5C4033" roughness={0.9} />
          </mesh>

          {/* Foliage Canopy */}
          <mesh
            position={[0, trunkHeight + canopyHeight / 2, 0]}
            castShadow={shadowCasting}
            receiveShadow
          >
            <icosahedronGeometry args={[canopyRadius, 1]} />
            <meshStandardMaterial
              color={entity.color || '#2E7D32'}
              roughness={0.65}
              emissive={highlightEmissive}
              emissiveIntensity={highlightIntensity}
            />
          </mesh>

          {/* Selection ring */}
          {isSelected && (
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[canopyRadius * 0.9, canopyRadius * 1.1, 24]} />
              <meshBasicMaterial color="#22c55e" side={2} />
            </mesh>
          )}
        </group>
      );
    }

    case 'shrub': {
      const shrubRadius = Math.min(width, length) * 0.45;
      return (
        <group
          position={[posX, shrubRadius, posZ]}
          rotation={[0, rotY, 0]}
          onClick={onClick}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
        >
          <mesh castShadow={shadowCasting} receiveShadow>
            <icosahedronGeometry args={[shrubRadius, 1]} />
            <meshStandardMaterial
              color={entity.color || '#43A047'}
              roughness={0.7}
              emissive={highlightEmissive}
              emissiveIntensity={highlightIntensity}
            />
          </mesh>
          {isSelected && (
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[shrubRadius * 1.15, 12, 12]} />
              <meshBasicMaterial color="#22c55e" wireframe transparent opacity={0.6} />
            </mesh>
          )}
        </group>
      );
    }

    case 'hedge': {
      return (
        <group
          position={[posX, posY, posZ]}
          rotation={[0, rotY, 0]}
          onClick={onClick}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
        >
          <mesh castShadow={shadowCasting} receiveShadow>
            <boxGeometry args={[width, heightM, length]} />
            <meshStandardMaterial
              color={entity.color || '#2E5B27'}
              roughness={0.75}
              emissive={highlightEmissive}
              emissiveIntensity={highlightIntensity}
            />
          </mesh>
          {isSelected && (
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[width + 0.05, heightM + 0.05, length + 0.05]} />
              <meshBasicMaterial color="#22c55e" wireframe transparent opacity={0.6} />
            </mesh>
          )}
        </group>
      );
    }

    case 'water': {
      return (
        <group
          position={[posX, 0.02, posZ]}
          rotation={[0, rotY, 0]}
          onClick={onClick}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
        >
          <mesh receiveShadow>
            <boxGeometry args={[width, 0.04, length]} />
            <meshStandardMaterial
              color="#0284C7"
              roughness={0.1}
              metalness={0.1}
              transparent
              opacity={0.88}
              emissive={highlightEmissive}
              emissiveIntensity={highlightIntensity}
            />
          </mesh>
          {isSelected && (
            <mesh position={[0, 0.01, 0]}>
              <boxGeometry args={[width + 0.05, 0.06, length + 0.05]} />
              <meshBasicMaterial color="#22c55e" wireframe transparent opacity={0.7} />
            </mesh>
          )}
        </group>
      );
    }

    case 'path': {
      return (
        <group
          position={[posX, 0.01, posZ]}
          rotation={[0, rotY, 0]}
          onClick={onClick}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
        >
          <mesh receiveShadow>
            <boxGeometry args={[width, 0.02, length]} />
            <meshStandardMaterial
              color={entity.color || '#D1D5DB'}
              roughness={0.9}
              emissive={highlightEmissive}
              emissiveIntensity={highlightIntensity}
            />
          </mesh>
          {isSelected && (
            <mesh position={[0, 0.01, 0]}>
              <boxGeometry args={[width + 0.04, 0.04, length + 0.04]} />
              <meshBasicMaterial color="#22c55e" wireframe transparent opacity={0.6} />
            </mesh>
          )}
        </group>
      );
    }

    default: {
      // General furniture / objects
      return (
        <group
          position={[posX, posY, posZ]}
          rotation={[0, rotY, 0]}
          onClick={onClick}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
        >
          <mesh castShadow={shadowCasting} receiveShadow>
            <boxGeometry args={[width, heightM, length]} />
            <meshStandardMaterial
              color={entity.color || '#6B7280'}
              roughness={0.6}
              emissive={highlightEmissive}
              emissiveIntensity={highlightIntensity}
            />
          </mesh>
          {isSelected && (
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[width + 0.05, heightM + 0.05, length + 0.05]} />
              <meshBasicMaterial color="#22c55e" wireframe transparent opacity={0.6} />
            </mesh>
          )}
        </group>
      );
    }
  }
};
