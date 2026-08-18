import {assertWrap} from '@augment-vir/assert';
import {clamp, randomBoolean, randomInteger} from '@augment-vir/common';
import {typingWords} from './words.js';

export type DefeatedShark = {
    sharkDeathProgress: number;
    sharkId: number;
    sharkPosition: number;
    sharkVerticalPosition: number;
};

export type ActiveShark = {
    sharkId: number;
    sharkPosition: number;
    sharkVerticalPosition: number;
    typedCharacterCount: number;
    word: string;
};

export type FishGameBubble = {
    bubbleId: number;
    horizontalPosition: number;
    opacity: number;
    risePerShark: number;
    size: number;
    verticalPosition: number;
};

export type BackgroundFish = {
    colorHue: number;
    fishId: number;
    horizontalPosition: number;
    horizontalTravelPercentagePerMillisecond: number;
    isSwimmingLeft: boolean;
    risePerShark: number;
    size: number;
    verticalPosition: number;
};

export type FishGame = {
    activeSharks: ReadonlyArray<ActiveShark>;
    backgroundFish: ReadonlyArray<BackgroundFish>;
    bubbles: ReadonlyArray<FishGameBubble>;
    defeatedSharkCount: number;
    defeatedSharks: ReadonlyArray<DefeatedShark>;
    millisecondsSinceLastSharkClear: number;
    nextBubbleId: number;
    nextBackgroundFishId: number;
    nextSharkId: number;
    rapidClearStreak: number;
    sharkSpawnCountdownMilliseconds: number | undefined;
    typingSharkId: number | undefined;
    wordIndex: number;
    wordOrder: ReadonlyArray<string>;
};

const sharkTravelPercentagePerMillisecond = 0.003;
const sharkSlowdownExponent = 2.5;
const sharkDeathDurationMilliseconds = 1400;
const sharkVerticalLanes = [
    8,
    19,
    30,
    41,
    52,
    63,
    74,
    85,
] satisfies ReadonlyArray<number>;
const minimumSharkVerticalSeparation = 8;
const sharkVerticalJitter = 1;
const sharkSpawnPosition = 100;
const sharkMinimumPosition = 7;
const sharkSpawnHorizontalOverlapPosition = 65;
const rapidClearWindowMilliseconds = 1800;
const rapidClearStreakForExtraSharks = 2;
const maximumActiveSharkCount = 8;
const sharkNearDiverPosition = 26;
const playerFallingBehindMilliseconds = 4200;
const bubbleRisePercentagePerShark = 9;
const bubbleExitPosition = -8;
const minimumInitialBubbleCount = 18;
const initialBubbleCountVariation = 12;
const initialBackgroundFishCount = 8;
const fishExitPosition = -8;
const fishHorizontalExitPosition = 108;
const fishRisePercentagePerShark = 8;
const randomNumberPrecision = 1_000_000;

function randomNumber({maximum, minimum}: Readonly<{maximum: number; minimum: number}>) {
    return (
        minimum +
        ((maximum - minimum) *
            randomInteger({
                max: randomNumberPrecision,
                min: 0,
            })) /
            randomNumberPrecision
    );
}

function createWordOrder() {
    return typingWords.reduce<ReadonlyArray<string>>((wordOrder, word, index) => {
        return wordOrder.toSpliced(
            randomInteger({
                max: index,
                min: 0,
            }),
            0,
            word,
        );
    }, []);
}

function createSharkVerticalPosition({activeSharks}: Readonly<Pick<FishGame, 'activeSharks'>>) {
    const sharksOverlappingSpawnArea = activeSharks.filter(({sharkPosition}) => {
        return sharkPosition >= sharkSpawnHorizontalOverlapPosition;
    });
    const availableSharkVerticalLanes = sharkVerticalLanes.filter((sharkVerticalLane) => {
        return sharksOverlappingSpawnArea.every(({sharkVerticalPosition}) => {
            return (
                Math.abs(sharkVerticalLane - sharkVerticalPosition) >=
                minimumSharkVerticalSeparation
            );
        });
    });
    const candidateSharkVerticalLanes =
        availableSharkVerticalLanes.length > 0 ? availableSharkVerticalLanes : sharkVerticalLanes;

    return (
        assertWrap.isDefined(
            candidateSharkVerticalLanes[
                randomInteger({
                    max: candidateSharkVerticalLanes.length - 1,
                    min: 0,
                })
            ],
        ) +
        randomNumber({
            maximum: sharkVerticalJitter,
            minimum: -sharkVerticalJitter,
        })
    );
}

