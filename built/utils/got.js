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
exports.fetchUrl = exports.getJson = exports.scpaping = void 0;
const fs = require("fs");
const stream = require("stream");
const util = require("util");
const got_1 = require("got");
const Got = require("got");
const status_error_1 = require("./status-error");
const encoding_1 = require("./encoding");
const cheerio = require("cheerio");
const client_1 = require("../client");
const agent_1 = require("./agent");
const check_allowed_url_1 = require("./check-allowed-url");
const PrivateIp = require('private-ip');
const pipeline = util.promisify(stream.pipeline);
const RESPONSE_TIMEOUT = 20 * 1000;
const OPERATION_TIMEOUT = 60 * 1000;
const MAX_RESPONSE_SIZE = 10 * 1024 * 1024;
const BOT_UA = `Summalybot/1.0`;
const NOT_BOT_UA = [
    'www.sankei.com',
];
function scpaping(url, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const u = new URL(url);
        const headers = {
            'accept': 'text/html, application/xhtml+xml',
            'user-agent': NOT_BOT_UA.includes(u.hostname) ? client_1.browserUA : BOT_UA,
        };
        if (opts === null || opts === void 0 ? void 0 : opts.lang)
            headers['accept-language'] = opts.lang;
        if (opts === null || opts === void 0 ? void 0 : opts.useRange)
            headers['range'] = `bytes=0-${MAX_RESPONSE_SIZE - 1}`;
        const response = yield getResponse({
            url,
            method: 'GET',
            headers,
            typeFilter: /^(text\/html|application\/xhtml\+xml)/,
        });
        if (response.ip && PrivateIp(response.ip)) {
            throw new status_error_1.StatusError(`Private IP rejected ${response.ip}`, 400, 'Private IP Rejected');
        }
        const encoding = (0, encoding_1.detectEncoding)(response.rawBody);
        const body = (0, encoding_1.toUtf8)(response.rawBody, encoding);
        const $ = cheerio.load(body);
        return {
            body,
            $,
            response,
        };
    });
}
exports.scpaping = scpaping;
function getJson(url, referer) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield getResponse({
            url,
            method: 'GET',
            headers: {
                'accept': 'application/json, */*',
                'user-agent': client_1.browserUA,
                referer,
            }
        });
        return yield JSON.parse(res.body);
    });
}
exports.getJson = getJson;
function getResponse(args) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(0, check_allowed_url_1.checkAllowedUrl)(args.url)) {
            throw new status_error_1.StatusError('Invalid URL', 400);
        }
        const timeout = RESPONSE_TIMEOUT;
        const operationTimeout = OPERATION_TIMEOUT;
        const req = (0, got_1.default)(args.url, {
            method: args.method,
            headers: args.headers,
            body: args.body,
            timeout: {
                lookup: timeout,
                connect: timeout,
                secureConnect: timeout,
                socket: timeout, // read timeout
                response: timeout,
                send: timeout,
                request: operationTimeout, // whole operation timeout
            },
            agent: agent_1.agent,
            http2: false,
            retry: 0,
        });
        req.on('redirect', (res, opts) => {
            if (!(0, check_allowed_url_1.checkAllowedUrl)(opts.url)) {
                console.warn(`Invalid url: ${opts.url}`);
                req.cancel();
            }
        });
        return yield receiveResponce({ req, typeFilter: args.typeFilter });
    });
}
function receiveResponce(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const req = args.req;
        const maxSize = MAX_RESPONSE_SIZE;
        req.on('response', (res) => {
            var _a, _b;
            if (res.statusCode === 206) {
                const m = ((_a = res.headers['content-range']) !== null && _a !== void 0 ? _a : '').match(new RegExp(/^bytes\s+0-(\d+)\/(\d+)$/, 'i')); // bytes 0-47254/47255
                if (m == null) {
                    console.warn(`Invalid content-range '${res.headers['content-range']}'`);
                    req.cancel();
                    return;
                }
                if (Number(m[1]) + 1 !== Number(m[2])) {
                    console.warn(`maxSize exceeded by content-range (${m[2]} > ${maxSize}) on response`);
                    req.cancel();
                    return;
                }
            }
            // Check html
            if (args.typeFilter && !((_b = res.headers['content-type']) === null || _b === void 0 ? void 0 : _b.match(args.typeFilter))) {
                console.warn(`Rejected by type filter ${res.headers['content-type']}`);
                req.cancel();
                return;
            }
            // 応答ヘッダでサイズチェック
            const contentLength = res.headers['content-length'];
            if (contentLength != null) {
                const size = Number(contentLength);
                if (size > maxSize) {
                    console.warn(`maxSize exceeded by content-length (${size} > ${maxSize}) on response`);
                    req.cancel();
                    return;
                }
            }
        });
        // 受信中のデータでサイズチェック
        req.on('downloadProgress', (progress) => {
            if (progress.transferred > maxSize && progress.percent !== 1) {
                console.warn(`maxSize exceeded in transfer (${progress.transferred} > ${maxSize}) on response`);
                req.cancel();
                return;
            }
        });
        // 応答取得 with ステータスコードエラーの整形
        const res = yield req.catch(e => {
            if (e instanceof Got.HTTPError) {
                throw new status_error_1.StatusError(`${e.response.statusCode} ${e.response.statusMessage}`, e.response.statusCode, e.response.statusMessage);
            }
            else {
                throw e;
            }
        });
        return res;
    });
}
function fetchUrl(url, path) {
    return __awaiter(this, void 0, void 0, function* () {
        const timeout = RESPONSE_TIMEOUT;
        const operationTimeout = RESPONSE_TIMEOUT;
        const maxSize = MAX_RESPONSE_SIZE;
        const u = new URL(url);
        if (!u.protocol.match(/^https?:$/) || u.hostname === 'unix') {
            throw new status_error_1.StatusError('Invalid protocol', 400);
        }
        const req = got_1.default.stream(url, {
            headers: {
                Accept: '*/*',
            },
            timeout: {
                lookup: timeout,
                connect: timeout,
                secureConnect: timeout,
                socket: timeout, // read timeout
                response: timeout,
                send: timeout,
                request: operationTimeout, // whole operation timeout
            },
            agent: agent_1.agent,
            http2: false,
            retry: 0, // デフォルトでリトライするようになってる
        }).on('response', (res) => {
            if (res.ip && PrivateIp(res.ip)) {
                req.destroy(new Error(`Private IP rejected ${res.ip}`));
            }
            const contentLength = res.headers['content-length'];
            if (contentLength != null) {
                const size = Number(contentLength);
                if (size > maxSize) {
                    req.destroy(new Error(`maxSize exceeded (${size} > ${maxSize}) on response`));
                }
            }
        }).on('downloadProgress', (progress) => {
            // https://github.com/sindresorhus/got/blob/f0b7bc5135bc30e50e93c52420dbd862e5b67b26/documentation/examples/advanced-creation.js#L60
            if (progress.transferred > maxSize && progress.percent !== 1) {
                req.destroy(new Error(`maxSize exceeded (${progress.transferred} > ${maxSize}) on downloadProgress`));
            }
        });
        try {
            yield pipeline(req, fs.createWriteStream(path));
        }
        catch (e) {
            if (e instanceof Got.HTTPError) {
                throw new status_error_1.StatusError(`${e.response.statusCode} ${e.response.statusMessage}`, e.response.statusCode, e.response.statusMessage);
            }
            else {
                throw e;
            }
        }
    });
}
exports.fetchUrl = fetchUrl;
