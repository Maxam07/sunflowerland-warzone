import mapJson from "assets/map/warzone.json";
import { MachineInterpreter, SceneId } from "features/world/mmoMachine";
import { BaseScene, WALKING_SPEED } from "features/world/scenes/BaseScene";
import type { WarzonePhaserApiRef } from "./lib/warzonePhaserApi";
import { SUNNYSIDE } from "assets/sunnyside";
import {
  BoundingBox,
} from "./lib/collisionDetection";
import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { isTouchDevice } from "features/world/lib/device";
import { EnemyContainer } from "./container/EnemiesContainer";
import { MAP_LAYOUT } from "./WarzoneMaps";
import { HelpItems } from "./container/HelpItemsContainer";
import { EnemyType, ObstacleName } from "./lib/type";
import { HELP_ITEM, OBSTACLE_SIZE, INITIAL_ENEMY, ENEMY_SPAWN_POS } from "./WarzoneContants";
import { getRandomEnemy } from "./WarzoneContants";
import { SOUNDS } from "assets/sound-effects/soundEffects";

type Coordinates = { x: number; y: number };
const SQUARE_WIDTH = 16;

const GRID_SIZE = 16;

export type Direction = "left" | "right" | "up" | "down";

const FENCE_BOUNDS: BoundingBox = {
  x: 5,
  y: 21,
  height: 24,
  width: 30,
};

export class WarzoneScene extends BaseScene {
  sceneId: SceneId = "chicken_rescue";
  fences: Phaser.GameObjects.Rectangle[] = [];
  direction: Direction | undefined = undefined;
  facingDirection: Direction = "up";
  obstacleGroup!: Phaser.Physics.Arcade.StaticGroup;
  enemyGroup!: Phaser.Physics.Arcade.Group;
  enemyContainer!: EnemyContainer;
  playerBullets!: Phaser.Physics.Arcade.Group;
  enemyBullets!: Phaser.Physics.Arcade.Group;
  banner!: Phaser.Physics.Arcade.Sprite;
  helpItemContainer!: HelpItems;
  enemyBossContainer!: EnemyContainer;
  bulletSpriteKey: string = "axe";
  helpItemTimer?: Phaser.Time.TimerEvent;
  waterGroup!: Phaser.Physics.Arcade.StaticGroup;
  enemyCount: number = INITIAL_ENEMY;
  usedSpawnIndexes: Set<number> = new Set(); 
  queuedDirection: Direction | undefined = undefined;

  pivots: { x: number; y: number; direction: Direction }[] = [];

  nextMove:
    | {
        direction: Direction;
        moveAt: Coordinates;
      }
    | undefined = undefined;

  obstacles: BoundingBox[] = [];

  constructor() {
    super({
      name: "chicken_rescue",
      map: { json: mapJson },
      audio: { fx: { walk_key: "dirt_footstep" } },
    });
  }

  public get phaserApiRef() {
    return this.registry.get("phaserApiRef") as
      | WarzonePhaserApiRef
      | undefined;
  }

  public get portalService() {
    return this.registry.get("portalService") as MachineInterpreter | undefined;
  }

