import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { createSession } from '../services/firestoreSession';
import { getDeviceType } from '../utils/device';

// This is the app's actual entry route ("/"). Nothing about the study or the narrative game
// is reachable before this screen — see COPILOT_BUILD_GUIDE.md Rule 5 and Section 8.1.
export const Consent = () => {
  const navigate = useNavigate();
  const consentGiven = useGameStore((state) => state.consentGiven);
  const setSession = useGameStore((state) => state.setSession);

  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div style={{ padding: '2rem', maxWidth: '650px', margin: '0 auto' }}>
      <h1>Before You Begin</h1>

      <p style={{ lineHeight: '1.6' }}>
        You're being invited to take part in a short research study exploring student well-being
        through an interactive story. Here's what that means in practice:
      </p>

      <ul style={{ lineHeight: '1.8' }}>
        <li>
          <strong>What it is:</strong> You'll play through a short narrative about a student's day,
          make a few choices along the way, and answer some optional reflection questions.
        </li>
        <li>
          <strong>It's anonymous:</strong> We don't collect your name, email, or any other
          identifying information — only your choices and answers, linked to a random session ID.
        </li>
        <li>
          <strong>It's voluntary:</strong> You can stop at any point, for any reason, with no
          consequences.
        </li>
        <li>
          <strong>How long it takes:</strong> Roughly 10–15 minutes, start to finish.
        </li>
      </ul>

      <p style={{ lineHeight: '1.6' }}>
        By continuing, you agree to take part on these terms.
      </p>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', margin: '1.5rem 0' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          style={{ marginTop: '4px' }}
        />
        <span>I have read the above, and I agree and want to continue.</span>
      </label>

      {error && (
        <p style={{ color: '#c62828', lineHeight: '1.6' }} role="alert">
          {error}
        </p>
      )}

      <button
        onClick={handleAgree}
        disabled={!checked || submitting}
        style={{
          padding: '12px 30px',
          fontSize: '1.1rem',
          cursor: !checked || submitting ? 'not-allowed' : 'pointer',
          backgroundColor: '#4caf50',
          color: '#ffffff',
          border: '2px solid #45a049',
          borderRadius: '5px',
          fontWeight: '500',
          opacity: !checked || submitting ? 0.6 : 1,
        }}
      >
        {submitting ? 'Starting…' : 'I Agree and Want to Continue'}
      </button>
    </div>
  );
};
