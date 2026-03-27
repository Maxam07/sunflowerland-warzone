import React, { useEffect, useRef } from "react";
import { Game, AUTO } from "phaser";
import NinePatchPlugin from "phaser3-rex-plugins/plugins/ninepatch-plugin.js";
import VirtualJoystickPlugin from "phaser3-rex-plugins/plugins/virtualjoystick-plugin.js";

import { Preloader } from "features/world/scenes/Preloader";
import { ChickenRescueScene } from "./ChickenRescueScene";
import type { ChickenRescuePhaserApiRef } from "./lib/chickenRescuePhaserApi";

export type ChickenRescueRunType = "basic" | "advanced";

export const ChickenRescueGame: React.FC<{
  bumpkin: unknown;
  farmId: number;
  phaserApiRef: ChickenRescuePhaserApiRef;
  /** From URL `?run=` — drives Phaser spawns and golden chook rules. */
  runType: ChickenRescueRunType;
  initialGoldenChooks: number;
  onGameReady?: (game: Game) => void;
}> = ({
  bumpkin,
  farmId,
  phaserApiRef,
  runType,
  initialGoldenChooks,
  onGameReady,
}) => {
  const game = useRef<Game>();

  const scene = "chicken_rescue";

  const scenes = [Preloader, ChickenRescueScene];

  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: AUTO,
      fps: {
        target: 30,
        smoothStep: true,
      },
      backgroundColor: "#000000",
      parent: "phaser-example",

      autoRound: true,
      pixelArt: true,
      plugins: {
        global: [
          {
            key: "rexNinePatchPlugin",
            plugin: NinePatchPlugin,
            start: true,
          },
          {
            key: "rexVirtualJoystick",
            plugin: VirtualJoystickPlugin,
            start: true,
          },
        ],
      },
      width: window.innerWidth,
      height: window.innerHeight,

      physics: {
        default: "arcade",
        arcade: {
          debug: true,
          gravity: { x: 0, y: 0 },
        },
      },
      scene: scenes,
      loader: {
        crossOrigin: "anonymous",
      },
    };

    game.current = new Game({
      ...config,
      parent: "game-content",
    });

    game.current.registry.set("initialScene", scene);
    game.current.registry.set("gameState", { bumpkin });
    game.current.registry.set("id", farmId);
    game.current.registry.set("phaserApiRef", phaserApiRef);
    game.current.registry.set("chickenRunType", runType);
    game.current.registry.set("initialGoldenChooks", initialGoldenChooks);

    onGameReady?.(game.current);

    return () => {
      game.current?.destroy(true);
    };
  }, [bumpkin, farmId, phaserApiRef, runType, initialGoldenChooks]);

  const ref = useRef<HTMLDivElement>(null);

  return (
    <div>
      <div id="game-content" ref={ref} />
    </div>
  );
};
