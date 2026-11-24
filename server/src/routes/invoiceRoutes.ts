import { Router } from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updatePaymentStatus,
  deleteInvoice,
} from '../controllers/invoiceController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.post('/', createInvoice);
router.patch('/:id/payment', updatePaymentStatus);
router.delete('/:id', deleteInvoice);

export default router;
