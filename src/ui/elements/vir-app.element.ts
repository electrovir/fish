import {AnthaEngine, AnthaUi} from '@antha/engine';
import {createAnthaGraphics2dMod} from '@antha/graphics-2d';
import {createAnthaReadRawInputMod} from '@antha/input';
import {css, defineElement, html} from 'element-vir';
import {type FishGameEngineState} from '../../data/fish-game-render-state.js';
import {fishGameEntityMod} from '../../mods/fish-game-entity.mod.js';
import {fishGameMod} from '../../mods/fish-game.mod.js';

const gameBackgroundColor = css`#031329`;

export const VirApp = defineElement()({
    tagName: 'vir-app',
    styles: css`
        :host {
            background: ${gameBackgroundColor};
            display: block;
            height: 100%;
            overflow: hidden;
            position: relative;
            width: 100%;
        }

        ${AnthaUi} {
            display: block;
            height: 100%;
            padding: 0;
            position: relative;
            width: 100%;
        }
    `,
    state() {
        return {
            engine: new AnthaEngine<FishGameEngineState>({
                mods: [
                    createAnthaGraphics2dMod({
                        extraCanvasWrapperStyles: css`
                            z-index: 0;
                        `,
                        pixiOptions: {
                            background: String(gameBackgroundColor),
                        },
                    }),
                    createAnthaReadRawInputMod(),
                    fishGameEntityMod,
                    fishGameMod,
                ],
            }),
        };
    },
    render({state}) {
        return html`
            <${AnthaUi.assign({
                engine: state.engine,
            })}></${AnthaUi}>
        `;
    },
});
