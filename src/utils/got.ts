import * as fs from 'fs';
import * as stream from 'stream';
import * as util from 'util';
import got from 'got';
import * as Got from 'got';
import { StatusError } from './status-error';
import { detectEncoding, toUtf8 } from './encoding';
import * as cheerio from 'cheerio';
import { browserUA } from '../client';
import { agent } from './agent';
import { checkAllowedUrl } from './check-allowed-url';
const PrivateIp = require('private-ip');

const pipeline = util.promisify(stream.pipeline);

const RESPONSE_TIMEOUT = 20 * 1000;
const OPERATION_TIMEOUT = 60 * 1000;
const MAX_RESPONSE_SIZE = 10 * 1024 * 1024;
const BOT_UA = `Summalybot/1.0`;

const NOT_BOT_UA = [
	'www.sankei.com',
];

export async function scpaping(url: string, opts?: { lang?: string; useRange?: boolean }) {
	const u = new URL(url);

	const headers = {
		'accept': 'text/html, application/xhtml+xml',
		'user-agent': NOT_BOT_UA.includes(u.hostname) ? browserUA : BOT_UA,
	} as Record<string, string>;

	if (opts?.lang) headers['accept-language'] = opts.lang;
	if (opts?.useRange) headers['range'] = `bytes=0-${MAX_RESPONSE_SIZE - 1}`;

	const response = await getResponse({
		url,
		method: 'GET',
		headers,
		typeFilter: /^(text\/html|application\/xhtml\+xml)/,
	});

	if (response.ip && PrivateIp(response.ip)) {
		throw new StatusError(`Private IP rejected ${response.ip}`, 400, 'Private IP Rejected');
	}

	const encoding = detectEncoding(response.rawBody);
	const body = toUtf8(response.rawBody, encoding);
	const $ = cheerio.load(body);

	return {
		body,
		$,
		response,
	};
}

export async function getJson(url: string, referer: string) {
	const res = await getResponse({
		url,
		method: 'GET',
		headers: {
			'accept': 'application/json, */*',
			'user-agent': browserUA,
			referer,
		}
	});

	return await JSON.parse(res.body);
}

async function getResponse(args: { url: string, method: 'GET' | 'POST', body?: string, headers: Record<string, string>, typeFilter?: RegExp }) {
	if (!checkAllowedUrl(args.url)) {
		throw new StatusError('Invalid URL', 400);
	}

	const timeout = RESPONSE_TIMEOUT;
	const operationTimeout = OPERATION_TIMEOUT;

	const req = got<string>(args.url, {
		method: args.method,
		headers: args.headers,
		body: args.body,
		timeout: {
			lookup: timeout,
			connect: timeout,
			secureConnect: timeout,
			socket: timeout,	// read timeout
			response: timeout,
			send: timeout,
			request: operationTimeout,	// whole operation timeout
		},
		agent: agent,
		http2: false,
		retry: 0,
	});

	req.on('redirect', (res, opts) => {
		if (!checkAllowedUrl(opts.url)) {
			console.warn(`Invalid url: ${opts.url}`);
			req.cancel();
		}
	});

	return await receiveResponce({ req, typeFilter: args.typeFilter });
}

async function receiveResponce<T>(args: { req: Got.CancelableRequest<Got.Response<T>>, typeFilter?: RegExp }) {
	const req = args.req;
	const maxSize = MAX_RESPONSE_SIZE;

	req.on('response', (res: Got.Response) => {
		if (res.statusCode === 206) {
			const m = (res.headers['content-range'] ?? '').match(new RegExp(/^bytes\s+0-(\d+)\/(\d+)$/, 'i'));	// bytes 0-47254/47255

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
		if (args.typeFilter && !res.headers['content-type']?.match(args.typeFilter)) {
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
	req.on('downloadProgress', (progress: Got.Progress) => {
		if (progress.transferred > maxSize && progress.percent !== 1) {
			console.warn(`maxSize exceeded in transfer (${progress.transferred} > ${maxSize}) on response`);
			req.cancel();
			return;
		}
	});

	// 応答取得 with ステータスコードエラーの整形
	const res = await req.catch(e => {
		if (e instanceof Got.HTTPError) {
			throw new StatusError(`${e.response.statusCode} ${e.response.statusMessage}`, e.response.statusCode, e.response.statusMessage);
		} else {
			throw e;
		}
	});

	return res;
}

export async function fetchUrl(url: string, path: string) {
	const timeout = RESPONSE_TIMEOUT;
	const operationTimeout = RESPONSE_TIMEOUT;
	const maxSize = MAX_RESPONSE_SIZE;

	const u = new URL(url);
	if (!u.protocol.match(/^https?:$/) || u.hostname === 'unix') {
		throw new StatusError('Invalid protocol', 400);
	}

	const req = got.stream(url, {
		headers: {
			Accept: '*/*',
		},
		timeout: {
			lookup: timeout,
			connect: timeout,
			secureConnect: timeout,
			socket: timeout,	// read timeout
			response: timeout,
			send: timeout,
			request: operationTimeout,	// whole operation timeout
		},
		agent: agent,
		http2: false,
		retry: 0,	// デフォルトでリトライするようになってる
	}).on('response', (res: Got.Response) => {
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
	}).on('downloadProgress', (progress: Got.Progress) => {
		// https://github.com/sindresorhus/got/blob/f0b7bc5135bc30e50e93c52420dbd862e5b67b26/documentation/examples/advanced-creation.js#L60
		if (progress.transferred > maxSize && progress.percent !== 1) {
			req.destroy(new Error(`maxSize exceeded (${progress.transferred} > ${maxSize}) on downloadProgress`));
		}
	});

	try {
		await pipeline(req, fs.createWriteStream(path));
	} catch (e) {
		if (e instanceof Got.HTTPError) {
			throw new StatusError(`${e.response.statusCode} ${e.response.statusMessage}`, e.response.statusCode, e.response.statusMessage);
		} else {
			throw e;
		}
	}
}
