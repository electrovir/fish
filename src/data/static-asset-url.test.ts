import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {getStaticAssetUrl} from './static-asset-url.js';

describe('getStaticAssetUrl', () => {
    it('preserves the document base path for static assets', () => {
        assert.strictEquals(
            getStaticAssetUrl({
                fileName: 'diver.svg',
            }),
            new URL('assets/diver.svg', document.baseURI).href,
        );
    });
});
