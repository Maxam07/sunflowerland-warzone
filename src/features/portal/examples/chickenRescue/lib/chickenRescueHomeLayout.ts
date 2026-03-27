import type { CSSProperties } from "react";
import grassBackgroundUrl from "assets/brand/grass_background_2.png";

/**
 * CSS pixels per logical "game pixel" for Chicken Rescue home (sprites, grass, shop).
 */
export const CHICKEN_RESCUE_HOME_PIXEL_SCALE = 2.1;

/** Logical width in game pixels — coin chicken sprites on home. */
export const CHICKEN_HOME_COIN_CHICKEN_GAME_PX = 20;
/** Logical width in game pixels — market / shop image on home. */
export const CHICKEN_HOME_SHOP_IMAGE_GAME_PX = 60;

/** `grass_background_2.png` intrinsic size (px); texture is square. */
export const GRASS_TILE_SRC_PX = 64;

/** Min height (game px) for the art column so bases align. */
export const CHICKEN_HOME_ART_COLUMN_MIN_GAME_PX = 28;
/** Max height (game px) for coin-chicken sprite images. */
export const CHICKEN_HOME_COIN_CHICKEN_MAX_H_GAME_PX = 28;

/** Nugget cooking bar width as a multiple of the on-screen chicken width. */
export const COOP_FEED_PROGRESS_BAR_WIDTH_RATIO = 1.35;

/**
 * Home layout: CSS width/height = {@link CHICKEN_RESCUE_HOME_PIXEL_SCALE} × game pixels.
 */
export function chickenHomeWidthPx(gamePixels: number): number {
  return CHICKEN_RESCUE_HOME_PIXEL_SCALE * gamePixels;
}

export function chickenHomeCoinChickenSpriteWidthPx(): number {
  return chickenHomeWidthPx(CHICKEN_HOME_COIN_CHICKEN_GAME_PX);
}

export function chickenHomeShopImageWidthPx(): number {
  return chickenHomeWidthPx(CHICKEN_HOME_SHOP_IMAGE_GAME_PX);
}

export function grassTileSizePx(
  scale: number = CHICKEN_RESCUE_HOME_PIXEL_SCALE,
): number {
  return GRASS_TILE_SRC_PX * scale;
}

export function coopFeedProgressBarWidthPx(
  scale: number = CHICKEN_RESCUE_HOME_PIXEL_SCALE,
): number {
  return Math.round(
    CHICKEN_HOME_COIN_CHICKEN_GAME_PX *
      scale *
      COOP_FEED_PROGRESS_BAR_WIDTH_RATIO,
  );
}

/**
 * Hero chook / shared chicken width (same game-pixel width as home coin chickens).
 * @deprecated Prefer {@link chickenHomeCoinChickenSpriteWidthPx} for clarity.
 */
export function chookDisplayWidthPx(
  scale: number = CHICKEN_RESCUE_HOME_PIXEL_SCALE,
): number {
  return CHICKEN_HOME_COIN_CHICKEN_GAME_PX * scale;
}

export function chickenRescueHomeRootStyle(
  scale: number = CHICKEN_RESCUE_HOME_PIXEL_SCALE,
): CSSProperties {
  const tile = grassTileSizePx(scale);
  return {
    backgroundImage: `url(${grassBackgroundUrl})`,
    backgroundRepeat: "repeat",
    backgroundPosition: "top left",
    backgroundSize: `${tile}px ${tile}px`,
    imageRendering: "pixelated",
  };
}
