import { ObstacleName, EnemyType, HelpItemType } from "./lib/type";
import { BumpkinContainer } from "features/world/containers/BumpkinContainer";

export const OBSTACLE_SIZE: Record<ObstacleName, { width: number; height: number }> = {
  rock: { width: 1, height: 1 },
  boulder: { width: 2, height: 2 },
  fox_box: { width: 2, height: 2 },
  pot_plant: { width: 2, height: 2 },
  chest: { width: 1, height: 1 },
  water: { width: 4, height: 4 },
  bush: { width: 1, height: 1 },
  woodFenceNoEdge: { width: 1, height: 1 },
  tree: { width: 2, height: 2 },
  cloud: { width: 4, height: 3 },
  cloud1: { width: 2, height: 2 },
};

export const ENEMIES: EnemyType[] = [
  "goblins",
  "sunflorians",
  "bumpkins",
  "nightshades",
];

export const HELP_ITEM: HelpItemType[] = ["wild_mushroom", "magic_mushroom", "pirate_bounty"];

export const getRandomEnemy = (): EnemyType => {
  const index = Math.floor(Math.random() * ENEMIES.length);
  return ENEMIES[index];
};

export const baseEnemyClothing = (): Record<EnemyType, BumpkinContainer["clothing"]> => {
  return {
    goblins: {
      body: "Goblin Potion",
      shirt: "Red Farmer Shirt",
      pants: "Farmer Overalls",
      shoes: "Black Farmer Boots",
      hat: "Goblin Helmet",
      updatedAt: 0,
    },
    sunflorians: {
      body: "Beige Farmer Potion",
      hair: "Basic Hair",
      wings: "Sunflorian Quiver",
      shirt: "Sunflorian Armor",
      pants: "Sunflorian Pants",
      shoes: "Sunflorian Sabatons",
      hat: "Sunflorian Helmet",
      updatedAt: 0,
    },
    bumpkins: {
      body: "Light Brown Farmer Potion",
      hair: "Blacksmith Hair",
      wings: "Bumpkin Quiver",
      shirt: "Bumpkin Armor",
      pants: "Bumpkin Pants",
      shoes: "Bumpkin Sabatons",
      hat: "Bumpkin Helmet",
      updatedAt: 0,
    },
    nightshades: {
      body: "Elf Potion",
      hair: "Brush Back Hair",
      wings: "Nightshade Quiver",
      shirt: "Nightshade Armor",
      pants: "Nightshade Pants",
      shoes: "Nightshade Sabatons",
      hat: "Nightshade Helmet",
      updatedAt: 0,
    },
  } as const;
};

export const INITIAL_ENEMY = 6;
export const KILLS_PER_WAVE = 3;
export const ADDITIONAL_ENEMY = 1;
export const NEXT_HELP_ITEM = 90000;

export const ENEMY_SPAWN_POS: { x: number, y: number}[] = []

for (let x = 5; x <= 34; x += 2) {
  ENEMY_SPAWN_POS.push({ x, y: 1})
}
