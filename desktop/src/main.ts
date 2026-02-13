import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { networkInterfaces } from 'os';

// Since we bundle with esbuild, we need to handle __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let backend: any;
let isServerRunning = false;

// Import backend to start it
// Note: This relies on prepare-backend.cjs having run first
// We dynamically import to ensure environment is set up first if needed
const startBackend = async () => {
  try {
    // Determine the path to the backend entry point
    // In dev: ../backend-dist/src/index.ts
    // In prod: bundled into this file or located in resources
    
    // Setup Database
    const userDataPath = app.getPath('userData');
    let dbPath = path.join(userDataPath, 'webdeck.db');
    
    // In development, use the desktop database directly to avoid copying
    if (!app.isPackaged) {
        // __dirname is dist/ (since we run from dist/main.js)
        // ../../desktop/prisma/dev.db
        const desktopDbPath = path.resolve(__dirname, '../prisma/dev.db');
        if (fs.existsSync(desktopDbPath)) {
            console.log('Using desktop database directly:', desktopDbPath);
            dbPath = desktopDbPath;
        } else {
            console.warn('Desktop database not found at', desktopDbPath, 'falling back to userData copy');
        }
    }

    // Copy initial DB if needed (only if we are using the local userData copy)
    if (dbPath === path.join(userDataPath, 'webdeck.db') && !fs.existsSync(dbPath)) {
        const initialDbPath = app.isPackaged
            ? path.join(process.resourcesPath, 'desktop/prisma/dev.db')
            : path.join(__dirname, '../prisma/dev.db');

        if (fs.existsSync(initialDbPath)) {
             console.log('Copying initial database to', dbPath);
             fs.mkdirSync(path.dirname(dbPath), { recursive: true });
             fs.copyFileSync(initialDbPath, dbPath);
        } else {
             console.log('Initial database not found at', initialDbPath);
        }
    }
    
    process.env.DATABASE_URL = `file:${dbPath}`;
    process.env.PORT = '3333'; // Or find free port

    // Set PUBLIC_DIR for backend to serve frontend
    // We point to frontend-dist which is bundled in the app
    const publicDir = path.join(__dirname, '../frontend-dist');
    process.env.PUBLIC_DIR = publicDir;

    // We need to import the backend entry point
    // The backend is bundled to backend-dist/index.js
    const backendPath = path.join(__dirname, '../backend-dist/index.js');
    if (fs.existsSync(backendPath)) {
        backend = await import(backendPath);
        if (backend.start) {
            await backend.start();
            isServerRunning = true;
            console.log('Backend started via start()');
        } else {
             console.log('Backend imported (legacy mode)');
             isServerRunning = true; 
        }
    } else {
        console.error('Backend not found at', backendPath);
    }
  } catch (err) {
    console.error('Failed to start backend:', err);
  }
};

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the frontend
  // Always load from file for stability
  if (true) { 
    // In production, load from file
    mainWindow.loadFile(path.join(__dirname, '../frontend-dist/index.html'));
  } else {
    // In development, load from vite dev server
    const devUrl = 'http://localhost:5003'; // Updated port to match vite config
    mainWindow.loadURL(devUrl).catch((err) => {
        console.log('Failed to load dev server, falling back to file:', err.message);
        mainWindow?.loadFile(path.join(__dirname, '../frontend-dist/index.html'));
    });
  }
  
  // Open DevTools in dev
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
};

app.whenReady().then(async () => {
  await startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

ipcMain.on('start-server', async (event) => {
    if (backend && backend.start) {
        try {
            await backend.start();
            isServerRunning = true;
            event.sender.send('server-status', true);
            event.sender.send('server-log', 'Server started successfully.');
        } catch (e: any) {
            event.sender.send('server-log', `Failed to start server: ${e.message}`);
        }
    } else {
        event.sender.send('server-log', 'Backend not loaded or does not support start().');
    }
});

ipcMain.on('stop-server', async (event) => {
     if (backend && backend.stop) {
         try {
            await backend.stop();
            isServerRunning = false;
            event.sender.send('server-status', false);
            event.sender.send('server-log', 'Server stopped.');
         } catch (e: any) {
            event.sender.send('server-log', `Failed to stop server: ${e.message}`);
         }
     } else {
        event.sender.send('server-log', 'Backend not loaded or does not support stop().');
     }
});

ipcMain.on('get-server-status', (event) => {
    event.sender.send('server-status', isServerRunning);
});

ipcMain.on('get-ip-address', (event) => {
    const nets = networkInterfaces();
    let ip = 'Unknown';
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]!) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                ip = net.address;
                break;
            }
        }
        if (ip !== 'Unknown') break;
    }
    event.sender.send('ip-address', ip);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
