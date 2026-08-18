import {FillGradient, Graphics} from '@antha/graphics-2d';
import {assertWrap} from '@augment-vir/assert';
import {defineShape} from 'object-shape-tester';
import {FishGameLayer} from '../data/fish-game-layer.js';
import {defineEntity} from '../mods/fish-game-entity.mod.js';

const waterParamsShape = defineShape({
    darknessRatio: -1,
    height: -1,
    width: -1,
});

export class WaterEntity extends defineEntity({
    key: 'fish-game-water',
    paramsShape: waterParamsShape,
}) {
    protected deepWaterGradient: FillGradient | undefined;
    protected lightGradient: FillGradient | undefined;
    protected waterGradient: FillGradient | undefined;

    public override createView() {
        const graphics = new Graphics();

        graphics.zIndex = FishGameLayer.Water;

        return {
            view: graphics,
        };
    }

    public override update() {
        const graphics = assertWrap.instanceOf(this.view, Graphics);
        const waterLightness = 57 * (1 - this.params.darknessRatio);

        graphics.clear();
        this.waterGradient?.destroy();
        this.lightGradient?.destroy();
        this.deepWaterGradient?.destroy();
        this.waterGradient = new FillGradient({
            colorStops: [
                {
                    color: `hsl(202deg 78% ${waterLightness}%)`,
                    offset: 0,
                },
                {
                    color: `hsl(221deg 90% ${waterLightness * 0.2}%)`,
                    offset: 1,
                },
            ],
            end: {
                x: 0,
                y: this.params.height,
            },
            start: {
                x: 0,
                y: 0,
            },
            textureSpace: 'global',
            type: 'linear',
        });
        graphics.rect(0, 0, this.params.width, this.params.height).fill(this.waterGradient);

        if (this.params.darknessRatio < 1) {
            this.lightGradient = new FillGradient({
                center: {
                    x: this.params.width * 0.75,
                    y: this.params.height * 0.18,
                },
                colorStops: [
                    {
                        color: `rgb(181 243 255 / ${(27 * (1 - this.params.darknessRatio)).toFixed(4)}%)`,
                        offset: 0,
                    },
                    {
                        color: 'rgb(181 243 255 / 0)',
                        offset: 1,
                    },
                ],
                innerRadius: 0,
                outerCenter: {
                    x: this.params.width * 0.75,
                    y: this.params.height * 0.18,
                },
                outerRadius: this.params.width * 0.34,
                textureSpace: 'global',
                type: 'radial',
            });
            graphics.rect(0, 0, this.params.width, this.params.height).fill(this.lightGradient);
        }

        this.deepWaterGradient = new FillGradient({
            colorStops: [
                {
                    color: 'rgb(1 15 45 / 0)',
                    offset: 0,
                },
                {
                    color: 'rgb(1 15 45 / 55%)',
                    offset: 1,
                },
            ],
            end: {
                x: 0,
                y: this.params.height,
            },
            start: {
                x: 0,
                y: this.params.height * 0.5,
            },
            textureSpace: 'global',
            type: 'linear',
        });
        graphics
            .rect(0, this.params.height * 0.5, this.params.width, this.params.height * 0.5)
            .fill(this.deepWaterGradient);
    }
}
