import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
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
  await setDoc(
    ref,
    {
      choices: { [`scene_${String(sceneNumber).padStart(2, '0')}`]: choiceData },
      currentScene: sceneNumber,
      status: 'in_progress',
    },
    { merge: true },
  );
}

export async function saveFreeText(
  sessionId: string,
  sceneNumber: number,
  text: string,
  sentimentScore: number | null,
): Promise<void> {
  const ref = doc(db, 'sessions', sessionId);
  await setDoc(
    ref,
    {
      freeTexts: {
        [`scene_${String(sceneNumber).padStart(2, '0')}`]: { text, sentimentScore },
      },
    },
    { merge: true },
  );
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
  await setDoc(
    ref,
    {
      minigames: { [`mg_${String(miniGameIndex).padStart(2, '0')}`]: result },
    },
    { merge: true },
  );
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

// Links an existing session to an authenticated user after Google sign-in.
export async function linkSessionToUser(sessionId: string, userId: string): Promise<void> {
  const ref = doc(db, 'sessions', sessionId);
  await setDoc(ref, { userId }, { merge: true });
}
