import {position2dParamsMap, position2dParamsShape} from '@antha/entity-2d';
import {Graphics} from '@antha/graphics-2d';
import {assertWrap} from '@augment-vir/assert';
import {defineShape} from 'object-shape-tester';
import {FishGameLayer} from '../data/fish-game-layer.js';
import {defineEntity} from '../mods/fish-game-entity.mod.js';

const bubbleParamsShape = defineShape({
    bubbleId: -1,
    opacity: -1,
    size: -1,
    x: position2dParamsShape.default.x,
    y: position2dParamsShape.default.y,
});

export class BubbleEntity extends defineEntity({
    key: 'fish-game-bubble',
    paramsMap: position2dParamsMap,
    paramsShape: bubbleParamsShape,
}) {
    public override createView() {
        const graphics = new Graphics();

        graphics.zIndex = FishGameLayer.Bubble;

        return {
            view: graphics,
        };
    }

    public override update() {
        const graphics = assertWrap.instanceOf(this.view, Graphics);

        graphics.clear();
        graphics.circle(0, 0, this.params.size / 2).stroke({
            alpha: this.params.opacity,
            color: '#ddffff',
            width: 2,
        });
    }
}
