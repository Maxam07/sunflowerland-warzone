import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "components/ui/Modal";
import { ButtonPanel, Panel } from "components/ui/Panel";
import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { NPC_WEARABLES } from "lib/npcs";
import fatChickenIcon from "assets/sfts/fat_chicken.webp";
import loveChickenIcon from "assets/sfts/love_chicken.webp";
import alienChickenIcon from "assets/sfts/undead_chicken.webp";
import roosterChickenIcon from "assets/sfts/rooster.webp";
import chookIcon from "assets/icons/chook.webp";
import chookMarketIcon from "assets/sfts/chook_market.png";
import chickenNuggetIcon from "assets/icons/chicken_nugget.webp";
import goldenChookIcon from "assets/sfts/golden_chook.png";
import { SUNNYSIDE } from "assets/sunnyside";
import { coinsFromMinigame } from "./lib/chickenRescueMachine";
import {
  chickenHomeShopImageWidthPx,
  chickenRescueHomeRootStyle,
} from "./lib/chickenRescueHomeLayout";
import { useNowTicker } from "./lib/chickenRescueNugget";
import { useMinigameSession } from "lib/portal";
import { CluckcoinShopModal } from "./components/CluckcoinShopModal";
import { ChickenRescueHomeHUD } from "./components/ChickenRescueHomeHUD";
import { CoinChickenHomeTile } from "./components/CoinChickenHomeTile";
import type { CoinChickenBalanceToken } from "./lib/coinChickenJobs";

