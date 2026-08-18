import { create } from 'zustand';

const SESSION_STORAGE_KEY = 'mwg_session';

interface PersistedSession {
  sessionId: string | null;
  consentGiven: boolean;
  userId: string | null;
  // True once a participant reaches the final /completion screen. For guests (no userId) this is
  // the signal that they've already finished, so a returning guest is told so instead of being
  // allowed to replay. Google-account users keep the existing duplicate-prevention flow and are
  // unaffected (their completion is enforced via the UID check in GoogleLogin).
  completed: boolean;
  wellbeingSummary: string | null;
  groundTruthScores: { who5Score: number; swemwbsScore: number } | null;
  predictedScores: { who5Predicted: number; swemwbsPredicted: number } | null;
  // ── Game progression ──────────────────────────────────────────────
  // Persisted alongside the session metadata so a browser refresh mid-game resumes
  // at the same scene (even mid-mini-game) instead of restarting at Scene 1, and so
  // resetGame() can clear them for a genuinely fresh playthrough.
  currentScene: number;
  choices: Record<number, number>;
  reactionTimes: Record<number, number>;
  freeTextAnswers: Record<number, string>;
  freeTextSentiments: Record<number, number | null>;
  miniGameWeights: Record<number, -1 | 0 | 1>;
  // Rich per-scene choice details (optionId, weight, timeMs) and per-mini-game results
  // (word, weight, decisionTimeMs, sceneContext). These are kept in client state until the
  // participant selects Guest or Google on the login screen, at which point the WHOLE session
  // (including this full gameplay history) is committed to Firestore in one new document.
  sceneChoices: Record<number, { optionId: string; weight: number; timeMs: number }>;
  miniGames: Record<number, { word: string; weight: -1 | 0 | 1; decisionTimeMs: number; sceneContext: string }>;
  pendingMiniGame: number | null;
}

// JSON round-trips object keys into strings; TS's Record<number, T> still indexes them
// correctly via numeric coercion, so this is just a validated object-of-T guard.
function asRecord<T>(raw: unknown, isValidValue: (value: unknown) => boolean): Record<number, T> {
  if (typeof raw !== 'object' || raw === null) return {};
  return Object.fromEntries(
    Object.entries(raw).filter(([, value]) => isValidValue(value)),
  ) as Record<number, T>;
}

function isPositiveSceneNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1;
}

function loadPersistedSession(): PersistedSession {
  const empty: PersistedSession = {
    sessionId: null,
    consentGiven: false,
    userId: null,
    completed: false,
    wellbeingSummary: null,
    groundTruthScores: null,
    predictedScores: null,
    currentScene: 1,
    choices: {},
    reactionTimes: {},
    freeTextAnswers: {},
    freeTextSentiments: {},
    miniGameWeights: {},
    sceneChoices: {},
    miniGames: {},
    pendingMiniGame: null,
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
      completed: parsed.completed === true,
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
      currentScene: isPositiveSceneNumber(parsed.currentScene) ? parsed.currentScene : 1,
      choices: asRecord<number>(parsed.choices, (v) => typeof v === 'number' && !Number.isNaN(v)),
      reactionTimes: asRecord<number>(parsed.reactionTimes, (v) => typeof v === 'number' && v >= 0),
      freeTextAnswers: asRecord<string>(parsed.freeTextAnswers, (v) => typeof v === 'string'),
      freeTextSentiments: asRecord<number | null>(
        parsed.freeTextSentiments,
        (v) => v === null || typeof v === 'number',
      ),
      miniGameWeights: asRecord<-1 | 0 | 1>(parsed.miniGameWeights, (v) => v === -1 || v === 0 || v === 1),
      sceneChoices: asRecord<{ optionId: string; weight: number; timeMs: number }>(
        parsed.sceneChoices,
        (v) =>
          typeof v === 'object' &&
          v !== null &&
          typeof (v as { optionId?: unknown }).optionId === 'string' &&
          typeof (v as { weight?: unknown }).weight === 'number' &&
          typeof (v as { timeMs?: unknown }).timeMs === 'number',
      ),
      miniGames: asRecord<{ word: string; weight: -1 | 0 | 1; decisionTimeMs: number; sceneContext: string }>(
        parsed.miniGames,
        (v) =>
          typeof v === 'object' &&
          v !== null &&
          typeof (v as { word?: unknown }).word === 'string' &&
          ((v as { weight?: unknown }).weight === -1 ||
            (v as { weight?: unknown }).weight === 0 ||
            (v as { weight?: unknown }).weight === 1) &&
          typeof (v as { decisionTimeMs?: unknown }).decisionTimeMs === 'number' &&
          typeof (v as { sceneContext?: unknown }).sceneContext === 'string',
      ),
      pendingMiniGame: isPositiveSceneNumber(parsed.pendingMiniGame) ? parsed.pendingMiniGame : null,
    };
  } catch {
    return empty;
  }
}

