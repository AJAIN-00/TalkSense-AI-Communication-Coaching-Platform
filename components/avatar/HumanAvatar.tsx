'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { type AvatarState } from './AvatarScene';
import {
  VISEME_NAMES,
  VISEME_LERP_SPEED,
  VISEME_DECAY_SPEED,
  type VisemeName,
} from '@/lib/viseme-map';

// ---------------------------------------------------------------------------
// Public avatar GLB — Avaturn free sample / or fallback procedural face
// We use the Avaturn sample URL which is a realistic human GLB with blend shapes
// If this URL changes, replace with any GLB that has ARKit viseme morph targets
// ---------------------------------------------------------------------------
const AVATAR_URL = '/models/avatar.glb';

interface HumanAvatarProps {
  state: AvatarState;
  currentViseme?: string;
  isSpeaking: boolean;
}

export function HumanAvatar({ state, currentViseme, isSpeaking }: HumanAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);

  // ── Try to load GLB (fails gracefully if no model) ──────────────────────
  let gltf: ReturnType<typeof useGLTF> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    gltf = useGLTF(AVATAR_URL);
  } catch {
    gltf = null;
  }

  // ── Animation state refs (avoids re-renders) ────────────────────────────
  const timeRef = useRef(0);
  const blinkTimerRef = useRef(Math.random() * 4 + 2); // first blink in 2-6s
  const blinkStateRef = useRef(0); // 0=open, 1=closing, 2=opening
  const blinkProgressRef = useRef(0);
  const headNodRef = useRef(0);
  const breathRef = useRef(0);
  const targetVisemeRef = useRef<VisemeName>('viseme_sil');
  const currentWeightsRef = useRef<Record<string, number>>({});
  const eyeGazeDriftRef = useRef({ x: 0, y: 0, tx: 0, ty: 0, timer: 0 });

  // ── Extract meshes that have morph targets ───────────────────────────────
  const morphMeshes = useMemo(() => {
    if (!gltf) return [];
    const meshes: THREE.Mesh[] = [];
    gltf.scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && mesh.morphTargetInfluences && mesh.morphTargetDictionary) {
        meshes.push(mesh);
      }
    });
    return meshes;
  }, [gltf]);

  // ── Helper: set morph target by name across all meshes ──────────────────
  function setMorph(name: string, value: number) {
    for (const mesh of morphMeshes) {
      const idx = mesh.morphTargetDictionary?.[name];
      if (idx !== undefined && mesh.morphTargetInfluences) {
        mesh.morphTargetInfluences[idx] = value;
      }
    }
  }

  function getMorph(name: string): number {
    for (const mesh of morphMeshes) {
      const idx = mesh.morphTargetDictionary?.[name];
      if (idx !== undefined && mesh.morphTargetInfluences) {
        return mesh.morphTargetInfluences[idx];
      }
    }
    return 0;
  }

  // ── Update target viseme when prop changes ───────────────────────────────
  useEffect(() => {
    if (currentViseme && VISEME_NAMES.includes(currentViseme as VisemeName)) {
      targetVisemeRef.current = currentViseme as VisemeName;
    } else if (!isSpeaking) {
      targetVisemeRef.current = 'viseme_sil';
    }
  }, [currentViseme, isSpeaking]);

  // ── Main animation loop ─────────────────────────────────────────────────
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    // ── 1. BREATHING — subtle Y-axis sway ──────────────────────────────────
    breathRef.current = Math.sin(t * 0.8) * 0.004;
    groupRef.current.position.y = breathRef.current - 0.05;

    // ── 2. IDLE HEAD SWAY ──────────────────────────────────────────────────
    const idleSwayX = Math.sin(t * 0.25) * 0.018;
    const idleSwayY = Math.cos(t * 0.18) * 0.012;

    // ── 3. LISTENING HEAD NOD ──────────────────────────────────────────────
    let listenNod = 0;
    let listenTilt = 0;
    if (state === 'listening') {
      listenNod = Math.sin(t * 1.2) * 0.04 + Math.sin(t * 2.1) * 0.015;
      listenTilt = Math.sin(t * 0.7 + 1) * 0.02;
    }

    // ── 4. SPEAKING HEAD MICRO-MOVEMENT ────────────────────────────────────
    let speakMove = 0;
    if (state === 'speaking') {
      speakMove = Math.sin(t * 3.5) * 0.008 + Math.cos(t * 2.3) * 0.005;
    }

    groupRef.current.rotation.x = idleSwayX + listenNod + speakMove;
    groupRef.current.rotation.y = idleSwayY + listenTilt;
    groupRef.current.rotation.z = Math.sin(t * 0.15) * 0.008;

    // ── 5. BLINKING ────────────────────────────────────────────────────────
    blinkTimerRef.current -= delta;

    if (blinkTimerRef.current <= 0 && blinkStateRef.current === 0) {
      blinkStateRef.current = 1; // start closing
      blinkProgressRef.current = 0;
      blinkTimerRef.current = Math.random() * 4 + 2.5; // next blink
    }

    if (blinkStateRef.current === 1) {
      blinkProgressRef.current = Math.min(1, blinkProgressRef.current + delta * 12);
      const bv = blinkProgressRef.current;
      setMorph('eyeBlinkLeft', bv);
      setMorph('eyeBlinkRight', bv);
      if (blinkProgressRef.current >= 1) {
        blinkStateRef.current = 2;
        blinkProgressRef.current = 0;
      }
    } else if (blinkStateRef.current === 2) {
      blinkProgressRef.current = Math.min(1, blinkProgressRef.current + delta * 10);
      const bv = 1 - blinkProgressRef.current;
      setMorph('eyeBlinkLeft', bv);
      setMorph('eyeBlinkRight', bv);
      if (blinkProgressRef.current >= 1) {
        blinkStateRef.current = 0;
        blinkProgressRef.current = 0;
      }
    }

    // ── 6. EYE GAZE DRIFT ──────────────────────────────────────────────────
    const gaze = eyeGazeDriftRef.current;
    gaze.timer -= delta;
    if (gaze.timer <= 0) {
      gaze.tx = (Math.random() - 0.5) * 0.06;
      gaze.ty = (Math.random() - 0.5) * 0.03;
      gaze.timer = Math.random() * 3 + 1.5;
    }
    gaze.x += (gaze.tx - gaze.x) * delta * 2;
    gaze.y += (gaze.ty - gaze.y) * delta * 2;
    setMorph('eyeLookOutLeft', Math.max(0, gaze.x));
    setMorph('eyeLookInLeft', Math.max(0, -gaze.x));
    setMorph('eyeLookOutRight', Math.max(0, -gaze.x));
    setMorph('eyeLookInRight', Math.max(0, gaze.x));
    setMorph('eyeLookUpLeft', Math.max(0, gaze.y));
    setMorph('eyeLookDownLeft', Math.max(0, -gaze.y));
    setMorph('eyeLookUpRight', Math.max(0, gaze.y));
    setMorph('eyeLookDownRight', Math.max(0, -gaze.y));

    // ── 7. LISTENING EXPRESSION ────────────────────────────────────────────
    if (state === 'listening') {
      const attentive = Math.sin(t * 0.5) * 0.05 + 0.08;
      setMorph('browInnerUp', attentive);
    } else {
      setMorph('browInnerUp', getMorph('browInnerUp') * 0.95);
    }

    // ── 8. VISEME LIP SYNC ─────────────────────────────────────────────────
    if (morphMeshes.length > 0) {
      const target = targetVisemeRef.current;

      // Decay all visemes
      for (const name of VISEME_NAMES) {
        const curr = getMorph(name);
        if (curr > 0.001) {
          const next = THREE.MathUtils.lerp(curr, 0, VISEME_DECAY_SPEED);
          setMorph(name, next);
        } else if (curr > 0) {
          setMorph(name, 0);
        }
      }

      // Raise target viseme
      if (isSpeaking && target !== 'viseme_sil') {
        const curr = getMorph(target);
        setMorph(target, THREE.MathUtils.lerp(curr, 0.85, VISEME_LERP_SPEED));
      }
    }
  });

  // ── Render ───────────────────────────────────────────────────────────────
  if (!gltf) {
    // No GLB available — render procedural fallback inline
    return <ProceduralFaceAvatar groupRef={groupRef} state={state} isSpeaking={isSpeaking} />;
  }

  return (
    <group ref={groupRef as React.Ref<THREE.Group>} position={[0, -0.05, 0]}>
      <primitive
        object={gltf.scene}
        scale={1}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
      />
    </group>
  );
}

