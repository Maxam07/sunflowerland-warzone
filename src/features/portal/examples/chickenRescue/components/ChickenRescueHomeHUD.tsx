import React from "react";
import Decimal from "decimal.js-light";
import { Box } from "components/ui/Box";
import chookIcon from "assets/icons/chook.webp";
import chickenFeetIcon from "assets/icons/chicken_feet.webp";
import goldenNuggetIcon from "assets/icons/golden_nugget.webp";
import wormIcon from "assets/icons/worm.png";
import goldenChookIcon from "assets/sfts/golden_chook.png";
import { useMinigameSession } from "lib/portal";

export const ChickenRescueHomeHUD: React.FC = () => {
  const { minigame } = useMinigameSession();

  const chooks = minigame.balances.Chook ?? 0;
  const goldenChooks = minigame.balances.GoldenChook ?? 0;
  const goldenNuggets = minigame.balances.GoldenNugget ?? 0;
  const chickenFeet = minigame.balances.ChickenFeet ?? 0;
  const worms = minigame.balances.Worm ?? 0;

  return (
    <div className="absolute top-4 right-4 z-20 flex items-start gap-3 pointer-events-none">
      <div className="flex flex-col items-end gap-1 flex-shrink-0 pointer-events-auto">
        <Box
          image={chickenFeetIcon}
          count={new Decimal(chickenFeet)}
          showCountIfZero
          className="flex-shrink-0"
        />
        <Box
          image={goldenNuggetIcon}
          count={new Decimal(goldenNuggets)}
          showCountIfZero
          className="flex-shrink-0"
        />
        <Box
          image={wormIcon}
          count={new Decimal(worms)}
          showCountIfZero
          className="flex-shrink-0"
        />
        <Box
          image={chookIcon}
          count={new Decimal(chooks)}
          showCountIfZero
          className="flex-shrink-0"
        />
        <Box
          image={goldenChookIcon}
          count={new Decimal(goldenChooks)}
          showCountIfZero
          className="flex-shrink-0"
        />
      </div>
    </div>
  );
};
