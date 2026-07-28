import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { saveGroundTruth } from '../services/firestoreSession';
import { getAudioCtxInstance, playHoverSound, playSelectSound } from './Home'; // Reuse audio functions from Home

// Standard WHO-5 Well-Being Index items, 6-point scale (0-5).
const WHO5_ITEMS = [
  'I have felt cheerful and in good spirits',
  'I have felt calm and relaxed',
  'I have felt active and vigorous',
  'I woke up feeling fresh and rested',
  'My daily life has been filled with things that interest me',
];
const WHO5_SCALE = [
  'At no time',
  'Some of the time',
  'Less than half of the time',
  'More than half of the time',
  'Most of the time',
  'All of the time',
];

// Standard SWEMWBS (short form) items, 5-point scale (1-5).
const SWEMWBS_ITEMS = [
  "I've been feeling optimistic about the future",
  "I've been feeling useful",
  "I've been feeling relaxed",
  "I've been dealing with problems well",
  "I've been thinking clearly",
  "I've been feeling close to other people",
  "I've been able to make up my own mind about things",
];
const SWEMWBS_SCALE = ['None of the time', 'Rarely', 'Some of the time', 'Often', 'All of the time'];

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

// This screen is deliberately plain/form-like (not story-styled) and explicitly labelled as a
// direct self-report — see COPILOT_BUILD_GUIDE.md Section 7 and 8.2/8.3.
export const GroundTruth = () => {
  const navigate = useNavigate();
  const sessionId = useGameStore((state) => state.sessionId);
  const setGroundTruthScores = useGameStore((state) => state.setGroundTruthScores);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [who5Answers, setWho5Answers] = useState<Record<number, number>>({});
  const [swemwbsAnswers, setSwemwbsAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalQuestions = WHO5_ITEMS.length + SWEMWBS_ITEMS.length;
  const answeredCount = Object.keys(who5Answers).length + Object.keys(swemwbsAnswers).length;
  const allAnswered = answeredCount === totalQuestions;

  const handleSubmit = async () => {
    if (!allAnswered || !sessionId) return;
    setSubmitting(true);
    setError(null);
    try {
      const who5: Record<string, number> = {};
      WHO5_ITEMS.forEach((_, idx) => {
        who5[`item${idx + 1}`] = who5Answers[idx];
      });
      const who5Sum = Object.values(who5Answers).reduce((sum, v) => sum + v, 0);
      who5.totalScore = who5Sum * 4; // WHO-5: sum x 4, range 0-100

      const swemwbs: Record<string, number> = {};
      SWEMWBS_ITEMS.forEach((_, idx) => {
        swemwbs[`item${idx + 1}`] = swemwbsAnswers[idx];
      });
      const swemwbsSum = Object.values(swemwbsAnswers).reduce((sum, v) => sum + v, 0);
      swemwbs.totalScore = swemwbsSum; // raw sum, range 7-35

      // Store scores in gameStore so Completion page can display them
      setGroundTruthScores({ who5Score: who5Sum * 4, swemwbsScore: swemwbsSum });

      await saveGroundTruth(sessionId, { who5, swemwbs });
      navigate('/completion');
    } catch (err) {
      console.error('Failed to save ground-truth questionnaire:', err);
      setError("We couldn't save your answers just now. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleButtonHover = () => {
    const ctx = getAudioCtxInstance(audioCtxRef);
    playHoverSound(ctx);
  };

  const handleOptionSelect = () => {
    const ctx = getAudioCtxInstance(audioCtxRef);
    playSelectSound(ctx);
  };

  return (
    <div className="groundTruthWrapper">
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

      <div className="scene-card qre-card" style={{ marginTop: '1.5rem' }}>
        {/* Eyebrow */}
        <span className="qre-eyebrow">A Direct Check-In</span>
        
        {/* Title */}
        <h1 className="qre-title">Wellbeing Assessment</h1>
        
        {/* Decorative rule */}
        <div className="qre-rule" />
        
        {/* Scrollable content section */}
        <div className="qre-content scrollable-content">
          <div className="qre-section">
            <p className="qre-section-text">
              This part is different from the story. Please answer honestly based on the last two weeks.
            </p>
            <p className="qre-section-text">
              Section 2 of 2 — {answeredCount} of {totalQuestions} questions answered
            </p>
          </div>

          <div className="qre-section">
            <h2 className="qre-section-title">Well-Being (WHO-5)</h2>
            {WHO5_ITEMS.map((item, idx) => (
              <fieldset key={idx} className="qre-question-display" style={{ marginBottom: '0.75rem' }}>
                <legend className="qre-question-title">{item}</legend>
                <div className="qre-answers-area">
                  {WHO5_SCALE.map((label, scaleIdx) => (
                    <label
                      key={scaleIdx}
                      className={`qre-answer-option${who5Answers[idx] === scaleIdx ? ' selected' : ''}`}
                      onClick={handleOptionSelect}
                    >
                      <input
                        type="radio"
                        name={`who5-${idx}`}
                        checked={who5Answers[idx] === scaleIdx}
                        onChange={() => setWho5Answers({ ...who5Answers, [idx]: scaleIdx })}
                      />
                      <span className="qre-radio-custom" aria-hidden="true">
                        <span className="qre-radio-dot" />
                      </span>
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>

          <div className="qre-section">
            <h2 className="qre-section-title">Well-Being (SWEMWBS)</h2>
            {SWEMWBS_ITEMS.map((item, idx) => (
              <fieldset key={idx} className="qre-question-display" style={{ marginBottom: '0.75rem' }}>
                <legend className="qre-question-title">{item}</legend>
                <div className="qre-answers-area">
                  {SWEMWBS_SCALE.map((label, scaleIdx) => (
                    <label
                      key={scaleIdx}
                      className={`qre-answer-option${swemwbsAnswers[idx] === scaleIdx + 1 ? ' selected' : ''}`}
                      onClick={handleOptionSelect}
                    >
                      <input
                        type="radio"
                        name={`swemwbs-${idx}`}
                        checked={swemwbsAnswers[idx] === scaleIdx + 1}
                        onChange={() => setSwemwbsAnswers({ ...swemwbsAnswers, [idx]: scaleIdx + 1 })}
                      />
                      <span className="qre-radio-custom" aria-hidden="true">
                        <span className="qre-radio-dot" />
                      </span>
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </div>

        {error && (
          <p style={{ color: '#c62828' }} role="alert">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          className="qre-button qre-continue-button"
          onMouseEnter={handleButtonHover}
        >
          {submitting ? 'Submitting…' : 'Finish'}
        </button>
      </div>
    </div>
  );
};