  preload() {
    super.preload();

    // load swipe controls for touch devices
    if (isTouchDevice()) {
      this.load.plugin(
        "rexvirtualjoystickplugin",
        "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js",
        true,
      );
    }

    this.load.audio("game_over", SOUNDS.notifications.maze_over);
    // this.load.audio("chicken_1", SOUNDS.resources.chicken_1);
    // this.load.audio("chicken_2", SOUNDS.resources.chicken_2);

    this.load.image("pot_plant", "src/assets/obstacles/pot_plant.png");
    this.load.image("chest", "src/assets/obstacles/wooden_chest.png")
    this.load.image("sunflorians_banner", "src/assets/banner/sunflorians_banner.webp");
    this.load.image("goblins_banner", "src/assets/banner/goblins_banner.webp");
    this.load.image("nightshades_banner", "src/assets/banner/nightshades_banner.webp");
    this.load.image("bumpkins_banner", "src/assets/banner/bumpkins_banner.webp");    
    this.load.image("clash_of_factions_banner", "src/assets/banner/clash_of_factions_banner.webp")
    this.load.image("warzone_axe", "src/assets/icons/warzone_axe.webp");
    this.load.image("wild_mushroom", "src/assets/icons/timer_icon.png");
    // SUNNYSIDE assets
    this.load.image("water", SUNNYSIDE.decorations.ocean);
    this.load.image("bush", SUNNYSIDE.decorations.bush);
    this.load.image("woodFenceNoEdge", SUNNYSIDE.decorations.woodFenceNoEdge);
    this.load.image("rock", SUNNYSIDE.resource.stone_rock);
    this.load.image("boulder", SUNNYSIDE.resource.boulder);
    this.load.image("axe", SUNNYSIDE.tools.axe);
    this.load.image("magic_mushroom", SUNNYSIDE.resource.magic_mushroom);
    this.load.image("pirate_bounty", SUNNYSIDE.resource.pirate_bounty);
    this.load.image("iron_pickaxe", SUNNYSIDE.tools.iron_pickaxe);
    this.load.image("tree", SUNNYSIDE.resource.tree);
    this.load.image("cloud", SUNNYSIDE.land.cloud1);
    this.load.image("cloud1", SUNNYSIDE.land.cloud2);
    this.load.image("gold_pickaxe", SUNNYSIDE.tools.gold_pickaxe);

    // Ambience SFX
    if (!this.sound.get("nature_1")) {
      const nature1 = this.sound.add("nature_1");
      nature1.play({ loop: true, volume: 0.01 });
    }

    // Shut down the sound when the scene changes
    this.events.once("shutdown", () => {
      this.sound.getAllPlaying().forEach((sound) => {
        sound?.destroy();
      });
    });
  }

  private shootDirection() {
    if (!this.cursorKeys || this.currentPlayer?.isHurting) return;

    const direction = this.queuedDirection ?? this.facingDirection;

    const shootKey = this.cursorKeys.e!;

    if (this.cursorKeys.left.isDown || this.cursorKeys.a?.isDown) {
      this.facingDirection = "left";
    }

    if (this.cursorKeys.right.isDown || this.cursorKeys.d?.isDown) {
      this.facingDirection = "right";
    }

    if (this.cursorKeys.up.isDown || this.cursorKeys.w?.isDown) {
      this.facingDirection = "up";
    }

    if (this.cursorKeys.down.isDown || this.cursorKeys.s?.isDown) {
      this.facingDirection = "down";
    }

    if (Phaser.Input.Keyboard.JustDown(shootKey)) {
      this.currentPlayer!.facingDirection = this.facingDirection;
      this.currentPlayer?.shoot(direction);
    }

    // const swimKey = this.cursorKeys.q!;
    // if (Phaser.Input.Keyboard.JustDown(swimKey)) {
    //   this.currentPlayer?.run();
    // }
  }

