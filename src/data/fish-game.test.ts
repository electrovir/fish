import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';

import {
    createFishGame,
    getFishGameWord,
    typeFishGameCharacter,
    type FishGame,
} from './fish-game.js';

function defeatCurrentShark({game}: Readonly<{game: FishGame}>) {
    return getFishGameWord(game)
        .split('')
        .reduce((currentGame, key) => {
            return typeFishGameCharacter({
                game: currentGame,
                key,
            });
        }, game);
}

describe('Fish game word entry', () => {
    it('replaces a shark immediately when the player finishes its word', () => {
        const game = {
            ...createFishGame(),
            activeSharks: [
                {
                    sharkId: 0,
                    sharkPosition: 100,
                    sharkVerticalPosition: 45,
                    typedCharacterCount: 0,
                    word: 'cat',
                },
            ],
            wordIndex: 1,
            wordOrder: [
                'cat',
                'dog',
            ],
        };
        const completedGame = defeatCurrentShark({
            game,
        });

        assert.deepEquals(
            {
                activeSharks: completedGame.activeSharks.map(
                    ({sharkId, sharkPosition, typedCharacterCount, word}) => {
                        return {
                            sharkId,
                            sharkPosition,
                            typedCharacterCount,
                            word,
                        };
                    },
                ),
                defeatedSharkCount: completedGame.defeatedSharkCount,
                typingSharkId: completedGame.typingSharkId,
                wordIndex: completedGame.wordIndex,
            },
            {
                activeSharks: [
                    {
                        sharkId: 1,
                        sharkPosition: 100,
                        typedCharacterCount: 0,
                        word: 'dog',
                    },
                ],
                defeatedSharkCount: 1,
                typingSharkId: undefined,
                wordIndex: 2,
            },
        );
    });

    it('lets the player select and complete any visible shark by its word', () => {
        const game = {
            ...createFishGame(),
            activeSharks: [
                {
                    sharkId: 0,
                    sharkPosition: 60,
                    sharkVerticalPosition: 25,
                    typedCharacterCount: 0,
                    word: 'cat',
                },
                {
                    sharkId: 1,
                    sharkPosition: 90,
                    sharkVerticalPosition: 50,
                    typedCharacterCount: 0,
                    word: 'dog',
                },
            ],
            wordIndex: 2,
            wordOrder: [
                'cat',
                'dog',
                'eel',
            ],
        };
        const startedGame = typeFishGameCharacter({
            game,
            key: 'd',
        });
        const completedGame = [
            'o',
            'g',
        ].reduce((currentGame, key) => {
            return typeFishGameCharacter({
                game: currentGame,
                key,
            });
        }, startedGame);

        assert.deepEquals(
            {
                typedCharacterCounts: startedGame.activeSharks.map(({typedCharacterCount}) => {
                    return typedCharacterCount;
                }),
                typingSharkId: startedGame.typingSharkId,
            },
            {
                typedCharacterCounts: [
                    0,
                    1,
                ],
                typingSharkId: 1,
            },
        );
        assert.deepEquals(
            completedGame.activeSharks.map(({word}) => {
                return word;
            }),
            [
                'cat',
                'eel',
            ],
        );
    });

    it('does not advance a selected word after a wrong key', () => {
        const game = {
            ...createFishGame(),
            activeSharks: [
                {
                    sharkId: 0,
                    sharkPosition: 60,
                    sharkVerticalPosition: 25,
                    typedCharacterCount: 0,
                    word: 'cat',
                },
                {
                    sharkId: 1,
                    sharkPosition: 90,
                    sharkVerticalPosition: 50,
                    typedCharacterCount: 0,
                    word: 'dog',
                },
            ],
        };
        const startedGame = typeFishGameCharacter({
            game,
            key: 'd',
        });
        const updatedGame = typeFishGameCharacter({
            game: startedGame,
            key: 'a',
        });

        assert.deepEquals(
            {
                typedCharacterCounts: updatedGame.activeSharks.map(({typedCharacterCount}) => {
                    return typedCharacterCount;
                }),
                typingSharkId: updatedGame.typingSharkId,
            },
            {
                typedCharacterCounts: [
                    0,
                    1,
                ],
                typingSharkId: 1,
            },
        );
    });

    it('ignores a key that does not begin any visible word', () => {
        const game = {
            ...createFishGame(),
            activeSharks: [
                {
                    sharkId: 0,
                    sharkPosition: 60,
                    sharkVerticalPosition: 25,
                    typedCharacterCount: 0,
                    word: 'cat',
                },
                {
                    sharkId: 1,
                    sharkPosition: 90,
                    sharkVerticalPosition: 50,
                    typedCharacterCount: 0,
                    word: 'dog',
                },
            ],
        };
        const updatedGame = typeFishGameCharacter({
            game,
            key: 'z',
        });

        assert.deepEquals(
            {
                typedCharacterCounts: updatedGame.activeSharks.map(({typedCharacterCount}) => {
                    return typedCharacterCount;
                }),
                typingSharkId: updatedGame.typingSharkId,
            },
            {
                typedCharacterCounts: [
                    0,
                    0,
                ],
                typingSharkId: undefined,
            },
        );
    });
});
