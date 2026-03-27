import type { MinigameSessionResponse } from "lib/portal";
import type { TranslationKeys } from "lib/i18n/dictionaries/types";
import type { CoinChickenBalanceToken } from "./coinChickenJobs";
import { SUNNYSIDE } from "assets/sunnyside";
import cluckCoinIcon from "assets/icons/cluck_coin.webp";
import chickenNuggetIcon from "assets/icons/chicken_nugget.webp";
import chookIcon from "assets/icons/chook.webp";
import loveChickenIcon from "assets/sfts/love_chicken.webp";
import alienChickenIcon from "assets/sfts/undead_chicken.webp";
import roosterChickenIcon from "assets/sfts/rooster.webp";
import goldenChookIcon from "assets/sfts/golden_chook.png";

export type ShopItemId =
  | "buy_coins"
  | "buy_nugget"
  | "cluckcoin_swap"
  | "love_chicken"
  | "alien_chicken"
  | "rooster_chicken";

/**
 * Extend this list and {@link shopItemCanAfford} when adding shop listings.
 */
export type ShopItemDefinition = {
  id: ShopItemId;
  /** Minigame action dispatched on confirm. */
  action: string;
  iconSrc: string;
  priceIconSrc: string;
};

export const SHOP_ITEMS: ShopItemDefinition[] = [
  {
    id: "buy_coins",
    action: "BUY_QUEENS",
    iconSrc: SUNNYSIDE.ui.coins,
    priceIconSrc: cluckCoinIcon,
  },
  {
    id: "buy_nugget",
    action: "BUY_NUGGET",
    iconSrc: chickenNuggetIcon,
    priceIconSrc: chookIcon,
  },
  {
    id: "love_chicken",
    action: "BUY_LOVE_CHICKEN",
    iconSrc: loveChickenIcon,
    priceIconSrc: cluckCoinIcon,
  },
  {
    id: "alien_chicken",
    action: "BUY_ALIEN_CHICKEN",
    iconSrc: alienChickenIcon,
    priceIconSrc: cluckCoinIcon,
  },
  {
    id: "rooster_chicken",
    action: "BUY_ROOSTER_CHICKEN",
    iconSrc: roosterChickenIcon,
    priceIconSrc: cluckCoinIcon,
  },
  {
    id: "cluckcoin_swap",
    action: "BUY_CLUCKCOIN",
    iconSrc: cluckCoinIcon,
    priceIconSrc: goldenChookIcon,
  },
];

const ITEM_BY_ID: Record<ShopItemId, ShopItemDefinition> = Object.fromEntries(
  SHOP_ITEMS.map((item) => [item.id, item]),
) as Record<ShopItemId, ShopItemDefinition>;

export function getShopItem(id: ShopItemId): ShopItemDefinition {
  return ITEM_BY_ID[id];
}

/** Shop-bought coin chickens (not Goblin). Used for intro / highlight after purchase. */
export function shopItemIdForCoinChicken(
  token: CoinChickenBalanceToken,
): ShopItemId | null {
  switch (token) {
    case "LoveChicken":
      return "love_chicken";
    case "AlienChicken":
      return "alien_chicken";
    case "RoosterChicken":
      return "rooster_chicken";
    default:
      return null;
  }
}

export function shopItemCanAfford(
  item: ShopItemDefinition,
  minigame: MinigameSessionResponse["minigame"],
): boolean {
  switch (item.id) {
    case "buy_coins":
      return (minigame.balances.Cluckcoin ?? 0) >= 1;
    case "buy_nugget":
      return (minigame.balances.Chook ?? 0) >= 50;
    case "cluckcoin_swap":
      return (minigame.balances.GoldenChook ?? 0) >= 1;
    case "love_chicken":
      return (minigame.balances.Cluckcoin ?? 0) >= 5;
    case "alien_chicken":
      return (minigame.balances.Cluckcoin ?? 0) >= 15;
    case "rooster_chicken":
      return (minigame.balances.Cluckcoin ?? 0) >= 50;
    default:
      return false;
  }
}

