import { getJson } from '../utils/got';
import { Summaly } from '../summaly';

export function test(url: URL): boolean {
	return /^twitter\.com$/.test(url.hostname)
		&& /^[/]\w+[/]status[/](\d+)/.test(url.pathname);
}

export async function process(url: URL): Promise<Summaly> {
	const m = url.pathname.match(/^[/]\w+[/]status[/](\d+)/);
	if (!m) throw 'err';

	const u = `https://cdn.syndication.twimg.com/tweet-result?id=${m[1]}&lang=en`;
	const j = await getJson(u, 'https://platform.twitter.com/embed/index.html') as Tweet;

	return {
		description: j.text || '',
		icon: 'https://abs.twimg.com/favicons/twitter.2.ico',
		sitename: 'Twitter',
		thumbnail: j.photos?.[0]?.url || (j.user?.profile_image_url_https ? j.user?.profile_image_url_https.replace(/_normal\./, '.') : null) || null,
		player: {
			url: null,
			width: null,
			height: null,
		},
		title: `${j.user?.name} on Twitter`,
		sensitive: !!j.possibly_sensitive,
		url: url.href,
		medias: j.photos?.map(x => x.url as string) || undefined,
	};
}

type Tweet = {
	__typename?: 'Tweet';
	lang?: string;
	favorite_count?: number;
	possibly_sensitive?: boolean;
	created_at: string;	// as ISO date
	display_text_range?: [ 0, 20 ];
	entities?: {
		hashtags?: unknown[];
		urls?: unknown[];
		user_mentions?: unknown[];
		symbols?: unknown[];
		media?: unknown[];	// 最初の1つだけ＆Twitter HTML
	};
	id_str?: string;
	text?: string;	// 後ろにt.coが付く＆最初の1つだけ
	user?: {
		id_str?: string,	// DB ID
		name?: string,	// Disp
		profile_image_url_https?: string,
		screen_name?: string,	// ＠のID
		verified?: boolean
	};
	photos?: {
		backgroundColor?: { red: number; green: number; blue: number };
		cropCandidates?: {x: number; y: number; w: number; h: number }[];
		expandedUrl?: string;	// Twitter HTML
		url?: string,	// 画像直リンク
		width?: number;	// オリジナルサイズ
		height?: number;
	}[];
	conversation_count?: number;
	news_action_type?: 'conversation';
};
