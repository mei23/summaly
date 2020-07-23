import Summary from './summary';
import general from './general';

type Result = Summary & {
	/**
	 * The actual url of that web page
	 */
	url: string;
};

/**
 * Summarize an web page
 */
export default async (url: string): Promise<Result> => {
	const _url = new URL(url);

	// Get summary
	const summary = await general(_url);

	if (summary == null) {
		throw 'failed summarize';
	}

	return Object.assign(summary, {
		url
	});
};
