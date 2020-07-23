import * as tmp from 'tmp';
import * as fs from 'fs';
import * as stream from 'stream';
import * as util from 'util';
import fetch from 'node-fetch';
import Summary from './summary';
import * as fileType from 'file-type';
import isSvg from 'is-svg';
import { ConvertToJpeg } from './utils/image-processor';
import { httpAgent, httpsAgent } from './utils/agent';
import { AbortController } from 'abort-controller';

const pipeline = util.promisify(stream.pipeline);

const probeImageSize = require('probe-image-size');

export async function attachImage(summary: Summary) {
	summary.thumbnail = await convertUrl(summary.thumbnail);
	summary.icon = await convertUrl(summary.icon);
}

async function convertUrl(url: string) {
	if (url == null) return url;
	if (!url.match(/^https?:/)) return url;

	const [path, cleanup] = await new Promise<[string, any]>((res, rej) => {
		tmp.file((e, path, fd, cleanup) => {
			if (e) return rej(e);
			res([path, cleanup]);
		});
	});

	try {
		await fetchUrl(url, path);

		const [type] = await detectMine(path);

		if (['image/jpeg', 'image/png', 'image/gif'].includes(type)) {
			const image = await ConvertToJpeg(path, 200, 200);
			return `data:image/jpeg;base64,${image.data.toString('base64')}`;
		} else {
			return url;
		}
	} catch (e) {
		return url;
	} finally {
		cleanup();
	}
}

async function fetchUrl(url: string, path: string) {
	const controller = new AbortController();
	setTimeout(() => {
		controller.abort();
	}, 30 * 1000);

	const response = await fetch(url, {
			timeout: 30 * 1000,
			signal: controller.signal,
			agent: u => u.protocol == 'http:' ? httpAgent : httpsAgent,
		}).then(response => {
		if (!response.ok) {
			throw response.status;
		} else {
			return response;
		}
	});

	await pipeline(response.body, fs.createWriteStream(path));
}

export async function detectMine(path: string) {
	let type = await detectType(path);

	if (['image/jpeg', 'image/png', 'image/gif'].includes(type.mime)) {
		const imageSize = await detectImageSize(path).catch(() => null);

		// うまく判定できない画像は octet-stream にする
		if (!imageSize) {
			type = {
				mime: 'application/octet-stream',
				ext: null
			};
		}

		// 制限を超えている画像は octet-stream にする
		if (imageSize.wUnits === 'px' && (imageSize.width > 16383 || imageSize.height > 16383)) {
			type = {
				mime: 'application/octet-stream',
				ext: null
			};
		}
	}

	return [type.mime, type.ext];
}

async function detectType(path: string) {
	// Check 0 byte
	const fileSize = await detectFileSize(path);
	if (fileSize === 0) {
		return {
			mime: 'application/octet-stream',
			ext: null
		};
	}

	const readable = fs.createReadStream(path);
	const type = (await fileType.stream(readable)).fileType;
	readable.destroy();

	if (type) {
		// XMLはSVGかもしれない
		if (type.mime === 'application/xml' && checkSvg(path)) {
			return {
				mime: 'image/svg+xml',
				ext: 'svg'
			};
		}

		return {
			mime: type.mime,
			ext: type.ext
		};
	}

	// 種類が不明でもSVGかもしれない
	if (checkSvg(path)) {
		return {
			mime: 'image/svg+xml',
			ext: 'svg'
		};
	}

	// それでも種類が不明なら application/octet-stream にする
	return {
		mime: 'application/octet-stream',
		ext: null
	};
}

async function detectFileSize(path: string) {
	return new Promise<number>((res, rej) => {
		fs.stat(path, (err, stats) => {
			if (err) return rej(err);
			res(stats.size);
		});
	});
}

async function detectImageSize(path: string) {
	const readable = fs.createReadStream(path);
	const imageSize = await probeImageSize(readable) as {
		width: number;
		height: number;
		wUnits: string;
		hUnits: string;
	};
	readable.destroy();

	return imageSize;
}

function checkSvg(path: string) {
	try {
		const size = fs.statSync(path).size;
		if (size > 1 * 1024 * 1024) return false;
		return isSvg(fs.readFileSync(path));
	} catch {
		return false;
	}
}
