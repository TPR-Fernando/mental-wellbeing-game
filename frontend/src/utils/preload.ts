import { scenarioImages } from '../data/scenarioImages';

// URLs already requested — dedupes mount-time preload windows and the in-game
// sliding window so nothing is ever fetched twice.
const requested = new Set<string>();

/**
 * Kick off a background fetch for an image URL so it is already in the HTTP
 * cache by the time the browser needs to paint it. Safe to call anywhere and
 * any number of times. Loading is not gated by a user gesture.
 */
export function preloadImage(src: string | undefined | null): void {
  if (!src || requested.has(src)) return;
  requested.add(src);
  const img = new Image();
  img.decoding = 'async';
  try {
    // Low priority: never competes with the JS/CSS that renders the page,
    // it just warms the cache while the participant reads.
    (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = 'low';
  } catch {
    /* older browsers ignore fetchPriority */
  }
  img.src = src;
}

/** Preload a window of scenario backdrop images by scene id (1-based). */
export function preloadScenarioImages(ids: number[]): void {
  for (const id of ids) {
    preloadImage(scenarioImages[id]);
  }
}