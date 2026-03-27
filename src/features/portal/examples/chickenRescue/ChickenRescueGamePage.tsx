import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Modal } from "components/ui/Modal";
import { Panel } from "components/ui/Panel";
import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";
import { SUNNYSIDE } from "assets/sunnyside";
import { NPC_WEARABLES } from "lib/npcs";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import {
  chooksForScore,
  GAME_SECONDS,
  hasLiveGame,
} from "./lib/chickenRescueMachine";
import { useMinigameSession } from "lib/portal";
import { GameRunProvider } from "./lib/GameRunContext";
import { defaultPhaserHandlers } from "./lib/chickenRescuePhaserApi";
import type { ChickenRescuePhaserApiRef } from "./lib/chickenRescuePhaserApi";
import { closePortal } from "lib/portal";
import { ChickenRescueGame } from "./ChickenRescueGame";
import type { ChickenRescueRunType } from "./ChickenRescueGame";
import { ChickenRescueHUD } from "./components/ChickenRescueHUD";

export const ChickenRescueGamePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useAppTranslation();
  const { minigame, farm, farmId, dispatchAction } = useMinigameSession();

  const scoreRef = useRef(0);
  const goldenRef = useRef(0);
  const [score, setScore] = useState(0);
  const [goldenCount, setGoldenCount] = useState(0);
  const [endAt] = useState(() => Date.now() + GAME_SECONDS * 1000);
  const [runEnd, setRunEnd] = useState<"playing" | "results">("playing");
  const resultsShown = useRef(false);
  const phaserApiRef = useRef(
    defaultPhaserHandlers(),
  ) as ChickenRescuePhaserApiRef;

  const runType: ChickenRescueRunType =
    searchParams.get("run") === "advanced" ||
    ((minigame.balances.ADVANCED_GAME ?? 0) > 0 &&
      searchParams.get("run") !== "basic")
      ? "advanced"
      : "basic";

  useEffect(() => {
    if (!hasLiveGame(minigame)) {
      navigate("/home", { replace: true });
    }
  }, [minigame, navigate]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const openResultsModal = useCallback(() => {
    if (resultsShown.current) {
      return;
    }
    resultsShown.current = true;
    setRunEnd("results");
  }, []);

  useLayoutEffect(() => {
    phaserApiRef.current.getScore = () => scoreRef.current;
    phaserApiRef.current.onChickenRescued = (p, meta) => {
      setScore((s) => s + p);
      if (meta?.golden) {
        setGoldenCount((prev) => {
          const next = Math.min(3, prev + 1);
          goldenRef.current = next;
          return next;
        });
      }
    };
    phaserApiRef.current.onGameOver = openResultsModal;
  }, [openResultsModal]);

  const onClaim = useCallback(() => {
    const final = scoreRef.current;
    const finalGolden = goldenRef.current;
    const isAdvanced = runType === "advanced";
    const ok = dispatchAction({
      action: isAdvanced ? "WIN_ADVANCED_GAME" : "WIN",
      amounts: isAdvanced
        ? {
            Chook: chooksForScore(final),
            GoldenChook: finalGolden,
          }
        : { Chook: chooksForScore(final) },
    });
    if (ok) {
      closePortal(navigate);
    }
  }, [dispatchAction, navigate, runType]);

  const chooksEarned = chooksForScore(score);

  const gameRunValue = useMemo(
    () => ({
      score,
      goldenCount,
      setScore,
      endAt,
    }),
    [score, goldenCount, endAt],
  );

  return (
    <GameRunProvider value={gameRunValue}>
      <div className="relative min-h-screen w-full bg-black">
        <ChickenRescueGame
          bumpkin={farm?.bumpkin}
          farmId={farmId}
          phaserApiRef={phaserApiRef}
          runType={runType}
          initialGoldenChooks={minigame.balances.GoldenChook ?? 0}
        />
        {runEnd === "playing" && <ChickenRescueHUD />}

        {runEnd === "results" && (
          <Modal show>
            <Panel bumpkinParts={NPC_WEARABLES.grubnuk}>
              <div className="p-1">
                <div className="w-full flex justify-between items-start mb-2">
                  <Label type="success" icon={SUNNYSIDE.icons.confirm}>
                    {t("minigame.missionComplete")}
                  </Label>
                </div>
                <p className="text-sm mb-2">
                  {t("minigame.chickenRescueRunComplete", {
                    rescued: score,
                    earned: chooksEarned,
                  })}
                </p>
                {runType === "advanced" && (
                  <p className="text-xs mb-1">
                    Golden chooks rescued: {goldenCount}
                  </p>
                )}
              </div>
              <Button className="mt-1 w-full" onClick={onClaim}>
                {t("claim")}
              </Button>
            </Panel>
          </Modal>
        )}
      </div>
    </GameRunProvider>
  );
};
