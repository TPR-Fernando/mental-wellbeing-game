import { collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import type { DeviceType } from '../utils/device';

// Creates the session document immediately on consent, per COPILOT_BUILD_GUIDE.md Section 8.1 —
// even a one-scene dropout must be captured, so this must not wait until later in the flow.
export async function createSession(deviceType: DeviceType): Promise<string> {
  const ref = doc(collection(db, 'sessions'));
  await setDoc(ref, {
    consentGiven: true,
    deviceType,
    createdAt: serverTimestamp(),
    completedAt: null,
    status: 'in_progress',
    currentScene: 1,
  });
  return ref.id;
}

export interface SceneChoiceData {
  optionId: string;
  weight: number;
  timeMs: number;
}

// Per COPILOT_BUILD_GUIDE.md Section 6: never batch writes to the end. Write after every
// scene, choice, mini-game, and free-text entry so mid-session dropouts still leave usable data.
export async function saveSceneChoice(
  sessionId: string,
  sceneNumber: number,
  choiceData: SceneChoiceData,
): Promise<void> {
  const ref = doc(db, 'sessions', sessionId);
  // Use a dotted field path so Firestore updates only this scene. Merging a nested
  // `choices` object replaces the previously stored scene entries, which loses all
  // but the most recent score and reaction time.
  await updateDoc(ref, {
    [`choices.scene_${String(sceneNumber).padStart(2, '0')}`]: choiceData,
    currentScene: sceneNumber,
    status: 'in_progress',
  });
}

export async function saveFreeText(
  sessionId: string,
  sceneNumber: number,
  text: string,
  sentimentScore: number | null,
): Promise<void> {
  const ref = doc(db, 'sessions', sessionId);
  await updateDoc(ref, {
    [`freeTexts.scene_${String(sceneNumber).padStart(2, '0')}`]: { text, sentimentScore },
  });
}

export interface MiniGameResult {
  word: string;
  weight: -1 | 0 | 1;
  decisionTimeMs: number;
  sceneContext: string;
}

export async function saveMiniGame(
  sessionId: string,
  miniGameIndex: number,
  result: MiniGameResult,
): Promise<void> {
  const ref = doc(db, 'sessions', sessionId);
  await updateDoc(ref, {
    [`minigames.mg_${String(miniGameIndex).padStart(2, '0')}`]: result,
  });
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
