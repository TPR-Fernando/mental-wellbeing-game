# Build Guide: Backend, Mini-Games & Design
**Project:** A Game-Based Mental Well-Being Assessment Using Narrative Gameplay and AI-Driven Interaction
**Status:** Narrative game frontend (15 scenes) is built. This guide covers everything remaining: backend, mini-games, ground-truth questionnaire, and design polish.

---

## 0. Read This First (Non-Negotiable Constraints)

Before writing any code, understand these five rules. They come directly from the research methodology and ethics approval already granted. Violating any of them invalidates the research.

1. **Never expose scale mappings in client-side code comments, variable names, or console logs.** The choice-to-WHO5/SWEMWBS weighting must not be visible or inferable by inspecting the browser (DevTools, network tab, source). Store the mapping logic server-side or in a way that isn't trivially readable if a curious participant opens DevTools.
2. **No personally identifiable information (PII) is ever stored.** Only a randomly generated session ID. No names, emails, IPs logged long-term, or device fingerprints beyond a coarse device-type flag.
3. **LLM API calls are capped at 3 per session, AND hard-limited by a server-side daily counter.** These are two separate gates: a per-session counter (stored on the session document, checked before every call) and a global per-day counter (Section 3). Never call the LLM directly from the client. All LLM calls go through a Firebase Function.
4. **Every screen must have a working fallback if a network/API call fails.** No screen should ever show a blank page or infinite spinner if Firestore or the LLM API is unreachable.
5. **The consent screen is the first thing a participant sees, before any game content loads.** No exceptions, no way to bypass it via URL.

---

## 1. Tech Stack Reference

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Hosting | Firebase Hosting |
| Database | Firebase Firestore |
| Backend | Firebase Cloud Functions (Node.js) |
| In-game sentiment | `sentiment` npm package (AFINN, offline, free) |
| Post-game LLM | Anthropic Claude API (via Firebase Function only) |
| Offline NLP (later, not in this phase) | HuggingFace MentalBERT (Python, run after data collection) |

---

## 2. Firestore Schema (Implement Exactly As Follows)

Create one collection: `sessions`. Each document ID is an auto-generated Firestore ID (this doubles as the anonymous session identifier — do not create a separate "participant ID").

```
sessions/{sessionId}
  ├── consentGiven: boolean
  ├── deviceType: "mobile" | "desktop"          // coarse only, for timing analysis
  ├── createdAt: Timestamp
  ├── completedAt: Timestamp | null
  ├── status: "in_progress" | "completed" | "abandoned"
  ├── currentScene: number                       // for resuming / detecting drop-off
  │
  ├── choices: {
  │     scene_01: { optionId: "A"|"B"|"C"|"D"|"E", weight: -2|-1|0|1|2, timeMs: number },
  │     scene_02: { ... },
  │     ... scene_15                            // scene_11 is the hesitation mini-game: only 2 real
  │                                              // optionIds ever get chosen manually; a timed-out
  │                                              // response is written as its own synthetic weight
  │                                              // (see Section 5a) with timeMs === the timer limit
  │   }
  │
  ├── minigames: {
  │     mg_01: { reactionTimeMs: number, sceneContext: string },
  │     mg_02: { ... },
  │     mg_03: { ... }
  │   }                                          // "Hold to Focus" motor-inhibition trials (Section 5),
  │                                              // separate from the per-scene reaction-time baseline
  │                                              // and from scene_11's own hesitation timing above
  │
  ├── freeTexts: {
  │     scene_01: { text: string, sentimentScore: number },
  │     scene_03: { ... },
  │     scene_06: { ... },
  │     scene_10: { ... },
  │     scene_13: { ... }
  │   }
  │
  ├── postGameInterview: {
  │     q1: string, a1: string,
  │     q2: string, a2: string          // q2 is AI-generated: a genuine follow-up that adapts to a1's content
  │   }
  │
  ├── wellbeingSummary: string
  │
  └── groundTruth: {
        who5: { item1: number, item2: number, item3: number, item4: number, item5: number, totalScore: number },
        swemwbs: { item1: number, ..., item7: number, totalScore: number },
        submittedAt: Timestamp
      }
```

Create a second collection for LLM cost control:

```
usage/{YYYY-MM-DD}
  └── count: number
```

