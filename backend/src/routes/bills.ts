import { Router } from 'express';
import { requireAuth, validateObjectId } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import {
  listBills,
  createBill,
  scanReceipt,
  getScanUploadUrl,
  getBillStats,
  getBill,
  updateBill,
  deleteBill,
  getUploadUrl,
  addAttachment,
  removeAttachment,
  getUploadReceiptUrl,
  uploadReceiptComplete,
} from '../controllers/bills.controller';

const router = Router();

router.use(requireAuth);

// OpenAI receipt scans are paid + expensive — cap per-IP usage tightly.
const scanLimiter = rateLimiter(30, 60 * 60 * 1000); // 30/hr per IP

router.get('/', listBills);
router.post('/', createBill);
router.post('/scan/upload-url', scanLimiter, getScanUploadUrl);
router.post('/scan', scanLimiter, scanReceipt);
router.get('/stats', getBillStats);
router.get('/:billId', validateObjectId('billId'), getBill);
router.put('/:billId', validateObjectId('billId'), updateBill);
router.delete('/:billId', validateObjectId('billId'), deleteBill);
router.post('/:billId/upload-url', validateObjectId('billId'), getUploadUrl);
router.post('/:billId/attachments', validateObjectId('billId'), addAttachment);
router.delete('/:billId/attachments', validateObjectId('billId'), removeAttachment);
router.post('/:billId/upload-receipt', validateObjectId('billId'), getUploadReceiptUrl);
router.post('/:billId/upload-complete', validateObjectId('billId'), uploadReceiptComplete);

export default router;
