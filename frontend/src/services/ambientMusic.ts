// ── Continuous ambient audio (iOS-safe, layered) ────────────────────────
// Architecture: ONE continuous background track (morning.mp3 = the "main"
// track) loops for the whole session and is NEVER paused or restarted. A
// second element plays the "secondary" tracks (alarm / busy / night) ON TOP
// when a scene calls for them. Each element feeds its own Web Audio GainNode,
// so the main track can be smoothly ducked while a secondary plays and then
// smoothly brought back up — resuming from wherever it currently is.
//
// Requirements this design satisfies:
//   1. main (morning.mp3) loops for the entire session — never stopped/restarted.
//   2. When a secondary track plays, main is smoothly faded to 0 (not paused),
//      the secondary plays, then main fades back up once the secondary ends —
//      picking up from its current position, not the start.
//   3. EXCEPTION — Scene 1: main and alarm play TOGETHER at the same time,
//      main is NOT ducked.
//   4. Every volume change is a smooth exponential fade, never an instant cut.
//
// Why Web Audio gain (not el.volume): iOS ignores HTMLMediaElement.volume (it
// always reads as 1) and ignores el.muted timing, so fades are done in the
// audio graph with setTargetAtTime — which IS honoured on iOS. Each element
// gets its own GainNode and they all sum into the destination, so we can duck
// one stream while keeping another audible.
//
// Tracks (files provided by the researcher in frontend/public/music/):
//   morning.mp3 -> MAIN / continuous background (and simple daytime scenes)
//   alarm.mp3   -> scene 1, layered with main (not ducked)
//   busy.mp3    -> social & pressure scenes (6, 8, 10, 11, 12)
//   night.mp3   -> winding-down scenes (13, 14, 15)
//
// The audio engine is only unlocked on a real user gesture (Warning
// "I Understand, Continue").

type TrackKey = 'alarm' | 'morning' | 'busy' | 'night';
type SecondaryKey = 'alarm' | 'busy' | 'night'; // the 3 tracks layered over main

const TRACK_FILES: Record<TrackKey, string> = {
  alarm: 'alarm.mp3',
  morning: 'morning.mp3',
  busy: 'busy.mp3',
  night: 'night.mp3',
};
const MAIN_FILE = TRACK_FILES.morning; // the permanent background track

const SECONDARY_KEYS: SecondaryKey[] = ['alarm', 'busy', 'night'];

// Scene id -> which secondary track layers over main (if any). Scenes missing
// from this map (daytime 2,3,4,5,7,9 and null / interstitial pages) play ONLY
// the main background track.
const SCENE_SECONDARY: Partial<Record<number, SecondaryKey>> = {
  1: 'alarm',
  6: 'busy', 8: 'busy', 10: 'busy', 11: 'busy', 12: 'busy',
  13: 'night', 14: 'night', 15: 'night',
};

const STORAGE_KEY = 'ambientMusicEnabled';
const BASE = import.meta.env.BASE_URL;

// Mixer levels & timing. Web Audio gain is authoritative here, so base volumes
// are comfortably audible (the old sub-0.2 figures were tuned for
// HTMLMediaElement.volume, which iOS ignores).
const SCENE_VOLUME = 0.5;   // main during a game scene / secondary tracks
const IDLE_VOLUME = 0.45;   // non-scene pages (clearly audible, not muted)
const FADE_TC = 0.7;        // seconds — smooth exponential "time constant" (all volume changes)
const MUTE_TC = 0.12;       // seconds — fast dip before swapping the secondary src
const SWITCH_FADE_MS = 420; // how long to duck before swapping the secondary track

// Per-track loudness correction so every mood sits at a consistent level.
// morning.mp3 is the loudest -> reduced the most; busy & night eased down a
// little (yet still clearly audible); alarm.mp3 volume is NOT changed.
const TRACK_GAIN: Record<TrackKey, number> = {
  alarm: 1.0,   // keep as-is
  morning: 0.3, // loudest -> cut the most
  busy: 0.8,    // a bit quieter, still clear
  night: 0.9,   // a bit quieter, still clear
};

// -- Graph: two elements, each with its own GainNode, summed to the output --
let ctx: AudioContext | null = null;
let elMain: HTMLAudioElement | null = null; // the permanent looping background
let mainGain: GainNode | null = null;
let elSec: HTMLAudioElement | null = null;  // the switchable secondary element
let secGain: GainNode | null = null;

let mainStarted = false;            // has the background elMain begun looping
let currentSecondary: SecondaryKey | null = null; // which secondary is loaded on elSec
let switchToken = 0;                // guards async secondary src-swap races

let graphFailed = false;    // no AudioContext at all -> stay silent
let available = true;       // whether a usable track has loaded
let enabled = loadPreference();
let activeScene: number | null = null; // null = not inside a game scene

