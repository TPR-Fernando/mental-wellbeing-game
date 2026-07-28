import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React from 'react';
import { Consent } from './components/Consent';
import { RequireConsent } from './components/RequireConsent';
import { Home } from './components/Home';
import { Warning } from './components/Warning';
import { Game } from './components/Game';
import { Summary } from './components/Summary';
import { GroundTruth } from './components/GroundTruth';
import { Completion } from './components/Completion';

function App() {
  return (
    <Router>
      {/* Ambient blobs — persistent across all game pages */}
      <div className="game-blob game-blob-1" aria-hidden="true" />
      <div className="game-blob game-blob-2" aria-hidden="true" />
      <div className="game-blob game-blob-3" aria-hidden="true" />
      <Routes>
        <Route path="/" element={<Consent />} />
        <Route element={<RequireConsent />}>
          <Route path="/home" element={<Home />} />
          <Route path="/warning" element={<Warning />} />
          <Route path="/game" element={<Game />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/questionnaire" element={<GroundTruth />} />
          <Route path="/completion" element={<Completion />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
