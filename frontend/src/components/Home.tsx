import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

export const Home = () => {
  const navigate = useNavigate();
  const resetGame = useGameStore((state) => state.resetGame);

  const startPlaying = () => {
    resetGame();
    navigate('/warning');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h1>Mental Wellbeing Narrative Game</h1>
      <p>
        Welcome. This is a short narrative experience that follows a student through a typical day. 
        Your choices shape the story. Make the choices that feel most natural to you.
      </p>
      <button 
        onClick={startPlaying}
        style={{ padding: '10px 20px', fontSize: '1.2rem', marginTop: '20px', cursor: 'pointer' }}
      >
        Start the Day
      </button>
    </div>
  );
};