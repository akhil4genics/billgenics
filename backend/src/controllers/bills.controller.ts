import { Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import Bill, { EBillCategory, EBillStatus, EEntryMethod } from '../models/Bill';
import { getPresignedUploadUrl, getPresignedUrl, deleteS3Object, copyS3Object } from '../lib/s3';
import { parseReceiptImage, NotAReceiptError } from '../lib/openai';

const billItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().min(0),
  total: z.number().min(0),
});

const billAttachmentSchema = z.object({
  key: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().optional(),
});

const billWarrantySchema = z.object({
  expiryDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date').optional(),
  details: z.string().max(1000).optional(),
});

const createBillSchema = z.object({
  storeName: z.string().min(1).max(200),
  storeABN: z.string().max(50).nullish(),
  storeAddress: z.string().max(500).nullish(),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  category: z.nativeEnum(EBillCategory).default(EBillCategory.OTHER),
  items: z.array(billItemSchema).default([]),
  subtotal: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0),
  paymentMethod: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  entryMethod: z.nativeEnum(EEntryMethod),
  receiptImageKey: z.string().optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  warranty: billWarrantySchema.optional(),
  attachments: z.array(billAttachmentSchema).default([]),
});

const updateBillSchema = createBillSchema.partial();

export async function listBills(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { month, year, category, page = '1', limit = '20', q } = req.query;

    const filter: Record<string, unknown> = { userId, status: EBillStatus.ACTIVE };

    // Text search
    if (q && typeof q === 'string' && q.trim()) {
      const searchTerm = q.trim();
      // Use MongoDB text index for full-text search
      filter.$text = { $search: searchTerm };
    }

    if (month && year) {
      const m = parseInt(month as string, 10);
      const y = parseInt(year as string, 10);
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 1);
      filter.date = { $gte: startDate, $lt: endDate };
    } else if (year) {
      const y = parseInt(year as string, 10);
      filter.date = { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) };
    }

    if (category) {
      filter.category = category;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = Bill.find(filter).skip(skip).limit(limitNum);

    if (q) {
      query.select({ score: { $meta: 'textScore' } });
      query.sort({ score: { $meta: 'textScore' }, date: -1 });
    } else {
      query.sort({ date: -1 });
    }

    const [bills, total] = await Promise.all([
      query.lean(),
      Bill.countDocuments(filter),
    ]);

    res.json({ success: true, data: { bills, total, page: pageNum, limit: limitNum } });
  } catch (error) {
    console.error('Error listing bills:', error);
    res.status(500).json({ error: 'Failed to list bills' });
  }
}

export async function createBill(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const parsed = createBillSchema.parse(req.body);

    const billId = new mongoose.Types.ObjectId();
    let finalReceiptKey = parsed.receiptImageKey;

    // If the receipt was uploaded to the temp scan area, move it under the new bill's folder
    // so receipts are grouped per-bill and `scans/temp/` only ever holds in-flight or orphaned uploads.
    if (parsed.receiptImageKey?.startsWith(`scans/temp/${userId}/`)) {
      const filename = parsed.receiptImageKey.split('/').pop() || `${Date.now()}.jpg`;
      const destKey = `receipts/${userId}/${billId.toString()}/${filename}`;
      await copyS3Object(parsed.receiptImageKey, destKey);
      finalReceiptKey = destKey;
    }

    const billData: Record<string, unknown> = {
      ...parsed,
      _id: billId,
      userId,
      date: new Date(parsed.date),
      tags: parsed.tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
      receiptImageKey: finalReceiptKey,
    };

    if (parsed.warranty?.expiryDate) {
      billData.warranty = {
        ...parsed.warranty,
        expiryDate: new Date(parsed.warranty.expiryDate),
      };
    }

    const bill = await Bill.create(billData);

    // Best-effort cleanup of the temp scan once the bill row is durable
    if (parsed.receiptImageKey?.startsWith(`scans/temp/${userId}/`)) {
      deleteS3Object(parsed.receiptImageKey).catch((err) =>
        console.error('Failed to delete temp scan after move:', err)
      );
    }

    res.status(201).json({ success: true, data: bill });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('Error creating bill:', error);
    res.status(500).json({ error: 'Failed to create bill' });
  }
}

