import type { MutableRefObject } from "react";

export type warzoneMeta = {
  /** Advanced run: rescued a golden chook (counts toward ADVANCED_GAMEOVER token `"2"`). */
  golden?: boolean;
};

/** Live handlers Phaser reads via ref (updated each React render). */
export type WarzonePhaserHandlers = {
  getScore: () => number;
  onEnemyKilled: (points: number, meta?: warzoneMeta) => void;
  onGameOver: () => void;
};

export type WarzonePhaserApiRef = MutableRefObject<WarzonePhaserHandlers>;

export const defaultPhaserHandlers = (): WarzonePhaserHandlers => ({
  getScore: () => 0,
  onEnemyKilled: () => {},
  onGameOver: () => {},
});
