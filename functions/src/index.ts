import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";
admin.initializeApp();
const db = getFirestore();

// See COPILOT_BUILD_GUIDE.md Section 3 and Rule 3: a per-session gate AND a separate
// global per-day gate, checked before every LLM call.
const DAILY_LLM_LIMIT = 400; // ~3 calls x 120 participants + buffer
const PER_SESSION_LLM_LIMIT = 3;

// Check https://ai.google.dev/models for the current recommended model ID.
// gemini-3.x models aren't yet published to this project's Vertex AI catalog (404 NOT_FOUND);
// gemini-2.5-flash is confirmed available and stable there.
const GEMINI_MODEL = "gemini-2.5-flash";
// Vertex AI region; must match a region where the model is available.
const VERTEX_LOCATION = "us-central1";

type Mode = "generate_interview_q1" | "generate_interview_q2" | "generate_summary";

const ALLOWED_MODES: Mode[] = ["generate_interview_q1", "generate_interview_q2", "generate_summary"];

export const nlpService = onCall(
  async (request) => {
    const { mode, payload, sessionId } = request.data as {
      mode: Mode;
      payload: unknown;
      sessionId: string;
    };

    if (!ALLOWED_MODES.includes(mode)) {
      throw new HttpsError("invalid-argument", "Unknown mode");
    }
    if (!sessionId || typeof sessionId !== "string") {
      throw new HttpsError("invalid-argument", "Missing sessionId");
    }

    // ── Per-session cap (Rule 3, part 1) ──
    const sessionRef = db.doc(`sessions/${sessionId}`);
    const sessionSnap = await sessionRef.get();
    const sessionCallCount = sessionSnap.exists ? sessionSnap.data()?.llmCallCount ?? 0 : 0;
    if (sessionCallCount >= PER_SESSION_LLM_LIMIT) {
      return buildFallback(mode);
    }

    // ── Global daily cost control gate (Rule 3, part 2) ──
    const today = new Date().toISOString().split("T")[0];
    const usageRef = db.doc(`usage/${today}`);
    const usageSnap = await usageRef.get();
    const currentCount = usageSnap.exists ? usageSnap.data()?.count ?? 0 : 0;

    if (currentCount >= DAILY_LLM_LIMIT) {
      return buildFallback(mode); // silent degrade, no error thrown to client
    }

    try {
      const result = await callGemini(mode, payload);
      await usageRef.set({ count: FieldValue.increment(1) }, { merge: true });
      await sessionRef.set({ llmCallCount: FieldValue.increment(1) }, { merge: true });
      return result;
    } catch (err) {
      console.error(`LLM call failed [${mode}]:`, (err as Error).message);
      return buildFallback(mode);
    }
  }
);

async function callGemini(mode: Mode, payload: unknown): Promise<{ question?: string; summary?: string }> {
  const commonInstruction =
    "Avoid clinical language, diagnosis, or alarming phrasing. Keep the tone warm and non-clinical.";

  let userPrompt: string;
  let maxWords: string;

  if (mode === "generate_interview_q1") {
    const { choiceSummary } = payload as { choiceSummary: string };
    userPrompt =
      `A participant just finished an interactive story about a student's day. Here is a pattern ` +
      `summary of their choices: "${choiceSummary}". Ask ONE open-ended, warm, non-clinical reflective ` +
      `question based on this pattern. ${commonInstruction} Keep it under 3 sentences. ` +
      `Respond with ONLY the question text, nothing else.`;
    maxWords = "under 3 sentences";
  } else if (mode === "generate_interview_q2") {
    const { previousQ, previousA } = payload as { previousQ: string; previousA: string };
    userPrompt =
      `You previously asked: "${previousQ}" and the participant answered: "${previousA}". ` +
      `Ask ONE natural, adaptive follow-up question whose topic genuinely responds to what they said ` +
      `(not just an acknowledgment sentence bolted onto a fixed topic). ${commonInstruction} ` +
      `Keep it under 3 sentences. Respond with ONLY the question text, nothing else.`;
    maxWords = "under 3 sentences";
  } else {
    const { who5Predicted, swemwbsPredicted, interviewAnswers, choiceSummary, miniGameSummary, reactionTimeSummary } = payload as {
      who5Predicted: number;
      swemwbsPredicted: number;
      interviewAnswers: string[];
      choiceSummary?: string;
      miniGameSummary?: string;
      reactionTimeSummary?: string;
    };

    const behavioralContext = [
      choiceSummary ? `Story choices: ${choiceSummary}` : null,
      miniGameSummary ? `Mini-game responses: ${miniGameSummary}` : null,
      reactionTimeSummary ? `Response timing: ${reactionTimeSummary}` : null,
    ].filter(Boolean).join('. ');

    userPrompt =
      `Write a short (80-120 word), warm, non-clinical well-being summary for a participant who just ` +
      `finished an interactive narrative about a student's day and a brief reflective interview. ` +
      `Behavioural data from their session: ${behavioralContext}. ` +
      `Predicted well-being indicators: WHO-5 score ${Math.round(who5Predicted)}/100, SWEMWBS score ${Math.round(swemwbsPredicted)}/35. ` +
      `Their interview reflections: ${interviewAnswers.map((a, i) => `(${i + 1}) ${a}`).join(" ")}. ` +
      `${commonInstruction} Personalise the summary to their specific patterns above. ` +
      `MUST include a sentence explicitly stating this is not a diagnosis. ` +
      `Respond with ONLY the summary text, nothing else.`;
    maxWords = "80-120 words";
  }

  // Authenticates via the Cloud Function's own service account (ADC), so no manual key is needed.
  const ai = new GoogleGenAI({
    vertexai: true,
    project: process.env.GCLOUD_PROJECT,
    location: VERTEX_LOCATION,
  });
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: `${userPrompt} Keep the response ${maxWords}.`,
    config: {
      maxOutputTokens: 500,
      // Disabled: this is short-form text generation, not a reasoning task, and thinking
      // tokens were eating the output budget and truncating responses mid-sentence.
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const text = response.text?.trim();
  if (!text) throw new Error("empty_response");

  if (mode === "generate_summary") {
    return { summary: text };
  }
  return { question: text };
}

function buildFallback(mode: Mode): { question?: string; summary?: string } {
  const q1Bank = [
    "Looking back at your day, what part felt hardest to get through?",
    "Was there a moment today where you felt more like yourself than usual?",
    "What's something today that took more effort than it should have?",
    "If you could redo one moment from today, which would it be?",
  ];
  // Note: this fallback bank is necessarily generic/non-adaptive (it's a static array, no LLM call
  // happened) — an acceptable degradation of the real generate_interview_q2 behavior, which does
  // genuinely adapt its topic to the participant's previous answer when the LLM call succeeds.
  const q2Bank = [
    "Thanks for sharing that. Was there a moment today where you felt more like yourself than usual?",
    "I appreciate you telling me that. What's something today that took more effort than it should have?",
    "That makes sense. If you could redo one moment from today, which would it be?",
  ];
  const summaryFallback =
    "Thanks for playing through today's story. Based on your choices and reflections, it looks like " +
    "you're managing a mix of ups and downs, which is completely normal for university life. This is " +
    "not a clinical assessment, just a reflective snapshot. If anything felt heavier than usual, " +
    "consider reaching out to someone you trust.";

  if (mode === "generate_interview_q1") {
    return { question: q1Bank[Math.floor(Math.random() * q1Bank.length)] };
  }
  if (mode === "generate_interview_q2") {
    return { question: q2Bank[Math.floor(Math.random() * q2Bank.length)] };
  }
  return { summary: summaryFallback };
}
