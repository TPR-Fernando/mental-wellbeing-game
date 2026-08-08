// ── Continuous ambient audio ─────────────────────────────────────────
// A crossfading mixer keeps a smooth, uninterrupted soundtrack flowing
// across the whole participant flow (Home → Warning → Scenes → Summary →
// Questionnaire → Completion). The audio is never hard-stopped or
// restarted: when a scene's mood changes we duck the outgoing track down
// (e.g. keep morning running but reduce it) while the new mood fades in,
// then ease back, so there is always a continuous, gentle flow.
//
// Tracks (files provided by the researcher in frontend/public/music/):
//   alarm.mp3  -> scene 1                      morning.mp3 -> daytime / campus scenes
//   busy.mp3   -> social & pressure scenes      night.mp3  -> winding-down scenes
//
// Each track gets its own looping <audio> element and a fade engine
// animates their volumes. Inside a scene its track fades up to the
// foreground level; between pages we crossfade to a quiet default
// (morning) so nothing ever cuts to silence. Every element keeps playing
// contiguously — a non-foreground track is simply reduced to ZERO volume,
// never paused or restarted, so when its mood returns it fades back up
// from where it actually is. Track files differ in loudness, so a per-
// track gain steers each one to a consistent level: morning (the loudest)
// is reduced the most, busy & night a little, and alarm is unchanged.
// Scene 1 layers morning under the alarm. If a scene's file is missing it
// falls back to morning.mp3. Browsers block autoplay, so audio is
// unlocked on a user gesture (Home "Begin Your Day" / Warning "Continue").

type TrackKey = 'alarm' | 'morning' | 'busy' | 'night';
const TRACK_KEYS: TrackKey[] = ['alarm', 'morning', 'busy', 'night'];

// Scene id -> audio type. Only the foreground track changes when the type
// changes; consecutive same-type scenes reuse the same looping file.
const SCENE_TRACKS: Record<number, TrackKey> = {
  1: 'alarm',
  2: 'morning', 3: 'morning', 4: 'morning', 5: 'morning',
  6: 'busy',
  7: 'morning',
  8: 'busy',
  9: 'morning',
  10: 'busy', 11: 'busy',
  12: 'busy',
  13: 'night', 14: 'night', 15: 'night',
};

const TRACK_FILES: Record<TrackKey, string> = {
  alarm: 'alarm.mp3',
  morning: 'morning.mp3',
  busy: 'busy.mp3',
  night: 'night.mp3',
};

const FALLBACK_FILE = 'morning.mp3';
const DEFAULT_AMBIENT: TrackKey = 'morning'; // gentle track used on non-scene pages

const STORAGE_KEY = 'ambientMusicEnabled';
const BASE = import.meta.env.BASE_URL;

// Mixer levels & timing.
const SCENE_VOLUME = 0.3;   // alarm level (kept as-is); base for other tracks
const IDLE_VOLUME = 0.4;    // non-scene pages (audio clearly audible, not muted)
const CROSSFADE_MS = 2400;  // how long a mood transition takes
const SETTLE_EPS = 0.0015;  // volume considered "arrived"

// Per-track loudness correction so every mood sits at a consistent level.
// morning.mp3 is the loudest -> reduced the most; busy & night eased down a
// little (yet still clearly audible); alarm.mp3 volume is NOT changed.
const TRACK_GAIN: Record<TrackKey, number> = {
  alarm: 1.0,   // keep as-is
  morning: 0.5, // loudest -> cut the most
  busy: 0.8,    // a bit quieter, still clear
  night: 0.8,   // a bit quieter, still clear
};


// One looping element per track key, so overlapping tracks can crossfade.
const elements = new Map<TrackKey, HTMLAudioElement>();

// Current and target mix volume per track (0..1 applied to element.volume).
const volumes: Record<TrackKey, number> = { alarm: 0, morning: 0, busy: 0, night: 0 };
const targets: Record<TrackKey, number> = { alarm: 0, morning: 0, busy: 0, night: 0 };

let available = true;               // whether morning is playable
let enabled = loadPreference();
let activeScene: number | null = null; // null = not inside a game scene
let rafId: number | null = null;    // fade-engine handle
let lastTickAt = 0;

function loadPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

function persistPreference(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off');
  } catch {
    /* private mode etc. — non-fatal */
  }
}

function hasStoredPreference(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'on' || v === 'off';
  } catch {
    return false;
  }
}

function resolveSrc(file: string): string {
  return `${BASE}music/${file}`;
}

/** Get (creating on demand) the looping element for a track, with fallback. */
function ensureElement(key: TrackKey): HTMLAudioElement | null {
  const existing = elements.get(key);
  if (existing) return existing;
  try {
    const el = new Audio();
    el.loop = true;
    el.preload = 'auto';
    el.volume = volumes[key];
    el.onerror = () => {
      if (key !== 'morning') {
        // Missing this mood's file — fall back to morning.mp3 on this element.
        el.src = resolveSrc(FALLBACK_FILE);
      } else {
        available = false; // even the fallback is missing → stay silent
      }
    };
    el.src = resolveSrc(TRACK_FILES[key]);
    elements.set(key, el);
  } catch {
    available = false;
  }
  return elements.get(key) ?? null;
}

/** One rAF step: ease every volume toward its target. Tracks never pause —
 * a non-foreground track is simply ducked to zero volume and keeps looping,
 * so it can fade back up from where it actually is without ever restarting. */
