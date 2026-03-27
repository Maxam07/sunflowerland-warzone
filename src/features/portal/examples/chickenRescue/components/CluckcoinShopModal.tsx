import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Modal } from "components/ui/Modal";
import { ButtonPanel, Panel } from "components/ui/Panel";
import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";
import { SUNNYSIDE } from "assets/sunnyside";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { useMinigameSession } from "lib/portal";
import type { CoinChickenBalanceToken } from "../lib/coinChickenJobs";
import {
  type ShopItemId,
  SHOP_ITEMS,
  getShopItem,
  shopItemCanAfford,
  shopItemChickenAlreadyOwned,
  SHOP_ITEM_I18N,
} from "../lib/chickenRescueShopCatalog";

const SHOP_PURCHASE_HIGHLIGHTS_COIN_CHICKEN: Partial<
  Record<ShopItemId, CoinChickenBalanceToken>
> = {
  love_chicken: "LoveChicken",
  alien_chicken: "AlienChicken",
  rooster_chicken: "RoosterChicken",
};

type Props = {
  show: boolean;
  onClose: () => void;
  /** After buying Love / Alien / Rooster, home highlights that chicken until they start a drop. */
  onPurchasedCoinChicken?: (token: CoinChickenBalanceToken) => void;
};

type ShopScreen = { view: "list" } | { view: "detail"; itemId: ShopItemId };

type PurchaseFlash = { iconSrc: string; message: string };

