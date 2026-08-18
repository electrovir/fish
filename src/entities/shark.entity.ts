import {Container, FillGradient, Graphics, Sprite, Text} from '@antha/graphics-2d';
import {assertWrap} from '@augment-vir/assert';
import {clamp} from '@augment-vir/common';
import {defineShape} from 'object-shape-tester';
import {FishGameLayer} from '../data/fish-game-layer.js';
import {loadStaticAssetTexture, staticAssetMaxProgress} from '../data/static-asset-texture.js';
import {defineEntity} from '../mods/fish-game-entity.mod.js';

const sharkSvgWidth = 380;
const sharkSvgHeight = 76;
const focusedSharkSvgWidth = 456;
const focusedSharkSvgHeight = 152;
const sharkWidthRatio = 0.36;
const sharkWidthMinimum = 190;
const sharkWidthMaximum = 380;
const sharkHeightRatio = 5;
const sharkSpawnPositionOffsetRatio = 0.25;
const sharkDeathRiseRatio = 0.4;

const sharkParamsShape = defineShape({
    isTypingShark: false,
    sharkId: -1,
    sharkPosition: -1,
    sharkVerticalPosition: -1,
    typedCharacterCount: -1,
    word: '',
});

type SharkParams = typeof sharkParamsShape.runtimeType;

function updateTextStyle({
    fontSize,
    text,
}: Readonly<{
    fontSize: number;
    text: Text;
}>) {
    text.style.fontFamily = [
        'Atkinson Hyperlegible Next',
        'ui-sans-serif',
        'system-ui',
        'sans-serif',
    ];
    text.style.fontSize = fontSize;
    text.style.fontWeight = '900';
    text.style.letterSpacing = fontSize * 0.08;
}

function renderActiveSharkView({
    explosion,
    focusedSharkBody,
    params,
    remainingText,
    sharkBody,
    sharkBodyView,
    sharkWidth,
    typedText,
}: Readonly<{
    explosion: Graphics;
    focusedSharkBody: Sprite;
    params: Readonly<SharkParams>;
    remainingText: Text;
    sharkBody: Sprite;
    sharkBodyView: Container;
    sharkWidth: number;
    typedText: Text;
}>) {
    const sharkHeight = sharkWidth / sharkHeightRatio;
    const fontSize = clamp(sharkWidth * 0.105, {
        max: 40,
        min: 25.6,
    });
    const word = params.word.toUpperCase();
    const typedWord = word.slice(0, params.typedCharacterCount);
    const remainingWord = word.slice(params.typedCharacterCount);
    const typedFontSize = typedWord ? fontSize * 0.9 : fontSize;
    const letterSpacing = fontSize * 0.08;

    sharkBody.width = sharkWidth;
    sharkBody.height = sharkHeight;
    sharkBody.visible = !params.isTypingShark;
    sharkBodyView.alpha = 1;
    sharkBodyView.rotation = 0;
    sharkBodyView.scale.set(1);
    focusedSharkBody.width = (sharkWidth * focusedSharkSvgWidth) / sharkSvgWidth;
    focusedSharkBody.height = (sharkHeight * focusedSharkSvgHeight) / sharkSvgHeight;
    focusedSharkBody.visible = params.isTypingShark;
    updateTextStyle({
        fontSize: typedFontSize,
        text: typedText,
    });
    updateTextStyle({
        fontSize,
        text: remainingText,
    });
    typedText.style.fill = '#7effd8';
    typedText.style.stroke = {
        color: '#0e574e',
        width: Math.max(1, typedFontSize * 0.06),
    };
    remainingText.style.fill = '#07141f';
    remainingText.style.stroke = {
        color: '#f5ffff',
        width: Math.max(1, fontSize * 0.13),
    };
    typedText.text = typedWord;
    remainingText.text = remainingWord;

    const textWidth =
        typedText.width + remainingText.width + (typedWord && remainingWord ? letterSpacing : 0);
    const wordCenterX = sharkWidth * 0.1;
    const firstLetterX = wordCenterX - textWidth / 2;

    explosion.clear();
    explosion.visible = false;
    typedText.visible = true;
    remainingText.visible = true;
    typedText.x = firstLetterX;
    typedText.y = typedWord ? fontSize * 0.1 : 0;
    remainingText.x = typedText.x + typedText.width + (typedWord ? letterSpacing : 0);
    remainingText.y = 0;
}

function renderDefeatedSharkView({
    explosion,
    explosionGradient,
    focusedSharkBody,
    remainingText,
    sharkBody,
    sharkBodyView,
    sharkDeathProgress,
    sharkWidth,
    typedText,
}: Readonly<{
    explosion: Graphics;
    explosionGradient: FillGradient;
    focusedSharkBody: Sprite;
    remainingText: Text;
    sharkBody: Sprite;
    sharkBodyView: Container;
    sharkDeathProgress: number;
    sharkWidth: number;
    typedText: Text;
}>) {
    const explosionRadius = 30 + sharkDeathProgress ** 0.7 * 250;

    sharkBody.width = sharkWidth;
    sharkBody.height = sharkWidth / sharkHeightRatio;
    sharkBody.visible = true;
    focusedSharkBody.visible = false;
    typedText.visible = false;
    remainingText.visible = false;
    explosion.visible = true;
    explosion.clear();
    explosion.alpha = 1 - sharkDeathProgress;
    explosion.circle(0, 0, explosionRadius).fill(explosionGradient);
    sharkBodyView.alpha = 1 - sharkDeathProgress ** 2;
    sharkBodyView.rotation = Math.PI;
    sharkBodyView.scale.set(1);
}

