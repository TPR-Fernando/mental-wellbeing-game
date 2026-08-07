import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAudioCtxInstance, playHoverSound, playStartSound } from '../components/Home'; // Reuse audio functions from Home

// ── Particles ────────────────────────────────────────────────────────
const PARTICLE_COLORS = ['#7c5cfc', '#5b8fff', '#34d399', '#f59e0b', '#f472b6'];

interface Particle { id: number; x: number; y: number; size: number; duration: number; delay: number; color: string; }

const PARTICLES: Particle[] = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: 10 + Math.random() * 90,
  size: 4 + Math.random() * 7,
  duration: 5 + Math.random() * 7,
  delay: Math.random() * 6,
  color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
}));

export const Warning = () => {
  const navigate = useNavigate();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const warningContentRef = useRef<HTMLDivElement | null>(null);
  const [hasReachedBottom, setHasReachedBottom] = useState(false);

  useEffect(() => {
    const warningContent = warningContentRef.current;

    if (!warningContent) {
      return undefined;
    }

    const updateBottomState = () => {
      const { scrollTop, scrollHeight, clientHeight } = warningContent;
      const reachedBottom = scrollTop + clientHeight >= scrollHeight - 8;
      const contentFitsWithoutScroll = scrollHeight <= clientHeight + 8;

      if (reachedBottom || contentFitsWithoutScroll) {
        setHasReachedBottom(true);
      }
    };

    updateBottomState();
    warningContent.addEventListener('scroll', updateBottomState, { passive: true });
    window.addEventListener('resize', updateBottomState);

    return () => {
      warningContent.removeEventListener('scroll', updateBottomState);
      window.removeEventListener('resize', updateBottomState);
    };
  }, []);
  
  const handleAccept = () => {
    if (!hasReachedBottom) {
      return;
    }

    const ctx = getAudioCtxInstance(audioCtxRef);
    playStartSound(ctx);
    
    setTimeout(() => {
      navigate('/game');
    }, 200);
  };

  const handleBack = () => {
    const ctx = getAudioCtxInstance(audioCtxRef);
    playHoverSound(ctx);
    
    setTimeout(() => {
      navigate('/');
    }, 200);
  };

  const handleButtonHover = () => {
    if (!hasReachedBottom) {
      return;
    }

    const ctx = getAudioCtxInstance(audioCtxRef);
    playHoverSound(ctx);
  };

  return (
    <div className="game-wrapper warning-wrapper">
      {/* Floating background particles */}
      <div className="warning-particles" aria-hidden="true">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="warning-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.color,
              animationDuration: `${p.duration}s`,
              animationDelay: `${-p.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="scene-card warning-card">
        {/* Eyebrow */}
        <span className="warning-eyebrow">⚠️ Important Notice</span>
        
        {/* Title */}
        <h1 className="warning-title">Student Wellbeing Study</h1>
        
        {/* Decorative rule */}
        <div className="warning-rule" />
        
        {/* Scrollable content section */}
        <div
          ref={warningContentRef}
          className="warning-content scrollable-content"
        >
          <div className="warning-section">
            <h2 className="warning-section-title">This is NOT a Medical Diagnosis</h2>
            <p className="warning-section-text">
              This narrative experience is designed for educational and self-reflection purposes only. 
              It is <strong>NOT</strong> a substitute for professional medical advice, diagnosis, or treatment.
            </p>
            <p className="warning-section-text">
              If you are experiencing mental health concerns, please consult with a qualified healthcare 
              professional or mental health provider.
            </p>
          </div>

          <div className="warning-section">
            <h2 className="warning-section-title">📋 Test Guidelines</h2>
            <ul className="warning-list">
              <li>
                <strong>Complete in one sitting:</strong> This experience should be completed in a single 
                session without interruptions for accurate results.
              </li>
              <li>
                <strong>Response timing matters:</strong> Your response time to each scenario will be 
                recorded and may affect the assessment.
              </li>
              <li>
                <strong>Be honest:</strong> Choose the options that most naturally reflect how you would 
                actually respond, not how you think you should respond.
              </li>
              <li>
                <strong>Find a quiet space:</strong> Ensure you're in a comfortable, distraction-free 
                environment before beginning.
              </li>
              <li>
                <strong>Estimated time:</strong> This experience takes approximately 10-15 minutes to complete.
              </li>
            </ul>
          </div>

          <div className="warning-section">
            <h2 className="warning-section-title">🆘 Crisis Resources</h2>
            <p className="warning-section-text">
              If you are in crisis or experiencing thoughts of self-harm:
            </p>
            <ul className="warning-list">
              <li><strong>Emergency:</strong> Call 911 or go to your nearest emergency room</li>
              <li><strong>National Suicide Prevention Lifeline:</strong> 988 (available 24/7)</li>
              <li><strong>Crisis Text Line:</strong> Text "HELLO" to 741741</li>
            </ul>
          </div>
        </div>

        {/* Action buttons */}
        <div className="warning-buttons">
          <button
            onClick={handleBack}
            onMouseEnter={handleButtonHover}
            className="warning-button warning-back-button"
          >
            Go Back
          </button>
          <button
            onClick={handleAccept}
            onMouseEnter={handleButtonHover}
            className="warning-button warning-continue-button"
            disabled={!hasReachedBottom}
          >
            I Understand, Continue
          </button>
        </div>
      </div>
    </div>
  );
};
