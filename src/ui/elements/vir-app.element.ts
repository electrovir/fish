import {AnthaEngine, AnthaUi, defineAnthaMod, SkipExecution} from '@antha/engine';
import {assert, assertWrap} from '@augment-vir/assert';
import {css, defineElement, html, onDomCreated} from 'element-vir';

import {
    advanceFishGame,
    createFishGame,
    typeFishGameCharacter,
    type ActiveShark,
    type BackgroundFish,
    type DefeatedShark,
    type FishGame,
    type FishGameBubble,
} from '../../data/fish-game.js';

type CanvasDimensions = {
    height: number;
    pixelRatio: number;
    width: number;
};

type BackgroundTransition = {
    backgroundFish: ReadonlyArray<Pick<BackgroundFish, 'fishId' | 'verticalPosition'>>;
    bubbles: ReadonlyArray<Pick<FishGameBubble, 'bubbleId' | 'verticalPosition'>>;
    elapsedMilliseconds: number;
    defeatedSharkCount: number;
};

type FishGameEngineState = {
    backgroundTransition: BackgroundTransition | undefined;
    canvas: HTMLCanvasElement | undefined;
    game: FishGame;
    keyboardListener: ((event: KeyboardEvent) => void) | undefined;
};

const backgroundTransitionDurationMilliseconds = 900;

function clamp({
    maximum,
    minimum,
    value,
}: Readonly<{maximum: number; minimum: number; value: number}>) {
    return Math.min(Math.max(value, minimum), maximum);
}

function getBackgroundTransitionProgress({
    backgroundTransition,
}: Readonly<{backgroundTransition: Readonly<BackgroundTransition> | undefined}>) {
    const progress = backgroundTransition
        ? clamp({
              maximum: 1,
              minimum: 0,
              value:
                  backgroundTransition.elapsedMilliseconds /
                  backgroundTransitionDurationMilliseconds,
          })
        : 1;

    return 1 - (1 - progress) ** 3;
}

function getTransitionedVerticalPosition({
    backgroundTransition,
    sourceVerticalPosition,
    verticalPosition,
}: Readonly<{
    backgroundTransition: Readonly<BackgroundTransition> | undefined;
    sourceVerticalPosition: number | undefined;
    verticalPosition: number;
}>) {
    return sourceVerticalPosition == undefined
        ? verticalPosition
        : sourceVerticalPosition +
              (verticalPosition - sourceVerticalPosition) *
                  getBackgroundTransitionProgress({
                      backgroundTransition,
                  });
}

function getDisplayedDefeatedSharkCount({
    backgroundTransition,
    game,
}: Readonly<{
    backgroundTransition: Readonly<BackgroundTransition> | undefined;
    game: Readonly<FishGame>;
}>) {
    return backgroundTransition
        ? backgroundTransition.defeatedSharkCount +
              (game.defeatedSharkCount - backgroundTransition.defeatedSharkCount) *
                  getBackgroundTransitionProgress({
                      backgroundTransition,
                  })
        : game.defeatedSharkCount;
}

function createBackgroundTransition({
    backgroundTransition,
    game,
}: Readonly<{
    backgroundTransition: Readonly<BackgroundTransition> | undefined;
    game: Readonly<FishGame>;
}>): BackgroundTransition {
    return {
        backgroundFish: game.backgroundFish.map((fish) => {
            return {
                fishId: fish.fishId,
                verticalPosition: getTransitionedVerticalPosition({
                    backgroundTransition,
                    sourceVerticalPosition: backgroundTransition?.backgroundFish.find(
                        ({fishId}) => fishId === fish.fishId,
                    )?.verticalPosition,
                    verticalPosition: fish.verticalPosition,
                }),
            };
        }),
        bubbles: game.bubbles.map((bubble) => {
            return {
                bubbleId: bubble.bubbleId,
                verticalPosition: getTransitionedVerticalPosition({
                    backgroundTransition,
                    sourceVerticalPosition: backgroundTransition?.bubbles.find(
                        ({bubbleId}) => bubbleId === bubble.bubbleId,
                    )?.verticalPosition,
                    verticalPosition: bubble.verticalPosition,
                }),
            };
        }),
        defeatedSharkCount: getDisplayedDefeatedSharkCount({
            backgroundTransition,
            game,
        }),
        elapsedMilliseconds: 0,
    };
}