export class SharkEntity extends defineEntity({
    assets: {
        focusedSharkTexture: {
            maxProgress: staticAssetMaxProgress,
            async load({incrementProgressCallback}) {
                return {
                    value: await loadStaticAssetTexture({
                        fileName: 'focused-shark.svg',
                        incrementProgressCallback,
                    }),
                };
            },
        },
        sharkTexture: {
            maxProgress: staticAssetMaxProgress,
            async load({incrementProgressCallback}) {
                return {
                    value: await loadStaticAssetTexture({
                        fileName: 'shark.svg',
                        incrementProgressCallback,
                    }),
                };
            },
        },
    },
    key: 'fish-game-shark',
    paramsShape: sharkParamsShape,
}) {
    protected explosion: Graphics | undefined;
    protected explosionGradient: FillGradient | undefined;
    protected focusedSharkBody: Sprite | undefined;
    protected remainingText: Text | undefined;
    protected sharkBody: Sprite | undefined;
    protected sharkBodyView: Container | undefined;
    protected sharkDeathProgress: number | undefined;
    protected typedText: Text | undefined;

    protected async loadSharkTextures({
        focusedSharkBody,
        rerender,
        sharkBody,
    }: Readonly<{
        focusedSharkBody: Sprite;
        rerender: () => void;
        sharkBody: Sprite;
    }>) {
        const [
            sharkTexture,
            focusedSharkTexture,
        ] = await Promise.all([
            this.getAsset.sharkTexture(),
            this.getAsset.focusedSharkTexture(),
        ]);

        if (this.abortSignal.aborted) {
            return;
        }

        sharkBody.texture = sharkTexture;
        focusedSharkBody.texture = focusedSharkTexture;
        rerender();
    }

    protected renderSharkView(view: Container) {
        const explosion = assertWrap.isDefined(this.explosion);
        const explosionGradient = assertWrap.isDefined(this.explosionGradient);
        const focusedSharkBody = assertWrap.isDefined(this.focusedSharkBody);
        const remainingText = assertWrap.isDefined(this.remainingText);
        const sharkBody = assertWrap.isDefined(this.sharkBody);
        const sharkBodyView = assertWrap.isDefined(this.sharkBodyView);
        const typedText = assertWrap.isDefined(this.typedText);
        const sharkWidth = clamp(this.pixi.screen.width * sharkWidthRatio, {
            max: sharkWidthMaximum,
            min: sharkWidthMinimum,
        });

        view.x =
            (this.params.sharkPosition / 100) * this.pixi.screen.width -
            sharkWidth * sharkSpawnPositionOffsetRatio;
        view.y =
            (this.params.sharkVerticalPosition / 100) * this.pixi.screen.height -
            (this.sharkDeathProgress ?? 0) * this.pixi.screen.height * sharkDeathRiseRatio;

        if (this.sharkDeathProgress == undefined) {
            renderActiveSharkView({
                explosion,
                focusedSharkBody,
                params: this.params,
                remainingText,
                sharkBody,
                sharkBodyView,
                sharkWidth,
                typedText,
            });
            view.zIndex = this.params.isTypingShark
                ? FishGameLayer.ActiveShark + 0.5
                : FishGameLayer.ActiveShark;
        } else {
            renderDefeatedSharkView({
                explosion,
                explosionGradient,
                focusedSharkBody,
                remainingText,
                sharkBody,
                sharkBodyView,
                sharkDeathProgress: this.sharkDeathProgress,
                sharkWidth,
                typedText,
            });
            view.zIndex = FishGameLayer.DefeatedShark;
        }
    }

    public override createView() {
        const view = new Container();
        const explosion = new Graphics();
        const sharkBodyView = new Container();
        const sharkBody = new Sprite();
        const focusedSharkBody = new Sprite();
        const typedText = new Text({
            anchor: {
                x: 0,
                y: 0.5,
            },
        });
        const remainingText = new Text({
            anchor: {
                x: 0,
                y: 0.5,
            },
        });
        const explosionGradient = new FillGradient({
            center: {
                x: 0.5,
                y: 0.5,
            },
            colorStops: [
                {
                    color: '#fffbd0',
                    offset: 0,
                },
                {
                    color: 'rgb(255 202 77 / 90%)',
                    offset: 0.3,
                },
                {
                    color: 'rgb(255 115 57 / 0)',
                    offset: 1,
                },
            ],
            innerRadius: 0,
            outerCenter: {
                x: 0.5,
                y: 0.5,
            },
            outerRadius: 0.5,
            textureSize: 1024,
            textureSpace: 'local',
            type: 'radial',
        });

        view.sortableChildren = true;
        sharkBody.anchor.set(0.5);
        focusedSharkBody.anchor.set(0.5);
        sharkBodyView.zIndex = 0;
        focusedSharkBody.zIndex = 1;
        typedText.zIndex = 2;
        remainingText.zIndex = 2;
        explosion.zIndex = 3;
        sharkBodyView.addChild(sharkBody);
        view.addChild(sharkBodyView, focusedSharkBody, typedText, remainingText, explosion);
        this.explosion = explosion;
        this.explosionGradient = explosionGradient;
        this.focusedSharkBody = focusedSharkBody;
        this.remainingText = remainingText;
        this.sharkBody = sharkBody;
        this.sharkBodyView = sharkBodyView;
        this.typedText = typedText;
        this.renderSharkView(view);
        void this.loadSharkTextures({
            focusedSharkBody,
            rerender: () => {
                this.renderSharkView(view);
            },
            sharkBody,
        });

        return {
            view,
        };
    }

    public triggerDeath({sharkDeathProgress}: Readonly<{sharkDeathProgress: number}>) {
        this.sharkDeathProgress = sharkDeathProgress;
        this.renderSharkView(this.view);
    }

    public override update() {
        this.renderSharkView(this.view);
    }
}