export async function getScanUploadUrl(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { contentType = 'image/jpeg' } = req.body;
    const ext = contentType === 'image/png' ? 'png' : 'jpg';
    const random = Math.random().toString(36).slice(2, 10);
    const key = `scans/temp/${userId}/${Date.now()}-${random}.${ext}`;
    const uploadUrl = await getPresignedUploadUrl(key, contentType);
    res.json({ success: true, data: { uploadUrl, key } });
  } catch (error) {
    console.error('Error getting scan upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
}

export async function scanReceipt(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { key } = req.body;

  if (!key || typeof key !== 'string' || !key.startsWith(`scans/temp/${userId}/`)) {
    res.status(400).json({ error: 'Invalid scan key' });
    return;
  }

  try {
    const imageUrl = await getPresignedUrl(key);
    const parsed = await parseReceiptImage(imageUrl);
    res.json({ success: true, data: { ...parsed, receiptImageKey: key } });
  } catch (error) {
    if (error instanceof NotAReceiptError) {
      // Best-effort: discard the uploaded image so the bucket doesn't accumulate non-receipts
      deleteS3Object(key).catch((err) => console.error('Failed to delete rejected scan:', err));
      res.status(400).json({ error: error.message, code: 'NOT_A_RECEIPT' });
      return;
    }
    console.error('Error scanning receipt:', error);
    res.status(500).json({ error: 'Failed to scan receipt. Please try again or enter manually.' });
  }
}

export async function getBillStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { month, year } = req.query;

    const now = new Date();
    const m = month ? parseInt(month as string, 10) : now.getMonth() + 1;
    const y = year ? parseInt(year as string, 10) : now.getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 1);

    const stats = await Bill.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: EBillStatus.ACTIVE,
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalSpent = stats.reduce((sum, s) => sum + s.total, 0);
    const billCount = stats.reduce((sum, s) => sum + s.count, 0);
    const categoryBreakdown = stats.map((s) => ({
      category: s._id as EBillCategory,
      total: s.total,
      count: s.count,
    }));

    const topCategory = categoryBreakdown.sort((a, b) => b.total - a.total)[0]?.category;

    res.json({
      success: true,
      data: { totalSpent, billCount, categoryBreakdown, topCategory, month: m, year: y },
    });
  } catch (error) {
    console.error('Error getting bill stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
}

export async function getBill(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { billId } = req.params;

    const bill = await Bill.findOne({ _id: billId, userId, status: EBillStatus.ACTIVE }).lean();

    if (!bill) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }

    // Generate presigned URLs for receipt and attachments
    let receiptImageUrl: string | undefined;
    if (bill.receiptImageKey) {
      receiptImageUrl = await getPresignedUrl(bill.receiptImageKey);
    }

    const attachmentsWithUrls = await Promise.all(
      (bill.attachments || []).map(async (att) => ({
        ...att,
        url: await getPresignedUrl(att.key),
      }))
    );

    res.json({
      success: true,
      data: { ...bill, receiptImageUrl, attachments: attachmentsWithUrls },
    });
  } catch (error) {
    console.error('Error getting bill:', error);
    res.status(500).json({ error: 'Failed to get bill' });
  }
}

