import type { MinigameSessionResponse } from "lib/portal";
import type { GoblinCoinJob } from "./chickenRescueGoblinCoin";

/** Order must match how jobs are assigned to chicken lines (stable partition). */
export const COIN_CHICKEN_BALANCE_ORDER = [
  "GoblinChicken",
  "LoveChicken",
  "AlienChicken",
  "RoosterChicken",
] as const;

export type CoinChickenBalanceToken = (typeof COIN_CHICKEN_BALANCE_ORDER)[number];

/** Jobs without `capByBalance` are treated as Goblin line (legacy bootstrap). */
const LEGACY_COIN_LINE_DEFAULT: CoinChickenBalanceToken = "GoblinChicken";

/**
 * Coin jobs store `capByBalance` on each producing entry (set when the drop starts).
 */
export function coinJobsForChickenLine(
  allJobs: GoblinCoinJob[],
  chickenToken: CoinChickenBalanceToken,
  balances: MinigameSessionResponse["minigame"]["balances"],
): GoblinCoinJob[] {
  const forLine = allJobs.filter((j) => {
    const line = (j.capByBalance ??
      LEGACY_COIN_LINE_DEFAULT) as CoinChickenBalanceToken;
    return line === chickenToken;
  });

  // Fat chicken is the starter line and should always render/collect jobs.
  if (chickenToken === "GoblinChicken") {
    return [...forLine].sort((a, b) => a.startedAt - b.startedAt);
  }

  const cap = balances[chickenToken] ?? 0;
  if (cap === 0) return [];

  return [...forLine]
    .sort((a, b) => a.startedAt - b.startedAt)
    .slice(0, cap);
}

export function canStartCoinDropForChicken(
  activeCoinJobCount: number,
  chickenToken: CoinChickenBalanceToken,
  balances: MinigameSessionResponse["minigame"]["balances"],
): boolean {
  if (chickenToken === "GoblinChicken") {
    return true;
  }

  const cap = balances[chickenToken] ?? 0;
  return activeCoinJobCount < cap;
}