function advanceBackgroundTransition({
    backgroundTransition,
    elapsedMilliseconds,
}: Readonly<{
    backgroundTransition: Readonly<BackgroundTransition> | undefined;
    elapsedMilliseconds: number;
}>) {
    if (!backgroundTransition) {
        return undefined;
    }

    const updatedElapsedMilliseconds =
        backgroundTransition.elapsedMilliseconds + elapsedMilliseconds;

    return updatedElapsedMilliseconds >= backgroundTransitionDurationMilliseconds
        ? undefined
        : {
              ...backgroundTransition,
              elapsedMilliseconds: updatedElapsedMilliseconds,
          };
}

function setCanvasDimensions({canvas}: Readonly<{canvas: HTMLCanvasElement}>) {
    const canvasBounds = canvas.getBoundingClientRect();
    const pixelRatio = globalThis.devicePixelRatio || 1;
    const width = Math.max(canvasBounds.width, 1);
    const height = Math.max(canvasBounds.height, 1);
    const pixelWidth = Math.round(width * pixelRatio);
    const pixelHeight = Math.round(height * pixelRatio);

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
    }

    return {
        height,
        pixelRatio,
        width,
    };
}

function drawRoundedRectangle({
    context,
    height,
    radius,
    width,
    x,
    y,
}: Readonly<{
    context: CanvasRenderingContext2D;
    height: number;
    radius: number;
    width: number;
    x: number;
    y: number;
}>) {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
}

function drawWater({
    context,
    defeatedSharkCount,
    dimensions,
}: Readonly<{
    context: CanvasRenderingContext2D;
    defeatedSharkCount: number;
    dimensions: Readonly<CanvasDimensions>;
}>) {
    const darknessRatio = Math.min(defeatedSharkCount / 9, 1);
    const waterLightness = 57 * (1 - darknessRatio);
    const waterGradient = context.createLinearGradient(0, 0, 0, dimensions.height);

    waterGradient.addColorStop(0, `hsl(202deg 78% ${waterLightness}%)`);
    waterGradient.addColorStop(1, `hsl(221deg 90% ${waterLightness * 0.2}%)`);
    context.fillStyle = waterGradient;
    context.fillRect(0, 0, dimensions.width, dimensions.height);

    if (darknessRatio < 1) {
        const lightGradient = context.createRadialGradient(
            dimensions.width * 0.75,
            dimensions.height * 0.18,
            0,
            dimensions.width * 0.75,
            dimensions.height * 0.18,
            dimensions.width * 0.34,
        );

        lightGradient.addColorStop(0, `rgb(181 243 255 / ${0.27 * (1 - darknessRatio)})`);
        lightGradient.addColorStop(1, 'rgb(181 243 255 / 0)');
        context.fillStyle = lightGradient;
        context.fillRect(0, 0, dimensions.width, dimensions.height);
    }

    const deepWaterGradient = context.createLinearGradient(
        0,
        dimensions.height * 0.5,
        0,
        dimensions.height,
    );

    deepWaterGradient.addColorStop(0, 'rgb(1 15 45 / 0)');
    deepWaterGradient.addColorStop(1, 'rgb(1 15 45 / 55%)');
    context.fillStyle = deepWaterGradient;
    context.fillRect(0, dimensions.height * 0.5, dimensions.width, dimensions.height * 0.5);

    context.globalAlpha = 1 - darknessRatio;
    context.fillStyle = 'rgb(218 255 255 / 85%)';
    context.fillRect(0, dimensions.height * 0.12, dimensions.width, 2);
    context.globalAlpha = 1;
}

function drawBubble({
    bubble,
    context,
    dimensions,
    verticalPosition,
}: Readonly<{
    bubble: Readonly<FishGameBubble>;
    context: CanvasRenderingContext2D;
    dimensions: Readonly<CanvasDimensions>;
    verticalPosition: number;
}>) {
    context.beginPath();
    context.arc(
        (bubble.horizontalPosition / 100) * dimensions.width,
        (verticalPosition / 100) * dimensions.height,
        bubble.size / 2,
        0,
        Math.PI * 2,
    );
    context.globalAlpha = bubble.opacity;
    context.lineWidth = 2;
    context.strokeStyle = '#ddffff';
    context.stroke();
    context.globalAlpha = 1;
}

