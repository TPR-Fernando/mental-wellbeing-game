import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

// Guards every route except "/" so the consent screen can never be bypassed via a direct URL
// (COPILOT_BUILD_GUIDE.md Rule 5).
export const RequireConsent = () => {
  const consentGiven = useGameStore((state) => state.consentGiven);
  const sessionId = useGameStore((state) => state.sessionId);

  if (!consentGiven || !sessionId) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
