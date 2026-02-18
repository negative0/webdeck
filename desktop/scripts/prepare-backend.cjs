const fs = require('fs');
const path = require('path');

const backendSrc = path.resolve(__dirname, '../../backend/src');
const backendPkg = path.resolve(__dirname, '../../backend/package.json');
const destDir = path.resolve(__dirname, '../backend-dist');

console.log('Preparing backend for desktop...');

// Clean destination
if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
}
fs.mkdirSync(destDir, { recursive: true });

// Copy src
console.log('Copying backend source...');
fs.cpSync(backendSrc, path.join(destDir, 'src'), { recursive: true });

// Copy package.json
console.log('Copying package.json...');
fs.copyFileSync(backendPkg, path.join(destDir, 'package.json'));

// Patch app.ts to use PUBLIC_DIR env var
console.log('Patching app.ts to use PUBLIC_DIR...');
const appTsPath = path.join(destDir, 'src/app.ts');
if (fs.existsSync(appTsPath)) {
    let appTsContent = fs.readFileSync(appTsPath, 'utf8');

    // Insert import if needed
    if (!appTsContent.includes("import path from 'path'") && !appTsContent.includes('import path from "path"')) {
        appTsContent = "import path from 'path';\n" + appTsContent;
    }

    // Replace route mounting
    appTsContent = appTsContent.replace(
        /app.use\('\/\*', serveStatic\({ root: '\.\/public' }\)\);/,
        "app.use('/*', serveStatic({ root: process.env.PUBLIC_DIR || './public' }));"
    );

    appTsContent = appTsContent.replace(
        /app.get\('\*', serveStatic\({ path: '\.\/public\/index.html' }\)\);/,
        "app.get('*', serveStatic({ path: (process.env.PUBLIC_DIR ? path.join(process.env.PUBLIC_DIR, 'index.html') : './public/index.html') }));"
    );

    fs.writeFileSync(appTsPath, appTsContent);
}

const esbuild = require('esbuild');

const debug = process.env.DEBUG_BUILD === 'true';
console.log('Debug mode:', debug ? 'enabled' : 'disabled');

// Build backend to single file
console.log('Building backend...');
try {
    const backendDistDir = path.join(path.dirname(destDir), 'backend-dist');
    if (!fs.existsSync(backendDistDir)) {
         fs.mkdirSync(backendDistDir, { recursive: true });
    }

    esbuild.buildSync({
        entryPoints: [path.join(destDir, 'src/index.ts')],
        bundle: true,
        platform: 'node',
        target: 'node18',
        outfile: path.join(backendDistDir, 'index.js'),
        external: ['electron', '@prisma/client', 'prisma', 'better-sqlite3', 'hono', 'dotenv', 'koffi', 'bcrypt', 'node-pre-gyp', 'mock-aws-s3', 'aws-sdk', 'nock', 'fsevents', 'buffer'],
        format: 'esm',
        banner: {
            js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
        },
        sourcemap: true || debug,
        minify: !debug,
        define: {
            'process.env.NODE_ENV': '"production"',
            'process.env.DEBUG_BUILD': `"${debug}"`
        }
    });
} catch (e) {
    console.error('Failed to build backend:', e);
    process.exit(1);
}

console.log('Backend preparation complete.');
