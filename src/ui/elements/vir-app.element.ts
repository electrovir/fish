import {AnthaEngine, AnthaUi, defineAnthaMod} from '@antha/engine';
import {assertWrap} from '@augment-vir/assert';
import {css, defineElement, html, nothing, repeat} from 'element-vir';

import {
    advanceFishGame,
    createFishGame,
    type ActiveShark,
    type BackgroundFish,
    type DefeatedShark,
    type FishGame,
    type FishGameBubble,
    typeFishGameCharacter,
} from '../../data/fish-game.js';

type FishGameEngineState = {
    game: FishGame;
    keyboardListener: ((event: KeyboardEvent) => void) | undefined;
};

function createDiverSvg() {
    return html`
        <svg viewBox="0 0 240 180" aria-hidden="true">
            <defs>
                <linearGradient id="suit" x1="0" x2="1">
                    <stop offset="0" stop-color="#e95d45"></stop>
                    <stop offset="1" stop-color="#9c2837"></stop>
                </linearGradient>
            </defs>
            <path d="M53 77c-15 18-22 44-20 67h32c0-21 7-39 19-53Z" fill="#0d263d"></path>
            <path d="M71 144h64v17H66c-6 0-9-8-5-13Z" fill="#111d30"></path>
            <rect x="44" y="39" width="55" height="56" rx="24" fill="url(#suit)"></rect>
            <circle cx="96" cy="49" r="25" fill="#d5ac8c"></circle>
            <path d="M78 45c10-20 37-18 44 1v17H79Z" fill="#0c2235"></path>
            <rect x="86" y="49" width="36" height="19" rx="8" fill="#9fefff"></rect>
            <path
                d="M124 62c33 10 48 20 65 37"
                fill="none"
                stroke="#d5ac8c"
                stroke-width="15"
                stroke-linecap="round"
            ></path>
            <path
                d="M61 89c31 17 45 31 63 56"
                fill="none"
                stroke="#c9443f"
                stroke-width="19"
                stroke-linecap="round"
            ></path>
            <path d="M189 99l23 2-14 14Z" fill="#d5ac8c"></path>
            <path d="M125 145l31 13-8 13-34-12Z" fill="#e95d45"></path>
            <path d="M65 144l-20 18h28l18-17Z" fill="#e95d45"></path>
            <circle cx="37" cy="70" r="23" fill="#a2bdca"></circle>
            <path
                d="M37 47v-7m0 53v-7m23-16h7M7 70h7"
                stroke="#d6f7ff"
                stroke-width="4"
                stroke-linecap="round"
            ></path>
        </svg>
    `;
}

function createSharkSvg() {
    return html`
        <svg viewBox="0 0 320 160" preserveAspectRatio="none" aria-hidden="true">
            <defs>
                <linearGradient id="shark-skin" x1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#7198a9"></stop>
                    <stop offset="1" stop-color="#2d5266"></stop>
                </linearGradient>
            </defs>
            <path d="M58 80 7 39l13 43L7 122Z" fill="#466d7f"></path>
            <path
                d="M57 77c35-43 159-54 215-4 20 18 36 15 43 10-3 22-27 34-52 34-61 31-179 13-206-19-8-9-7-15 1-21Z"
                fill="url(#shark-skin)"
            ></path>
            <path d="M150 38 179 2l15 45Z" fill="#5d8495"></path>
            <path d="M151 117 176 151l11-41Z" fill="#3e687a"></path>
            <path d="M290 75c10 3 19 2 26-3-2 11-10 19-25 25Z" fill="#e0e7e3"></path>
            <path d="M101 101c45 16 115 19 168 4-33 28-137 27-177-2Z" fill="#dbe5e2"></path>
            <circle cx="245" cy="59" r="7" fill="#091522"></circle>
            <circle cx="247" cy="57" r="2" fill="white"></circle>
            <path
                d="M188 99c5-11 10-16 16-22m8 30c5-12 10-18 16-24m8 24c5-10 10-15 15-21"
                fill="none"
                stroke="#2a4958"
                stroke-width="3"
            ></path>
        </svg>
    `;
}

function renderTargetWord({
    isTypingShark,
    shark,
}: Readonly<{
    isTypingShark: boolean;
    shark: Readonly<ActiveShark>;
}>) {
    return shark.word
        .split('')
        .map((character, index) => {
            return html`
                <span
                    class="word-letter ${
                        isTypingShark && index < shark.typedCharacterCount ? 'is-typed' : ''
                    }"
                >
                    ${character}
                </span>
            `;
        });
}

