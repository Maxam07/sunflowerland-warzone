import { WarzoneScene } from "../WarzoneScene";
import { BulletOwner } from "../lib/type";

interface Props {
    x: number;
    y: number;
    scene: WarzoneScene;
    angle: number;
    speed: number;
}

export class EnemyBullet extends Phaser.Physics.Arcade.Sprite {
    private isDefeating = false;

    constructor({ x, y, scene, angle, speed }: Props & { owner: BulletOwner }) {
        super(scene, x, y, "iron_pickaxe");

        scene.add.existing(this);
        scene.physics.world.enable(this);

        this.setDepth(100000000000000);

        this.scene.time.delayedCall(0, () => {
            const body = this.body as Phaser.Physics.Arcade.Body;
            body.setSize(this.width * 0.6, this.height * 0.6);
            body.setOffset(this.width * 0.2, this.height * 0.2);

            body.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
        });

        // spin effect
        scene.tweens.add({
            targets: this,
            angle: -360,
            duration: 500,
            repeat: -1,
        });

        // auto destroy after 3s
        // scene.time.delayedCall(3000, () => {
        //     if (!this.isDefeating) this.destroy();
        // });

        this.createOverlaps();
    }

    createOverlaps() {
        const scene = this.scene as WarzoneScene;
        const enemies = scene.enemyContainer;
        const player = scene.currentPlayer as Phaser.GameObjects.GameObject;

        // enemy vs enemy bullet
        this.scene.physics.add.overlap(
            this,
            enemies.enemies,
            (bullet, enemy) => {
                if (this.isDefeating) return;
                this.isDefeating = true;
                this.destroyBullet();
            }
        );

        // Enemy hit player
        this.scene.physics.add.overlap(
            this,
            player,
            (bullet, player) => {
                if (this.isDefeating) return;
                this.isDefeating = true;
                scene.gameOver();
                this.destroyBullet();
            }
        );

        // Fence vs bullet
        this.scene.physics.add.collider(
            this,
            scene.fences,
            () => {
                if (this.isDefeating) return;
                this.isDefeating = true;
                this.destroyBullet();
            }
        );

        // banner vs bullet
        this.scene.physics.add.overlap(
            this,
            scene.banner,
            () => {
                if (this.isDefeating) return;
                this.isDefeating = true;

                scene.gameOver();
                this.destroyBullet();
                scene.banner.destroy();
            }
        );

        // Obstacle vs bullet
        this.handleObstacleVsBullet();
    }

    handleObstacleVsBullet() {
        const scene = this.scene as WarzoneScene;

        this.scene.physics.add.collider(
            this,
            scene.obstacleGroup,
            (bullet, obstacleSprite) => {
                if (this.isDefeating) return;

                this.isDefeating = true;

                // Find matching obstacle data from scene
                const obstacle = scene.obstacles.find(
                    (o) => o.sprite === obstacleSprite
                );

                if (obstacle) {
                    // non destructible → just destroy bullet
                    if (!obstacle || !obstacle.sprite) {
                        this.destroyBullet();
                        return;
                    }

                    const isBase = obstacle.name === "woodFenceNoEdge";

                    if (isBase) {
                        window.dispatchEvent(
                            new CustomEvent("sunflowerland-warzone-fence-warning", {
                                detail: { type: "woodFenceNoEdge" },
                            })
                        );
                        obstacle.hp = (obstacle.hp ?? 1) - 1;

                        if (obstacle.hp <= 0) {
                            obstacle.sprite.destroy();

                            scene.obstacles = scene.obstacles.filter(
                                (o) => o !== obstacle
                            );
                        }
                    };

                    // reduce hp

                    // optional hit feedback
                    // this.scene.tweens.add({
                    //     targets: obstacle.sprite,
                    //     alpha: 0.6,
                    //     duration: 80,
                    //     yoyo: true,
                    // });
                }
                this.destroyBullet();
            },
            // bullet vs water check - if it's water, skip the collision
            (bullet, obstacleSprite) => {
                const obstacle = scene.obstacles.find(
                    (o) => o.sprite === obstacleSprite
                );
                // Completely ignore water
                return obstacle?.name !== "water";
            },
            this
        );
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