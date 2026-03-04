import { app, BrowserWindow, ipcMain, systemPreferences } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { networkInterfaces } from 'os';
import { exec } from 'child_process';

// Since we bundle with esbuild, we need to handle __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let backend: any;
let isServerRunning = false;

/**
 * Resolves the correct path for packaged apps by checking multiple possible locations
 * @param relativePath Relative path from app root (e.g., 'backend-dist/index.js', 'prisma/dev.db')
 * @param description Description of what we're looking for (for logging)
 * @returns The first existing path, or the first path in the array if none exist
 */
const resolvePackagedPath = (relativePath: string, description: string): string => {
  if (!app.isPackaged) {
    const devPath = path.join(__dirname, '..', relativePath);
    console.log(`Development mode - ${description} path:`, devPath);
    return devPath;
  }

  // In packaged apps, check multiple possible locations
  const possiblePaths = [
    // From ASAR
    path.join(process.resourcesPath, 'app.asar', relativePath),
    // Direct in resources
    path.join(process.resourcesPath, relativePath),
    // In app path
    path.join(app.getAppPath(), relativePath),
  ];

  console.log(`Resolving packaged path for ${description}:`, possiblePaths);
  const foundPath = possiblePaths.find(p => fs.existsSync(p));

  if (foundPath) {
    console.log(`Found ${description} at:`, foundPath);
  } else {
    console.warn(`${description} not found in any of the checked paths`);
  }

  return foundPath || possiblePaths[0];
};

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
        const initialDbPath = resolvePackagedPath('prisma/dev.db', 'initial database');

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
    const publicDir = resolvePackagedPath('frontend-dist', 'frontend');
    process.env.PUBLIC_DIR = publicDir;

    // We need to import the backend entry point
    // The backend is bundled to backend-dist/index.js
    // In packaged apps, backend-dist is unpacked from ASAR
    const backendPath = resolvePackagedPath('backend-dist/index.js', 'backend');

    if (fs.existsSync(backendPath)) {
        console.log('Backend file found, importing...');
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
        const parentDir = path.dirname(backendPath);
        if (fs.existsSync(parentDir)) {
            console.error('Parent directory exists. Contents:', fs.readdirSync(parentDir));
        } else {
            console.error('Parent directory does not exist:', parentDir);
        }
    }
  } catch (err) {
    console.error('Failed to start backend:', err);
  }
};

let mainWindow: BrowserWindow | null = null;
let lastFocusedApp = '';
let appPollInterval: ReturnType<typeof setInterval> | null = null;

function detectFocusedApp(callback: (appName: string) => void) {
  if (process.platform === 'darwin') {
    exec(
      `osascript -e 'tell application "System Events" to get displayed name of first application process whose frontmost is true'`,
      (err, stdout) => {
         console.log('Active window', stdout.trim())
        if (!err && stdout.trim()) callback(stdout.trim());
      }
    );
  } else if (process.platform === 'linux') {
    exec(`xdotool getactivewindow getwindowname 2>/dev/null`, (err, stdout) => {
      if (!err && stdout.trim()) callback(stdout.trim());
    });
  }
}

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
  
  // Open DevTools in dev mode or when DEBUG_BUILD is enabled
  if (!app.isPackaged || process.env.DEBUG_BUILD === 'true') {
    mainWindow.webContents.openDevTools();
  }
};

app.whenReady().then(async () => {
  await startBackend();
  createWindow();

  // Request accessibility permission on macOS (needed for System Events detection)
  if (process.platform === 'darwin') {
    systemPreferences.isTrustedAccessibilityClient(false);
  }

  // Poll for focused app changes every second
  appPollInterval = setInterval(() => {
    detectFocusedApp((appName) => {
      if (appName !== lastFocusedApp) {
        lastFocusedApp = appName;
        mainWindow?.webContents.send('active-app-changed', appName);
      }
    });
  }, 1000);

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

// On-demand active app query (for "Capture active app" button)
ipcMain.handle('get-active-app', () => {
  return new Promise<string>((resolve) => {
    detectFocusedApp(resolve);
  });
});

app.on('window-all-closed', () => {
  if (appPollInterval) clearInterval(appPollInterval);
  if (process.platform !== 'darwin') app.quit();
});
