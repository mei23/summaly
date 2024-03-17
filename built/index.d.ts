import { Summaly } from './summaly';
type Options = {
    allowedPlugins?: string[];
};
type RequestOptions = {
    /**
     * Accept-Language for the request
     */
    lang?: string | null;
    /**
     * Use range for the request
     */
    useRange?: boolean;
};
export declare class Summary {
    private plugins;
    constructor(options?: Options);
    summary(url: string, requestOptions?: RequestOptions): Promise<Summaly>;
}
/**
 * Summarize an web page
 */
declare const _default: (url: string, requestOptions?: RequestOptions) => Promise<Summaly>;
export default _default;
