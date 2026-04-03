import { CHICKEN_RESCUE_CLIENT_ACTIONS } from "./chickenRescueClientActions";
import { resolveChickenRescuePortalActionIds } from "./chickenRescuePortalActionIds";

describe("resolveChickenRescuePortalActionIds", () => {
  it("keeps semantic keys when actions match Chicken Rescue shapes", () => {
    const ids = resolveChickenRescuePortalActionIds(
      CHICKEN_RESCUE_CLIENT_ACTIONS as Record<string, unknown>,
    );
    expect(ids).toEqual({
      startBasic: "START_GAME",
      gameOverBasic: "GAMEOVER",
      startAdvanced: "START_ADVANCED_GAME",
      gameOverAdvanced: "ADVANCED_GAMEOVER",
    });
  });

  it("resolves numeric editor keys by rule shape", () => {
    const { START_GAME, GAMEOVER, START_ADVANCED_GAME, ADVANCED_GAMEOVER, ...rest } =
      CHICKEN_RESCUE_CLIENT_ACTIONS;
    const remapped: Record<string, unknown> = { ...rest };
    remapped["101"] = START_GAME;
    remapped["102"] = GAMEOVER;
    remapped["201"] = START_ADVANCED_GAME;
    remapped["202"] = ADVANCED_GAMEOVER;

    const ids = resolveChickenRescuePortalActionIds(remapped);
    expect(ids).toEqual({
      startBasic: "101",
      gameOverBasic: "102",
      startAdvanced: "201",
      gameOverAdvanced: "202",
    });
  });
});