**Firestore Security Rules** — write these into `firestore.rules`:
- Clients may `create` a session document but only through the app flow (no direct arbitrary writes to `groundTruth` before `completedAt` is set).
- Clients may never `read` other sessions' documents (no listing, no querying by anyone but the owning client during their own session).
- Clients may never write to the `usage` collection directly — only Cloud Functions (via Admin SDK, which bypasses rules) can touch it.

---

## 3. Backend: Firebase Cloud Functions

Build **one callable function** with a `mode` switch, not multiple separate functions. This keeps cold-start surface and cost tracking centralized.

This project's functions are TypeScript (`functions/src/index.ts`, compiled with `tsc` — see `functions/tsconfig.json`), so use ES `import` syntax, not `require`. Note this replaces the existing v1-style `generateGameEndInsights` callable — migrate it to v2 `onCall` with the `mode` switch shown below rather than keeping both.

```typescript
// functions/src/index.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
admin.initializeApp();
const db = getFirestore();

const DAILY_LLM_LIMIT = 400; // ~3 calls x 120 participants + buffer
const PER_SESSION_LLM_LIMIT = 3;

export const nlpService = onCall(
  { secrets: ["ANTHROPIC_API_KEY"] }, // REQUIRED: binds the secret so process.env.ANTHROPIC_API_KEY is populated at runtime
  async (request) => {
    const { mode, payload, sessionId } = request.data;

    const allowedModes = ["generate_interview_q1", "generate_interview_q2", "generate_summary"];
    if (!allowedModes.includes(mode)) {
      throw new HttpsError("invalid-argument", "Unknown mode");
    }

    // ── Per-session cap (Rule 3, part 1) ──
    const sessionRef = db.doc(`sessions/${sessionId}`);
    const sessionSnap = await sessionRef.get();
    const sessionCallCount = sessionSnap.exists ? (sessionSnap.data()?.llmCallCount ?? 0) : 0;
    if (sessionCallCount >= PER_SESSION_LLM_LIMIT) {
      return buildFallback(mode, payload);
    }

    // ── Global daily cost control gate (Rule 3, part 2) ──
    const today = new Date().toISOString().split("T")[0];
    const usageRef = db.doc(`usage/${today}`);
    const usageSnap = await usageRef.get();
    const currentCount = usageSnap.exists ? usageSnap.data()?.count ?? 0 : 0;

    if (currentCount >= DAILY_LLM_LIMIT) {
      return buildFallback(mode, payload); // silent degrade, no error thrown to client
    }

    try {
      if (!process.env.ANTHROPIC_API_KEY) throw new Error("no_api_key");
      const result = await callClaude(mode, payload);
      await usageRef.set({ count: FieldValue.increment(1) }, { merge: true });
      await sessionRef.set({ llmCallCount: FieldValue.increment(1) }, { merge: true });
      return result;
    } catch (err) {
      console.error(`LLM call failed [${mode}]:`, (err as Error).message);
      return buildFallback(mode, payload);
    }
  }
);

async function callClaude(mode: string, payload: unknown) {
  // Use fetch to https://api.anthropic.com/v1/messages
  // model: "claude-sonnet-5" (check https://platform.claude.com/docs/en/docs/about-claude/models for the current recommended ID before deploying — model IDs are periodically deprecated)
  // max_tokens: 300
  // Build the prompt based on `mode`:
  //
  // generate_interview_q1:
  //   input: { choiceSummary: string }  e.g. "leaned toward avoidance in 6/15 scenes, high hesitation on social scenes"
  //   prompt: ask for ONE open-ended, warm, non-clinical reflective question based on the pattern
  //
  // generate_interview_q2 (final interview question, always the last LLM call before generate_summary):
  //   input: { previousQ: string, previousA: string }
  //   prompt: ask for ONE natural, adaptive follow-up question whose topic genuinely responds to what
  //           they said in `previousA` (not just an acknowledgment sentence bolted onto a fixed topic) —
  //           warm, conversational tone. This is the ONE place in the whole flow where question content
  //           is allowed to change based on a participant's own free-text words. The 5 in-game free-text
  //           prompts (Section 4) are static per-scene text and `generate_interview_q1` is pattern-based —
  //           neither of those adapts to prior free-text content, only `generate_interview_q2` does.
  //
  // generate_summary:
  //   input: { who5Predicted: number, swemwbsPredicted: number, interviewAnswers: string[] }
  //   prompt: ask for a short (80-120 word), warm, non-clinical well-being summary.
  //           MUST include a disclaimer sentence that this is not a diagnosis.
  //
  // Return shape: { question: string } or { summary: string }
}

function buildFallback(mode, payload) {
  const q1Bank = [
    "Looking back at your day, what part felt hardest to get through?",
    "Was there a moment today where you felt more like yourself than usual?",
    "What's something today that took more effort than it should have?",
    "If you could redo one moment from today, which would it be?",
  ];
  // Note: this fallback bank is necessarily generic/non-adaptive (it's a static array, no LLM call
  // happened) — it's an acceptable degradation of the real `generate_interview_q2` behavior, which
  // does genuinely adapt its topic to `previousA` when the LLM call succeeds.
  const q2Bank = [
    "Thanks for sharing that. Was there a moment today where you felt more like yourself than usual?",
    "I appreciate you telling me that. What's something today that took more effort than it should have?",
    "That makes sense. If you could redo one moment from today, which would it be?",
  ];
  const summaryFallback =
    "Thanks for playing through today's story. Based on your choices and reflections, it looks like you're managing a mix of ups and downs, which is completely normal for university life. This is not a clinical assessment, just a reflective snapshot. If anything felt heavier than usual, consider reaching out to someone you trust.";

  if (mode === "generate_interview_q1") {
    return { question: q1Bank[Math.floor(Math.random() * q1Bank.length)] };
  }
  if (mode === "generate_interview_q2") {
    return { question: q2Bank[Math.floor(Math.random() * q2Bank.length)] };
  }
  if (mode === "generate_summary") {
    return { summary: summaryFallback };
  }
}
```

