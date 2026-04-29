import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { WarzoneScene } from "../WarzoneScene";
import { Direction } from "../WarzoneScene";
import { SQUARE_WIDTH } from "features/game/lib/constants";
import { EnemyBullet } from "./EnemyBullet";
import { EnemyType } from "../lib/type";
import { ADDITIONAL_ENEMY, ENEMIES, KILLS_PER_WAVE } from "../WarzoneContants";
import { getRandomEnemy, baseEnemyClothing } from "../WarzoneContants";

interface Props {
    x: number,
    y: number,
    scene: WarzoneScene,
    player?: BumpkinContainer;
};

export class EnemyContainer extends Phaser.GameObjects.Container {
    scene: WarzoneScene;
    enemies: BumpkinContainer[] = [];
    facingDirection: Direction = "down";
    player?: BumpkinContainer;
    canUpdate: boolean = true;
    totalKills = 0;
    wave = 1;
    killsInWave = 0;

    constructor({ x, y, scene, player }: Props) {
        super(scene, x, y);
        this.scene = scene;
        this.player = player;

        scene.physics.world.enable(this);
    }

    createEnemy(enemyType: EnemyType) {
        // if (this.enemies.length >=this.scene.enemyWaveSize) return;

        const gridX = Phaser.Math.Between(5, 34);
        const gridY = 1;

        const x = gridX * SQUARE_WIDTH + SQUARE_WIDTH / 2;
        const y = gridY * SQUARE_WIDTH + SQUARE_WIDTH / 2;

        const factionName: EnemyType = this.scene.gameState.faction?.name ?? "clash_of_factions";
        const randomEnemyType =
            ENEMIES.filter(type => type !== factionName)[
            Math.floor(Math.random() * (ENEMIES.length - 1))
        ];

        const clothingMap = baseEnemyClothing();
        
        const enemy = new BumpkinContainer({
            clothing: clothingMap[randomEnemyType],
            scene: this.scene,
            x,
            y,
        });

        // 👇 initialize state HERE
        (enemy as any).bullet = null;
        (enemy as any).nextShootTime = 0;

        this.scene.add.existing(enemy);
        this.scene.physics.add.existing(enemy);
        enemy.setDepth(10000000)

        const body = enemy.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        (enemy.body as Phaser.Physics.Arcade.Body)
            .setSize(16, 16)
            .setOffset(0, 0)
            .setImmovable(false)
            // .setCollideWorldBounds(true);

        this.enemies.push(enemy);

        (enemy as any).direction = this.getRandomDirection();
        (enemy as any).lastShootTime = 0;
        

        // enemy to player
        this.scene.physics.add.collider(
            enemy,
            this.scene.currentPlayer as Phaser.GameObjects.GameObject,
            (enemyObj) => {
                this.handleEnemyCollision(enemyObj as BumpkinContainer);
                (enemy as any).direction = this.getRandomDirection();
            }
        );

        // enemy to banner
        this.scene.physics.add.collider(
            enemy,
            this.scene.banner,
            (enemyObj) => {
                this.handleEnemyCollision(enemyObj as BumpkinContainer);
                (enemy as any).direction = this.getRandomDirection();
            }
        );

        // enemy to enemy
        this.scene.physics.add.collider(
            enemy,
            this.enemies,
            (e1, e2) => {
                this.handleEnemyCollision(e1 as BumpkinContainer);
                this.handleEnemyCollision(e2 as BumpkinContainer);
                (enemy as any).direction = this.getRandomDirection();
            }
        );

        // enemy to obstacles
        this.scene.physics.add.collider(
            enemy,
            this.scene.obstacleGroup,
            (enemyObj) => {
                this.handleEnemyCollision(enemyObj as BumpkinContainer);
                (enemy as any).direction = this.getRandomDirection();
            }
        );

        // enemy to fences
        this.scene.physics.add.collider(
            enemy,
            this.scene.fences,
            (enemyObj) => {
                this.handleEnemyCollision(enemyObj as BumpkinContainer);
                (enemy as any).direction = this.getRandomDirection();

            }
        );
    }

    getRandomDirection(): Direction {
        const dirs: Direction[] = ["up", "down", "left", "right"];
        return Phaser.Utils.Array.GetRandom(dirs);
    }

