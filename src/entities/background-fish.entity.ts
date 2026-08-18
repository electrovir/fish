import {position2dParamsMap, position2dParamsShape} from '@antha/entity-2d';
import {Graphics} from '@antha/graphics-2d';
import {assertWrap} from '@augment-vir/assert';
import {defineShape} from 'object-shape-tester';
import {FishGameLayer} from '../data/fish-game-layer.js';
import {defineEntity} from '../mods/fish-game-entity.mod.js';

const backgroundFishParamsShape = defineShape({
    colorHue: -1,
    fishId: -1,
    isSwimmingLeft: false,
    size: -1,
    x: position2dParamsShape.default.x,
    y: position2dParamsShape.default.y,
});

export class BackgroundFishEntity extends defineEntity({
    key: 'fish-game-background-fish',
    paramsMap: position2dParamsMap,
    paramsShape: backgroundFishParamsShape,
}) {
    public override createView() {
        const graphics = new Graphics();

        graphics.zIndex = FishGameLayer.BackgroundFish;

        return {
            view: graphics,
        };
    }

    public override update() {
        const graphics = assertWrap.instanceOf(this.view, Graphics);
        const direction = this.params.isSwimmingLeft ? -1 : 1;
        const bodyWidth = this.params.size * 1.5;
        const bodyHeight = this.params.size * 0.65;

        graphics.clear();
        graphics
            .moveTo(-direction * bodyWidth * 0.8, 0)
            .lineTo(-direction * bodyWidth * 1.4, -bodyHeight * 1.2)
            .lineTo(-direction * bodyWidth * 1.25, 0)
            .lineTo(-direction * bodyWidth * 1.4, bodyHeight * 1.2)
            .closePath()
            .fill(`hsl(${this.params.colorHue}deg 20% 12%)`);
        graphics
            .ellipse(0, 0, bodyWidth, bodyHeight)
            .fill(`hsl(${this.params.colorHue}deg 22% 20%)`);
    }
}
