import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Modal } from "components/ui/Modal";
import { Panel } from "components/ui/Panel";
import { Button } from "components/ui/Button";
import { ProgressBar } from "components/ui/ProgressBar";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { SUNNYSIDE } from "assets/sunnyside";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { useMinigameSession } from "lib/portal";
import {
  coinProducingJobs,
  formatTimeLeftMs,
  goblinCoinCookProgressPercent,
} from "../lib/chickenRescueGoblinCoin";
import {
  canStartCoinDropForChicken,
  coinJobsForChickenLine,
  type CoinChickenBalanceToken,
} from "../lib/coinChickenJobs";
import {
  SHOP_ITEM_I18N,
  shopItemIdForCoinChicken,
} from "../lib/chickenRescueShopCatalog";
import {
  CHICKEN_HOME_ART_COLUMN_MIN_GAME_PX,
  CHICKEN_HOME_COIN_CHICKEN_MAX_H_GAME_PX,
  chickenHomeCoinChickenSpriteWidthPx,
  chickenHomeWidthPx,
} from "../lib/chickenRescueHomeLayout";

const COIN_DROP_AMOUNT = 3;

const COIN_READY_ICON_GAME_PX = 8;
const NEW_HINT_BADGE_GAME_PX = 7;

/** Game pixels: matches `ProgressBar` / `Bar` default width (15). */
const PROGRESS_BAR_GAME_WIDTH = 15;
const PROGRESS_BAR_GAME_HEIGHT = 7;

/** Reserved height under chickens so progress UI lines up across tiles (`ProgressBar` timer + bar). */
const PROGRESS_SLOT_PX =
  PIXEL_SCALE * (5.5 + PROGRESS_BAR_GAME_HEIGHT);

export type CoinChickenHomeTileProps = {
  now: number;
  iconSrc: string;
  balanceToken: CoinChickenBalanceToken;
  startAction:
    | "START_FAT_CHICKEN_DROP"
    | "START_LOVE_COIN_DROP"
    | "START_ALIEN_COIN_DROP"
    | "START_ROOSTER_COIN_DROP";
  collectAction:
    | "COLLECT_FAT_CHICKEN"
    | "COLLECT_LOVE_COINS"
    | "COLLECT_ALIEN_COINS"
    | "COLLECT_ROOSTER_COINS";
  /** After buying this chicken in the shop, pulse until they start a coin drop. */
  showNewPurchaseHint?: boolean;
  onNewPurchaseHintConsumed?: () => void;
};

