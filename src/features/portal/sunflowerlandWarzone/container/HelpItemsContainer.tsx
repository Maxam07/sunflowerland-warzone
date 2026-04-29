import { WarzoneScene, Direction } from "../WarzoneScene";
import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { PlayerBullet } from "./PlayerBullet";
import { BaseScene } from "features/world/scenes/BaseScene";
import { SQUARE_WIDTH } from "features/game/lib/constants";
import { HelpItemType } from "../lib/type";
import { HELP_ITEM, NEXT_HELP_ITEM } from "../WarzoneContants";

interface Props {
    x: number;
    y: number;
    scene: WarzoneScene;
    itemKey: HelpItemType;
    player?: BumpkinContainer;
    playerBullet?: PlayerBullet;
}

export class HelpItems extends Phaser.Physics.Arcade.Sprite {
    player?: BumpkinContainer;
    playerBullet?: PlayerBullet;
    item?: string;
    isSpeedUp = false;

    constructor({ x, y, scene, player, itemKey }: Props) {
        super(scene, x, y, itemKey);
        this.player = player;
        this.item = itemKey;
        this.scene = scene;

        // scene.add.existing(this);
        scene.physics.world.enable(this);

        this.setDepth(100000000000);

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(this.width * 0.6, this.height * 0.6);
        body.setOffset(this.width * 0.2, this.height * 0.2);
        body.setImmovable(true);
        body.setAllowGravity(false);

        this.createOverlaps();
    }

    setItem(itemKey: HelpItemType) {
        if (!this.scene || !this.active) return;
        this.item = itemKey;
        this.setTexture(itemKey);
    }

    createOverlaps() {
        const scene = this.scene as WarzoneScene;
        const player = scene.currentPlayer as Phaser.GameObjects.GameObject;

        // collect help items
        this.scene.physics.add.overlap(
            this,
            player,
            () => {
                if (this.item === "wild_mushroom") {
                    this.stopEnemyMovement();
                } else if (this.item === "magic_mushroom") {
                    this.changeBulletSprite();
                } else if (this.item === "pirate_bounty") {
                    this.speedUp();
                    scene.currentPlayer?.run();
                }
                scene.helpItemTimer?.remove();
                this.reSpawn();
            }
        );
    }

    stopEnemyMovement() {
        const scene = this.scene as WarzoneScene;
        scene.enemyContainer.canUpdate = false;

        scene.time.delayedCall(20000, () => scene.enemyContainer.canUpdate = true)
    }

    changeBulletSprite() {
        const scene = this.scene as WarzoneScene;
        scene.bulletSpriteKey = "gold_pickaxe";
    };

    speedUp() {
        const scene = this.scene as BaseScene;
        scene.walkingSpeed = 70;
    }

    reSpawn() {
        const scene = this.scene as WarzoneScene;
        
            this.setVisible(false);
            this.disableBody(true, true);

        scene.time.delayedCall(NEXT_HELP_ITEM, () => {

            const tile = scene.getRandomFreeTile();
            const newItemKey = Phaser.Utils.Array.GetRandom(HELP_ITEM);

            this.setPosition(
                tile.x * SQUARE_WIDTH + SQUARE_WIDTH / 2,
                tile.y * SQUARE_WIDTH + SQUARE_WIDTH / 2
            );

            this.setItem(newItemKey);

            this.setVisible(true);
            this.enableBody(true, this.x, this.y, true, true);

            // restart loop
            scene.helpItemTimer = scene.time.addEvent({
                delay: 5000,
                loop: true,
                callback: () => {
                    const newTile = scene.getRandomFreeTile();
                    const randomItem = Phaser.Utils.Array.GetRandom(HELP_ITEM);

                    this.setPosition(
                        newTile.x * SQUARE_WIDTH + SQUARE_WIDTH / 2,
                        newTile.y * SQUARE_WIDTH + SQUARE_WIDTH / 2
                    );

                    this.setItem(randomItem);
                },
            });
        });
    }

}