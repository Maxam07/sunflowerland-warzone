import type { MinigameActionDefinition } from "lib/portal";

/**
 * Mirrors `sunflower-land-api` `domain/minigames/configs/chickenRescue.ts` for offline / no-API play.
 */
const SEVEN_HOURS_MS = 7 * 60 * 60 * 1000;
const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

export const CHICKEN_RESCUE_CLIENT_ACTIONS: Record<
  string,
  MinigameActionDefinition
> = {
  START_FAT_CHICKEN_DROP: {
    produce: {
      Coin: {
        msToComplete: SEVEN_HOURS_MS,
        requires: "FatChicken",
      },
    },
  },
  COLLECT_FAT_CHICKEN: {
    collect: {
      Coin: { amount: 3 },
    },
  },
  BUY_LOVE_CHICKEN: {
    burn: {
      Cluckcoin: { amount: 15 },
    },
    mint: {
      LoveChicken: { amount: 1 },
    },
  },
  BUY_ALIEN_CHICKEN: {
    burn: {
      Cluckcoin: { amount: 100 },
    },
    mint: {
      AlienChicken: { amount: 1 },
    },
  },
  BUY_ROOSTER_CHICKEN: {
    burn: {
      Cluckcoin: { amount: 500 },
    },
    mint: {
      RoosterChicken: { amount: 1 },
    },
  },
  START_LOVE_COIN_DROP: {
    produce: {
      Coin: {
        msToComplete: EIGHT_HOURS_MS,
        limit: 999,
        requires: "LoveChicken",
      },
    },
  },
  COLLECT_LOVE_COINS: {
    collect: {
      Coin: { amount: 3 },
    },
  },
  START_ALIEN_COIN_DROP: {
    produce: {
      Coin: {
        msToComplete: EIGHT_HOURS_MS,
        limit: 999,
        requires: "AlienChicken",
      },
    },
  },
  COLLECT_ALIEN_COINS: {
    collect: {
      Coin: { amount: 3 },
    },
  },
  START_ROOSTER_COIN_DROP: {
    produce: {
      Coin: {
        msToComplete: EIGHT_HOURS_MS,
        limit: 999,
        requires: "RoosterChicken",
      },
    },
  },
  COLLECT_ROOSTER_COINS: {
    collect: {
      Coin: { amount: 3 },
    },
  },
  START: {
    mint: {
      LIVE_GAME: { amount: 1 },
    },
    burn: {
      Coin: { amount: 1 },
    },
  },
  LOSE: {
    burn: {
      LIVE_GAME: { amount: 1 },
    },
  },
  WIN: {
    mint: {
      Chook: { min: 0, max: 100, dailyCap: 1000 },
    },
    burn: {
      LIVE_GAME: { amount: 1 },
    },
  },
  BUY_NUGGET: {
    burn: {
      Chook: { amount: 50 },
    },
    mint: {
      Nugget: { amount: 1 },
    },
  },

  BUY_CLUCKCOIN: {
    mint: {
      Cluckcoin: { amount: 1 },
    },
    burn: {
      GoldenChook: { amount: 1 },
    },
  },

  BUY_QUEENS: {
    mint: {
      Coin: { amount: 5 },
    },
    burn: {
      Cluckcoin: { amount: 1 },
    },
  },
  START_ADVANCED_GAME: {
    mint: {
      ADVANCED_GAME: { amount: 1 },
    },
    burn: {
      Nugget: { amount: 1 },
    },
  },
  LOSE_ADVANCED_GAME: {
    burn: {
      ADVANCED_GAME: { amount: 1 },
    },
  },
  WIN_ADVANCED_GAME: {
    mint: {
      Chook: { min: 0, max: 100, dailyCap: 1000 },
      GoldenChook: { min: 0, max: 3, dailyCap: 300 },
    },
    burn: {
      ADVANCED_GAME: { amount: 1 },
    },
  },
};
