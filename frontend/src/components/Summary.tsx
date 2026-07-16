import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { scenarios } from '../data/scenarios';

export const Summary = () => {
  const { choices, freeTextAnswers } = useGameStore();
  
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  
  // Follow-up interaction state
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<number, string>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState(false);

  useEffect(() => {
    // Group weights by scale item (e.g. "WHO-5 W3"), since W2, W3 and S7 each appear
    // twice across the 15 scenes and should be averaged into a single item score first,
    // not double-counted (see game_question_set.md Scoring Notes).
    const itemWeights: Record<string, number[]> = {};
    scenarios.forEach((scene) => {
      const choiceWeight = choices[scene.id] || 0;
      if (!itemWeights[scene.scaleItem]) itemWeights[scene.scaleItem] = [];
      itemWeights[scene.scaleItem].push(choiceWeight);
    });

    let who5Raw = 0;
    let swemwbsRaw = 0;
    Object.entries(itemWeights).forEach(([scaleItem, weights]) => {
      const average = weights.reduce((sum, w) => sum + w, 0) / weights.length;
      if (scaleItem.startsWith("WHO-5")) {
        who5Raw += average;
      } else if (scaleItem.startsWith("SWEMWBS")) {
        swemwbsRaw += average;
      }
    });

    // Weights now range -2..+2 per item (5 items for WHO-5, 7 for SWEMWBS), so
    // who5Raw spans -10..+10 and swemwbsRaw spans -14..+14. Rescale to match the
    // real instruments' score ranges: WHO-5 is 0-100, SWEMWBS metric is 7-35.
    const who5Predicted = ((who5Raw + 10) / 20) * 100;
    const swemwbsPredicted = swemwbsRaw + 21;

    // In a real app we'd construct the LLM prompt payload here and call the Firebase function.
    // We are mocking it right now.
    
    setTimeout(() => {
      setResult({
        summary: `Based on your responses, you exhibit strong problem-solving skills but seem to be experiencing some minor stress regarding future academic goals. Your WHO-5 indicator score of ${Math.round(who5Predicted)} suggests generally positive wellbeing, but there's room to address the unease.`,
        followUpQuestions: [
          "You mentioned feeling uncertain about the future. What specifically is on your mind?",
          "How do you usually unwind after a long day of studying?"
        ]
      });
      setLoading(false);
    }, 2000); // 2 second mock delay

  }, [choices]);

  const handleFollowUpSubmit = () => {
    // Here we would push everything to Firestore
    console.log("Final submission Payload:", {
      choices,
      freeTextAnswers,
      followUpAnswers
    });
    setSubmittedAnswers(true);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}><h2>Analyzing your choices...</h2></div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Your Personalized Reflection</h2>
      <div style={{ backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '2px solid #2196f3' }}>
        <p style={{ color: '#000000', fontSize: '1.1rem', lineHeight: '1.6', margin: '0' }}>{result?.summary}</p>
      </div>

      {!submittedAnswers ? (
        <div>
          <h3>A Few Follow-up Questions</h3>
          <p style={{ color: '#555' }}>We generated a few specific questions to help you reflect a bit more.</p>
          
          {result?.followUpQuestions.map((q: string, idx: number) => (
            <div key={idx} style={{ marginBottom: '20px' }}>
              <p><strong>{q}</strong></p>
              <textarea 
                value={followUpAnswers[idx] || ""}
                onChange={(e) => setFollowUpAnswers({...followUpAnswers, [idx]: e.target.value})}
                style={{ width: '100%', height: '80px', padding: '10px' }}
              />
            </div>
          ))}

          <button 
            onClick={handleFollowUpSubmit}
            style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px' }}
          >
            Submit Responses
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#efe', borderRadius: '8px' }}>
          <h3>Thank you for playing!</h3>
          <p>Your session has been recorded safely.</p>
        </div>
      )}
    </div>
  );
};