// Reads-then-writes so any single field can be updated without clobbering the others
// (wellbeingSummary, groundTruthScores and the game-progression fields are each set
// at different points in the flow).
function persistSession(patch: Partial<PersistedSession>): void {
  if (typeof window === 'undefined') return;
  const current = loadPersistedSession();
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ ...current, ...patch }));
}

// Persists only the game-progression fields; the session-metadata setters already
// persist their own fields, and the read-then-write merge above keeps both groups in
// sync. No longer guarded on a Firestore sessionId: gameplay happens BEFORE a session
// document exists (the user only selects Guest/Google on the login screen), so this
// must persist to localStorage regardless so a refresh mid-game is never lost.
function persistGameProgression(
  sessionId: string | null,
  progression: Partial<
    Pick<PersistedSession, 'currentScene' | 'choices' | 'reactionTimes' | 'freeTextAnswers' | 'freeTextSentiments' | 'miniGameWeights' | 'sceneChoices' | 'miniGames' | 'pendingMiniGame'>
  >,
): void {
  void sessionId;
  persistSession(progression);
}

interface GameState {
  currentScene: number;
  choices: Record<number, number>; // Maps scene index to weight (-2 to +2)
  reactionTimes: Record<number, number>; // Maps scene index to ms from scene render to choice tap
  freeTextAnswers: Record<number, string>; // Maps scene index to text
  freeTextSentiments: Record<number, number | null>;
  miniGameWeights: Record<number, -1 | 0 | 1>; // Maps mini-game index (1-3) to weight; feeds only into AI summary
  sceneChoices: Record<number, { optionId: string; weight: number; timeMs: number }>;
  miniGames: Record<number, { word: string; weight: -1 | 0 | 1; decisionTimeMs: number; sceneContext: string }>;
  pendingMiniGame: number | null; // Mini-game awaiting completion (persisted so a refresh mid-mini-game resumes it)
  sessionId: string | null;
  consentGiven: boolean;
  userId: string | null;
  completed: boolean;
  wellbeingSummary: string | null;
  groundTruthScores: { who5Score: number; swemwbsScore: number } | null;
  predictedScores: { who5Predicted: number; swemwbsPredicted: number } | null;
  recordChoice: (sceneIndex: number, weight: number) => void;
  recordReactionTime: (sceneIndex: number, ms: number) => void;
  recordText: (sceneIndex: number, text: string, sentimentScore: number | null) => void;
  recordMiniGameWeight: (miniGameIndex: number, weight: -1 | 0 | 1) => void;
  recordSceneChoice: (sceneIndex: number, data: { optionId: string; weight: number; timeMs: number }) => void;
  recordMiniGame: (miniGameIndex: number, result: { word: string; weight: -1 | 0 | 1; decisionTimeMs: number; sceneContext: string }) => void;
  nextScene: () => void;
  setPendingMiniGame: (miniGameIndex: number | null) => void;
  setConsentGiven: () => void;
  resetGame: () => void;
  resetSession: () => void;
  setSession: (sessionId: string) => void;
  setCompleted: () => void;
  setWellbeingSummary: (summary: string) => void;
  setUserId: (uid: string) => void;
  setGroundTruthScores: (scores: { who5Score: number; swemwbsScore: number }) => void;
  setPredictedScores: (scores: { who5Predicted: number; swemwbsPredicted: number }) => void;
  medianReactionTime: () => number | null;
}

