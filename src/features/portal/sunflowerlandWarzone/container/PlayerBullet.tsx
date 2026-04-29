import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { WarzoneScene } from "../WarzoneScene";
import { BulletOwner } from "../lib/type";

interface Props {
    x: number;
    y: number;
    scene: WarzoneScene;
}

export class PlayerBullet extends Phaser.Physics.Arcade.Sprite {
    private isDefeating = false;
    owner!: BulletOwner;

    constructor({ x, y, scene }: Props & { owner: BulletOwner }) {
        super(scene, x, y, scene.bulletSpriteKey);

        scene.add.existing(this);
        scene.physics.world.enable(this);

        this.setDepth(100000000000);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(this.width * 0.6, this.height * 0.6);
        body.setOffset(this.width * 0.2, this.height * 0.2);

        // spin effect
        scene.tweens.add({
            targets: this,
            angle: -360,
            duration: 500,
            repeat: -1,
        });

        // auto destroy after 3s
        // scene.time.delayedCall(3000, () => {
        //     if (!this.isDefeating)
        //         this.destroy();
        // });

        this.createOverlaps();
    }

    fire(angle: number, speed: number) {
        const body = this.body as Phaser.Physics.Arcade.Body;

        body.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
    }

    createOverlaps() {
        const scene = this.scene as WarzoneScene;
        const enemies = scene.enemyContainer;

        // Player hit enemies
        this.scene.physics.add.overlap(this, enemies.enemies, (bullet, enemy) => {
            if (this.isDefeating) return;
            this.isDefeating = true;

            // destroy the exact enemy that was hit
            scene.enemyContainer.destroyEnemy(enemy as BumpkinContainer);
            this.destroyBullet();
        });

        // Fence vs bullet
        this.scene.physics.add.collider(this, scene.fences, () => {
            if (this.isDefeating) return;
            this.isDefeating = true;
            this.destroyBullet();
        });

        // banner vs bullet
        this.scene.physics.add.collider(this, scene.banner, () => {
            if (this.isDefeating) return;
            this.isDefeating = true;

            scene.gameOver();
            this.destroyBullet();
            scene.banner.destroy();
        });

        // obstacle vs bullet
        this.handleObstacleVsBullet();
    }

    handleObstacleVsBullet() {
        const scene = this.scene as WarzoneScene;
        const isGoldPickaxe = scene.bulletSpriteKey === "gold_pickaxe";

        this.scene.physics.add.collider(
            this,
            scene.obstacleGroup,
            (bullet, obstacleSprite) => {
                if (this.isDefeating) return
                this.isDefeating = true;

                // Find matching obstacle data from scene
                const obstacle = scene.obstacles.find(
                    (o) => o.sprite === obstacleSprite,
                );

                if (obstacle) {
                    // non destructible → just destroy bullet
                    if (!obstacle || !obstacle.sprite) {
                        this.destroyBullet();
                        return;
                    }

                    if (obstacle.name === "woodFenceNoEdge") {
                        window.dispatchEvent(
                            new CustomEvent("sunflowerland-warzone-fence-warning", {
                                detail: { type: "woodFenceNoEdge" },
                            }),
                        );
                    }

                    // reduce hp
                    obstacle.hp = (obstacle.hp ?? 1) - 1;

                    if (isGoldPickaxe) {
                        obstacle.hp = 0; // insta destroy
                    }

                    // if (obstacle.hp === 2) {
                    //     obstacle.sprite.alpha = 0.8;
                    // } else if (obstacle.hp === 1) {
                    //   obstacle.sprite.alpha = 0.6;
                    // }

                    // optional hit feedback
                    this.scene.tweens.add({
                        targets: obstacle.sprite,
                        alpha: 0.6,
                        duration: 80,
                        yoyo: true,
                    });

                    // destroy obstacle if dead
                    if (obstacle.hp <= 0) {
                        obstacle.sprite.destroy();

                        scene.obstacles = scene.obstacles.filter((o) => o !== obstacle);
                    }
                }

                this.destroyBullet();
            },
            // bullet vs water check - if it's water, skip the collision
            (bullet, obstacleSprite) => {
                const obstacle = scene.obstacles.find(
                    (o) => o.sprite === obstacleSprite
                );
                return obstacle?.name !== "water";
            },
            this
        );
    }

    changeBullet() {
        this.setTexture("gold_pickaxe");
    }

    public destroyBullet() {
        if (!this.active) return;

        const scene = this.scene as any;

        this.isDefeating = true;

        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setVelocity(0, 0);
            body.enable = false;
        }

        scene.tweens.killTweensOf(this);

        this.destroy();
    }
}