// ── Procedural 3D face (fallback when no GLB loaded) ──────────────────────
// A stylized but recognizably human face built from Three.js primitives
// with real-time lip/eye animation driven by the same animation loop.
function ProceduralFaceAvatar({
  groupRef,
  state,
  isSpeaking,
}: {
  groupRef: React.RefObject<THREE.Group | null> | React.MutableRefObject<THREE.Group | null>;
  state: AvatarState;
  isSpeaking: boolean;
}) {
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const leftLidRef = useRef<THREE.Mesh>(null);
  const rightLidRef = useRef<THREE.Mesh>(null);

  const timeRef = useRef(0);
  const blinkTimerRef = useRef(3);
  const blinkRef = useRef(0);
  const mouthOpenRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    // Mouth animation
    const targetMouth = isSpeaking ? Math.abs(Math.sin(t * 8)) * 0.06 + 0.01 : 0.005;
    mouthOpenRef.current = THREE.MathUtils.lerp(mouthOpenRef.current, targetMouth, 0.2);

    if (mouthRef.current) {
      mouthRef.current.scale.y = 1 + mouthOpenRef.current * 12;
    }

    // Blink
    blinkTimerRef.current -= delta;
    if (blinkTimerRef.current <= 0) {
      blinkRef.current = 1;
      blinkTimerRef.current = Math.random() * 4 + 2;
    }
    if (blinkRef.current > 0) {
      blinkRef.current = Math.max(0, blinkRef.current - delta * 6);
      const bv = Math.sin(blinkRef.current * Math.PI) * 0.05;
      if (leftLidRef.current) leftLidRef.current.scale.y = 1 + bv * 20;
      if (rightLidRef.current) rightLidRef.current.scale.y = 1 + bv * 20;
    }
  });

  const skinColor = new THREE.Color('#e8b89a');
  const darkColor = new THREE.Color('#2a1506');

  return (
    <group ref={groupRef as React.Ref<THREE.Group>} position={[0, -0.05, 0]}>
      {/* Head */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} metalness={0.05} />
      </mesh>

      {/* Jaw */}
      <mesh position={[0, -0.22, 0.02]}>
        <sphereGeometry args={[0.22, 32, 24]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} metalness={0.05} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, -0.42, -0.02]}>
        <cylinderGeometry args={[0.1, 0.12, 0.18, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>

      {/* Left eye white */}
      <mesh position={[-0.09, 0.06, 0.25]}>
        <sphereGeometry args={[0.042, 16, 16]} />
        <meshStandardMaterial color="white" roughness={0.1} />
      </mesh>
      {/* Left iris */}
      <mesh ref={leftEyeRef} position={[-0.09, 0.06, 0.288]}>
        <circleGeometry args={[0.024, 24]} />
        <meshStandardMaterial color={darkColor} roughness={0.2} />
      </mesh>
      {/* Left lid */}
      <mesh ref={leftLidRef} position={[-0.09, 0.075, 0.285]}>
        <boxGeometry args={[0.085, 0.006, 0.01]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>

      {/* Right eye white */}
      <mesh position={[0.09, 0.06, 0.25]}>
        <sphereGeometry args={[0.042, 16, 16]} />
        <meshStandardMaterial color="white" roughness={0.1} />
      </mesh>
      {/* Right iris */}
      <mesh ref={rightEyeRef} position={[0.09, 0.06, 0.288]}>
        <circleGeometry args={[0.024, 24]} />
        <meshStandardMaterial color={darkColor} roughness={0.2} />
      </mesh>
      {/* Right lid */}
      <mesh ref={rightLidRef} position={[0.09, 0.075, 0.285]}>
        <boxGeometry args={[0.085, 0.006, 0.01]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>

      {/* Nose bridge */}
      <mesh position={[0, 0.01, 0.27]}>
        <capsuleGeometry args={[0.012, 0.06, 4, 8]} />
        <meshStandardMaterial color={new THREE.Color('#d4a882')} roughness={0.7} />
      </mesh>

      {/* Mouth outer */}
      <mesh position={[0, -0.1, 0.268]}>
        <torusGeometry args={[0.04, 0.012, 8, 20, Math.PI]} />
        <meshStandardMaterial color={new THREE.Color('#c47060')} roughness={0.5} />
      </mesh>

      {/* Lips animated */}
      <mesh ref={mouthRef} position={[0, -0.103, 0.276]}>
        <boxGeometry args={[0.07, 0.008, 0.005]} />
        <meshStandardMaterial color={new THREE.Color('#c47060')} roughness={0.4} />
      </mesh>

      {/* Left eyebrow */}
      <mesh position={[-0.09, 0.115, 0.26]} rotation={[0, 0, 0.1]}>
        <capsuleGeometry args={[0.006, 0.055, 4, 8]} />
        <meshStandardMaterial color={darkColor} roughness={0.9} />
      </mesh>
      {/* Right eyebrow */}
      <mesh position={[0.09, 0.115, 0.26]} rotation={[0, 0, -0.1]}>
        <capsuleGeometry args={[0.006, 0.055, 4, 8]} />
        <meshStandardMaterial color={darkColor} roughness={0.9} />
      </mesh>

      {/* Hair */}
      <mesh position={[0, 0.22, -0.04]}>
        <sphereGeometry args={[0.3, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial color={darkColor} roughness={0.95} />
      </mesh>
    </group>
  );
}

// Preload the avatar model
try {
  useGLTF.preload(AVATAR_URL);
} catch {}
