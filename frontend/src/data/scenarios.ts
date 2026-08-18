export interface ChoiceLayout {
  /** Width of the answer cloud as a percentage of the container width (e.g., 30 = 30%) */
  width?: number;
  /** Height of the answer cloud in pixels */
  height?: number;
  /** X position as a percentage from the left edge of the container (e.g., 50 = 50%) */
  x: number;
  /** Y position as a percentage from the top edge of the container (e.g., 50 = 50%) */
  y: number;
}

export interface Choice {
  id: string;
  text: string;
  weight: number;
  /** Custom layout data for positioning and sizing the answer cloud */
  layout?: ChoiceLayout;
}

export interface TimedChoice {
  limitMs: number;
  timeoutWeight: number;
}

export interface Scene {
  id: number;
  title: string;
  scaleItem: string;
  text: string;
  choices: Choice[];
  freeTextPrompt?: string;
  // Present only on the Scene 11 hesitation mini-game: a visible countdown runs, and if no
  // choice is tapped in time, timeoutWeight is recorded automatically as a hidden 3rd outcome.
  timedChoice?: TimedChoice;
}

export const scenarios: Scene[] = [
  {
    id: 1,
    title: "The Alarm",
    scaleItem: "WHO-5 W4",
    text: "Your alarm goes off at 7.30. You've got a 9am lecture on the other side of campus. You reach for your phone.",
    choices: [
      { id: "A", text: "Awake before it even finishes ringing. Straight up, feeling good.", weight: 2, layout: { x: 20, y: 1, width: 22, height: 92 } },
      { id: "B", text: "A bit groggy, but it's easy enough to get up.", weight: 1, layout: { x: 55, y: 14, width: 10, height: 74 } },
      { id: "C", text: "Snooze once. Lie there a bit, then get up.", weight: 0, layout: { x: 25, y:28, width: 15, height: 80 } },
      { id: "D", text: "Groggy and heavy. Takes a couple snoozes to actually move.", weight: -1, layout: { x: 60, y: 33, width: 12, height: 86 } },
      { id: "E", text: "Body just won't cooperate. Dreading the day already.", weight: -2, layout: { x: 32, y: 46, width: 30, height: 76 } }
    ],
    freeTextPrompt: "How have mornings been feeling for you lately?"
  },
  {
    id: 2,
    title: "Getting Ready",
    scaleItem: "WHO-5 W3",
    text: "You're getting ready for the day. About 20 minutes before you need to leave.",
    choices: [
      { id: "A", text: "Move fast, feel sharp. Even glance over your notes.", weight: 2, layout: { x: 20, y: 10, width: 31, height: 90 } },
      { id: "B", text: "Decent pace, nothing to complain about.", weight: 1, layout: { x: 58, y: 19, width: 25, height: 76 } },
      { id: "C", text: "Going through the motions. Just routine.", weight: 0, layout: { x: 26, y: 28, width: 25, height: 78 } },
      { id: "D", text: "Everything feels heavier than it should. Running late.", weight: -1, layout: { x: 62, y: 38, width: 33, height: 86 } },
      { id: "E", text: "Can barely get moving. Nearly forget your student ID.", weight: -2, layout: { x: 34, y: 47, width: 30, height: 82 } }
    ]
  },
  {
    id: 3,
    title: "The Commute",
    scaleItem: "SWEMWBS S1",
    text: "On the way to campus, your mind drifts to what's ahead: assignments, exams, life after graduation.",
    choices: [
      { id: "A", text: "Lots coming up, but it feels like it's heading somewhere good.", weight: 2, layout: { x: 16, y: 10, width: 34, height: 94 } },
      { id: "B", text: "Think about it a little, feel mostly okay.", weight: 1, layout: { x: 64, y: 19, width: 25, height: 74 } },
      { id: "C", text: "Don't really dwell on it. Earphones in, mind elsewhere.", weight: 0, layout: { x: 24, y: 28, width: 29, height: 82 } },
      { id: "D", text: "Same worry creeps back in, never really goes away.", weight: -1, layout: { x: 60, y: 38, width: 32, height: 86 } },
      { id: "E", text: "Worry won't let up. Just keeps circling.", weight: -2, layout: { x: 38, y: 47, width: 27, height: 80 } }
    ],
    freeTextPrompt: "What's been on your mind about the future lately?"
  },
  {
    id: 4,
    title: "The Lecture Begins",
    scaleItem: "WHO-5 W5",
    text: "The lecturer starts a new topic, something outside what you've studied before but related to your field.",
    choices: [
      { id: "A", text: "Genuinely curious. Leaning in, taking notes without thinking.", weight: 2, layout: { x: 20, y: 10, width: 33, height: 92 } },
      { id: "B", text: "Interesting enough to pay proper attention.", weight: 1, layout: { x: 62, y: 20, width: 26, height: 76 } },
      { id: "C", text: "Listening, taking notes. Just not that into it.", weight: 0, layout: { x: 30, y: 29, width: 27, height: 80 } },
      { id: "D", text: "Attention drifts. Doesn't feel like it matters right now.", weight: -1, layout: { x: 58, y: 38, width: 31, height: 84 } },
      { id: "E", text: "Can't focus at all. Nothing feels worth the effort.", weight: -2, layout: { x: 26, y: 47, width: 29, height: 82 } }
    ]
  },
  {
    id: 5,
    title: "Question in Class",
    scaleItem: "SWEMWBS S7",
    text: "The lecturer asks the class a question, not directed at anyone. Something comes to mind for you.",
    choices: [
      { id: "A", text: "Think it through, raise your hand. Feel sure enough.", weight: 2, layout: { x: 22, y: 10, width: 32, height: 90 } },
      { id: "B", text: "Got an answer, share it if no one else answers first.", weight: 1, layout: { x: 58, y: 20, width: 30, height: 78 } },
      { id: "C", text: "Form an answer, hold back, wait and see.", weight: 0, layout: { x: 20, y: 29, width: 27, height: 80 } },
      { id: "D", text: "Had the thought, talk yourself out of saying it.", weight: -1, layout: { x: 60, y: 38, width: 29, height: 82 } },
      { id: "E", text: "Don't trust your own thinking. Stay quiet anyway.", weight: -2, layout: { x: 32, y: 47, width: 26, height: 80 } }
    ]
  },
  {
    id: 6,
    title: "Group Project Conflict",
    scaleItem: "SWEMWBS S4",
    text: "Your project group meets after the lecture. One member hasn't done their part and the deadline is two days away.",
    choices: [
      { id: "A", text: "Bring it up calmly. Suggest splitting the leftover work.", weight: 2, layout: { x: 18, y: 10, width: 34, height: 92 } },
      { id: "B", text: "Mention it, help sort a plan, a bit of discussion.", weight: 1, layout: { x: 56, y: 19, width: 29, height: 78 } },
      { id: "C", text: "Quietly take on more yourself. Avoid the conversation.", weight: 0, layout: { x: 26, y: 28, width: 29, height: 82 } },
      { id: "D", text: "Frustrated, but say little. Pull back, focus on your part.", weight: -1, layout: { x: 60, y: 38, width: 31, height: 84 } },
      { id: "E", text: "Shut down completely. Do the bare minimum and get through it.", weight: -2, layout: { x: 36, y: 45, width: 31, height: 82 } }
    ],
    freeTextPrompt: "How do you usually handle situations like this?"
  },
  {
    id: 7,
    title: "Lunch",
    scaleItem: "SWEMWBS S3",
    text: "It's lunchtime. You're getting food and a few coursemates wave you over to their table.",
    choices: [
      { id: "A", text: "Join them, it's easy. Actually laugh a few times.", weight: 2, layout: { x: 20, y: 10, width: 31, height: 88 } },
      { id: "B", text: "Sit with them, enjoy it well enough.", weight: 1, layout: { x: 64, y: 19, width: 26, height: 76 } },
      { id: "C", text: "Sit with them, mostly just eat and listen.", weight: 0, layout: { x: 30, y: 29, width: 27, height: 80 } },
      { id: "D", text: "Small excuse about studying. Sit somewhere quieter instead.", weight: -1, layout: { x: 58, y: 38, width: 31, height: 84 } },
      { id: "E", text: "Avoid it, eat alone. People feel like too much right now.", weight: -2, layout: { x: 32, y: 47, width: 30, height: 82 } }
    ]
  },
  {
    id: 8,
    title: "A Friend Needs Help",
    scaleItem: "SWEMWBS S2",
    text: "A friend messages you. They missed a lecture and are stuck on something you understand well. They ask if you can explain it.",
    choices: [
      { id: "A", text: "Happy to help. Meet up, walk them through it properly.", weight: 2, layout: { x: 16, y: 1, width: 34, height: 92 } },
      { id: "B", text: "Send your notes over, tell them to ask if unclear.", weight: 1, layout: { x: 62, y: 16, width: 30, height: 78 } },
      { id: "C", text: "Say you'll try later, without really committing.", weight: 0, layout: { x: 26, y: 25, width: 27, height: 80 } },
      { id: "D", text: "Feel a bit bad, but say you can't right now.", weight: -1, layout: { x: 58, y: 32, width: 29, height: 82 } },
      { id: "E", text: "Don't reply. Can't deal with it right now.", weight: -2, layout: { x: 34, y: 42, width: 27, height: 80 } }
    ]
  },
  {
    id: 9,
    title: "Mid-Afternoon Slump",
    scaleItem: "WHO-5 W3",
    text: "It's 3pm. You've got a two-hour study block before your next thing. You sit down at a desk with your laptop.",
    choices: [
      { id: "A", text: "Feel energised again. Headphones in, straight into it.", weight: 2, layout: { x: 22, y: 10, width: 30, height: 86 } },
      { id: "B", text: "Settle in after a short warm-up, get a decent amount done.", weight: 1, layout: { x: 64, y: 19, width: 31, height: 82 } },
      { id: "C", text: "Browse notes a bit before starting properly.", weight: 0, layout: { x: 20, y: 28, width: 27, height: 80 } },
      { id: "D", text: "Feel heavy, unfocused. Takes a while to actually start.", weight: -1, layout: { x: 62, y: 38, width: 30, height: 82 } },
      { id: "E", text: "Completely drained. Barely get anything done all afternoon.", weight: -2, layout: { x: 36, y: 45, width: 31, height: 82 } }
    ]
  },
  {
    id: 10,
    title: "Assignment Block",
    scaleItem: "SWEMWBS S5",
    text: "You hit a part of the assignment you don't get. You've read it twice and it still doesn't make sense.",
    choices: [
      { id: "A", text: "Break it into pieces, work it from a different angle. Takes a while, but it finally makes sense.", weight: 2, layout: { x: 14, y: 10, width: 35, height: 96 } },
      { id: "B", text: "Short break, come back, work it out reasonably well.", weight: 1, layout: { x: 64, y: 20, width: 30, height: 78 } },
      { id: "C", text: "Leave it, switch to another section for now.", weight: 0, layout: { x: 24, y: 29, width: 25, height: 78 } },
      { id: "D", text: "Confusion builds. Drift to something else without meaning to.", weight: -1, layout: { x: 60, y: 38, width: 31, height: 82 } },
      { id: "E", text: "Head fogs up completely. Close the tab, give up for the day.", weight: -2, layout: { x: 34, y: 47, width: 31, height: 82 } }
    ],
    freeTextPrompt: "When a piece of coursework feels overwhelming, what do you notice happening in your mind?"
  },
  {
    id: 11,
    title: "Decision Under Time Pressure",
    scaleItem: "SWEMWBS S7",
    text: "Your group chat is going back and forth about which framework to use. Two people disagree and the conversation's stuck. Someone tags you: \"you decide, we're moving on.\" A countdown starts.",
    choices: [
      { id: "A", text: "Go with what was suggested, it covers what we need.", weight: 2, layout: { x: 34, y: 14, width: 32, height: 82 } },
      { id: "B", text: "Whatever's fine with me, you all decide.", weight: -1, layout: { x: 36, y: 30, width: 27, height: 76 } }
    ],
    timedChoice: { limitMs: 16000, timeoutWeight: -2 }
  },
  {
    id: 12,
    title: "Social Invitation",
    scaleItem: "SWEMWBS S6",
    text: "A friend invites you over that evening, nothing big, just watching something together. You've got some work left but nothing urgent tonight.",
    choices: [
      { id: "A", text: "Go, it's easy. Actually looking forward to it.", weight: 2, layout: { x: 18, y: 10, width: 31, height: 88 } },
      { id: "B", text: "Go, enjoy it, work still nagging at the back of your mind.", weight: 1, layout: { x: 62, y: 16, width: 32, height: 80 } },
      { id: "C", text: "Go, but a low hum of guilt. Keep checking your phone.", weight: 0, layout: { x: 26, y: 26, width: 30, height: 80 } },
      { id: "D", text: "Say no. Feels like more effort than you have right now.", weight: -1, layout: { x: 58, y: 34, width: 29, height: 84 } },
      { id: "E", text: "Turn it down. Don't want to see anyone right now.", weight: -2, layout: { x: 30, y: 43, width: 27, height: 80 } }
    ]
  },
  {
    id: 13,
    title: "A Quiet Moment of Worry",
    scaleItem: "WHO-5 W2",
    text: "It's early evening, you're alone, maybe making tea or just lying down. A thought about something uncertain pops into your head.",
    choices: [
      { id: "A", text: "Notice it, sit with it a second, let it go pretty easily.", weight: 2, layout: { x: 16, y: 10, width: 33, height: 92 } },
      { id: "B", text: "Think about it a bit, then get distracted, move on.", weight: 1, layout: { x: 64, y: 18, width: 30, height: 78 } },
      { id: "C", text: "Stays with you a while, fades on its own eventually.", weight: 0, layout: { x: 24, y: 26, width: 30, height: 80 } },
      { id: "D", text: "Hard to shake. Keep coming back to it.", weight: -1, layout: { x: 60, y: 32, width: 27, height: 80 } },
      { id: "E", text: "Spirals. One worry pulls in another, sticks around.", weight: -2, layout: { x: 36, y: 44, width: 31, height: 84 } }
    ],
    freeTextPrompt: "Is there anything that's been weighing on you lately that you haven't been able to put down?"
  },
  {
    id: 14,
    title: "End of Day Reflection",
    scaleItem: "WHO-5 W1",
    text: "It's around 9pm. You're thinking back over the day. Overall, how has it felt?",
    choices: [
      { id: "A", text: "Genuinely good. Stressful bits, but overall fine.", weight: 2, layout: { x: 20, y: 10, width: 32, height: 88 } },
      { id: "B", text: "Pretty decent. A few rough patches, nothing major.", weight: 1, layout: { x: 64, y: 19, width: 30, height: 78 } },
      { id: "C", text: "Mixed. Some parts fine, some not. Hard to sum up.", weight: 0, layout: { x: 28, y: 29, width: 30, height: 80 } },
      { id: "D", text: "Not great. Heavier than usual, still stuck with you.", weight: -1, layout: { x: 58, y: 38, width: 29, height: 82 } },
      { id: "E", text: "Flat, low. Felt like a weight the whole day.", weight: -2, layout: { x: 32, y: 47, width: 26, height: 80 } }
    ]
  },
  {
    id: 15,
    title: "Before Bed",
    scaleItem: "WHO-5 W2",
    text: "You're in bed. The day is done. You lie there in the quiet.",
    choices: [
      { id: "A", text: "Body and mind properly settled. Ready to sleep.", weight: 2, layout: { x: 22, y: 10, width: 31, height: 86 } },
      { id: "B", text: "Fairly calm. Mind eases pretty quickly.", weight: 1, layout: { x: 64, y: 19, width: 25, height: 76 } },
      { id: "C", text: "Mind wanders a bit before quieting down.", weight: 0, layout: { x: 26, y: 28, width: 27, height: 78 } },
      { id: "D", text: "Restless. Takes a long time for thoughts to settle.", weight: -1, layout: { x: 60, y: 38, width: 31, height: 82 } },
      { id: "E", text: "Thoughts keep racing. Lying there for ages, can't switch off.", weight: -2, layout: { x: 34, y: 47, width: 32, height: 84 } }
    ]
  }
];
