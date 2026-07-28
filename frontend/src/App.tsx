import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import React from 'react';
import { Consent } from './components/Consent';
import { RequireConsent } from './components/RequireConsent';
import { Home } from './components/Home';
import { Warning } from './components/Warning';
import { Game } from './components/Game';
import { Summary } from './components/Summary';
import { GroundTruth } from './components/GroundTruth';
import { Completion } from './components/Completion';
import { GoogleLogin } from './components/GoogleLogin';
import { LiquidTrail } from './components/LiquidTrail';
import { SceneThemeProvider, useSceneTheme } from './context/SceneThemeContext';

function App() {
  return (
    <Router>
      <SceneThemeProvider>
        <AppContent />
      </SceneThemeProvider>
    </Router>
  );
}

// Purple color for non-game pages (as hex and rgba)
const NON_GAME_PURPLE = '#9b59b6';

function AppContent() {
  const theme = useSceneTheme();
  const location = useLocation();

  // Determine if current page is a game scene page
  const isGamePage = location.pathname === '/game';

  // Convert hex accent color to rgba string for the bobble balls
  const rgbAccent = React.useMemo(() => {
    // Non-game pages always use purple
    if (!isGamePage) return 'rgba(155, 89, 182, 0.92)';
    
    if (!theme.accent) return `rgba(155, 89, 182, 0.92)`;
    const hex = theme.accent.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.92)`;
  }, [theme.accent, isGamePage]);

  return (
    <>
      <LiquidTrail accentColor={rgbAccent} />
      <Routes>
        <Route path="/" element={<Consent />} />
        <Route element={<RequireConsent />}>
          <Route path="/home" element={<Home />} />
          <Route path="/warning" element={<Warning />} />
          <Route path="/game" element={<Game />} />
          <Route path="/login" element={<GoogleLogin />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/questionnaire" element={<GroundTruth />} />
          <Route path="/completion" element={<Completion />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;