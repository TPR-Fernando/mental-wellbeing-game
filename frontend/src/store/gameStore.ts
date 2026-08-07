import { create } from 'zustand';

const SESSION_STORAGE_KEY = 'mwg_session';

interface PersistedSession {
  sessionId: string | null;
  consentGiven: boolean;
  userId: string | null;
  wellbeingSummary: string | null;
  groundTruthScores: { who5Score: number; swemwbsScore: number } | null;
  predictedScores: { who5Predicted: number; swemwbsPredicted: number } | null;
}

function loadPersistedSession(): PersistedSession {
  const empty: PersistedSession = {
    sessionId: null,
    consentGiven: false,
    userId: null,
    wellbeingSummary: null,
    groundTruthScores: null,
    predictedScores: null,
  };
  if (typeof window === 'undefined') return empty;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return {
      sessionId: typeof parsed.sessionId === 'string' ? parsed.sessionId : null,
      consentGiven: parsed.consentGiven === true,
      userId: typeof parsed.userId === 'string' ? parsed.userId : null,
      wellbeingSummary: typeof parsed.wellbeingSummary === 'string' ? parsed.wellbeingSummary : null,
      groundTruthScores:
        parsed.groundTruthScores &&
        typeof parsed.groundTruthScores.who5Score === 'number' &&
        typeof parsed.groundTruthScores.swemwbsScore === 'number'
          ? parsed.groundTruthScores
          : null,
      predictedScores:
        parsed.predictedScores &&
        typeof parsed.predictedScores.who5Predicted === 'number' &&
        typeof parsed.predictedScores.swemwbsPredicted === 'number'
          ? parsed.predictedScores
          : null,
    };
  } catch {
    return empty;
  }
}

// Reads-then-writes so any single field can be updated without clobbering the others
// (wellbeingSummary and groundTruthScores are set at different points in the flow).
function persistSession(patch: Partial<Omit<PersistedSession, 'sessionId'>> & { sessionId: string }) {
  if (typeof window === 'undefined') return;
  const current = loadPersistedSession();
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ ...current, ...patch }));
}

interface GameState {
  currentScene: number;
  choices: Record<number, number>; // Maps scene index to weight (-2 to +2)
  reactionTimes: Record<number, number>; // Maps scene index to ms from scene render to choice tap
  freeTextAnswers: Record<number, string>; // Maps scene index to text
  miniGameWeights: Record<number, -1 | 0 | 1>; // Maps mini-game index (1-3) to weight; feeds only into AI summary
  sessionId: string | null;
  consentGiven: boolean;
  userId: string | null;
  wellbeingSummary: string | null;
  groundTruthScores: { who5Score: number; swemwbsScore: number } | null;
  predictedScores: { who5Predicted: number; swemwbsPredicted: number } | null;
  recordChoice: (sceneIndex: number, weight: number) => void;
  recordReactionTime: (sceneIndex: number, ms: number) => void;
  recordText: (sceneIndex: number, text: string) => void;
  recordMiniGameWeight: (miniGameIndex: number, weight: -1 | 0 | 1) => void;
  nextScene: () => void;
  resetGame: () => void;
  setSession: (sessionId: string) => void;
  setWellbeingSummary: (summary: string) => void;
  setUserId: (uid: string) => void;
  setGroundTruthScores: (scores: { who5Score: number; swemwbsScore: number }) => void;
  setPredictedScores: (scores: { who5Predicted: number; swemwbsPredicted: number }) => void;
  medianReactionTime: () => number | null;
}

export const useGameStore = create<GameState>((set, get) => {
  const persisted = loadPersistedSession();

  return {
    currentScene: 1,
    choices: {},
    reactionTimes: {},
    freeTextAnswers: {},
    miniGameWeights: {},
    sessionId: persisted.sessionId,
    consentGiven: persisted.consentGiven,
    userId: persisted.userId,
    wellbeingSummary: persisted.wellbeingSummary,
    groundTruthScores: persisted.groundTruthScores,
    predictedScores: persisted.predictedScores,

    recordChoice: (sceneIndex, weight) =>
      set((state) => ({
        choices: { ...state.choices, [sceneIndex]: weight },
      })),

    recordReactionTime: (sceneIndex, ms) =>
      set((state) => ({
        reactionTimes: { ...state.reactionTimes, [sceneIndex]: ms },
      })),

    recordText: (sceneIndex, text) =>
      set((state) => ({
        freeTextAnswers: { ...state.freeTextAnswers, [sceneIndex]: text },
      })),

    recordMiniGameWeight: (miniGameIndex, weight) =>
      set((state) => ({
        miniGameWeights: { ...state.miniGameWeights, [miniGameIndex]: weight },
      })),

    // Used to judge Scene 11's hesitation relative to this participant's own pace,
    // rather than a fixed cutoff (see game_question_set.md, Scene 11).
    medianReactionTime: () => {
      const values = Object.values(get().reactionTimes).sort((a, b) => a - b);
      if (values.length === 0) return null;
      const mid = Math.floor(values.length / 2);
      return values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
    },

    nextScene: () =>
      set((state) => ({
        currentScene: state.currentScene + 1,
      })),

    // Note: intentionally does not touch sessionId/consentGiven — those persist for the
    // lifetime of the participant's link, only game progression resets.
    resetGame: () =>
      set({
        currentScene: 1,
        choices: {},
        reactionTimes: {},
        freeTextAnswers: {},
        miniGameWeights: {},
      }),

    setSession: (sessionId) =>
      set((state) => {
        persistSession({ sessionId, consentGiven: true, userId: state.userId, wellbeingSummary: state.wellbeingSummary, groundTruthScores: state.groundTruthScores, predictedScores: state.predictedScores });
        return { sessionId, consentGiven: true };
      }),

    setWellbeingSummary: (summary) =>
      set((state) => {
        if (state.sessionId) {
          persistSession({ sessionId: state.sessionId, consentGiven: state.consentGiven, userId: state.userId, wellbeingSummary: summary, groundTruthScores: state.groundTruthScores, predictedScores: state.predictedScores });
        }
        return { wellbeingSummary: summary };
      }),

    setUserId: (uid) =>
      set((state) => {
        if (state.sessionId) {
          persistSession({ sessionId: state.sessionId, consentGiven: state.consentGiven, userId: uid, wellbeingSummary: state.wellbeingSummary, groundTruthScores: state.groundTruthScores, predictedScores: state.predictedScores });
        }
        return { userId: uid };
      }),

    setGroundTruthScores: (scores) =>
      set((state) => {
        if (state.sessionId) {
          persistSession({ sessionId: state.sessionId, consentGiven: state.consentGiven, userId: state.userId, wellbeingSummary: state.wellbeingSummary, groundTruthScores: scores, predictedScores: state.predictedScores });
        }
        return { groundTruthScores: scores };
      }),

    setPredictedScores: (scores) =>
      set((state) => {
        if (state.sessionId) {
          persistSession({ sessionId: state.sessionId, consentGiven: state.consentGiven, userId: state.userId, wellbeingSummary: state.wellbeingSummary, groundTruthScores: state.groundTruthScores, predictedScores: scores });
        }
        return { predictedScores: scores };
      }),
  };
});
