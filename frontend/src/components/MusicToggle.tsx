import React, { useEffect, useState } from 'react';
import {
  isAmbientMusicAvailable,
  isAmbientMusicEnabled,
  toggleAmbientMusic,
} from '../services/ambientMusic';

/**
 * Floating background-music toggle shown on every page, so the participant
 * can switch the ambient soundtrack on/off at any point in the flow.
 */
export const MusicToggle = () => {
  const [playing, setPlaying] = useState(isAmbientMusicEnabled());
  const [available] = useState(isAmbientMusicAvailable());

  // Reflect the live preference whenever it changes anywhere in the app.
  useEffect(() => {
    const sync = () => setPlaying(isAmbientMusicEnabled());
    window.addEventListener('ambient-music-change', sync);
    return () => window.removeEventListener('ambient-music-change', sync);
  }, []);

  const handleToggle = () => {
    setPlaying(toggleAmbientMusic());
  };

  return (
    <button
      type="button"
      className={`music-toggle${playing ? ' music-toggle--on' : ''}${!available ? ' music-toggle--na' : ''}`}
      onClick={handleToggle}
      aria-pressed={playing}
      aria-label={playing ? 'Pause background music' : 'Play background music'}
      title={playing ? 'Pause background music' : 'Play background music'}
    >
      <span className="music-toggle-glyph" aria-hidden="true">♪</span>
      {!available && (
        <span className="music-toggle-note" title="Drop background.mp3 into frontend/public/music/ to enable the soundtrack">
          no track
        </span>
      )}
    </button>
  );
};