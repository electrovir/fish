import {type AnthaEntity2dModState} from '@antha/entity-2d';
import {type AnthaReadRawInputModState} from '@antha/input';
import {clamp} from '@augment-vir/common';
import {type BackgroundFish, type FishGame, type FishGameBubble} from './fish-game.js';

export type BackgroundTransition = {
    backgroundFish: ReadonlyArray<Pick<BackgroundFish, 'fishId' | 'verticalPosition'>>;
    bubbles: ReadonlyArray<Pick<FishGameBubble, 'bubbleId' | 'verticalPosition'>>;
    defeatedSharkCount: number;
    elapsedMilliseconds: number;
};

export type FishGameRenderState = {
    backgroundTransition: BackgroundTransition | undefined;
    game: FishGame;
};

export type FishGameEngineState = AnthaEntity2dModState<FishGameRenderState> &
    AnthaReadRawInputModState;

const backgroundTransitionDurationMilliseconds = 900;

function getBackgroundTransitionProgress({
    backgroundTransition,
}: Readonly<{backgroundTransition: Readonly<BackgroundTransition> | undefined}>) {
    const progress = backgroundTransition
        ? clamp(
              backgroundTransition.elapsedMilliseconds / backgroundTransitionDurationMilliseconds,
              {
                  max: 1,
                  min: 0,
              },
          )
        : 1;

    return 1 - (1 - progress) ** 3;
}

export function getTransitionedVerticalPosition({
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

export function getDisplayedDefeatedSharkCount({
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

export function createBackgroundTransition({
    backgroundTransition,
    game,
}: Readonly<{
    backgroundTransition: Readonly<BackgroundTransition> | undefined;
    game: Readonly<FishGame>;
}>) {
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

export function advanceBackgroundTransition({
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
