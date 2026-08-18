import {type AssetIncrementProgressCallback} from '@antha/asset';
import {Assets} from '@antha/graphics-2d';
import {getStaticAssetUrl} from './static-asset-url.js';

export const staticAssetMaxProgress = 100;

export async function loadStaticAssetTexture({
    fileName,
    incrementProgressCallback,
}: Readonly<{
    fileName: string;
    incrementProgressCallback: AssetIncrementProgressCallback;
}>) {
    let loadedProgress = 0;
    const texture = await Assets.load(
        getStaticAssetUrl({
            fileName,
        }),
        {
            onProgress(progress) {
                const nextProgress = Math.round(progress * staticAssetMaxProgress);
                const progressIncrease = nextProgress - loadedProgress;

                if (progressIncrease > 0) {
                    incrementProgressCallback(progressIncrease);
                    loadedProgress = nextProgress;
                }
            },
        },
    );

    if (loadedProgress < staticAssetMaxProgress) {
        incrementProgressCallback(staticAssetMaxProgress - loadedProgress);
    }

    return texture;
}
