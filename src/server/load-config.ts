import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';

type Config = {
	allowedPlugins?: string[];
	useRange?: boolean;
};

export default function () {
	const path = `${__dirname}/../../server_config.yml`;
	try {
		const config = yaml.load(readFileSync(path, 'utf-8'));
		return config as Config;
	} catch {
		return {} as Config;
	}
}
