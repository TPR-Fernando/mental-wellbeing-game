import { create } from 'zustand';

const SESSION_STORAGE_KEY = 'mwg_session';

function loadPersistedSession(): { sessionId: string | null; consentGiven: boolean } {
  if (typeof window === 'undefined') return { sessionId: null, consentGiven: false };
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return { sessionId: null, consentGiven: false };
    const parsed = JSON.parse(raw);
    return {
      sessionId: typeof parsed.sessionId === 'string' ? parsed.sessionId : null,
      consentGiven: parsed.consentGiven === true,
    };
  } catch {
    return { sessionId: null, consentGiven: false };
  }
}

function persistSession(sessionId: string, consentGiven: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ sessionId, consentGiven }));
}

interface GameState {
  currentScene: number;
  choices: Record<number, number>; // Maps scene index to weight (-2 to +2)
  reactionTimes: Record<number, number>; // Maps scene index to ms from scene render to choice tap
  freeTextAnswers: Record<number, string>; // Maps scene index to text
  sessionId: string | null;
  consentGiven: boolean;
  wellbeingSummary: string | null;
  recordChoice: (sceneIndex: number, weight: number) => void;
  recordReactionTime: (sceneIndex: number, ms: number) => void;
  recordText: (sceneIndex: number, text: string) => void;
  nextScene: () => void;
  resetGame: () => void;
  setSession: (sessionId: string) => void;
  setWellbeingSummary: (summary: string) => void;
  medianReactionTime: () => number | null;
}

export const useGameStore = create<GameState>((set, get) => {
  const persisted = loadPersistedSession();

  return {
    currentScene: 1,
    choices: {},
    reactionTimes: {},
    freeTextAnswers: {},
    sessionId: persisted.sessionId,
    consentGiven: persisted.consentGiven,
    wellbeingSummary: null,

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
      }),

    setSession: (sessionId) =>
      set(() => {
        persistSession(sessionId, true);
        return { sessionId, consentGiven: true };
      }),

    setWellbeingSummary: (summary) => set({ wellbeingSummary: summary }),
  };
});
