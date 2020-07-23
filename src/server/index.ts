import * as http from 'http';
import * as Koa from 'koa';
import summaly from '../';
import * as cors from '@koa/cors';

const app = new Koa();

app.use(cors({
	origin: '*'
}));

app.use(async ctx => {
	if (!ctx.query.url) {
		ctx.status = 400;
		return;
	}

	try {
		const summary = await summaly(ctx.query.url);

		ctx.body = summary;
		ctx.set('Cache-Control', 'public, max-age=604800');
	} catch (e) {
		console.log(`summaly error: ${e} ${ctx.query.url}`);
		ctx.status = 500;
		ctx.set('Cache-Control', 'public, max-age=3600');
	}
});

const server = http.createServer(app.callback());

const port = process.env.PORT || 3030;

server.listen(port);

console.log(`Listening on port ${port}`);
