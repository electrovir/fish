import {defineAnthaMod, SkipExecution} from '@antha/engine';
import {type PixiApplication} from '@antha/graphics-2d';
import {InputDirection} from '@antha/input';
import {clamp, getObjectTypedValues} from '@augment-vir/common';
import {html} from 'element-vir';
import {
    advanceBackgroundTransition,
    createBackgroundTransition,
    getDisplayedDefeatedSharkCount,
    getTransitionedVerticalPosition,
    type FishGameEngineState,
} from '../data/fish-game-render-state.js';
import {
    advanceFishGame,
    createFishGame,
    typeFishGameCharacter,
    type ActiveShark,
    type BackgroundFish,
    type DefeatedShark,
    type FishGameBubble,
} from '../data/fish-game.js';
import {BackgroundFishEntity} from '../entities/background-fish.entity.js';
import {BubbleEntity} from '../entities/bubble.entity.js';
import {DiverEntity} from '../entities/diver.entity.js';
import {SharkEntity} from '../entities/shark.entity.js';
import {WaterEntity} from '../entities/water.entity.js';
import {FishGameHud} from '../ui/elements/fish-game-hud.element.js';

type FishGameDimensions = {
    height: number;
    width: number;
};

const keyboardInputPrefix = 'button-Key';
const maximumBackgroundDarknessDefeatedSharkCount = 30;

function getFishGameDimensions({
    pixiApplication,
}: Readonly<{pixiApplication: PixiApplication}>): FishGameDimensions {
    return {
        height: Math.max(pixiApplication.screen.height, 1),
        width: Math.max(pixiApplication.screen.width, 1),
    };
}

function updateEntityParams({
    entity,
    params,
}: Readonly<{
    entity: {
        params: object;
    };
    params: object;
}>) {
    Object.assign(entity.params, params);
}

function getTypedCharacter({
    rawInputs,
}: Readonly<{
    rawInputs: FishGameEngineState['rawInputs'] | undefined;
}>) {
    const newlyPressedKeyInput = getObjectTypedValues(rawInputs?.keyboard || {}).find(
        ({direction, duration, inputName}) => {
            return (
                direction === InputDirection.Positive &&
                duration.milliseconds === 0 &&
                inputName.startsWith(keyboardInputPrefix)
            );
        },
    );

    return newlyPressedKeyInput
        ? newlyPressedKeyInput.inputName.slice(keyboardInputPrefix.length).toLowerCase()
        : undefined;
}

function getBubbleEntityParams({
    backgroundTransition,
    bubble,
    dimensions,
}: Readonly<{
    backgroundTransition: FishGameEngineState['backgroundTransition'];
    bubble: Readonly<FishGameBubble>;
    dimensions: Readonly<FishGameDimensions>;
}>) {
    return {
        bubbleId: bubble.bubbleId,
        opacity: bubble.opacity,
        size: bubble.size,
        x: (bubble.horizontalPosition / 100) * dimensions.width,
        y:
            (getTransitionedVerticalPosition({
                backgroundTransition,
                sourceVerticalPosition: backgroundTransition?.bubbles.find(
                    ({bubbleId}) => bubbleId === bubble.bubbleId,
                )?.verticalPosition,
                verticalPosition: bubble.verticalPosition,
            }) /
                100) *
            dimensions.height,
    };
}

function getBackgroundFishEntityParams({
    backgroundTransition,
    dimensions,
    fish,
}: Readonly<{
    backgroundTransition: FishGameEngineState['backgroundTransition'];
    dimensions: Readonly<FishGameDimensions>;
    fish: Readonly<BackgroundFish>;
}>) {
    return {
        colorHue: fish.colorHue,
        fishId: fish.fishId,
        isSwimmingLeft: fish.isSwimmingLeft,
        size: fish.size,
        x: (fish.horizontalPosition / 100) * dimensions.width,
        y:
            (getTransitionedVerticalPosition({
                backgroundTransition,
                sourceVerticalPosition: backgroundTransition?.backgroundFish.find(
                    ({fishId}) => fishId === fish.fishId,
                )?.verticalPosition,
                verticalPosition: fish.verticalPosition,
            }) /
                100) *
            dimensions.height,
    };
}