function createExtraSharkSpawnInterval() {
    return randomNumber({
        maximum: 2400,
        minimum: 900,
    });
}

function createSlowSharkSpawnInterval() {
    return randomNumber({
        maximum: 4800,
        minimum: 3000,
    });
}

function getSharkTravelSpeedRatio({sharkPosition}: Readonly<Pick<ActiveShark, 'sharkPosition'>>) {
    const sharkTravelProgress = clamp(
        (sharkSpawnPosition - sharkPosition) / (sharkSpawnPosition - sharkMinimumPosition),
        {
            max: 1,
            min: 0,
        },
    );

    return Math.exp(-sharkSlowdownExponent * sharkTravelProgress);
}

function createActiveShark({
    activeSharks,
    sharkId,
    word,
}: Readonly<{
    activeSharks: ReadonlyArray<ActiveShark>;
    sharkId: number;
    word: string;
}>) {
    return {
        sharkId,
        sharkPosition: sharkSpawnPosition,
        sharkVerticalPosition: createSharkVerticalPosition({
            activeSharks,
        }),
        typedCharacterCount: 0,
        word,
    };
}

function createBubble({
    bubbleId,
    minimumVerticalPosition,
    verticalPositionRange,
}: Readonly<{
    bubbleId: number;
    minimumVerticalPosition: number;
    verticalPositionRange: number;
}>): FishGameBubble {
    return {
        bubbleId,
        horizontalPosition: randomNumber({
            maximum: 100,
            minimum: 0,
        }),
        opacity: randomNumber({
            maximum: 0.4,
            minimum: 0.12,
        }),
        risePerShark:
            bubbleRisePercentagePerShark *
            randomNumber({
                maximum: 1.45,
                minimum: 0.55,
            }),
        size: randomNumber({
            maximum: 35,
            minimum: 7,
        }),
        verticalPosition: randomNumber({
            maximum: minimumVerticalPosition + verticalPositionRange,
            minimum: minimumVerticalPosition,
        }),
    };
}

function createBubbles({
    bubbleCount,
    firstBubbleId,
    minimumVerticalPosition,
    verticalPositionRange,
}: Readonly<{
    bubbleCount: number;
    firstBubbleId: number;
    minimumVerticalPosition: number;
    verticalPositionRange: number;
}>) {
    return typingWords.slice(0, bubbleCount).map((_word, bubbleIndex) => {
        return createBubble({
            bubbleId: firstBubbleId + bubbleIndex,
            minimumVerticalPosition,
            verticalPositionRange,
        });
    });
}

function createBubbleField() {
    const bubbleCount = randomInteger({
        max: minimumInitialBubbleCount + initialBubbleCountVariation - 1,
        min: minimumInitialBubbleCount,
    });

    return {
        bubbles: createBubbles({
            bubbleCount,
            firstBubbleId: 0,
            minimumVerticalPosition: 0,
            verticalPositionRange: 100,
        }),
        nextBubbleId: bubbleCount,
    };
}

function createBackgroundFish({
    fishId,
    horizontalPosition,
    minimumVerticalPosition,
    verticalPositionRange,
}: Readonly<{
    fishId: number;
    horizontalPosition?: number | undefined;
    minimumVerticalPosition: number;
    verticalPositionRange: number;
}>): BackgroundFish {
    return {
        colorHue: randomInteger({
            max: 360,
            min: 0,
        }),
        fishId,
        horizontalPosition:
            horizontalPosition ??
            randomNumber({
                maximum: 100,
                minimum: 0,
            }),
        horizontalTravelPercentagePerMillisecond: randomNumber({
            maximum: 0.0035,
            minimum: 0.001,
        }),
        isSwimmingLeft: randomBoolean(50),
        risePerShark:
            fishRisePercentagePerShark *
            randomNumber({
                maximum: 1.3,
                minimum: 0.45,
            }),
        size: randomNumber({
            maximum: 20,
            minimum: 8,
        }),
        verticalPosition: randomNumber({
            maximum: minimumVerticalPosition + verticalPositionRange,
            minimum: minimumVerticalPosition,
        }),
    };
}

