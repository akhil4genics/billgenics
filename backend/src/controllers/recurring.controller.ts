import { Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import RecurringBill, {
  ECadence,
  ERecurringChannel,
  ERecurringStatus,
  IRecurringBillModel,
} from '../models/RecurringBill';
import Bill, { EBillCategory, EBillStatus, EEntryMethod } from '../models/Bill';
import Notification, { ENotificationType } from '../models/Notification';
import User from '../models/User';

const createSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.nativeEnum(EBillCategory).default(EBillCategory.OTHER),
  amount: z.number().min(0),
  cadence: z.nativeEnum(ECadence),
  intervalDays: z.number().int().positive().max(365).optional(),
  nextDueDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  endDate: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), 'Invalid date')
    .nullish(),
  reminderDaysBefore: z.number().int().min(0).max(60).default(3),
  channel: z.nativeEnum(ERecurringChannel).default(ERecurringChannel.MANUAL),
  notes: z.string().max(1000).optional(),
});

const updateSchema = createSchema.partial().extend({
  status: z.nativeEnum(ERecurringStatus).optional(),
});

function rollForward(from: Date, cadence: ECadence, intervalDays?: number): Date {
  const d = new Date(from);
  switch (cadence) {
    case ECadence.WEEKLY:
      d.setDate(d.getDate() + 7);
      break;
    case ECadence.FORTNIGHTLY:
      d.setDate(d.getDate() + 14);
      break;
    case ECadence.MONTHLY:
      d.setMonth(d.getMonth() + 1);
      break;
    case ECadence.QUARTERLY:
      d.setMonth(d.getMonth() + 3);
      break;
    case ECadence.YEARLY:
      d.setFullYear(d.getFullYear() + 1);
      break;
    case ECadence.CUSTOM:
      d.setDate(d.getDate() + (intervalDays ?? 30));
      break;
  }
  return d;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function listRecurring(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const items = await RecurringBill.find({ userId })
      .sort({ status: 1, nextDueDate: 1 })
      .lean();
    res.json({ success: true, data: { items } });
  } catch (error) {
    console.error('Error listing recurring bills:', error);
    res.status(500).json({ error: 'Failed to list recurring bills' });
  }
}

export async function createRecurring(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
      return;
    }

    if (parsed.data.cadence === ECadence.CUSTOM && !parsed.data.intervalDays) {
      res.status(400).json({ error: 'intervalDays is required for custom cadence' });
      return;
    }

    const nextDueDate = new Date(parsed.data.nextDueDate);
    const endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : undefined;
    if (endDate && endDate < nextDueDate) {
      res.status(400).json({ error: 'endDate must be on or after nextDueDate' });
      return;
    }

    const created = await RecurringBill.create({
      ...parsed.data,
      userId: new mongoose.Types.ObjectId(userId),
      nextDueDate,
      endDate,
    });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('Error creating recurring bill:', error);
    res.status(500).json({ error: 'Failed to create recurring bill' });
  }
}

export async function updateRecurring(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
      return;
    }

    const update: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.nextDueDate) {
      update.nextDueDate = new Date(parsed.data.nextDueDate);
    }
    if (parsed.data.endDate === null) {
      update.endDate = null;
    } else if (parsed.data.endDate) {
      update.endDate = new Date(parsed.data.endDate);
    }

    const item = await RecurringBill.findOneAndUpdate(
      { _id: id, userId },
      { $set: update },
      { new: true }
    );

    if (!item) {
      res.status(404).json({ error: 'Recurring bill not found' });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error updating recurring bill:', error);
    res.status(500).json({ error: 'Failed to update recurring bill' });
  }
}

export async function deleteRecurring(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const item = await RecurringBill.findOneAndDelete({ _id: id, userId });
    if (!item) {
      res.status(404).json({ error: 'Recurring bill not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting recurring bill:', error);
    res.status(500).json({ error: 'Failed to delete recurring bill' });
  }
}

async function generateBillForCycle(item: IRecurringBillModel): Promise<boolean> {
  const cycleKey = startOfDay(item.nextDueDate).getTime();
  if (
    item.lastGeneratedCycleDate &&
    startOfDay(item.lastGeneratedCycleDate).getTime() === cycleKey
  ) {
    return false;
  }

  const bill = await Bill.create({
    userId: item.userId,
    storeName: item.name,
    date: item.nextDueDate,
    category: item.category,
    items: [],
    subtotal: item.amount,
    tax: 0,
    total: item.amount,
    notes: item.notes,
    tags: [],
    attachments: [],
    entryMethod: EEntryMethod.RECURRING,
    recurringBillId: item._id,
    status: EBillStatus.ACTIVE,
  });

  item.lastGeneratedCycleDate = item.nextDueDate;
  item.lastGeneratedBillId = bill._id as unknown as IRecurringBillModel['lastGeneratedBillId'];
  return true;
}

function advanceSchedule(item: IRecurringBillModel): void {
  item.nextDueDate = rollForward(item.nextDueDate, item.cadence, item.intervalDays);
  if (item.endDate && item.nextDueDate > item.endDate) {
    item.status = ERecurringStatus.COMPLETED;
  }
}

/**
 * Manually skip the current cycle and roll the schedule forward.
 * Bills are auto-generated by `sync` on the due date — this endpoint
 * only updates the schedule's bookkeeping. If the rolled-forward date
 * crosses `endDate`, the schedule is marked completed.
 */
export async function markPaid(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const item = await RecurringBill.findOne({ _id: id, userId });
    if (!item) {
      res.status(404).json({ error: 'Recurring bill not found' });
      return;
    }

    item.lastPaidDate = new Date();
    advanceSchedule(item);
    await item.save();

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error marking recurring bill as paid:', error);
    res.status(500).json({ error: 'Failed to mark as paid' });
  }
}