  setupMobileControls() {
    if (!isTouchDevice()) return;

    const joystickPlugin = this.plugins.get(
      "rexVirtualJoystick"
    ) as any;

    // Create visible joystick
    const joystick = joystickPlugin.add(this, {
      x: 100,
      y: this.scale.height - 120,

      radius: 40,

      base: this.add.circle(0, 0, 50, 0x888888, 0.4),
      thumb: this.add.circle(0, 0, 25, 0xffffff, 0.6),

      dir: "4dir",
    });

    // SHOOT BUTTON
    const shootButton = this.add
      .image(
        this.scale.width - 120,
        this.scale.height - 120,
        "warzone_axe"
      )
      .setScrollFactor(0)
      .setDepth(1000)
      .setInteractive();

    shootButton.setScale(2.5);
    const normalScale = shootButton.scale;
    const pressedScale = normalScale * 0.9;

    const cursorKeys = joystick.createCursorKeys();

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return;

      const force = joystick.force;

      if (force > 0.2) {
        if (cursorKeys.left.isDown) this.queuedDirection = "left";
        if (cursorKeys.right.isDown) this.queuedDirection = "right";
        if (cursorKeys.up.isDown) this.queuedDirection = "up";
        if (cursorKeys.down.isDown) this.queuedDirection = "down";
      }
    });

    // SHOOT LOGIC
    shootButton.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation(); // prevents accidental joystick interference

      shootButton.setTint(0xaaaaaa);
      shootButton.setScale(pressedScale);
      this.currentPlayer?.shoot(this.queuedDirection || this.facingDirection);
    });

    const resetShootButton = () => {
      shootButton.clearTint();
      shootButton.setScale(normalScale);
    };

    shootButton.on("pointerup", resetShootButton);
    shootButton.on("pointerout", resetShootButton);

    this.input.on("pointerup", () => {
      joystick.reset();
    });
  }

  async create() {
    this.map = this.make.tilemap({
      key: "chicken_rescue",
    });

    super.create();

    this.setupMobileControls();

    this.currentPlayer?.setPosition(
      GRID_SIZE * 20 + GRID_SIZE / 2,
      GRID_SIZE * 20 + GRID_SIZE / 2,
    );

    // Reset all scene data
    this.pivots = [];
    this.direction = undefined;
    this.queuedDirection = undefined;
    this.nextMove = undefined;
    this.isDead = false;

    // Create initial objects
    this.obstacleGroup = this.physics.add.staticGroup();
    this.playerBullets = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();
    this.enemyGroup = this.physics.add.group();
    this.waterGroup = this.physics.add.staticGroup();

    this.physics.add.collider(this.enemyGroup, this.helpItemContainer)
    // enemies vs obstacles
    this.physics.add.collider(this.enemyGroup, this.obstacleGroup);
    // enemies vs enemies (stops stacking)
    this.physics.add.collider(this.enemyGroup, this.enemyGroup);
    // player vs enemies (stops stacking)
    this.physics.add.overlap(this.enemyGroup, this.currentPlayer as Phaser.GameObjects.GameObject)
    // bullet vs bullet
    this.handleBulletVsBullet();
    // world bounds
    this.physics.world.setBoundsCollision(true, true, true, true);

    MAP_LAYOUT.layout2.forEach((o) => this.addStaticObstacle(o));

    const factionName: EnemyType = this.gameState.faction?.name ?? "clash_of_factions";

    this.banner = this.physics.add.sprite(
      GRID_SIZE * 20,
      GRID_SIZE * 24,
      `${factionName}_banner`
    );
    this.banner.setImmovable(true);

    this.createEnemyContainer();

    const fenceGap = GRID_SIZE * 3;

    // Fences
    const leftFence = this.add.rectangle(
      GRID_SIZE * FENCE_BOUNDS.x - GRID_SIZE / 2,
      GRID_SIZE * 13, // GRID_SIZE * (FENCE_BOUNDS.y - FENCE_BOUNDS.height),
      GRID_SIZE / 2,
      GRID_SIZE * FENCE_BOUNDS.height,
      0x000000,
      0,
    );

    const rightFence = this.add.rectangle(
      GRID_SIZE * (FENCE_BOUNDS.x + FENCE_BOUNDS.width) + GRID_SIZE / 2,
      GRID_SIZE * 13, // GRID_SIZE * (FENCE_BOUNDS.y - FENCE_BOUNDS.height),
      GRID_SIZE / 2,
      GRID_SIZE * FENCE_BOUNDS.height,
      0x000000,
      0,
    );

    const bottomFence = this.add.rectangle(
      GRID_SIZE * 20,
      GRID_SIZE * 26 - GRID_SIZE / 2, // GRID_SIZE * (FENCE_BOUNDS.y - FENCE_BOUNDS.height),
      GRID_SIZE * FENCE_BOUNDS.width,
      GRID_SIZE / 2,
      0x000000,
      0,
    );

    const topFence = this.add.rectangle(
      GRID_SIZE * 20,
      GRID_SIZE * 1 - GRID_SIZE / 2, // GRID_SIZE * (FENCE_BOUNDS.y - FENCE_BOUNDS.height),
      GRID_SIZE * FENCE_BOUNDS.width,
      GRID_SIZE / 2,
      0x000000,
      0,
    );

     // Safety Fence
    const leftSafetyFence = this.add.rectangle(
      GRID_SIZE * FENCE_BOUNDS.x - GRID_SIZE / 2 - fenceGap,
      GRID_SIZE * 13, // GRID_SIZE * (FENCE_BOUNDS.y - FENCE_BOUNDS.height),
      GRID_SIZE / 3,
      GRID_SIZE * FENCE_BOUNDS.height,
      0x000000,
      0,
    );

    const rightSafetyFence = this.add.rectangle(
      GRID_SIZE * (FENCE_BOUNDS.x + FENCE_BOUNDS.width) + GRID_SIZE / 2 + fenceGap,
      GRID_SIZE * 13, // GRID_SIZE * (FENCE_BOUNDS.y - FENCE_BOUNDS.height),
      GRID_SIZE / 2,
      GRID_SIZE * FENCE_BOUNDS.height,
      0x000000,
      0,
    );

    const topSafetyFence = this.add.rectangle(
      GRID_SIZE * 20,
      GRID_SIZE * 1 - GRID_SIZE / 2 - fenceGap, // GRID_SIZE * (FENCE_BOUNDS.y - FENCE_BOUNDS.height),
      GRID_SIZE * FENCE_BOUNDS.width,
      GRID_SIZE / 2,
      0x000000,
      0,
    );

    const bottomSafetyFence = this.add.rectangle(
      GRID_SIZE * 20,
      GRID_SIZE * 26 - GRID_SIZE / 2 + fenceGap, // GRID_SIZE * (FENCE_BOUNDS.y - FENCE_BOUNDS.height),
      GRID_SIZE * FENCE_BOUNDS.width,
      GRID_SIZE / 2,
      0x000000,
      0,
    );

    this.physics.world.enable(leftFence);
    this.physics.world.enable(rightFence);
    this.physics.world.enable(bottomFence);
    this.physics.world.enable(topFence);
    this.physics.world.enable(leftSafetyFence);
    this.physics.world.enable(rightSafetyFence);
    this.physics.world.enable(bottomSafetyFence);
    this.physics.world.enable(topSafetyFence);

    const fences = [
      leftFence,
      rightFence,
      bottomFence,
      topFence,
      leftSafetyFence,
      rightSafetyFence,
      bottomSafetyFence,
      topSafetyFence,
    ];

    fences.forEach((fence) => {
      this.physics.add.existing(fence, true);
    });
    this.fences = fences;

    this.physics.add.collider(this.currentPlayer as Phaser.GameObjects.GameObject, this.fences);

    [leftFence, rightFence, bottomFence, topFence, leftSafetyFence, rightSafetyFence, bottomSafetyFence, topSafetyFence].forEach((fence: any) => { fence.body.setImmovable(true); fence.body.setAllowGravity(false); });

    this.physics.world.drawDebug = false;

    // const box = this.add.rectangle(0, 0, 16, 16, 0xffffff, 0.4);
    // this.currentPlayer?.add(box);

    if (this.physics.world.drawDebug) {
      // Draw coordinates at each grid position
      for (let x = 0; x < this.map.widthInPixels; x += GRID_SIZE) {
        for (let y = 0; y < this.map.heightInPixels; y += GRID_SIZE) {
          const name = this.add.bitmapText(
            x,
            y,
            "Teeny Tiny Pixls",
            `${x / GRID_SIZE},${y / GRID_SIZE}`,
            7,
          );
          name.setScale(0.5);
          name.setDepth(10000000000000)
        }
      }
    }

    const onRetry = () => {
      this.scene.restart();
    };

    this.game.events.on("chicken-rescue-v2-retry", onRetry);

    this.events.on("shutdown", () => {
      this.game.events.off("chicken-rescue-v2-retry", onRetry);
    });
  }

  getOccupiedSet() {
    const BLOCKING: ObstacleName[] = [
      "rock",
      "tree",
      "woodFenceNoEdge",
      "chest",
      "water",
      "cloud",
      "cloud1",
      "pot_plant",
    ];

    const occupied = new Set<string>();

    MAP_LAYOUT.layout1.forEach((o) => {
      if (!BLOCKING.includes(o.name)) return;

      const size = OBSTACLE_SIZE[o.name];
      if (!size) return;

      const startX = o.x - (size.width - 1);
      const startY = o.y - (size.height - 1);

      for (let dx = 0; dx < size.width; dx++) {
        for (let dy = 0; dy < size.height; dy++) {
          occupied.add(`${startX + dx},${startY + dy}`);
        }
      }
    });

    return occupied;
  }

  getRandomFreeTile() {
    const MIN_X = 5;
    const MAX_X = 34;
    const MIN_Y = 1;
    const MAX_Y = 24;

    const occupied = this.getOccupiedSet();

    const freeTiles: { x: number; y: number }[] = [];

    for (let x = MIN_X; x <= MAX_X; x++) {
      for (let y = MIN_Y; y <= MAX_Y; y++) {
        if (!occupied.has(`${x},${y}`)) {
          freeTiles.push({ x, y });
        }
      }
    }

    return Phaser.Utils.Array.GetRandom(freeTiles);
  }

  createEnemyContainer() {
    const getNextSpawn = () => {
      for (let i = 0; i < ENEMY_SPAWN_POS.length; i++) {
        if (!this.usedSpawnIndexes.has(i)) {
          this.usedSpawnIndexes.add(i);
          return ENEMY_SPAWN_POS[i];
        }
      }
      return null;
    };

  const spawn = getNextSpawn();
    if(!spawn) return;

    this.enemyContainer = new EnemyContainer({
      x: spawn.x,
      y: spawn.y,
      scene: this,
    })
    this.add.existing(this.enemyContainer);
    this.enemyGroup.add(this.enemyContainer);
  }
  
  createHelpItemContainer() {
    const tile = this.getRandomFreeTile();
    const randomItem = Phaser.Utils.Array.GetRandom(HELP_ITEM)

    const helpItem = new HelpItems({
      x: tile.x * SQUARE_WIDTH + SQUARE_WIDTH / 2,
      y: tile.y * SQUARE_WIDTH + SQUARE_WIDTH / 2,
      scene: this,
      itemKey: randomItem,
    });
    this.add.existing(helpItem);

    this.helpItemTimer = this.time.addEvent({
      delay: 20000,
      loop: true,
      callback: () => {
        const newTile = this.getRandomFreeTile();
        const newItemKey = Phaser.Utils.Array.GetRandom(HELP_ITEM)

        helpItem.setPosition(
          newTile.x * SQUARE_WIDTH + SQUARE_WIDTH / 2,
          newTile.y * SQUARE_WIDTH + SQUARE_WIDTH / 2
        );
         helpItem.setItem(newItemKey);
      },
    });
  }

  handleBulletVsBullet() {
    this.physics.add.collider(
      this.playerBullets,
      this.enemyBullets,
      (obj1, obj2) => {
        const bulletA = obj1 as Phaser.GameObjects.GameObject;
        const bulletB = obj2 as Phaser.GameObjects.GameObject;

        // prevent double execution issues
        this.physics.world.disable(bulletA);
        this.physics.world.disable(bulletB);

        bulletA.destroy();
        bulletB.destroy();
      },
      undefined,
      this
    );
  }

