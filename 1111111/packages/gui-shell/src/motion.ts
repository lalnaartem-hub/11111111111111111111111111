export type SpringConfig = { stiffness: number; damping: number; mass?: number };

export function spring(
  reduce: boolean,
  preset: SpringConfig = { stiffness: 420, damping: 32 }
): SpringConfig | { duration: number } {
  if (reduce) return { duration: 0.01 };
  return preset;
}

export const MOTION = {
  dockEnter: { stiffness: 380, damping: 28, mass: 0.8 },
  dockHover: { stiffness: 520, damping: 22 },
  windowOpen: { stiffness: 340, damping: 30, mass: 0.9 },
  windowClose: { stiffness: 400, damping: 35 },
  wallpaper: { stiffness: 200, damping: 40 },
  menu: { stiffness: 450, damping: 32 },
} as const;
