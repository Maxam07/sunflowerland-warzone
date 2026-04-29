import React, { useEffect, useRef } from "react";
import { Game, AUTO } from "phaser";
import NinePatchPlugin from "phaser3-rex-plugins/plugins/ninepatch-plugin.js";
import VirtualJoystickPlugin from "phaser3-rex-plugins/plugins/virtualjoystick-plugin.js";

import { Preloader } from "features/world/scenes/Preloader";
import { WarzoneScene } from "./WarzoneScene";
import type { WarzonePhaserApiRef } from "./lib/warzonePhaserApi";
import type { ChickenRescueRunType } from "./lib/GameRunContext";

export type { ChickenRescueRunType };

export const WarzoneGame: React.FC<{
  bumpkin: unknown;
  farmId: number;
  phaserApiRef: WarzonePhaserApiRef;
  /** From URL `?run=` — drives Phaser spawns and golden chook rules. */
  runType: ChickenRescueRunType;
  onGameReady?: (game: Game) => void;
}> = ({
  bumpkin,
  farmId,
  phaserApiRef,
  runType,
  onGameReady,
}) => {
  const game = useRef<Game>();

  const scene = "chicken_rescue";

  const scenes = [Preloader, WarzoneScene];

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
      width: Math.max(window.innerWidth, window.innerHeight),
      height: Math.min(window.innerWidth, window.innerHeight),
      
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },

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

    onGameReady?.(game.current);

    return () => {
      game.current?.destroy(true);
    };
  }, [bumpkin, farmId, phaserApiRef, runType]);

  const ref = useRef<HTMLDivElement>(null);

  return (
    <div>
      <div id="game-content" ref={ref} />
    </div>
  );
};
