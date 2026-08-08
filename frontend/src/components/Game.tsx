import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { scenarios } from '../data/scenarios';
import { scenarioImages } from '../data/scenarioImages';
import { wordChoices } from '../data/wordChoices';
import { saveSceneChoice, saveFreeText, saveMiniGame } from '../services/firestoreSession';
import { scoreText } from '../utils/sentiment';
import { getAudioCtxInstance } from './Home';
import { setAmbientScene } from '../services/ambientMusic';
import { preloadScenarioImages } from '../utils/preload';

// Mini-games embedded after specific scenes — see COPILOT_BUILD_GUIDE.md Section 5.
const MINIGAME_AFTER_SCENE: Record<number, number> = {
  6: 1,
  10: 2,
  13: 3,
};

// ── Per-scene visual themes ──────────────────────────────────────────
interface SceneTheme {
  bgImage: string;
  accent: string;
  accentDark: string;
  bubbleBg: string;
  panelBg: string;
  questionBg: string;
  textColor: string;
}

const SCENE_THEMES: Record<number, SceneTheme> = {
  1:  { bgImage: scenarioImages[1], accent: '#ff6b00', accentDark: '#7a3e00', bubbleBg: 'rgba(255,255,255,1)', panelBg: 'rgba(90,30,0,0.78)', questionBg: 'rgba(255,245,210,1)', textColor: '#7a3e00' },
  2:  { bgImage: scenarioImages[2], accent: '#2ecfca', accentDark: '#136b68', bubbleBg: 'rgba(220,252,250,0.93)', panelBg: 'rgba(19,107,104,0.80)', questionBg: 'rgba(230,252,250,0.92)', textColor: '#104a48' },
  3:  { bgImage: scenarioImages[3], accent: '#2d8653', accentDark: '#1a5233', bubbleBg: 'rgba(200,248,222,0.93)', panelBg: 'rgba(26,82,51,0.80)', questionBg: 'rgba(220,250,235,0.92)', textColor: '#0e3620' },
  4:  { bgImage: scenarioImages[4], accent: '#b28cf8', accentDark: '#3d1f70', bubbleBg: 'rgba(228,210,255,0.93)', panelBg: 'rgba(45,20,80,0.88)', questionBg: 'rgba(242,232,255,0.92)', textColor: '#2d1060' },
  5:  { bgImage: scenarioImages[5], accent: '#f9a825', accentDark: '#7a3000', bubbleBg: 'rgba(255,248,185,0.93)', panelBg: 'rgba(100,38,0,0.82)', questionBg: 'rgba(255,252,210,0.92)', textColor: '#5a2200' },
  6:  { bgImage: scenarioImages[6], accent: '#e53935', accentDark: '#6d1f1f', bubbleBg: 'rgba(255,215,215,0.93)', panelBg: 'rgba(100,22,22,0.82)', questionBg: 'rgba(255,240,240,0.92)', textColor: '#5a0808' },
  7:  { bgImage: scenarioImages[7], accent: '#2ecc71', accentDark: '#1a6b3c', bubbleBg: 'rgba(205,255,225,0.93)', panelBg: 'rgba(22,90,50,0.82)', questionBg: 'rgba(228,255,242,0.92)', textColor: '#0e3c22' },
  8:  { bgImage: scenarioImages[8], accent: '#e67e22', accentDark: '#6b3010', bubbleBg: 'rgba(255,238,215,0.93)', panelBg: 'rgba(100,42,12,0.80)', questionBg: 'rgba(255,248,235,0.92)', textColor: '#4a1e00' },
  9:  { bgImage: scenarioImages[9], accent: '#4a90d9', accentDark: '#1a4070', bubbleBg: 'rgba(212,235,255,0.93)', panelBg: 'rgba(20,52,100,0.82)', questionBg: 'rgba(235,248,255,0.92)', textColor: '#0a2548' },
  10: { bgImage: scenarioImages[10], accent: '#e91e63', accentDark: '#6d0030', bubbleBg: 'rgba(255,205,240,0.93)', panelBg: 'rgba(100,0,44,0.84)', questionBg: 'rgba(255,232,250,0.92)', textColor: '#50001e' },
  11: { bgImage: scenarioImages[11], accent: '#f57c00', accentDark: '#5a2e00', bubbleBg: 'rgba(255,230,185,0.93)', panelBg: 'rgba(90,46,0,0.82)', questionBg: 'rgba(255,248,222,0.92)', textColor: '#4a2000' },
  12: { bgImage: scenarioImages[12], accent: '#9c27b0', accentDark: '#3d0050', bubbleBg: 'rgba(232,205,255,0.93)', panelBg: 'rgba(50,0,72,0.84)', questionBg: 'rgba(248,238,255,0.92)', textColor: '#2e0045' },
  13: { bgImage: scenarioImages[13], accent: '#2e7d32', accentDark: '#0a3d0e', bubbleBg: 'rgba(215,255,220,0.93)', panelBg: 'rgba(10,58,18,0.82)', questionBg: 'rgba(240,255,242,0.92)', textColor: '#0a3010' },
  14: { bgImage: scenarioImages[14], accent: '#30cfd0', accentDark: '#0a3060', bubbleBg: 'rgba(195,242,252,0.92)', panelBg: 'rgba(10,48,96,0.88)', questionBg: 'rgba(228,250,255,0.92)', textColor: '#002040' },
  15: { bgImage: scenarioImages[15], accent: '#9b72f8', accentDark: '#1a005a', bubbleBg: 'rgba(205,185,255,0.90)', panelBg: 'rgba(20,0,70,0.88)', questionBg: 'rgba(238,230,255,0.92)', textColor: '#1a0060' },
};

