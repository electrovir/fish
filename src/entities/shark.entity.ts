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
const sharkDeathRiseRatio = 1.15;

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
    wordBackground,
}: Readonly<{
    explosion: Graphics;
    focusedSharkBody: Sprite;
    params: Readonly<SharkParams>;
    remainingText: Text;
    sharkBody: Sprite;
    sharkBodyView: Container;
    sharkWidth: number;
    typedText: Text;
    wordBackground: Graphics;
}>) {
    const sharkHeight = sharkWidth / sharkHeightRatio;
    const fontSize = clamp(sharkWidth * 0.105, {
        max: 40,
        min: 25.6,
    });
    const word = params.word.toUpperCase();
    const typedWord = word.slice(0, params.typedCharacterCount);
    const remainingWord = word.slice(params.typedCharacterCount);
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
        fontSize,
        text: typedText,
    });
    updateTextStyle({
        fontSize,
        text: remainingText,
    });
    typedText.style.fill = '#7effd8';
    remainingText.style.fill = '#f3ffff';
    typedText.text = typedWord;
    remainingText.text = remainingWord;

    const textWidth =
        typedText.width + remainingText.width + (typedWord && remainingWord ? letterSpacing : 0);
    const boxWidth = Math.max(textWidth + fontSize * 0.64, fontSize * 3.2);
    const boxHeight = fontSize * 1.22;
    const wordCenterX = sharkWidth * 0.1;
    const firstLetterX = wordCenterX - textWidth / 2;

    explosion.clear();
    explosion.visible = false;
    wordBackground.visible = true;
    typedText.visible = true;
    remainingText.visible = true;
    wordBackground.clear();
    wordBackground
        .roundRect(wordCenterX - boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, boxHeight / 2)
        .fill({
            alpha: params.isTypingShark ? 0.92 : 0.78,
            color: params.isTypingShark ? '#04333a' : '#041c32',
        })
        .stroke({
            alpha: params.isTypingShark ? 1 : 0.45,
            color: params.isTypingShark ? '#7effd8' : '#c7faff',
            width: 2,
        });
    typedText.x = firstLetterX;
    typedText.y = params.isTypingShark && typedWord ? 1 : 0;
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
    wordBackground,
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
    wordBackground: Graphics;
}>) {
    const explosionRadius = 120 * (0.6 + sharkDeathProgress * 3);

    sharkBody.width = sharkWidth;
    sharkBody.height = sharkWidth / sharkHeightRatio;
    sharkBody.visible = true;
    focusedSharkBody.visible = false;
    wordBackground.visible = false;
    typedText.visible = false;
    remainingText.visible = false;
    explosion.visible = true;
    explosion.clear();
    explosion.alpha = 1 - sharkDeathProgress;
    explosion.circle(0, 0, explosionRadius).fill(explosionGradient);
    sharkBodyView.alpha = 1 - sharkDeathProgress;
    sharkBodyView.rotation = Math.PI * sharkDeathProgress;
    sharkBodyView.scale.set(1 + sharkDeathProgress * 0.3);
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
    protected wordBackground: Graphics | undefined;

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
        const wordBackground = assertWrap.isDefined(this.wordBackground);
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
                wordBackground,
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
                wordBackground,
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
        const wordBackground = new Graphics();
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
        wordBackground.zIndex = 2;
        typedText.zIndex = 3;
        remainingText.zIndex = 3;
        explosion.zIndex = 4;
        sharkBodyView.addChild(sharkBody);
        view.addChild(
            sharkBodyView,
            focusedSharkBody,
            wordBackground,
            typedText,
            remainingText,
            explosion,
        );
        this.explosion = explosion;
        this.explosionGradient = explosionGradient;
        this.focusedSharkBody = focusedSharkBody;
        this.remainingText = remainingText;
        this.sharkBody = sharkBody;
        this.sharkBodyView = sharkBodyView;
        this.typedText = typedText;
        this.wordBackground = wordBackground;
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
