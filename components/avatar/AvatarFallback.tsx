'use client';

import { useRef, useEffect } from 'react';

// Mouth shape frames for the 2D fallback avatar
// Each frame is an SVG path approximating a viseme mouth shape
type MouthShape = 'closed' | 'aa' | 'O' | 'I' | 'U' | 'f';

const MOUTH_SHAPES: Record<MouthShape, string> = {
  closed: 'M 30 50 Q 50 54 70 50',
  aa: 'M 25 48 Q 50 68 75 48 Q 50 72 25 48 Z',
  O: 'M 35 46 Q 50 42 65 46 Q 70 58 65 66 Q 50 70 35 66 Q 30 58 35 46 Z',
  I: 'M 33 49 Q 50 52 67 49 Q 67 58 50 60 Q 33 58 33 49 Z',
  U: 'M 32 47 Q 50 44 68 47 Q 65 62 50 64 Q 35 62 32 47 Z',
  f: 'M 30 50 Q 50 55 70 50 Q 65 56 50 58 Q 35 56 30 50 Z',
};

const VISEME_TO_MOUTH: Record<string, MouthShape> = {
  viseme_sil: 'closed',
  viseme_aa: 'aa',
  viseme_O: 'O',
  viseme_U: 'U',
  viseme_I: 'I',
  viseme_E: 'I',
  viseme_FF: 'f',
  viseme_PP: 'closed',
  viseme_DD: 'I',
  viseme_TH: 'I',
  viseme_kk: 'aa',
  viseme_CH: 'I',
  viseme_SS: 'I',
  viseme_nn: 'I',
  viseme_RR: 'O',
};

interface AvatarFallbackProps {
  state: 'idle' | 'listening' | 'speaking';
  currentViseme?: string;
  isSpeaking: boolean;
}

