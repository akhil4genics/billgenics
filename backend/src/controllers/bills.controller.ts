import { Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import Bill, { EBillCategory, EBillStatus, EEntryMethod } from '../models/Bill';
import { getPresignedUploadUrl } from '../lib/s3';
import { parseReceiptImage } from '../lib/openai';

const billItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().min(0),
  total: z.number().min(0),
});

const createBillSchema = z.object({
  storeName: z.string().min(1).max(200),
  storeABN: z.string().max(50).optional(),
  storeAddress: z.string().max(500).optional(),
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
});

const updateBillSchema = createBillSchema.partial();

export async function listBills(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { month, year, category, page = '1', limit = '20' } = req.query;

    const filter: Record<string, unknown> = { userId, status: EBillStatus.ACTIVE };

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

    const [bills, total] = await Promise.all([
      Bill.find(filter).sort({ date: -1 }).skip(skip).limit(limitNum).lean(),
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

    const bill = await Bill.create({
      ...parsed,
      userId,
      date: new Date(parsed.date),
    });

    res.status(201).json({ success: true, data: bill });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Error creating bill:', error);
    res.status(500).json({ error: 'Failed to create bill' });
  }
}

export async function scanReceipt(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { image } = req.body;

    if (!image || typeof image !== 'string') {
      res.status(400).json({ error: 'Base64 image data is required' });
      return;
    }

    // Remove data URL prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    const parsed = await parseReceiptImage(base64Data);

    res.json({ success: true, data: parsed });
  } catch (error) {
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

    res.json({ success: true, data: bill });
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
      res.status(400).json({ error: 'Validation failed', details: error.errors });
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
