import type { MinigameSessionResponse } from "lib/portal";

type Producing = MinigameSessionResponse["minigame"]["producing"];

export type GoblinCoinJob = {
  id: string;
  completesAt: number;
  startedAt: number;
  /** Matches `ProduceRule.requires` when the job was started (which chicken line). */
  requires?: string;
};

export function coinProducingJobs(producing: Producing): GoblinCoinJob[] {
  return Object.entries(producing)
    .filter(([, j]) => j.outputToken === "Coin")
    .map(([id, j]) => ({
      id,
      completesAt: j.completesAt,
      startedAt: j.startedAt,
      requires: j.requires,
    }));
}

export function goblinCoinCookProgressPercent(
  job: GoblinCoinJob,
  now: number,
): number {
  const total = job.completesAt - job.startedAt;
  if (total <= 0) {
    return 100;
  }
  return Math.min(100, Math.max(0, ((now - job.startedAt) / total) * 100));
}

export function formatTimeLeftMs(ms: number): string {
  if (ms <= 0) {
    return "0:00";
  }
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}
