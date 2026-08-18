import {buildUrl, SearchParamStrategy} from 'url-vir';

export function getStaticAssetUrl({fileName}: Readonly<{fileName: string}>) {
    return buildUrl(document.baseURI, `./assets/${fileName}`, {
        searchParamStrategy: SearchParamStrategy.Clear,
    }).href;
}
