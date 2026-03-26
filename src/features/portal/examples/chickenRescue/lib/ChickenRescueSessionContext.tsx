import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { CONFIG } from "lib/config";
import { getUrl } from "features/portal/actions/loadPortal";
import { MinigameSessionResponse, postMinigameAction } from "features/portal/actions/minigameEconomy";
import type { BootstrapContext } from "./portalBootstrapMachine";
import {
  applyOptimisticPortalAction,
  cloneMinigameSnapshot,
  normalizeMinigameFromApi,
} from "./minigameRuntimeHelpers";

export type DispatchMinigameActionInput = {
  action: string;
  amounts?: Record<string, number>;
  itemId?: string;
};

export type ChickenRescueSessionValue = {
  farmId: number;
  jwt: string;
  farm: MinigameSessionResponse["farm"];
  minigame: MinigameSessionResponse["minigame"];
  actions: Record<string, unknown>;
  dispatchAction: (input: DispatchMinigameActionInput) => boolean;
  apiError: string | null;
  clearApiError: () => void;
};

const ChickenRescueSessionContext = createContext<ChickenRescueSessionValue | null>(
  null,
);

export function useChickenRescueSession(): ChickenRescueSessionValue {
  const v = useContext(ChickenRescueSessionContext);
  if (!v) {
    throw new Error("useChickenRescueSession outside provider");
  }
  return v;
}

export function ChickenRescueSessionProvider({
  bootstrap,
  children,
}: {
  bootstrap: BootstrapContext;
  children: React.ReactNode;
}) {
  const [minigame, setMinigame] = useState(() =>
    normalizeMinigameFromApi(bootstrap.minigame),
  );
  const [apiError, setApiError] = useState<string | null>(null);

  const dispatchAction = useCallback(
    (input: DispatchMinigameActionInput): boolean => {
      setApiError(null);
      const rollback = cloneMinigameSnapshot(minigame);
      const next = applyOptimisticPortalAction(
        bootstrap.actions,
        minigame,
        {
          actionId: input.action,
          amounts: input.amounts,
          itemId: input.itemId,
        },
      );
      if (!next.ok) {
        return false;
      }
      setMinigame(next.minigame);

      if (!getUrl()) {
        return true;
      }

      void postMinigameAction({
        portalId: CONFIG.PORTAL_APP,
        token: bootstrap.jwt as string,
        action: input.action,
        amounts: input.amounts,
        itemId: input.itemId,
      }).then(
        (res) => {
          setMinigame(normalizeMinigameFromApi(res.minigame));
        },
        (err) => {
          setMinigame(rollback);
          setApiError(err instanceof Error ? err.message : String(err));
        },
      );
      return true;
    },
    [bootstrap.actions, bootstrap.jwt, minigame],
  );

  const clearApiError = useCallback(() => setApiError(null), []);

  const value = useMemo(
    (): ChickenRescueSessionValue => ({
      farmId: bootstrap.id,
      jwt: bootstrap.jwt as string,
      farm: bootstrap.farm,
      minigame,
      actions: bootstrap.actions,
      dispatchAction,
      apiError,
      clearApiError,
    }),
    [
      bootstrap.id,
      bootstrap.jwt,
      bootstrap.farm,
      bootstrap.actions,
      minigame,
      dispatchAction,
      apiError,
      clearApiError,
    ],
  );

  return (
    <ChickenRescueSessionContext.Provider value={value}>
      {children}
    </ChickenRescueSessionContext.Provider>
  );
}
