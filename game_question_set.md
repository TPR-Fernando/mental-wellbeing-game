# Game Decision Points — WHO-5 & SWEMWBS Mapping
**FYRP: Implicit Well-Being Detection via Narrative Game**  
*For supervisor/psychotherapist review — not finalised*

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
| 7 | SWEMWBS S6 | Feeling close to other people |
| 8 | SWEMWBS S2 | Feeling useful |
| 9 | WHO-5 W3 *(2nd measurement)* | Felt active and vigorous |
| 10 | SWEMWBS S5 | Thinking clearly |
| 11 | SWEMWBS S7 *(2nd measurement)* | Able to make up own mind |
| 12 | SWEMWBS S3 | Feeling relaxed |
| 13 | WHO-5 W2 | Felt calm and relaxed |
| 14 | WHO-5 W1 | Felt cheerful and in good spirits |
| 15 | WHO-5 W2 *(2nd measurement)* | Felt calm and relaxed |

> Items measured twice (W2, W3, S7) provide within-scale reliability checks and richer signal for the model.

---

## The 15 Decision Points

---

### Scene 1 — The Alarm
**Mapped to:** WHO-5 W4 *(woke up feeling fresh and rested)*  
**Free-text prompt:** Yes — *"How have mornings been feeling for you lately?"*

> Your alarm goes off at 7.30. You've got a 9am lecture on the other side of campus. You reach for your phone.

| Choice | Text | Weight |
|---|---|---|
| A | You're properly awake before it even finishes ringing. You get up straight away, feeling good. | +2 |
| B | A bit sleepy, but nothing major. You get up without much of a fight. | +1 |
| C | You snooze once, lie there a bit, then get up. Nothing special either way. | 0 |
| D | You feel groggy and heavy. It takes a couple of snoozes before you actually move. | -1 |
| E | Your body just refuses to cooperate. You lie there way longer than you should, dreading the day already. | -2 |

---

### Scene 2 — Getting Ready
**Mapped to:** WHO-5 W3 *(felt active and vigorous)*  
**Free-text prompt:** No

> You're getting ready for the day. About 20 minutes before you need to leave.

| Choice | Text | Weight |
|---|---|---|
| A | You move fast and feel sharp, you even glance over your notes before heading out. | +2 |
| B | You get through it at a decent pace, nothing to complain about. | +1 |
| C | You go through the motions. Not fast, not slow, just routine. | 0 |
| D | Everything feels a bit heavier than it should. You move slowly and cut it close on time. | -1 |
| E | You can barely get yourself moving. You're rushing at the end and nearly forget your student ID. | -2 |

---

### Scene 3 — The Commute
**Mapped to:** SWEMWBS S1 *(feeling optimistic about the future)*  
**Free-text prompt:** Yes — *"What's been on your mind about the future lately?"*

> On the way to campus, your mind drifts to what's ahead: assignments, exams, life after graduation.

| Choice | Text | Weight |
|---|---|---|
| A | There's a lot coming up, but you feel good about it. Like things are actually heading somewhere. | +2 |
| B | You think about it a little and feel mostly okay, nothing weighing you down. | +1 |
| C | You don't really dwell on it. You put your earphones in and think about something else. | 0 |
| D | A familiar worry creeps in. You think about the same things again without really working through them. | -1 |
| E | The worry doesn't let up. It just keeps circling and you can't shake the unease. | -2 |

---

### Scene 4 — The Lecture Begins
**Mapped to:** WHO-5 W5 *(daily life filled with things that interest me)*  
**Free-text prompt:** No

> The lecturer starts a new topic, something outside what you've studied before but related to your field.

| Choice | Text | Weight |
|---|---|---|
| A | You feel genuinely curious. You lean in and start taking notes without even thinking about it. | +2 |
| B | You find it reasonably interesting, enough to pay proper attention. | +1 |
| C | You listen and take notes. You're present, just not particularly invested. | 0 |
| D | Your attention drifts. Nothing about it feels like it matters much right now. | -1 |
| E | You can't focus on it at all. Nothing feels interesting or worth the effort lately. | -2 |

---

### Scene 5 — Question in Class
**Mapped to:** SWEMWBS S7 *(able to make up own mind about things)*  
**Free-text prompt:** No

> The lecturer asks the class a question, not directed at anyone. Something comes to mind for you.

| Choice | Text | Weight |
|---|---|---|
| A | You think it through and raise your hand. You feel sure enough about your answer. | +2 |
| B | You've got an answer in mind and share it if no one else does first. | +1 |
| C | You form an answer but hold back, waiting to see what others say. | 0 |
| D | You had a clear thought a second ago, but you talk yourself out of saying it. | -1 |
| E | You don't trust your own thinking at all right now, so you stay quiet even though you knew the answer. | -2 |

---

