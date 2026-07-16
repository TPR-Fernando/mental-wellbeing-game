import React, { useCallback, useEffect, useRef, useState } from 'react';

// "Hold to Focus" response-inhibition mini-game — see COPILOT_BUILD_GUIDE.md Section 5.
// Measures cognitive control under load: player holds an action, gets an unpredictable
// stop cue, and reaction time to that cue is the signal.

const FILL_DURATION_MS = 2200; // time to fill 100% if never released
const CUE_MIN_PCT = 0.45;
const CUE_MAX_PCT = 0.8;

type Phase = 'idle' | 'filling' | 'cued' | 'done';

interface MiniGameProps {
  sceneContext: string;
  onComplete: (result: { reactionTimeMs: number; valid: boolean; sceneContext: string }) => void;
}

export default function MiniGame({ sceneContext, onComplete }: MiniGameProps) {
  const [phase, setPhase] = useState<Phase>('idle'); // drives rendering only
  const [progress, setProgress] = useState(0);

  // Read inside the rAF loop — always current, avoids stale-closure bugs across frames.
  const phaseRef = useRef<Phase>('idle');
  const startTimeRef = useRef<number | null>(null);
  const cueTimeRef = useRef<number | null>(null);
  const cueThresholdRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const setPhaseSynced = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const tick = useCallback(() => {
    const elapsed = performance.now() - (startTimeRef.current ?? 0);
    const pct = Math.min(elapsed / FILL_DURATION_MS, 1);
    setProgress(pct);

    if (phaseRef.current !== 'cued' && pct >= (cueThresholdRef.current ?? 1)) {
      cueTimeRef.current = performance.now();
      setPhaseSynced('cued');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        // Progressive enhancement only — iOS Safari has no Vibration API at all.
        navigator.vibrate(80);
      }
    }
    if (pct < 1 && phaseRef.current !== 'done') {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [setPhaseSynced]);

  const startHold = useCallback(() => {
    if (phaseRef.current !== 'idle') return;
    startTimeRef.current = performance.now();
    cueThresholdRef.current = CUE_MIN_PCT + Math.random() * (CUE_MAX_PCT - CUE_MIN_PCT);
    setPhaseSynced('filling');
    rafRef.current = requestAnimationFrame(tick);
  }, [setPhaseSynced, tick]);

  const release = useCallback(() => {
    if (phaseRef.current === 'idle' || phaseRef.current === 'done') return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const releaseTime = performance.now();

    let reactionTimeMs: number;
    let valid = true;

    if (phaseRef.current === 'cued' && cueTimeRef.current !== null) {
      reactionTimeMs = releaseTime - cueTimeRef.current;
      if (reactionTimeMs > 1000) valid = false; // missed: too slow after the cue
    } else {
      // Released before the cue fired — impatient, invalid trial, still record.
      valid = false;
      reactionTimeMs = -1;
    }

    setPhaseSynced('done');
    onComplete({ reactionTimeMs, valid, sceneContext });
  }, [onComplete, sceneContext, setPhaseSynced]);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const cued = phase === 'cued';

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h2>Take a Moment</h2>
      <p style={{ color: '#555', lineHeight: '1.6' }}>
        Press and hold the circle below. Release it as fast as you can the instant it says STOP.
      </p>

      <div
        onMouseDown={startHold}
        onMouseUp={release}
        onMouseLeave={release}
        onTouchStart={(e) => {
          e.preventDefault();
          startHold();
        }}
        onTouchEnd={release}
        onTouchCancel={release}
        style={{
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          margin: '2rem auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          cursor: phase === 'done' ? 'default' : 'pointer',
          color: '#fff',
          fontWeight: 700,
          fontSize: '1.2rem',
          background: cued
            ? '#e53935'
            : `conic-gradient(#4caf50 ${progress * 360}deg, #ddd ${progress * 360}deg)`,
          transition: cued ? 'background 0.1s linear' : undefined,
        }}
      >
        {phase === 'idle' && 'Hold'}
        {phase === 'filling' && 'Hold…'}
        {cued && 'STOP'}
        {phase === 'done' && 'Done'}
      </div>

      {phase === 'idle' && (
        <p style={{ color: '#888', fontSize: '0.9rem' }}>Press and hold to begin.</p>
      )}
    </div>
  );
}
