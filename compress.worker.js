// build-plugins/compress.worker.ts
import { parentPort, workerData } from 'node:worker_threads';
import { promisify } from 'node:util';
import zlib from 'node:zlib';

const gzip = promisify(zlib.gzip);
const brotliCompress = promisify(zlib.brotliCompress);

async function run() {
    const { source, enableGzip, enableBrotli } = workerData;
    const result = {};

    if (enableGzip) {
        result.gzip = await gzip(source, { level: 9 });
    }

    if (enableBrotli) {
        result.brotli = await brotliCompress(source, {
            params: {
                [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
            },
        });
    }

    parentPort?.postMessage(result);
}

run();