### Scene 6 — Group Project Conflict
**Mapped to:** SWEMWBS S4 *(dealing with problems well)*  
**Free-text prompt:** Yes — *"How do you usually handle situations like this?"*

> Your project group meets after the lecture. One member hasn't done their part and the deadline is two days away.

| Choice | Text | Weight |
|---|---|---|
| A | You bring it up calmly and directly, and suggest splitting the leftover work so everyone's clear on what's next. | +2 |
| B | You mention it and help sort out a plan, even if it takes a bit of back and forth. | +1 |
| C | You quietly take on more of the work yourself just to avoid a whole conversation about it. | 0 |
| D | You're frustrated but don't say much. You pull back and just focus on your own part. | -1 |
| E | You completely shut down about it. You say nothing, do the bare minimum, and let the resentment build. | -2 |

---

### Scene 7 — Lunch
**Mapped to:** SWEMWBS S6 *(feeling close to other people)*  
**Free-text prompt:** No

> It's lunchtime. You're getting food and a few coursemates wave you over to their table.

| Choice | Text | Weight |
|---|---|---|
| A | You join them and it feels easy. The conversation flows and you actually laugh a few times. | +2 |
| B | You sit with them and enjoy it well enough, even if you're not the loudest one there. | +1 |
| C | You sit with them but mostly just eat and listen, not really part of it. | 0 |
| D | You make a small excuse about needing to study and sit somewhere quieter instead. | -1 |
| E | You avoid it altogether and eat by yourself. Being around people feels like too much right now. | -2 |

---

### Scene 8 — A Friend Needs Help
**Mapped to:** SWEMWBS S2 *(feeling useful)*  
**Free-text prompt:** No

> A friend messages you. They missed a lecture and are stuck on something you understand well. They ask if you can explain it.

| Choice | Text | Weight |
|---|---|---|
| A | You're happy to help. You meet up between classes and walk them through it properly. | +2 |
| B | You send your notes over and tell them to ask if anything's still unclear. | +1 |
| C | You say you'll try to help later, without really committing either way. | 0 |
| D | You feel a bit bad about it, but you say you can't right now, you've got your own work. | -1 |
| E | You leave the message on read. You don't really feel like dealing with it. | -2 |

---

### Scene 9 — Mid-Afternoon Slump
**Mapped to:** WHO-5 W3 *(felt active and vigorous — 2nd measurement)*  
**Free-text prompt:** No

> It's 3pm. You've got a two-hour study block before your next thing. You sit down at a desk with your laptop.

| Choice | Text | Weight |
|---|---|---|
| A | You get a second wind. Headphones in, and you're straight into it. | +2 |
| B | You settle in after a short warm-up and get a decent amount done. | +1 |
| C | You browse your notes for a bit before easing into something productive. | 0 |
| D | You feel heavy and unfocused. It takes a while before you actually start. | -1 |
| E | You're completely drained. You stare at the screen and barely get anything done the whole time. | -2 |

---

### Scene 10 — Assignment Block
**Mapped to:** SWEMWBS S5 *(thinking clearly)*  
**Free-text prompt:** Yes — *"When you're stuck on something academic, what usually goes through your mind?"*

> You hit a part of the assignment you don't get. You've read it twice and it's still not clicking.

| Choice | Text | Weight |
|---|---|---|
| A | You break it into smaller pieces and work through it from a different angle. It takes a while but it clicks. | +2 |
| B | You take a short break, come back, and manage to work it out reasonably well. | +1 |
| C | You leave it for now and switch to a different section, planning to come back to it later. | 0 |
| D | The confusion builds and it's hard to focus. You end up drifting to something else without meaning to. | -1 |
| E | Your head just fogs up completely. You close the tab and give up on it for the day. | -2 |

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
**Mapped to:** SWEMWBS S3 *(feeling relaxed)*  
**Free-text prompt:** No

> A friend invites you over that evening, nothing big, just watching something together. You've got some work left but nothing urgent tonight.

| Choice | Text | Weight |
|---|---|---|
| A | You go, and it feels easy. You're actually looking forward to the break. | +2 |
| B | You go and enjoy it, even with the work at the back of your mind. | +1 |
| C | You go, but there's a low hum of guilt the whole time. You keep checking your phone. | 0 |
| D | You say no. It just feels like more effort than you have right now. | -1 |
| E | You turn it down and don't really want to see anyone. You'd rather just be alone. | -2 |

---

### Scene 13 — A Quiet Moment of Worry
**Mapped to:** WHO-5 W2 *(felt calm and relaxed)*  
**Free-text prompt:** Yes — *"Is there anything that's been weighing on you lately that you haven't been able to put down?"*

> It's early evening, you're alone, maybe making tea or just lying down. A thought about something uncertain surfaces on its own.

