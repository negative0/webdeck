import { Hono } from 'hono';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import { deckService } from '../services/deckService.ts';
import catchAsync from '../utils/catchAsync.ts';
import ApiError from '../utils/ApiError.ts';

const execAsync = promisify(exec);

const deckRoutes = new Hono();

deckRoutes.get('/', catchAsync(async (c) => {
  const userId = c.get('userId');
  const config = await deckService.getDeckConfig(userId);
  return c.json(config);
}));

deckRoutes.post('/', catchAsync(async (c) => {
  const userId = c.get('userId');
  const config = await c.req.json();
  if (!Array.isArray(config)) {
    throw new ApiError(400, 'Invalid configuration format. Expected an array.');
  }
  const result = await deckService.saveDeckConfig(userId, config);
  return c.json(result);
}));

deckRoutes.get('/list', catchAsync(async (c) => {
  const userId = c.get('userId');
  const decks = await deckService.getDecks(userId);
  return c.json(decks);
}));

deckRoutes.post('/list', catchAsync(async (c) => {
  const userId = c.get('userId');
  const data = await c.req.json();
  const deck = await deckService.createDeck(userId, data);
  return c.json(deck);
}));

deckRoutes.post('/execute', catchAsync(async (c) => {
  const { command, type } = await c.req.json();
  
  if (!command) {
    throw new ApiError(400, 'Command is required');
  }

  let finalCommand = command;

  if (type === 'SHORTCUT') {
    if (process.platform === 'darwin') {
      const parts = command.split('+');
      const modifierMap: Record<string, string> = {
        ctrl: 'control down',
        control: 'control down',
        cmd: 'command down',
        command: 'command down',
        shift: 'shift down',
        alt: 'option down',
        option: 'option down',
      };
      const modifiers: string[] = [];
      let key = '';
      for (const part of parts) {
        const lower = part.toLowerCase();
        if (modifierMap[lower]) {
          modifiers.push(modifierMap[lower]);
        } else {
          key = part;
        }
      }
      const safeKey = key.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const usingClause = modifiers.length > 0 ? ` using {${modifiers.join(', ')}}` : '';
      finalCommand = `osascript -e 'tell application "System Events" to keystroke "${safeKey}"${usingClause}'`;
    } else {
      // Linux/X11 implementation
      finalCommand = `xdotool key "${command}"`;
    }
  } else if (type === 'PASTE') {
    if (process.platform === 'darwin') {
      // Escape for AppleScript and Shell
      const safeCommand = command.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "'\\''");
      finalCommand = `osascript -e 'set the clipboard to "${safeCommand}"' -e 'tell application "System Events" to keystroke "v" using command down'`;
    } else {
      // Linux/X11 implementation
      finalCommand = `xdotool type --delay 50 "${command}"`;
    }
  }

  try {
    console.log('Executing:', finalCommand);
    const { stdout, stderr } = await execAsync(finalCommand);
    return c.json({ success: true, stdout, stderr });
  } catch (error: any) {
    console.error('Execution error:', error);
    return c.json({ 
      success: false, 
      error: error.message,
      stderr: error.stderr 
    }, 500);
  }
}));

const BROWSER_APPLESCRIPTS: Record<string, string> = {
  'Google Chrome': `tell application "Google Chrome" to get URL of active tab of front window`,
  'Arc':           `tell application "Arc" to get URL of active tab of front window`,
  'Safari':        `tell application "Safari" to get URL of front document`,
};

// Returns the name of the currently focused application and active browser URL
deckRoutes.get('/context', catchAsync(async (c) => {
  const activeApp = await new Promise<string | null>((resolve) => {
    if (os.platform() === 'darwin') {
      exec(
        `osascript -e 'tell application "System Events" to get displayed name of first application process whose frontmost is true'`,
        (err, stdout) => resolve(!err && stdout.trim() ? stdout.trim() : null)
      );
    } else if (os.platform() === 'linux') {
      exec(`xdotool getactivewindow getwindowname 2>/dev/null`, (err, stdout) =>
        resolve(!err && stdout.trim() ? stdout.trim() : null)
      );
    } else {
      resolve(null);
    }
  });

  let activeUrl: string | null = null;
  if (activeApp && BROWSER_APPLESCRIPTS[activeApp] && os.platform() === 'darwin') {
    const script = BROWSER_APPLESCRIPTS[activeApp];
    activeUrl = await new Promise((resolve) => {
      exec(`osascript -e '${script}'`, (err, stdout) =>
        resolve(!err && stdout.trim() ? stdout.trim() : null)
      );
    });
  }

  return c.json({ activeApp, activeUrl });
}));

deckRoutes.get('/:id', catchAsync(async (c) => {
  const userId = c.get('userId');
  const deckId = c.req.param('id');
  const config = await deckService.getDeckConfig(userId, deckId);
  return c.json(config);
}));

deckRoutes.post('/:id', catchAsync(async (c) => {
  const userId = c.get('userId');
  const deckId = c.req.param('id');
  const config = await c.req.json();
  if (!Array.isArray(config)) {
    throw new ApiError(400, 'Invalid configuration format. Expected an array.');
  }
  const result = await deckService.saveDeckConfig(userId, config, deckId);
  return c.json(result);
}));

deckRoutes.delete('/:id', catchAsync(async (c) => {
  const userId = c.get('userId');
  const deckId = c.req.param('id');
  await deckService.deleteDeck(userId, deckId);
  return c.json({ success: true });
}));

deckRoutes.put('/:id/metadata', catchAsync(async (c) => {
  const userId = c.get('userId');
  const deckId = c.req.param('id');
  const data = await c.req.json();
  const deck = await deckService.updateDeck(userId, deckId, data);
  return c.json(deck);
}));

export default deckRoutes;
