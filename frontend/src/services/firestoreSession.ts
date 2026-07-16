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
