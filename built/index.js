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
exports.Summary = void 0;
const summaly_1 = require("./summaly");
const general_1 = require("./general");
const sanitize_url_1 = require("./utils/sanitize-url");
const path_1 = require("path");
class Summary {
    constructor(options) {
        this.plugins = [];
        for (const key of (options === null || options === void 0 ? void 0 : options.allowedPlugins) || []) {
            try {
                const p = require((0, path_1.resolve)(__dirname, 'plugins', key));
                this.plugins.push(p);
            }
            catch (e) {
                //
            }
        }
    }
    summary(url, requestOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const opts = Object.assign({
                lang: null,
            }, requestOptions);
            const _url = new URL(url);
            // pre
            const preMatch = this.plugins.filter(plugin => plugin.test(_url))[0];
            if (preMatch && preMatch.process) {
                const summary = yield preMatch.process(_url);
                if (summary == null)
                    throw 'failed summarize';
                if (summary.player)
                    summary.player.url = (0, sanitize_url_1.sanitizeUrl)(summary.player.url);
                summary.icon = (0, sanitize_url_1.sanitizeUrl)(summary.icon);
                summary.thumbnail = (0, sanitize_url_1.sanitizeUrl)(summary.thumbnail);
                if (summary.medias) {
                    summary.medias.map(x => (0, sanitize_url_1.sanitizeUrl)(x));
                }
                return summary;
            }
            else {
                let summary = yield (0, general_1.default)(_url, opts.lang, opts.useRange);
                if (summary == null)
                    throw 'failed summarize';
                const landingUrl = summary.url;
                const match = this.plugins.filter(plugin => plugin.test(new URL(landingUrl)))[0];
                if (match && match.postProcess) {
                    summary = yield match.postProcess(summary);
                }
                if (summary.player)
                    summary.player.url = (0, sanitize_url_1.sanitizeUrl)(summary.player.url);
                summary.icon = (0, sanitize_url_1.sanitizeUrl)(summary.icon);
                summary.thumbnail = (0, sanitize_url_1.sanitizeUrl)(summary.thumbnail);
                if (summary.medias) {
                    summary.medias.map(x => (0, sanitize_url_1.sanitizeUrl)(x));
                }
                return (0, summaly_1.StripEx)(summary);
            }
        });
    }
}
exports.Summary = Summary;
/**
 * Summarize an web page
 */
exports.default = (url, requestOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const s = new Summary();
    return s.summary(url, requestOptions);
});
