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
const fs_1 = require("fs");
const encoding_1 = require("../utils/encoding");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        //p1(`${__dirname}/../../sample/sjis.html`);
        p1(`${__dirname}/../../sample/_jis.html`);
    });
}
function p1(file) {
    const content = (0, fs_1.readFileSync)(file);
    const enc = (0, encoding_1.detectEncoding)(content);
    console.log('enc', enc);
    const count = 10000;
    /*
    console.log(`iconv-lite`);
    {
        const t0 = performance.now();
        for (let i=0;i<count;i++){
            const dec = toUtf8(content, enc);
        }
        const t1 = performance.now();
        console.log(`${t1-t0}`);
    }
    */
    console.log(`iconv`);
    {
        const t0 = performance.now();
        for (let i = 0; i < count; i++) {
            const dec = (0, encoding_1.toUtf8i)(content, enc);
        }
        const t1 = performance.now();
        console.log(`${t1 - t0}`);
    }
    console.log(`encode-japanese`);
    {
        const t0 = performance.now();
        for (let i = 0; i < count; i++) {
            const dec = (0, encoding_1.toUtf8j)(content, enc);
        }
        const t1 = performance.now();
        console.log(`${t1 - t0}`);
    }
}
main().then(() => {
    console.log('Done');
});
