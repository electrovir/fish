import {createAnthaEntityMod2d} from '@antha/entity-2d';
import {type FishGameRenderState} from '../data/fish-game-render-state.js';

export const {defineEntity, mod: fishGameEntityMod} = createAnthaEntityMod2d<FishGameRenderState>();