export async function forecast(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const days = Math.min(365, Math.max(1, parseInt((req.query.days as string) || '30', 10)));
    const today = startOfDay(new Date());
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + days);

    const items = await RecurringBill.find({
      userId,
      status: ERecurringStatus.ACTIVE,
    }).lean();

    const occurrences: Array<{
      recurringBillId: string;
      name: string;
      category: string;
      amount: number;
      dueDate: string;
      channel: string;
    }> = [];

    for (const item of items) {
      let cursor = new Date(item.nextDueDate);
      const stopAt = item.endDate
        ? new Date(Math.min(horizon.getTime(), new Date(item.endDate).getTime()))
        : horizon;
      // Skip stale due dates that are far in the past — start from today.
      while (cursor < today) {
        cursor = rollForward(cursor, item.cadence, item.intervalDays);
      }
      while (cursor <= stopAt) {
        occurrences.push({
          recurringBillId: String(item._id),
          name: item.name,
          category: item.category,
          amount: item.amount,
          dueDate: cursor.toISOString(),
          channel: item.channel,
        });
        cursor = rollForward(cursor, item.cadence, item.intervalDays);
      }
    }

    occurrences.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const totalUpcoming = occurrences.reduce((sum, o) => sum + o.amount, 0);

    res.json({
      success: true,
      data: {
        days,
        from: today.toISOString(),
        to: horizon.toISOString(),
        occurrences,
        totalUpcoming,
      },
    });
  } catch (error) {
    console.error('Error generating forecast:', error);
    res.status(500).json({ error: 'Failed to generate forecast' });
  }
}

function avgGapDaysToCadence(avgGap: number): { cadence: ECadence; intervalDays?: number } {
  if (avgGap >= 5 && avgGap <= 9) return { cadence: ECadence.WEEKLY };
  if (avgGap >= 12 && avgGap <= 16) return { cadence: ECadence.FORTNIGHTLY };
  if (avgGap >= 27 && avgGap <= 33) return { cadence: ECadence.MONTHLY };
  if (avgGap >= 80 && avgGap <= 100) return { cadence: ECadence.QUARTERLY };
  if (avgGap >= 350 && avgGap <= 380) return { cadence: ECadence.YEARLY };
  return { cadence: ECadence.CUSTOM, intervalDays: Math.max(1, Math.round(avgGap)) };
}

export async function suggestions(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const lookback = new Date();
    lookback.setFullYear(lookback.getFullYear() - 1);

    const bills = await Bill.find({
      userId,
      status: EBillStatus.ACTIVE,
      date: { $gte: lookback },
    })
      .select('storeName category total date')
      .sort({ date: 1 })
      .lean();

    const groups = new Map<string, typeof bills>();
    for (const bill of bills) {
      const key = bill.storeName.trim().toLowerCase();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(bill);
    }

    const [existing, user] = await Promise.all([
      RecurringBill.find({ userId }).select('name').lean(),
      User.findById(userId).select('dismissedRecurringSuggestions').lean(),
    ]);
    const existingNames = new Set(existing.map((r) => r.name.trim().toLowerCase()));
    const dismissedNames = new Set(
      (user?.dismissedRecurringSuggestions || []).map((n) => n.trim().toLowerCase())
    );

    const out: Array<{
      name: string;
      category: string;
      amount: number;
      cadence: ECadence;
      intervalDays?: number;
      nextDueDate: string;
      occurrences: number;
      confidence: 'high' | 'medium' | 'low';
    }> = [];

    for (const [key, list] of groups) {
      if (list.length < 2) continue;
      if (existingNames.has(key)) continue;
      if (dismissedNames.has(key)) continue;

      const gaps: number[] = [];
      for (let i = 1; i < list.length; i++) {
        const gap =
          (new Date(list[i].date).getTime() - new Date(list[i - 1].date).getTime()) /
          (1000 * 60 * 60 * 24);
        gaps.push(gap);
      }
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      if (avgGap < 4 || avgGap > 400) continue;

      const variance =
        gaps.reduce((acc, g) => acc + Math.pow(g - avgGap, 2), 0) / gaps.length;
      const stdDev = Math.sqrt(variance);
      const cv = avgGap > 0 ? stdDev / avgGap : 1;

      let confidence: 'high' | 'medium' | 'low' = 'low';
      if (list.length >= 3 && cv < 0.2) confidence = 'high';
      else if (list.length >= 2 && cv < 0.4) confidence = 'medium';

      const { cadence, intervalDays } = avgGapDaysToCadence(avgGap);
      const lastDate = new Date(list[list.length - 1].date);
      const nextDue = rollForward(lastDate, cadence, intervalDays);
      const avgAmount =
        list.reduce((sum, b) => sum + (b.total || 0), 0) / list.length;

      out.push({
        name: list[list.length - 1].storeName,
        category: list[list.length - 1].category,
        amount: Math.round(avgAmount * 100) / 100,
        cadence,
        intervalDays,
        nextDueDate: nextDue.toISOString(),
        occurrences: list.length,
        confidence,
      });
    }

    out.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 } as const;
      return order[a.confidence] - order[b.confidence];
    });

    res.json({ success: true, data: { suggestions: out } });
  } catch (error) {
    console.error('Error building recurring suggestions:', error);
    res.status(500).json({ error: 'Failed to build suggestions' });
  }
}

