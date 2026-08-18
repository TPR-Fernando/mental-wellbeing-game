# Game Decision Points — WHO-5 & SWEMWBS Mapping
**FYRP: Implicit Well-Being Detection via Narrative Game**  
---

## Scale Reference

### WHO-5 Well-Being Index (past 2 weeks)
| # | Item |
|---|---|
| W1 | I have felt cheerful and in good spirits |
| W2 | I have felt calm and relaxed |
| W3 | I have felt active and vigorous |
| W4 | I woke up feeling fresh and rested |
| W5 | My daily life has been filled with things that interest me |

### SWEMWBS (past 2 weeks)
| # | Item |
|---|---|
| S1 | I've been feeling optimistic about the future |
| S2 | I've been feeling useful |
| S3 | I've been feeling relaxed |
| S4 | I've been dealing with problems well |
| S5 | I've been thinking clearly |
| S6 | I've been feeling close to other people |
| S7 | I've been able to make up my own mind about things |

### Weighting Key
- **+2** = strongly positive indicator for mapped scale item
- **+1** = mildly positive indicator
- **0** = neutral / mixed / ambiguous
- **-1** = mildly negative indicator
- **-2** = strongly negative indicator for mapped scale item

> Widened from a 3-point (+1/0/-1) to a 5-point scale so the game's resolution is closer to the real instruments: WHO-5 is normally answered on a 6-point frequency scale and SWEMWBS on a 5-point frequency scale, and 3 buckets was flattening a lot of that. Each scene now has 5 options instead of 3.

---

## Coverage Plan (15 Scenes → 12 Items)

| Scene | Scale Item | Item Text (abbreviated) |
|---|---|---|
| 1 | WHO-5 W4 | Woke up feeling fresh and rested |
| 2 | WHO-5 W3 | Felt active and vigorous |
| 3 | SWEMWBS S1 | Feeling optimistic about the future |
| 4 | WHO-5 W5 | Daily life filled with interesting things |
| 5 | SWEMWBS S7 | Able to make up own mind |
| 6 | SWEMWBS S4 | Dealing with problems well |
| 7 | SWEMWBS S3 | Feeling relaxed |
| 8 | SWEMWBS S2 | Feeling useful |
| 9 | WHO-5 W3 *(2nd measurement)* | Felt active and vigorous |
| 10 | SWEMWBS S5 | Thinking clearly |
| 11 | SWEMWBS S7 *(2nd measurement)* | Able to make up own mind |
| 12 | SWEMWBS S6 | Feeling close to other people |
| 13 | WHO-5 W2 | Felt calm and relaxed |
| 14 | WHO-5 W1 | Felt cheerful and in good spirits |
| 15 | WHO-5 W2 *(2nd measurement)* | Felt calm and relaxed |

> Items measured twice (W2, W3, S7) provide within-scale reliability checks and richer signal for the model.

