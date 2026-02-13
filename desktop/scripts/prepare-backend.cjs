const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const backendSrc = path.resolve(__dirname, '../../backend/src');
const backendPkg = path.resolve(__dirname, '../../backend/package.json');
const destDir = path.resolve(__dirname, '../backend-dist');
const prismaSchema = path.resolve(__dirname, '../prisma/schema.prisma');

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

// Replace schema.prisma with SQLite version
console.log('Replacing Prisma schema with SQLite version...');
fs.copyFileSync(prismaSchema, path.join(destDir, 'src/prisma/schema.prisma'));

// Patch index.ts to listen on 0.0.0.0 (Already done in backend/src/index.ts)
// console.log('Patching index.ts to listen on 0.0.0.0...');
// const indexTsPath = path.join(destDir, 'src/index.ts');
// let indexTsContent = fs.readFileSync(indexTsPath, 'utf8');
// indexTsContent = indexTsContent.replace(
//     /port: \(process\.env\.PORT \|\| 3000\) as number/,
//     "port: (process.env.PORT || 3000) as number, hostname: '0.0.0.0'"
// );
// fs.writeFileSync(indexTsPath, indexTsContent);

// Patch app.ts to use PUBLIC_DIR env var
console.log('Patching app.ts to use PUBLIC_DIR...');
const appTsPath = path.join(destDir, 'src/app.ts');
let appTsContent = fs.readFileSync(appTsPath, 'utf8');

// Insert import if needed
if (!appTsContent.includes("import path from 'path'") && !appTsContent.includes('import path from "path"')) {
    appTsContent = "import path from 'path';\n" + appTsContent;
}

// Replace route mounting
appTsContent = appTsContent.replace(
    /app.use\('\/\*', serveStatic\({ root: '\.\/public' \}\)\);/,
    "app.use('/*', serveStatic({ root: process.env.PUBLIC_DIR || './public' }));"
);

appTsContent = appTsContent.replace(
    /app.get\('\*', serveStatic\({ path: '\.\/public\/index.html' \}\)\);/,
    "app.get('*', serveStatic({ path: (process.env.PUBLIC_DIR ? path.join(process.env.PUBLIC_DIR, 'index.html') : './public/index.html') }));"
);

fs.writeFileSync(appTsPath, appTsContent);

/*
// Copy frontend build to backend-dist/public
console.log('Copying frontend build to public...');
const frontendDist = path.resolve(__dirname, '../../desktop/frontend-dist'); // created by build:frontend
const publicDir = path.join(destDir, 'src/public');
if (fs.existsSync(frontendDist)) {
    fs.mkdirSync(publicDir, { recursive: true });
    fs.cpSync(frontendDist, publicDir, { recursive: true });
} else {
    console.warn('Frontend dist not found, skipping copy to public.');
}
*/

const esbuild = require('esbuild');

// ... (existing code)

// Patch client.ts to import from @prisma/client
console.log('Patching client.ts to use @prisma/client...');
const clientTsPath = path.join(destDir, 'src/client.ts');
if (fs.existsSync(clientTsPath)) {
    let clientTsContent = fs.readFileSync(clientTsPath, 'utf8');
    clientTsContent = clientTsContent.replace(
        /from '\.\/generated\/prisma\/index\.js'/,
        "from '@prisma/client'"
    );
    fs.writeFileSync(clientTsPath, clientTsContent);
}

// Patch middlewares/error.ts to use @prisma/client
console.log('Patching middlewares/error.ts to use @prisma/client...');
const errorTsPath = path.join(destDir, 'src/middlewares/error.ts');
if (fs.existsSync(errorTsPath)) {
    let errorTsContent = fs.readFileSync(errorTsPath, 'utf8');
    errorTsContent = errorTsContent.replace(
        /from '\.\.\/generated\/prisma\/index\.js'/,
        "from '@prisma/client'"
    );
    fs.writeFileSync(errorTsPath, errorTsContent);
}

// Generate Prisma Client to default location (node_modules)
console.log('Generating Prisma Client...');
// We run prisma generate using the schema in the destination
try {
    // Set DATABASE_URL for generation/push
    const dbUrl = "file:./dev.db";
    const env = { ...process.env, DATABASE_URL: dbUrl };

    // Generate to default location (node_modules/@prisma/client)
    execSync('npx prisma generate --schema=./src/prisma/schema.prisma', { 
        cwd: destDir, 
        stdio: 'inherit',
        env
    });

    console.log('Creating initial SQLite database...');
    execSync('npx prisma db push --schema=./src/prisma/schema.prisma', {
        cwd: destDir,
        stdio: 'inherit',
        env
    });
} catch (e) {
    console.error('Failed to prepare backend:', e);
    process.exit(1);
}

// Build backend to single file
console.log('Building backend...');
try {
    esbuild.buildSync({
        entryPoints: [path.join(destDir, 'src/index.ts')],
        bundle: true,
        platform: 'node',
        target: 'node18',
        outfile: path.join(path.dirname(destDir), 'backend-dist/index.js'),
        external: ['electron', '@prisma/client', 'prisma', 'better-sqlite3', 'hono', 'dotenv', 'koffi', 'bcrypt', 'node-pre-gyp', 'mock-aws-s3', 'aws-sdk', 'nock', 'fsevents', 'buffer'],
        format: 'esm',
        banner: {
            js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
        },
        sourcemap: true,
        define: {
            'process.env.NODE_ENV': '"production"'
        }
    });
} catch (e) {
    console.error('Failed to build backend:', e);
    process.exit(1);
}

console.log('Backend preparation complete.');
