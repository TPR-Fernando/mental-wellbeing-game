import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, signOut } from '../firebase';
import { useGameStore } from '../store/gameStore';
import { checkUserAlreadyCompleted, finalizeSession } from '../services/firestoreSession';
import { getDeviceType } from '../utils/device';
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
  const { completed, setSession, setUserId, resetSession, currentScene, sceneChoices, freeTextAnswers, freeTextSentiments, miniGames } = useGameStore();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [startingGuest, setStartingGuest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Builds the full local gameplay history ready for the one-shot Firestore write.
  const buildFreeTexts = (): Record<number, { text: string; sentimentScore: number | null }> => {
    const freeTexts: Record<number, { text: string; sentimentScore: number | null }> = {};
    Object.entries(freeTextAnswers).forEach(([scene, text]) => {
      const index = Number(scene);
      freeTexts[index] = { text, sentimentScore: freeTextSentiments[index] ?? null };
    });
    return freeTexts;
  };

  // Defensive guard: if we land here with a stale finished session (e.g. browser Back from
  // /completion), reset to a fresh state and send the participant back to consent so a guest
  // can never write into an already-completed session (which would overwrite its data).
  useEffect(() => {
    if (completed) {
      resetSession();
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed, resetSession, navigate]);

  // Note: there is deliberately no onAuthStateChanged auto-forward. The Google login is never
  // cached across visits (session-only persistence + sign-out on the final screen), so every
  // participant must explicitly sign in each time. One account may complete the assessment only
  // once — after signing in we check whether this account already did.

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

      // Block accounts that have already completed the assessment — a second attempt must not
      // create a duplicate record. Queries Firestore directly; rules only allow reads when
      // the session's userId matches the caller's auth.uid.
      let alreadyCompleted = false;
      try {
        alreadyCompleted = await checkUserAlreadyCompleted(uid);
      } catch (checkErr) {
        console.error('Duplicate-attempt check failed:', checkErr);
        await signOut(auth);
        setError("We couldn't verify your account right now. Please try again.");
        setSigningIn(false);
        return;
      }

      if (alreadyCompleted) {
        // Deliberately generic — never references "this Google account".
        await signOut(auth);
        setError('You have already taken this assessment.');
        setSigningIn(false);
        return;
      }

      // This is the moment the participant chose Google: commit ALL the locally-recorded
      // gameplay data to a brand-new Firestore session owned by this user (fresh sessionId,
      // never reusing/overwriting anything). Then the summary flow writes on top of it.
      const freshSessionId = await finalizeSession({
        deviceType: getDeviceType(),
        userId: uid,
        currentScene,
        sceneChoices,
        freeTexts: buildFreeTexts(),
        miniGames,
      });
      setSession(freshSessionId);
      navigate('/summary', { replace: true });
    } catch (err) {
      const e = err as { code?: string };
      // User closed the popup — not an error worth showing
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
        setError(null);
      } else if (e.code === 'permission-denied' || e.code === 'storage/permission-denied') {
        // A Firestore rules denial during the session creation (finalizeSession).
        // This is NOT a Google auth failure — name it clearly so it isn't misread as a sign-in
        // problem (e.g. by someone debugging `firestore.rules`).
        console.error('Session write denied by Firestore rules:', err);
        setError("We couldn't save your session to this account due to a permissions error. Please try again or contact the study team.");
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

  // Guest path: the session is finalized RIGHT HERE, when the participant chooses guest, with a
  // brand-new anonymous sessionId (no userId) and the full locally-recorded gameplay data. Nothing
  // was written to Firestore during gameplay. The only thing skipped vs. Google is the UID-based
  // duplicate-prevention check (which requires an authenticated account) — a guest stays fully
  // anonymous.
  const handleGuest = async () => {
    setError(null);
    setStartingGuest(true);
    const ctx = getAudioCtxInstance(audioCtxRef);
    playStartSound(ctx);
    try {
      const freshSessionId = await finalizeSession({
        deviceType: getDeviceType(),
        userId: null,
        currentScene,
        sceneChoices,
        freeTexts: buildFreeTexts(),
        miniGames,
      });
      setSession(freshSessionId);
      navigate('/summary', { replace: true });
    } catch (err) {
      console.error('Failed to finalize guest session:', err);
      setError("We couldn't save your session right now. Please check your connection and try again.");
      setStartingGuest(false);
    }
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
        <h1 className="warning-title">Your Results Are Ready</h1>

        {/* Decorative rule */}
        <div className="warning-rule" />

        {/* Explanation — inside .warning-content so it scrolls while the buttons stay visible */}
        <div className="warning-content">
          <div className="warning-section">
            <p className="warning-section-text">
              This assessment is fully anonymous - your responses are stored against a random
              session ID only, with no personal data.
            </p>
            <p className="warning-section-text">
              Signing in with Google only prevents one account taking it twice; we store just your
              Google UID and nothing else. Prefer not to? Use <strong>Continue as Guest</strong> -
              you stay just as anonymous.
            </p>
          </div>
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
        <div className="warning-buttons" style={{ flexDirection: 'column', alignItems: 'center', gap: '0.9rem' }}>
          <button
            onClick={handleSignIn}
            onMouseEnter={handleHover}
            disabled={signingIn}
            className="warning-button warning-continue-button google-signin-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', maxWidth: '280px', width: '100%', justifyContent: 'center' }}
          >

            {signingIn ? 'Signing in…' : 'Continue with Google'}
          </button>

          {/* Guest sign-in — secondary option, same size as the Google button */}
          <button
            onClick={handleGuest}
            onMouseEnter={handleHover}
            disabled={startingGuest}
            className="warning-button warning-back-button google-guest-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '280px', width: '100%', justifyContent: 'center' }}
          >
            {startingGuest ? 'Loading your results…' : 'Continue as Guest'}
          </button>
        </div>
      </div>
    </div>
  );
};
