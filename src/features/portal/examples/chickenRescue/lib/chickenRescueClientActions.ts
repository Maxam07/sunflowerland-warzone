import type { MinigameActionDefinition } from "lib/portal";

export const CHICKEN_RESCUE_CLIENT_ACTIONS: Record<
  string,
  MinigameActionDefinition
> = {
  START_GAME: {
    mint: {
      LIVE_GAME: { amount: 1 },
    },
    burn: {
      "4": { amount: 1 },
    },
  },
  GAMEOVER: {
    mint: {
      "1": { min: 0, max: 100, dailyCap: 1000 },
    },
    burn: {
      LIVE_GAME: { amount: 1 },
    },
  },
  START_ADVANCED_GAME: {
    mint: {
      ADVANCED_GAME: { amount: 1 },
    },
    burn: {
      "3": { amount: 1 },
    },
  },
  ADVANCED_GAMEOVER: {
    mint: {
      "1": { min: 0, max: 100, dailyCap: 1000 },
      "2": { min: 0, max: 3, dailyCap: 300 },
    },
    burn: {
      ADVANCED_GAME: { amount: 1 },
    },
  },
};