function loadPreference(): boolean {
  try {
    // Music is enabled for new participants. An explicit "off" preference is
    // still respected on subsequent visits.
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
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

/**
 * Lazily build the two-element Web Audio graph. The continuous background
 * element (elMain) plus a switchable secondary element (elSec), each feeding
 * its own GainNode so they can be mixed / ducked independently. Safe to call
 * anywhere.
 */
function ensureGraph(): boolean {
  if (graphFailed) return false;
  if (ctx && mainGain && elMain && secGain && elSec) return true;
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) {
      graphFailed = true;
      available = false;
      return false;
    }
    const c = new AC();

    // Continuous background (main) stream.
    const mGain = c.createGain();
    mGain.gain.value = 0; // start silent; fades below bring it up
    mGain.connect(c.destination);
    const aMain = new Audio();
    aMain.loop = true;
    aMain.preload = 'auto';
    aMain.volume = 1; // el.volume no-ops on iOS — the GainNode does the work
    aMain.muted = false;
    const mSrc = c.createMediaElementSource(aMain);
    mSrc.connect(mGain);

    // Secondary (layered) stream — src gets swapped on demand.
    const sGain = c.createGain();
    sGain.gain.value = 0;
    sGain.connect(c.destination);
    const aSec = new Audio();
    aSec.loop = true;
    aSec.preload = 'auto';
    aSec.volume = 1;
    aSec.muted = false;
    const sSrc = c.createMediaElementSource(aSec);
    sSrc.connect(sGain);

    ctx = c;
    mainGain = mGain;
    elMain = aMain;
    secGain = sGain;
    elSec = aSec;
    return true;
  } catch {
    graphFailed = true;
    available = false;
    return false;
  }
}

/** Un-suspend the context after a user gesture (blocks autoplay otherwise). */
function resumeContext(): void {
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => undefined);
  }
}

/** Smoothly fade the background stream's gain toward a target (never instant). */
function fadeMain(target: number): void {
  if (!ctx || !mainGain) return;
  // The background always fades smoothly — both down (ducking) and back up.
  mainGain.gain.setTargetAtTime(target, ctx.currentTime, FADE_TC);
}

/** Smoothly fade the secondary stream's gain toward a target. */
function fadeSecondary(target: number, fast = false): void {
  if (!ctx || !secGain) return;
  const tc = fast ? MUTE_TC : FADE_TC;
  secGain.gain.setTargetAtTime(target, ctx.currentTime, tc);
}

/** Effective foreground volume for a track, after its loudness correction. */
function trackVolume(key: TrackKey): number {
  return SCENE_VOLUME * TRACK_GAIN[key];
}

/** Main (morning) level inside a game scene, after its loudness correction. */
function mainSceneVolume(): number {
  return SCENE_VOLUME * TRACK_GAIN.morning;
}

/** Main (morning) level on a non-scene page, after its loudness correction. */
function mainIdleVolume(): number {
  return IDLE_VOLUME * TRACK_GAIN.morning;
}

/**
 * Compute what should be audible for a given scene (null = idle page):
 *   - mainTarget  : desired gain for the continuous background (0 while a
 *                   busy/night secondary is ducking it out of the way).
 *   - secondary   : which secondary track layers over main (null = none).
 *   - secondaryTarget : desired gain for that secondary when it is playing.
 */
interface Mix {
  mainTarget: number;
  secondary: SecondaryKey | null;
  secondaryTarget: number;
}
function desiredMix(sceneId: number | null): Mix {
  if (sceneId === 1) {
    // EXCEPTION — Scene 1: main and the alarm play TOGETHER. Main is NOT
    // ducked; the alarm layers on top at its full corrected volume.
    return { mainTarget: mainSceneVolume(), secondary: 'alarm', secondaryTarget: trackVolume('alarm') };
  }
  if (sceneId == null) {
    // Interstitial / non-scene pages: only the gentle main background flows.
    return { mainTarget: mainIdleVolume(), secondary: null, secondaryTarget: 0 };
  }
  const sec = SCENE_SECONDARY[sceneId];
  if (!sec) {
    // Daytime scenes (2,3,4,5,7,9): only the main background plays at scene level.
    return { mainTarget: mainSceneVolume(), secondary: null, secondaryTarget: 0 };
  }
  // Busy / night scenes: the secondary layers over main, so main is smoothly
  // ducked to silence. It fades back up automatically once the scene changes.
  return { mainTarget: 0, secondary: sec, secondaryTarget: trackVolume(sec) };
}


/**
 * Load a secondary track onto elSec, play it, then fade it up to its target
 * gain. If a secondary file is missing the main background is brought back up
 * so the experience is never silent.
 */
function playSecondary(key: SecondaryKey, target: number, token: number): void {
  if (!elSec) return;
  const file = TRACK_FILES[key];
  currentSecondary = key;
  elSec.src = resolveSrc(file);
  elSec.load();

  const start = () => {
    if (token !== switchToken) return; // a newer route superseded this one
    elSec!
      .play()
      .then(() => {
        if (token !== switchToken) return;
        fadeSecondary(target);
      })
      .catch(() => {
        if (token !== switchToken) return;
        currentSecondary = null;
        if (ctx && mainGain) fadeMain(mainSceneVolume()); // fail-safe: no silence
      });
  };

  if (elSec.readyState >= 3) {
    start(); // metadata + enough data already buffered
  } else {
    elSec.addEventListener('canplay', start, { once: true });
    elSec.addEventListener(
      'error',
      () => {
        if (token !== switchToken) return;
        currentSecondary = null;
        if (ctx && mainGain) fadeMain(mainSceneVolume()); // fail-safe: no silence
      },
      { once: true }
    );
  }
}

