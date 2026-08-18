import {Sprite} from '@antha/graphics-2d';
import {clamp} from '@augment-vir/common';
import {FishGameLayer} from '../data/fish-game-layer.js';
import {loadStaticAssetTexture, staticAssetMaxProgress} from '../data/static-asset-texture.js';
import {defineEntity} from '../mods/fish-game-entity.mod.js';

export class DiverEntity extends defineEntity({
    key: 'fish-game-diver',
    assets: {
        diverSprite: {
            maxProgress: staticAssetMaxProgress,
            async load({incrementProgressCallback}) {
                const diverTexture = await loadStaticAssetTexture({
                    fileName: 'diver.svg',
                    incrementProgressCallback,
                });
                const diverSprite = new Sprite(diverTexture);

                diverSprite.zIndex = FishGameLayer.Diver;

                return {
                    value: diverSprite,
                };
            },
        },
    },
}) {
    public override async createView() {
        return {
            view: await this.getAsset.diverSprite(),
        };
    }

    public override update() {
        const diverWidth = clamp(this.pixi.screen.width * 0.24, {
            max: 250,
            min: 150,
        });

        this.view.scale.set(diverWidth / 240);
        this.view.x = clamp(this.pixi.screen.width * 0.05, {
            max: 80,
            min: 8,
        });
        this.view.y = this.pixi.screen.height / 2 - 90 * (diverWidth / 240);
    }
}
