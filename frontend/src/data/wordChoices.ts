export interface WordOption {
  text: string;
  weight: -1 | 0 | 1;
}

export interface WordChoiceSet {
  prompt: string;
  words: WordOption[];
  sceneContext: string;
}

// Three mini-game instances, placed after emotionally loaded narrative scenes.
// Each set contains a prompt and 3 word options with weights distributed as -1, 0, +1.
// These weights feed only into the AI summary tone (Summary.tsx), never into the real
// groundTruth questionnaire. Weights are not visible in participant-facing text.
export const wordChoices: Record<number, WordChoiceSet> = {
  // mg_01: after Scene 6 (Group Project Conflict)
  1: {
    prompt: "Right now, I feel...",
    words: [
      { text: "Drained", weight: -1 },
      { text: "Steady", weight: 0 },
      { text: "Encouraged", weight: 1 }
    ],
    sceneContext: "After navigating group project conflict"
  },

  // mg_02: after Scene 10 (Assignment Block)
  2: {
    prompt: "Right now, I feel...",
    words: [
      { text: "Stuck", weight: -1 },
      { text: "Focused", weight: 0 },
      { text: "Motivated", weight: 1 }
    ],
    sceneContext: "After facing assignment block challenge"
  },

  // mg_03: after Scene 13 (Quiet Moment of Worry)
  3: {
    prompt: "Right now, I feel...",
    words: [
      { text: "Uneasy", weight: -1 },
      { text: "Calm", weight: 0 },
      { text: "Reassured", weight: 1 }
    ],
    sceneContext: "After a quiet moment of worry"
  }
};
