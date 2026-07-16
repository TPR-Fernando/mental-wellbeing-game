export interface Choice {
  id: string;
  text: string;
  weight: number;
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
      { id: "A", text: "You're properly awake before it even finishes ringing. You get up straight away, feeling good.", weight: 2 },
      { id: "B", text: "A bit sleepy, but nothing major. You get up without much of a fight.", weight: 1 },
      { id: "C", text: "You snooze once, lie there a bit, then get up. Nothing special either way.", weight: 0 },
      { id: "D", text: "You feel groggy and heavy. It takes a couple of snoozes before you actually move.", weight: -1 },
      { id: "E", text: "Your body just refuses to cooperate. You lie there way longer than you should, dreading the day already.", weight: -2 }
    ],
    freeTextPrompt: "How have mornings been feeling for you lately?"
  },
  {
    id: 2,
    title: "Getting Ready",
    scaleItem: "WHO-5 W3",
    text: "You're getting ready for the day. About 20 minutes before you need to leave.",
    choices: [
      { id: "A", text: "You move fast and feel sharp, you even glance over your notes before heading out.", weight: 2 },
      { id: "B", text: "You get through it at a decent pace, nothing to complain about.", weight: 1 },
      { id: "C", text: "You go through the motions. Not fast, not slow, just routine.", weight: 0 },
      { id: "D", text: "Everything feels a bit heavier than it should. You move slowly and cut it close on time.", weight: -1 },
      { id: "E", text: "You can barely get yourself moving. You're rushing at the end and nearly forget your student ID.", weight: -2 }
    ]
  },
  {
    id: 3,
    title: "The Commute",
    scaleItem: "SWEMWBS S1",
    text: "On the way to campus, your mind drifts to what's ahead: assignments, exams, life after graduation.",
    choices: [
      { id: "A", text: "There's a lot coming up, but you feel good about it. Like things are actually heading somewhere.", weight: 2 },
      { id: "B", text: "You think about it a little and feel mostly okay, nothing weighing you down.", weight: 1 },
      { id: "C", text: "You don't really dwell on it. You put your earphones in and think about something else.", weight: 0 },
      { id: "D", text: "A familiar worry creeps in. You think about the same things again without really working through them.", weight: -1 },
      { id: "E", text: "The worry doesn't let up. It just keeps circling and you can't shake the unease.", weight: -2 }
    ],
    freeTextPrompt: "What's been on your mind about the future lately?"
  },
  {
    id: 4,
    title: "The Lecture Begins",
    scaleItem: "WHO-5 W5",
    text: "The lecturer starts a new topic, something outside what you've studied before but related to your field.",
    choices: [
      { id: "A", text: "You feel genuinely curious. You lean in and start taking notes without even thinking about it.", weight: 2 },
      { id: "B", text: "You find it reasonably interesting, enough to pay proper attention.", weight: 1 },
      { id: "C", text: "You listen and take notes. You're present, just not particularly invested.", weight: 0 },
      { id: "D", text: "Your attention drifts. Nothing about it feels like it matters much right now.", weight: -1 },
      { id: "E", text: "You can't focus on it at all. Nothing feels interesting or worth the effort lately.", weight: -2 }
    ]
  },
  {
    id: 5,
    title: "Question in Class",
    scaleItem: "SWEMWBS S7",
    text: "The lecturer asks the class a question, not directed at anyone. Something comes to mind for you.",
    choices: [
      { id: "A", text: "You think it through and raise your hand. You feel sure enough about your answer.", weight: 2 },
      { id: "B", text: "You've got an answer in mind and share it if no one else does first.", weight: 1 },
      { id: "C", text: "You form an answer but hold back, waiting to see what others say.", weight: 0 },
      { id: "D", text: "You had a clear thought a second ago, but you talk yourself out of saying it.", weight: -1 },
      { id: "E", text: "You don't trust your own thinking at all right now, so you stay quiet even though you knew the answer.", weight: -2 }
    ]
  },
  {
    id: 6,
    title: "Group Project Conflict",
    scaleItem: "SWEMWBS S4",
    text: "Your project group meets after the lecture. One member hasn't done their part and the deadline is two days away.",
    choices: [
      { id: "A", text: "You bring it up calmly and directly, and suggest splitting the leftover work so everyone's clear on what's next.", weight: 2 },
      { id: "B", text: "You mention it and help sort out a plan, even if it takes a bit of back and forth.", weight: 1 },
      { id: "C", text: "You quietly take on more of the work yourself just to avoid a whole conversation about it.", weight: 0 },
      { id: "D", text: "You're frustrated but don't say much. You pull back and just focus on your own part.", weight: -1 },
      { id: "E", text: "You completely shut down about it. You say nothing, do the bare minimum, and let the resentment build.", weight: -2 }
    ],
    freeTextPrompt: "How do you usually handle situations like this?"
  },
  {
    id: 7,
    title: "Lunch",
    scaleItem: "SWEMWBS S6",
    text: "It's lunchtime. You're getting food and a few coursemates wave you over to their table.",
    choices: [
      { id: "A", text: "You join them and it feels easy. The conversation flows and you actually laugh a few times.", weight: 2 },
      { id: "B", text: "You sit with them and enjoy it well enough, even if you're not the loudest one there.", weight: 1 },
      { id: "C", text: "You sit with them but mostly just eat and listen, not really part of it.", weight: 0 },
      { id: "D", text: "You make a small excuse about needing to study and sit somewhere quieter instead.", weight: -1 },
      { id: "E", text: "You avoid it altogether and eat by yourself. Being around people feels like too much right now.", weight: -2 }
    ]
  },
  {
    id: 8,
    title: "A Friend Needs Help",
    scaleItem: "SWEMWBS S2",
    text: "A friend messages you. They missed a lecture and are stuck on something you understand well. They ask if you can explain it.",
    choices: [
      { id: "A", text: "You're happy to help. You meet up between classes and walk them through it properly.", weight: 2 },
      { id: "B", text: "You send your notes over and tell them to ask if anything's still unclear.", weight: 1 },
      { id: "C", text: "You say you'll try to help later, without really committing either way.", weight: 0 },
      { id: "D", text: "You feel a bit bad about it, but you say you can't right now, you've got your own work.", weight: -1 },
      { id: "E", text: "You leave the message on read. You don't really feel like dealing with it.", weight: -2 }
    ]
  },
  {
    id: 9,
    title: "Mid-Afternoon Slump",
    scaleItem: "WHO-5 W3",
    text: "It's 3pm. You've got a two-hour study block before your next thing. You sit down at a desk with your laptop.",
    choices: [
      { id: "A", text: "You get a second wind. Headphones in, and you're straight into it.", weight: 2 },
      { id: "B", text: "You settle in after a short warm-up and get a decent amount done.", weight: 1 },
      { id: "C", text: "You browse your notes for a bit before easing into something productive.", weight: 0 },
      { id: "D", text: "You feel heavy and unfocused. It takes a while before you actually start.", weight: -1 },
      { id: "E", text: "You're completely drained. You stare at the screen and barely get anything done the whole time.", weight: -2 }
    ]
  },
  {
    id: 10,
    title: "Assignment Block",
    scaleItem: "SWEMWBS S5",
    text: "You hit a part of the assignment you don't get. You've read it twice and it's still not clicking.",
    choices: [
      { id: "A", text: "You break it into smaller pieces and work through it from a different angle. It takes a while but it clicks.", weight: 2 },
      { id: "B", text: "You take a short break, come back, and manage to work it out reasonably well.", weight: 1 },
      { id: "C", text: "You leave it for now and switch to a different section, planning to come back to it later.", weight: 0 },
      { id: "D", text: "The confusion builds and it's hard to focus. You end up drifting to something else without meaning to.", weight: -1 },
      { id: "E", text: "Your head just fogs up completely. You close the tab and give up on it for the day.", weight: -2 }
    ],
    freeTextPrompt: "When you're stuck on something academic, what usually goes through your mind?"
  },
  {
    id: 11,
    title: "Forced Decision Under Time Pressure",
    scaleItem: "SWEMWBS S7",
    text: "Your group chat is going back and forth about which framework to use. Two people disagree and the conversation's stuck. Someone tags you: \"you decide, we're moving on.\"",
    choices: [
      { id: "A", text: "Go with what they suggested, it covers what we need.", weight: 2 },
      { id: "B", text: "Whatever's fine with me, you all decide.", weight: -1 }
    ],
    // Hidden 3rd outcome: no tap before the countdown ends. Recorded automatically, never a button.
    timedChoice: { limitMs: 6000, timeoutWeight: -2 }
  },
  {
    id: 12,
    title: "Social Invitation",
    scaleItem: "SWEMWBS S3",
    text: "A friend invites you over that evening, nothing big, just watching something together. You've got some work left but nothing urgent tonight.",
    choices: [
      { id: "A", text: "You go, and it feels easy. You're actually looking forward to the break.", weight: 2 },
      { id: "B", text: "You go and enjoy it, even with the work at the back of your mind.", weight: 1 },
      { id: "C", text: "You go, but there's a low hum of guilt the whole time. You keep checking your phone.", weight: 0 },
      { id: "D", text: "You say no. It just feels like more effort than you have right now.", weight: -1 },
      { id: "E", text: "You turn it down and don't really want to see anyone. You'd rather just be alone.", weight: -2 }
    ]
  },
  {
    id: 13,
    title: "A Quiet Moment of Worry",
    scaleItem: "WHO-5 W2",
    text: "It's early evening, you're alone, maybe making tea or just lying down. A thought about something uncertain surfaces on its own.",
    choices: [
      { id: "A", text: "You notice it, sit with it for a second, and let it go pretty easily.", weight: 2 },
      { id: "B", text: "You think about it for a bit, then get distracted by something else and move on.", weight: 1 },
      { id: "C", text: "It stays with you for a while before it eventually fades on its own.", weight: 0 },
      { id: "D", text: "It's hard to shake. You keep coming back to it even when you try to think about something else.", weight: -1 },
      { id: "E", text: "It spirals. One worry pulls in another and the feeling sticks around for a long time.", weight: -2 }
    ],
    freeTextPrompt: "Is there anything that's been weighing on you lately that you haven't been able to put down?"
  },
  {
    id: 14,
    title: "End of Day Reflection",
    scaleItem: "WHO-5 W1",
    text: "It's around 9pm. You're thinking back over the day. Overall, how has it felt?",
    choices: [
      { id: "A", text: "Genuinely good. There were stressful bits, but overall you feel fine about how it went.", weight: 2 },
      { id: "B", text: "Pretty decent. A few rough patches, but nothing that really got you down.", weight: 1 },
      { id: "C", text: "Mixed. Some parts were fine, some weren't. Hard to sum up either way.", weight: 0 },
      { id: "D", text: "Not great. The day felt heavier than usual and it's stuck with you.", weight: -1 },
      { id: "E", text: "Flat, low, hard to explain. The day just felt like a weight the whole way through.", weight: -2 }
    ]
  },
  {
    id: 15,
    title: "Before Bed",
    scaleItem: "WHO-5 W2",
    text: "You're in bed. The day is done. You lie there in the quiet.",
    choices: [
      { id: "A", text: "Your body and mind feel properly settled. You're ready to sleep.", weight: 2 },
      { id: "B", text: "You feel fairly calm. Your mind eases fairly quickly.", weight: 1 },
      { id: "C", text: "Your mind wanders for a bit before it eventually quiets down.", weight: 0 },
      { id: "D", text: "You're restless. It takes a long time before your thoughts settle at all.", weight: -1 },
      { id: "E", text: "Your thoughts keep racing. You lie there for ages, not able to switch off.", weight: -2 }
    ]
  }
];