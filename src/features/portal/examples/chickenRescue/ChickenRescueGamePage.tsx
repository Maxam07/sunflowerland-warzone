import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
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
import { useChickenRescueSession } from "./lib/ChickenRescueSessionContext";
import { GameRunProvider } from "./lib/GameRunContext";
import { defaultPhaserHandlers } from "./lib/chickenRescuePhaserApi";
import type { ChickenRescuePhaserApiRef } from "./lib/chickenRescuePhaserApi";
import { goHome } from "./lib/chickenRescueExit";
import { ChickenRescueGame } from "./ChickenRescueGame";
import { ChickenRescueHUD } from "./components/ChickenRescueHUD";

export const ChickenRescueGamePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const { minigame, farm, farmId, dispatchAction } =
    useChickenRescueSession();

  const scoreRef = useRef(0);
  const [score, setScore] = useState(0);
  const [endAt] = useState(() => Date.now() + GAME_SECONDS * 1000);
  const [runEnd, setRunEnd] = useState<"playing" | "results">("playing");
  const resultsShown = useRef(false);
  const phaserApiRef = useRef(
    defaultPhaserHandlers(),
  ) as ChickenRescuePhaserApiRef;

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
    phaserApiRef.current.onChickenRescued = (p) =>
      setScore((s) => s + p);
    phaserApiRef.current.onGameOver = openResultsModal;
  }, [openResultsModal]);

  const onClaim = useCallback(() => {
    const final = scoreRef.current;
    const ok = dispatchAction({
      action: "WIN",
      amounts: { Chook: chooksForScore(final) },
    });
    if (ok) {
      goHome(navigate);
    }
  }, [dispatchAction]);

  const chooksEarned = chooksForScore(score);

  const gameRunValue = useMemo(
    () => ({
      score,
      setScore,
      endAt,
    }),
    [score, endAt],
  );

  return (
    <GameRunProvider value={gameRunValue}>
      <div className="relative min-h-screen w-full bg-black">
        <ChickenRescueGame
          bumpkin={farm?.bumpkin}
          farmId={farmId}
          phaserApiRef={phaserApiRef}
        />
        {runEnd === "playing" && <ChickenRescueHUD />}

        {runEnd === "results" && (
          <Modal show>
            <Panel bumpkinParts={NPC_WEARABLES.chicken}>
              <div className="p-1">
                <div className="w-full flex justify-between items-start mb-2">
                  <Label type="success" icon={SUNNYSIDE.icons.confirm}>
                    {t("minigame.missionComplete")}
                  </Label>
                </div>
                <p className="text-sm mb-2">
                  {`Congratulations! You rescued ${score} chicken${score === 1 ? "" : "s"} and earned ${chooksEarned} Chook${chooksEarned === 1 ? "" : "s"}.`}
                </p>
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