export const CluckcoinShopModal: React.FC<Props> = ({
  show,
  onClose,
  onPurchasedCoinChicken,
}) => {
  const { t } = useAppTranslation();
  const { minigame, dispatchAction, apiError, clearApiError } =
    useMinigameSession();

  const [screen, setScreen] = useState<ShopScreen>({ view: "list" });
  const [purchaseFlash, setPurchaseFlash] = useState<PurchaseFlash | null>(
    null,
  );

  useEffect(() => {
    if (show) {
      setScreen({ view: "list" });
      setPurchaseFlash(null);
    }
  }, [show]);

  useEffect(() => {
    if (screen.view !== "detail") return;
    if (shopItemChickenAlreadyOwned(screen.itemId, minigame)) {
      setScreen({ view: "list" });
    }
  }, [screen, minigame]);

  useEffect(() => {
    if (!purchaseFlash) return undefined;
    const id = window.setTimeout(() => setPurchaseFlash(null), 2500);
    return () => window.clearTimeout(id);
  }, [purchaseFlash]);

  const onConfirmPurchase = (itemId: ShopItemId) => {
    const item = getShopItem(itemId);
    clearApiError();
    const ok = dispatchAction({ action: item.action });
    if (ok) {
      setPurchaseFlash({
        iconSrc: item.iconSrc,
        message: t(SHOP_ITEM_I18N[itemId].receiveValue),
      });
      setScreen({ view: "list" });
      const highlightToken = SHOP_PURCHASE_HIGHLIGHTS_COIN_CHICKEN[itemId];
      if (highlightToken) {
        onPurchasedCoinChicken?.(highlightToken);
      }
    }
  };

  if (!show) {
    return null;
  }

  const detailItem =
    screen.view === "detail" ? getShopItem(screen.itemId) : null;
  const canAffordDetail =
    detailItem !== null && shopItemCanAfford(detailItem, minigame);

  return (
    <>
      <Modal show>
        <div className="flex flex-col gap-2 w-full mx-auto px-1">
          <Panel>
          {screen.view === "list" && (
            <>
              <div className="p-2">
                <Label
                  type="default"
                  className="mb-2"
                  icon={SUNNYSIDE.icons.shop}
                >
                  {t("minigame.portalShopTitle")}
                </Label>
                <p className="text-xs mb-2 opacity-90">
                  {t("minigame.portalShopSubtitle")}
                </p>

                <ul className="flex flex-col gap-1.5">
                  {SHOP_ITEMS.map((item) => (
                    <li key={item.id}>
                      <ShopListRow
                        itemId={item.id}
                        iconSrc={item.iconSrc}
                        priceIconSrc={item.priceIconSrc}
                        canAfford={shopItemCanAfford(item, minigame)}
                        alreadyOwned={shopItemChickenAlreadyOwned(
                          item.id,
                          minigame,
                        )}
                        onSelect={() =>
                          setScreen({ view: "detail", itemId: item.id })
                        }
                      />
                    </li>
                  ))}
                </ul>

                {apiError && (
                  <div className="mt-2 rounded-sm bg-red-500/10 px-2 py-1.5">
                    <p className="text-xs text-red-600 dark:text-red-400 break-words">
                      {apiError}
                    </p>
                    <Button
                      className="w-full text-xs py-1 mt-1"
                      onClick={clearApiError}
                    >
                      {t("close")}
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 px-2 pb-2">
                <Button className="w-full" onClick={onClose}>
                  {t("close")}
                </Button>
              </div>
            </>
          )}

          {screen.view === "detail" && detailItem && (
            <>
              <div className="p-2">
                <div className="flex flex-col items-center text-center mb-3">
                  <img
                    src={detailItem.iconSrc}
                    alt=""
                    className="w-16 h-16 object-contain mb-2 pixelated"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <h3 className="text-sm font-medium">
                    {t(SHOP_ITEM_I18N[detailItem.id].name)}
                  </h3>
                </div>

                <p className="text-sm mb-3">
                  {t(SHOP_ITEM_I18N[detailItem.id].detail)}
                </p>

                <div className="rounded-sm bg-black/5 dark:bg-white/10 px-2 py-2 text-sm space-y-1.5 mb-3">
                  <div className="flex justify-between gap-2">
                    <span className="opacity-80">
                      {t("minigame.shopPriceLabel")}
                    </span>
                    <span className="font-medium text-right">
                      {t(SHOP_ITEM_I18N[detailItem.id].priceValue)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="opacity-80">
                      {t("minigame.shopReceiveLabel")}
                    </span>
                    <span className="font-medium text-right">
                      {t(SHOP_ITEM_I18N[detailItem.id].receiveValue)}
                    </span>
                  </div>
                </div>

                <p className="text-xs mb-2 border border-black/15 dark:border-white/20 rounded-sm px-2 py-1.5 bg-black/[0.03] dark:bg-white/[0.06]">
                  {t(SHOP_ITEM_I18N[detailItem.id].confirm)}
                </p>

                {!canAffordDetail && (
                  <p className="text-xs text-amber-900 dark:text-amber-200/90 mb-2">
                    {t(SHOP_ITEM_I18N[detailItem.id].insufficientFunds)}
                  </p>
                )}

                {apiError && (
                  <div className="mb-2 rounded-sm bg-red-500/10 px-2 py-1.5">
                    <p className="text-xs text-red-600 dark:text-red-400 break-words">
                      {apiError}
                    </p>
                    <Button
                      className="w-full text-xs py-1 mt-1"
                      onClick={clearApiError}
                    >
                      {t("close")}
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1 px-2 pb-2">
                <Button
                  className="w-full"
                  disabled={!canAffordDetail}
                  onClick={() => onConfirmPurchase(detailItem.id)}
                >
                  {t("minigame.shopConfirm")}
                </Button>
                <Button
                  className="w-full"
                  onClick={() => setScreen({ view: "list" })}
                >
                  {t("minigame.shopBack")}
                </Button>
              </div>
            </>
          )}
          </Panel>
        </div>
      </Modal>

      {purchaseFlash &&
        createPortal(
          <div
            className="pointer-events-none fixed bottom-36 left-1/2 z-[140] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-md border border-emerald-800/35 bg-emerald-50/95 px-3 py-2 shadow-lg sm:bottom-40 dark:bg-emerald-950/90 dark:border-emerald-600/40"
            aria-hidden
          >
            <img
              src={purchaseFlash.iconSrc}
              alt=""
              className="h-7 w-7 object-contain pixelated sm:h-8 sm:w-8"
              style={{ imageRendering: "pixelated" }}
            />
            <span className="text-base font-bold text-emerald-800 tabular-nums leading-none sm:text-lg dark:text-emerald-300">
              +{purchaseFlash.message}
            </span>
          </div>,
          document.body,
        )}
    </>
  );
};

const ShopListRow: React.FC<{
  itemId: ShopItemId;
  iconSrc: string;
  priceIconSrc: string;
  canAfford: boolean;
  alreadyOwned: boolean;
  onSelect: () => void;
}> = ({
  itemId,
  iconSrc,
  priceIconSrc,
  canAfford,
  alreadyOwned,
  onSelect,
}) => {
  const { t } = useAppTranslation();
  const keys = SHOP_ITEM_I18N[itemId];

  const copy = {
    name: t(keys.name),
    blurb: t(keys.listBlurb),
    price: t(keys.priceValue),
  };

  if (alreadyOwned) {
    return (
      <div
        className="flex cursor-default items-center rounded-sm border border-black/20 bg-black/[0.06] px-1 py-1 opacity-90 dark:border-white/20 dark:bg-white/[0.08]"
        aria-label={t("minigame.shopChickenOwnedAria")}
      >
        <img
          src={iconSrc}
          alt=""
          className="mr-2 h-11 w-11 shrink-0 object-contain pixelated"
          style={{ imageRendering: "pixelated" }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium leading-tight">{copy.name}</span>
            <img
              src={SUNNYSIDE.icons.confirm}
              alt=""
              className="h-6 w-6 shrink-0 object-contain pixelated opacity-90"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
          <p className="mt-0.5 text-xs leading-snug opacity-85">{copy.blurb}</p>
        </div>
      </div>
    );
  }

  return (
    <ButtonPanel onClick={onSelect} className="flex">
      <img
        src={iconSrc}
        alt=""
        className="w-11 h-11 mr-2 shrink-0 object-contain pixelated"
        style={{ imageRendering: "pixelated" }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-2 items-start">
          <span className="text-sm font-medium leading-tight">{copy.name}</span>
          <Label type={canAfford ? "warning" : "danger"} icon={priceIconSrc}>
            {copy.price}
          </Label>
        </div>
        <p className="text-xs mt-0.5 opacity-85 leading-snug">{copy.blurb}</p>
      </div>
    </ButtonPanel>
  );
};
