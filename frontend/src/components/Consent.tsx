import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { createSession } from '../services/firestoreSession';
import { getDeviceType } from '../utils/device';
import { preloadAmbientMusic } from '../services/ambientMusic';
import { preloadScenarioImages } from '../utils/preload';

// This is the app's actual entry route ("/"). Nothing about the study or the narrative game
// is reachable before this screen — see COPILOT_BUILD_GUIDE.md Rule 5 and Section 8.1.
export const Consent = () => {
  const navigate = useNavigate();
  const consentGiven = useGameStore((state) => state.consentGiven);
  const setSession = useGameStore((state) => state.setSession);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // While the participant reads the consent text, warm the caches so the flow
  // feels instant later: the first scenes' backdrops (the biggest files) and
  // every music track (busy/night are multi-MB and previously downloaded only
  // when first needed mid-session, which made the music seem to "never change").
  useEffect(() => {
    preloadAmbientMusic();
    preloadScenarioImages([1, 2, 3, 4]);
  }, []);

  // Side effects (navigation) belong in an effect, not directly in the render body.
  useEffect(() => {
    if (consentGiven) {
      navigate('/home', { replace: true });
    }
  }, [consentGiven, navigate]);

  if (consentGiven) return null;

  const handleAgree = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const sessionId = await createSession(getDeviceType());
      setSession(sessionId);
      navigate('/home');
    } catch (err) {
      console.error('Failed to create session:', err);
      setError("We couldn't connect just now. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="game-wrapper consent-wrapper">
      <div className="scene-card consent-card">
        <div className="consent-header">
          <span className="consent-eyebrow">Participant Information & Consent</span>
          <h1 className="consent-title">Student Wellbeing Study</h1>
          <p className="consent-subtitle">
            Please read the following carefully before deciding whether to take part.
          </p>
        </div>

        <div className="consent-divider" />

        <div className="consent-content scrollable-content">

          <div className="consent-info-grid">
            <div className="consent-info-block">
              <div>
                <p className="consent-info-label">What the study involves</p>
                <p className="consent-info-text">
                  You'll play through a short interactive narrative about a student's day, make
                  choices along the way, and answer optional reflection questions.
                </p>
              </div>
            </div>

            <div className="consent-info-block">
              <div>
                <p className="consent-info-label">Anonymity & data</p>
                <p className="consent-info-text">
                  No name, email, or identifying information is collected. Your responses are
                  stored only against a randomly generated session ID.
                </p>
              </div>
            </div>

            <div className="consent-info-block">
              <div>
                <p className="consent-info-label">Voluntary participation</p>
                <p className="consent-info-text">
                  Taking part is entirely voluntary. You may stop at any point, for any reason,
                  with no consequences.
                </p>
              </div>
            </div>

            <div className="consent-info-block">
              <div>
                <p className="consent-info-label">Time commitment</p>
                <p className="consent-info-text">
                  Approximately <strong>10–15 minutes</strong> from start to finish.
                </p>
              </div>
            </div>
          </div>

          <div className="consent-divider" />

          <div className="consent-agreement-section">
            <p className="consent-declaration-heading">Declaration of consent</p>
            <p className="consent-paragraph">
              By clicking <em>I Agree & Continue</em>, you confirm
              that you have read and understood the information above, and that you voluntarily
              consent to participate in this study on these terms.
            </p>


            {error && (
              <p className="consent-error" role="alert">
                {error}
              </p>
            )}

            <button
              onClick={handleAgree}
              disabled={submitting}
              className="consent-button"
            >
              {submitting ? 'Starting…' : 'I Agree & Continue'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
