import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
const PIXEL_SCALE = 2.625;
import { SUNNYSIDE } from "assets/sunnyside";
import worldIcon from "assets/icons/world.png";
import { HudContainer } from "components/ui/HudContainer";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { isTouchDevice } from "features/world/lib/device";
import { Box } from "components/ui/Box";
import  warzoneHelmetIcon from "assets/icons/warzone_helmet.png"
import Decimal from "decimal.js-light";

export const WarzoneHUD: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useAppTranslation();

  const [showMoveHint, setShowMoveHint] = useState(true);
  const [showFenceWarning, setShowFenceWarning] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const onEnemyDestroyed = (e: Event) => {
      const detail = (e as CustomEvent).detail;

      if (!detail?.count) return;

      setScore((prev) => prev + detail.count);
    };

    window.addEventListener("warzone-enemy-destroyed", onEnemyDestroyed as EventListener);

    return () => {
      window.removeEventListener(
        "warzone-enemy-destroyed",
        onEnemyDestroyed as EventListener
      );
    };
  }, []);

  // Move hint logic
  useEffect(() => {
    const timeoutId = window.setTimeout(() => setShowMoveHint(false), 2000);

    const onFirstChook = () => setShowMoveHint(false);

    window.addEventListener(
      "chicken-rescue-dismiss-move-hint",
      onFirstChook
    );

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(
        "chicken-rescue-dismiss-move-hint",
        onFirstChook
      );
    };
  }, []);

  // Fence warning logic (from Phaser)
  useEffect(() => {
    const onFenceWarning = () => {
      setShowFenceWarning(true);

      window.setTimeout(() => {
        setShowFenceWarning(false);
      }, 800);
    };

    window.addEventListener(
      "sunflowerland-warzone-fence-warning",
      onFenceWarning
    );

    return () => {
      window.removeEventListener(
        "sunflowerland-warzone-fence-warning",
        onFenceWarning
      );
    };
  }, []);

  return (
    <HudContainer>
      {/* Top-left world button */}
      <div
        className="fixed z-50 flex flex-col justify-between"
        style={{
          left: `${PIXEL_SCALE * 3}px`,
          bottom: `${PIXEL_SCALE * 3}px`,
          width: `${PIXEL_SCALE * 22}px`,
        }}
      >
        <div
          className="flex relative z-50 justify-center cursor-pointer hover:img-highlight"
          style={{
            width: `${PIXEL_SCALE * 22}px`,
            height: `${PIXEL_SCALE * 23}px`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            navigate("/home");
          }}
        >
          <img
            src={SUNNYSIDE.ui.round_button}
            className="absolute"
            style={{ width: `${PIXEL_SCALE * 22}px` }}
          />
          <img
            src={worldIcon}
            className="absolute"
            style={{
              width: `${PIXEL_SCALE * 12}px`,
              left: `${PIXEL_SCALE * 5}px`,
              top: `${PIXEL_SCALE * 4}px`,
            }}
          />
        </div>
      </div>
      <div>
        <Box
          image={warzoneHelmetIcon}
          count= {new Decimal(score)}
          showCountIfZero
          className="flex-shrink-0"
        />
      </div>

      {/* Move hint overlay */}
      {showMoveHint && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-black opacity-50" />
          <div className="flex items-center justify-center absolute inset-0">
            <span className="text-white text-center text-sm">
              {isTouchDevice()
                ? t("minigame.swipeToMove")
                : t("minigame.arrowKeysToMove")}
            </span>
          </div>
        </div>
      )}

      {/* Fence warning overlay */}
      {showFenceWarning && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="absolute inset-0 bg-red-600 opacity-30 animate-pulse" />
          <div className="relative text-white text-[3rem]">
            {t("minigame.baseWarning")}
          </div>
        </div>
      )}
    </HudContainer>
  );
};