export const useGameStore = create<GameState>((set, get) => {
  const persisted = loadPersistedSession();

  return {
    currentScene: persisted.currentScene,
    choices: persisted.choices,
    reactionTimes: persisted.reactionTimes,
    freeTextAnswers: persisted.freeTextAnswers,
    miniGameWeights: persisted.miniGameWeights,
    pendingMiniGame: persisted.pendingMiniGame,
    sceneChoices: persisted.sceneChoices,
    miniGames: persisted.miniGames,
    freeTextSentiments: persisted.freeTextSentiments,
    sessionId: persisted.sessionId,
    consentGiven: persisted.consentGiven,
    userId: persisted.userId,
    completed: persisted.completed,
    wellbeingSummary: persisted.wellbeingSummary,
    groundTruthScores: persisted.groundTruthScores,
    predictedScores: persisted.predictedScores,

    recordChoice: (sceneIndex, weight) =>
      set((state) => {
        const choices = { ...state.choices, [sceneIndex]: weight };
        persistGameProgression(state.sessionId, { choices });
        return { choices };
      }),

    recordReactionTime: (sceneIndex, ms) =>
      set((state) => {
        const reactionTimes = { ...state.reactionTimes, [sceneIndex]: ms };
        persistGameProgression(state.sessionId, { reactionTimes });
        return { reactionTimes };
      }),

    recordText: (sceneIndex, text, sentimentScore) =>
      set((state) => {
        const freeTextAnswers = { ...state.freeTextAnswers, [sceneIndex]: text };
        const freeTextSentiments = { ...state.freeTextSentiments, [sceneIndex]: sentimentScore };
        persistGameProgression(state.sessionId, { freeTextAnswers, freeTextSentiments });
        return { freeTextAnswers, freeTextSentiments };
      }),

    recordMiniGameWeight: (miniGameIndex, weight) =>
      set((state) => {
        const miniGameWeights = { ...state.miniGameWeights, [miniGameIndex]: weight };
        persistGameProgression(state.sessionId, { miniGameWeights });
        return { miniGameWeights };
      }),

    // Records the full choice details (optionId, weight, timeMs) locally for the eventual
    // one-shot Firestore write. Kept separate from `choices` (which only stores the weight
    // for the Summary screen) so the complete research-grade record survives a refresh.
    recordSceneChoice: (sceneIndex, data) =>
      set((state) => {
        const sceneChoices = { ...state.sceneChoices, [sceneIndex]: data };
        persistGameProgression(state.sessionId, { sceneChoices });
        return { sceneChoices };
      }),

    // Records the full mini-game result (word, weight, decisionTimeMs, sceneContext) locally
    // for the eventual one-shot Firestore write. `miniGameWeights` still carries just the
    // weight for the Summary screen.
    recordMiniGame: (miniGameIndex, result) =>
      set((state) => {
        const miniGames = { ...state.miniGames, [miniGameIndex]: result };
        persistGameProgression(state.sessionId, { miniGames });
        return { miniGames };
      }),

    // Used to judge Scene 11's hesitation relative to this participant's own pace,
    // rather than a fixed cutoff (see game_question_set.md, Scene 11).
    medianReactionTime: () => {
      const values = Object.values(get().reactionTimes).sort((a, b) => a - b);
      if (values.length === 0) return null;
      const mid = Math.floor(values.length / 2);
      return values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
    },

    nextScene: () =>
      set((state) => {
        const currentScene = state.currentScene + 1;
        persistGameProgression(state.sessionId, { currentScene });
        return { currentScene };
      }),

    setPendingMiniGame: (pendingMiniGame) =>
      set((state) => {
        persistGameProgression(state.sessionId, { pendingMiniGame });
        return { pendingMiniGame };
      }),

    // Note: intentionally does not touch sessionId/consentGiven — those persist for the
    // lifetime of the participant's link, only game progression resets. The cleared
    // progression is persisted too, so a refresh after resetting can't resurrect it.
    resetGame: () =>
      set((state) => {
        const freshProgress = {
          currentScene: 1,
          choices: {},
          reactionTimes: {},
          freeTextAnswers: {},
          freeTextSentiments: {},
          miniGameWeights: {},
          sceneChoices: {},
          miniGames: {},
          pendingMiniGame: null,
        };
        persistGameProgression(state.sessionId, freshProgress);
        return freshProgress;
      }),

    // Marks that the participant has consented and lets them proceed into the game. No
    // Firestore session document exists yet — it is created later on the login screen once
    // they choose Guest or Google (see firestoreSession.finalizeSession).
    setConsentGiven: () =>
      set((state) => {
        persistSession({ consentGiven: true, userId: state.userId, wellbeingSummary: state.wellbeingSummary, groundTruthScores: state.groundTruthScores, predictedScores: state.predictedScores });
        return { consentGiven: true };
      }),

    setSession: (sessionId) =>
      set((state) => {
        persistSession({ sessionId, consentGiven: true, userId: state.userId, wellbeingSummary: state.wellbeingSummary, groundTruthScores: state.groundTruthScores, predictedScores: state.predictedScores });
        return { sessionId, consentGiven: true };
      }),

    // Full wipe: clears the persisted key AND every in-memory session field so the
    // next participant starts completely fresh (new consent, new sessionId, no leftover
    // userId/completed/results). Unlike resetGame(), this also abandons the previous
    // session identity so a new attempt never reuses or overwrites the old session doc.
    resetSession: () => {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      }
      set({
        sessionId: null,
        consentGiven: false,
        userId: null,
        completed: false,
        wellbeingSummary: null,
        groundTruthScores: null,
        predictedScores: null,
        currentScene: 1,
        choices: {},
        reactionTimes: {},
        freeTextAnswers: {},
        freeTextSentiments: {},
        miniGameWeights: {},
        sceneChoices: {},
        miniGames: {},
        pendingMiniGame: null,
      });
    },

    // Marks a session as finished (called when the participant reaches /completion). persistSession
    // merges this with the currently stored session, so all other fields are preserved.
    setCompleted: () =>
      set((state) => {
        persistSession({ completed: true });
        return { completed: true };
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
