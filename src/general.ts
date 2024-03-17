import cleanupTitle from './utils/cleanup-title';
import { decodeEntities } from './utils/decode-entities';
import { SummalyEx } from './summaly';
import { scpaping } from './utils/got';
import { cleanupUrl } from './utils/cleanup-url';

export default async (url: URL, lang: string | null = null, useRange = false): Promise<SummalyEx> => {
	if (lang && !lang.match(/^[\w-]+(\s*,\s*[\w-]+)*$/)) lang = null;

	const res = await scpaping(url.href, { lang: lang || undefined, useRange });
	const $ = res.$;
	const landingUrl = new URL(res.response.url);

	const twitterCard =
		$('meta[name="twitter:card"]').attr('content') ??
		$('meta[property="twitter:card"]').attr('content');

	let title: string | null =
		$('meta[name="twitter:title"]').attr('content') ??
		$('meta[property="twitter:title"]').attr('content') ??
		$('meta[property="og:title"]').attr('content') ??
		$('title').text() ??
		null;
	title = decodeEntities(title, 300);

	let image =
		$('meta[name="twitter:image"]').attr('content') ??
		$('meta[property="twitter:image"]').attr('content') ??
		$('meta[property="og:image"]').attr('content') ??
		$('link[rel="image_src"]').attr('href') ??
		$('link[rel="apple-touch-icon"]').attr('href') ??
		$('link[rel="apple-touch-icon image_src"]').attr('href') ??
		null;

	image = cleanupUrl(image, landingUrl.href);

	let playerUrl =
		(twitterCard !== 'summary_large_image' ? $('meta[name="twitter:player"]').attr('content') : null) ??
		(twitterCard !== 'summary_large_image' ? $('meta[property="twitter:player"]').attr('content') : null) ??
		$('meta[property="og:video"]').attr('content') ??
		$('meta[property="og:video:secure_url"]').attr('content') ??
		$('meta[property="og:video:url"]').attr('content') ??
		null;

	playerUrl = cleanupUrl(playerUrl, landingUrl.href);

	const playerWidth = parseInt(
		$('meta[name="twitter:player:width"]').attr('content') ??
		$('meta[property="twitter:player:width"]').attr('content') ??
		$('meta[property="og:video:width"]').attr('content') ??
		'');

	const playerHeight = parseInt(
		$('meta[name="twitter:player:height"]').attr('content') ??
		$('meta[property="twitter:player:height"]').attr('content') ??
		$('meta[property="og:video:height"]').attr('content') ??
		'');

	let description =
		$('meta[name="twitter:description"]').attr('content') ??
		$('meta[property="twitter:description"]').attr('content') ??
		$('meta[property="og:description"]').attr('content') ??
		$('meta[name="description"]').attr('content') ??
		null;

	description = decodeEntities(description, 300);

	if (title === description) {
		description = null;
	}

	let siteName: string | null =
		$('meta[property="og:site_name"]').attr('content') ??
		$('meta[name="application-name"]').attr('content') ??
		landingUrl.hostname ??
		null;

	siteName = decodeEntities(siteName, 300);

	const favicon =
		$('link[rel="shortcut icon"]').attr('href') ??
		$('link[rel="icon"]').attr('href') ??
		null;

	const icon = cleanupUrl(favicon, landingUrl.href);

	const sensitive = $('.tweet').attr('data-possibly-sensitive') === 'true';

	// Clean up the title
	title = cleanupTitle(title, siteName);

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
	} as SummalyEx;

	return result;
};
