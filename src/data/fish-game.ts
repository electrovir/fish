import {assertWrap} from '@augment-vir/assert';

export type DefeatedShark = {
    sharkDeathProgress: number;
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

const targetWords = [
    'ace',
    'act',
    'add',
    'age',
    'aid',
    'aim',
    'air',
    'ale',
    'all',
    'and',
    'ant',
    'any',
    'ape',
    'arc',
    'arm',
    'art',
    'ash',
    'ask',
    'ate',
    'bad',
    'bag',
    'ban',
    'bar',
    'bat',
    'bay',
    'bed',
    'bee',
    'big',
    'bin',
    'bit',
    'bob',
    'box',
    'boy',
    'bun',
    'bus',
    'buy',
    'cab',
    'can',
    'cap',
    'car',
    'cat',
    'cod',
    'cow',
    'cup',
    'dad',
    'day',
    'den',
    'did',
    'dig',
    'dim',
    'dip',
    'dog',
    'dot',
    'dry',
    'due',
    'dug',
    'ear',
    'eat',
    'eel',
    'egg',
    'end',
    'era',
    'eve',
    'eye',
    'fan',
    'far',
    'fat',
    'fed',
    'fee',
    'few',
    'fin',
    'fig',
    'fit',
    'fix',
    'fly',
    'fog',
    'for',
    'fox',
    'fun',
    'fur',
    'gap',
    'gas',
    'get',
    'gin',
    'god',
    'got',
    'gum',
    'guy',
    'gym',
    'had',
    'ham',
    'hat',
    'hay',
    'hen',
    'her',
    'hid',
    'him',
    'hip',
    'hit',
    'hop',
    'hot',
    'how',
    'hub',
    'hug',
    'hut',
    'ice',
    'ill',
    'ink',
    'jam',
    'jar',
    'jaw',
    'jet',
    'job',
    'joy',
    'key',
    'kid',
    'kit',
    'lab',
    'lap',
    'law',
    'lay',
    'leg',
    'let',
    'lid',
    'lie',
    'lip',
    'log',
    'lot',
    'low',
    'mad',
    'man',
    'map',
    'mat',
    'may',
    'men',
    'met',
    'mix',
    'mom',
    'mop',
    'mud',
    'mug',
    'nap',
    'net',
    'new',
    'nod',
    'nor',
    'not',
    'now',
    'nut',
    'oak',
    'odd',
    'off',
    'oil',
    'old',
    'one',
    'owl',
    'own',
    'pad',
    'pal',
    'pan',
    'pat',
    'paw',
    'pay',
    'pea',
    'pen',
    'pet',
    'pie',
    'pig',
    'pin',
    'pit',
    'pod',
    'pop',
    'pot',
    'pup',
    'put',
    'ray',
    'rag',
    'ram',
    'ran',
    'rat',
    'raw',
    'red',
    'rib',
    'rid',
    'rim',
    'rip',
    'rob',
    'rod',
    'row',
    'rub',
    'rug',
    'run',
    'sad',
    'saw',
    'say',
    'sea',
    'see',
    'set',
    'sew',
    'she',
    'shy',
    'sip',
    'sit',
    'six',
    'sky',
    'son',
    'sow',
    'spa',
    'spy',
    'sum',
    'sun',
    'tab',
    'tag',
    'tan',
    'tap',
    'tea',
    'ten',
    'the',
    'tie',
    'tin',
    'tip',
    'toe',
    'top',
    'toy',
    'try',
    'tub',
    'two',
    'use',
    'van',
    'vat',
    'vet',
    'was',
    'wax',
    'way',
    'web',
    'wet',
    'who',
    'why',
    'win',
    'wit',
    'won',
    'wow',
    'yes',
    'yet',
    'you',
    'zip',
    'zoo',
] satisfies ReadonlyArray<string>;

const sharkTravelPercentagePerMillisecond = 0.003;
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

function createWordOrder() {
    return targetWords.reduce<ReadonlyArray<string>>((wordOrder, word, index) => {
        return wordOrder.toSpliced(Math.floor(Math.random() * (index + 1)), 0, word);
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
                Math.floor(Math.random() * candidateSharkVerticalLanes.length)
            ],
        ) +
        (Math.random() * 2 - 1) * sharkVerticalJitter
    );
}

function createExtraSharkSpawnInterval() {
    return 900 + Math.random() * 1500;
}

function createSlowSharkSpawnInterval() {
    return 3000 + Math.random() * 1800;
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
        sharkVerticalPosition: createSharkVerticalPosition({activeSharks}),
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
        horizontalPosition: Math.random() * 100,
        opacity: 0.35 + Math.random() * 0.45,
        risePerShark: bubbleRisePercentagePerShark * (0.55 + Math.random() * 0.9),
        size: 7 + Math.random() * 28,
        verticalPosition: minimumVerticalPosition + Math.random() * verticalPositionRange,
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
    return targetWords.slice(0, bubbleCount).map((_word, bubbleIndex) => {
        return createBubble({
            bubbleId: firstBubbleId + bubbleIndex,
            minimumVerticalPosition,
            verticalPositionRange,
        });
    });
}

function createBubbleField() {
    const bubbleCount =
        minimumInitialBubbleCount + Math.floor(Math.random() * initialBubbleCountVariation);

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
        colorHue: Math.round(Math.random() * 360),
        fishId,
        horizontalPosition: horizontalPosition ?? Math.random() * 100,
        horizontalTravelPercentagePerMillisecond: 0.001 + Math.random() * 0.0025,
        isSwimmingLeft: Math.random() < 0.5,
        risePerShark: fishRisePercentagePerShark * (0.45 + Math.random() * 0.85),
        size: 8 + Math.random() * 12,
        verticalPosition: minimumVerticalPosition + Math.random() * verticalPositionRange,
    };
}

function createBackgroundFishField() {
    return {
        backgroundFish: targetWords.slice(0, initialBackgroundFishCount).map((_word, fishId) => {
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
            ...targetWords.slice(0, replacementFishCount).map((_word, fishIndex) => {
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
    }

    if (
        game.rapidClearStreak < rapidClearStreakForExtraSharks ||
        sharkSpawnCountdownMilliseconds > 0
    ) {
        return {
            activeSharks,
            nextSharkId: game.nextSharkId,
            sharkSpawnCountdownMilliseconds,
            wordIndex: game.wordIndex,
        };
    }

    return {
        ...addActiveShark({
            ...game,
            activeSharks,
        }),
        sharkSpawnCountdownMilliseconds: createExtraSharkSpawnInterval(),
    };
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
                7,
                shark.sharkPosition - elapsedMilliseconds * sharkTravelPercentagePerMillisecond,
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
