import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { scenarios } from '../data/scenarios';
import { generateInterviewQ1, generateInterviewQ2, generateSummary } from '../services/llmService';
import { savePostGameInterview, saveWellbeingSummary } from '../services/firestoreSession';
import { scoreText } from '../utils/sentiment';

// ── Particles (same pattern as Home / Warning / GroundTruth / Completion) ──
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

// ── In-game snapshot score ────────────────────────────────────────────
// A composite 0-100 score summarising everything that happened in-game:
// story choices + mini-games (wellbeing tendency), response timing
// (hesitation) and NLP sentiment of the participant's written reflections.

interface SnapshotPart { label: string; value: number; note: string; }
interface Snapshot { overall: number; parts: SnapshotPart[]; }

function clampUnit(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function snapshotDescriptor(score: number): string {
  if (score >= 72) return 'Positive in-game signals';
  if (score >= 52) return 'Balanced in-game signals';
  return 'Signals worth reflecting on';
}

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
  const { choices, miniGameWeights, reactionTimes, freeTextAnswers, sessionId, setWellbeingSummary, setPredictedScores } = useGameStore();

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
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

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

    // Fold in mini-game weights (3 games, each a -1/0/+1 outcome) as a small adjustment
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
    const mgSummaryStr = mgParts.length > 0 ? mgParts.join(', ') : 'no mini-games recorded';
    setMiniGameSummary(mgSummaryStr);

    // Decision time is only meaningful for the timed question (Scene 11), where the
    // participant must choose between 2 options or let the countdown run out as a hidden
    // 3rd outcome. Regular scenes' times mostly reflect reading speed, so they are excluded
    // from the AI summary and snapshot (see game_question_set.md Scene 11 for rationale).
    const timedScene = scenarios.find((s) => s.id === 11);
    const timedLimitMs = timedScene?.timedChoice?.limitMs ?? null;
    const decisionTimeMs =
      timedScene && reactionTimes[timedScene.id] !== undefined ? reactionTimes[timedScene.id] : undefined;

    let rtSummaryStr = 'decision timing not recorded';
    if (decisionTimeMs !== undefined && decisionTimeMs !== null) {
      const timedOut = timedLimitMs !== null && decisionTimeMs >= timedLimitMs;
      rtSummaryStr = timedOut
        ? `reached the end of the ${((timedLimitMs ?? decisionTimeMs) / 1000).toFixed(1)}s countdown on the timed decision`
        : `decided in ${(decisionTimeMs / 1000).toFixed(1)}s of the timed decision`;
    }
    setReactionTimeSummary(rtSummaryStr);

    // ── Build the in-game snapshot (choices + mini-games + timing + NLP) ──
    const choiceVals = Object.values(choices);
    const positiveChoices = choiceVals.filter((w) => w >= 1).length;
    const choiceScore = choiceVals.length > 0 ? (positiveChoices / choiceVals.length) * 100 : 50;

    const mgCount = Object.keys(miniGameWeights).length;
    const mgTotal = Object.values(miniGameWeights).reduce((sum: number, w: number) => sum + w, 0);
    const miniScore = mgCount > 0 ? clampUnit((mgTotal + mgCount) / (mgCount * 2)) * 100 : 50;

    // Timing score reflects decisiveness on the only timed question (Scene 11): the faster
    // a decision under the countdown, the stronger the behavioural signal; failing to decide
    // (timeout) is the strongest avoidance signal, so it scores lowest. Regular scenes are
    // excluded because their times mainly reflect reading speed, not hesitation.
    //
    // The thresholds are deliberately loose: Scene 11 asks the participant to read a fairly long
    // prompt plus two options before answering, so a "normal" reading+thinking time lands in a
    // neutral/high band rather than being penalised as slow. Only an actual timeout, or a decision
    // within ~a second of the deadline, reads as a meaningful (negative) decisiveness signal.
    // NOTE: this only reshapes the user-facing score. The raw timeMs / reactionTimeMs values
    // written to Firestore (Game.tsx / firestoreSession.ts) are untouched and remain the exact
    // measured delays used for the offline research analysis.
    let timingScore = 50;
    if (decisionTimeMs !== undefined && decisionTimeMs !== null) {
      const timedOut = timedLimitMs !== null && decisionTimeMs >= timedLimitMs;
      if (timedOut) {
        timingScore = 10;
      } else {
        const fraction = timedLimitMs !== null && timedLimitMs > 0 ? decisionTimeMs / timedLimitMs : 0.5;
        // fraction <= 0.5  (answered in about half the countdown or less)  -> comfortable/quick
        // fraction <= 0.85 (a normal reading + decision time)              -> neutral-high
        // otherwise (decided very close to the deadline)                   -> neutral, slightly low
        timingScore = fraction <= 0.5 ? 85 : fraction <= 0.85 ? 70 : 40;
      }
    }

    const sentimentVals = Object.values(freeTextAnswers)
      .map((t) => scoreText(t))
      .filter((s): s is number => s !== null);
    const avgSentiment =
      sentimentVals.length > 0 ? sentimentVals.reduce((sum, s) => sum + s, 0) / sentimentVals.length : 0;
    const nlpScore = sentimentVals.length > 0 ? clampUnit((avgSentiment + 1) / 2) * 100 : 50;

    const overall = Math.round(
      choiceScore * 0.35 + miniScore * 0.15 + timingScore * 0.25 + nlpScore * 0.25,
    );

    const nlpTone =
      avgSentiment > 0.2
        ? 'positive tone in your written reflections'
        : avgSentiment < -0.2
          ? 'a heavier tone in your written reflections'
          : 'a neutral tone in your written reflections';

    setSnapshot({
      overall,
      parts: [
        { label: 'Choices', value: Math.round(choiceScore), note: cs || 'no choices recorded' },
        { label: 'Mini-games', value: Math.round(miniScore), note: mgSummaryStr },
        { label: 'Timing', value: Math.round(timingScore), note: rtSummaryStr },
        { label: 'NLP', value: Math.round(nlpScore), note: nlpTone },
      ],
    });

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
    const loadingLabel =
      stage === 'loading_summary' ? 'Writing your personal reflection…' : 'Reflecting on your choices…';

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
          <span className="qre-eyebrow">Reflection</span>

          {/* Title */}
          <h1 className="qre-title">Thinking Things Through</h1>

          {/* Decorative rule */}
          <div className="qre-rule" />

          {/* Loading state */}
          <div className="summary-loading" role="status">
            <span className="summary-spinner" aria-hidden="true" />
            <p>{loadingLabel}</p>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'q1' || stage === 'q2') {
    const question = stage === 'q1' ? q1 : q2;
    const answer = stage === 'q1' ? a1 : a2;
    const setAnswer = stage === 'q1' ? setA1 : setA2;
    const onSubmit = stage === 'q1' ? handleSubmitA1 : handleSubmitA2;

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
          <span className="qre-eyebrow">A Couple of Questions</span>

          {/* Title */}
          <h1 className="qre-title">Your Thoughts</h1>

          {/* Decorative rule */}
          <div className="qre-rule" />

          {/* Scrollable content */}
          <div className="qre-content scrollable-content">
            <h2 className="qre-section-title" style={{ marginBottom: '0.75rem' }}>
              {question}
            </h2>
            <p className="qre-section-text" style={{ marginBottom: '1rem' }}>
              There are no right or wrong answers - share whatever feels natural.
            </p>

            <textarea
              className="summary-textarea"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                // Enter = submit (continue); Shift + Enter = new line
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (answer.trim()) onSubmit();
                }
              }}
              rows={6}
              placeholder="Type your thoughts here..."
              aria-label="Your answer"
              required
            />

            <button
              className="qre-button"
              style={{ marginTop: '1.25rem' }}
              onClick={onSubmit}
              disabled={!answer.trim()}
            >
              {answer.trim() ? 'Continue' : 'Please share a few words to continue'}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        <span className="qre-eyebrow">Your Reflection</span>

        {/* Title */}
        <h1 className="qre-title">A Personal Snapshot</h1>

        {/* Decorative rule */}
        <div className="qre-rule" />

        {/* Scrollable content */}
        <div className="qre-content scrollable-content">
          {/* Personalised Gemini summary */}
          <div className="completion-summary-box">
            <p className="completion-summary-text">{summaryText}</p>
          </div>

          {/* In-game snapshot score (choices + mini-games + timing + NLP) */}
          {snapshot && (
            <div className="completion-scores-section">
              <h2 className="qre-section-title" style={{ marginBottom: '0.75rem' }}>
                Your In-Game Snapshot
              </h2>
              <p className="qre-section-text" style={{ marginBottom: '1rem' }}>
                A combined view of everything that happened during your session — your story
                choices, mini-games, response timing, and the tone of your written reflections.
              </p>

              <div className="completion-score-card snapshot-overall-card">
                <span className="completion-score-label">In-Game Wellbeing Score</span>
                <span className="completion-score-value snapshot-overall-value">
                  {snapshot.overall}
                  <span className="completion-score-max">/100</span>
                </span>
                <span className="completion-score-descriptor">
                  {snapshotDescriptor(snapshot.overall)}
                </span>
              </div>

              <div className="completion-score-grid">
                {snapshot.parts.map((part) => (
                  <div key={part.label} className="completion-score-card">
                    <span className="completion-score-label">{part.label}</span>
                    <span className="completion-score-value snapshot-part-value">
                      {part.value}
                      <span className="completion-score-max">/100</span>
                    </span>
                    <span className="snapshot-part-note">{part.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="summary-continue-bar">
            <button className="qre-button" onClick={handleContinue}>
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
