"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cleanup_title_1 = require("./utils/cleanup-title");
const decode_entities_1 = require("./utils/decode-entities");
const got_1 = require("./utils/got");
const cleanup_url_1 = require("./utils/cleanup-url");
exports.default = (url, lang = null, useRange = false) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6;
    if (lang && !lang.match(/^[\w-]+(\s*,\s*[\w-]+)*$/))
        lang = null;
    const res = yield (0, got_1.scpaping)(url.href, { lang: lang || undefined, useRange });
    const $ = res.$;
    const landingUrl = new URL(res.response.url);
    const twitterCard = (_a = $('meta[name="twitter:card"]').attr('content')) !== null && _a !== void 0 ? _a : $('meta[property="twitter:card"]').attr('content');
    let title = (_e = (_d = (_c = (_b = $('meta[name="twitter:title"]').attr('content')) !== null && _b !== void 0 ? _b : $('meta[property="twitter:title"]').attr('content')) !== null && _c !== void 0 ? _c : $('meta[property="og:title"]').attr('content')) !== null && _d !== void 0 ? _d : $('title').text()) !== null && _e !== void 0 ? _e : null;
    title = (0, decode_entities_1.decodeEntities)(title, 300);
    let image = (_l = (_k = (_j = (_h = (_g = (_f = $('meta[name="twitter:image"]').attr('content')) !== null && _f !== void 0 ? _f : $('meta[property="twitter:image"]').attr('content')) !== null && _g !== void 0 ? _g : $('meta[property="og:image"]').attr('content')) !== null && _h !== void 0 ? _h : $('link[rel="image_src"]').attr('href')) !== null && _j !== void 0 ? _j : $('link[rel="apple-touch-icon"]').attr('href')) !== null && _k !== void 0 ? _k : $('link[rel="apple-touch-icon image_src"]').attr('href')) !== null && _l !== void 0 ? _l : null;
    image = (0, cleanup_url_1.cleanupUrl)(image, landingUrl.href);
    let playerUrl = (_r = (_q = (_p = (_o = (_m = (twitterCard !== 'summary_large_image' ? $('meta[name="twitter:player"]').attr('content') : null)) !== null && _m !== void 0 ? _m : (twitterCard !== 'summary_large_image' ? $('meta[property="twitter:player"]').attr('content') : null)) !== null && _o !== void 0 ? _o : $('meta[property="og:video"]').attr('content')) !== null && _p !== void 0 ? _p : $('meta[property="og:video:secure_url"]').attr('content')) !== null && _q !== void 0 ? _q : $('meta[property="og:video:url"]').attr('content')) !== null && _r !== void 0 ? _r : null;
    playerUrl = (0, cleanup_url_1.cleanupUrl)(playerUrl, landingUrl.href);
    const playerWidth = parseInt((_u = (_t = (_s = $('meta[name="twitter:player:width"]').attr('content')) !== null && _s !== void 0 ? _s : $('meta[property="twitter:player:width"]').attr('content')) !== null && _t !== void 0 ? _t : $('meta[property="og:video:width"]').attr('content')) !== null && _u !== void 0 ? _u : '');
    const playerHeight = parseInt((_x = (_w = (_v = $('meta[name="twitter:player:height"]').attr('content')) !== null && _v !== void 0 ? _v : $('meta[property="twitter:player:height"]').attr('content')) !== null && _w !== void 0 ? _w : $('meta[property="og:video:height"]').attr('content')) !== null && _x !== void 0 ? _x : '');
    let description = (_1 = (_0 = (_z = (_y = $('meta[name="twitter:description"]').attr('content')) !== null && _y !== void 0 ? _y : $('meta[property="twitter:description"]').attr('content')) !== null && _z !== void 0 ? _z : $('meta[property="og:description"]').attr('content')) !== null && _0 !== void 0 ? _0 : $('meta[name="description"]').attr('content')) !== null && _1 !== void 0 ? _1 : null;
    description = (0, decode_entities_1.decodeEntities)(description, 300);
    if (title === description) {
        description = null;
    }
    let siteName = (_4 = (_3 = (_2 = $('meta[property="og:site_name"]').attr('content')) !== null && _2 !== void 0 ? _2 : $('meta[name="application-name"]').attr('content')) !== null && _3 !== void 0 ? _3 : landingUrl.hostname) !== null && _4 !== void 0 ? _4 : null;
    siteName = (0, decode_entities_1.decodeEntities)(siteName, 300);
    const favicon = (_6 = (_5 = $('link[rel="shortcut icon"]').attr('href')) !== null && _5 !== void 0 ? _5 : $('link[rel="icon"]').attr('href')) !== null && _6 !== void 0 ? _6 : null;
    const icon = (0, cleanup_url_1.cleanupUrl)(favicon, landingUrl.href);
    const sensitive = $('.tweet').attr('data-possibly-sensitive') === 'true';
    // Clean up the title
    title = (0, cleanup_title_1.default)(title, siteName);
    if (title === '') {
        title = siteName;
    }
    const result = {
        title,
        icon,
        description,
        thumbnail: image,
        medias: image ? [image] : undefined,
        player: {
            url: playerUrl,
            width: Number.isNaN(playerWidth) ? null : playerWidth,
            height: Number.isNaN(playerHeight) ? null : playerHeight
        },
        sitename: siteName,
        sensitive,
        url: landingUrl.href,
        $,
    };
    return result;
});
