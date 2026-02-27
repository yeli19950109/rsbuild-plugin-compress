import type { RsbuildPlugin } from '@rsbuild/core';
export interface CompressPluginOptions {
    enableGzip?: boolean;
    enableBrotli?: boolean;
    test?: RegExp;
    threshold?: number;
}
export declare const pluginCompress: (options?: CompressPluginOptions) => RsbuildPlugin;