function drawBackgroundFish({
    context,
    dimensions,
    fish,
    verticalPosition,
}: Readonly<{
    context: CanvasRenderingContext2D;
    dimensions: Readonly<CanvasDimensions>;
    fish: Readonly<BackgroundFish>;
    verticalPosition: number;
}>) {
    const x = (fish.horizontalPosition / 100) * dimensions.width;
    const y = (verticalPosition / 100) * dimensions.height;
    const direction = fish.isSwimmingLeft ? -1 : 1;

    context.save();
    context.translate(x, y);
    context.scale(direction, 1);
    context.scale(fish.size / 20, fish.size / 20);

    context.fillStyle = `hsl(${fish.colorHue}deg 20% 12%)`;
    context.beginPath();
    context.moveTo(-18, 0);
    context.lineTo(-31, -12);
    context.lineTo(-28, 0);
    context.lineTo(-31, 12);
    context.closePath();
    context.fill();

    context.fillStyle = `hsl(${fish.colorHue}deg 22% 20%)`;
    context.beginPath();
    context.ellipse(0, 0, 22, 10, 0, 0, Math.PI * 2);
    context.fill();

    context.restore();
}

function drawDiver({
    context,
    dimensions,
}: Readonly<{
    context: CanvasRenderingContext2D;
    dimensions: Readonly<CanvasDimensions>;
}>) {
    const width = clamp({
        maximum: 250,
        minimum: 150,
        value: dimensions.width * 0.24,
    });
    const scale = width / 240;
    const x = clamp({
        maximum: 80,
        minimum: 8,
        value: dimensions.width * 0.05,
    });

    context.save();
    context.translate(x, dimensions.height / 2 - 90 * scale);
    context.scale(scale, scale);
    context.shadowBlur = 12;
    context.shadowColor = 'rgb(0 13 30 / 35%)';

    context.fillStyle = '#0d263d';
    context.beginPath();
    context.moveTo(53, 77);
    context.quadraticCurveTo(31, 104, 33, 144);
    context.lineTo(65, 144);
    context.quadraticCurveTo(65, 105, 84, 91);
    context.closePath();
    context.fill();

    context.fillStyle = '#111d30';
    context.fillRect(66, 144, 69, 17);
    context.fillStyle = '#e95d45';
    context.roundRect(44, 39, 55, 56, 24);
    context.fill();
    context.fillStyle = '#d5ac8c';
    context.beginPath();
    context.arc(96, 49, 25, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#0c2235';
    context.beginPath();
    context.arc(100, 48, 25, Math.PI, Math.PI * 2);
    context.fill();
    context.fillStyle = '#9fefff';
    context.roundRect(86, 49, 36, 19, 8);
    context.fill();
    context.fillStyle = '#e95d45';
    context.fillRect(125, 145, 31, 13);
    context.fillRect(45, 144, 28, 17);
    context.fillStyle = '#a2bdca';
    context.beginPath();
    context.arc(37, 70, 23, 0, Math.PI * 2);
    context.fill();
    context.restore();
}

function drawSharkBody({
    context,
    height,
    width,
}: Readonly<{
    context: CanvasRenderingContext2D;
    height: number;
    width: number;
}>) {
    const halfHeight = height / 2;
    const halfWidth = width / 2;
    const bodyGradient = context.createLinearGradient(0, -halfHeight, 0, halfHeight);

    bodyGradient.addColorStop(0, '#7198a9');
    bodyGradient.addColorStop(1, '#2d5266');
    context.fillStyle = '#466d7f';
    context.beginPath();
    context.moveTo(halfWidth * 0.45, 0);
    context.lineTo(halfWidth, -halfHeight * 0.7);
    context.lineTo(halfWidth * 0.82, 0);
    context.lineTo(halfWidth, halfHeight * 0.7);
    context.closePath();
    context.fill();
    context.fillStyle = bodyGradient;
    context.beginPath();
    context.moveTo(-halfWidth * 0.96, 0);
    context.quadraticCurveTo(
        -halfWidth * 0.68,
        -halfHeight * 0.92,
        halfWidth * 0.48,
        -halfHeight * 0.42,
    );
    context.quadraticCurveTo(halfWidth * 0.78, -halfHeight * 0.1, halfWidth * 0.86, 0);
    context.quadraticCurveTo(
        halfWidth * 0.6,
        halfHeight * 0.78,
        -halfWidth * 0.63,
        halfHeight * 0.4,
    );
    context.quadraticCurveTo(-halfWidth * 0.95, halfHeight * 0.18, -halfWidth * 0.96, 0);
    context.closePath();
    context.fill();

    context.fillStyle = '#5d8495';
    context.beginPath();
    context.moveTo(-width * 0.02, -halfHeight * 0.42);
    context.lineTo(width * 0.1, -halfHeight);
    context.lineTo(width * 0.2, -halfHeight * 0.38);
    context.closePath();
    context.fill();
    context.fillStyle = '#3e687a';
    context.beginPath();
    context.moveTo(width * 0.02, halfHeight * 0.35);
    context.lineTo(width * 0.16, halfHeight);
    context.lineTo(width * 0.22, halfHeight * 0.35);
    context.closePath();
    context.fill();
    context.fillStyle = '#dbe5e2';
    context.beginPath();
    context.ellipse(-width * 0.04, height * 0.18, width * 0.34, height * 0.18, 0, 0, Math.PI);
    context.fill();
    context.fillStyle = '#091522';
    context.beginPath();
    context.arc(-width * 0.56, -height * 0.14, Math.max(3, height * 0.09), 0, Math.PI * 2);
    context.fill();
    context.fillStyle = 'white';
    context.beginPath();
    context.arc(-width * 0.575, -height * 0.17, Math.max(1, height * 0.026), 0, Math.PI * 2);
    context.fill();
}

function drawExplosion({
    context,
    progress,
    x,
    y,
}: Readonly<{
    context: CanvasRenderingContext2D;
    progress: number;
    x: number;
    y: number;
}>) {
    const radius = 120 * (0.6 + progress * 3);
    const explosionGradient = context.createRadialGradient(x, y, 0, x, y, radius);

    explosionGradient.addColorStop(0, `rgb(255 251 208 / ${1 - progress})`);
    explosionGradient.addColorStop(0.3, `rgb(255 202 77 / ${0.8 * (1 - progress)})`);
    explosionGradient.addColorStop(1, 'rgb(255 115 57 / 0)');
    context.fillStyle = explosionGradient;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawWord({
    context,
    isTypingShark,
    shark,
    x,
    y,
}: Readonly<{
    context: CanvasRenderingContext2D;
    isTypingShark: boolean;
    shark: Readonly<ActiveShark>;
    x: number;
    y: number;
}>) {
    const fontSize = clamp({
        maximum: 40,
        minimum: 25.6,
        value: globalThis.innerWidth * 0.045,
    });
    const word = shark.word.toUpperCase();

    // cspell:word Hyperlegible
    context.font = `900 ${fontSize}px 'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif`;
    const letterSpacing = fontSize * 0.08;
    const wordWidth = word.split('').reduce((totalWidth, letter, index) => {
        return totalWidth + context.measureText(letter).width + (index ? letterSpacing : 0);
    }, 0);
    const boxWidth = Math.max(wordWidth + fontSize * 0.64, fontSize * 3.2);
    const boxHeight = fontSize * 1.22;

    context.save();
    context.shadowBlur = isTypingShark ? 16 : 12;
    context.shadowColor = isTypingShark ? 'rgb(126 255 216 / 78%)' : 'rgb(0 8 22 / 28%)';
    context.fillStyle = isTypingShark ? 'rgb(4 51 58 / 92%)' : 'rgb(4 28 50 / 78%)';
    drawRoundedRectangle({
        context,
        height: boxHeight,
        radius: boxHeight / 2,
        width: boxWidth,
        x: x - boxWidth / 2,
        y: y - boxHeight / 2,
    });
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = isTypingShark ? '#7effd8' : 'rgb(199 250 255 / 45%)';
    context.stroke();
    context.shadowBlur = 0;
    context.textBaseline = 'middle';
    context.textAlign = 'left';
    const firstLetterX = x - wordWidth / 2;

    word.split('').forEach((letter, index) => {
        const letterX = word
            .slice(0, index)
            .split('')
            .reduce((currentX, priorLetter) => {
                return currentX + context.measureText(priorLetter).width + letterSpacing;
            }, firstLetterX);
        context.fillStyle =
            isTypingShark && index < shark.typedCharacterCount ? '#7effd8' : '#f3ffff';
        context.fillText(
            letter,
            letterX,
            y + (isTypingShark && index < shark.typedCharacterCount ? 1 : 0),
        );
    });
    context.restore();
}

function drawActiveShark({
    context,
    dimensions,
    isTypingShark,
    shark,
}: Readonly<{
    context: CanvasRenderingContext2D;
    dimensions: Readonly<CanvasDimensions>;
    isTypingShark: boolean;
    shark: Readonly<ActiveShark>;
}>) {
    const width = clamp({
        maximum: 380,
        minimum: 190,
        value: dimensions.width * 0.36,
    });
    const height = width / 5;
    const x = (shark.sharkPosition / 100) * dimensions.width - width * 0.25;
    const y = (shark.sharkVerticalPosition / 100) * dimensions.height;

    context.save();
    context.translate(x, y);
    context.shadowBlur = isTypingShark ? 16 : 13;
    context.shadowColor = isTypingShark ? 'rgb(126 255 216 / 95%)' : 'rgb(0 15 35 / 38%)';
    drawSharkBody({
        context,
        height,
        width,
    });
    context.restore();
    drawWord({
        context,
        isTypingShark,
        shark,
        x: x + width * 0.17,
        y,
    });
}

function drawDefeatedShark({
    context,
    dimensions,
    shark,
}: Readonly<{
    context: CanvasRenderingContext2D;
    dimensions: Readonly<CanvasDimensions>;
    shark: Readonly<DefeatedShark>;
}>) {
    const width = clamp({
        maximum: 380,
        minimum: 190,
        value: dimensions.width * 0.36,
    });
    const height = width / 5;
    const x = (shark.sharkPosition / 100) * dimensions.width - width * 0.25;
    const y =
        (shark.sharkVerticalPosition / 100) * dimensions.height -
        shark.sharkDeathProgress * dimensions.height * 1.15;

    drawExplosion({
        context,
        progress: shark.sharkDeathProgress,
        x,
        y,
    });
    context.save();
    context.globalAlpha = 1 - shark.sharkDeathProgress;
    context.translate(x, y);
    context.rotate(Math.PI * shark.sharkDeathProgress);
    context.scale(1 + shark.sharkDeathProgress * 0.3, 1 + shark.sharkDeathProgress * 0.3);
    drawSharkBody({
        context,
        height,
        width,
    });
    context.restore();
}

function drawHud({
    context,
    dimensions,
    game,
}: Readonly<{
    context: CanvasRenderingContext2D;
    dimensions: Readonly<CanvasDimensions>;
    game: Readonly<FishGame>;
}>) {
    const inset = clamp({
        maximum: 64,
        minimum: 20,
        value: dimensions.width * 0.04,
    });
    const fontSize = clamp({
        maximum: 16,
        minimum: 12,
        value: dimensions.width * 0.016,
    });

    context.font = `800 ${fontSize}px ui-rounded, system-ui, sans-serif`;
    context.textBaseline = 'top';
    context.textAlign = 'left';
    context.fillStyle = '#effcff';
    context.fillText('TYPE THE', inset, inset);
    context.fillStyle = '#9ef8ff';
    context.fillText('WORD', inset, inset + fontSize * 1.35);
    context.fillStyle = '#effcff';
    context.fillText('TO DEFEND THE DIVE.', inset, inset + fontSize * 2.7);
    context.textAlign = 'right';
    context.fillText('SHARKS CLEARED', dimensions.width - inset, inset);
    context.fillStyle = '#ffd771';
    context.font = `800 ${fontSize * 1.45}px ui-rounded, system-ui, sans-serif`;
    context.fillText(
        `${game.defeatedSharkCount}`,
        dimensions.width - inset,
        inset + fontSize * 1.35,
    );
    context.textAlign = 'left';
    context.fillStyle = 'rgb(220 250 255 / 78%)';
    context.font = `${clamp({
        maximum: 14,
        minimum: 10,
        value: dimensions.width * 0.014,
    })}px ui-monospace, SFMono-Regular, monospace`;
    context.fillText(
        `DEPTH ${24 + game.defeatedSharkCount * 14} M`,
        inset,
        dimensions.height - inset,
    );
}

function drawFishGame({
    backgroundTransition,
    canvas,
    game,
}: Readonly<{
    backgroundTransition: Readonly<BackgroundTransition> | undefined;
    canvas: HTMLCanvasElement;
    game: Readonly<FishGame>;
}>) {
    const dimensions = setCanvasDimensions({
        canvas,
    });
    const context = assertWrap.isDefined(canvas.getContext('2d'));

    context.setTransform(dimensions.pixelRatio, 0, 0, dimensions.pixelRatio, 0, 0);
    context.clearRect(0, 0, dimensions.width, dimensions.height);
    drawWater({
        context,
        defeatedSharkCount: getDisplayedDefeatedSharkCount({
            backgroundTransition,
            game,
        }),
        dimensions,
    });
    game.backgroundFish.forEach((fish) => {
        drawBackgroundFish({
            context,
            dimensions,
            fish,
            verticalPosition: getTransitionedVerticalPosition({
                backgroundTransition,
                sourceVerticalPosition: backgroundTransition?.backgroundFish.find(
                    ({fishId}) => fishId === fish.fishId,
                )?.verticalPosition,
                verticalPosition: fish.verticalPosition,
            }),
        });
    });
    game.bubbles.forEach((bubble) => {
        drawBubble({
            bubble,
            context,
            dimensions,
            verticalPosition: getTransitionedVerticalPosition({
                backgroundTransition,
                sourceVerticalPosition: backgroundTransition?.bubbles.find(
                    ({bubbleId}) => bubbleId === bubble.bubbleId,
                )?.verticalPosition,
                verticalPosition: bubble.verticalPosition,
            }),
        });
    });
    drawDiver({
        context,
        dimensions,
    });
    game.defeatedSharks.forEach((shark) => {
        drawDefeatedShark({
            context,
            dimensions,
            shark,
        });
    });
    game.activeSharks.forEach((shark) => {
        drawActiveShark({
            context,
            dimensions,
            isTypingShark: shark.sharkId === game.typingSharkId,
            shark,
        });
    });
    drawHud({
        context,
        dimensions,
        game,
    });
}

function createTypingListener({state}: Readonly<{state: Partial<FishGameEngineState>}>) {
    return function handleTypingKey(event: KeyboardEvent) {
        if (event.key.length !== 1 || event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }

        const game = state.game;

        if (!game) {
            return;
        }

        const updatedGame = typeFishGameCharacter({
            game,
            key: event.key.toLowerCase(),
        });

        if (updatedGame.defeatedSharkCount > game.defeatedSharkCount) {
            state.backgroundTransition = createBackgroundTransition({
                backgroundTransition: state.backgroundTransition,
                game,
            });
        }

        state.game = updatedGame;
    };
}

const fishGameCanvasMod = defineAnthaMod<FishGameEngineState>({
    executeImmediately: true,
    frequency: {
        ticks: 1_000_000,
    },
    initState: {
        game: createFishGame(),
    },
    modName: 'fish-game-canvas',
    execute({state}) {
        return html`
            <canvas
                aria-label="Fish typing game"
                class="fish-game-canvas"
                style=${css`
                    display: block;
                    height: 100dvh;
                    inset: 0;
                    position: fixed;
                    touch-action: none;
                    width: 100dvw;
                `}
                ${onDomCreated((element) => {
                    assert.instanceOf(element, HTMLCanvasElement);
                    state.canvas = element;
                })}
            ></canvas>
        `;
    },
});

const fishGameMod = defineAnthaMod<FishGameEngineState>({
    modName: 'fish-game',
    execute({hostElement, msSinceLastExecute, state}) {
        if (!state.canvas || !state.game) {
            return SkipExecution;
        }

        if (!state.keyboardListener) {
            hostElement.tabIndex = 0;
            hostElement.focus({
                preventScroll: true,
            });
            state.keyboardListener = createTypingListener({
                state,
            });
            hostElement.addEventListener('keydown', state.keyboardListener);
        }

        state.backgroundTransition = advanceBackgroundTransition({
            backgroundTransition: state.backgroundTransition,
            elapsedMilliseconds: msSinceLastExecute,
        });
        state.game = advanceFishGame({
            elapsedMilliseconds: msSinceLastExecute,
            game: state.game,
        });
        drawFishGame({
            backgroundTransition: state.backgroundTransition,
            canvas: state.canvas,
            game: state.game,
        });

        return undefined;
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
                mods: [
                    fishGameCanvasMod,
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