addStaticObstacle({
  name,
  x,
  y,
}: {
  name:
    | "rock"
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
  x?: number;
  y?: number;
}) {
  const obstacleConfig = {
    rock: { width: 1, height: 1, destructible: true, hp: Infinity, hasHitbox: true },
    boulder: { width: 2, height: 2, destructible: true, hp: Infinity, hasHitbox: true },
    fox_box: { width: 2, height: 2, destructible: true, hp: Infinity, hasHitbox: true },
    pot_plant: { width: 2, height: 2, destructible: true, hp: 2, hasHitbox: true },
    chest: { width: 1, height: 1, destructible: true, hp: 3, hasHitbox: true },
    water: { width: 4, height: 4, destructible: false, hp: Infinity, hasHitbox: true }, // ❗ no hitbox
    bush: { width: 1, height: 1, destructible: true, hp: Infinity, hasHitbox: false },
    woodFenceNoEdge: { width: 1, height: 1, destructible: true, hp: 3, hasHitbox: true },
    tree: { width: 2, height: 2, destructible: true, hp: 3, hasHitbox: true },
    cloud: { width: 4, height: 3, destructible: true, hp: Infinity, hasHitbox: false },
    cloud1: { width: 2, height: 2, destructible: true, hp: Infinity, hasHitbox: false },
  }[name];

  const { width, height, destructible, hp, hasHitbox } = obstacleConfig;

  let coordinates = { x: x ?? 0, y: y ?? 0 };

  // Adjust for even-sized objects
  if (width === 2) {
    coordinates.x += 1;
  }

  let worldX = coordinates.x * SQUARE_WIDTH;
  let worldY = coordinates.y * SQUARE_WIDTH;

  // Centering
  if (width % 2 === 1) {
    worldX += SQUARE_WIDTH / 2;
  }
  if (height % 2 === 1) {
    worldY += SQUARE_WIDTH / 2;
  }

  const obstacle = this.add.sprite(worldX, worldY, name);
  obstacle.setDepth(10000000000);
  obstacle.setName(name);
  // Add physics body (static)
  this.physics.add.existing(obstacle, true);

  const body = obstacle.body as Phaser.Physics.Arcade.StaticBody;
  body.setSize(width * SQUARE_WIDTH, height * SQUARE_WIDTH);

// WATER → overlap (no blocking)
//    if (name === "water") {
//   this.waterGroup = this.waterGroup || this.physics.add.staticGroup();
//   this.waterGroup.add(obstacle);

//   this.physics.add.overlap(
//     this.currentPlayer as Phaser.GameObjects.GameObject,
//     obstacle,
//     () => {
//       const player = this.currentPlayer;
//       if (!player) return;

//       if (!player.isSwimming) {
//         player.isSwimming = true;
//         player.swim();
//       }
//     }
//   );
//     obstacle.setDepth(100);
// }

// SOLID OBJECTS → collider (blocking)
  if (hasHitbox) {
  this.obstacleGroup.add(obstacle);

    this.physics.add.collider(
      this.currentPlayer as Phaser.GameObjects.GameObject,
      obstacle
    );
  }

  const noHitbox = ["cloud", "cloud1", "bush"];
  if (noHitbox.includes(name)) {
    obstacle.setDepth(1000000000000);
    obstacle.alpha = 0.8;
  }

  // store obstacle
  this.obstacles.push({
    x: coordinates.x,
    y: coordinates.y,
    width,
    height,
    sprite: obstacle,
    destructible,
    hp,
    name,
    hasHitbox,
  });
}

  updateWaterMovement() {
    const player = this.currentPlayer;
    if (!player || !this.waterGroup) return;

    const isInWater = this.physics.overlap(player, this.waterGroup);

    if (!isInWater && player.isSwimming) {
      player.isSwimming = false;
      if (player.isRunning) {
        player.run();   
      } else {
        player.walk();
      }
    }
  }

  private isDead = false;

  async gameOver() {
    if (this.isDead) return;

    this.isDead = true;

    (this.currentPlayer?.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);

    this.currentPlayer?.disappear();

    const sfx = this.sound.add("game_over");
    sfx.play({ loop: false, volume: 0.15 });

    this.walkAudioController?.handleWalkSound(false);

    await new Promise((res) => setTimeout(res, 1000));

    this.phaserApiRef?.current.onGameOver();

    // this.walkingSpeed = this.isAdvancedRun ? WALKING_SPEED * 2 : WALKING_SPEED;
  }

  updateDirection() {
    let newDirection: "left" | "right" | "up" | "down" | undefined =
      this.queuedDirection;

    if (document.activeElement?.tagName === "INPUT") return;

    if (this.cursorKeys?.left.isDown || this.cursorKeys?.a?.isDown) {
      newDirection = "left";
    }

    if (this.cursorKeys?.right.isDown || this.cursorKeys?.d?.isDown) {
      newDirection = "right";
    }

    if (this.cursorKeys?.up.isDown || this.cursorKeys?.w?.isDown) {
      newDirection = "up";
    }

    if (this.cursorKeys?.down.isDown || this.cursorKeys?.s?.isDown) {
      newDirection = "down";
    }

    if (!newDirection) return;

      // this.currentPlayer?.walk();

    if (!this.direction && newDirection) {
      this.start();
    }

    const currentDirection = this.direction;

    this.direction = newDirection;

    const player = this.currentPlayer as Coordinates;

    const direction = this.direction;

    let yVelocity = 0;
    if (direction === "up") {
      yVelocity = -this.walkingSpeed;
    }

    if (direction === "down") {
      yVelocity = this.walkingSpeed;
    }

    let xVelocity = 0;
    if (direction === "left") {
      xVelocity = -this.walkingSpeed;

      this.currentPlayer?.faceLeft();
    }

    if (direction === "right") {
      xVelocity = this.walkingSpeed;
      this.currentPlayer?.faceRight();
    }

    (this.currentPlayer?.body as Phaser.Physics.Arcade.Body).setVelocity(
      xVelocity,
      yVelocity,
    );

    this.pivots = [
      {
        // TODO get grid spot?
        x: player.x,
        y: player.y,
        direction: currentDirection as Direction,
      },
      ...this.pivots,
    ];

    this.direction = direction;

    this.nextMove = undefined;
    this.queuedDirection = undefined;
  }

  get score() {
    return this.phaserApiRef?.current.getScore() ?? 0;
  }

  start() {
    this.walkAudioController?.handleWalkSound(true);

    const body = this.currentPlayer?.body as Phaser.Physics.Arcade.Body;
    body.setSize(10, 10); // Adjust the size as necessary
    body.setOffset(3, 3); // Adjust the offset as necessary

    this.currentPlayer?.walk();

    for (let i = 0; i < this.enemyCount; i++) {
      this.enemyContainer.createEnemy(getRandomEnemy());
    }

    this.time.delayedCall(2000, () => this.createHelpItemContainer());
  }

  movePlayer() {
    const player = this.currentPlayer as Coordinates;
    const currentDirection = this.direction ?? "up";

    const direction = this.direction;

    if (direction === currentDirection) return;

    let yVelocity = 0;
    if (direction === "up") {
      yVelocity = -this.walkingSpeed;
    }

    if (direction === "down") {
      yVelocity = this.walkingSpeed;
    }

    let xVelocity = 0;
    if (direction === "left") {
      xVelocity = -this.walkingSpeed;

      this.currentPlayer?.faceLeft();
    }

    if (direction === "right") {
      xVelocity = this.walkingSpeed;
      this.currentPlayer?.faceRight();
    }

    (this.currentPlayer?.body as Phaser.Physics.Arcade.Body).setVelocity(
      xVelocity,
      yVelocity,
    );

    this.pivots = [
      {
        x: Math.floor(player.x / 16),
        y: this.currentPlayer?.y ?? 0,
        direction: currentDirection,
      },
      ...this.pivots,
    ];

    this.direction = direction;

    this.nextMove = undefined;
  }

  calculatePosition(
    currentPosition: Coordinates,
    targetPosition: Coordinates,
    speed: number,
  ) {
    // Calculate direction vector from current position to target position
    const directionX = targetPosition.x - currentPosition.x;
    const directionY = targetPosition.y - currentPosition.y;

    // Calculate distance between current position and target position
    const distance = Math.sqrt(
      directionX * directionX + directionY * directionY,
    );

    // Calculate normalized direction vector
    const normalizedDirectionX = directionX / distance;
    const normalizedDirectionY = directionY / distance;

    // Calculate new speed based on linear motion
    const newSpeedX = normalizedDirectionX * speed;
    const newSpeedY = normalizedDirectionY * speed;

    return { x: newSpeedX, y: newSpeedY };
  }

  update() {
    this.debug();

    if (this.isDead) return;
    this.enemyContainer?.update();
    this.updateWaterMovement();
    this.updateDirection();
    this.shootDirection();
    this.currentPlayer?.setDepth(1000000000);
  }

  debug() {
    // Draw the pivots
    // this.pivots.forEach((pivot) => {
    //   this.add.circle(pivot.x, pivot.y, 2, 0xff0000);
    // });
    // Clear points
  }
}
