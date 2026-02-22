// src/data/mirageLineups.ts
export type MirageLineup = {
  lineupId: string;      // unique (ex: "mid-window-01")
  stuffId: string;       // groupe (ex: "mid-window")
  title: string;         // "Smoke Window"
  type: "smoke" | "flash" | "molotov" | "he";

  // positions en % (responsive)
  result: { x: number; y: number }; // où la smoke “tombe” (icône smoke)
  throw:  { x: number; y: number }; // où le joueur se place (icône perso)

  // tooltip preview (image)
  previewImg: string; // /previews/mirage/mid-window-01.jpg
};

export const mirageLineups: MirageLineup[] = [
  {
    lineupId: "mid-window-01",
    stuffId: "mid-window",
    title: "Smoke Window",
    type: "smoke",
    result: { x: 40.5, y: 36.2 },
    throw: { x: 33.0, y: 46.0 },
    previewImg: "/previews/mirage/mid-window-01.jpg",
  },
];