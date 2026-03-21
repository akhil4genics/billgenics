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
router.post('/:billId/upload-receipt', validateObjectId('billId'), getUploadReceiptUrl);
router.post('/:billId/upload-complete', validateObjectId('billId'), uploadReceiptComplete);

export default router;
