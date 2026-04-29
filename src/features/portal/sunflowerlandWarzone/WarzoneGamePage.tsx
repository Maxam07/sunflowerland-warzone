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
import { Box } from "components/ui/Box";
import chookIcon from "assets/icons/chook.webp";
import warzoneHelmetIcon from "assets/icons/warzone_helmet.png";
// import goldenChookIcon from "assets/sfts/golden_chook.png";
import { NPC_WEARABLES } from "lib/npcs";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import {
  chooksForScore,
  GAME_SECONDS,
  hasLiveGame,
} from "./lib/warzoneMachine";
import { useMinigameSession } from "lib/portal";
import { useWarzoneLifecycleDispatch } from "./lib/useWarzoneLifecycleDispatch";
import { GameRunProvider } from "./lib/GameRunContext";
import { defaultPhaserHandlers, WarzonePhaserApiRef } from "./lib/warzonePhaserApi";
import { WarzoneGame } from "./WarzoneGame";
import type { ChickenRescueRunType } from "./lib/GameRunContext";
import { WarzoneHUD } from "./components/WarzoneHUD";
import { useOrientation } from "lib/utils/hooks/useOrientation";

export const WarzoneGamePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useAppTranslation();
  const { playerEconomy, farm, farmId } = useMinigameSession();
  const { endRun } = useWarzoneLifecycleDispatch();
  const deviceOrientation = useOrientation();

  const scoreRef = useRef(0);
  const goldenRef = useRef(0);
  const [score, setScore] = useState(0);
  const [goldenCount, setGoldenCount] = useState(0);
  const [endAt] = useState(() => Date.now() + GAME_SECONDS * 1000);
  const [runEnd, setRunEnd] = useState<"playing" | "results">("playing");
  const resultsShown = useRef(false);
  const phaserApiRef = useRef(
    defaultPhaserHandlers(),
  ) as WarzonePhaserApiRef;

  const runQuery = searchParams.get("run");

  const runType: ChickenRescueRunType =
    runQuery === "advanced" ||
    ((playerEconomy.balances.ADVANCED_GAME ?? 0) > 0 && runQuery !== "basic")
      ? "advanced"
      : "basic";

  useEffect(() => {
    const startedFromHome = runQuery === "basic" || runQuery === "advanced";
    console.log("[CR-run-debug] GamePage redirect guard", {
      runQuery,
      startedFromHome,
      hasLive: hasLiveGame(playerEconomy),
      LIVE_GAME: playerEconomy.balances.LIVE_GAME,
      ADVANCED_GAME: playerEconomy.balances.ADVANCED_GAME,
    });
    if (startedFromHome) {
      return;
    }
    if (!hasLiveGame(playerEconomy)) {
      console.log("[CR-run-debug] GamePage redirect -> /home (no run query)");
      navigate("/home", { replace: true });
    }
  }, [playerEconomy, navigate, runQuery]);

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
    phaserApiRef.current.onEnemyKilled = (p, meta) => {
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
    const chooks = chooksForScore(final);
    const won = isAdvanced ? finalGolden > 0 : chooks > 0;
    const ok = endRun({
      runType: isAdvanced ? "advanced" : "basic",
      score: final,
      goldenCount: finalGolden,
    });
    if (ok) {
      // Stay inside the iframe on /home so the minigame API can finish and the
      // player can start another run. Closing the parent iframe races the save.
      navigate("/home", { replace: true });
    } else {
      console.error("[ChickenRescue] Continue: endRun returned false", {
        won,
        runType: isAdvanced ? "advanced" : "basic",
        score: final,
        chooksForPayout: chooks,
        goldenCount: finalGolden,
        amounts: isAdvanced ? { "2": finalGolden } : { "1": chooks },
        LIVE_GAME: playerEconomy.balances.LIVE_GAME,
        ADVANCED_GAME: playerEconomy.balances.ADVANCED_GAME,
      });
    }
  }, [endRun, navigate, playerEconomy.balances, runType]);

  const eliminatedEnemy = chooksForScore(score);

  const gameRunValue = useMemo(
    () => ({
      score,
      goldenCount,
      setScore,
      endAt,
      runType,
    }),
    [score, goldenCount, endAt, runType],
  );

  const portraitStyles = deviceOrientation === "portrait" && (
    <style>{`
      #hud-container, div[role="dialog"] {
          width: ${window.innerHeight}px !important;
          height: ${window.innerWidth}px !important;
          transform-origin: top left !important;
          transform: rotate(90deg) translateY(-${window.innerWidth}px) !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
      }
      #hud-container > div {
          zoom: 0.85;
      }
      div[role="dialog"] > div > div.flex {
        margin-top: 30px;
        min-height: ${window.innerWidth}px !important;
      }
      div[role="dialog"] .flex.min-h-full > .relative.w-full {
          transform: scale(0.7) !important;
          transform-origin: center center !important;
      }
      div[role="dialog"] .flex.min-h-full > .relative.w-full > div > div.relative > div {
          max-height: calc(100vw - 100px) !important;
      }
      div[role="dialog"] .flex.min-h-full > .relative.w-full > div > div.relative > div > div {
          max-height: calc(100vw - 120px) !important;
      }
      div[role="dialog"] .flex.min-h-full > .relative.w-full > div > div.relative > div > div > div {
          max-height: calc(100vw - 120px) !important;
      }
    `}</style>
  );

  return (
    <GameRunProvider value={gameRunValue}>
       {portraitStyles}
      <div className="relative min-h-screen w-full bg-black">
        <WarzoneGame
          bumpkin={farm?.bumpkin}
          farmId={farmId}
          phaserApiRef={phaserApiRef}
          runType={runType}
        />
        {runEnd === "playing" && <WarzoneHUD />}

        {runEnd === "results" && (
          <Modal show>
            <Panel bumpkinParts={NPC_WEARABLES["pumpkin' pete"]}>
              <div className="p-1">
                <Label type="default" className="mb-2">
                  {t("minigame.warzone.gameOver")}
                </Label>
                {runType === "advanced" ? (
                  <div className="flex flex-col gap-2 mb-1">
                    <div className="flex flex-row items-center gap-2">
                      {/* <Box image={goldenChookIcon} hideCount /> */}
                      <span className="text-xs text-[#3e2731]">
                        {t("minigame.warzone.foundGoldenChooksLine", {
                          count: goldenCount,
                        })}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm mb-2 text-[#3e2731]">
                      {eliminatedEnemy > 0
                        ? t("minigame.warzone.resultsFoundChooks")
                        : t("minigame.warzone.resultsNoChooks")}
                    </p>
                    <div className="flex flex-col gap-2 mb-1">
                      <div className="flex flex-row items-center gap-2">
                        <Box image={warzoneHelmetIcon} hideCount />
                        <span className="text-xs text-[#3e2731]">
                          {t("minigame.warzone.foundChooksLine", {
                            count: eliminatedEnemy,
                          })}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <Button className="mt-1 w-full" onClick={onClaim}>
                {t("continue")}
              </Button>
            </Panel>
          </Modal>
        )}
      </div>
    </GameRunProvider>
  );
};
