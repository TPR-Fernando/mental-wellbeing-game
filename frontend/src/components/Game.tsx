import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { scenarios } from '../data/scenarios';
import WordChoice from './WordChoice';
import { wordChoices } from '../data/wordChoices';
import { saveSceneChoice, saveFreeText, saveMiniGame } from '../services/firestoreSession';
import { scoreText } from '../utils/sentiment';

// Mini-games are embedded right after these emotionally loaded scenes, spaced out across
// the narrative rather than back-to-back — see COPILOT_BUILD_GUIDE.md Section 5.
const MINIGAME_AFTER_SCENE: Record<number, number> = {
  6: 1, // after the group conflict scene -> mg_01
  10: 2, // after the assignment-block scene -> mg_02
  13: 3, // after the quiet-worry scene -> mg_03
};

export const Game = () => {
  const navigate = useNavigate();
  const { currentScene, sessionId, recordChoice, recordReactionTime, recordText, recordMiniGameWeight, nextScene } =
    useGameStore();

  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [freeText, setFreeText] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [msRemaining, setMsRemaining] = useState<number | null>(null);
  const [miniGameIndex, setMiniGameIndex] = useState<number | null>(null);

  const sceneStartRef = useRef<number>(performance.now());
  const answeredRef = useRef(false);

  // Scene array is 0-indexed, but our IDs are 1-15
  const sceneIndex = currentScene - 1;
  const scene = scenarios[sceneIndex];

  // Reset per-scene timing state whenever a new scene is shown, and drive the
  // countdown for Scene 11's hesitation mini-game if this scene has one.
  useEffect(() => {
    sceneStartRef.current = performance.now();
    answeredRef.current = false;
    setSelectedChoice(null);
    setFreeText("");
    setShowPrompt(false);

    if (!scene?.timedChoice) {
      setMsRemaining(null);
      return;
    }

    const { limitMs, timeoutWeight } = scene.timedChoice;
    setMsRemaining(limitMs);

    const intervalId = setInterval(() => {
      const elapsed = performance.now() - sceneStartRef.current;
      const remaining = Math.max(limitMs - elapsed, 0);
      setMsRemaining(remaining);

      if (remaining <= 0 && !answeredRef.current) {
        answeredRef.current = true;
        clearInterval(intervalId);
        recordReactionTime(currentScene, limitMs);
        recordChoice(currentScene, timeoutWeight);
        if (sessionId) {
          void saveSceneChoice(sessionId, currentScene, {
            optionId: 'timeout',
            weight: timeoutWeight,
            timeMs: limitMs,
          });
        }
        goToNextScene();
      }
    }, 100);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScene]);

  if (miniGameIndex !== null) {
    const choiceSet = wordChoices[miniGameIndex];
    return (
      <WordChoice
        prompt={choiceSet.prompt}
        words={choiceSet.words}
        sceneContext={choiceSet.sceneContext}
        onComplete={(result) => {
          recordReactionTime(currentScene, result.decisionTimeMs);
          recordChoice(currentScene, result.weight);
          recordMiniGameWeight(miniGameIndex, result.weight);
          if (sessionId) {
            void saveMiniGame(sessionId, miniGameIndex, {
              word: result.word,
              weight: result.weight,
              decisionTimeMs: result.decisionTimeMs,
              sceneContext: result.sceneContext,
            });
          }
          setMiniGameIndex(null);
          nextScene();
        }}
      />
    );
  }

  if (!scene) {
    // If we're past scene 15, we should go to summary automatically
    navigate('/summary');
    return null;
  }

  const goToNextScene = () => {
    if (currentScene >= scenarios.length) {
      navigate('/summary');
      return;
    }

    const miniGameNumber = MINIGAME_AFTER_SCENE[currentScene];
    if (miniGameNumber) {
      setMiniGameIndex(miniGameNumber);
    } else {
      nextScene();
    }
  };

  const handleChoice = (optionId: string, weight: number) => {
    if (answeredRef.current) return;
    answeredRef.current = true;

    const elapsed = performance.now() - sceneStartRef.current;
    recordReactionTime(currentScene, elapsed);
    recordChoice(currentScene, weight);
    setSelectedChoice(weight);

    if (sessionId) {
      void saveSceneChoice(sessionId, currentScene, { optionId, weight, timeMs: elapsed });
    }

    if (scene.freeTextPrompt) {
      setShowPrompt(true);
    } else {
      handleNextScene();
    }
  };

  const handleNextScene = () => {
    if (showPrompt && freeText.trim().length > 0) {
      recordText(currentScene, freeText);
      if (sessionId) {
        void saveFreeText(sessionId, currentScene, freeText, scoreText(freeText));
      }
    }

    goToNextScene();
  };

  return (
    <div className="game-wrapper">
      <div className="scene-card">
        {/* Header: label + progress dots */}
        <div className="scene-header">
          <span className="scene-label">Scene {scene.id} of {scenarios.length}</span>
          <div className="scene-dots">
            {scenarios.map((_, i) => (
              <div key={i} className={`scene-dot${i < currentScene ? ' active' : ''}`} />
            ))}
          </div>
        </div>

        {/* Title */}
        <h2 className="scene-title">{scene.title}</h2>

        {/* Countdown timer for timed scenes */}
        {scene.timedChoice && msRemaining !== null && (
          <div className="timer-track">
            <div
              className="timer-fill"
              style={{
                width: `${(msRemaining / scene.timedChoice.limitMs) * 100}%`,
                background:
                  msRemaining < scene.timedChoice.limitMs * 0.3
                    ? '#e53935'
                    : 'linear-gradient(90deg, #7c5cfc, #5b8fff)',
              }}
            />
          </div>
        )}

        {/* Narrative text */}
        <div className="scene-text-box">
          <p>{scene.text}</p>
        </div>

        {/* Choices or free-text reflection */}
        {!showPrompt ? (
          <>
            <p className="choices-heading">How do you respond?</p>
            <div className="choices-container">
              {scene.choices.map((choice, idx) => (
                <button
                  key={choice.id}
                  className={`choice-bubble${idx % 2 === 1 ? ' right' : ''}`}
                  onClick={() => handleChoice(choice.id, choice.weight)}
                >
                  {choice.text}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="free-text-section">
            <p className="free-text-label">{scene.freeTextPrompt}</p>
            <p className="free-text-optional">Optional — share your thoughts</p>
            <textarea
              className="free-text-area"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="Type your thoughts here…"
            />
            <button className="continue-btn" onClick={handleNextScene}>
              Continue →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};