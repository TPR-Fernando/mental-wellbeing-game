import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { auth, signOut } from '../firebase';

// ── Particles (same pattern as Home / Warning / GroundTruth) ────────
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

// WHO-5 score descriptor (range 0-100)
function who5Descriptor(score: number): string {
  if (score >= 72) return 'Good well-being';
  if (score >= 52) return 'Moderate well-being';
  return 'Lower well-being';
}

// SWEMWBS score descriptor (range 7-35)
function swemwbsDescriptor(score: number): string {
  if (score >= 28) return 'Flourishing';
  if (score >= 21) return 'Average positive mental health';
  return 'Below average';
}

function averageScores(a: number, b: number): number {
  return (a + b) / 2;
}

// Final screen — no further action is possible from here (no replay), per
// COPILOT_BUILD_GUIDE.md Section 8.4. Not behind RequireConsent's game routes so it stays
// reachable even after localStorage state is cleared, but it only ever shows the summary
// already generated for this session.
export const Completion = () => {
  const wellbeingSummary = useGameStore((state) => state.wellbeingSummary);
  const groundTruthScores = useGameStore((state) => state.groundTruthScores);
  const predictedScores = useGameStore((state) => state.predictedScores);
  const setCompleted = useGameStore((state) => state.setCompleted);

  // The Google login must never be cached between visits (one account = one assessment). Sign out
  // as soon as the participant reaches the final screen so the auth state cannot linger for the
  // next person using this browser. Also mark the session completed so a returning guest is told
  // they've already finished rather than being allowed to replay (Google users are handled by the
  // UID duplicate check on the login screen, so this flag only affects guests).
  useEffect(() => {
    setCompleted();
    void signOut(auth).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="groundTruthWrapper completion-wrapper">
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

      <div className="qre-card completion-card">
        {/* Eyebrow */}
        <span className="qre-eyebrow">Your Results</span>

        {/* Title */}
        <h1 className="qre-title">Thank You for Playing</h1>

        {/* Decorative rule */}
        <div className="qre-rule" />

        <div className="qre-content scrollable-content">
          {/* Personalised Gemini summary */}
        {wellbeingSummary && (
          <div className="completion-summary-box">
            <p className="completion-summary-text">{wellbeingSummary}</p>
          </div>
        )}

        {/* Questionnaire scores */}
        {groundTruthScores && (
          <div className="completion-scores-section">
            <h2 className="qre-section-title" style={{ marginBottom: '0.75rem' }}>
              Questionnaire Scores
            </h2>
            <p className="qre-section-text" style={{ marginBottom: '1rem' }}>
              Based on your direct answers to the WHO-5 and SWEMWBS assessments:
            </p>
            <div className="completion-score-grid">
              {/* WHO-5 score card */}
              <div className="completion-score-card">
                <span className="completion-score-label">WHO-5</span>
                <span className="completion-score-value">
                  {groundTruthScores.who5Score}
                  <span className="completion-score-max">/100</span>
                </span>
                <span className="completion-score-descriptor">
                  {who5Descriptor(groundTruthScores.who5Score)}
                </span>
              </div>

              {/* SWEMWBS score card */}
              <div className="completion-score-card">
                <span className="completion-score-label">SWEMWBS</span>
                <span className="completion-score-value">
                  {groundTruthScores.swemwbsScore}
                  <span className="completion-score-max">/35</span>
                </span>
                <span className="completion-score-descriptor">
                  {swemwbsDescriptor(groundTruthScores.swemwbsScore)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Game-predicted scores, shown alongside the direct questionnaire for comparison */}
        {predictedScores && (
          <div className="completion-scores-section">
            <h2 className="qre-section-title" style={{ marginBottom: '0.75rem' }}>
              Game-Predicted Scores
            </h2>
            <p className="qre-section-text" style={{ marginBottom: '1rem' }}>
              Estimated from your in-game choices and mini-game responses, for comparison with your
              direct answers above:
            </p>
            <div className="completion-score-grid">
              <div className="completion-score-card">
                <span className="completion-score-label">WHO-5 (predicted)</span>
                <span className="completion-score-value">
                  {Math.round(predictedScores.who5Predicted)}
                  <span className="completion-score-max">/100</span>
                </span>
                <span className="completion-score-descriptor">
                  {who5Descriptor(predictedScores.who5Predicted)}
                </span>
              </div>

              <div className="completion-score-card">
                <span className="completion-score-label">SWEMWBS (predicted)</span>
                <span className="completion-score-value">
                  {Math.round(predictedScores.swemwbsPredicted)}
                  <span className="completion-score-max">/35</span>
                </span>
                <span className="completion-score-descriptor">
                  {swemwbsDescriptor(predictedScores.swemwbsPredicted)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Combined score across both sources */}
        {groundTruthScores && predictedScores && (
          <div className="completion-scores-section">
            <h2 className="qre-section-title" style={{ marginBottom: '0.75rem' }}>
              Combined Score
            </h2>
            <p className="qre-section-text" style={{ marginBottom: '1rem' }}>
              A blended view combining your direct questionnaire answers and the game-based estimate:
            </p>
            <div className="completion-score-grid">
              <div className="completion-score-card">
                <span className="completion-score-label">WHO-5 (combined)</span>
                <span className="completion-score-value">
                  {Math.round(averageScores(groundTruthScores.who5Score, predictedScores.who5Predicted))}
                  <span className="completion-score-max">/100</span>
                </span>
                <span className="completion-score-descriptor">
                  {who5Descriptor(
                    averageScores(groundTruthScores.who5Score, predictedScores.who5Predicted),
                  )}
                </span>
              </div>

              <div className="completion-score-card">
                <span className="completion-score-label">SWEMWBS (combined)</span>
                <span className="completion-score-value">
                  {Math.round(averageScores(groundTruthScores.swemwbsScore, predictedScores.swemwbsPredicted))}
                  <span className="completion-score-max">/35</span>
                </span>
                <span className="completion-score-descriptor">
                  {swemwbsDescriptor(
                    averageScores(groundTruthScores.swemwbsScore, predictedScores.swemwbsPredicted),
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Thank-you note */}
        <p className="completion-thankyou">
          That's everything - thank you for taking the time to play through today's story and share
          your reflections with us.
        </p>

        {/* Disclaimer */}
        <div className="completion-disclaimer">
          <p>
            <strong>Important:</strong> This is not a clinical assessment and does not replace
            professional mental health support. If anything felt difficult today, please consider
            reaching out to someone you trust or a qualified professional.
          </p>
          <p style={{ marginTop: '0.5rem' }}>
            <strong>Crisis support:</strong> Samaritans 116 123 &middot; Crisis Text Line: Text
            &ldquo;HELLO&rdquo; to 741741 &middot; Emergency: 911
          </p>
          </div>
        </div>
      </div>
    </div>
  );
};

