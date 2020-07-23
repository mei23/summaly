import { resolve, parse } from 'url';
import fetch from 'node-fetch';
import { httpAgent, httpsAgent } from './utils/agent';
import clip from './utils/clip';
import cleanupTitle from './utils/cleanup-title';

import { AllHtmlEntities } from 'html-entities';
const entities = new AllHtmlEntities();

import Summary from './summary';
import { createInstance } from './client';

export default async (url: URL): Promise<Summary> => {
	const client = createInstance();

	const res = await client.fetch(url.href).catch((e: any) => {
		throw `${e.statusCode || e.message}`;
	});

	const contentType = res.response.headers['content-type'];

	// HTMLじゃなかった場合は中止
	if (!contentType?.includes('text/html')) {
		throw `not html ${contentType}`;
	}

	const $ = res.$;

	let title =
		$('meta[property="og:title"]').attr('content') ||
		$('meta[property="twitter:title"]').attr('content') ||
		$('title').text() ||
		null;

	if (title == null) {
		throw 'no title';
	}

	title = clip(entities.decode(title), 100) || null;

	let image =
		$('meta[property="og:image"]').attr('content') ||
		$('meta[property="twitter:image"]').attr('content') ||
		$('link[rel="image_src"]').attr('href') ||
		$('link[rel="apple-touch-icon"]').attr('href') ||
		$('link[rel="apple-touch-icon image_src"]').attr('href') ||
		null;

	image = image ? resolve(url.href, image) : null;

	const playerUrl =
		$('meta[property="twitter:player"]').attr('content') ||
		$('meta[name="twitter:player"]').attr('content') ||
		$('meta[property="og:video"]').attr('content') ||
		null;

	const playerWidth = parseInt(
		$('meta[property="twitter:player:width"]').attr('content') ||
		$('meta[name="twitter:player:width"]').attr('content') ||
		$('meta[property="og:video:width"]').attr('content') ||
		'');

	const playerHeight = parseInt(
		$('meta[property="twitter:player:height"]').attr('content') ||
		$('meta[name="twitter:player:height"]').attr('content') ||
		$('meta[property="og:video:height"]').attr('content') ||
		'');

	let description =
		$('meta[property="og:description"]').attr('content') ||
		$('meta[property="twitter:description"]').attr('content') ||
		$('meta[name="description"]').attr('content') ||
		null;

	description = description
		? (clip(entities.decode(description), 300) || null)
		: null;

	if (title === description) {
		description = null;
	}

	let siteName =
		$('meta[property="og:site_name"]').attr('content') ||
		$('meta[name="application-name"]').attr('content') ||
		url.hostname ||
		null;

	siteName = siteName ? entities.decode(siteName) : null;

	const favicon =
		$('link[rel="shortcut icon"]').attr('href') ||
		$('link[rel="icon"]').attr('href') ||
		'/favicon.ico';

	const icon = await findFavicon(favicon, url);

	const sensitive = $('.tweet').attr('data-possibly-sensitive') === 'true';

	// Clean up the title
	title = cleanupTitle(title, siteName);

	if (title === '') {
		title = siteName;
	}

	return {
		title,
		icon,
		description,
		thumbnail: image,
		player: {
			url: playerUrl,
			width: playerWidth,	// TODO: NaNかもしれない
			height: playerHeight
		},
		sitename: siteName,
		sensitive,
	};
};

async function findFavicon(favicon: string, url: URL) {
	// 絶対URLはリモート解決しない
	if (favicon?.match(/^https?:/)) return favicon;

	const find = async (path: string) => {
		const target = resolve(url.href, path);
		return await fetch(url, {
			method: 'get',
			headers: {
				Range: `bytes=0-1023`
			},
			timeout: 10 * 1000,
			agent: u => u.protocol == 'http:' ? httpAgent : httpsAgent
		})
		.then(res => {
			if (res.status >= 200 && res.status < 300) return target;
			return null;
		})
		.catch(() => null);
	};

	// 相対的なURL (ex. test) を絶対的 (ex. /test) に変換
	const toAbsolute = (relativeURLString: string): string => {
		const relativeURL = parse(relativeURLString);
		const isAbsolute = relativeURL.slashes || relativeURL.path?.startsWith('/');

		// 既に絶対的なら、即座に値を返却
		if (isAbsolute) {
			return relativeURLString;
		}

		// スラッシュを付けて返却
		return '/' + relativeURLString;
	};

	const icon = await find(favicon) ||
		// 相対指定を絶対指定に変換し再試行
		await find(toAbsolute(favicon)) ||
		null;

	return icon;
}
