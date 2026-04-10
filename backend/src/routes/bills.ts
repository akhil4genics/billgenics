import { Router } from 'express';
import { requireAuth, validateObjectId } from '../middleware/auth';
import {
  listBills,
  createBill,
  scanReceipt,
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

router.get('/', listBills);
router.post('/', createBill);
router.post('/scan', scanReceipt);
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