function getActiveSharkEntityParams({
    isTypingShark,
    shark,
}: Readonly<{
    isTypingShark: boolean;
    shark: Readonly<ActiveShark>;
}>) {
    return {
        isTypingShark,
        sharkId: shark.sharkId,
        sharkPosition: shark.sharkPosition,
        sharkVerticalPosition: shark.sharkVerticalPosition,
        typedCharacterCount: shark.typedCharacterCount,
        word: shark.word,
    };
}

function getDefeatedSharkEntityParams({
    shark,
}: Readonly<{
    shark: Readonly<DefeatedShark>;
}>) {
    return {
        isTypingShark: false,
        sharkId: shark.sharkId,
        sharkPosition: shark.sharkPosition,
        sharkVerticalPosition: shark.sharkVerticalPosition,
        typedCharacterCount: 0,
        word: '',
    };
}

async function synchronizeFishGameEntities({
    backgroundTransition,
    entityStore,
    game,
    pixiApplication,
}: Readonly<{
    backgroundTransition: FishGameEngineState['backgroundTransition'];
    entityStore: FishGameEngineState['entityStore'];
    game: FishGameEngineState['game'];
    pixiApplication: PixiApplication;
}>) {
    const dimensions = getFishGameDimensions({
        pixiApplication,
    });
    const waterEntity = [...entityStore.getEntities(WaterEntity)].find(({isDestroyed}) => {
        return !isDestroyed;
    });

    pixiApplication.stage.sortableChildren = true;
    if (waterEntity) {
        updateEntityParams({
            entity: waterEntity,
            params: {
                darknessRatio: clamp(
                    getDisplayedDefeatedSharkCount({
                        backgroundTransition,
                        game,
                    }) / maximumBackgroundDarknessDefeatedSharkCount,
                    {
                        max: 1,
                        min: 0,
                    },
                ),
                height: dimensions.height,
                width: dimensions.width,
            },
        });
    } else {
        await entityStore.addEntity(WaterEntity, {
            darknessRatio: clamp(
                game.defeatedSharkCount / maximumBackgroundDarknessDefeatedSharkCount,
                {
                    max: 1,
                    min: 0,
                },
            ),
            height: dimensions.height,
            width: dimensions.width,
        });
    }

    const hasDiverEntity = [...entityStore.getEntities(DiverEntity)].some(({isDestroyed}) => {
        return !isDestroyed;
    });

    if (!hasDiverEntity) {
        await entityStore.addEntity(DiverEntity);
    }

    const bubbleEntities = [...entityStore.getEntities(BubbleEntity)];

    await Promise.all(
        game.bubbles.map(async (bubble) => {
            const bubbleEntity = bubbleEntities.find(({isDestroyed, params}) => {
                return !isDestroyed && params.bubbleId === bubble.bubbleId;
            });
            const bubbleParams = getBubbleEntityParams({
                backgroundTransition,
                bubble,
                dimensions,
            });

            if (bubbleEntity) {
                updateEntityParams({
                    entity: bubbleEntity,
                    params: bubbleParams,
                });
            } else {
                await entityStore.addEntity(BubbleEntity, bubbleParams);
            }
        }),
    );
    bubbleEntities.forEach((bubbleEntity) => {
        if (!game.bubbles.some(({bubbleId}) => bubbleId === bubbleEntity.params.bubbleId)) {
            bubbleEntity.destroy();
        }
    });

    const backgroundFishEntities = [...entityStore.getEntities(BackgroundFishEntity)];

    await Promise.all(
        game.backgroundFish.map(async (fish) => {
            const backgroundFishEntity = backgroundFishEntities.find(({isDestroyed, params}) => {
                return !isDestroyed && params.fishId === fish.fishId;
            });
            const backgroundFishParams = getBackgroundFishEntityParams({
                backgroundTransition,
                dimensions,
                fish,
            });

            if (backgroundFishEntity) {
                updateEntityParams({
                    entity: backgroundFishEntity,
                    params: backgroundFishParams,
                });
            } else {
                await entityStore.addEntity(BackgroundFishEntity, backgroundFishParams);
            }
        }),
    );
    backgroundFishEntities.forEach((backgroundFishEntity) => {
        if (
            !game.backgroundFish.some(({fishId}) => fishId === backgroundFishEntity.params.fishId)
        ) {
            backgroundFishEntity.destroy();
        }
    });

    const sharkEntities = [...entityStore.getEntities(SharkEntity)];

    await Promise.all(
        game.activeSharks.map(async (shark) => {
            const sharkEntity = sharkEntities.find(({isDestroyed, params}) => {
                return !isDestroyed && params.sharkId === shark.sharkId;
            });
            const sharkParams = getActiveSharkEntityParams({
                isTypingShark: shark.sharkId === game.typingSharkId,
                shark,
            });

            if (sharkEntity) {
                updateEntityParams({
                    entity: sharkEntity,
                    params: sharkParams,
                });
            } else {
                await entityStore.addEntity(SharkEntity, sharkParams);
            }
        }),
    );

    await Promise.all(
        game.defeatedSharks.map(async (shark) => {
            const sharkEntity = sharkEntities.find(({isDestroyed, params}) => {
                return !isDestroyed && params.sharkId === shark.sharkId;
            });
            const sharkParams = getDefeatedSharkEntityParams({
                shark,
            });

            if (sharkEntity) {
                updateEntityParams({
                    entity: sharkEntity,
                    params: sharkParams,
                });
                sharkEntity.triggerDeath({
                    sharkDeathProgress: shark.sharkDeathProgress,
                });
            } else {
                const defeatedSharkEntity = await entityStore.addEntity(SharkEntity, sharkParams);

                defeatedSharkEntity.triggerDeath({
                    sharkDeathProgress: shark.sharkDeathProgress,
                });
            }
        }),
    );
    sharkEntities.forEach((sharkEntity) => {
        if (
            !game.activeSharks.some(({sharkId}) => sharkId === sharkEntity.params.sharkId) &&
            !game.defeatedSharks.some(({sharkId}) => sharkId === sharkEntity.params.sharkId)
        ) {
            sharkEntity.destroy();
        }
    });
}

