import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

// All LLM calls go through this single Cloud Function — never called directly from the
// client to a third-party API. See COPILOT_BUILD_GUIDE.md Section 3.
const callNlpService = httpsCallable(functions, 'nlpService');

// Client-side fallbacks in case the callable itself is unreachable (e.g. participant is
// offline) — the Cloud Function has its own server-side fallback for LLM/rate-limit
// failures, but a network failure reaching the function at all needs a local backstop too,
// per COPILOT_BUILD_GUIDE.md Rule 4 (no screen may ever show a blank page or hang).
const LOCAL_Q1_FALLBACK = "Looking back at your day, what part felt hardest to get through?";
const LOCAL_Q2_FALLBACK =
  "Thanks for sharing that. Was there a moment today where you felt more like yourself than usual?";
const LOCAL_SUMMARY_FALLBACK =
  "Thanks for playing through today's story. Based on your choices and reflections, it looks like " +
  "you're managing a mix of ups and downs, which is completely normal for university life. This is " +
  "not a clinical assessment, just a reflective snapshot. If anything felt heavier than usual, " +
  "consider reaching out to someone you trust.";

export async function generateInterviewQ1(sessionId: string, choiceSummary: string): Promise<string> {
  try {
    const result = await callNlpService({
      mode: 'generate_interview_q1',
      sessionId,
      payload: { choiceSummary },
    });
    return (result.data as { question?: string }).question ?? LOCAL_Q1_FALLBACK;
  } catch (err) {
    console.error('generate_interview_q1 failed:', err);
    return LOCAL_Q1_FALLBACK;
  }
}

export async function generateInterviewQ2(
  sessionId: string,
  previousQ: string,
  previousA: string,
): Promise<string> {
  try {
    const result = await callNlpService({
      mode: 'generate_interview_q2',
      sessionId,
      payload: { previousQ, previousA },
    });
    return (result.data as { question?: string }).question ?? LOCAL_Q2_FALLBACK;
  } catch (err) {
    console.error('generate_interview_q2 failed:', err);
    return LOCAL_Q2_FALLBACK;
  }
}

export async function generateSummary(
  sessionId: string,
  who5Predicted: number,
  swemwbsPredicted: number,
  interviewAnswers: string[],
): Promise<string> {
  try {
    const result = await callNlpService({
      mode: 'generate_summary',
      sessionId,
      payload: { who5Predicted, swemwbsPredicted, interviewAnswers },
    });
    return (result.data as { summary?: string }).summary ?? LOCAL_SUMMARY_FALLBACK;
  } catch (err) {
    console.error('generate_summary failed:', err);
    return LOCAL_SUMMARY_FALLBACK;
  }
}
