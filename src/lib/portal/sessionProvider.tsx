import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { getUrl } from "./url";
import type { MinigameSessionResponse } from "./types";
import { postPlayerEconomyAction } from "./api";
import type { BootstrapContext } from "./bootstrapMachine";
import {
  applyOptimisticPortalAction,
  cloneMinigameSnapshot,
  normalizeMinigameFromApi,
} from "./runtimeHelpers";

export type DispatchMinigameActionInput = {
  action: string;
  amounts?: Record<string, number>;
  itemId?: string;
};

export type MinigameSessionValue = {
  farmId: number;
  jwt: string;
  farm: MinigameSessionResponse["farm"];
  playerEconomy: MinigameSessionResponse["playerEconomy"];
  actions: Record<string, unknown>;
  dispatchAction: (input: DispatchMinigameActionInput) => boolean;
  /**
   * Applies actions in order on the updated state after each step. Stops at the
   * first failure and keeps prior successful steps (partial success). Returns
   * whether at least one action applied.
   */
  dispatchMinigameActionsSequential: (
    inputs: DispatchMinigameActionInput[],
  ) => boolean;
  apiError: string | null;
  clearApiError: () => void;
};

const MinigameSessionContext = createContext<MinigameSessionValue | null>(null);

export function useMinigameSession(): MinigameSessionValue {
  const v = useContext(MinigameSessionContext);
  if (!v) {
    throw new Error("useMinigameSession outside provider");
  }
  return v;
}

export function MinigameSessionProvider({
  bootstrap,
  children,
}: {
  bootstrap: BootstrapContext;
  children: React.ReactNode;
}) {
  const [playerEconomy, setPlayerEconomy] = useState(() =>
    normalizeMinigameFromApi(bootstrap.playerEconomy),
  );
  const [apiError, setApiError] = useState<string | null>(null);

  const dispatchAction = useCallback(
    (input: DispatchMinigameActionInput): boolean => {
      setApiError(null);
      const rollback = cloneMinigameSnapshot(playerEconomy);
      const next = applyOptimisticPortalAction(
        bootstrap.actions,
        playerEconomy,
        {
          actionId: input.action,
          amounts: input.amounts,
          itemId: input.itemId,
        },
      );
      if (!next.ok) {
        console.error("[ChickenRescue] dispatchAction optimistic update failed", {
          action: input.action,
          error: next.error,
          amounts: input.amounts,
          itemId: input.itemId,
          configuredActions: Object.keys(bootstrap.actions ?? {}),
        });
        return false;
      }
      /**
       * Commit optimistic state before the caller runs `navigate()` in the same
       * tick. Otherwise the /game route mounts while context still has the
       * pre-action economy and redirects away (no LIVE_GAME yet).
       */
      flushSync(() => {
        setPlayerEconomy(next.playerEconomy);
      });
      console.log("[CR-run-debug] dispatchAction optimistic committed", {
        action: input.action,
        LIVE_GAME: next.playerEconomy.balances.LIVE_GAME,
        ADVANCED_GAME: next.playerEconomy.balances.ADVANCED_GAME,
      });

      if (!getUrl()) {
        return true;
      }

      void postPlayerEconomyAction({
        portalId: bootstrap.portalId,
        token: bootstrap.jwt as string,
        action: input.action,
        amounts: input.amounts,
        itemId: input.itemId,
      }).then(
        (res) => {
          setPlayerEconomy(normalizeMinigameFromApi(res.playerEconomy));
        },
        (err) => {
          const message = err instanceof Error ? err.message : String(err);
          console.error("[ChickenRescue] dispatchAction API request failed", {
            action: input.action,
            amounts: input.amounts,
            itemId: input.itemId,
            message,
            error: err,
          });
          setPlayerEconomy(rollback);
          setApiError(message);
        },
      );
      return true;
    },
    [bootstrap.actions, bootstrap.jwt, bootstrap.portalId, playerEconomy],
  );

  const dispatchMinigameActionsSequential = useCallback(
    (inputs: DispatchMinigameActionInput[]): boolean => {
      if (inputs.length === 0) {
        return true;
      }
      setApiError(null);
      const rollback = cloneMinigameSnapshot(playerEconomy);
      let current = playerEconomy;
      let applied = 0;
      for (const input of inputs) {
        const next = applyOptimisticPortalAction(bootstrap.actions, current, {
          actionId: input.action,
          amounts: input.amounts,
          itemId: input.itemId,
        });
        if (!next.ok) {
          if (applied === 0) {
            console.error(
              "[ChickenRescue] dispatchMinigameActionsSequential optimistic failed (first step)",
              {
                action: input.action,
                error: next.error,
                amounts: input.amounts,
                itemId: input.itemId,
                configuredActions: Object.keys(bootstrap.actions ?? {}),
              },
            );
          }
          break;
        }
        current = next.playerEconomy;
        applied += 1;
      }
      if (applied === 0) {
        return false;
      }
      flushSync(() => {
        setPlayerEconomy(current);
      });
      console.log("[CR-run-debug] dispatchMinigameActionsSequential committed", {
        applied,
        LIVE_GAME: current.balances.LIVE_GAME,
        ADVANCED_GAME: current.balances.ADVANCED_GAME,
      });

      if (!getUrl()) {
        return true;
      }

      void (async () => {
        let state = rollback;
        for (const input of inputs) {
          const step = applyOptimisticPortalAction(bootstrap.actions, state, {
            actionId: input.action,
            amounts: input.amounts,
            itemId: input.itemId,
          });
          if (!step.ok) {
            console.error(
              "[ChickenRescue] dispatchMinigameActionsSequential API replay optimistic failed",
              {
                action: input.action,
                error: step.error,
                amounts: input.amounts,
                itemId: input.itemId,
              },
            );
            break;
          }
          try {
            const res = await postPlayerEconomyAction({
              portalId: bootstrap.portalId,
              token: bootstrap.jwt as string,
              action: input.action,
              amounts: input.amounts,
              itemId: input.itemId,
            });
            state = normalizeMinigameFromApi(res.playerEconomy);
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(
              "[ChickenRescue] dispatchMinigameActionsSequential API request failed",
              {
                action: input.action,
                amounts: input.amounts,
                itemId: input.itemId,
                message,
                error: err,
              },
            );
            setPlayerEconomy(state);
            setApiError(message);
            return;
          }
        }
        setPlayerEconomy(state);
      })();
      return true;
    },
    [bootstrap.actions, bootstrap.jwt, bootstrap.portalId, playerEconomy],
  );

  const clearApiError = useCallback(() => setApiError(null), []);

  const value = useMemo(
    (): MinigameSessionValue => ({
      farmId: bootstrap.id,
      jwt: bootstrap.jwt as string,
      farm: bootstrap.farm,
      playerEconomy,
      actions: bootstrap.actions,
      dispatchAction,
      dispatchMinigameActionsSequential,
      apiError,
      clearApiError,
    }),
    [
      bootstrap.id,
      bootstrap.jwt,
      bootstrap.farm,
      bootstrap.actions,
      playerEconomy,
      dispatchAction,
      dispatchMinigameActionsSequential,
      apiError,
      clearApiError,
    ],
  );

  return (
    <MinigameSessionContext.Provider value={value}>
      {children}
    </MinigameSessionContext.Provider>
  );
}