function renderDefeatedShark({shark}: Readonly<{shark: Readonly<DefeatedShark>}>) {
    return html`
        <div
            class="shark"
            style=${css`
                --explosion-opacity: ${1 - shark.sharkDeathProgress};
                --explosion-scale: ${0.6 + shark.sharkDeathProgress * 3};
                --shark-opacity: ${1 - shark.sharkDeathProgress};
                --shark-position: ${shark.sharkPosition}%;
                --shark-rotation: ${shark.sharkDeathProgress * 180}deg;
                --shark-scale: ${1 + shark.sharkDeathProgress * 0.3};
                --shark-top: ${shark.sharkVerticalPosition}%;
                --shark-y: ${-shark.sharkDeathProgress * 115}vh;
            `}
        >
            <div class="explosion"></div>
            ${createSharkSvg()}
        </div>
    `;
}

function renderActiveShark({
    isTypingShark,
    shark,
}: Readonly<{
    isTypingShark: boolean;
    shark: Readonly<ActiveShark>;
}>) {
    return html`
        <div
            class="shark ${isTypingShark ? 'is-typing-shark' : ''}"
            style=${css`
                --explosion-opacity: 0;
                --explosion-scale: 0.6;
                --shark-opacity: 1;
                --shark-position: ${shark.sharkPosition}%;
                --shark-rotation: 0deg;
                --shark-scale: 1;
                --shark-top: ${shark.sharkVerticalPosition}%;
                --shark-y: 0vh;
            `}
        >
            <div class="target-word ${isTypingShark ? 'is-typing-target' : ''}">
                ${renderTargetWord({
                    isTypingShark,
                    shark,
                })}
            </div>
            ${createSharkSvg()}
        </div>
    `;
}

function renderBubble({bubble}: Readonly<{bubble: Readonly<FishGameBubble>}>) {
    return html`
        <div
            class="bubble"
            style=${css`
                --bubble-opacity: ${bubble.opacity};
                --bubble-rise-duration: ${1200 - bubble.risePerShark * 40}ms;
                --bubble-size: ${bubble.size}px;
                --bubble-x: ${bubble.horizontalPosition}%;
                --bubble-y: ${bubble.verticalPosition}%;
            `}
        ></div>
    `;
}

function createBackgroundFishSvg() {
    return html`
        <svg viewBox="0 0 80 40" aria-hidden="true">
            <path class="background-fish-tail" d="M18 20 3 6l3 14-3 14Z"></path>
            <path
                class="background-fish-body"
                d="M15 20C27 5 61 4 77 20 61 36 27 35 15 20Z"
            ></path>
            <path class="background-fish-fin" d="m41 10 8-8 5 11Z"></path>
            <circle cx="63" cy="16" r="2.2" fill="#dfffff"></circle>
        </svg>
    `;
}

function renderBackgroundFish({
    fish,
}: Readonly<{fish: Readonly<BackgroundFish>}>) {
    return html`
        <div
            class="background-fish"
            style=${css`
                --background-fish-direction: ${fish.isSwimmingLeft ? -1 : 1};
                --background-fish-hue: ${fish.colorHue};
                --background-fish-opacity: ${fish.opacity};
                --background-fish-rise-duration: ${1500 - fish.risePerShark * 55}ms;
                --background-fish-size: ${fish.size}px;
                --background-fish-x: ${fish.horizontalPosition}%;
                --background-fish-y: ${fish.verticalPosition}%;
            `}
        >
            ${createBackgroundFishSvg()}
        </div>
    `;
}

