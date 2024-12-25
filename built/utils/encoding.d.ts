/**
 * Detect HTML encoding
 * @param body Body in Buffer
 * @returns encoding
 */
export declare function detectEncoding(body: Buffer): string;
export declare function toUtf8(body: Buffer, encoding: string): string;
export declare function toUtf8i(body: Buffer, encoding: string): string;
export declare function toUtf8j(body: Buffer, encoding: string): string;