function createBackgroundFishField() {
    return {
        backgroundFish: typingWords.slice(0, initialBackgroundFishCount).map((_word, fishId) => {
            return createBackgroundFish({
                fishId,
                minimumVerticalPosition: 0,
                verticalPositionRange: 100,
            });
        }),
        nextBackgroundFishId: initialBackgroundFishCount,
    };
}

function advanceBackgroundFishField({
    backgroundFish,
    nextBackgroundFishId,
}: Readonly<Pick<FishGame, 'backgroundFish' | 'nextBackgroundFishId'>>) {
    const raisedBackgroundFish = backgroundFish
        .map((fish) => {
            return {
                ...fish,
                verticalPosition: fish.verticalPosition - fish.risePerShark,
            };
        })
        .filter(({verticalPosition}) => verticalPosition > fishExitPosition);
    const replacementFishCount = backgroundFish.length - raisedBackgroundFish.length;

    return {
        backgroundFish: [
            ...raisedBackgroundFish,
            ...typingWords.slice(0, replacementFishCount).map((_word, fishIndex) => {
                return createBackgroundFish({
                    fishId: nextBackgroundFishId + fishIndex,
                    minimumVerticalPosition: 104,
                    verticalPositionRange: 10,
                });
            }),
        ],
        nextBackgroundFishId: nextBackgroundFishId + replacementFishCount,
    };
}

function advanceBackgroundFishSwimming({
    backgroundFish,
    elapsedMilliseconds,
}: Readonly<
    Pick<FishGame, 'backgroundFish'> & {
        elapsedMilliseconds: number;
    }
>) {
    return backgroundFish.map((fish) => {
        const horizontalPosition =
            fish.horizontalPosition +
            (fish.isSwimmingLeft ? -1 : 1) *
                fish.horizontalTravelPercentagePerMillisecond *
                elapsedMilliseconds;
        const hasSwumOffScreen =
            horizontalPosition < -fishHorizontalExitPosition ||
            horizontalPosition > fishHorizontalExitPosition;

        return hasSwumOffScreen
            ? {
                  ...fish,
                  horizontalPosition: fish.isSwimmingLeft
                      ? fishHorizontalExitPosition
                      : -fishHorizontalExitPosition,
              }
            : {
                  ...fish,
                  horizontalPosition,
              };
    });
}

function advanceBubbleField({
    bubbles,
    nextBubbleId,
}: Readonly<Pick<FishGame, 'bubbles' | 'nextBubbleId'>>) {
    const raisedBubbles = bubbles.map((bubble) => {
        return {
            ...bubble,
            verticalPosition: bubble.verticalPosition - bubble.risePerShark,
        };
    });
    const remainingBubbles = raisedBubbles.filter(({verticalPosition}) => {
        return verticalPosition > bubbleExitPosition;
    });
    const replacementBubbleCount = raisedBubbles.length - remainingBubbles.length;

    return {
        bubbles: [
            ...remainingBubbles,
            ...createBubbles({
                bubbleCount: replacementBubbleCount,
                firstBubbleId: nextBubbleId,
                minimumVerticalPosition: 104,
                verticalPositionRange: 10,
            }),
        ],
        nextBubbleId: nextBubbleId + replacementBubbleCount,
    };
}

function selectNextSharkWord({
    activeSharks,
    wordIndex,
    wordOrder,
}: Readonly<Pick<FishGame, 'activeSharks' | 'wordIndex' | 'wordOrder'>>) {
    const activeStartingLetters = activeSharks.map(({word}) => {
        return word[0];
    });
    const candidateWords = wordOrder.map((_word, offset) => {
        return assertWrap.isDefined(wordOrder[(wordIndex + offset) % wordOrder.length]);
    });
    const word = assertWrap.isDefined(
        candidateWords.find((candidateWord) => {
            return !activeStartingLetters.includes(candidateWord[0]);
        }),
    );

    return {
        word,
        wordIndex: wordIndex + candidateWords.indexOf(word) + 1,
    };
}

