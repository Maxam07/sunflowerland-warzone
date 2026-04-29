import { useCallback } from "react";
import { useMinigameSession } from "lib/portal";
import { chooksForScore } from "./warzoneMachine";
import {
  applyChickenRescueGameOverAdvanced,
  applyWarzoneGameOverBasic,
  applyChickenRescueStartAdvanced,
  applyChickenRescueStartBasic,
} from "./warzoneLifecycle";
import { useWarzoneActionIds } from "./useWarzoneActionIds";

export function useWarzoneLifecycleDispatch() {
  const { commitLocalPlayerEconomySync, playerEconomy } = useMinigameSession();
  const actionIds = useWarzoneActionIds();

  const startBasicRun = useCallback((): boolean => {
    const applied = applyChickenRescueStartBasic(playerEconomy);
    if (!applied.ok) {
      return false;
    }
    return commitLocalPlayerEconomySync({
      action: actionIds.startBasic,
      nextPlayerEconomy: applied.playerEconomy,
    });
  }, [actionIds.startBasic, commitLocalPlayerEconomySync, playerEconomy]);

  const startAdvancedRun = useCallback((): boolean => {
    const applied = applyChickenRescueStartAdvanced(playerEconomy);
    if (!applied.ok) {
      return false;
    }
    return commitLocalPlayerEconomySync({
      action: actionIds.startAdvanced,
      nextPlayerEconomy: applied.playerEconomy,
    });
  }, [actionIds.startAdvanced, commitLocalPlayerEconomySync, playerEconomy]);

  const endRun = useCallback(
    (input: {
      runType: "basic" | "advanced";
      score: number;
      goldenCount: number;
    }): boolean => {
      const isAdvanced = input.runType === "advanced";
      if (isAdvanced) {
        const applied = applyChickenRescueGameOverAdvanced(
          playerEconomy,
          input.goldenCount,
        );
        if (!applied.ok) {
          return false;
        }
        return commitLocalPlayerEconomySync({
          action: actionIds.gameOverAdvanced,
          amounts: { "2": input.goldenCount },
          nextPlayerEconomy: applied.playerEconomy,
        });
      }
      const chooks = chooksForScore(input.score);
      const applied = applyWarzoneGameOverBasic(playerEconomy, chooks);
      if (!applied.ok) {
        return false;
      }
      return commitLocalPlayerEconomySync({
        action: actionIds.gameOverBasic,
        amounts: { "1": chooks },
        nextPlayerEconomy: applied.playerEconomy,
      });
    },
    [
      actionIds.gameOverAdvanced,
      actionIds.gameOverBasic,
      commitLocalPlayerEconomySync,
      playerEconomy,
    ],
  );

  return { startBasicRun, startAdvancedRun, endRun };
}
