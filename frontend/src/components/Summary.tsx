import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { scenarios } from '../data/scenarios';
import { generateInterviewQ1, generateInterviewQ2, generateSummary } from '../services/llmService';
import { savePostGameInterview, saveWellbeingSummary } from '../services/firestoreSession';

// Builds a short pattern description for generate_interview_q1 — see COPILOT_BUILD_GUIDE.md
// Section 3 ("leaned toward avoidance in 6/15 scenes, high hesitation on social scenes").
// This is a fixed heuristic, not adaptive to free-text content.
function buildChoiceSummary(choices: Record<number, number>): string {
  const total = scenarios.length;
  const negativeCount = Object.values(choices).filter((w) => w <= -1).length;
  const scene11Weight = choices[11];
  const hesitationNote =
    scene11Weight !== undefined && scene11Weight <= -1
      ? ', with noticeable hesitation on a socially pressured decision'
      : '';
  return `leaned toward avoidance in ${negativeCount}/${total} scenes${hesitationNote}`;
}

type Stage =
  | 'loading_q1'
  | 'q1'
  | 'loading_q2'
  | 'q2'
  | 'loading_summary'
  | 'summary';

export const Summary = () => {
  const navigate = useNavigate();
  const { choices, miniGameWeights, reactionTimes, sessionId, setWellbeingSummary, setPredictedScores } = useGameStore();

  const [stage, setStage] = useState<Stage>('loading_q1');
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [a1, setA1] = useState('');
  const [a2, setA2] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [who5Predicted, setWho5Predicted] = useState(0);
  const [swemwbsPredicted, setSwemwbsPredicted] = useState(0);
  const [choiceSummary, setChoiceSummary] = useState('');
  const [miniGameSummary, setMiniGameSummary] = useState('');
  const [reactionTimeSummary, setReactionTimeSummary] = useState('');

  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Group weights by scale item (e.g. "WHO-5 W3"), since W2, W3 and S7 each appear
    // twice across the 15 scenes and should be averaged into a single item score first,
    // not double-counted (see game_question_set.md Scoring Notes).
    const itemWeights: Record<string, number[]> = {};
    scenarios.forEach((scene) => {
      const choiceWeight = choices[scene.id] || 0;
      if (!itemWeights[scene.scaleItem]) itemWeights[scene.scaleItem] = [];
      itemWeights[scene.scaleItem].push(choiceWeight);
    });

    let who5Raw = 0;
    let swemwbsRaw = 0;
    Object.entries(itemWeights).forEach(([scaleItem, weights]) => {
      const average = weights.reduce((sum, w) => sum + w, 0) / weights.length;
      if (scaleItem.startsWith('WHO-5')) {
        who5Raw += average;
      } else if (scaleItem.startsWith('SWEMWBS')) {
        swemwbsRaw += average;
      }
    });

    // Fold in mini-game weights (-3..+3 range from 3 games × -1/0/+1) as a small adjustment
    // to the AI summary tone. This does NOT go into the real groundTruth questionnaire.
    const miniGameTotal = Object.values(miniGameWeights).reduce((sum: number, w: number) => sum + w, 0);
    who5Raw += miniGameTotal;
    swemwbsRaw += miniGameTotal;

    // Weights range -2..+2 per item (5 items for WHO-5, 7 for SWEMWBS), so who5Raw spans
    // -10..+10 and swemwbsRaw spans -14..+14. After mini-game adjustment, ranges widen but stay bounded.
    // Rescale to match the real instruments' score ranges: WHO-5 is 0-100, SWEMWBS metric is 7-35.
    // Clamp to valid ranges to ensure graceful degradation if mini-games push extremes.
    let who5 = ((who5Raw + 10) / 20) * 100;
    let swemwbs = swemwbsRaw + 21;
    
    // Clamp to valid ranges
    who5 = Math.max(0, Math.min(100, who5));
    swemwbs = Math.max(7, Math.min(35, swemwbs));
    
    setWho5Predicted(who5);
    setSwemwbsPredicted(swemwbs);
    setPredictedScores({ who5Predicted: who5, swemwbsPredicted: swemwbs });

    // ── Build behavioral context strings for Gemini ──────────────────
    const cs = buildChoiceSummary(choices);
    setChoiceSummary(cs);

    const mgLabels: Record<number, string> = { 1: 'rest vs. push (scene 6)', 2: 'social energy (scene 10)', 3: 'pressure response (scene 13)' };
    const mgParts = Object.entries(miniGameWeights).map(([idx, w]) => {
      const label = mgLabels[Number(idx)] ?? `mini-game ${idx}`;
      const tone = w === 1 ? 'positive' : w === -1 ? 'avoidance' : 'neutral';
      return `${label}: ${tone}`;
    });
    setMiniGameSummary(mgParts.length > 0 ? mgParts.join(', ') : 'no mini-games recorded');

    const rtValues = Object.values(reactionTimes);
    if (rtValues.length > 0) {
      const sorted = [...rtValues].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
      const fast = rtValues.filter((t) => t < median * 0.6).length;
      const slow = rtValues.filter((t) => t > median * 1.6).length;
      setReactionTimeSummary(
        `median ${(median / 1000).toFixed(1)}s; ${fast} unusually fast response${fast !== 1 ? 's' : ''}, ${slow} unusually slow`,
      );
    } else {
      setReactionTimeSummary('response timing not recorded');
    }

    if (!sessionId) {
      setStage('summary');
      setSummaryText(
        'Thanks for playing through today\'s story. This is not a clinical assessment, just a reflective snapshot.',
      );
      return;
    }

    (async () => {
      const question1 = await generateInterviewQ1(sessionId, cs);
      setQ1(question1);
      setStage('q1');
    })();
  }, [choices, sessionId]);

  const handleSubmitA1 = async () => {
    if (!sessionId) return;
    setStage('loading_q2');
    const question2 = await generateInterviewQ2(sessionId, q1, a1);
    setQ2(question2);
    setStage('q2');
  };

  const handleSubmitA2 = async () => {
    if (!sessionId) return;
    setStage('loading_summary');
    const summary = await generateSummary(
      sessionId,
      who5Predicted,
      swemwbsPredicted,
      [a1, a2],
      choiceSummary,
      miniGameSummary,
      reactionTimeSummary,
    );
    setSummaryText(summary);
    setWellbeingSummary(summary);

    await savePostGameInterview(sessionId, { q1, a1, q2, a2 });
    await saveWellbeingSummary(sessionId, summary);

    setStage('summary');
  };

  const handleContinue = () => {
    navigate('/questionnaire');
  };

  if (stage === 'loading_q1' || stage === 'loading_q2' || stage === 'loading_summary') {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>Reflecting on your choices…</h2>
      </div>
    );
  }

  if (stage === 'q1' || stage === 'q2') {
    const question = stage === 'q1' ? q1 : q2;
    const answer = stage === 'q1' ? a1 : a2;
    const setAnswer = stage === 'q1' ? setA1 : setA2;
    const onSubmit = stage === 'q1' ? handleSubmitA1 : handleSubmitA2;

    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h2>A Couple of Questions</h2>
        <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>{question}</p>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          style={{ width: '100%', height: '100px', padding: '10px' }}
          placeholder="Type your thoughts here... (optional)"
        />
        <button
          onClick={onSubmit}
          style={{
            padding: '10px 20px',
            marginTop: '15px',
            cursor: 'pointer',
            backgroundColor: '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Your Personalized Reflection</h2>
      <div
        style={{
          backgroundColor: '#e3f2fd',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
          border: '2px solid #2196f3',
        }}
      >
        <p style={{ color: '#000000', fontSize: '1.1rem', lineHeight: '1.6', margin: '0' }}>
          {summaryText}
        </p>
      </div>

      <div
        style={{
          backgroundColor: '#f5f5f5',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
          border: '2px solid #999',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0', color: '#000' }}>Game-Predicted Well-being Scores</h3>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <p style={{ color: '#000', margin: 0 }}>
            <strong>WHO-5:</strong> {Math.round(who5Predicted)}/100
          </p>
          <p style={{ color: '#000', margin: 0 }}>
            <strong>SWEMWBS:</strong> {Math.round(swemwbsPredicted)}/35
          </p>
        </div>
        <p style={{ color: '#555', fontSize: '0.85rem', marginTop: '10px', marginBottom: 0 }}>
          Estimated from your in-game choices and mini-game responses — you'll also answer a direct
          questionnaire next, and both will be shown together at the end.
        </p>
      </div>

      <button
        onClick={handleContinue}
        style={{
          padding: '10px 20px',
          cursor: 'pointer',
          backgroundColor: '#333',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
        }}
      >
        Continue
      </button>
    </div>
  );
};
