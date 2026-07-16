import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { saveGroundTruth } from '../services/firestoreSession';

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

// This screen is deliberately plain/form-like (not story-styled) and explicitly labelled as a
// direct self-report — see COPILOT_BUILD_GUIDE.md Section 7 and 8.2/8.3.
export const GroundTruth = () => {
  const navigate = useNavigate();
  const sessionId = useGameStore((state) => state.sessionId);

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

      await saveGroundTruth(sessionId, { who5, swemwbs });
      navigate('/completion');
    } catch (err) {
      console.error('Failed to save ground-truth questionnaire:', err);
      setError("We couldn't save your answers just now. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '650px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>A Direct Check-In</h1>
      <p style={{ color: '#555', lineHeight: '1.6' }}>
        This part is different from the story. Please answer honestly based on the last two weeks.
      </p>
      <p style={{ color: '#333', fontWeight: 600 }}>
        Section 2 of 2 — {answeredCount} of {totalQuestions} questions answered
      </p>

      <h2 style={{ marginTop: '2rem' }}>Well-Being (WHO-5)</h2>
      {WHO5_ITEMS.map((item, idx) => (
        <fieldset key={idx} style={{ marginBottom: '1.5rem', border: '1px solid #ccc', borderRadius: '6px', padding: '1rem' }}>
          <legend style={{ fontWeight: 600 }}>{item}</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {WHO5_SCALE.map((label, scaleIdx) => (
              <label key={scaleIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  name={`who5-${idx}`}
                  checked={who5Answers[idx] === scaleIdx}
                  onChange={() => setWho5Answers({ ...who5Answers, [idx]: scaleIdx })}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <h2>Well-Being (SWEMWBS)</h2>
      {SWEMWBS_ITEMS.map((item, idx) => (
        <fieldset key={idx} style={{ marginBottom: '1.5rem', border: '1px solid #ccc', borderRadius: '6px', padding: '1rem' }}>
          <legend style={{ fontWeight: 600 }}>{item}</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {SWEMWBS_SCALE.map((label, scaleIdx) => (
              <label key={scaleIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  name={`swemwbs-${idx}`}
                  checked={swemwbsAnswers[idx] === scaleIdx + 1}
                  onChange={() => setSwemwbsAnswers({ ...swemwbsAnswers, [idx]: scaleIdx + 1 })}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      {error && (
        <p style={{ color: '#c62828' }} role="alert">
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || submitting}
        style={{
          padding: '12px 30px',
          fontSize: '1.1rem',
          cursor: !allAnswered || submitting ? 'not-allowed' : 'pointer',
          backgroundColor: '#4caf50',
          color: '#fff',
          border: '2px solid #45a049',
          borderRadius: '5px',
          fontWeight: 500,
          opacity: !allAnswered || submitting ? 0.6 : 1,
        }}
      >
        {submitting ? 'Submitting…' : 'Finish'}
      </button>
    </div>
  );
};