**Copilot instructions for this file:**
- Implement `callClaude` using native `fetch`, not an SDK (keep dependencies minimal).
- Store `ANTHROPIC_API_KEY` via `firebase functions:secrets:set ANTHROPIC_API_KEY`, never hardcode it — and remember to add `secrets: ["ANTHROPIC_API_KEY"]` to the `onCall` options, or the secret won't be readable via `process.env` at runtime.
- Every LLM prompt must explicitly instruct the model to avoid clinical language, diagnosis, or alarming phrasing, and to keep responses under 3 sentences for questions, under 120 words for summaries.
- `generate_interview_q2` is a genuine adaptive follow-up — its topic should respond to `previousA`, not just acknowledge it. This is the only adaptive step in the whole flow: the 5 in-game free-text prompts and `generate_interview_q1` are fixed/pattern-based and never change based on prior free-text content.
- Wrap the entire `callClaude` body in try/catch; any failure must fall through to `buildFallback`, never throw to the client.
- Before deploying, update `firebase.json`'s `functions.runtime` from `nodejs18` (deprecated/decommissioned) to `nodejs20` or `nodejs22`.

---

## 4. In-Game Sentiment (Client-Side, No API Call)

At the 5 free-text scenes (3, 6, 10, 13, plus one more — `game_question_set.md` is marked "not finalised" and currently also lists scene 1; confirm the final 5th scene with the supervisor before locking this in), run sentiment analysis **locally in the browser**, not via a Cloud Function. Scene 11 is not one of the free-text scenes — it is the timed hesitation mini-game described in Section 5a.

```typescript
// src/utils/sentiment.ts
import Sentiment from 'sentiment';
const analyzer = new Sentiment();

export function scoreText(text: string) {
  if (!text || text.trim().length === 0) return null;
  const result = analyzer.analyze(text);
  return {
    score: result.score,
    comparative: result.comparative, // this is what gets stored
  };
}
```

Add `sentiment` (and `@types/sentiment` for TypeScript) to `frontend/package.json` — it isn't installed yet.

Store only `comparative` in Firestore under `freeTexts.scene_XX.sentimentScore`. Do not store `result.words`, `result.positive`, `result.negative` arrays — keep the write minimal.

---

## 5a. Already Implemented: Scene 11 Hesitation Mini-Game (Narrative-Embedded)

