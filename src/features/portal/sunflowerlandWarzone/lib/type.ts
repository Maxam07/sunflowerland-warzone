
export type EnemyType = "goblins" | "sunflorians" | "bumpkins" | "nightshades";
export type HelpItemType = "wild_mushroom" | "magic_mushroom" | "pirate_bounty";
export type BulletOwner = "player" | "enemy";

export type ObstacleName =
    "rock"
    | "boulder"
    | "fox_box"
    | "pot_plant"
    | "chest"
    | "water"
    | "bush"
    | "woodFenceNoEdge"
    | "tree"
    | "cloud"
    | "cloud1";

export type Obstacle = { name: ObstacleName; x: number; y: number };
