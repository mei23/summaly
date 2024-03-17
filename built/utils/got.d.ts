import * as Got from 'got';
import * as cheerio from 'cheerio';
export declare function scpaping(url: string, opts?: {
    lang?: string;
    useRange?: boolean;
}): Promise<{
    body: string;
    $: cheerio.CheerioAPI;
    response: Got.Response<string>;
}>;
export declare function getJson(url: string, referer: string): Promise<any>;
export declare function fetchUrl(url: string, path: string): Promise<void>;