export async function updateBill(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { billId } = req.params;
    const parsed = updateBillSchema.parse(req.body);

    const updateData: Record<string, unknown> = { ...parsed };
    if (parsed.date) {
      updateData.date = new Date(parsed.date);
    }
    if (parsed.tags) {
      updateData.tags = parsed.tags.map((t) => t.trim().toLowerCase()).filter(Boolean);
    }
    if (parsed.warranty?.expiryDate) {
      updateData.warranty = {
        ...parsed.warranty,
        expiryDate: new Date(parsed.warranty.expiryDate),
      };
    }

    const bill = await Bill.findOneAndUpdate(
      { _id: billId, userId, status: EBillStatus.ACTIVE },
      { $set: updateData },
      { new: true }
    ).lean();

    if (!bill) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }

    res.json({ success: true, data: bill });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('Error updating bill:', error);
    res.status(500).json({ error: 'Failed to update bill' });
  }
}

export async function deleteBill(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { billId } = req.params;

    const bill = await Bill.findOneAndUpdate(
      { _id: billId, userId, status: EBillStatus.ACTIVE },
      { $set: { status: EBillStatus.DELETED } },
      { new: true }
    );

    if (!bill) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ error: 'Failed to delete bill' });
  }
}

export async function getUploadUrl(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { billId } = req.params;
    const { contentType = 'image/jpeg', filename = 'file' } = req.body;

    const bill = await Bill.findOne({ _id: billId, userId, status: EBillStatus.ACTIVE });
    if (!bill) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }

    const ext = filename.split('.').pop() || contentType.split('/').pop() || 'bin';
    const key = `attachments/${userId}/${billId}/${Date.now()}.${ext}`;
    const uploadUrl = await getPresignedUploadUrl(key, contentType);

    res.json({ success: true, data: { uploadUrl, key } });
  } catch (error) {
    console.error('Error getting upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
}

export async function addAttachment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { billId } = req.params;
    const { key, filename, contentType, size } = req.body;

    if (!key || !filename || !contentType) {
      res.status(400).json({ error: 'key, filename, and contentType are required' });
      return;
    }

    const bill = await Bill.findOneAndUpdate(
      { _id: billId, userId, status: EBillStatus.ACTIVE },
      { $push: { attachments: { key, filename, contentType, size } } },
      { new: true }
    ).lean();

    if (!bill) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }

    res.json({ success: true, data: bill });
  } catch (error) {
    console.error('Error adding attachment:', error);
    res.status(500).json({ error: 'Failed to add attachment' });
  }
}

export async function removeAttachment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { billId } = req.params;
    const { key } = req.body;

    if (!key) {
      res.status(400).json({ error: 'Attachment key is required' });
      return;
    }

    const bill = await Bill.findOneAndUpdate(
      { _id: billId, userId, status: EBillStatus.ACTIVE },
      { $pull: { attachments: { key } } },
      { new: true }
    ).lean();

    if (!bill) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }

    res.json({ success: true, data: bill });
  } catch (error) {
    console.error('Error removing attachment:', error);
    res.status(500).json({ error: 'Failed to remove attachment' });
  }
}

// Legacy receipt upload endpoints (kept for backward compat)
export async function getUploadReceiptUrl(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { billId } = req.params;
    const { contentType = 'image/jpeg' } = req.body;

    const bill = await Bill.findOne({ _id: billId, userId, status: EBillStatus.ACTIVE });
    if (!bill) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }

    const key = `receipts/${userId}/${billId}/${Date.now()}.${contentType === 'image/png' ? 'png' : 'jpg'}`;
    const uploadUrl = await getPresignedUploadUrl(key, contentType);

    res.json({ success: true, data: { uploadUrl, key } });
  } catch (error) {
    console.error('Error getting upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
}

export async function uploadReceiptComplete(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { billId } = req.params;
    const { key } = req.body;

    if (!key) {
      res.status(400).json({ error: 'Key is required' });
      return;
    }

    const bill = await Bill.findOneAndUpdate(
      { _id: billId, userId, status: EBillStatus.ACTIVE },
      { $set: { receiptImageKey: key } },
      { new: true }
    );

    if (!bill) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }

    res.json({ success: true, data: bill });
  } catch (error) {
    console.error('Error completing upload:', error);
    res.status(500).json({ error: 'Failed to complete upload' });
  }
}
