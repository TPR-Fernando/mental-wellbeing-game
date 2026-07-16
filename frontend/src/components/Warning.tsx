import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Warning = () => {
  const navigate = useNavigate();

  const handleAccept = () => {
    navigate('/game');
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '700px', 
      margin: '0 auto', 
      textAlign: 'left' 
    }}>
      <h1 style={{ 
        color: '#d32f2f', 
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        ⚠️ Important Notice
      </h1>

      <div style={{ 
        backgroundColor: '#fff3cd', 
        border: '2px solid #ffc107',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ 
          color: '#856404',
          marginTop: '0',
          fontSize: '1.3rem'
        }}>
          This is NOT a Medical Diagnosis
        </h2>
        <p style={{ 
          color: '#856404',
          lineHeight: '1.6',
          marginBottom: '1rem'
        }}>
          This narrative experience is designed for educational and self-reflection purposes only. 
          It is <strong>NOT</strong> a substitute for professional medical advice, diagnosis, or treatment.
        </p>
        <p style={{ 
          color: '#856404',
          lineHeight: '1.6',
          marginBottom: '0'
        }}>
          If you are experiencing mental health concerns, please consult with a qualified healthcare 
          professional or mental health provider.
        </p>
      </div>

      <div style={{ 
        backgroundColor: '#e3f2fd', 
        border: '2px solid #2196f3',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ 
          color: '#0d47a1',
          marginTop: '0',
          fontSize: '1.3rem'
        }}>
          📋 Test Guidelines
        </h2>
        <ul style={{ 
          color: '#0d47a1',
          lineHeight: '1.8',
          marginBottom: '0'
        }}>
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

      <div style={{ 
        backgroundColor: '#ffebee', 
        border: '2px solid #f44336',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ 
          color: '#c62828',
          marginTop: '0',
          fontSize: '1.3rem'
        }}>
          🆘 Crisis Resources
        </h2>
        <p style={{ 
          color: '#c62828',
          lineHeight: '1.6',
          marginBottom: '0.5rem'
        }}>
          If you are in crisis or experiencing thoughts of self-harm:
        </p>
        <ul style={{ 
          color: '#c62828',
          lineHeight: '1.8',
          marginBottom: '0'
        }}>
          <li><strong>Emergency:</strong> Call 911 or go to your nearest emergency room</li>
          <li><strong>National Suicide Prevention Lifeline:</strong> 988 (available 24/7)</li>
          <li><strong>Crisis Text Line:</strong> Text "HELLO" to 741741</li>
        </ul>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        justifyContent: 'center',
        marginTop: '2rem'
      }}>
        <button
          onClick={handleBack}
          style={{
            padding: '12px 30px',
            fontSize: '1.1rem',
            cursor: 'pointer',
            backgroundColor: '#f5f5f5',
            color: '#000000',
            border: '2px solid #b0b0b0',
            borderRadius: '5px',
            fontWeight: '500'
          }}
        >
          Go Back
        </button>
        <button
          onClick={handleAccept}
          style={{
            padding: '12px 30px',
            fontSize: '1.1rem',
            cursor: 'pointer',
            backgroundColor: '#4caf50',
            color: '#ffffff',
            border: '2px solid #45a049',
            borderRadius: '5px',
            fontWeight: '500'
          }}
        >
          I Understand, Continue
        </button>
      </div>
    </div>
  );
};