export const ChickenRescueHome: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const { minigame, dispatchAction, clearApiError, apiError } =
    useMinigameSession();
  const now = useNowTicker();

  const [huntModalOpen, setHuntModalOpen] = useState(false);
  const [cluckcoinShopOpen, setCluckcoinShopOpen] = useState(false);
  const [huntStep, setHuntStep] = useState<"speech" | "choose" | "confirm">(
    "speech",
  );
  const [pendingRun, setPendingRun] = useState<"basic" | "advanced" | null>(
    null,
  );
  const [coinChickenHighlight, setCoinChickenHighlight] =
    useState<CoinChickenBalanceToken | null>(null);

  const clearCoinChickenHighlight = useCallback(
    () => setCoinChickenHighlight(null),
    [],
  );

  const coinsLeft = coinsFromMinigame(minigame);
  const nuggets = minigame.balances.Nugget ?? 0;
  const canStartBasic = coinsLeft >= 1;
  const canStartAdvanced = nuggets >= 1;

  const startBasicRun = () => {
    const ok = dispatchAction({ action: "START" });
    if (ok) {
      closeHuntFlow();
      navigate("/game?run=basic");
    }
  };

  const startAdvancedRun = () => {
    const ok = dispatchAction({ action: "START_ADVANCED_GAME" });
    if (ok) {
      closeHuntFlow();
      navigate("/game?run=advanced");
    }
  };

  const openCluckcoinShop = () => {
    clearApiError();
    setCluckcoinShopOpen(true);
  };

  const openHuntFlow = () => {
    clearApiError();
    setPendingRun(null);
    setHuntStep("speech");
    setHuntModalOpen(true);
  };

  const closeHuntFlow = () => {
    setHuntModalOpen(false);
    setPendingRun(null);
    setHuntStep("speech");
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

  const coinChickenConfigs = [
    {
      token: "GoblinChicken" as const,
      startAction: "START_FAT_CHICKEN_DROP" as const,
      collectAction: "COLLECT_FAT_CHICKEN" as const,
      iconSrc: fatChickenIcon,
    },
    {
      token: "LoveChicken" as const,
      startAction: "START_LOVE_COIN_DROP" as const,
      collectAction: "COLLECT_LOVE_COINS" as const,
      iconSrc: loveChickenIcon,
    },
    {
      token: "AlienChicken" as const,
      startAction: "START_ALIEN_COIN_DROP" as const,
      collectAction: "COLLECT_ALIEN_COINS" as const,
      iconSrc: alienChickenIcon,
    },
    {
      token: "RoosterChicken" as const,
      startAction: "START_ROOSTER_COIN_DROP" as const,
      collectAction: "COLLECT_ROOSTER_COINS" as const,
      iconSrc: roosterChickenIcon,
    },
  ].filter(
    (c) => c.token === "GoblinChicken" || (minigame.balances[c.token] ?? 0) > 0,
  );

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden [image-rendering:pixelated]"
      style={chickenRescueHomeRootStyle()}
    >
      <ChickenRescueHomeHUD />

      <CluckcoinShopModal
        show={cluckcoinShopOpen}
        onClose={() => setCluckcoinShopOpen(false)}
        onPurchasedCoinChicken={(token) => setCoinChickenHighlight(token)}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-28 z-10 gap-2">
        <button
          type="button"
          className="pointer-events-auto mb-1 flex flex-col items-center gap-1 border-0 bg-transparent p-0 shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-900/60"
          onClick={openCluckcoinShop}
          aria-label={t("minigame.portalShopTitle")}
        >
          <img
            src={chookMarketIcon}
            alt=""
            className="pixelated mx-auto h-auto"
            style={{
              imageRendering: "pixelated",
              width: chickenHomeShopImageWidthPx(),
            }}
          />
        </button>
        <div className="flex w-full max-w-full flex-row flex-wrap justify-center items-end gap-x-4 gap-y-3 px-2 pointer-events-none">
          {coinChickenConfigs.map((chicken, index) => (
            <div
              key={chicken.token}
              className="relative pointer-events-auto"
              style={{ zIndex: 10 + index }}
            >
              <CoinChickenHomeTile
                now={now}
                iconSrc={chicken.iconSrc}
                balanceToken={chicken.token}
                startAction={chicken.startAction}
                collectAction={chicken.collectAction}
                showNewPurchaseHint={
                  coinChickenHighlight === chicken.token
                }
                onNewPurchaseHintConsumed={clearCoinChickenHighlight}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10 px-4">
        <Button onClick={openHuntFlow}>Chicken Hunt</Button>
      </div>

      {huntModalOpen && huntStep === "speech" && (
        <Modal show>
          <Panel bumpkinParts={NPC_WEARABLES.grubnuk}>
            <div className="p-2">
              <p className="text-sm leading-relaxed mb-3">
                You can search for chickens and magical items in my fields.
                Only one condition, you must pay every time you enter.
              </p>
              {apiError && (
                <p className="text-xs text-red-600 dark:text-red-400 mb-2 break-words">
                  {apiError}
                </p>
              )}
              <div className="flex gap-1">
                <Button className="w-full" onClick={closeHuntFlow}>
                  {t("close")}
                </Button>
                <Button
                  className="w-full"
                  onClick={() => {
                    setHuntStep("choose");
                  }}
                >
                  Continue
                </Button>
              </div>
            </div>
          </Panel>
        </Modal>
      )}

      {huntModalOpen && huntStep === "choose" && (
        <Modal show>
          <Panel>
            <div className="p-2">
              <Label type="default" className="mb-2" icon={SUNNYSIDE.icons.search}>
                Chicken Hunt
              </Label>
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
                        <Label type={canStartBasic ? "warning" : "danger"} icon={SUNNYSIDE.ui.coins}>
                          1 Coin
                        </Label>
                      </div>
                      <p className="text-xs mt-0.5 opacity-85 leading-snug">
                        You can find Chooks.
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
                          icon={chickenNuggetIcon}
                        >
                          1 Nugget
                        </Label>
                      </div>
                      <p className="text-xs mt-0.5 opacity-85 leading-snug">
                        More difficult run where you can find Golden Chooks.
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
              <Button className="w-full mt-2" onClick={closeHuntFlow}>
                {t("close")}
              </Button>
            </div>
          </Panel>
        </Modal>
      )}

      {huntModalOpen && huntStep === "confirm" && pendingRun !== null && (
        <Modal show>
          <Panel bumpkinParts={NPC_WEARABLES.grubnuk}>
            <div className="p-2">
              <p className="text-sm mb-3">
                Are you sure you want to continue? It will cost{" "}
                {pendingRun === "basic" ? "1 Coin" : "1 Nugget"}.
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
