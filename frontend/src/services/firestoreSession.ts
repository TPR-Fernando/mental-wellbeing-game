import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import type { DeviceType } from '../utils/device';

export interface SceneChoiceData {
  optionId: string;
  weight: number;
  timeMs: number;
}

export interface MiniGameResult {
  word: string;
  weight: -1 | 0 | 1;
  decisionTimeMs: number;
  sceneContext: string;
}

export interface FinalizeSessionInput {
  deviceType: DeviceType;
  userId: string | null;
  currentScene: number;
  sceneChoices: Record<number, SceneChoiceData>;
  freeTexts: Record<number, { text: string; sentimentScore: number | null }>;
  miniGames: Record<number, MiniGameResult>;
}

// Creates the ENTIRE session document in one atomic write, including all the gameplay data
// collected locally while the participant played. This is only called once the participant
// selects Guest or Google on the login screen — before that, nothing is in Firestore.
// Each call generates a brand-new auto-generated sessionId, so it never reuses or overwrites
// any earlier (now-abandoned) attempt.
export async function finalizeSession(input: FinalizeSessionInput): Promise<string> {
  const ref = doc(collection(db, 'sessions'));

  // Normalise the rich local records into the exact Firestore field paths used by the
  // running schema, so future incremental writes (postGameInterview, wellbeingSummary,
  // groundTruth, preference) and the offline analysis all line up.
  const choices: Record<string, SceneChoiceData> = {};
  Object.entries(input.sceneChoices).forEach(([sceneNumber, data]) => {
    choices[`scene_${String(sceneNumber).padStart(2, '0')}`] = data;
  });

  const freeTexts: Record<string, { text: string; sentimentScore: number | null }> = {};
  Object.entries(input.freeTexts).forEach(([sceneNumber, data]) => {
    freeTexts[`scene_${String(sceneNumber).padStart(2, '0')}`] = data;
  });

  const minigames: Record<string, MiniGameResult> = {};
  Object.entries(input.miniGames).forEach(([index, data]) => {
    minigames[`mg_${String(index).padStart(2, '0')}`] = data;
  });

  const docData: Record<string, unknown> = {
    consentGiven: true,
    deviceType: input.deviceType,
    createdAt: serverTimestamp(),
    completedAt: null,
    status: 'in_progress',
    currentScene: input.currentScene,
  };

  if (input.userId) {
    docData.userId = input.userId;
  }
  if (Object.keys(choices).length > 0) docData.choices = choices;
  if (Object.keys(freeTexts).length > 0) docData.freeTexts = freeTexts;
  if (Object.keys(minigames).length > 0) docData.minigames = minigames;

  await setDoc(ref, docData);
  return ref.id;
}

export interface PostGameInterview {
  q1: string;
  a1: string;
  q2: string;
  a2: string;
}

export async function savePostGameInterview(
  sessionId: string,
  interview: PostGameInterview,
): Promise<void> {
  const ref = doc(db, 'sessions', sessionId);
  await setDoc(ref, { postGameInterview: interview }, { merge: true });
}

export async function saveWellbeingSummary(sessionId: string, summary: string): Promise<void> {
  const ref = doc(db, 'sessions', sessionId);
  await setDoc(ref, { wellbeingSummary: summary }, { merge: true });
}

export interface GroundTruthData {
  who5: Record<string, number>;
  swemwbs: Record<string, number>;
}

// Firestore rules only allow writing `groundTruth` in the same update that marks the session
// completed (or after it's already completed) — see firestore.rules. Write both together.
export async function saveGroundTruth(sessionId: string, data: GroundTruthData): Promise<void> {
  const ref = doc(db, 'sessions', sessionId);
  await setDoc(
    ref,
    {
      groundTruth: { ...data, submittedAt: serverTimestamp() },
      status: 'completed',
      completedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

// Captures the participant's preference for the game-based vs. standard-questionnaire approach,
// collected right after the ground-truth questionnaire (and after the session is marked completed,
// so the existing Firestore update rule permits it).
export async function savePreference(sessionId: string, answer: string): Promise<void> {
  const ref = doc(db, 'sessions', sessionId);
  await setDoc(
    ref,
    {
      preference: {
        question: 'Would you prefer playing a game like this over filling out a standard questionnaire?',
        answer,
        submittedAt: serverTimestamp(),
      },
    },
    { merge: true },
  );
}

// Links an existing session to an authenticated user after Google sign-in.
export async function linkSessionToUser(sessionId: string, userId: string): Promise<void> {
  const ref = doc(db, 'sessions', sessionId);
  await setDoc(ref, { userId }, { merge: true });
}

// If an in-progress session document no longer exists (deleted or lost server-side while the
// participant's link kept its id), the authenticated link write above would be rejected, because it
// would be an invalid `create` (the consent-time fields are missing) rather than an `update`. This
// recreates a fresh, well-formed session already owned by this user, so the summary/questionnaire
// flow still has a valid document to write to.
export async function recoverMissingSession(uid: string, deviceType: DeviceType): Promise<string> {
  const ref = doc(collection(db, 'sessions'));
  await setDoc(ref, {
    consentGiven: true,
    deviceType,
    createdAt: serverTimestamp(),
    completedAt: null,
    status: 'in_progress',
    currentScene: 1,
    userId: uid,
  });
  return ref.id;
}

// One account may take the assessment only once. Checks Firestore directly — the
// firestore.rules `allow read` now permits authenticated users to read only their
// own sessions (matched by userId == auth.uid). A single-field equality filter on
// userId is auto-indexed, so no composite index is required; the completed status
// is checked in memory on the few docs returned per user.
export async function checkUserAlreadyCompleted(userId: string): Promise<boolean> {
  const q = query(collection(db, 'sessions'), where('userId', '==', userId));
  const snap = await getDocs(q);
  // Typically 0-1 docs per user; iterate in-memory to avoid a composite index.
  return snap.docs.some((d) => d.data().status === 'completed');
}
