import { Router } from 'express';
import { getSettings, updateSettings, resetDemoData } from '../controllers/settingsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Settings view can be public or authenticated, updating requires auth
router.get('/', getSettings);
router.put('/', authenticate, updateSettings);
router.post('/reset-demo', authenticate, resetDemoData);

export default router;
