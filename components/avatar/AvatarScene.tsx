'use client';

import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, OrbitControls } from '@react-three/drei';
import { HumanAvatar } from './HumanAvatar';
import { AvatarFallback } from './AvatarFallback';

export type AvatarState = 'idle' | 'listening' | 'speaking';

interface AvatarSceneProps {
  state: AvatarState;
  currentViseme?: string;
  isSpeaking?: boolean;
  className?: string;
}

function SceneLoader() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3"
          style={{ borderColor: '#00d4ff', borderTopColor: 'transparent' }} />
        <p className="text-sm" style={{ color: '#8892a4' }}>Loading avatar...</p>
      </div>
    </div>
  );
}

export function AvatarScene({ state, currentViseme, isSpeaking, className }: AvatarSceneProps) {
  return (
    <div className={`relative w-full h-full ${className ?? ''}`}>
      <Suspense fallback={<SceneLoader />}>
        <Canvas
          camera={{ position: [0, 0.1, 1.8], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.5]}
          style={{ background: 'transparent' }}
        >
          {/* Lighting rig for photorealistic look */}
          <ambientLight intensity={0.4} color="#d0e8ff" />
          <directionalLight
            position={[2, 4, 3]}
            intensity={1.2}
            color="#fff8f0"
            castShadow
          />
          <directionalLight
            position={[-2, 2, -1]}
            intensity={0.3}
            color="#b0c8ff"
          />
          {/* Rim light from behind for depth */}
          <directionalLight
            position={[0, -1, -3]}
            intensity={0.2}
            color="#00d4ff"
          />

          {/* HDRI environment for PBR reflections */}
          <Environment preset="studio" />

          {/* Ground shadow for believable grounding */}
          <ContactShadows
            position={[0, -1.1, 0]}
            opacity={0.3}
            scale={3}
            blur={2}
            far={2}
            color="#000022"
          />

          <HumanAvatar
            state={state}
            currentViseme={currentViseme}
            isSpeaking={isSpeaking ?? false}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}
