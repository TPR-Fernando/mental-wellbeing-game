# Background Music

The app uses the tracks already in this folder (`frontend/public/music/`). They
are served from `/music/...` and loop at a gentle volume. A crossfading mixer keeps a **continuous soundtrack flowing across the whole experience** — the audio is never hard-stopped or restarted between screens.

## Files & how they're used

| File | When it plays |
|------|---------------|
| `alarm.mp3` | **Scene 1** (the alarm) — volume kept as-is |
| `morning.mp3` | Daytime / campus scenes (2, 3, 4, 5, 7, 9) **and** the non-game pages (Home, Warning, Summary, Questionnaire, Completion) at a softer level. Also layered **underneath the alarm in Scene 1** |
| `busy.mp3` | Social & pressure scenes (6, 8, 10, 11, 12) |
| `night.mp3` | Winding-down scenes (13, 14, 15) |

## Behaviour
- **Continuous flow.** Once unlocked, the soundtrack never cuts out; it follows
  the mood of the current screen and crossfades between moods.
- **Never restart — never pause.** Every track element keeps playing
  continuously once unlocked. A non-foreground track is simply **reduced to
  zero volume** (it keeps looping silently), so when that mood returns it fades
  back up from where it actually is — it never starts over.
- **Crossfades, not cuts.** When a scene's mood changes (e.g. morning → busy)
  the outgoing track gently ducks down while the new one fades in — no abrupt
  stop. The fade takes about 2.4 seconds.
- **Interstitial pages are not silent after the soundtrack starts.** The
  Important Notice and the end (Summary, Questionnaire, Completion) ease to
  the default `morning` track at a clearly audible level. The Consent and Home
  pages remain silent until the participant clicks **I Understand, Continue**.
- The track **only changes when the scene type changes**. Consecutive scenes of
  the same type reuse the same looping file — nothing restarts.
- The floating ♪ toggle fades the music to silence / back (instead of an abrupt
  pause). Music is on by default and starts when the participant clicks
  **I Understand, Continue** on the Important Notice page.
- **Consistent volume.** The source files differ in loudness, so each track is
  steered to a uniform mix level: `morning.mp3` (the loudest) is cut the most,
  `busy` and `night` are eased down a little, and `alarm.mp3` is left unchanged.
- **Scene 1 layers two tracks.** The alarm plays at full volume with `morning`
  sitting quietly underneath it.
- If a track file is missing, that scene silently falls back to `morning.mp3`.

Keep files under a few MB each for fast loading.