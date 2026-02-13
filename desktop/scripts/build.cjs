const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const production = process.env.NODE_ENV === 'production';

async function build() {
    const mainOptions = {
        entryPoints: ['src/main.ts'],
        bundle: true,
        platform: 'node',
        target: 'node18',
        outfile: 'dist/main.js',
        external: ['electron', '@prisma/client', 'prisma', 'better-sqlite3', 'hono', 'dotenv', 'koffi'], 
        format: 'esm',
        sourcemap: !production,
        minify: production,
        loader: { '.ts': 'ts' },
        define: {
            'process.env.NODE_ENV': `"${process.env.NODE_ENV || 'production'}"`
        }
    };

    const preloadOptions = {
        entryPoints: ['src/preload.ts'],
        bundle: true,
        platform: 'node',
        target: 'node18',
        outfile: 'dist/preload.js',
        external: ['electron'],
        format: 'cjs',
        sourcemap: !production,
        minify: production,
        loader: { '.ts': 'ts' }
    };

    await Promise.all([
        esbuild.build(mainOptions),
        esbuild.build(preloadOptions)
    ]);

    console.log('Build complete');
}

build().catch(err => {
    console.error(err);
    process.exit(1);
});
