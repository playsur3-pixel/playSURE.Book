export type StuffVideo = {
  label: string;
  embedSrc: string; // "https://www.youtube.com/embed/xxxxx"
  start?: number;
};

export type StuffPack = {
  title: string;
  videos: StuffVideo[];
  instructions: string[];
};

export type StratItem = {
  title: string;
  goal?: string;
  steps: string[];
};

export const mirageStuffTR: StuffPack[] = [
  {
    title: "CPL A — 3 Smokes essentielles",
    videos: [
      { label: "Smoke CT", embedSrc: "https://www.youtube.com/embed/HXyNAMWbPl8?si=1IZUkjlTCgBk8Zca" },
      { label: "Smoke jungle", embedSrc: "https://www.youtube.com/embed/i483uCt3ySk?si=D15BH5_r2JIvrD1C"},
      { label: "Smoke stairs", embedSrc: "https://www.youtube.com/embed/NLWgsKkhpm0?si=XOgiglrJhKFnfElC"},
    ],
    instructions: [
      "Jumpthrow.",
      "Clique gauche.",
      "Clique gauche.",
    ],
  },
];

export const mirageStuffCT: StuffPack[] = [
  {
    title: "CT — Retake A (2 flashes)",
    videos: [
      { label: "Flash retake 1", embedSrc: "https://www.youtube.com/embed/pzOoCRe3vgk", start: 25 },
      { label: "Flash retake 2", embedSrc: "https://www.youtube.com/embed/pzOoCRe3vgk", start: 33 },
    ],
    instructions: [
      "Setup : 2 jungle / 1 CT / 2 stairs.",
      "Go sur flash 1, trade immédiat.",
      "Flash 2 pour clear default + triple.",
    ],
  },
];

// ✅ Strats séparées par side
export const mirageStratsTR: StratItem[] = [
  {
    title: "Default Mirage (prise d’info + map control)",
    goal: "Obtenir info early puis isoler une zone faible.",
    steps: [
      "1-3-1 : 1 palace, 3 mid, 1 apps.",
      "Mid : smoke top mid + prise underpass selon info.",
      "Si push CT mid : punish (flash + peek).",
      "Si apps free : split A/B selon timing.",
    ],
  },
  {
    title: "Split A (jungle / stairs)",
    goal: "Forcer rotations et casser le setup A.",
    steps: [
      "2 palace prêts à sortir (trade).",
      "2 mid -> jungle.",
      "1 under -> connector.",
      "Go : flash jungle + entry coordonné.",
    ],
  },
];

export const mirageStratsCT: StratItem[] = [
  {
    title: "Setup A 2-1-2 (anti CPL)",
    goal: "Tenir A + infos mid, garder une reprise rapide.",
    steps: [
      "2 A (jungle + stairs), 1 window, 2 B.",
      "Info mid : one-way / timing peek.",
      "Si smoke window : jouer retake mid (short/conn).",
    ],
  },
];
