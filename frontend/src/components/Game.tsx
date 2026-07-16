import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { scenarios } from '../data/scenarios';

export const Game = () => {
  const navigate = useNavigate();
  const { currentScene, recordChoice, recordReactionTime, recordText, nextScene } = useGameStore();
  
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [freeText, setFreeText] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [msRemaining, setMsRemaining] = useState<number | null>(null);

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
        goToNextScene();
      }
    }, 100);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScene]);

  if (!scene) {
    // If we're past scene 15, we should go to summary automatically
    navigate('/summary');
    return null;
  }

  const goToNextScene = () => {
    if (currentScene >= scenarios.length) {
      navigate('/summary');
    } else {
      nextScene();
    }
  };

  const handleChoice = (weight: number) => {
    if (answeredRef.current) return;
    answeredRef.current = true;

    const elapsed = performance.now() - sceneStartRef.current;
    recordReactionTime(currentScene, elapsed);
    recordChoice(currentScene, weight);
    setSelectedChoice(weight);

    if (scene.freeTextPrompt) {
      setShowPrompt(true);
    } else {
      handleNextScene();
    }
  };

  const handleNextScene = () => {
    if (showPrompt && freeText.trim().length > 0) {
      recordText(currentScene, freeText);
    }

    goToNextScene();
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Scene {scene.id}: {scene.title}</h2>
      <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>{scene.text}</p>

      {scene.timedChoice && msRemaining !== null && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ height: '8px', background: '#ddd', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(msRemaining / scene.timedChoice.limitMs) * 100}%`,
                background: msRemaining < scene.timedChoice.limitMs * 0.3 ? '#e53935' : '#43a047',
                transition: 'width 0.1s linear, background 0.2s linear',
              }}
            />
          </div>
        </div>
      )}

      {!showPrompt ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {scene.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => handleChoice(choice.weight)}
              style={{
                padding: '15px',
                textAlign: 'left',
                fontSize: '1rem',
                cursor: 'pointer',
                backgroundColor: '#f5f5f5',
                color: '#000000',
                border: '2px solid #b0b0b0',
                borderRadius: '5px',
                fontWeight: '500'
              }}
            >
              {choice.text}
            </button>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: '20px' }}>
          <p><strong>{scene.freeTextPrompt}</strong></p>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>(Optional)</p>
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            style={{ width: '100%', height: '100px', padding: '10px', marginTop: '10px' }}
            placeholder="Type your thoughts here..."
          />
          <button 
            onClick={handleNextScene}
            style={{ padding: '10px 20px', marginTop: '15px', cursor: 'pointer' }}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
};