import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, RoundedBox, ContactShadows, useTexture, Text } from '@react-three/drei';
import * as THREE from 'three';

const CARD_WIDTH = 3.375 * 1.2;
const CARD_HEIGHT = 2.125 * 1.2;
const CARD_THICKNESS = 0.05;

function CardMesh({ methodId, mousePos }) {
  const groupRef = useRef();
  
  // Method mapping to angles
  // official -> 0
  // discounted -> Math.PI
  // trial -> Math.PI * 2
  
  const targetRotationY = methodId === 'official' ? 0 : methodId === 'discounted' ? Math.PI : Math.PI * 2;

  useFrame((state, delta) => {
    // Spring physics for flip
    groupRef.current.rotation.y = THREE.MathUtils.damp(
      groupRef.current.rotation.y,
      targetRotationY,
      4, // lambda (stiffness)
      delta
    );
    
    // Parallax tilt from mouse
    const targetX = mousePos.current.y * 0.2;
    const targetZ = -mousePos.current.x * 0.2;
    
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetX, 5, delta);
    groupRef.current.rotation.z = THREE.MathUtils.damp(groupRef.current.rotation.z, targetZ, 5, delta);
  });

  return (
    <group ref={groupRef}>
      {/* Base Card Geometry */}
      <RoundedBox args={[CARD_WIDTH, CARD_HEIGHT, CARD_THICKNESS]} radius={0.15} smoothness={4}>
        {/* We use a simple material that changes based on the rotation or just rely on multiple cards/faces */}
        {/* Since Box has 6 faces, we can provide an array of materials */}
        
        {/* Right, Left, Top, Bottom faces (edges) */}
        <meshStandardMaterial attach="material-0" color="#333" metalness={0.8} roughness={0.2} />
        <meshStandardMaterial attach="material-1" color="#333" metalness={0.8} roughness={0.2} />
        <meshStandardMaterial attach="material-2" color="#333" metalness={0.8} roughness={0.2} />
        <meshStandardMaterial attach="material-3" color="#333" metalness={0.8} roughness={0.2} />
        
        {/* Front Face (Official / Trial) */}
        {methodId === 'trial' ? (
          <meshPhysicalMaterial 
            attach="material-4"
            transmission={0.9} 
            opacity={1} 
            transparent
            roughness={0.3} 
            thickness={0.5} 
            color="#ffffff"
          />
        ) : (
          <meshStandardMaterial 
            attach="material-4" 
            color="#1a1a1a" 
            metalness={0.9} 
            roughness={0.25}
          />
        )}
        
        {/* Back Face (Discounted) */}
        <meshPhysicalMaterial 
          attach="material-5" 
          color="#ffffff" 
          metalness={0.2} 
          roughness={0.1}
          iridescence={1}
          iridescenceIOR={1.5}
          iridescenceThicknessRange={[100, 400]}
        />
      </RoundedBox>

      {/* Front Face Details */}
      <group position={[0, 0, CARD_THICKNESS / 2 + 0.001]}>
        {methodId !== 'trial' && (
          <>
            {/* Chip */}
            <mesh position={[-1.2, 0.2, 0]}>
              <planeGeometry args={[0.4, 0.3]} />
              <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.3} />
            </mesh>
            <Text position={[0, -0.6, 0]} fontSize={0.2} color="#555" font="/fonts/Vazirmatn-Regular.ttf">
              OFFICIAL ACCESS
            </Text>
          </>
        )}
        {methodId === 'trial' && (
          <Text position={[0, 0, 0]} fontSize={0.3} color="#333" font="/fonts/Vazirmatn-Regular.ttf">
            TRIAL
          </Text>
        )}
      </group>

      {/* Back Face Details (Rotated 180 deg) */}
      <group position={[0, 0, -(CARD_THICKNESS / 2 + 0.001)]} rotation={[0, Math.PI, 0]}>
        <Text position={[0, 0, 0]} fontSize={0.6} color="#fff" font="/fonts/Vazirmatn-Regular.ttf">
          %
        </Text>
        <Text position={[0, -0.6, 0]} fontSize={0.15} color="#666" font="/fonts/Vazirmatn-Regular.ttf">
          DISCOUNTED
        </Text>
      </group>
    </group>
  );
}

export default function ThreeDCard({ methodId }) {
  const mousePos = useRef({ x: 0, y: 0 });

  const handlePointerMove = (e) => {
    // Normalize to -1 to 1
    const x = (e.nativeEvent.offsetX / e.target.clientWidth) * 2 - 1;
    const y = -(e.nativeEvent.offsetY / e.target.clientHeight) * 2 + 1;
    mousePos.current = { x, y };
  };

  const handlePointerLeave = () => {
    mousePos.current = { x: 0, y: 0 };
  };

  return (
    <div style={{ width: '100%', height: '220px', cursor: 'grab' }} onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5], fov: 45 }}
      >
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        
        <Environment preset="city" />
        
        <CardMesh methodId={methodId} mousePos={mousePos} />
        
        <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2} far={4} />
      </Canvas>
    </div>
  );
}