export function AvatarFallback({ state, currentViseme, isSpeaking }: AvatarFallbackProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const blinkRef = useRef(0);
  const blinkTimerRef = useRef(3);
  const mouthOpenRef = useRef(0);
  const lastFrameRef = useRef(0);

  const currentVisemeRef = useRef(currentViseme || 'viseme_sil');
  const isSpeakingRef = useRef(isSpeaking);
  const stateRef = useRef(state);

  useEffect(() => { currentVisemeRef.current = currentViseme || 'viseme_sil'; }, [currentViseme]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function drawFrame(timestamp: number) {
      if (!ctx || !canvas) return;
      const delta = Math.min((timestamp - lastFrameRef.current) / 1000, 0.05);
      lastFrameRef.current = timestamp;
      timeRef.current += delta;

      const t = timeRef.current;
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // Background
      const bg = ctx.createRadialGradient(W / 2, H * 0.4, 10, W / 2, H * 0.4, W * 0.6);
      bg.addColorStop(0, '#1a2a3a');
      bg.addColorStop(1, '#070d1a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H * 0.42;
      const headR = Math.min(W, H) * 0.28;

      // Head tilt based on state
      ctx.save();
      ctx.translate(cx, cy);
      const tiltAngle = stateRef.current === 'listening'
        ? Math.sin(t * 1.2) * 0.04
        : Math.sin(t * 0.25) * 0.015;
      ctx.rotate(tiltAngle);

      // Shadow
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 8;

      // ── Neck ──────────────────────────────────────────────────────────────
      const neckGrad = ctx.createLinearGradient(-headR * 0.2, headR * 0.9, headR * 0.2, headR * 0.9);
      neckGrad.addColorStop(0, '#c8956e');
      neckGrad.addColorStop(0.5, '#e8a87a');
      neckGrad.addColorStop(1, '#c8956e');
      ctx.fillStyle = neckGrad;
      ctx.beginPath();
      ctx.moveTo(-headR * 0.22, headR * 0.85);
      ctx.lineTo(headR * 0.22, headR * 0.85);
      ctx.lineTo(headR * 0.18, headR * 1.5);
      ctx.lineTo(-headR * 0.18, headR * 1.5);
      ctx.closePath();
      ctx.fill();

      // ── Face ──────────────────────────────────────────────────────────────
      const faceGrad = ctx.createRadialGradient(-headR * 0.15, -headR * 0.1, headR * 0.1, 0, 0, headR);
      faceGrad.addColorStop(0, '#f0c8a0');
      faceGrad.addColorStop(0.6, '#e8a87a');
      faceGrad.addColorStop(1, '#c8886a');
      ctx.fillStyle = faceGrad;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.ellipse(0, 0, headR, headR * 1.22, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // ── Hair ──────────────────────────────────────────────────────────────
      ctx.fillStyle = '#1a0a00';
      ctx.beginPath();
      ctx.ellipse(0, -headR * 0.7, headR * 1.05, headR * 0.65, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      // Hair sides
      ctx.beginPath();
      ctx.ellipse(-headR * 0.88, 0, headR * 0.22, headR * 0.7, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(headR * 0.88, 0, headR * 0.22, headR * 0.7, 0.15, 0, Math.PI * 2);
      ctx.fill();

      // ── Eyes ──────────────────────────────────────────────────────────────
      blinkTimerRef.current -= delta;
      if (blinkTimerRef.current <= 0) {
        blinkRef.current = 1;
        blinkTimerRef.current = Math.random() * 4 + 2.5;
      }
      if (blinkRef.current > 0) {
        blinkRef.current = Math.max(0, blinkRef.current - delta * 8);
      }
      const blinkAmount = Math.sin(blinkRef.current * Math.PI);

      const eyePositions = [[-headR * 0.3, -headR * 0.05], [headR * 0.3, -headR * 0.05]];
      for (const [ex, ey] of eyePositions) {
        // Eye white
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(ex, ey, headR * 0.15, headR * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Iris
        const irisGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, headR * 0.08);
        irisGrad.addColorStop(0, '#4a3020');
        irisGrad.addColorStop(0.4, '#3d2515');
        irisGrad.addColorStop(1, '#1a0a00');
        ctx.fillStyle = irisGrad;
        ctx.beginPath();
        ctx.ellipse(ex, ey, headR * 0.085, headR * 0.085, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupil
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(ex, ey, headR * 0.04, headR * 0.04, 0, 0, Math.PI * 2);
        ctx.fill();

        // Catchlight
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.ellipse(ex + headR * 0.03, ey - headR * 0.03, headR * 0.018, headR * 0.018, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyelid (blink)
        const lidH = headR * 0.1 * (1 + blinkAmount * 1.0);
        const lidGrad = ctx.createLinearGradient(ex, ey - headR * 0.12, ex, ey + headR * 0.02);
        lidGrad.addColorStop(0, '#e8a87a');
        lidGrad.addColorStop(1, '#c8886a');
        ctx.fillStyle = lidGrad;
        ctx.beginPath();
        ctx.ellipse(ex, ey - headR * 0.02, headR * 0.155, lidH, 0, Math.PI, Math.PI * 2);
        ctx.fill();

        // Eyelash line
        ctx.strokeStyle = '#1a0a00';
        ctx.lineWidth = headR * 0.025;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.ellipse(ex, ey - headR * 0.02, headR * 0.15, headR * 0.09, 0, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      }

      // ── Eyebrows ──────────────────────────────────────────────────────────
      const browLift = stateRef.current === 'listening' ? Math.sin(t * 0.8) * headR * 0.02 : 0;
      ctx.strokeStyle = '#1a0a00';
      ctx.lineWidth = headR * 0.04;
      ctx.lineCap = 'round';

      // Left brow
      ctx.beginPath();
      ctx.moveTo(-headR * 0.46, -headR * 0.22 - browLift);
      ctx.quadraticCurveTo(-headR * 0.3, -headR * 0.27 - browLift, -headR * 0.14, -headR * 0.22 - browLift * 0.5);
      ctx.stroke();

      // Right brow
      ctx.beginPath();
      ctx.moveTo(headR * 0.14, -headR * 0.22 - browLift * 0.5);
      ctx.quadraticCurveTo(headR * 0.3, -headR * 0.27 - browLift, headR * 0.46, -headR * 0.22 - browLift);
      ctx.stroke();

      // ── Nose ──────────────────────────────────────────────────────────────
      ctx.strokeStyle = 'rgba(160,100,60,0.4)';
      ctx.lineWidth = headR * 0.022;
      ctx.beginPath();
      ctx.moveTo(-headR * 0.07, headR * 0.05);
      ctx.lineTo(-headR * 0.05, headR * 0.18);
      ctx.quadraticCurveTo(0, headR * 0.22, headR * 0.05, headR * 0.18);
      ctx.lineTo(headR * 0.07, headR * 0.05);
      ctx.stroke();

      // Nostrils
      ctx.fillStyle = 'rgba(140,80,40,0.35)';
      ctx.beginPath();
      ctx.ellipse(-headR * 0.085, headR * 0.2, headR * 0.05, headR * 0.03, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(headR * 0.085, headR * 0.2, headR * 0.05, headR * 0.03, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // ── Mouth ─────────────────────────────────────────────────────────────
      const mouthY = headR * 0.42;
      const mouthShape = VISEME_TO_MOUTH[currentVisemeRef.current] || 'closed';

      // Target mouth open amount
      const targetOpen = isSpeakingRef.current
        ? (mouthShape !== 'closed' ? headR * 0.12 : headR * 0.02)
        : 0;
      mouthOpenRef.current += (targetOpen - mouthOpenRef.current) * delta * 8;

      const mo = mouthOpenRef.current;

      if (mo > headR * 0.015) {
        // Open mouth — dark interior
        ctx.fillStyle = '#2a1005';
        ctx.beginPath();
        ctx.ellipse(0, mouthY + mo * 0.3, headR * 0.22, mo, 0, 0, Math.PI * 2);
        ctx.fill();

        // Teeth (upper)
        if (mo > headR * 0.04) {
          ctx.fillStyle = '#f5f0e8';
          ctx.beginPath();
          ctx.ellipse(0, mouthY, headR * 0.18, headR * 0.04, 0, Math.PI, Math.PI * 2);
          ctx.fill();
        }
      }

      // Upper lip
      const lipColor = ctx.createLinearGradient(0, mouthY - headR * 0.06, 0, mouthY + mo);
      lipColor.addColorStop(0, '#d07060');
      lipColor.addColorStop(1, '#b05848');
      ctx.fillStyle = lipColor;

      // Cupid's bow upper lip
      ctx.beginPath();
      ctx.moveTo(-headR * 0.24, mouthY);
      ctx.quadraticCurveTo(-headR * 0.12, mouthY - headR * 0.06, 0, mouthY - headR * 0.01);
      ctx.quadraticCurveTo(headR * 0.12, mouthY - headR * 0.06, headR * 0.24, mouthY);
      ctx.quadraticCurveTo(0, mouthY + mo * 0.2, -headR * 0.24, mouthY);
      ctx.fill();

      // Lower lip
      ctx.fillStyle = '#d07060';
      ctx.beginPath();
      ctx.moveTo(-headR * 0.24, mouthY + mo * 0.1);
      ctx.quadraticCurveTo(0, mouthY + mo + headR * 0.07, headR * 0.24, mouthY + mo * 0.1);
      ctx.quadraticCurveTo(headR * 0.12, mouthY + mo * 0.3, 0, mouthY + mo * 0.25);
      ctx.quadraticCurveTo(-headR * 0.12, mouthY + mo * 0.3, -headR * 0.24, mouthY + mo * 0.1);
      ctx.fill();

      // Lip highlight
      ctx.fillStyle = 'rgba(255,200,180,0.25)';
      ctx.beginPath();
      ctx.ellipse(0, mouthY + mo * 0.5 + headR * 0.045, headR * 0.14, headR * 0.025, 0, 0, Math.PI * 2);
      ctx.fill();

      // ── Cheeks ────────────────────────────────────────────────────────────
      const cheekGrad = ctx.createRadialGradient(-headR * 0.42, headR * 0.18, 0, -headR * 0.42, headR * 0.18, headR * 0.3);
      cheekGrad.addColorStop(0, 'rgba(220,120,100,0.18)');
      cheekGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = cheekGrad;
      ctx.beginPath();
      ctx.ellipse(-headR * 0.42, headR * 0.18, headR * 0.3, headR * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      const cheekGradR = ctx.createRadialGradient(headR * 0.42, headR * 0.18, 0, headR * 0.42, headR * 0.18, headR * 0.3);
      cheekGradR.addColorStop(0, 'rgba(220,120,100,0.18)');
      cheekGradR.addColorStop(1, 'transparent');
      ctx.fillStyle = cheekGradR;
      ctx.beginPath();
      ctx.ellipse(headR * 0.42, headR * 0.18, headR * 0.3, headR * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // ── Name badge ───────────────────────────────────────────────────────
      const badgeY = H * 0.88;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      const bw = 140;
      ctx.roundRect(cx - bw / 2, badgeY - 18, bw, 32, 8);
      ctx.fill();

      ctx.fillStyle = '#00d4ff';
      ctx.font = `bold ${Math.round(headR * 0.22)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('Sofia — AI Coach', cx, badgeY + 4);

      // ── Status indicator ─────────────────────────────────────────────────
      const statusColors: Record<string, string> = {
        idle: '#4a5568',
        listening: '#00d4ff',
        speaking: '#7c3aed',
      };
      const statusText: Record<string, string> = {
        idle: 'Ready',
        listening: 'Listening...',
        speaking: 'Speaking...',
      };
      ctx.fillStyle = statusColors[stateRef.current] || '#4a5568';
      ctx.beginPath();
      ctx.arc(cx - 55, badgeY - 5, 4, 0, Math.PI * 2);
      ctx.fill();

      animRef.current = requestAnimationFrame(drawFrame);
    }

    animRef.current = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={560}
      className="w-full h-full object-contain"
      style={{ borderRadius: '16px' }}
    />
  );
}