export const CoinChickenHomeTile: React.FC<CoinChickenHomeTileProps> = ({
  now,
  iconSrc,
  balanceToken,
  startAction,
  collectAction,
  showNewPurchaseHint = false,
  onNewPurchaseHintConsumed,
}) => {
  const { t } = useAppTranslation();
  const {
    minigame,
    dispatchAction,
    dispatchMinigameActionsSequential,
    apiError,
    clearApiError,
  } = useMinigameSession();
  const [cookingModalOpen, setCookingModalOpen] = useState(false);
  const [introModalOpen, setIntroModalOpen] = useState(false);
  const [showCollectFlash, setShowCollectFlash] = useState(false);

  useEffect(() => {
    if (!showCollectFlash) return undefined;
    const t = window.setTimeout(() => setShowCollectFlash(false), 3000);
    return () => window.clearTimeout(t);
  }, [showCollectFlash]);

  const allJobs = useMemo(
    () => coinProducingJobs(minigame.producing),
    [minigame.producing],
  );

  const lineJobs = useMemo(
    () => coinJobsForChickenLine(allJobs, balanceToken, minigame.balances),
    [allJobs, balanceToken, minigame.balances],
  );

  const readyJobs = useMemo(
    () => lineJobs.filter((j) => now >= j.completesAt),
    [lineJobs, now],
  );

  const cookingJobs = useMemo(
    () => lineJobs.filter((j) => now < j.completesAt),
    [lineJobs, now],
  );

  const primaryCooking = useMemo(() => {
    if (cookingJobs.length === 0) return null;
    return [...cookingJobs].sort((a, b) => a.completesAt - b.completesAt)[0];
  }, [cookingJobs]);

  const canStart = canStartCoinDropForChicken(
    lineJobs.length,
    balanceToken,
    minigame.balances,
  );

  const shopId = shopItemIdForCoinChicken(balanceToken);
  const wantsIntroFirst =
    showNewPurchaseHint && shopId !== null && lineJobs.length === 0;

  useEffect(() => {
    if (!showNewPurchaseHint || !onNewPurchaseHintConsumed) return;
    if (lineJobs.length > 0) {
      onNewPurchaseHintConsumed();
    }
  }, [lineJobs.length, showNewPurchaseHint, onNewPurchaseHintConsumed]);

  const handleMainClick = () => {
    clearApiError();
    if (readyJobs.length > 0) {
      const first = readyJobs[0];
      const ok = dispatchMinigameActionsSequential([
        { action: collectAction, itemId: first.id },
        { action: startAction },
      ]);
      if (ok) {
        setShowCollectFlash(true);
      }
      return;
    }
    if (cookingJobs.length > 0) {
      setCookingModalOpen(true);
      return;
    }
    if (canStart && wantsIntroFirst) {
      setIntroModalOpen(true);
      return;
    }
    if (canStart) {
      dispatchAction({ action: startAction });
    }
  };

  const handleIntroStart = () => {
    clearApiError();
    const ok = dispatchAction({ action: startAction });
    if (ok) {
      setIntroModalOpen(false);
      onNewPurchaseHintConsumed?.();
    }
  };

  const timeLeftMs = primaryCooking
    ? Math.max(0, primaryCooking.completesAt - now)
    : 0;
  const cookPct = primaryCooking
    ? goblinCoinCookProgressPercent(primaryCooking, now)
    : 0;

  const showPulseRing =
    wantsIntroFirst && readyJobs.length === 0 && cookingJobs.length === 0;

  const tileWidthPx = Math.max(
    chickenHomeCoinChickenSpriteWidthPx(),
    PIXEL_SCALE * PROGRESS_BAR_GAME_WIDTH,
  );
  const spriteW = chickenHomeCoinChickenSpriteWidthPx();
  const spriteMaxH = chickenHomeWidthPx(CHICKEN_HOME_COIN_CHICKEN_MAX_H_GAME_PX);
  const artColumnMinH = chickenHomeWidthPx(CHICKEN_HOME_ART_COLUMN_MIN_GAME_PX);

  return (
    <>
      <div
        className="relative mt-2 flex flex-col items-center"
        style={{ width: tileWidthPx }}
      >
        {showPulseRing && (
          <>
            <div
              className="pointer-events-none absolute -inset-1 z-0 rounded-xl ring-2 ring-amber-400/90 animate-pulse motion-reduce:animate-none"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute -right-1 -top-1 z-20 flex items-center justify-center rounded-full border-2 border-amber-900 bg-amber-200 text-[13px] font-bold leading-none text-amber-950 shadow-md motion-safe:animate-bounce dark:border-amber-700 dark:bg-amber-300/90 motion-reduce:animate-none"
              style={{
                width: chickenHomeWidthPx(NEW_HINT_BADGE_GAME_PX),
                height: chickenHomeWidthPx(NEW_HINT_BADGE_GAME_PX),
              }}
              aria-hidden
            >
              ?
            </span>
          </>
        )}
        <button
          type="button"
          className="relative z-10 flex w-full flex-col items-center border-0 bg-transparent p-0 shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-900/60"
          onClick={handleMainClick}
          aria-label={t("minigame.coinChickenHomeTileAriaLabel")}
        >
          <div
            className="flex w-full items-end justify-center"
            style={{ minHeight: artColumnMinH }}
          >
            <div
              className="relative flex max-w-full items-end justify-center"
              style={{ maxHeight: spriteMaxH }}
            >
              <img
                src={iconSrc}
                alt=""
                className="w-auto object-contain object-bottom pixelated"
                style={{
                  imageRendering: "pixelated",
                  width: spriteW,
                  height: "auto",
                  maxHeight: spriteMaxH,
                }}
              />
              {readyJobs.length > 0 && (
                <img
                  src={SUNNYSIDE.ui.coins}
                  alt=""
                  className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/4 object-contain pixelated drop-shadow-md"
                  style={{
                    imageRendering: "pixelated",
                    width: chickenHomeWidthPx(COIN_READY_ICON_GAME_PX),
                    height: "auto",
                  }}
                />
              )}
            </div>
          </div>
        </button>
        <div
          className="relative z-10 mt-1 flex w-full shrink-0 justify-center pointer-events-none"
          style={{ height: PROGRESS_SLOT_PX }}
        >
          {primaryCooking && (
            <div
              className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2"
              style={{
                width: PIXEL_SCALE * PROGRESS_BAR_GAME_WIDTH,
                paddingTop: PIXEL_SCALE * 5.5,
                minHeight: PIXEL_SCALE * (PROGRESS_BAR_GAME_HEIGHT + 5.5),
              }}
            >
              <ProgressBar
                percentage={cookPct}
                type="quantity"
                formatLength="short"
                seconds={Math.max(0, timeLeftMs / 1000)}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(cookPct)}
              />
            </div>
          )}
        </div>
      </div>

      {showCollectFlash &&
        createPortal(
          <div
            className="pointer-events-none fixed bottom-28 left-1/2 z-[130] flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-md border border-amber-900/30 bg-amber-50/95 px-3 py-2 shadow-lg sm:bottom-32 dark:bg-[#2a1f24]/95 dark:border-amber-700/40"
            aria-hidden
          >
            <img
              src={SUNNYSIDE.ui.coins}
              alt=""
              className="h-6 w-6 sm:h-7 sm:w-7 object-contain pixelated"
              style={{ imageRendering: "pixelated" }}
            />
            <span className="text-base sm:text-lg font-bold text-amber-700 tabular-nums leading-none dark:text-amber-400">
              {t("minigame.coinChickenCollectFlash", {
                count: COIN_DROP_AMOUNT,
              })}
            </span>
          </div>,
          document.body,
        )}

      {cookingModalOpen && primaryCooking && (
        <Modal show>
          <Panel>
            <div className="p-2 max-w-sm mx-auto">
              <p className="text-sm mb-3 text-center">
                {t("minigame.coinChickenReadyInModal", {
                  count: COIN_DROP_AMOUNT,
                  time: formatTimeLeftMs(
                    Math.max(0, primaryCooking.completesAt - now),
                  ),
                })}
              </p>
              {apiError && (
                <p className="text-xs text-red-600 dark:text-red-400 mb-2 break-words">
                  {apiError}
                </p>
              )}
              <Button
                className="w-full"
                onClick={() => {
                  clearApiError();
                  setCookingModalOpen(false);
                }}
              >
                {t("close")}
              </Button>
            </div>
          </Panel>
        </Modal>
      )}

      {introModalOpen && shopId !== null && (
        <Modal show>
          <Panel>
            <div className="p-2 max-w-sm mx-auto">
              <div className="mb-3 flex flex-col items-center text-center">
                <img
                  src={iconSrc}
                  alt=""
                  className="mb-2 object-contain pixelated"
                  style={{
                    imageRendering: "pixelated",
                    width: spriteW,
                    height: "auto",
                    maxHeight: chickenHomeWidthPx(
                      CHICKEN_HOME_ART_COLUMN_MIN_GAME_PX,
                    ),
                  }}
                />
                <h3 className="text-sm font-semibold">
                  {t(SHOP_ITEM_I18N[shopId].name)}
                </h3>
              </div>
              <p className="text-sm mb-4 leading-relaxed text-center">
                {t(SHOP_ITEM_I18N[shopId].detail)}
              </p>
              {apiError && (
                <p className="text-xs text-red-600 dark:text-red-400 mb-2 break-words">
                  {apiError}
                </p>
              )}
              <div className="flex flex-col gap-1">
                <Button className="w-full" onClick={handleIntroStart}>
                  {t("minigame.coinChickenIntroStart")}
                </Button>
                <Button
                  className="w-full"
                  onClick={() => {
                    clearApiError();
                    setIntroModalOpen(false);
                  }}
                >
                  {t("close")}
                </Button>
              </div>
            </div>
          </Panel>
        </Modal>
      )}
    </>
  );
};