The 15-scene narrative frontend already includes a decisional-hesitation mechanic at Scene 11, built directly into `scenarios.ts` / `Game.tsx` / `gameStore.ts` — this is **not** the Section 5 "Hold to Focus" task below and does not need to be built; it's documented here so the schema and backend code stay consistent with what the client actually sends.

- Scene 11 shows only **2 visible choices** (instead of the usual 5). A visible countdown/progress bar gives the player a fixed time limit (`timedChoice.limitMs`, currently 6000ms) to pick one.
- If the player doesn't choose in time, the scene auto-advances with a **hidden third outcome**: a synthetic choice recorded with `timedChoice.timeoutWeight` (currently `-2`) and `timeMs` equal to the limit. Participants never see this third option exists.
- Every scene (not just Scene 11) passively records a per-scene reaction time via `gameStore.recordReactionTime`; `gameStore.medianReactionTime()` computes the participant's own running median pace. This baseline is what makes Scene 11's hesitation meaningful relative to *that individual's* normal response speed, rather than a fixed global cutoff.
- When wiring Firestore writes (Section 6), persist Scene 11's outcome under `choices.scene_11` like any other scene (including the timed-out case), and consider also writing the running reaction-time baseline (e.g. `reactionTimes: { scene_XX: ms }` or a rolling median) alongside `choices` so this signal isn't lost.
- Open item, not resolved by this guide: whether the Section 5 "Hold to Focus" motor-inhibition task and this decisional-hesitation mechanic both ship (they measure different constructs — motor/attentional RT vs. decisional avoidance under time pressure), or whether one should be dropped for scope reasons. Confirm with your supervisor before building Section 5.

---

## 5. Mini-Game: Response Inhibition Task

### Design Spec

The mini-game measures **cognitive control under load**: the player holds an action, gets an unpredictable stop cue, and their reaction time to that cue is the signal.

**Mechanic:** "Hold to Focus" bar.

1. A progress bar fills while the player holds down a button (mouse) or presses-and-holds a touch target (mobile).
2. At a **randomised point between 45% and 80%** of the fill, a visual + short vibration/audio cue fires ("STOP" flashes, bar turns red).
3. The player must release as fast as possible.
4. Reaction time = `releaseTimestamp - cueTimestamp`, in milliseconds.
5. If they release *before* the cue (impatient) or don't release within 1000ms after the cue (missed), flag the trial as invalid but still store the raw time with a flag.

**Embed 3 mini-games total**, placed right after emotionally loaded narrative scenes (e.g., after the group conflict scene, after the assignment-block scene, after the quiet-worry scene). Do not place them back-to-back — space them out across the narrative.

### Implementation Skeleton

> **Note:** `phase` is tracked in a `ref`, not read from `useState` inside the `requestAnimationFrame` loop. Deriving the loop's branching logic from state via a `useCallback([phase])` chain (as an earlier draft of this guide did) creates a stale-closure bug — `tick`/`startHold` end up capturing the `phase` value from when they were created, not the live value, so the cue transition can be missed. Use a ref for anything read inside `tick`, and `setPhase` only to drive rendering.

