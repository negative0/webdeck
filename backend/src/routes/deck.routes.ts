import { Hono } from 'hono';
import { exec } from 'child_process';
import { promisify } from 'util';
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

deckRoutes.post('/execute', catchAsync(async (c) => {
  const { command, type } = await c.req.json();
  
  if (!command) {
    throw new ApiError(400, 'Command is required');
  }

  let finalCommand = command;
  if (type === 'SHORTCUT') {
    // Assuming xdotool is available for Linux. 
    // For other OS, this would need different implementation.
    finalCommand = `xdotool key ${command}`;
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

export default deckRoutes;
