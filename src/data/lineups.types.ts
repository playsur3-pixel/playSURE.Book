export type GrenadeType = "smoke" | "flash" | "molotov" | "he";

export type Lineup = {
  lineupId: string;
  title: string;
  type: GrenadeType;
  throw: { x: number; y: number };   // 0-100 (%)
  result: { x: number; y: number };  // 0-100 (%)
  previewImg?: string;
};
