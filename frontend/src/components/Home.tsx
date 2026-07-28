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
    <div className="home-hero">
      <div className="home-card">
        {/* Eyebrow */}
        <span className="home-eyebrow">Student Wellbeing Research</span>

        {/* Display title */}
        <h1 className="home-title">
          A Day in{' '}
          <span className="home-title-gradient">Your Life</span>
        </h1>

        {/* Decorative rule */}
        <div className="home-rule" />

        {/* Tagline */}
        <p className="home-tagline">
          Fifteen moments. Real choices. Your story.
        </p>

        {/* Info chips */}
        <div className="home-chips">
          <span className="home-chip">🕐 10–15 minutes</span>
          <span className="home-chip">📖 15 scenes</span>
          <span className="home-chip">🔒 Anonymous</span>
        </div>

        {/* Description */}
        <p className="home-description">
          Follow a student through an ordinary day — from a quiet morning to a
          late night. Each scene offers choices. Make the ones that feel most
          natural to you.
        </p>

        {/* CTA */}
        <button className="home-cta" onClick={startPlaying}>
          Begin Your Day
          <span className="cta-arrow">→</span>
        </button>
      </div>
    </div>
  );
};