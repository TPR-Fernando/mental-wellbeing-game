import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React from 'react';
import { Consent } from './components/Consent';
import { RequireConsent } from './components/RequireConsent';
import { Home } from './components/Home';
import { Warning } from './components/Warning';
import { Game } from './components/Game';
import { Summary } from './components/Summary';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Consent />} />
        <Route element={<RequireConsent />}>
          <Route path="/home" element={<Home />} />
          <Route path="/warning" element={<Warning />} />
          <Route path="/game" element={<Game />} />
          <Route path="/summary" element={<Summary />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