    moveEnemy(enemy: BumpkinContainer) {
        const speed = 30;
        const body = enemy.body as Phaser.Physics.Arcade.Body;

        const direction = enemy.direction;

        let xVelocity = 0;
        let yVelocity = 0;

        if (direction === "left") {
            xVelocity = -speed;
            enemy.faceLeft?.();
        }

        if (direction === "right") {
            xVelocity = speed;
            enemy.faceRight?.();
        }

        if (direction === "up") {
            yVelocity = -speed;
        }

        if (direction === "down") {
            yVelocity = speed;
        }

        body.setVelocity(xVelocity, yVelocity);
    }

    handleEnemyCollision = (enemy: BumpkinContainer) => {
        const body = enemy.body as Phaser.Physics.Arcade.Body;

        body.setVelocity(0, 0);

        let newDir: Direction;
        do {
            newDir = this.getRandomDirection();
        } while (newDir === (enemy as any).direction);

        (enemy as any).direction = newDir;

        // unlock AFTER small delay
        this.scene.time.delayedCall(100, () => {
            (enemy as any).canMove = true;
        });
    };

    destroyEnemy(enemy: BumpkinContainer) {
        if ((enemy as any).isDead) return;
        (enemy as any).isDead = true;
        this.enemies = this.enemies.filter((g) => g !== enemy);

        const poof = this.scene.add
            .sprite(enemy.x, enemy.y, "smoke")
            .setOrigin(0.5)
            .setDepth(9999);

        this.scene.anims.create({
            key: `smoke_anim`,
            frames: this.scene.anims.generateFrameNumbers("smoke", {
                start: 0,
                end: 8,
            }),
            repeat: 0,
            frameRate: 10,
        });

        poof.play("smoke_anim");

        poof.on("animationcomplete", () => {
            poof.destroy();
        });

        enemy.destroy();

        
        window.dispatchEvent(
            new CustomEvent("warzone-enemy-destroyed", {
                detail: { count: 1 },
            })
        )
        
        this.totalKills += 1;
        this.killsInWave += 1;

        if (this.killsInWave >= KILLS_PER_WAVE) {
            this.wave += 1;
            this.killsInWave = 0;

            this.scene.enemyCount += ADDITIONAL_ENEMY;

            const missing =
                this.scene.enemyCount - this.scene.enemyContainer.enemies.length;

            for (let i = 0; i < missing; i++) {
                this.scene.enemyContainer.createEnemy(getRandomEnemy());
            }
        }
        
        this.scene.phaserApiRef?.current.onEnemyKilled(1);

        // this.scene.time.delayedCall(1000, () => {
        //     this.createEnemy(getRandomEnemy());
        // });
    }

    public shoot(enemy: BumpkinContainer) {
        if (!enemy.active) return;
        const scene = this.scene as WarzoneScene;

        const now = this.scene.time.now;

        // still has active bullet → cannot shoot again
        if ((enemy as any).bullet && (enemy as any).bullet.active) return;

        // cooldown not finished
        if (now < (enemy as any).nextShootTime) return;

        // set next allowed shoot time
        (enemy as any).nextShootTime = now + 2000;
        let angle = 0;

        switch ((enemy as any).direction) {
            case "left":
                angle = Math.PI;
                break;
            case "right":
                angle = 0;
                break;
            case "up":
                angle = -Math.PI / 2;
                break;
            case "down":
                angle = Math.PI / 2;
                break;
        }

        const offset = 16;
        const spawnX = enemy.x + Math.cos(angle) * offset;
        const spawnY = enemy.y + Math.sin(angle) * offset;

        const bullet = new EnemyBullet({
            x: spawnX,
            y: spawnY,
            scene: this.scene as any,
            angle,
            speed: 200,
            owner: "enemy"
        });

        scene.enemyBullets.add(bullet);    

        // store bullet reference
        (enemy as any).bullet = bullet;
        // scene.enemyBullets.add(bullet);

        // listen for destruction
        bullet.once("destroy", () => {
            (enemy as any).bullet = null;
        });
    }

    update() {
         if (!this.canUpdate) return;
        this.enemies.forEach((enemy) => {
            this.moveEnemy(enemy);
            this.shoot(enemy);
            enemy.walk();
        });
    }
}