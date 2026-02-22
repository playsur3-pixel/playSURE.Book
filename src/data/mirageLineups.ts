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
  lineupId: "smokewindow-2026-02-22035939",
  stuffId: "smokewindow",
  title: "Smoke Window",
  type: "smoke",
  result: { x: 37.06, y: 42.77 },
  throw: { x: 95.22, y: 30.83 },
  previewImg: "/previews/mirage/smoke-window.jpg",
},
{
  lineupId: "smokeshort-2026-02-22040201",
  stuffId: "smokeshort",
  title: "Smoke Short",
  type: "smoke",
  result: { x: 60.39, y: 40.02 },
  throw: { x: 95.68, y: 30.83 },
  previewImg: "/previews/mirage/smoke-short.jpg",
},
{
  lineupId: "cplact-2026-02-22040248",
  stuffId: "cplact",
  title: "Smoke CPL A CT",
  type: "smoke",
  result: { x: 43.23, y: 81.97 },
  throw: { x: 88.66, y: 52.71 },
  previewImg: "/previews/mirage/cplact.jpg",
},
{
  lineupId: "cplastairts-2026-02-22040314",
  stuffId: "cplastairts",
  title: "Smoke CPL A Stairs",
  type: "smoke",
  result: { x: 52.75, y: 64.24 },
  throw: { x: 90.35, y: 56.42 },
  previewImg: "/previews/mirage/cplastairts.jpg",
},
{
  lineupId: "cplajungle-2026-02-22040343",
  stuffId: "cplajungle",
  title: "Smoke CPL A Jungle",
  type: "smoke",
  result: { x: 48.91, y: 64.11 },
  throw: { x: 82.52, y: 64.11 },
  previewImg: "/previews/mirage/cplajungle.jpg",
},
{
  lineupId: "molostrairs-2026-02-22040513",
  stuffId: "molostrairs",
  title: "A Molotov Stairs",
  type: "molotov",
  result: { x: 53.36, y: 64.11 },
  throw: { x: 82.37, y: 64.38 },
  previewImg: "/previews/mirage/molostrairs.jpg",
},
{
  lineupId: "molosandwich-2026-02-22040541",
  stuffId: "molosandwich",
  title: "A Molotov Sandwich",
  type: "molotov",
  result: { x: 56.89, y: 63.83 },
  throw: { x: 82.37, y: 63.83 },
  previewImg: "/previews/mirage/molosandwich.jpg",
},
{
  lineupId: "molobpapalace-2026-02-22040745",
  stuffId: "molobpapalace",
  title: "A Default Molotov depuis Palace",
  type: "molotov",
  result: { x: 59.96, y: 76.2 },
  throw: { x: 64.1, y: 78.67 },
  previewImg: "/previews/mirage/molotov-defaultAPalace.jpg",
},
{
  lineupId: "molotripple-2026-02-22040901",
  stuffId: "molotripple",
  title: "A Tripple depuis Tetris",
  type: "molotov",
  result: { x: 47.22, y: 75.65 },
  throw: { x: 62.26, y: 61.09 },
  previewImg: "/previews/mirage/molotripple.jpg",
},
{
  lineupId: "molotorampa-2026-02-22042156",
  stuffId: "molotorampa",
  title: "Pute A Ramp",
  type: "molotov",
  result: { x: 67.45, y: 66.78 },
  throw: { x: 71.44, y: 67.06 },
  previewImg: "/previews/mirage/molotov-puteRampA.jpg",
},
];