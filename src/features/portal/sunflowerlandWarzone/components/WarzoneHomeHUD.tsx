import React from "react";
import Decimal from "decimal.js-light";
import { Box } from "components/ui/Box";
import  warzoneHelmetIcon from "assets/icons/warzone_helmet.png"
import axeIcon from "assets/icons/warzone_axe.webp";
import { useMinigameSession } from "lib/portal";

export const WarzoneHomeHUD: React.FC = () => {
  const { playerEconomy } = useMinigameSession();

  const chooks = playerEconomy.balances["1"] ?? 0;
  const goldenChooks = playerEconomy.balances["2"] ?? 0;
  const goldenNuggets = playerEconomy.balances["0"] ?? 0;
  const chickenFeet = playerEconomy.balances["3"] ?? 0;
  const worms = playerEconomy.balances["4"] ?? 0;

  const showGoldenChookBalance =
    chickenFeet > 0 || goldenChooks > 0;

  return (
    <div className="absolute top-4 right-4 z-20 flex items-start gap-3 pointer-events-none">
      <div className="flex flex-col items-end gap-1 flex-shrink-0 pointer-events-auto">
        {/* <Box
          image={chickenFeetIcon}
          count={new Decimal(chickenFeet)}
          showCountIfZero
          className="flex-shrink-0"
        /> */}
        {/* <Box
          image={goldenNuggetIcon}
          count={new Decimal(goldenNuggets)}
          showCountIfZero
          className="flex-shrink-0"
        /> */}
        <Box
          image={axeIcon}
          count={new Decimal(worms)}
          showCountIfZero
          className="flex-shrink-0"
        />
        <Box
          image={warzoneHelmetIcon}
          count={new Decimal(chooks)}
          showCountIfZero
          className="flex-shrink-0"
        />
        {/* {showGoldenChookBalance && (
          <Box
            image={goldenChookIcon}
            count={new Decimal(goldenChooks)}
            showCountIfZero
            className="flex-shrink-0"
          />
        )} */}
      </div>
    </div>
  );
};
