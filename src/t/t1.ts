import { readFile, readFileSync } from 'fs';
import { detectEncoding, toUtf8, toUtf8i, toUtf8j } from '../utils/encoding';


async function main() {
	//p1(`${__dirname}/../../sample/sjis.html`);
	p1(`${__dirname}/../../sample/_jis.html`);
}

function p1(file: string) {
	const content = readFileSync(file);
	const enc = detectEncoding(content);
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
		for (let i=0;i<count;i++){
			const dec = toUtf8i(content, enc);
		}
		const t1 = performance.now();
		console.log(`${t1-t0}`);
	}

	console.log(`encode-japanese`);
	{
		const t0 = performance.now();
		for (let i=0;i<count;i++){
			const dec = toUtf8j(content, enc);
		}
		const t1 = performance.now();
		console.log(`${t1-t0}`);
	}

}


main().then(() => {
	console.log('Done');
});
