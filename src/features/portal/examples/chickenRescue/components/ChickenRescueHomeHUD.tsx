import React from "react";
import Decimal from "decimal.js-light";
import { Box } from "components/ui/Box";
import { SUNNYSIDE } from "assets/sunnyside";
import chookIcon from "assets/icons/chook.webp";
import chickenNuggetIcon from "assets/icons/chicken_nugget.webp";
import cluckCoinIcon from "assets/icons/cluck_coin.webp";
import goldenChookIcon from "assets/sfts/golden_chook.png";
import { useMinigameSession } from "lib/portal";

export const ChickenRescueHomeHUD: React.FC = () => {
  const { minigame } = useMinigameSession();

  const chooks = minigame.balances.Chook ?? 0;
  const goldenChooks = minigame.balances.GoldenChook ?? 0;
  const cluckcoin = minigame.balances.Cluckcoin ?? 0;
  const nuggets = minigame.balances.Nugget ?? 0;
  const coins = minigame.balances.Coin ?? 0;

  return (
    <div className="absolute top-4 right-4 z-20 flex items-start gap-3 pointer-events-none">
      <div className="flex flex-col items-end gap-1 flex-shrink-0 pointer-events-auto">
        <Box
          image={chickenNuggetIcon}
          count={new Decimal(nuggets)}
          showCountIfZero
          className="flex-shrink-0"
        />
        <Box
          image={cluckCoinIcon}
          count={new Decimal(cluckcoin)}
          showCountIfZero
          className="flex-shrink-0"
        />
        <Box
          image={SUNNYSIDE.ui.coins}
          count={new Decimal(coins)}
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
