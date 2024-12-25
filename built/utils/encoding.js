"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectEncoding = detectEncoding;
exports.toUtf8 = toUtf8;
exports.toUtf8i = toUtf8i;
exports.toUtf8j = toUtf8j;
const iconv = require("iconv-lite");
//var Iconv  = require('iconv').Iconv;
const iconv_1 = require("iconv");
const jschardet = require("jschardet");
const Encoding = require('encoding-japanese');
const regCharset = new RegExp(/charset\s*=\s*["']?([\w-]+)/, 'i');
/**
 * Detect HTML encoding
 * @param body Body in Buffer
 * @returns encoding
 */
function detectEncoding(body) {
    // By detection
    const detected = jschardet.detect(body, { minimumThreshold: 0.99 });
    if (detected) {
        const candicate = detected.encoding;
        const encoding = toEncoding(candicate);
        if (encoding != null)
            return encoding;
    }
    // From meta
    const matchMeta = body.toString('ascii').match(regCharset);
    if (matchMeta) {
        const candicate = matchMeta[1];
        const encoding = toEncoding(candicate);
        if (encoding != null)
            return encoding;
    }
    return 'utf-8';
}
function toUtf8(body, encoding) {
    return iconv.decode(body, encoding);
}
function toUtf8i(body, encoding) {
    const i = new iconv_1.Iconv(encoding, 'UTF-8');
    return i.convert(body).toString();
}
function toUtf8j(body, encoding) {
    return Encoding.codeToString(Encoding.convert(body, 'UNICODE', encoding));
}
function toEncoding(candicate) {
    if (candicate.toUpperCase() === 'ISO-2022-JP')
        return 'ISO-2022-JP';
    if (iconv.encodingExists(candicate)) {
        if (['shift_jis', 'shift-jis', 'windows-31j', 'x-sjis'].includes(candicate.toLowerCase()))
            return 'cp932';
        return candicate;
    }
    else {
        return null;
    }
}
