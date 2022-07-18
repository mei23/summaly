import { Summaly, SummalyEx } from './summaly';

interface IPlugin {
	test: (url: URL) => boolean;
	process?: (url: URL) => Promise<Summaly>;
	postProcess?: (summaly: SummalyEx) => Promise<SummalyEx>;
}

export default IPlugin;
