import { StripEx, Summaly } from './summaly';
import IPlugin from './iplugin';
import general from './general';
import { sanitizeUrl } from './utils/sanitize-url';
import { resolve } from 'path';

type Options = {
	allowedPlugins?: string[],
};

type RequestOptions = {
	/**
	 * Accept-Language for the request
	 */
	lang?: string | null;

	/**
	 * Use range for the request
	 */
	useRange?: boolean;
};

export class Summary {
	private plugins = [] as IPlugin[];

	constructor(options?: Options) {
		for (const key of options?.allowedPlugins || []) {
			try {
				const p = require(resolve(__dirname, 'plugins', key));
				this.plugins.push(p);
			} catch (e) {
				//
			}
		}
	}

	public async summary(url: string, requestOptions?: RequestOptions): Promise<Summaly> {
		const opts = Object.assign({
			lang: null,
		}, requestOptions);

		const _url = new URL(url);

		// pre
		const preMatch = this.plugins.filter(plugin => plugin.test(_url))[0];

		if (preMatch && preMatch.process) {
			const summary = await preMatch.process(_url);
			if (summary == null) throw 'failed summarize';

			if (summary.player) summary.player.url = sanitizeUrl(summary.player.url);
			summary.icon = sanitizeUrl(summary.icon);
			summary.thumbnail = sanitizeUrl(summary.thumbnail);
			if (summary.medias) { summary.medias.map(x => sanitizeUrl(x)) }

			return summary;
		} else {
			let summary = await general(_url, opts.lang, opts.useRange);
			if (summary == null) throw 'failed summarize';
			const landingUrl = summary.url;

			const match = this.plugins.filter(plugin => plugin.test(new URL(landingUrl)))[0];
			if (match && match.postProcess) {
				summary = await match.postProcess(summary);
			}

			if (summary.player) summary.player.url = sanitizeUrl(summary.player.url);
			summary.icon = sanitizeUrl(summary.icon);
			summary.thumbnail = sanitizeUrl(summary.thumbnail);
			if (summary.medias) { summary.medias.map(x => sanitizeUrl(x)) }

			return StripEx(summary);
		}
	}
}

/**
 * Summarize an web page
 */
export default async (url: string, requestOptions?: RequestOptions): Promise<Summaly> => {
	const s = new Summary();
	return s.summary(url, requestOptions);
};