/**
 * Idempotent sync job. For each user's active recurring schedule:
 *   1. Auto-generate a `Bill` for any cycle whose `nextDueDate` has arrived
 *      (so the expense flows into monthly stats automatically), then roll
 *      the schedule forward — completing it if `endDate` is reached.
 *   2. Create a `RECURRING_BILL_DUE` notification for any schedule whose
 *      next due date falls inside its reminder window.
 *
 * Both halves are deduplicated per cycle via `lastGeneratedCycleDate` and
 * `lastReminderCycleDate`, so re-running this job (or running it from
 * multiple triggers) never creates duplicates.
 */
export async function sync(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const today = startOfDay(new Date());

    const items = await RecurringBill.find({
      userId,
      status: ERecurringStatus.ACTIVE,
    });

    let billsGenerated = 0;
    let remindersCreated = 0;

    for (const item of items) {
      // 1. Auto-generate Bills for every cycle that has come due.
      //    A long-paused or freshly-created schedule with a past nextDueDate
      //    can fire several cycles back-to-back here.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (item.status !== ERecurringStatus.ACTIVE) break;
        if (startOfDay(item.nextDueDate).getTime() > today.getTime()) break;
        if (item.endDate && startOfDay(item.nextDueDate).getTime() > startOfDay(item.endDate).getTime()) {
          item.status = ERecurringStatus.COMPLETED;
          break;
        }
        const generated = await generateBillForCycle(item);
        if (generated) billsGenerated += 1;
        advanceSchedule(item);
      }

      // 2. Reminder for the upcoming cycle (if we're inside the reminder window).
      if (item.status === ERecurringStatus.ACTIVE) {
        const dueIn =
          (startOfDay(item.nextDueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
        if (dueIn <= item.reminderDaysBefore) {
          const cycleKey = startOfDay(item.nextDueDate).getTime();
          const alreadyReminded =
            item.lastReminderCycleDate &&
            startOfDay(item.lastReminderCycleDate).getTime() === cycleKey;
          if (!alreadyReminded) {
            const dueLabel =
              dueIn <= 0
                ? 'is due now'
                : dueIn < 1
                ? 'is due today'
                : dueIn < 2
                ? 'is due tomorrow'
                : `is due in ${Math.ceil(dueIn)} days`;
            await Notification.create({
              userId: new mongoose.Types.ObjectId(userId),
              type: ENotificationType.RECURRING_BILL_DUE,
              message: `${item.name} (~$${item.amount.toFixed(2)}) ${dueLabel}.`,
              relatedRecurringBillId: item._id,
            });
            item.lastReminderCycleDate = item.nextDueDate;
            remindersCreated += 1;
          }
        }
      }

      await item.save();
    }

    res.json({
      success: true,
      data: { billsGenerated, remindersCreated },
    });
  } catch (error) {
    console.error('Error running recurring sync:', error);
    res.status(500).json({ error: 'Failed to sync recurring bills' });
  }
}

const dismissSchema = z.object({
  name: z.string().min(1).max(200),
});

export async function dismissSuggestion(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const parsed = dismissSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }
    const key = parsed.data.name.trim().toLowerCase();
    await User.updateOne(
      { _id: userId },
      { $addToSet: { dismissedRecurringSuggestions: key } }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error dismissing suggestion:', error);
    res.status(500).json({ error: 'Failed to dismiss suggestion' });
  }
}

export async function restoreSuggestions(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    await User.updateOne({ _id: userId }, { $set: { dismissedRecurringSuggestions: [] } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error restoring suggestions:', error);
    res.status(500).json({ error: 'Failed to restore suggestions' });
  }
}