const FishGameScene = defineElement<{
    game: FishGame;
}>()({
    tagName: 'fish-game-scene',
    styles: css`
        :host {
            display: block;
            height: 100%;
            width: 100%;
        }

        .game {
            align-items: stretch;
            background: hsl(202deg 78% calc(57% - var(--darkness)));
            box-sizing: border-box;
            color: #effcff;
            display: flex;
            font-family: ui-rounded, system-ui, sans-serif;
            height: 100dvh;
            overflow: hidden;
            position: fixed;
            inset: 0;
            transition: background 800ms ease;
            width: 100dvw;
        }

        .game::before,
        .game::after {
            content: '';
            position: absolute;
            inset: 0;
            pointer-events: none;
        }

        .game::before {
            background: radial-gradient(circle at 75% 18%, rgb(181 243 255 / 27%), transparent 26%),
                linear-gradient(180deg, rgb(191 249 255 / 32%), transparent 35%);
            opacity: calc(1 - var(--darkness-ratio));
        }

        .game::after {
            background: linear-gradient(180deg, transparent 50%, rgb(1 15 45 / 55%));
        }

        .surface {
            background: linear-gradient(90deg, transparent, rgb(218 255 255 / 85%), transparent);
            height: 2px;
            opacity: calc(1 - var(--darkness-ratio));
            position: absolute;
            top: 12%;
            transition: opacity 800ms ease;
            width: 100%;
        }

        .instruction,
        .score {
            font-size: clamp(0.74rem, 1.6vw, 1rem);
            font-weight: 800;
            letter-spacing: 0.14em;
            position: absolute;
            text-transform: uppercase;
            z-index: 2;
        }

        .instruction {
            left: clamp(1.25rem, 4vw, 4rem);
            top: clamp(1.25rem, 4vw, 3rem);
        }

        .instruction span {
            color: #9ef8ff;
        }

        .score {
            right: clamp(1.25rem, 4vw, 4rem);
            text-align: right;
            top: clamp(1.25rem, 4vw, 3rem);
        }

        .score span {
            color: #ffd771;
            display: block;
            font-size: 1.45em;
            letter-spacing: 0.08em;
            margin-top: 0.25rem;
        }

        .bubble-field {
            inset: 0;
            pointer-events: none;
            position: absolute;
            z-index: 0;
        }

        .background-fish-field {
            inset: 0;
            overflow: hidden;
            pointer-events: none;
            position: absolute;
            z-index: 0;
        }

        .background-fish {
            height: var(--background-fish-size);
            left: var(--background-fish-x);
            opacity: var(--background-fish-opacity);
            position: absolute;
            top: var(--background-fish-y);
            transform: translate(-50%, -50%) scaleX(var(--background-fish-direction));
            transition: top var(--background-fish-rise-duration) ease;
            width: calc(var(--background-fish-size) * 2.1);
        }

        .background-fish svg {
            height: 100%;
            width: 100%;
        }

        .background-fish-body {
            fill: hsl(var(--background-fish-hue) 46% 56%);
        }

        .background-fish-tail {
            fill: hsl(var(--background-fish-hue) 44% 41%);
        }

        .background-fish-fin {
            fill: hsl(var(--background-fish-hue) 48% 68%);
        }

        .bubble {
            border: 2px solid rgb(221 255 255 / 45%);
            border-radius: 50%;
            height: var(--bubble-size);
            left: var(--bubble-x);
            opacity: var(--bubble-opacity);
            position: absolute;
            top: var(--bubble-y);
            transition: top var(--bubble-rise-duration) ease;
            width: var(--bubble-size);
        }

        .diver {
            filter: drop-shadow(0 16px 12px rgb(0 13 30 / 35%));
            left: clamp(0.5rem, 5vw, 5rem);
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: clamp(150px, 24vw, 250px);
            z-index: 1;
        }

        .diver svg,
        .shark svg {
            display: block;
            height: auto;
            width: 100%;
        }

        .shark svg {
            height: 100%;
            transform: scaleX(-1);
        }

        .shark {
            --shark-width: clamp(190px, 36vw, 380px);
            filter: drop-shadow(0 18px 13px rgb(0 15 35 / 38%));
            left: calc(var(--shark-position) - clamp(47.5px, 9vw, 95px));
            opacity: var(--shark-opacity);
            position: absolute;
            top: var(--shark-top);
            transform: translate(-50%, calc(-50% + var(--shark-y))) rotate(var(--shark-rotation))
                scale(var(--shark-scale));
            transform-origin: center;
            aspect-ratio: 5 / 1;
            width: var(--shark-width);
            z-index: 1;
        }

        .explosion {
            aspect-ratio: 1;
            background: radial-gradient(
                circle,
                #fffbd0 0 12%,
                #ffca4d 14% 35%,
                rgb(255 115 57 / 0%) 68%
            );
            left: 50%;
            opacity: var(--explosion-opacity);
            pointer-events: none;
            position: absolute;
            top: 50%;
            transform: translate(-50%, -50%) scale(var(--explosion-scale));
            width: 58%;
        }

        .target-word {
            background: rgb(4 28 50 / 78%);
            border: 2px solid rgb(199 250 255 / 65%);
            border-radius: 999px;
            box-shadow: 0 8px 20px rgb(0 8 22 / 28%);
            align-items: center;
            display: flex;
            font-family: 'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif;
            font-size: clamp(1.6rem, 4.5vw, 2.5rem);
            font-weight: 900;
            gap: 0.08em;
            justify-content: center;
            letter-spacing: 0.02em;
            min-width: 3.2em;
            padding: 0.1em 0.32em;
            position: absolute;
            right: 25%;
            top: 50%;
            transform: translateY(-50%);
            text-transform: uppercase;
            z-index: 2;
        }

        .word-letter {
            color: #f3ffff;
            transition:
                color 120ms ease,
                transform 120ms ease;
        }

        .word-letter.is-typed {
            color: #7effd8;
            transform: scale(0.9);
        }

        .target-word:not(.is-typing-target) {
            border-color: rgb(199 250 255 / 35%);
            opacity: 0.72;
        }

        .shark.is-typing-shark {
            filter: drop-shadow(0 0 10px rgb(126 255 216 / 95%))
                drop-shadow(0 14px 12px rgb(0 15 35 / 48%));
        }

        .shark.is-typing-shark .target-word {
            background: rgb(4 51 58 / 92%);
            border-color: #7effd8;
            box-shadow: 0 0 16px rgb(126 255 216 / 78%);
        }

        .depth-marker {
            bottom: 1.5rem;
            color: rgb(220 250 255 / 78%);
            font-family: ui-monospace, SFMono-Regular, monospace;
            font-size: clamp(0.65rem, 1.4vw, 0.85rem);
            left: clamp(1.25rem, 4vw, 4rem);
            letter-spacing: 0.13em;
            position: absolute;
            z-index: 2;
        }

        @media (max-width: 520px) {
            .instruction {
                max-width: 11rem;
            }
        }
    `,
    render({inputs}) {
        if (!inputs.game) {
            return nothing;
        }

        const game = inputs.game;
        const typingSharkId = game.typingSharkId;

        return html`
            <main
                class="game"
                style=${css`
                    --darkness: ${Math.min(game.defeatedSharkCount * 7, 57)}%;
                    --darkness-ratio: ${Math.min(game.defeatedSharkCount / 9, 1)};
                `}
            >
                <div class="surface"></div>
                <p class="instruction">
                    Type the
                    <span>word</span>
                    to defend the dive.
                </p>
                <p class="score">
                    Sharks cleared
                    <span>${game.defeatedSharkCount}</span>
                </p>
                <div class="background-fish-field">
                    ${repeat(
                        game.backgroundFish,
                        (fish) => fish.fishId,
                        (fish) => {
                            return renderBackgroundFish({
                                fish,
                            });
                        },
                    )}
                </div>
                <div class="bubble-field">
                    ${repeat(
                        game.bubbles,
                        (bubble) => bubble.bubbleId,
                        (bubble) => {
                            return renderBubble({
                                bubble,
                            });
                        },
                    )}
                </div>
                <div class="diver">${createDiverSvg()}</div>
                ${game.defeatedSharks.map((shark) => {
                    return renderDefeatedShark({
                        shark,
                    });
                })}
                ${repeat(
                    game.activeSharks,
                    (shark) => shark.sharkId,
                    (shark) => {
                        return renderActiveShark({
                            isTypingShark: shark.sharkId === typingSharkId,
                            shark,
                        });
                    },
                )}
                <p class="depth-marker">Depth ${24 + game.defeatedSharkCount * 14} m</p>
            </main>
        `;
    },
});

