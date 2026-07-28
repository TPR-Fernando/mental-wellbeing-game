import React, { useState, useRef, useCallback } from 'react';
import type { WordOption } from '../data/wordChoices';

interface WordChoiceProps {
  prompt: string;
  words: WordOption[];
  sceneContext: string;
  onComplete: (result: {
    word: string;
    weight: -1 | 0 | 1;
    decisionTimeMs: number;
    sceneContext: string;
  }) => void;
}

export default function WordChoice({ prompt, words, sceneContext, onComplete }: WordChoiceProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const startTimeRef = useRef<number>(performance.now());

  const handleSelect = useCallback(
    (word: string, weight: -1 | 0 | 1) => {
      if (selected) return; // prevent double-tap
      setSelected(word);
      const decisionTimeMs = performance.now() - startTimeRef.current;
      onComplete({ word, weight, decisionTimeMs, sceneContext });
    },
    [selected, sceneContext, onComplete]
  );

  return (
    <div className="wordchoice-wrapper">
      <div className="wordchoice-card">
        <p className="wordchoice-eyebrow">Reflect for a moment</p>
        <p className="wordchoice-prompt">{prompt}</p>
        <div className="wordchoice-words">
          {words.map(({ text, weight }) => (
            <button
              key={text}
              className={`wordchoice-btn${
                selected === text ? ' selected' : selected !== null ? ' dimmed' : ''
              }`}
              onClick={() => handleSelect(text, weight)}
              disabled={selected !== null}
            >
              {text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
