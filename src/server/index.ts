import * as http from 'http';
import * as Koa from 'koa';
import summaly from '../';

const app = new Koa();

app.use(async ctx => {
	if (!ctx.query.url) {
		ctx.status = 400;
		return;
	}

	try {
		const summary = await summaly(ctx.query.url, {
			lang: ctx.query.lang,
			followRedirects: false
		});

		ctx.body = summary;
		ctx.set('Cache-Control', 'public, max-age=3600');
	} catch (e) {
		console.log(`summaly error: ${e} ${ctx.query.url}`);
		ctx.status = 500;
		ctx.set('Cache-Control', 'public, max-age=3600');
	}
});

const server = http.createServer(app.callback());

server.listen(process.env.PORT || 3030);
