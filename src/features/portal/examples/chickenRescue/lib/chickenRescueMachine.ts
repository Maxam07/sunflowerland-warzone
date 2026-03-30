import type { MinigameSessionResponse } from "lib/portal";
import { emptyMinigameState } from "lib/portal/processAction";
import { runtimeToMinigameSession } from "lib/portal/runtimeHelpers";

/** Must match sunflower-land-api `CHICKEN_RESCUE_BOOTSTRAP_WORMS_JOB_ID`. */
export const CHICKEN_RESCUE_BOOTSTRAP_WORMS_JOB_ID =
  "bootstrap-wormery-worms-0" as const;

/** Offline dev: generous balances for local testing (no API). */
const CHICKEN_RESCUE_OFFLINE_TEST_BALANCE = 1000;

const CHICKEN_RESCUE_OFFLINE_TEST_BALANCE_KEYS = [
  "Worm",
  "GoldenNugget",
  "Chook",
  "ChickenFeet",
  "GoldenChook",
  "LIVE_GAME",
  "ADVANCED_GAME",
  "Wormery_2",
  "Wormery_3",
  "Wormery_4",
] as const;

export function wormsFromMinigame(
  minigame: MinigameSessionResponse["minigame"],
): number {
  return minigame.balances.Worm ?? 0;
}

export function wormeriesFromMinigame(
  minigame: MinigameSessionResponse["minigame"],
): number {
  return minigame.balances.Wormery ?? 0;
}

/** Initial session for offline Chicken Rescue (mirrors server bootstrap). */
export function createChickenRescueOfflineMinigame(
  now = Date.now(),
): MinigameSessionResponse["minigame"] {
  const base = emptyMinigameState(now);
  for (const key of CHICKEN_RESCUE_OFFLINE_TEST_BALANCE_KEYS) {
    base.balances[key] = CHICKEN_RESCUE_OFFLINE_TEST_BALANCE;
  }
  base.balances.Wormery = 1;
  base.producing[CHICKEN_RESCUE_BOOTSTRAP_WORMS_JOB_ID] = {
    outputToken: "Worm",
    startedAt: now - 1,
    completesAt: now,
    requires: "Wormery",
  };
  return runtimeToMinigameSession(base);
}

/** Chooks minted on WIN; matches server ranged mint max (100). */
export function chooksForScore(score: number): number {
  return Math.min(100, Math.max(0, Math.floor(score)));
}

/** @deprecated Use `chooksForScore` */
export const grubsForScore = chooksForScore;

export function hasLiveGame(
  minigame: MinigameSessionResponse["minigame"],
): boolean {
  return (
    (minigame.balances.LIVE_GAME ?? 0) > 0 ||
    (minigame.balances.ADVANCED_GAME ?? 0) > 0
  );
}

/** Run length on /game after START (seconds). */
export const GAME_SECONDS = 60;
