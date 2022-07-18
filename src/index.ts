/**
 * summaly
 * https://github.com/syuilo/summaly
 */

import requireAll = require('require-all');
import { StripEx, Summaly } from './summaly';
import IPlugin from './iplugin';
import general from './general';
import { attachImage } from './attach-image';

// Load builtin plugins
const _builtinPlugins = requireAll({
	dirname: __dirname + '/plugins'
}) as { [key: string]: IPlugin };

type Options = {
	/**
	 * Accept-Language for the request
	 */
	lang?: string | null;

	/**
	 * Whether follow redirects
	 */
	followRedirects?: boolean;

	attachImage?: boolean;

	/**
	 * Custom Plugins
	 */
	plugins?: IPlugin[] | null;

	allowedPlugins?: string[],
};

const defaultOptions = {
	lang: null,
	followRedirects: true,
	attachImage: true,
	plugins: null
} as Options;

/**
 * Summarize an web page
 */
export default async (url: string, options?: Options): Promise<Summaly> => {
	const opts = Object.assign(defaultOptions, options);

	const builtinPlugins = Object.keys(_builtinPlugins)
		.filter(key => opts.allowedPlugins == null || opts.allowedPlugins.includes(key))
		.map(key => _builtinPlugins[key]);

	const plugins = builtinPlugins.concat(opts.plugins || []);

	const _url = new URL(url);

	// pre
	const preMatch = plugins.filter(plugin => plugin.test(_url))[0];

	if (preMatch && preMatch.process) {
		const summary = await preMatch.process(_url);
		if (summary == null) throw 'failed summarize';
		if (opts.attachImage) await attachImage(summary);
		return summary;
	} else {
		let summary = await general(_url, opts.lang);
		if (summary == null) throw 'failed summarize';
		const landingUrl = summary.url;
		const match = plugins.filter(plugin => plugin.test(new URL(landingUrl)))[0];
		if (match && match.postProcess) {
			summary = await match.postProcess(summary);
		}
		if (opts.attachImage) await attachImage(summary);
		return StripEx(summary);
	}
};
