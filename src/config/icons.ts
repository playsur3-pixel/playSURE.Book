export type GrenadeType = "smoke" | "flash" | "molotov" | "he";
export type GrenadeFilter = "all" | GrenadeType;

export const GRENADE_ICONS: Record<GrenadeType, { src: string; size: number }> = {
  smoke: { src: "/icons/ct-smoke.svg", size: 60 },
  flash: { src: "/icons/flash.svg", size: 60 },
  molotov: { src: "/icons/molotov.svg", size: 60 },
  he: { src: "/icons/he.svg", size: 60 },
};

export const PLAYER_ICON = { src: "/icons/player.svg", size: 34 } as const;