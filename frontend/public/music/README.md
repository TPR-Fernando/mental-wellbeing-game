# Background Music

The app uses the tracks already in this folder (`frontend/public/music/`). They are served from `/music/...`. One track acts as a **continuous main background** that loops for the whole session and is **never stopped or restarted**; the other tracks are **secondary** layers that duck the main track when they play.

## Files & how they're used

| File | Role | When it plays |
|------|------|---------------|
| `morning.mp3` | **MAIN / background** | Loops continuously for the entire session. Audible on non-game pages and simple daytime scenes (2, 3, 4, 5, 7, 9) at a gentle level. Also layered **underneath the alarm in Scene 1** (NOT ducked). |
| `alarm.mp3` | Secondary | **Scene 1** — plays *together with* the main track at the same time, main is **not** ducked. |
| `busy.mp3` | Secondary | Social & pressure scenes (6, 8, 10, 11, 12). While it plays, main is smoothly faded to 0. |
| `night.mp3` | Secondary | Winding-down scenes (13, 14, 15). While it plays, main is smoothly faded to 0. |

## Behaviour
- **Continuous main background.** Once unlocked (click **I Understand, Continue**), `morning.mp3` starts looping and **never stops or restarts** for the whole session — only its volume changes.
- **Ducking, not pausing.** When a secondary track needs to play, the main track is **smoothly faded to 0** (it is not paused — it keeps looping silently) and continues exactly where it left off, never starting over. When the secondary finishes, main **fades back up** to full.
- **Scene 1 exception.** Main and `alarm.mp3` play **together at the same time** — main is NOT ducked.
- **Smooth fades everywhere.** Every volume change (duck, restore, switch, mute toggle) uses a smooth exponential fade — no instant cuts.
- **Crossfades between secondary tracks.** Moving from a `busy` scene straight to a `night` scene dips the outgoing secondary, swaps the source, then fades the new one in.
- **Interstitial pages are not silent after the soundtrack starts.** The Important Notice and the end (Summary, Questionnaire, Completion) ease to the `morning` main track at a clearly audible level. The Consent and Home pages remain silent until the participant clicks **I Understand, Continue**.
- The floating ♪ toggle fades the music to silence / back (instead of an abrupt pause). Music is on by default and starts when the participant clicks **I Understand, Continue**.
- **Consistent volume.** The source files differ in loudness, so each track is steered to a uniform mix level: `morning.mp3` (the loudest) is cut the most, `busy` and `night` are eased down a little, and `alarm.mp3` is left unchanged.
- If a secondary track file is missing, that scene falls back to the main background so the experience is never silent.

Keep files under a few MB each for fast loading.
