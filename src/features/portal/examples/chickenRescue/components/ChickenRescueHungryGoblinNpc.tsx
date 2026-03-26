import React from "react";
import { NPC_WEARABLES } from "lib/npcs";
import { getAnimatedWebpUrl } from "features/world/lib/animations";
import { chookDisplayWidthPx } from "../lib/chickenRescueHomeLayout";

/**
 * Farm-style NPC (animated WebP idle-small), not the composited NFT image.
 * Shown on Chicken Rescue home above the coop.
 */
export const ChickenRescueHungryGoblinNpc: React.FC = () => {
  const widthPx = Math.round(chookDisplayWidthPx() * 1.15);
  const slotW = Math.ceil(widthPx * 1.25);
  const slotH = Math.ceil(widthPx * 1.15);

  const parts = NPC_WEARABLES["grubnuk"];
  const idle = getAnimatedWebpUrl(parts, ["idle-small"]);

  return (
    <div
      className="relative pointer-events-none mx-auto drop-shadow-lg"
      style={{ width: slotW, height: slotH }}
    >
      <div
        className="absolute w-full inset-0 pointer-events-none"
        style={{
          width: `${widthPx * 1.25}px`,
          top: `${widthPx * -0.31}px`,
          left: `${widthPx * -0.125}px`,
          imageRendering: "pixelated",
        }}
      >
        <img src={idle} style={{ width: `${widthPx * 1.25}px` }} alt="" />
      </div>
    </div>
  );
};
