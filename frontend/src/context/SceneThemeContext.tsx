import React, { createContext, useContext, useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

// Accent colors mapped to scene IDs (mirrors SCENE_THEMES in Game.tsx)
// Key 0 = pre-game state (Home/Warning screens) — purple accent
const ACCENT_COLORS: Record<number, { accent: string; accentDark: string; bubbleBg: string }> = {
  0:  { accent: '#9b59b6', accentDark: '#4a1a7a', bubbleBg: 'rgba(230,210,255,1)' },
  1:  { accent: '#ff6b00', accentDark: '#7a3e00', bubbleBg: 'rgba(255,230,210,0.92)' },
  2:  { accent: '#2ecfca', accentDark: '#136b68', bubbleBg: 'rgba(220,252,250,0.93)' },
  3:  { accent: '#2d8653', accentDark: '#1a5233', bubbleBg: 'rgba(200,248,222,0.93)' },
  4:  { accent: '#b28cf8', accentDark: '#3d1f70', bubbleBg: 'rgba(228,210,255,0.93)' },
  5:  { accent: '#f9a825', accentDark: '#7a3000', bubbleBg: 'rgba(255,248,185,0.93)' },
  6:  { accent: '#e53935', accentDark: '#6d1f1f', bubbleBg: 'rgba(255,215,215,0.93)' },
  7:  { accent: '#2ecc71', accentDark: '#1a6b3c', bubbleBg: 'rgba(205,255,225,0.93)' },
  8:  { accent: '#e67e22', accentDark: '#6b3010', bubbleBg: 'rgba(255,238,215,0.93)' },
  9:  { accent: '#4a90d9', accentDark: '#1a4070', bubbleBg: 'rgba(212,235,255,0.93)' },
  10: { accent: '#e91e63', accentDark: '#6d0030', bubbleBg: 'rgba(255,205,240,0.93)' },
  11: { accent: '#f57c00', accentDark: '#5a2e00', bubbleBg: 'rgba(255,230,185,0.93)' },
  12: { accent: '#9c27b0', accentDark: '#3d0050', bubbleBg: 'rgba(232,205,255,0.93)' },
  13: { accent: '#2e7d32', accentDark: '#0a3d0e', bubbleBg: 'rgba(215,255,220,0.93)' },
  14: { accent: '#30cfd0', accentDark: '#0a3060', bubbleBg: 'rgba(195,242,252,0.92)' },
  15: { accent: '#9b72f8', accentDark: '#1a005a', bubbleBg: 'rgba(205,185,255,0.90)' },
};

interface SceneThemeValue {
  accent: string;
  accentDark: string;
  bubbleBg: string;
}

const SceneThemeContext = createContext<SceneThemeValue | null>(null);

export const useSceneTheme = (): SceneThemeValue => {
  const value = useContext(SceneThemeContext);
  if (!value) {
    throw new Error('useSceneTheme must be used within a SceneThemeProvider');
  }
  return value;
};

interface SceneThemeProviderProps {
  children: React.ReactNode;
}

export const SceneThemeProvider: React.FC<SceneThemeProviderProps> = ({ children }) => {
  const currentScene = useGameStore((state) => state.currentScene);
  const consentGiven = useGameStore((state) => state.consentGiven);
  // Use '0' (purple) for pre-game states, or the scene's accent once game starts
  const [theme, setTheme] = useState<SceneThemeValue>(ACCENT_COLORS[0]);

  useEffect(() => {
    if (consentGiven === false) {
      // Not yet started game — always use purple
      setTheme(ACCENT_COLORS[0]);
    } else if (currentScene >= 1 && currentScene <= 15) {
      setTheme(ACCENT_COLORS[currentScene]);
    } else {
      // Default to pre-game purple when not in a game scene
      setTheme(ACCENT_COLORS[0]);
    }
  }, [currentScene, consentGiven]);

  return (
    <SceneThemeContext.Provider value={theme}>
      {children}
    </SceneThemeContext.Provider>
  );
};

export default useSceneTheme;