import { Hono } from 'hono';
import { backupService } from '../services/backupService.ts';
import catchAsync from '../utils/catchAsync.ts';

const backupRoutes = new Hono();

backupRoutes.get('/', catchAsync(async (c) => {
  const userId = c.get('userId');
  const data = await backupService.exportBackup(userId);
  return c.json(data);
}));

backupRoutes.post('/restore', catchAsync(async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const merge = c.req.query('merge') === 'true';
  const result = await backupService.restoreBackup(userId, body, merge);
  return c.json({ success: true, ...result });
}));

export default backupRoutes;