// ── Sound effects ────────────────────────────────────────────────────
function playAnswerHover(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(700, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(950, ctx.currentTime + 0.06);
  gain.gain.setValueAtTime(0.04, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
}

function playAnswerSelect(ctx: AudioContext) {
  [330, 440, 550].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = i === 2 ? 'sine' : 'triangle';
    const t = ctx.currentTime + i * 0.07;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.10, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
    osc.start(t); osc.stop(t + 0.3);
  });
}

function playSceneEntry(ctx: AudioContext, sceneId: number) {
  const base = 200 + (sceneId % 8) * 38;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(base, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(base * 1.6, ctx.currentTime + 0.35);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.055, ctx.currentTime + 0.07);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
}

function playTimerTick(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'square';
  osc.frequency.setValueAtTime(1200, ctx.currentTime);
  gain.gain.setValueAtTime(0.02, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.045);
}

// ── Scene 1 animated alarm/window background ─────────────────────────
const AlarmSceneBg: React.FC = () => (
  <div className="alarm-scene-bg" aria-hidden="true">
    <div className="alarm-rays">
      <div className="alarm-ray alarm-ray-1" />
      <div className="alarm-ray alarm-ray-2" />
      <div className="alarm-ray alarm-ray-3" />
    </div>
    <div className="alarm-window">
      <div className="alarm-outside">
        <div className="alarm-sun" />
        <div className="alarm-sun-glow" />
        <div className="alarm-cloud alarm-cloud-1" />
        <div className="alarm-cloud alarm-cloud-2" />
        <div className="alarm-bird alarm-bird-1" />
        <div className="alarm-bird alarm-bird-2" />
        <div className="alarm-rooftop alarm-rooftop-1" />
        <div className="alarm-rooftop alarm-rooftop-2" />
      </div>
      <div className="alarm-window-bar-h" />
      <div className="alarm-window-bar-v" />
      <div className="alarm-curtain alarm-curtain-l" />
      <div className="alarm-curtain alarm-curtain-r" />
    </div>
    <div className="alarm-bedside" />
    <div className="alarm-clock-wrap">
      <svg viewBox="0 0 90 105" fill="none" xmlns="http://www.w3.org/2000/svg" className="alarm-clock-svg">
        <ellipse cx="18" cy="26" rx="10" ry="8" fill="#c0392b" transform="rotate(-28,18,26)" />
        <ellipse cx="72" cy="26" rx="10" ry="8" fill="#c0392b" transform="rotate(28,72,26)" />
        <ellipse cx="45" cy="19" rx="7" ry="5" fill="#f39c12" />
        <circle cx="45" cy="62" r="30" fill="#e74c3c" />
        <circle cx="45" cy="62" r="24" fill="#fff8f0" />
        <circle cx="45" cy="62" r="2.5" fill="#555" />
        {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
          const r = (deg - 90) * Math.PI / 180;
          const outer = 21; const inner = i % 3 === 0 ? 17 : 18.5;
          return <line key={deg} x1={45 + outer*Math.cos(r)} y1={62 + outer*Math.sin(r)} x2={45 + inner*Math.cos(r)} y2={62 + inner*Math.sin(r)} stroke={i % 3 === 0 ? '#888' : '#ccc'} strokeWidth={i % 3 === 0 ? 1.8 : 1} />;
        })}
        <line x1="45" y1="62" x2="37" y2="52" stroke="#333" strokeWidth="3" strokeLinecap="round" />
        <line x1="45" y1="62" x2="45" y2="44" stroke="#444" strokeWidth="2.2" strokeLinecap="round" />
        <ellipse cx="34" cy="92" rx="6" ry="3.5" fill="#c0392b" />
        <ellipse cx="56" cy="92" rx="6" ry="3.5" fill="#c0392b" />
        <g className="alarm-vibes">
          <line x1="10" y1="15" x2="4"  y2="7"  stroke="#f39c12" strokeWidth="2" strokeLinecap="round" />
          <line x1="18" y1="11" x2="15" y2="3"  stroke="#f39c12" strokeWidth="2" strokeLinecap="round" />
          <line x1="80" y1="15" x2="86" y2="7"  stroke="#f39c12" strokeWidth="2" strokeLinecap="round" />
          <line x1="72" y1="11" x2="75" y2="3"  stroke="#f39c12" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    </div>
    <div className="alarm-mote alarm-mote-1" />
    <div className="alarm-mote alarm-mote-2" />
    <div className="alarm-mote alarm-mote-3" />
    <div className="alarm-mote alarm-mote-4" />
  </div>
);

