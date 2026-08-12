import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

// Guards every route except "/" so the consent screen can never be bypassed via a direct URL
// (COPILOT_BUILD_GUIDE.md Rule 5).
export const RequireConsent = () => {
  const consentGiven = useGameStore((state) => state.consentGiven);
  const sessionId = useGameStore((state) => state.sessionId);
  const completed = useGameStore((state) => state.completed);
  const userId = useGameStore((state) => state.userId);

  // A returning guest who has already completed must not be allowed into the game routes (via a
  // direct URL). RequireConsent redirects them to "/", where Consent shows the "already completed"
  // notice. Google-account users are unaffected (their own duplicate check on /login still applies).
  const returningGuestCompleted = completed && !userId;

  if (!consentGiven || !sessionId || returningGuestCompleted) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
