import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { useGameStore } from '../store/gameStore';
import { linkSessionToUser } from '../services/firestoreSession';
import { getAudioCtxInstance, playHoverSound, playStartSound } from './Home';

// ── Particles (same pattern as Warning / Home) ───────────────────────
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

export const GoogleLogin = () => {
  const navigate = useNavigate();
  const { sessionId, setUserId } = useGameStore();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already signed in, auto-forward to /summary
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        if (sessionId) {
          void linkSessionToUser(sessionId, user.uid).catch(() => undefined);
        }
        navigate('/summary', { replace: true });
      }
    });
    return unsub;
  }, [navigate, sessionId, setUserId]);

  const handleSignIn = async () => {
    setError(null);
    setSigningIn(true);
    const ctx = getAudioCtxInstance(audioCtxRef);
    playStartSound(ctx);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const uid = result.user.uid;
      setUserId(uid);

      if (sessionId) {
        await linkSessionToUser(sessionId, uid);
      }
      navigate('/summary', { replace: true });
    } catch (err) {
      const e = err as { code?: string };
      // User closed the popup — not an error worth showing
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
        setError(null);
      } else {
        console.error('Google sign-in failed:', err);
        setError('Sign-in failed. Please try again.');
      }
      setSigningIn(false);
    }
  };

  const handleHover = () => {
    const ctx = getAudioCtxInstance(audioCtxRef);
    playHoverSound(ctx);
  };

  return (
    <div className="game-wrapper warning-wrapper">
      {/* Floating background particles */}
      <div className="warning-particles" aria-hidden="true">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="warning-particle"
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

      <div className="scene-card warning-card google-login-card">
        {/* Eyebrow */}
        <span className="warning-eyebrow">Almost there</span>

        {/* Title */}
        <h1 className="warning-title">Sign In to See Your Results</h1>

        {/* Decorative rule */}
        <div className="warning-rule" />

        {/* Explanation */}
        <div className="warning-section">
          <p className="warning-section-text">
            Your game session is saved. Sign in with Google so your results and
            wellbeing summary can be securely linked to your account.
          </p>
          <p className="warning-section-text">
            We only store your Google UID — no personal information from your
            Google account is saved or shared.
          </p>
        </div>

        {error && (
          <p
            role="alert"
            style={{ color: '#c62828', fontSize: '0.9rem', marginBottom: '1rem' }}
          >
            {error}
          </p>
        )}

        {/* Google sign-in button */}
        <div className="warning-buttons" style={{ flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleSignIn}
            onMouseEnter={handleHover}
            disabled={signingIn}
            className="warning-button warning-continue-button google-signin-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', maxWidth: '280px', width: '100%', justifyContent: 'center' }}
          >
            {/* Google "G" logo */}
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFF" d="M44.5 20H24v8.5h11.7C34.1 33.2 29.6 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l6-6C34.5 6.4 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.4-7.7 19.4-19.4 0-1.3-.1-2.5-.4-3.6z"/>
            </svg>
            {signingIn ? 'Signing in…' : 'Continue with Google'}
          </button>
        </div>
      </div>
    </div>
  );
};
