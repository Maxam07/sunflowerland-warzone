import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "components/ui/Modal";
import { ButtonPanel, Panel } from "components/ui/Panel";
import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { NPC_WEARABLES } from "lib/npcs";
import chookIcon from "assets/icons/chook.webp";
import chickenFeetIcon from "assets/icons/chicken_feet.webp";
import goldenChookIcon from "assets/sfts/golden_chook.png";
import wormIcon from "assets/icons/worm.png";
import { SUNNYSIDE } from "assets/sunnyside";
import { CONFIG } from "lib/config";
import { coinsFromMinigame } from "./lib/chickenRescueMachine";
import { chickenRescueHomeRootStyle } from "./lib/chickenRescueHomeLayout";
import { closePortal, useMinigameSession } from "lib/portal";
import { ChickenRescueHomeHUD } from "./components/ChickenRescueHomeHUD";

function sunflowerLandChickenRescueDashboardUrl(): string {
  const base = (CONFIG.PORTAL_GAME_URL ?? "").replace(/\/$/, "");
  if (!base) return "/minigame/chicken-rescue";
  return `${base}/minigame/chicken-rescue`;
}

export const ChickenRescueHome: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const { minigame, dispatchAction, clearApiError, apiError } =
    useMinigameSession();

  const [huntStep, setHuntStep] = useState<"choose" | "confirm">("choose");
  const [pendingRun, setPendingRun] = useState<"basic" | "advanced" | null>(
    null,
  );

  const coinsLeft = coinsFromMinigame(minigame);
  const nuggets = minigame.balances.Nugget ?? 0;
  const canStartBasic = coinsLeft >= 1;
  const canStartAdvanced = nuggets >= 1;

  const productionUrl = sunflowerLandChickenRescueDashboardUrl();

  const startBasicRun = () => {
    const ok = dispatchAction({ action: "START" });
    if (ok) {
      navigate("/game?run=basic");
    }
  };

  const startAdvancedRun = () => {
    const ok = dispatchAction({ action: "START_ADVANCED_GAME" });
    if (ok) {
      navigate("/game?run=advanced");
    }
  };

  const handleCloseToSunflowerLand = () => {
    clearApiError();
    closePortal(navigate);
  };

  const confirmRunChoice = (run: "basic" | "advanced") => {
    setPendingRun(run);
    setHuntStep("confirm");
  };

  const startConfirmedRun = () => {
    if (pendingRun === "basic") {
      startBasicRun();
      return;
    }
    if (pendingRun === "advanced") {
      startAdvancedRun();
    }
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden [image-rendering:pixelated]"
      style={chickenRescueHomeRootStyle()}
    >
      <ChickenRescueHomeHUD />

      {huntStep === "choose" && (
        <Modal show>
          <Panel>
            <div className="p-2">
              <Label type="default" className="mb-2" icon={SUNNYSIDE.icons.search}>
                Which run?
              </Label>
              <p className="text-xs leading-snug mb-3 opacity-90">
                Shops and timed coin drops live in the main game.{" "}
                <a
                  href={productionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium text-amber-900"
                >
                  Open Chicken Rescue in Sunflower Land
                </a>{" "}
                to manage them.
              </p>
              <ul className="flex flex-col gap-1.5">
                <li>
                  <ButtonPanel
                    onClick={canStartBasic ? () => confirmRunChoice("basic") : undefined}
                    className={`flex ${!canStartBasic ? "pointer-events-none opacity-70" : ""}`}
                    disabled={!canStartBasic}
                  >
                    <img
                      src={chookIcon}
                      alt=""
                      className="w-11 h-11 mr-2 shrink-0 object-contain pixelated"
                      style={{ imageRendering: "pixelated" }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2 items-start">
                        <span className="text-sm font-medium leading-tight">
                          Basic run
                        </span>
                        <Label type={canStartBasic ? "warning" : "danger"} icon={wormIcon}>
                          1 Worm
                        </Label>
                      </div>
                      <p className="text-xs mt-0.5 opacity-85 leading-snug">
                        Find Chooks.
                      </p>
                    </div>
                  </ButtonPanel>
                </li>
                <li>
                  <ButtonPanel
                    onClick={
                      canStartAdvanced
                        ? () => confirmRunChoice("advanced")
                        : undefined
                    }
                    className={`flex ${!canStartAdvanced ? "pointer-events-none opacity-70" : ""}`}
                    disabled={!canStartAdvanced}
                  >
                    <img
                      src={goldenChookIcon}
                      alt=""
                      className="w-11 h-11 mr-2 shrink-0 object-contain pixelated"
                      style={{ imageRendering: "pixelated" }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2 items-start">
                        <span className="text-sm font-medium leading-tight">
                          Advanced run
                        </span>
                        <Label
                          type={canStartAdvanced ? "warning" : "danger"}
                          icon={chickenFeetIcon}
                        >
                          1 Chicken Feet
                        </Label>
                      </div>
                      <p className="text-xs mt-0.5 opacity-85 leading-snug">
                        Harder run — Golden Chooks.
                      </p>
                    </div>
                  </ButtonPanel>
                </li>
              </ul>
              {apiError && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2 mb-2 break-words">
                  {apiError}
                </p>
              )}
              <Button className="w-full mt-2" onClick={handleCloseToSunflowerLand}>
                {t("close")}
              </Button>
            </div>
          </Panel>
        </Modal>
      )}

      {huntStep === "confirm" && pendingRun !== null && (
        <Modal show>
          <Panel bumpkinParts={NPC_WEARABLES.grubnuk}>
            <div className="p-2">
              <p className="text-sm mb-3">
                Are you sure you want to continue? It will cost{" "}
                {pendingRun === "basic" ? "1 Worm" : "1 Chicken Feet"}.
              </p>
              {apiError && (
                <p className="text-xs text-red-600 dark:text-red-400 mb-2 break-words">
                  {apiError}
                </p>
              )}
              <div className="flex gap-1">
                <Button
                  className="w-full"
                  onClick={() => {
                    setHuntStep("choose");
                  }}
                >
                  {t("minigame.shopBack")}
                </Button>
                <Button className="w-full" onClick={startConfirmedRun}>
                  {t("minigame.shopConfirm")}
                </Button>
              </div>
            </div>
          </Panel>
        </Modal>
      )}
    </div>
  );
};
