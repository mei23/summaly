import { Summary } from '..';
import loadConfig from './load-config';
import * as h3 from 'h3';
import { createServer } from 'http';
import { Type, validateQuery } from 'h3-typebox';
import { StatusError } from '../utils/status-error';

const config = loadConfig();

const summaryInstance = new Summary({
	allowedPlugins: config.allowedPlugins
});

const app = h3.createApp();
const router = h3.createRouter();

const validater = Type.Object({
	url: Type.String(),
	lang: Type.Optional(Type.String()),
});

router.get('/url', h3.eventHandler(async event => {
	const query = validateQuery(event, validater);

	try {
		const summary = await summaryInstance.summary(query.url, {
			lang: query.lang,
			useRange: config.useRange,
		});

		h3.setResponseHeader(event, 'Cache-Control', 'public, max-age=604800');
		return summary;
	} catch (e) {
		console.log(`summaly error: ${e} ${query.url}`);
		h3.setResponseStatus(event, 422);
		h3.setResponseHeader(event, 'Content-Type', 'text/plain');
		h3.setResponseHeader(event, 'Cache-Control', 'public, max-age=3600');
		return 'error';
	}
}));

app.use(router);

const server = createServer(h3.toNodeListener(app));

server.on('error', err => {
	console.error(err);
	process.exit(1);
});

server.listen(process.env.PORT || 3030);
