export type StuffItem = {
  title: string;
  embedSrc: string;     // ✅ le src de l’iframe (copié depuis YouTube)
  start?: number;       // optionnel
  instructions: string[];
};

export type StratItem = {
  title: string;
  goal?: string;
  steps: string[];
};

export const mirageStuff: StuffItem[] = [
  {
    title: "Flash Rush B",
    embedSrc: "https://www.youtube.com/embed/pzOoCRe3vgk?si=DQDz6OtTWxNbju0e",
    instructions: [
      "Smoke 1 : ...",
      "Smoke 2 : ...",
      "Timing : 3-2-1",
      "Après : 1 hold CT, 1 hold jungle, 3 exec",
    ],
  },
  {
    title: "CPL A — Flash pop",
    embedSrc: "https://www.youtube.com/watch?v=pzOoCRe3vgk",
    start: 15,
    instructions: ["Call 'turn'", "Entry 2 joueurs + 1 trade", "…"],
  },
];

export const mirageStrats: StratItem[] = [
  {
    title: "Default Mirage",
    goal: "Prise d’info + map control",
    steps: ["1-3-1", "Smoke top mid", "Punish mid push", "Split selon info"],
  },
];