```tsx
// src/components/MiniGame.tsx
import { useState, useRef, useCallback, useEffect } from 'react';

const FILL_DURATION_MS = 2200; // time to fill 100% if never released
const CUE_MIN_PCT = 0.45;
const CUE_MAX_PCT = 0.80;

type Phase = 'idle' | 'filling' | 'cued' | 'done';

interface MiniGameProps {
  sceneContext: string;
  onComplete: (result: { reactionTimeMs: number; valid: boolean; sceneContext: string }) => void;
}

export default function MiniGame({ sceneContext, onComplete }: MiniGameProps) {
  const [phase, setPhase] = useState<Phase>('idle'); // drives rendering only
  const [progress, setProgress] = useState(0);
  const phaseRef = useRef<Phase>('idle'); // read inside the rAF loop — always current
  const startTimeRef = useRef<number | null>(null);
  const cueTimeRef = useRef<number | null>(null);
  const cueThresholdRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const setPhaseSynced = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const tick = useCallback(() => {
    const elapsed = performance.now() - (startTimeRef.current ?? 0);
    const pct = Math.min(elapsed / FILL_DURATION_MS, 1);
    setProgress(pct);

    if (phaseRef.current !== 'cued' && pct >= (cueThresholdRef.current ?? 1)) {
      cueTimeRef.current = performance.now();
      setPhaseSynced('cued'); // triggers the STOP visual in render
    }
    if (pct < 1) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [setPhaseSynced]);

  const startHold = useCallback(() => {
    startTimeRef.current = performance.now();
    cueThresholdRef.current = CUE_MIN_PCT + Math.random() * (CUE_MAX_PCT - CUE_MIN_PCT);
    setPhaseSynced('filling');
    rafRef.current = requestAnimationFrame(tick);
  }, [setPhaseSynced, tick]);

  const release = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const releaseTime = performance.now();

    let reactionTimeMs: number;
    let valid = true;

    if (phaseRef.current === 'cued' && cueTimeRef.current !== null) {
      reactionTimeMs = releaseTime - cueTimeRef.current;
    } else {
      // released before cue fired — invalid trial, still record
      valid = false;
      reactionTimeMs = -1;
    }

    setPhaseSynced('done');
    onComplete({ reactionTimeMs, valid, sceneContext });
  }, [onComplete, sceneContext, setPhaseSynced]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // Render: a bar that fills, turns red + "STOP" text when phase === 'cued'
  // Bind startHold to onMouseDown/onTouchStart, release to onMouseUp/onTouchEnd
  // IMPORTANT: also handle onMouseLeave/onTouchCancel as an early release (valid=false)
}
```

**Copilot instructions for this component:**
- Use `performance.now()`, never `Date.now()`, for anything reaction-time related — it's higher precision and monotonic.
- Use `requestAnimationFrame`, not `setInterval`, for the fill animation.
- Read `phase` from a ref inside the rAF loop (`phaseRef`), not from React state directly, to avoid stale-closure bugs across animation frames.
- The visual/haptic cue must be unambiguous: color change AND text change AND (on mobile) `navigator.vibrate(80)` if available (note: iOS Safari does not support the Vibration API at all — treat it as a progressive enhancement, not a dependency).
- Do not let the player see the fill speed varies across trials in a way that lets them "learn" the cue timing — the 45–80% randomisation already handles this, just don't add any pattern like always increasing.
- After all 3 mini-games are done, write to Firestore under `minigames.mg_0X` immediately after each one completes (see Section 6 on incremental writes), not batched at the end.

---

## 6. Critical: Incremental Firestore Writes

Because participants will be reached via WhatsApp links with no supervision, many will abandon mid-session. **Never wait until the end to write to Firestore.** Write after every single scene, choice, mini-game, and free-text entry, using `set(..., { merge: true })`.

```typescript
// src/services/firestoreSession.ts
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export async function saveSceneChoice(sessionId: string, sceneId: string, choiceData: unknown) {
  const ref = doc(db, 'sessions', sessionId);
  await setDoc(ref, {
    choices: { [sceneId]: choiceData },
    currentScene: sceneId,
    status: 'in_progress',
  }, { merge: true });
}

export async function markCompleted(sessionId: string) {
  const ref = doc(db, 'sessions', sessionId);
  await setDoc(ref, {
    status: 'completed',
    completedAt: serverTimestamp(),
  }, { merge: true });
}
```

At the very start of a session (right after consent), create the document immediately with `status: 'in_progress'` and `createdAt: serverTimestamp()`. This means even a one-scene dropout is captured and can be filtered out later during analysis rather than silently lost.

---

## 7. Ground-Truth Questionnaire (Post-Narrative)

Immediately after the AI interview + well-being summary screen, present the actual WHO-5 and SWEMWBS questionnaires.

**Copilot instructions:**
- Build this as a standard multi-item Likert form. WHO-5: 5 items, 6-point scale (0–5). SWEMWBS: 7 items, 5-point scale (1–5).
- Calculate `totalScore` client-side using the standard formulas (WHO-5: sum × 4, range 0–100; SWEMWBS: raw sum, range 7–35, or apply the official conversion table if implementing the metric version) and store both raw item scores and the total.
- This questionnaire must **not** be skippable — disable the "finish" button until all items are answered.
- Frame this screen clearly and separately from the narrative: different visual style (plain, form-like, not story-styled) so participants understand this part is a direct self-report, not part of the game fiction.

---

## 8. Design & UX Requirements

