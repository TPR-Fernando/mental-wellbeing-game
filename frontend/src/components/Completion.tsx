import React from 'react';
import { useGameStore } from '../store/gameStore';

// Final screen — no further action is possible from here (no replay), per
// COPILOT_BUILD_GUIDE.md Section 8.4. Not behind RequireConsent's game routes so it stays
// reachable even after localStorage state is cleared, but it only ever shows the summary
// already generated for this session.
export const Completion = () => {
  const wellbeingSummary = useGameStore((state) => state.wellbeingSummary);

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h1>Thank You</h1>
      <p style={{ lineHeight: '1.6' }}>
        That's everything — thank you for taking the time to play through today's story and share
        your reflections with us.
      </p>

      {wellbeingSummary && (
        <div
          style={{
            backgroundColor: '#e3f2fd',
            padding: '20px',
            borderRadius: '8px',
            margin: '2rem 0',
            border: '2px solid #2196f3',
            textAlign: 'left',
          }}
        >
          <p style={{ color: '#000000', fontSize: '1.05rem', lineHeight: '1.6', margin: 0 }}>
            {wellbeingSummary}
          </p>
        </div>
      )}

      <p style={{ color: '#666', lineHeight: '1.6', fontSize: '0.95rem' }}>
        This is not a clinical assessment and does not replace professional support. If anything
        felt difficult today, consider reaching out to someone you trust.
      </p>
    </div>
  );
};