// ── Main Component ───────────────────────────────────────────────────
export const Game = () => {
  const navigate = useNavigate();
  const { currentScene, sessionId, recordChoice, recordReactionTime, recordText, recordMiniGameWeight, nextScene } =
    useGameStore();

  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [freeText, setFreeText] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [msRemaining, setMsRemaining] = useState<number | null>(null);
  const [miniGameIndex, setMiniGameIndex] = useState<number | null>(null);
  const [entering, setEntering] = useState(true);

  const sceneStartRef = useRef<number>(performance.now());
  const answeredRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastTickSecRef = useRef<number>(-1);

  const sceneIndex = currentScene - 1;
  const scene = scenarios[sceneIndex];
  const theme = SCENE_THEMES[currentScene] ?? SCENE_THEMES[1];
  const miniGameChoiceSet = miniGameIndex !== null ? wordChoices[miniGameIndex] : null;

  const getPlayableAudioCtx = useCallback((): AudioContext | null => {
    const userActivation = (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation;
    const isGestureActive = userActivation?.isActive ?? false;

    // Creating or resuming AudioContext without a gesture is blocked by browsers.
    if (!audioCtxRef.current && !isGestureActive) return null;

    const ctx = getAudioCtxInstance(audioCtxRef);
    if (ctx.state === 'suspended') {
      if (!isGestureActive) return null;
      void ctx.resume().catch(() => undefined);
    }

    return ctx.state === 'running' ? ctx : null;
  }, []);

  // ── Scene entry ───────────────────────────────────────────────────
  useEffect(() => {
    sceneStartRef.current = performance.now();
    answeredRef.current = false;
    setSelectedChoice(null);
    setFreeText('');
    setShowPrompt(false);
    setEntering(true);
    lastTickSecRef.current = -1;

    // Warm the cache for the next scenes while the participant reads this one,
    // so scene transitions are instant instead of waiting on a 1.3-2.4MB file.
    preloadScenarioImages([currentScene + 1, currentScene + 2]);

    const sceneEntryAudio = getPlayableAudioCtx();
    if (sceneEntryAudio) playSceneEntry(sceneEntryAudio, currentScene);
    const fadeTimer = setTimeout(() => setEntering(false), 420);

    if (!scene?.timedChoice) {
      setMsRemaining(null);
      return () => clearTimeout(fadeTimer);
    }

    const { limitMs, timeoutWeight } = scene.timedChoice;
    setMsRemaining(limitMs);

    const intervalId = setInterval(() => {
      const elapsed = performance.now() - sceneStartRef.current;
      const remaining = Math.max(limitMs - elapsed, 0);
      setMsRemaining(remaining);

      const secLeft = Math.ceil(remaining / 1000);
      if (secLeft <= 5 && secLeft !== lastTickSecRef.current && remaining > 0) {
        lastTickSecRef.current = secLeft;
        const timerAudio = getPlayableAudioCtx();
        if (timerAudio) playTimerTick(timerAudio);
      }

      if (remaining <= 0 && !answeredRef.current) {
        answeredRef.current = true;
        clearInterval(intervalId);
        recordReactionTime(currentScene, limitMs);
        recordChoice(currentScene, timeoutWeight);
        if (sessionId) {
          void saveSceneChoice(sessionId, currentScene, { optionId: 'timeout', weight: timeoutWeight, timeMs: limitMs });
        }
        goToNextScene();
      }
    }, 100);

    return () => { clearTimeout(fadeTimer); clearInterval(intervalId); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScene, getPlayableAudioCtx]);

  useEffect(() => {
    if (miniGameIndex === null) return;

    const choiceSet = wordChoices[miniGameIndex];
    if (!choiceSet || !Array.isArray(choiceSet.words) || choiceSet.words.length === 0) {
      // Fail-safe: never leave the player on a blank screen if mini-game data is missing.
      console.error(`Missing or invalid word-choice mini-game data for index ${miniGameIndex}. Skipping mini-game.`);
      setMiniGameIndex(null);
      nextScene();
    }
  }, [miniGameIndex, nextScene]);

  // ── Scene audio ────────────────────────────────────────────────────
  // Continuous ambient mix: each scene crossfades to its mood's track (only
  // re-tuning when the mood type changes, staying put otherwise). Leaving the
  // game eases to the gentle default so the soundtrack never cuts out.
  useEffect(() => {
    setAmbientScene(currentScene);
    return () => setAmbientScene(null);
  }, [currentScene]);

  const handleAnswerHover = useCallback(() => {
    if (answeredRef.current) return;
    const hoverAudio = getPlayableAudioCtx();
    if (hoverAudio) playAnswerHover(hoverAudio);
  }, [getPlayableAudioCtx]);

  if (miniGameIndex !== null && miniGameChoiceSet) {
    return (
      <div
        className={`game-scene minigame-scene${entering ? ' game-scene-entering' : ''}`}
        style={{ '--gs-accent': theme.accent, '--gs-accent-dark': theme.accentDark } as React.CSSProperties}
      >
        {/* Scenario image background with overlay — identical treatment to a regular scene */}
        {theme.bgImage && (
          <div className="scenario-wrapper">
            <img src={theme.bgImage} alt="" className="scenario-bg" />
            <div className="scenario-overlay" />
          </div>
        )}

        {/* Reflection indicator — top left, mirrors the scene-number panel */}
        <div className="scene-ind-panel" style={{ background: theme.panelBg, borderColor: theme.accent } as React.CSSProperties}>
          <span className="scene-ind-num" style={{ color: theme.accent }}>Reflect</span>
        </div>

        {/* Prompt — same smoke-blur question bubble used by every scene */}
        <div className="question-display smoke-bg minigame-question" style={{ '--smoke-color': theme.bubbleBg } as React.CSSProperties & { '--smoke-color': string }}>
          <p className="minigame-eyebrow" style={{ color: theme.accent }}>A quiet moment</p>
          <h2 className="question-title" style={{ color: theme.accent, fontSize: '1.5rem' }}>{miniGameChoiceSet.sceneContext}</h2>
          <p className="question-text" style={{ color: theme.textColor, fontWeight: 'bold' }}>{miniGameChoiceSet.prompt}</p>
        </div>

        {/* Word choices — themed like the answer clouds of a regular scene */}
        <div className="answers-area minigame-answers-area">
          <div className="minigame-word-row">
            {miniGameChoiceSet.words.map((word, idx) => (
              <button
                key={idx}
                className="minigame-word-btn"
                style={{ borderColor: theme.accent, '--acbg': theme.bubbleBg } as React.CSSProperties & { '--acbg': string }}
                onClick={() => {
                  // Determine weight from word selection
                  let weight: -1 | 0 | 1 = 0; // Default to neutral weight
                  switch (miniGameIndex!) {
                    case 1: weight = word.text === 'Rest' ? -1 : 0; break;
                    case 2: weight = word.weight as -1 | 0 | 1; break;
                    case 3: weight = word.weight as -1 | 0 | 1; break;
                    default: weight = 0; // Ensure weight is always assigned
                  }

                  // Save the choice and complete mini-game
                  recordMiniGameWeight(miniGameIndex!, weight);
                  if (sessionId) {
                    void saveMiniGame(sessionId, miniGameIndex!, {
                      word: word.text,
                      weight,
                      decisionTimeMs: 0,
                      sceneContext: miniGameChoiceSet.sceneContext,
                    });
                  }

                  // Complete the mini-game
                  setMiniGameIndex(null);
                  nextScene();
                }}
              >
                <span style={{ color: theme.textColor }}>{word.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!scene) { navigate('/login'); return null; }

  const goToNextScene = () => {
    if (currentScene >= scenarios.length) { navigate('/login'); return; }
    const mg = MINIGAME_AFTER_SCENE[currentScene];
    if (mg) setMiniGameIndex(mg); else nextScene();
  };

  const handleChoice = (optionId: string, weight: number) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    const selectAudio = getPlayableAudioCtx();
    if (selectAudio) playAnswerSelect(selectAudio);
    const elapsed = performance.now() - sceneStartRef.current;
    recordReactionTime(currentScene, elapsed);
    recordChoice(currentScene, weight);
    setSelectedChoice(weight);
    if (sessionId) void saveSceneChoice(sessionId, currentScene, { optionId, weight, timeMs: elapsed });
    if (scene.freeTextPrompt) {
      setShowPrompt(true);
    } else {
      setTimeout(goToNextScene, 280);
    }
  };

  const handleNextScene = () => {
    if (showPrompt && freeText.trim().length > 0) {
      recordText(currentScene, freeText);
      if (sessionId) void saveFreeText(sessionId, currentScene, freeText, scoreText(freeText));
    }
    goToNextScene();
  };

  return (
    <div
      className={`game-scene${entering ? ' game-scene-entering' : ''}`}
      style={{ '--gs-accent': theme.accent, '--gs-accent-dark': theme.accentDark } as React.CSSProperties}
    >
      {/* Scenario image background with overlay */}
      {theme.bgImage && (
        <div className="scenario-wrapper">
          <img
            src={theme.bgImage}
            alt={`Scene ${currentScene} background`}
            className="scenario-bg"
            style={{ '--accent': theme.accent } as React.CSSProperties & { '--accent': string }}
          />
          <div className="scenario-overlay" />
        </div>
      )}

{/* Scene indicator — top left */}
<div className="scene-ind-panel" style={{ background: theme.panelBg, borderColor: theme.accent } as React.CSSProperties}>
  <span className="scene-ind-num" style={{ color: theme.accent }}>Scene {scene.id}</span>
</div>

      {/* Progress dots — top right */}
      <div className="scene-prog-panel" style={{ background: theme.panelBg, borderColor: theme.accent } as React.CSSProperties}>
        {scenarios.map((_, i) => (
          <div
            key={i}
            className={`prog-dot${i < currentScene ? ' prog-dot-done' : ''}${i === currentScene - 1 ? ' prog-dot-current' : ''}`}
            style={i === currentScene - 1 ? { background: theme.accent, boxShadow: `0 0 6px ${theme.accent}` } : i < currentScene ? { background: theme.accent, opacity: 0.45 } : undefined}
          />
        ))}
      </div>

      {/* Question display — top-center, above scene art (shared smoke-bg with answer clouds) */}
      <div className="question-display smoke-bg" style={{ '--smoke-color': theme.bubbleBg } as React.CSSProperties & { '--smoke-color': string }}>
<h2 className="question-title" style={{ color: theme.accent, fontSize: '1.62rem' }}>{scene.title}</h2>
        <p className="question-text" style={{ color: theme.textColor, fontWeight: 'bold' }}>{scene.text}</p>

        {scene.timedChoice && msRemaining !== null && (
          <div className="q-timer-track">
            <div className="q-timer-fill" style={{
              width: `${(msRemaining / scene.timedChoice.limitMs) * 100}%`,
              background: msRemaining < scene.timedChoice.limitMs * 0.3
                ? '#e53935'
                : `linear-gradient(90deg, ${theme.accent}, ${theme.accentDark})`,
            }} />
          </div>
        )}
      </div>

      {/* Answers / free-text */}
      {!showPrompt ? (
        <div className="answers-area">
          <p className="answers-heading" style={{ color: 'rgba(255,255,255,0.82)' }}>How do you respond?</p>
          <div className={`answers-grid answers-count-${scene.choices.length}`}>
            {scene.choices.map((choice, idx) => {
              // Calculate dynamic width based on text length (more variance: 25% - 65%)
              const textLength = choice.text.length;
              const dynamicWidthPct = choice.layout?.width 
                ? Math.min(65, Math.max(25, choice.layout.width))
                : Math.min(65, Math.max(25, 25 + textLength * 0.4));
              
              // Calculate dynamic height based on text length (min 70px, scales with content)
              const estimatedLines = Math.ceil(textLength / 35); // ~35 chars per line
              const dynamicHeight = choice.layout?.height 
                ? choice.layout.height 
                : Math.max(70, estimatedLines * 28 + 40); // min 70px, ~28px per line + padding
              
              // X position: between 10 and 70 with more variance per index
              const baseX = choice.layout?.x 
                ? Math.min(70, Math.max(10, choice.layout.x))
                : 10 + (idx * 14) + (idx % 3 === 0 ? 5 : idx % 2 === 0 ? -3 : 2);
              
              // Y position: between 10 and 50 with more variance per index  
              const baseY = choice.layout?.y 
                ? Math.min(50, Math.max(10, choice.layout.y))
                : 10 + (idx * 9) + (idx % 2 === 0 ? 3 : -2);
              
              const style: React.CSSProperties = {
                background: 'transparent',
                borderColor: theme.accent,
                width: `${dynamicWidthPct}%`,
                minHeight: `${dynamicHeight}px`,
                left: `calc(${baseX}% - 12px)`,
                top: `calc(${baseY}vh - 32px)`,
              } as React.CSSProperties & { '--ac': string; '--acbg': string };
              (style as Record<string, string>)['--ac'] = theme.accent;
              (style as Record<string, string>)['--acbg'] = theme.bubbleBg;
              return (
                <button
                  key={choice.id}
                className={`answer-cloud smoke-bg answer-pos-${idx}${selectedChoice === choice.weight ? ' answer-cloud-selected' : ''}`}
                  style={style}
                  onClick={() => handleChoice(choice.id, choice.weight)}
                  onMouseEnter={handleAnswerHover}
                  disabled={!!answeredRef.current && selectedChoice !== choice.weight}
                >
                  <span className="answer-cloud-text" style={{ color: theme.textColor }}>{choice.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="free-text-overlay" style={{ background: theme.questionBg, borderColor: theme.accent } as React.CSSProperties}>
          <div className="free-text-meta">
            <p className="free-text-optional" style={{ color: theme.textColor }}>Optional</p>
          </div>
          <p className="free-text-label" style={{ color: theme.accentDark }}>{scene.freeTextPrompt}</p>
          <textarea
            className="free-text-area"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            onKeyDown={(e) => {
              // Enter = continue (submit/skip, since it's optional); Shift + Enter = new line
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleNextScene();
              }
            }}
            placeholder="Type your thoughts here…"
            style={{ borderColor: theme.accent, color: theme.textColor } as React.CSSProperties}
          />
          <div className="ft-actions-row">
            <button
              className="ft-continue-btn"
              style={{ background: `linear-gradient(135deg,${theme.accent},${theme.accentDark})` } as React.CSSProperties}
              onClick={handleNextScene}
            >
              Continue →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};