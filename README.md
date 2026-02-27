# rsbuild-plugin-compress

rsbuild-plugin-compress like compression-webpack-plugin 

```typescript
import { pluginCompress } from 'rsbuild-plugin-compress';
import { defineConfig } from '@rsbuild/core';

// 配置参数
interface CompressPluginOptions {
    enableGzip?: boolean;
    enableBrotli?: boolean;
    test?: RegExp;
    threshold?: number;
}

export default defineConfig({
    plugins: [
        pluginCompress({
            enableGzip: true,
            enableBrotli: false,
        }),
    ],
});
```