function addActiveShark({
    activeSharks,
    nextSharkId,
    wordIndex,
    wordOrder,
}: Readonly<Pick<FishGame, 'activeSharks' | 'nextSharkId' | 'wordIndex' | 'wordOrder'>>) {
    const nextSharkWord = selectNextSharkWord({
        activeSharks,
        wordIndex,
        wordOrder,
    });

    return {
        activeSharks: [
            ...activeSharks,
            createActiveShark({
                activeSharks,
                sharkId: nextSharkId,
                word: nextSharkWord.word,
            }),
        ],
        nextSharkId: nextSharkId + 1,
        wordIndex: nextSharkWord.wordIndex,
    };
}

function isPlayerFallingBehind({
    activeSharks,
    millisecondsSinceLastSharkClear,
}: Readonly<Pick<FishGame, 'activeSharks' | 'millisecondsSinceLastSharkClear'>>) {
    return (
        activeSharks.length >= maximumActiveSharkCount ||
        activeSharks.some(({sharkPosition}) => sharkPosition <= sharkNearDiverPosition) ||
        millisecondsSinceLastSharkClear >= playerFallingBehindMilliseconds
    );
}

function advanceSharkSpawning({
    activeSharks,
    elapsedMilliseconds,
    game,
    millisecondsSinceLastSharkClear,
}: Readonly<{
    activeSharks: ReadonlyArray<ActiveShark>;
    elapsedMilliseconds: number;
    game: Readonly<FishGame>;
    millisecondsSinceLastSharkClear: number;
}>) {
    if (game.sharkSpawnCountdownMilliseconds == undefined) {
        return {
            activeSharks,
            nextSharkId: game.nextSharkId,
            sharkSpawnCountdownMilliseconds: undefined,
            wordIndex: game.wordIndex,
        };
    }

    const sharkSpawnCountdownMilliseconds =
        game.sharkSpawnCountdownMilliseconds - elapsedMilliseconds;

    if (
        isPlayerFallingBehind({
            activeSharks,
            millisecondsSinceLastSharkClear,
        })
    ) {
        return {
            activeSharks,
            nextSharkId: game.nextSharkId,
            sharkSpawnCountdownMilliseconds:
                sharkSpawnCountdownMilliseconds <= 0
                    ? createSlowSharkSpawnInterval()
                    : sharkSpawnCountdownMilliseconds,
            wordIndex: game.wordIndex,
        };
    } else if (
        game.rapidClearStreak < rapidClearStreakForExtraSharks ||
        sharkSpawnCountdownMilliseconds > 0
    ) {
        return {
            activeSharks,
            nextSharkId: game.nextSharkId,
            sharkSpawnCountdownMilliseconds,
            wordIndex: game.wordIndex,
        };
    } else {
        return {
            ...addActiveShark({
                ...game,
                activeSharks,
            }),
            sharkSpawnCountdownMilliseconds: createExtraSharkSpawnInterval(),
        };
    }
}

export function createFishGame(): FishGame {
    const wordOrder = createWordOrder();

    return {
        activeSharks: [
            createActiveShark({
                activeSharks: [],
                sharkId: 0,
                word: assertWrap.isDefined(wordOrder[0]),
            }),
        ],
        ...createBackgroundFishField(),
        ...createBubbleField(),
        defeatedSharkCount: 0,
        defeatedSharks: [],
        millisecondsSinceLastSharkClear: rapidClearWindowMilliseconds,
        nextSharkId: 1,
        rapidClearStreak: 0,
        sharkSpawnCountdownMilliseconds: undefined,
        typingSharkId: undefined,
        wordIndex: 1,
        wordOrder,
    };
}

export function getFishGameTypingShark({
    activeSharks,
    typingSharkId,
}: Readonly<Pick<FishGame, 'activeSharks' | 'typingSharkId'>>) {
    return activeSharks.find(({sharkId}) => sharkId === typingSharkId);
}