/** One-time chicken purchases: list row is locked once you own one. */
export function shopItemChickenAlreadyOwned(
  itemId: ShopItemId,
  minigame: MinigameSessionResponse["minigame"],
): boolean {
  switch (itemId) {
    case "love_chicken":
      return (minigame.balances.LoveChicken ?? 0) > 0;
    case "alien_chicken":
      return (minigame.balances.AlienChicken ?? 0) > 0;
    case "rooster_chicken":
      return (minigame.balances.RoosterChicken ?? 0) > 0;
    default:
      return false;
  }
}

type ShopItemCopyKeys = {
  name: TranslationKeys;
  listBlurb: TranslationKeys;
  detail: TranslationKeys;
  priceValue: TranslationKeys;
  receiveValue: TranslationKeys;
  confirm: TranslationKeys;
  insufficientFunds: TranslationKeys;
};

/** Translation keys per item — add an entry when you add a {@link SHOP_ITEMS} row. */
export const SHOP_ITEM_I18N: Record<ShopItemId, ShopItemCopyKeys> = {
  buy_coins: {
    name: "minigame.shopBuyCoinsName" as TranslationKeys,
    listBlurb: "minigame.shopBuyCoinsListBlurb" as TranslationKeys,
    detail: "minigame.shopBuyCoinsDetail" as TranslationKeys,
    priceValue: "minigame.shopBuyCoinsPriceValue" as TranslationKeys,
    receiveValue: "minigame.shopBuyCoinsReceiveValue" as TranslationKeys,
    confirm: "minigame.shopBuyCoinsConfirm" as TranslationKeys,
    insufficientFunds: "minigame.shopInsufficientCluckcoin1" as TranslationKeys,
  },
  buy_nugget: {
    name: "minigame.shopNuggetSwapName",
    listBlurb: "minigame.shopNuggetSwapListBlurb",
    detail: "minigame.shopNuggetSwapDetail",
    priceValue: "minigame.shopNuggetSwapPriceValue",
    receiveValue: "minigame.shopNuggetSwapReceiveValue",
    confirm: "minigame.shopNuggetSwapConfirm",
    insufficientFunds: "minigame.shopInsufficientChooks50",
  },
  cluckcoin_swap: {
    name: "minigame.shopCluckcoinName",
    listBlurb: "minigame.shopCluckcoinListBlurb",
    detail: "minigame.shopCluckcoinDetail",
    priceValue: "minigame.shopCluckcoinPriceValue",
    receiveValue: "minigame.shopCluckcoinReceiveValue",
    confirm: "minigame.shopCluckcoinConfirm",
    insufficientFunds: "minigame.shopInsufficientGoldenChook",
  },
  love_chicken: {
    name: "minigame.shopLoveChickenName",
    listBlurb: "minigame.shopLoveChickenListBlurb",
    detail: "minigame.shopLoveChickenDetail",
    priceValue: "minigame.shopLoveChickenPriceValue",
    receiveValue: "minigame.shopLoveChickenReceiveValue",
    confirm: "minigame.shopLoveChickenConfirm",
    insufficientFunds: "minigame.shopInsufficientCluckcoin5",
  },
  alien_chicken: {
    name: "minigame.shopAlienChickenName",
    listBlurb: "minigame.shopAlienChickenListBlurb",
    detail: "minigame.shopAlienChickenDetail",
    priceValue: "minigame.shopAlienChickenPriceValue",
    receiveValue: "minigame.shopAlienChickenReceiveValue",
    confirm: "minigame.shopAlienChickenConfirm",
    insufficientFunds: "minigame.shopInsufficientCluckcoin15",
  },
  rooster_chicken: {
    name: "minigame.shopRoosterChickenName",
    listBlurb: "minigame.shopRoosterChickenListBlurb",
    detail: "minigame.shopRoosterChickenDetail",
    priceValue: "minigame.shopRoosterChickenPriceValue",
    receiveValue: "minigame.shopRoosterChickenReceiveValue",
    confirm: "minigame.shopRoosterChickenConfirm",
    insufficientFunds: "minigame.shopInsufficientCluckcoin50",
  },
};
