import type { MutableRefObject } from "react";

export type ChickenRescueRescueMeta = {
  /** Advanced run: rescued a golden sleeping chook (counts toward WIN_ADVANCED_GAME GoldenChook). */
  golden?: boolean;
};

/** Live handlers Phaser reads via ref (updated each React render). */
export type ChickenRescuePhaserHandlers = {
  getScore: () => number;
  onChickenRescued: (points: number, meta?: ChickenRescueRescueMeta) => void;
  onGameOver: () => void;
};

export type ChickenRescuePhaserApiRef = MutableRefObject<ChickenRescuePhaserHandlers>;

export const defaultPhaserHandlers = (): ChickenRescuePhaserHandlers => ({
  getScore: () => 0,
  onChickenRescued: () => {},
  onGameOver: () => {},
});
