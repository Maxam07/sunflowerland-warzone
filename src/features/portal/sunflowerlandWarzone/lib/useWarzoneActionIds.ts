import { useMemo } from "react";
import { useMinigameSession } from "lib/portal";
import {
  resolveWarzonePortalActionIds,
  type WarzonePortalActionIds,
} from "./warzonePortalActionIds";

export function useWarzoneActionIds(): WarzonePortalActionIds {
  const { actions } = useMinigameSession();
  return useMemo(() => resolveWarzonePortalActionIds(actions), [actions]);
}