export function getFishGameWord({
    activeSharks,
    typingSharkId,
}: Readonly<Pick<FishGame, 'activeSharks' | 'typingSharkId'>>) {
    return (
        getFishGameTypingShark({
            activeSharks,
            typingSharkId,
        }) || assertWrap.isDefined(activeSharks[0])
    ).word;
}

export function advanceFishGame({
    game,
    elapsedMilliseconds,
}: Readonly<{
    game: Readonly<FishGame>;
    elapsedMilliseconds: number;
}>): FishGame {
    const activeSharks = game.activeSharks.map((shark) => {
        return {
            ...shark,
            sharkPosition: Math.max(
                sharkMinimumPosition,
                shark.sharkPosition -
                    elapsedMilliseconds *
                        sharkTravelPercentagePerMillisecond *
                        getSharkTravelSpeedRatio({
                            sharkPosition: shark.sharkPosition,
                        }),
            ),
        };
    });
    const millisecondsSinceLastSharkClear =
        game.millisecondsSinceLastSharkClear + elapsedMilliseconds;

    return {
        ...game,
        ...advanceSharkSpawning({
            activeSharks,
            elapsedMilliseconds,
            game,
            millisecondsSinceLastSharkClear,
        }),
        backgroundFish: advanceBackgroundFishSwimming({
            backgroundFish: game.backgroundFish,
            elapsedMilliseconds,
        }),
        defeatedSharks: game.defeatedSharks
            .map((defeatedShark) => {
                return {
                    ...defeatedShark,
                    sharkDeathProgress:
                        defeatedShark.sharkDeathProgress +
                        elapsedMilliseconds / sharkDeathDurationMilliseconds,
                };
            })
            .filter(({sharkDeathProgress}) => sharkDeathProgress < 1),
        millisecondsSinceLastSharkClear,
    };
}

export function typeFishGameCharacter({
    game,
    key,
}: Readonly<{
    game: Readonly<FishGame>;
    key: string;
}>): FishGame {
    const typingShark =
        getFishGameTypingShark(game) ||
        game.activeSharks.find(({word}) => {
            return word[0] === key;
        });

    if (!typingShark) {
        return game;
    }

    const typedCharacterCount = typingShark.typedCharacterCount + 1;

    if (key !== typingShark.word[typingShark.typedCharacterCount]) {
        return game;
    }

    return typedCharacterCount === typingShark.word.length
        ? {
              ...game,
              ...advanceBackgroundFishField(game),
              ...advanceBubbleField(game),
              ...addActiveShark({
                  ...game,
                  activeSharks: game.activeSharks.filter(({sharkId}) => {
                      return sharkId !== typingShark.sharkId;
                  }),
              }),
              defeatedSharkCount: game.defeatedSharkCount + 1,
              defeatedSharks: [
                  ...game.defeatedSharks,
                  {
                      sharkDeathProgress: 0,
                      sharkId: typingShark.sharkId,
                      sharkPosition: typingShark.sharkPosition,
                      sharkVerticalPosition: typingShark.sharkVerticalPosition,
                  },
              ],
              millisecondsSinceLastSharkClear: 0,
              rapidClearStreak:
                  game.millisecondsSinceLastSharkClear < rapidClearWindowMilliseconds
                      ? game.rapidClearStreak + 1
                      : 0,
              sharkSpawnCountdownMilliseconds:
                  game.millisecondsSinceLastSharkClear < rapidClearWindowMilliseconds &&
                  game.rapidClearStreak + 1 >= rapidClearStreakForExtraSharks
                      ? (game.sharkSpawnCountdownMilliseconds ?? createExtraSharkSpawnInterval())
                      : undefined,
              typingSharkId: undefined,
          }
        : {
              ...game,
              activeSharks: game.activeSharks.map((shark) => {
                  return shark.sharkId === typingShark.sharkId
                      ? {
                            ...shark,
                            typedCharacterCount,
                        }
                      : shark;
              }),
              typingSharkId: typingShark.sharkId,
          };
}
