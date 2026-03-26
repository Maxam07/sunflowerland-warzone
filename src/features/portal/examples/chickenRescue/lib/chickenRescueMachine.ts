import { MinigameSessionResponse } from "features/portal/actions/minigameEconomy";

export function attemptsFromMinigame(
  minigame: MinigameSessionResponse["minigame"],
): number {
  return minigame.balances.Attempt ?? 0;
}

/** Chooks minted on WIN; matches server ranged mint max (100). */
export function chooksForScore(score: number): number {
  return Math.min(100, Math.max(0, Math.floor(score)));
}

export function hasLiveGame(
  minigame: MinigameSessionResponse["minigame"],
): boolean {
  return (minigame.balances.LIVE_GAME ?? 0) > 0;
}

/** Run length on /game after START (seconds). */
export const GAME_SECONDS = 60;
