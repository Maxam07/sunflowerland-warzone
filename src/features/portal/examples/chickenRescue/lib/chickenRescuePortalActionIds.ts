import type { MinigameActionDefinition } from "lib/portal/processAction";

/**
 * Resolved from `session.actions` so the portal works when the editor/API use
 * numeric string keys (e.g. `"12"`) instead of semantic names (`START_GAME`, `GAMEOVER`).
 */
export type ChickenRescuePortalActionIds = {
  startBasic: string;
  /** Basic run end: mint chook count `"1"` (0–100), burn `LIVE_GAME`. */
  gameOverBasic: string;
  startAdvanced: string;
  /** Advanced run end: mint `"1"` / `"2"` (golden), burn `ADVANCED_GAME`. */
  gameOverAdvanced: string;
};

const DEFAULT_IDS: ChickenRescuePortalActionIds = {
  startBasic: "START_GAME",
  gameOverBasic: "GAMEOVER",
  startAdvanced: "START_ADVANCED_GAME",
  gameOverAdvanced: "ADVANCED_GAMEOVER",
};

function asDef(raw: unknown): MinigameActionDefinition | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  return raw as MinigameActionDefinition;
}

function isFixedAmountMint(rule: unknown): rule is { amount: number } {
  return (
    typeof rule === "object" &&
    rule !== null &&
    "amount" in rule &&
    typeof (rule as { amount: unknown }).amount === "number"
  );
}

function isRangedMint(
  rule: unknown,
): rule is { min: number; max: number; dailyCap: number } {
  const r = rule as Record<string, unknown>;
  return (
    typeof rule === "object" &&
    rule !== null &&
    typeof r.min === "number" &&
    typeof r.max === "number" &&
    typeof r.dailyCap === "number"
  );
}

function noProduceCollect(def: MinigameActionDefinition): boolean {
  return !def.produce && !def.collect;
}

/** mint LIVE_GAME x1, burn worm `"4"` x1 only */
function matchesStartBasic(def: MinigameActionDefinition): boolean {
  if (!noProduceCollect(def)) {
    return false;
  }
  const m = def.mint;
  const b = def.burn;
  if (!m || !b) {
    return false;
  }
  const mk = Object.keys(m);
  const bk = Object.keys(b);
  if (mk.length !== 1 || mk[0] !== "LIVE_GAME") {
    return false;
  }
  if (!isFixedAmountMint(m.LIVE_GAME) || m.LIVE_GAME.amount !== 1) {
    return false;
  }
  if (bk.length !== 1 || bk[0] !== "4" || b["4"]?.amount !== 1) {
    return false;
  }
  return true;
}

/** ranged mint `"1"`, burn LIVE_GAME x1, no mint `"2"` */
function matchesGameOverBasic(def: MinigameActionDefinition): boolean {
  if (!noProduceCollect(def)) {
    return false;
  }
  const m = def.mint;
  const b = def.burn;
  if (!m || !b || !m["1"] || "2" in m) {
    return false;
  }
  if (!isRangedMint(m["1"])) {
    return false;
  }
  const bk = Object.keys(b);
  return bk.length === 1 && bk[0] === "LIVE_GAME" && b.LIVE_GAME?.amount === 1;
}

/** mint ADVANCED_GAME x1, burn `"3"` x1 only */
function matchesStartAdvanced(def: MinigameActionDefinition): boolean {
  if (!noProduceCollect(def)) {
    return false;
  }
  const m = def.mint;
  const b = def.burn;
  if (!m || !b) {
    return false;
  }
  const mk = Object.keys(m);
  const bk = Object.keys(b);
  if (mk.length !== 1 || mk[0] !== "ADVANCED_GAME") {
    return false;
  }
  if (!isFixedAmountMint(m.ADVANCED_GAME) || m.ADVANCED_GAME.amount !== 1) {
    return false;
  }
  if (bk.length !== 1 || bk[0] !== "3" || b["3"]?.amount !== 1) {
    return false;
  }
  return true;
}

/** ranged mint `"1"` + `"2"`, burn ADVANCED_GAME x1 */
function matchesGameOverAdvanced(def: MinigameActionDefinition): boolean {
  if (!noProduceCollect(def)) {
    return false;
  }
  const m = def.mint;
  const b = def.burn;
  if (!m || !b || !m["1"] || !m["2"]) {
    return false;
  }
  if (!isRangedMint(m["1"]) || !isRangedMint(m["2"])) {
    return false;
  }
  const bk = Object.keys(b);
  return (
    bk.length === 1 &&
    bk[0] === "ADVANCED_GAME" &&
    b.ADVANCED_GAME?.amount === 1
  );
}

function resolveOne(
  actions: Record<string, unknown>,
  canonical: string,
  match: (d: MinigameActionDefinition) => boolean,
): string {
  const byCanonical = asDef(actions[canonical]);
  if (byCanonical && match(byCanonical)) {
    return canonical;
  }
  const ids = Object.keys(actions).sort();
  for (const id of ids) {
    const d = asDef(actions[id]);
    if (d && match(d)) {
      return id;
    }
  }
  return canonical;
}

/**
 * Maps Chicken Rescue run lifecycle actions to the keys present in
 * `MinigameSessionResponse.actions` (semantic or numeric).
 */
export function resolveChickenRescuePortalActionIds(
  actions: Record<string, unknown>,
): ChickenRescuePortalActionIds {
  return {
    startBasic: resolveOne(actions, DEFAULT_IDS.startBasic, matchesStartBasic),
    gameOverBasic: resolveOne(
      actions,
      DEFAULT_IDS.gameOverBasic,
      matchesGameOverBasic,
    ),
    startAdvanced: resolveOne(
      actions,
      DEFAULT_IDS.startAdvanced,
      matchesStartAdvanced,
    ),
    gameOverAdvanced: resolveOne(
      actions,
      DEFAULT_IDS.gameOverAdvanced,
      matchesGameOverAdvanced,
    ),
  };
}
