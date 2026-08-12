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
  const completed = useGameStore((state) => state.completed);
  const userId = useGameStore((state) => state.userId);
  const setSession = useGameStore((state) => state.setSession);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A guest (no Google userId) who already finished the assessment is told they've completed it
  // instead of being allowed to replay. Google-account users are unaffected — their completion is
  // enforced by the UID duplicate check on the login screen.
  const returningGuestCompleted = completed && !userId;

  // While the participant reads the consent text, warm the caches so the flow
  // feels instant later: the first scenes' backdrops (the biggest files) and
  // every music track (busy/night are multi-MB and previously downloaded only
  // when first needed mid-session, which made the music seem to "never change").
  useEffect(() => {
    preloadAmbientMusic();
    preloadScenarioImages([1, 2, 3, 4]);
  }, []);

  // Side effects (navigation) belong in an effect, not directly in the render body. A returning
  // completed guest must not be forwarded into the game — they see the "already completed" screen.
  useEffect(() => {
    if (consentGiven && !returningGuestCompleted) {
      navigate('/home', { replace: true });
    }
  }, [consentGiven, returningGuestCompleted, navigate]);

  if (consentGiven && !returningGuestCompleted) return null;

  // Returning guest who has already finished — no consent form, just a polite notice.
  if (returningGuestCompleted) {
    return (
      <div className="game-wrapper consent-wrapper">
        <div className="scene-card consent-card">
          <div className="consent-header">
            <span className="consent-eyebrow">Already Completed</span>
            <h1 className="consent-title">Thanks for playing!</h1>
            <p className="consent-subtitle">
              You have already completed this assessment, so there's nothing more to do.
            </p>
          </div>

          <div className="consent-divider" />

          <div className="consent-content scrollable-content">
            <div className="consent-agreement-section">
              <p className="consent-paragraph">
                You've finished the full study session for this device. Because the assessment can
                only be taken once, you can't play through it again.
              </p>
              <p className="consent-paragraph" style={{ marginTop: '0.75rem' }}>
                Thank you for your time — it's much appreciated.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  stored only against a randomly generated session ID — there is nothing tying
                  them back to you.
                </p>
                <p className="consent-info-text" style={{ marginTop: '0.5rem' }}>
                  Signing in with Google later is optional and exists solely to prevent one
                  account completing the assessment twice. If you choose to, we store only your
                  Google UID — never your name, email, photo, or any other profile data. You may
                  equally continue as a guest, staying completely anonymous.
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