### 8.1 Consent Screen (Build First)
- This is the app's actual entry route (`/`). The narrative game only becomes reachable after consent is given.
- Must state in plain language: what the study is, that it's anonymous, that it's voluntary, roughly how long it takes, and that they can stop anytime.
- A single checkbox + "I agree and want to continue" button. No pre-checked boxes.
- On agreement, immediately create the Firestore session document with `consentGiven: true`.

### 8.2 Visual Tone
- Calm, warm, non-clinical. Avoid anything that looks like a hospital form or a corporate survey tool.
- Avoid red/alarm colors except specifically for the mini-game's STOP cue (which needs to be jarring on purpose).
- Use soft, rounded UI elements; avoid harsh borders.
- Typography should feel narrative/story-like during the game (serif or warm sans-serif), and switch to a plainer, more form-like font during the ground-truth questionnaire, reinforcing that it's a different type of interaction.

### 8.3 Progress Indication
- Show a subtle, non-numeric progress indicator during the narrative (e.g., a soft progress bar, not "Scene 7 of 15" — avoid making participants feel like they're being tested or timed).
- The ground-truth questionnaire, by contrast, CAN show a clear "Section 2 of 2 — 8 of 12 questions answered" since that section is explicitly a self-report, not implicit measurement.

### 8.4 Completion Screen
- A clear, warm thank-you message once everything (narrative + interview + summary + questionnaire) is done.
- Include the well-being summary here.
- Include a static, non-dynamic line: "This is not a clinical assessment and does not replace professional support. If anything felt difficult today, consider reaching out to someone you trust."
- No further action possible after this screen (don't let them replay and submit multiple sessions from the same link session).

### 8.5 Device Type Capture
- On session creation, store a coarse `deviceType: "mobile" | "desktop"` using a simple viewport-width or `navigator.userAgentData` check. This is for the timing-confound limitation noted in your methodology, not for anything else. Do not collect full user-agent strings.

---

## 9. What NOT to Build Right Now

To keep scope controlled given the timeline, do **not** implement any of the following in this phase:
- The offline MentalBERT / HuggingFace pipeline — that runs later, in Python, after data collection ends. It is not part of the web app.
- The Random Forest / Gradient Boosting fusion model — also a post-collection, offline Python task.
- Any admin dashboard or data visualization for you to monitor responses live. A simple Firestore console check or a basic count query is enough for now.
- User accounts, login, or any persistent identity across sessions.

---

## 10. Suggested Build Order for This Phase

1. Firestore schema + security rules
2. Consent screen + session creation on agreement
3. Incremental save wiring for the existing 15 scenes (retrofit if not already saving per-scene)
4. Mini-game component, tested in isolation, then embedded at 3 narrative points
5. In-game sentiment scoring (client-side, `sentiment` package)
6. Firebase Function (`nlpService`) with all 3 modes + fallback logic
7. Post-game AI interview flow (2-question sequence: `generate_interview_q1` is pattern-based, `generate_interview_q2` is a genuine adaptive follow-up to the q1 answer)
8. Well-being summary screen (calls `generate_summary` mode)
9. Ground-truth questionnaire (WHO-5 + SWEMWBS forms)
10. Completion screen
11. Full end-to-end test: play through as a participant would, then verify the Firestore document looks exactly like the schema in Section 2, with no missing or malformed fields
12. Test the abandonment case: start a session, close the tab halfway, confirm `status` stays `in_progress` and partial data is present, not lost

---

## 11. Definition of Done for This Phase

- [ ] A participant can open the link, give consent, play all 15 scenes, hit all 3 mini-games, answer the 5 free-text prompts, go through the 2-question AI interview, read their summary, complete both questionnaires, and see a completion screen — all in one uninterrupted flow.
- [ ] Every write to Firestore matches the schema in Section 2 exactly.
- [ ] Closing the tab at any point leaves a valid partial document, not an error or a corrupted write.
- [ ] The LLM Function never throws a visible error to the client — it always returns either a real response or a fallback.
- [ ] No scale-to-choice mapping is visible in browser DevTools (Sources, Console, or Network tabs).
- [ ] The daily LLM call counter increments correctly and the fallback kicks in when a test-forced limit is hit.
- [ ] Tested on both a mobile viewport and a desktop viewport.