| Choice | Text | Weight |
|---|---|---|
| A | You notice it, sit with it for a second, and let it go pretty easily. | +2 |
| B | You think about it for a bit, then get distracted by something else and move on. | +1 |
| C | It stays with you for a while before it eventually fades on its own. | 0 |
| D | It's hard to shake. You keep coming back to it even when you try to think about something else. | -1 |
| E | It spirals. One worry pulls in another and the feeling sticks around for a long time. | -2 |

---

### Scene 14 — End of Day Reflection
**Mapped to:** WHO-5 W1 *(felt cheerful and in good spirits)*  
**Free-text prompt:** No

> It's around 9pm. You're thinking back over the day. Overall, how has it felt?

| Choice | Text | Weight |
|---|---|---|
| A | Genuinely good. There were stressful bits, but overall you feel fine about how it went. | +2 |
| B | Pretty decent. A few rough patches, but nothing that really got you down. | +1 |
| C | Mixed. Some parts were fine, some weren't. Hard to sum up either way. | 0 |
| D | Not great. The day felt heavier than usual and it's stuck with you. | -1 |
| E | Flat, low, hard to explain. The day just felt like a weight the whole way through. | -2 |

---

### Scene 15 — Before Bed
**Mapped to:** WHO-5 W2 *(felt calm and relaxed — 2nd measurement)*  
**Free-text prompt:** No

> You're in bed. The day is done. You lie there in the quiet.

| Choice | Text | Weight |
|---|---|---|
| A | Your body and mind feel properly settled. You're ready to sleep. | +2 |
| B | You feel fairly calm. Your mind eases fairly quickly. | +1 |
| C | Your mind wanders for a bit before it eventually quiets down. | 0 |
| D | You're restless. It takes a long time before your thoughts settle at all. | -1 |
| E | Your thoughts keep racing. You lie there for ages, not able to switch off. | -2 |

---

## Free-Text Prompt Summary

| Scene | Trigger | Prompt |
|---|---|---|
| 1 | After choice | *"Describe how mornings have been feeling for you lately."* |
| 3 | After choice | *"What's been on your mind lately about the future?"* |
| 6 | After choice | *"How do you usually handle situations like this?"* |
| 10 | After choice | *"When you're stuck on something academic, what usually goes through your mind?"* |
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
- Every scene also logs raw reaction time in milliseconds (scene render → choice tap), used to build each participant's own median decision pace. Scene 11's hesitation is judged relative to that personal baseline, not a fixed cutoff, see Scene 11 above for why.
- These predicted scores are compared against the actual WHO-5 and SWEMWBS questionnaire responses collected at the end of the session.

---

## Notes for Supervisor Review

1. **Weighting logic is directional, not diagnostic.** A single -1 or -2 does not indicate poor well-being, the signal comes from patterns across the full set.
2. **Dual measurement items** (W2, W3, S7) are deliberate. They provide test-retest signal within a single session and give the ML model more variance to learn from.
3. **Free-text placement** is emotionally calibrated — prompts appear at scenes involving morning state, future thinking, conflict, academic difficulty, and quiet worry. These are the most psychologically loaded moments.
4. **Scene 14 is unusual** — it is the only scene that explicitly asks the player to reflect on "how you felt today." This is intentionally placed late, after the player has been in-game for the full duration. Consider whether this level of directness is appropriate or whether it should be reframed as a more indirect narrative moment.
5. **All choice text should be reviewed** by the supervising psychotherapist for ecological validity — particularly Scenes 6, 10, and 13 which touch on conflict avoidance, cognitive difficulty, and rumination.
6. **The post-game AI interview is intentionally short (2 questions)** to stay within the 3-call-per-session LLM cap (Q1 + Q2 + summary). Q2's adaptive nature means its exact wording can't be reviewed in advance the way the fixed scene/free-text content can, the prompt sent to the model (not shown here) should be reviewed instead, since that's what constrains its tone and boundaries.
7. **Options widened from 3 to 5 per scene.** This brings the game's resolution closer to the real WHO-5 (6-point) and SWEMWBS (5-point) response scales instead of collapsing everything into positive/neutral/negative. Reading load increases somewhat (75 short lines instead of 45), option text was kept to one short sentence each to offset that.
8. **Scene 11 was converted into a timed forced-choice mini-game** (2 visible options plus a hidden timeout outcome) rather than staying a plain 3-option scene, see the dedicated writeup under Scene 11 above. This is a new, not-yet-reviewed mechanic and should get its own look from the supervisor, particularly whether a countdown under social pressure is an appropriate thing to simulate for this population.
9. **Tone pass:** all scene and choice text was rewritten to read like an internal narration a student would actually think in (shorter sentences, no em dashes, less literary phrasing) rather than AI-generated prose, while keeping each option's polarity mapped to the same scale item as before.
