import Sentiment from 'sentiment';

const analyzer = new Sentiment();

// Runs locally in the browser (no API call) per COPILOT_BUILD_GUIDE.md Section 4.
// Only `comparative` is persisted to Firestore — never the raw word lists.
export function scoreText(text: string): number | null {
  if (!text || text.trim().length === 0) return null;
  const result = analyzer.analyze(text);
  return result.comparative;
}