function createTypingListener({state}: Readonly<{state: Partial<FishGameEngineState>}>) {
    return function handleTypingKey(event: KeyboardEvent) {
        if (event.key.length !== 1 || event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }

        const game = state.game;

        if (!game) {
            return;
        }

        state.game = typeFishGameCharacter({
            game,
            key: event.key.toLowerCase(),
        });
    };
}

const fishGameMod = defineAnthaMod<FishGameEngineState>({
    modName: 'fish-game',
    initState: {
        game: createFishGame(),
    },
    execute({hostElement, msSinceLastExecute, state}) {
        const game = state.game;

        if (!game) {
            return nothing;
        }

        if (!state.keyboardListener) {
            hostElement.tabIndex = 0;
            hostElement.focus({
                preventScroll: true,
            });
            state.keyboardListener = createTypingListener({state});
            hostElement.addEventListener('keydown', state.keyboardListener);
        }

        state.game = advanceFishGame({
            game,
            elapsedMilliseconds: msSinceLastExecute,
        });

        return html`
            <${FishGameScene.assign({
                game: assertWrap.isDefined(state.game),
            })}></${FishGameScene}>
        `;
    },
    cleanup({hostElement, state}) {
        if (state.keyboardListener) {
            hostElement.removeEventListener('keydown', state.keyboardListener);
        }
    },
});

export const VirApp = defineElement()({
    tagName: 'vir-app',
    styles: css`
        :host {
            display: block;
            height: 100%;
            width: 100%;
        }

        ${AnthaUi} {
            height: 100%;
            padding: 0;
            width: 100%;
        }
    `,
    state() {
        return {
            engine: new AnthaEngine<FishGameEngineState>({
                mods: [fishGameMod],
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
