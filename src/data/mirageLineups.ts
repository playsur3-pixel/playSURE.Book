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
  lineupId: "smokewindow-2026-02-22080123",
  stuffId: "smokewindow",
  title: "Smoke Windows",
  type: "smoke",
  result: { x: 37.23, y: 46.22 },
  throw: { x: 98.58, y: 30.73 },
  previewImg: "/previews/mirage/smokewindow.jpg",
},
{
  lineupId: "smokeshort-2026-02-22080235",
  stuffId: "smokeshort",
  title: "Smoke Short",
  type: "smoke",
  result: { x: 62.32, y: 41.43 },
  throw: { x: 98.58, y: 30.73 },
  previewImg: "/previews/mirage/smokeshort.jpg",
},
{
  lineupId: "cplact-2026-02-22080315",
  stuffId: "cplact",
  title: "Smoke CT CPL-A",
  type: "smoke",
  result: { x: 43.24, y: 88.96 },
  throw: { x: 90.22, y: 55.28 },
  previewImg: "/previews/mirage/cplact.jpg",
},
{
  lineupId: "cplastairs-2026-02-22080412",
  stuffId: "cplastairs",
  title: "Smoke Stairs CPL-A",
  type: "smoke",
  result: { x: 53.15, y: 69.25 },
  throw: { x: 92.02, y: 59.9 },
  previewImg: "/previews/mirage/cplastairs.jpg",
},
{
  lineupId: "cplajungle-2026-02-22080442",
  stuffId: "cplajungle",
  title: "Smoke Jungle CPL-A",
  type: "smoke",
  result: { x: 48.42, y: 69.58 },
  throw: { x: 84.13, y: 67.78 },
  previewImg: "/previews/mirage/cplajungle.jpg",
},
{
  lineupId: "connect-2026-02-22080616",
  stuffId: "connect",
  title: "Smoke Connector",
  type: "smoke",
  result: { x: 48.2, y: 51.33 },
  throw: { x: 98.67, y: 30.38 },
  previewImg: "/previews/mirage/connect.jpg",
},
{
  lineupId: "molosandwich-2026-02-22080702",
  stuffId: "molosandwich",
  title: "Molotov Sandwich",
  type: "molotov",
  result: { x: 56.73, y: 68.19 },
  throw: { x: 83.41, y: 68.87 },
  previewImg: "/previews/mirage/molosandwich.jpg",
},
{
  lineupId: "molostairs-2026-02-22080729",
  stuffId: "molostairs",
  title: "Molotov Stairs",
  type: "molotov",
  result: { x: 53.27, y: 68.85 },
  throw: { x: 83.41, y: 68.87 },
  previewImg: "/previews/mirage/molostairs.jpg",
},
{
  lineupId: "molodefapalace-2026-02-22080751",
  stuffId: "molodefapalace",
  title: "Molotov Default A from Palace",
  type: "molotov",
  result: { x: 60.62, y: 84.49 },
  throw: { x: 64.82, y: 84.6 },
  previewImg: "/previews/mirage/molodefapalace.jpg",
},
{
  lineupId: "moloputerampa-2026-02-22080831",
  stuffId: "moloputerampa",
  title: "Molotov Pute Ramp A",
  type: "molotov",
  result: { x: 67.85, y: 71.54 },
  throw: { x: 72.05, y: 72.12 },
  previewImg: "/previews/mirage/moloputerampa.jpg",
},
{
  lineupId: "molotripple-2026-02-22080921",
  stuffId: "molotripple",
  title: "Molotov Tripple",
  type: "molotov",
  result: { x: 47.08, y: 82.27 },
  throw: { x: 63.3, y: 64.89 },
  previewImg: "/previews/mirage/molotripple.jpg",
},
{
  lineupId: "flashrushb-2026-02-22080954",
  stuffId: "flashrushb",
  title: "Flash Bp B Rush",
  type: "flash",
  result: { x: 24, y: 18.19 },
  throw: { x: 32.83, y: 11.63 },
  previewImg: "/previews/mirage/flashrushb.jpg",
},
{
  lineupId: "heapexrampa-2026-02-22081031",
  stuffId: "heapexrampa",
  title: "HE Ramp A",
  type: "he",
  result: { x: 74.97, y: 69.33 },
  throw: { x: 40.88, y: 67.62 },
  previewImg: "/previews/mirage/heapexrampa.jpg",
},

];