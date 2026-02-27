// build-plugins/plugin-compress.ts
import type { RsbuildPlugin } from '@rsbuild/core';
import type { RspackPluginInstance } from '@rspack/core';
import { Worker } from 'node:worker_threads';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';

export interface CompressPluginOptions {
    enableGzip?: boolean;
    enableBrotli?: boolean;
    test?: RegExp;
    threshold?: number;
}

export const pluginCompress = (
    options: CompressPluginOptions = {},
): RsbuildPlugin => {
    const {
        enableGzip = true,
        enableBrotli = true,
        test = /\.(js|css|html|svg)$/,
        threshold = 1024,
    } = options;

    const maxWorkers = Math.max(1, os.cpus().length - 1);
    const queue: Promise<any>[] = [];

    return {
        name: 'rsbuild-plugin-compress',

        setup(api) {
            if (api.context.action !== 'build') {
                api.logger.info(`rsbuild-plugin-compress: ${api.context.action} mode, skip compression.`);
                return;
            } else {
                api.logger.info(`rsbuild-plugin-compress: ${api.context.action} mode, start compression.`);
            }
            api.modifyRsbuildConfig((config) => {
                // nothing here, we modify rspack config below
            });

            api.modifyRspackConfig((config) => {
                if (!config.plugins) {
                    config.plugins = [];
                }
                config.plugins.push({
                    apply(compiler) {
                        compiler.hooks.afterEmit.tapPromise(
                            'rsbuild-plugin-compress',
                            async (compilation) => {
                                const outDir = compiler.outputPath;

                                for (const filename of Object.keys(compilation.assets)) {
                                    if (!test.test(filename)) continue;

                                    const asset = compilation.getAsset(filename);
                                    if (!asset) {
                                        continue;
                                    }
                                    const source = asset?.source?.source?.()?.toString('utf-8');
                                    if (!source || source.length < threshold) continue;

                                    const worker = new Worker(
                                        path.resolve(__dirname, './compress.worker.js'),
                                        {
                                            workerData: { source, enableGzip, enableBrotli },
                                        },
                                    );

                                    const job = new Promise<void>((resolve, reject) => {
                                        worker.on('message', async (result: Record<string, Buffer>) => {
                                            const filePath = path.join(outDir, filename);

                                            if (result.gzip) {
                                                await fs.promises.writeFile(`${filePath}.gz`, result.gzip);
                                            }
                                            if (result.brotli) {
                                                await fs.promises.writeFile(`${filePath}.br`, result.brotli);
                                            }
                                            resolve();
                                        });
                                        worker.on('error', reject);
                                    });

                                    queue.push(job);

                                    // 控制最大并发
                                    while (queue.length >= maxWorkers) {
                                        await Promise.race(queue);
                                        queue.splice(0, 1);
                                    }
                                }

                                await Promise.all(queue);
                            },
                        );
                    },
                } as RspackPluginInstance);
            });
        },
    };
};