> **Scene 7 ↔ Scene 12 swap (S3 / S6):** Scene 12 *(Social Invitation)* previously carried SWEMWBS S3 *(feeling relaxed)* — the weakest item-to-scene fit in the set, since its content (accepting or declining a friend's invitation, work guilt, withdrawal) is fundamentally about *closeness to others*, not relaxation. S3 therefore moves to Scene 7 *(Lunch)*, whose choices ("actually laugh a few times" → "avoid it, eat alone — people feel like too much") track social ease/comfort at ease with people — a clean behavioural proxy for feeling relaxed, with no work-guilt confound. Every one of the 7 SWEMWBS items stays covered exactly once (S7 twice) and all scene contents and choice weights are untouched.

---

## The 15 Decision Points

---

### Scene 1 — The Alarm
**Mapped to:** WHO-5 W4 *(woke up feeling fresh and rested)*  
**Free-text prompt:** Yes — *"How have mornings been feeling for you lately?"*

> Your alarm goes off at 7.30. You've got a 9am lecture on the other side of campus. You reach for your phone.

| Choice | Text | Weight |
|---|---|---|
| A | Awake before it even finishes ringing. Straight up, feeling good. | +2 |
| B | A bit sleepy, but no real fight getting up. | +1 |
| C | Snooze once, lie there a bit, then get up. Whatever. | 0 |
| D | Groggy and heavy. Takes a couple snoozes to actually move. | -1 |
| E | Body just won't cooperate. Dreading the day already. | -2 |

---

### Scene 2 — Getting Ready
**Mapped to:** WHO-5 W3 *(felt active and vigorous)*  
**Free-text prompt:** No

> You're getting ready for the day. About 20 minutes before you need to leave.

| Choice | Text | Weight |
|---|---|---|
| A | Move fast, feel sharp. Even glance over your notes. | +2 |
| B | Decent pace, nothing to complain about. | +1 |
| C | Going through the motions. Just routine. | 0 |
| D | Everything feels heavier than it should. Cutting it close. | -1 |
| E | Can barely get moving. Nearly forget your student ID. | -2 |

---

### Scene 3 — The Commute
**Mapped to:** SWEMWBS S1 *(feeling optimistic about the future)*  
**Free-text prompt:** Yes — *"What's been on your mind about the future lately?"*

> On the way to campus, your mind drifts to what's ahead: assignments, exams, life after graduation.

| Choice | Text | Weight |
|---|---|---|
| A | Lots coming up, but it feels like it's heading somewhere good. | +2 |
| B | Think about it a little, feel mostly okay. | +1 |
| C | Don't really dwell on it. Earphones in, mind elsewhere. | 0 |
| D | Same worry creeps back in, never really worked through. | -1 |
| E | Worry won't let up. Just keeps circling. | -2 |

---

### Scene 4 — The Lecture Begins
**Mapped to:** WHO-5 W5 *(daily life filled with things that interest me)*  
**Free-text prompt:** No

> The lecturer starts a new topic, something outside what you've studied before but related to your field.

| Choice | Text | Weight |
|---|---|---|
| A | Genuinely curious. Leaning in, taking notes without thinking. | +2 |
| B | Interesting enough to pay proper attention. | +1 |
| C | Listening, taking notes. Just not invested. | 0 |
| D | Attention drifts. Doesn't feel like it matters right now. | -1 |
| E | Can't focus at all. Nothing feels worth the effort. | -2 |

---

### Scene 5 — Question in Class
**Mapped to:** SWEMWBS S7 *(able to make up own mind about things)*  
**Free-text prompt:** No

> The lecturer asks the class a question, not directed at anyone. Something comes to mind for you.

| Choice | Text | Weight |
|---|---|---|
| A | Think it through, raise your hand. Feel sure enough. | +2 |
| B | Got an answer, share it if no one beats you to it. | +1 |
| C | Form an answer, hold back, wait and see. | 0 |
| D | Had the thought, talk yourself out of saying it. | -1 |
| E | Don't trust your own thinking. Stay quiet anyway. | -2 |

---

### Scene 6 — Group Project Conflict
**Mapped to:** SWEMWBS S4 *(dealing with problems well)*  
**Free-text prompt:** Yes — *"How do you usually handle situations like this?"*

> Your project group meets after the lecture. One member hasn't done their part and the deadline is two days away.

| Choice | Text | Weight |
|---|---|---|
| A | Bring it up calmly. Suggest splitting the leftover work. | +2 |
| B | Mention it, help sort a plan, some back and forth. | +1 |
| C | Quietly take on more yourself. Avoid the conversation. | 0 |
| D | Frustrated, but say little. Pull back, focus on your part. | -1 |
| E | Shut down completely. Bare minimum, resentment builds. | -2 |

---

### Scene 7 — Lunch
**Mapped to:** SWEMWBS S3 *(feeling relaxed — at ease with people: joining in and laughing easily vs. eating alone because people feel like too much)*  
**Free-text prompt:** No

> It's lunchtime. You're getting food and a few coursemates wave you over to their table.

| Choice | Text | Weight |
|---|---|---|
| A | Join them, it's easy. Actually laugh a few times. | +2 |
| B | Sit with them, enjoy it well enough. | +1 |
| C | Sit with them, mostly just eat and listen. | 0 |
| D | Small excuse about studying. Sit somewhere quieter instead. | -1 |
| E | Avoid it, eat alone. People feel like too much right now. | -2 |

---

### Scene 8 — A Friend Needs Help
**Mapped to:** SWEMWBS S2 *(feeling useful)*  
**Free-text prompt:** No

> A friend messages you. They missed a lecture and are stuck on something you understand well. They ask if you can explain it.

| Choice | Text | Weight |
|---|---|---|
| A | Happy to help. Meet up, walk them through it properly. | +2 |
| B | Send your notes over, tell them to ask if unclear. | +1 |
| C | Say you'll try later, without really committing. | 0 |
| D | Feel a bit bad, but say you can't right now. | -1 |
| E | Leave it on read. Don't feel like dealing with it. | -2 |

---

### Scene 9 — Mid-Afternoon Slump
**Mapped to:** WHO-5 W3 *(felt active and vigorous — 2nd measurement)*  
**Free-text prompt:** No

> It's 3pm. You've got a two-hour study block before your next thing. You sit down at a desk with your laptop.

| Choice | Text | Weight |
|---|---|---|
| A | Second wind. Headphones in, straight into it. | +2 |
| B | Settle in after a short warm-up, get a decent amount done. | +1 |
| C | Browse notes a bit before easing into something. | 0 |
| D | Feel heavy, unfocused. Takes a while to actually start. | -1 |
| E | Completely drained. Barely get anything done all afternoon. | -2 |

---

### Scene 10 — Assignment Block
**Mapped to:** SWEMWBS S5 *(thinking clearly)*  
**Free-text prompt:** Yes — *"When a piece of coursework feels overwhelming, what do you notice happening in your mind?"*

> You hit a part of the assignment you don't get. You've read it twice and it's still not clicking.

| Choice | Text | Weight |
|---|---|---|
| A | Break it into pieces, work it from a different angle. Takes a while, but it clicks. | +2 |
| B | Short break, come back, work it out reasonably well. | +1 |
| C | Leave it, switch to another section for now. | 0 |
| D | Confusion builds. Drift to something else without meaning to. | -1 |
| E | Head fogs up completely. Close the tab, give up for the day. | -2 |

---

### Scene 11 — Forced Decision Under Time Pressure (Hesitation Mini-Game)
**Mapped to:** SWEMWBS S7 *(able to make up own mind — 2nd measurement)*  
**Free-text prompt:** No

Unlike the other 14 scenes, this one runs on a visible countdown instead of a plain choice list. The participant sees two options and a shrinking timer. If nothing is tapped before time runs out, the scene auto-advances on its own, a hidden third outcome that is never shown as a button.

> Your group chat is going back and forth about which framework to use. Two people disagree and the conversation's stuck. Someone tags you: "you decide, we're moving on." A countdown starts.

| Outcome | Text | Weight | Visible as a button? |
|---|---|---|---|
| A | "Go with what [X] suggested, it covers what we need." | +2 | Yes |
| B | "Whatever's fine with me, you all decide." | -1 | Yes |
| Timeout | *(no tap before the timer runs out — the chat moves on without you)* | -2 | No, happens automatically |

**Why a hidden timeout instead of a 3rd visible option:** a participant who freezes and doesn't answer at all is a meaningfully stronger avoidance signal than one who consciously picks the hedge option. Making that a real behavioural outcome (time simply running out) rather than a third button to click captures that distinction, which a static multiple-choice list can't.

**Reaction-time baseline:** every scene in the game (not just this one) silently logs how long the participant takes to choose, from when the scene appears to when they tap something — this is never shown to the participant. That gives each participant a personal baseline pace across the 14 ordinary scenes. Scene 11's response (or lack of one) is then read relative to that participant's own median rather than a fixed universal cutoff, e.g. "took 2x their normal decision time, or timed out entirely." This matters because reading speed and English fluency vary across participants (most, but not all, are Sri Lankan), and a fixed-second cutoff would penalise slower readers rather than genuinely hesitant deciders.

**Relationship to `COPILOT_BUILD_GUIDE.md` Section 5:** that section specs a separate "Hold to Focus" response-inhibition mini-game (3 instances, motor/attentional stop-cue reaction time). This scene measures something different, decisional hesitation on a meaningful choice under social/time pressure, not raw motor reaction speed. The two are complementary rather than a replacement for one another; whether both ship is a call for you and your supervisor since Section 5 was already written up as its own spec.

---

### Scene 12 — Social Invitation
**Mapped to:** SWEMWBS S6 *(feeling close to other people — choosing to spend the evening with a friend vs. turning contact down)*  
**Free-text prompt:** No

> A friend invites you over that evening, nothing big, just watching something together. You've got some work left but nothing urgent tonight.

| Choice | Text | Weight |
|---|---|---|
| A | Go, it's easy. Actually looking forward to it. | +2 |
| B | Go, enjoy it, work still nagging at the back of your mind. | +1 |
| C | Go, but a low hum of guilt. Keep checking your phone. | 0 |
| D | Say no. Feels like more effort than you have right now. | -1 |
| E | Turn it down. Don't want to see anyone right now. | -2 |

---

### Scene 13 — A Quiet Moment of Worry
**Mapped to:** WHO-5 W2 *(felt calm and relaxed)*  
**Free-text prompt:** Yes — *"Is there anything that's been weighing on you lately that you haven't been able to put down?"*

> It's early evening, you're alone, maybe making tea or just lying down. A thought about something uncertain surfaces on its own.

| Choice | Text | Weight |
|---|---|---|
| A | Notice it, sit with it a second, let it go pretty easily. | +2 |
| B | Think about it a bit, then get distracted, move on. | +1 |
| C | Stays with you a while, fades on its own eventually. | 0 |
| D | Hard to shake. Keep coming back to it. | -1 |
| E | Spirals. One worry pulls in another, sticks around. | -2 |

---

### Scene 14 — End of Day Reflection
**Mapped to:** WHO-5 W1 *(felt cheerful and in good spirits)*  
**Free-text prompt:** No

> It's around 9pm. You're thinking back over the day. Overall, how has it felt?

| Choice | Text | Weight |
|---|---|---|
| A | Genuinely good. Stressful bits, but overall fine. | +2 |
| B | Pretty decent. A few rough patches, nothing major. | +1 |
| C | Mixed. Some parts fine, some not. Hard to sum up. | 0 |
| D | Not great. Heavier than usual, still stuck with you. | -1 |
| E | Flat, low. Felt like a weight the whole day. | -2 |

---

### Scene 15 — Before Bed
**Mapped to:** WHO-5 W2 *(felt calm and relaxed — 2nd measurement)*  
**Free-text prompt:** No

> You're in bed. The day is done. You lie there in the quiet.

| Choice | Text | Weight |
|---|---|---|
| A | Body and mind properly settled. Ready to sleep. | +2 |
| B | Fairly calm. Mind eases pretty quickly. | +1 |
| C | Mind wanders a bit before quieting down. | 0 |
| D | Restless. Takes a long time for thoughts to settle. | -1 |
| E | Thoughts keep racing. Lying there for ages, can't switch off. | -2 |

---

## Free-Text Prompt Summary

| Scene | Trigger | Prompt |
|---|---|---|
| 1 | After choice | *"Describe how mornings have been feeling for you lately."* |
| 3 | After choice | *"What's been on your mind lately about the future?"* |
| 6 | After choice | *"How do you usually handle situations like this?"* |
| 10 | After choice | *"When a piece of coursework feels overwhelming, what do you notice happening in your mind?"* |
| 13 | After choice | *"Is there anything that's been weighing on you lately that you haven't been able to put down?"* |

> All free-text is optional. The game continues regardless of whether the player types anything.

---

## Post-Game AI Interview (2 Questions)

After the 15 narrative scenes and before the ground-truth questionnaires' well-being summary, the participant answers exactly **2** open-ended questions, generated via the `nlpService` Cloud Function (see `COPILOT_BUILD_GUIDE.md`, Section 3):

| Question | Source | Behaviour |
|---|---|---|
| Q1 | AI-generated (`generate_interview_q1`) | Based on the overall choice pattern across the 15 scenes (e.g. *"leaned toward avoidance in 6/15 scenes, high hesitation on social scenes"*). Fixed to the pattern — does not depend on any single scene or free-text answer. |
| Q2 | AI-generated (`generate_interview_q2`) | A genuine adaptive follow-up to the participant's answer to Q1 — its topic responds to what they actually said, not just the choice pattern. This is the only point in the entire flow where question content adapts to a participant's own free-text words. |

> This is distinct from the 5 in-game free-text prompts above (Scenes 1, 3, 6, 10, 13), which are static, pre-written per scene and never change based on player input. Only the post-game interview's Q2 is adaptive; everything else in the game is fixed regardless of what the player types.

Both LLM calls (plus one for `generate_summary`) count toward the 3-call-per-session cap defined in `COPILOT_BUILD_GUIDE.md` Section 0, Rule 3. If the daily or per-session limit is hit, both questions fall back to a static bank rather than failing visibly.

---

## Scoring Notes for Implementation

- Each choice produces a weight of **+2**, **+1**, **0**, **-1**, or **-2** per scene. Scene 11's hidden timeout outcome also produces a weight (**-2**) even though it was never shown as a clickable option.
- Items measured twice (W2, W3, S7): average the two weights per participant.
- WHO-5 predicted score: sum of 5 item weights (range -10 to +10), rescaled to 0–100 via `((sum + 10) / 20) * 100`.
- SWEMWBS predicted score: sum of 7 item weights (range -14 to +14), rescaled to the official 7–35 metric range via `sum + 21` (linear, since 7 items × ±2 maps directly onto that span).
- **Mini-game adjustment (matches `Summary.tsx`):** the 3 word-choice mini-game weights (each −1/0/+1, total −3…+3) are added to **both** predicted raw sums before rescaling — `who5Raw += miniGameTotal`, `swemwbsRaw += miniGameTotal` — then clamped to 0–100 / 7–35. This slightly nudges the *predicted* snapshot scores and the AI summary tone only; the ground-truth questionnaire (post-narrative forms) is never affected by mini-game weights.
- Every scene also logs raw reaction time in milliseconds (scene render → choice tap), used to build each participant's own median decision pace. Scene 11's hesitation is judged relative to that personal baseline, not a fixed cutoff, see Scene 11 above for why.
- These predicted scores are compared against the actual WHO-5 and SWEMWBS questionnaire responses collected at the end of the session.