/**
 * Start the continuous background (main) once, inside a real user gesture so
 * the browser grants playback. Afterwards it loops forever — only its gain
 * changes. If it was paused by a mute-toggle-off, play() resumes from where it
 * was rather than restarting.
 */
function ensureMainPlaying(): void {
  if (!elMain) return;
  if (!mainStarted) {
    mainStarted = true;
    elMain.src = resolveSrc(MAIN_FILE);
    elMain.load();
  }
  elMain.play().catch(() => {
    /* the gain is 0 until a route fades it up; playback starts when allowed */
  });
}

/**
 * Recompute the mix for the active scene and apply all fades. The background
 * is never stopped; its level is merely retuned, and the secondary element is
 * loaded / swapped / ducked as the scene demands.
 */
function routeTo(sceneId: number | null): void {
  activeScene = sceneId;
  if (!enabled || !ensureGraph()) return;

  resumeContext();
  ensureMainPlaying(); // guarantees the continuous loop is running (no-op after first start)

  const mix = desiredMix(sceneId);

  // Background always fades toward its target — ducking to 0 while a
  // busy/night secondary plays, back up when it ends.
  fadeMain(mix.mainTarget);

  const secKey = mix.secondary;
  if (secKey === null) {
    // No secondary wanted -> fade it out (it keeps looping silently, ready to
    // resume in place later).
    fadeSecondary(0);
    return;
  }
  if (currentSecondary === secKey) {
    // Same secondary already loaded (possibly looped silently) -> just fade it
    // back up from where it currently is.
    fadeSecondary(mix.secondaryTarget);
    return;
  }
  if (currentSecondary === null) {
    // First time this secondary is needed -> start it right away.
    const token = ++switchToken;
    playSecondary(secKey, mix.secondaryTarget, token);
    return;
  }
  // Switching between two secondary tracks -> dip the current one, swap the
  // src, then fade the new one in.
  const token = ++switchToken;
  fadeSecondary(0, true);
  window.setTimeout(() => {
    if (token !== switchToken) return; // superseded while fading out
    playSecondary(secKey, mix.secondaryTarget, token);
  }, SWITCH_FADE_MS);
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
 * Call on every game-scene change. Pass the scene id to set that scene's
 * secondary mood (if any) over the continuous main track; pass null for the
 * interstitial pages, which keep the gentle background flowing.
 */
export function setAmbientScene(sceneId: number | null): void {
  routeTo(sceneId);
}

/**
 * Start downloading every track into the HTTP cache up front — no user gesture
 * is required for a plain fetch (only play() is gated by browsers). This keeps
 * the secondary src-swaps snappy later: the busy/night files are multi-MB and
 * would otherwise stall mid-session. Skipped on slow / data-saver connections
 * to be polite to participants.
 */
export function preloadAmbientMusic(): void {
  try {
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    };
    const conn = nav.connection;
    if (conn?.saveData || conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g') {
      return;
    }
  } catch {
    /* connection API unavailable — just preload */
  }
  const all: TrackKey[] = ['morning', ...SECONDARY_KEYS];
  for (const key of all) {
    fetch(resolveSrc(TRACK_FILES[key]), { cache: 'default', credentials: 'omit' })
      .then((r) => r.blob())
      .catch(() => undefined);
  }
}

/**
 * Call inside the real user gesture on Warning ("I Understand, Continue").
 * Builds/resumes the Web Audio engine, starts the continuous main background,
 * and sets music on by default if the participant hasn't chosen. This is the
 * single moment the browser grants audio playback, so we start here.
 */
export function prepareAmbientAudio(): void {
  if (!hasStoredPreference()) {
    enabled = true;
    persistPreference(true);
  }
  if (!enabled || !ensureGraph()) return;

  resumeContext();
  // Start the continuous main loop within this gesture, then immediately
  // re-route to whatever page we actually land on.
  ensureMainPlaying();
  routeTo(activeScene);
}

/** Flip the preference and apply it (fade to silence / back). Returns new state. */
export function toggleAmbientMusic(): boolean {
  enabled = !enabled;
  persistPreference(enabled);

  if (enabled) {
    if (ensureGraph()) {
      resumeContext();
      ensureMainPlaying(); // resume the loop if a toggle-off had paused it
      routeTo(activeScene); // retune / crossfade the current mix
    }
  } else {
    switchToken++; // cancel any pending src-swap
    fadeMain(0);   // gently fade both streams to silence...
    fadeSecondary(0);
    window.setTimeout(() => {
      if (!enabled) {
        if (elSec) elSec.pause();
        if (elMain) elMain.pause(); // ...then release the streams (only if still off)
      }
    }, 300);
  }

  window.dispatchEvent(new Event('ambient-music-change'));
  return enabled;
}

