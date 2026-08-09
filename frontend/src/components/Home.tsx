import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { preloadScenarioImages } from '../utils/preload';

// ── Web Audio helpers ────────────────────────────────────────────────
export function getAudioCtxInstance(ref: React.MutableRefObject<AudioContext | null>) {
  if (!ref.current) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ref.current = new AC();
  }
  if (ref.current.state === 'suspended') ref.current.resume();
  return ref.current;
}

export function playHoverSound(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(900, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.07);
  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
}

export function playStartSound(ctx: AudioContext) {
  // Ascending C major arpeggio: C5 E5 G5 C6
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    const t = ctx.currentTime + i * 0.1;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.14, t + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

export function playSelectSound(ctx: AudioContext) {
  // Soft "tick" confirmation tone
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(660, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.06);
  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.14);
}

export function playWelcomeChime(ctx: AudioContext) {
  // Soft G4–C5–E5 chime
  [392, 523.25, 659.25].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    const t = ctx.currentTime + i * 0.2;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.07, t + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc.frequency.setValueAtTime(freq, t);
    osc.start(t);
    osc.stop(t + 0.75);
  });
}

// ── Particles ────────────────────────────────────────────────────────
const PARTICLE_COLORS = ['#7c5cfc', '#5b8fff', '#34d399', '#f59e0b', '#f472b6'];

interface Particle { id: number; x: number; y: number; size: number; duration: number; delay: number; color: string; }

const PARTICLES: Particle[] = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: 10 + Math.random() * 90,
  size: 4 + Math.random() * 7,
  duration: 5 + Math.random() * 7,
  delay: Math.random() * 6,
  color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
}));

// ── Sparkle on click ─────────────────────────────────────────────────
interface Sparkle { id: number; x: number; y: number; color: string; angle: number; }

// ── Component ────────────────────────────────────────────────────────
export const Home = () => {
  const navigate = useNavigate();
  const resetGame = useGameStore((state) => state.resetGame);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<{ raf: number | null }>({ raf: null });
  const chimePlayedRef = useRef(false);

  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [sceneCount, setSceneCount] = useState(0);

  // ── Welcome chime on first pointer interaction ───────────────────
  useEffect(() => {
    const play = () => {
      if (chimePlayedRef.current) return;
      chimePlayedRef.current = true;
      const ctx = getAudioCtxInstance(audioCtxRef);
      playWelcomeChime(ctx);
    };
    window.addEventListener('pointermove', play, { once: true });
    window.addEventListener('keydown', play, { once: true });
    return () => {
      window.removeEventListener('pointermove', play);
      window.removeEventListener('keydown', play);
    };
  }, []);

  // ── Warm the next scenes' backdrops while on this page ───────────
  // Consent already fetched scenes 1-4; this page tops up 5-9 so the
  // first mini-game stretch is already cached when play begins.
  useEffect(() => {
    preloadScenarioImages([5, 6, 7, 8, 9]);
  }, []);

  // ── Scene counter count-up ───────────────────────────────────────
  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const duration = 1000;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setSceneCount(Math.round((1 - Math.pow(1 - p, 3)) * 15));
      if (p < 1) raf = requestAnimationFrame(animate);
    };
    const timer = setTimeout(() => { raf = requestAnimationFrame(animate); }, 600);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, []);

  // ── 3D card tilt ─────────────────────────────────────────────────
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const onMove = (e: MouseEvent) => {
      if (tiltRef.current.raf) cancelAnimationFrame(tiltRef.current.raf);
      tiltRef.current.raf = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
        card.style.transform = `perspective(900px) rotateY(${dx * 7}deg) rotateX(${-dy * 5}deg) translateY(0)`;
      });
    };
    const onLeave = () => {
      if (tiltRef.current.raf) cancelAnimationFrame(tiltRef.current.raf);
      card.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) translateY(0)';
    };

    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
    return () => {
      card.removeEventListener('mousemove', onMove);
      card.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleCtaHover = useCallback(() => {
    const ctx = getAudioCtxInstance(audioCtxRef);
    playHoverSound(ctx);
  }, []);

  const startPlaying = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const ctx = getAudioCtxInstance(audioCtxRef);
    playStartSound(ctx);

    // Sparkle burst from button centre
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setSparkles(
      Array.from({ length: 14 }, (_, i) => ({
        id: Date.now() + i,
        x: cx,
        y: cy,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        angle: (i / 14) * 360,
      }))
    );
    setTimeout(() => setSparkles([]), 700);

    setTimeout(() => {
      resetGame();
      navigate('/warning');
    }, 420);
  }, [resetGame, navigate]);

  return (
    <div className="home-hero">
      {/* Floating background particles */}
      <div className="home-particles" aria-hidden="true">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="home-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.color,
              animationDuration: `${p.duration}s`,
              animationDelay: `${-p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Sparkles on CTA click */}
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="home-sparkle"
          style={{
            left: s.x,
            top: s.y,
            '--sparkle-color': s.color,
            '--sparkle-angle': `${s.angle}deg`,
          } as React.CSSProperties}
          aria-hidden="true"
        />
      ))}

      <div className="home-card" ref={cardRef}>
        {/* Eyebrow */}
        <span className="home-eyebrow">Know Your Mind</span>

        {/* Display title */}
        <h1 className="home-title">
          A Day in{' '}
          <span className="home-title-gradient">Your Life</span>
        </h1>

        {/* Decorative rule */}
        <div className="home-rule" />

        {/* Info chips */}
        <div className="home-chips">
          <span className="home-chip">10–15 minutes</span>
          <span className="home-chip home-chip-counter">{sceneCount} scenes</span>
          <span className="home-chip">Anonymous</span>
        </div>

        {/* Description */}
        <p className="home-description">
          Follow a student through an ordinary day, from a quiet morning to a
          late night. Each scene offers choices. Make the ones that feel most
          natural to you.
        </p>

        {/* CTA */}
        <button
          className="home-cta"
          onClick={startPlaying}
          onMouseEnter={handleCtaHover}
        >
          Begin Your Day
          <span className="cta-arrow">→</span>
        </button>
      </div>
    </div>
  );
};