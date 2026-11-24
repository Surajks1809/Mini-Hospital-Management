import { Router } from 'express';
import { getReportsSummary, exportReportCsv } from '../controllers/reportsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/summary', getReportsSummary);
router.get('/export', exportReportCsv);

export default router;
