import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

// Guards every route except "/" so the consent screen can never be bypassed via a direct URL
// (COPILOT_BUILD_GUIDE.md Rule 5). Note: only `consentGiven` is required here — no Firestore
// sessionId exists yet during gameplay. The session document is finalized on the login screen
// once the participant selects Guest or Google (see firestoreSession.finalizeSession).
export const RequireConsent = () => {
  const consentGiven = useGameStore((state) => state.consentGiven);

  if (!consentGiven) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