function tick(now: number): void {
  const dt = Math.min(now - lastTickAt, 150);
  lastTickAt = now;
  const k = 1 - Math.exp(-dt / (CROSSFADE_MS / 3)); // smooth approach
  let moving = false;

  for (const key of TRACK_KEYS) {
    const t = targets[key];
    const cur = volumes[key];
    let next: number;
    if (Math.abs(cur - t) < SETTLE_EPS) {
      next = t;
    } else {
      next = cur + (t - cur) * k;
      moving = true;
    }
    volumes[key] = next;
    const el = elements.get(key);
    if (el) el.volume = next; // may be 0 ("reduced to zero") — still playing
  }

  rafId = moving ? requestAnimationFrame(tick) : null;
}

function ensureFadeLoop(): void {
  if (rafId == null) {
    lastTickAt = performance.now();
    rafId = requestAnimationFrame(tick);
  }
}

/**
 * Set the target mix. Every listed track eases toward its target (fade in /
 * duck / crossfade); tracks not listed keep their current target. When the
 * music is toggled off the whole mix gently fades to silence.
 */
function applyMix(next: Partial<Record<TrackKey, number>>): void {
  for (const key of TRACK_KEYS) {
    if (next[key] !== undefined) {
      targets[key] = enabled ? next[key]! : 0;
    }
  }
  // Make sure any foreground track is actually playing. (Elements are never
  // paused once unlocked, so this mainly covers the very first start.)
  for (const key of TRACK_KEYS) {
    if (targets[key] > 0) {
      const el = ensureElement(key);
      if (el && el.paused) el.play().catch(() => undefined);
    }
  }
  ensureFadeLoop();
}

/** Effective foreground volume for a track, after its loudness correction. */
function trackVolume(key: TrackKey): number {
  return SCENE_VOLUME * TRACK_GAIN[key];
}

/** Idle (non-scene) morning level, after its loudness correction. */
function idleMorningVolume(): number {
  return IDLE_VOLUME * TRACK_GAIN.morning;
}

/**
 * Point the foreground mix at a scene (its mood track at full volume) or at
 * the gentle default for non-scene pages — always crossfading, never stopping.
 * Scene 1 layers morning quietly under the (unchanged) alarm.
 */
function routeTo(sceneId: number | null): void {
  activeScene = sceneId;

  if (sceneId === 1) {
    // Alarm up front, alarm.mp3 untouched; morning sits underneath at its idle level.
    applyMix({
      alarm: trackVolume('alarm'),
      [DEFAULT_AMBIENT]: idleMorningVolume(),
      busy: 0,
      night: 0,
    });
    return;
  }

  if (sceneId != null && SCENE_TRACKS[sceneId]) {
    const key = SCENE_TRACKS[sceneId];
    applyMix({ alarm: 0, morning: 0, busy: 0, night: 0, [key]: trackVolume(key) });
  } else {
    // Continuous flow: outside the game keep a gentle default track playing
    // so the soundtrack never cuts to silence.
    applyMix({ alarm: 0, [DEFAULT_AMBIENT]: idleMorningVolume(), busy: 0, night: 0 });
  }
}

/** Is the participant's music preference currently "on"? */
export function isAmbientMusicEnabled(): boolean {
  return enabled;
}

/** Has a usable track loaded? (false when no audio is present at all) */
export function isAmbientMusicAvailable(): boolean {
  return available;
}

/**
 * Call on every game-scene change. Pass the scene id to foreground that
 * scene's mood (crossfading from whatever is playing); pass null for the
 * interstitial pages, which keep the gentle default flowing instead of
 * going silent.
 */
export function setAmbientScene(sceneId: number | null): void {
  routeTo(sceneId);
}

/**
 * Start downloading every track up front — no user gesture is required for
 * loading (only play() is gated by browsers). This guarantees the busy and
 * night moods are already in the HTTP cache by the time their scenes arrive,
 * so the crossfade is instant instead of stalling while a multi-MB file
 * downloads mid-session (which made the music seem to "never change").
 * Elements are created silently at volume 0 and stay paused.
 */
export function preloadAmbientMusic(): void {
  for (const key of TRACK_KEYS) {
    ensureElement(key);
  }
}

/**
 * Call inside a real user gesture (Home "Begin Your Day" or Warning
 * "Continue"). Unlocks the audio engine, sets music on by default if the
 * participant hasn't chosen, and starts the continuous ambient mix (the
 * gentle default on these early pages, the scene's track once a scene loads).
 */
export function prepareAmbientAudio(): void {
  if (!hasStoredPreference()) {
    enabled = true;
    persistPreference(true);
  }
  // Briefly play EVERY track at zero volume so each element is unlocked for
  // later play() calls (browsers require a user gesture per element; touching
  // all four here lets any mood's track start once its scene loads).
  for (const key of TRACK_KEYS) {
    const el = ensureElement(key);
    if (!el) continue;
    const prevVol = el.volume;
    el.volume = 0;
    el.play()?.then(() => {
      el.volume = prevVol;
    }).catch(() => {
      el.volume = prevVol;
    });
  }
  // Start the continuous mix (idle morning on non-scene pages; the scene
  // tracks will be routed in when the game loads).
  routeTo(activeScene);
}

/** Flip the preference and apply it (fade to silence / back). Returns new state. */
export function toggleAmbientMusic(): boolean {
  enabled = !enabled;
  persistPreference(enabled);
  if (enabled) {
    routeTo(activeScene); // resume the current foreground mix
  } else {
    applyMix({ alarm: 0, morning: 0, busy: 0, night: 0 }); // gently fade to silence
  }
  window.dispatchEvent(new Event('ambient-music-change'));
  return enabled;
}

