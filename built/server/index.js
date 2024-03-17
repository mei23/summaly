"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const load_config_1 = require("./load-config");
const h3 = require("h3");
const http_1 = require("http");
const h3_typebox_1 = require("h3-typebox");
const config = (0, load_config_1.default)();
const summaryInstance = new __1.Summary({
    allowedPlugins: config.allowedPlugins
});
const app = h3.createApp();
const router = h3.createRouter();
const validater = h3_typebox_1.Type.Object({
    url: h3_typebox_1.Type.String(),
    lang: h3_typebox_1.Type.Optional(h3_typebox_1.Type.String()),
});
router.get('/url', h3.eventHandler((event) => __awaiter(void 0, void 0, void 0, function* () {
    const query = (0, h3_typebox_1.validateQuery)(event, validater);
    try {
        const summary = yield summaryInstance.summary(query.url, {
            lang: query.lang,
            useRange: config.useRange,
        });
        h3.setResponseHeader(event, 'Cache-Control', 'public, max-age=604800');
        return summary;
    }
    catch (e) {
        console.log(`summaly error: ${e} ${query.url}`);
        h3.setResponseStatus(event, 422);
        h3.setResponseHeader(event, 'Content-Type', 'text/plain');
        h3.setResponseHeader(event, 'Cache-Control', 'public, max-age=3600');
        return 'error';
    }
})));
app.use(router);
const server = (0, http_1.createServer)(h3.toNodeListener(app));
server.on('error', err => {
    console.error(err);
    process.exit(1);
});
server.listen(process.env.PORT || 3030);
