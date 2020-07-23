import Summary from './summary';
import general from './general';
import { attachImage } from './attach-image';

/**
 * Summarize an web page
 */
export default async (url: string): Promise<Summary> => {
	const _url = new URL(url);

	// Get summary
	const summary = await general(_url);

	if (summary == null) {
		throw 'failed summarize';
	}

	await attachImage(summary);

	return summary;
};