export const fishGameMod = defineAnthaMod<FishGameEngineState>({
    initState: {
        game: createFishGame(),
    },
    modName: 'fish-game',
    async execute({msSinceLastExecute, state}) {
        const game = state.game;
        const pixiApplication = state.pixi?.pixiApplication;
        const entityStore = state.entityStore;

        if (!game || !pixiApplication || !entityStore) {
            return SkipExecution;
        }

        const typedCharacter = getTypedCharacter({
            rawInputs: state.rawInputs,
        });
        const gameAfterInput = typedCharacter
            ? typeFishGameCharacter({
                  game,
                  key: typedCharacter,
              })
            : game;

        if (gameAfterInput.defeatedSharkCount > game.defeatedSharkCount) {
            state.backgroundTransition = createBackgroundTransition({
                backgroundTransition: state.backgroundTransition,
                game,
            });
        }

        state.backgroundTransition = advanceBackgroundTransition({
            backgroundTransition: state.backgroundTransition,
            elapsedMilliseconds: msSinceLastExecute,
        });
        const updatedGame = advanceFishGame({
            elapsedMilliseconds: msSinceLastExecute,
            game: gameAfterInput,
        });
        state.game = updatedGame;
        await synchronizeFishGameEntities({
            backgroundTransition: state.backgroundTransition,
            entityStore,
            game: updatedGame,
            pixiApplication,
        });

        return html`
            <${FishGameHud.assign({
                defeatedSharkCount: updatedGame.defeatedSharkCount,
            })}></${FishGameHud}>
        `;
    },
});
