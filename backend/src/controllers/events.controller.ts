import { Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth';
import Event, { EEventStatus, EMemberStatus } from '../models/Event';
import Expense, { ESplitType } from '../models/Expense';
import Notification, { ENotificationType } from '../models/Notification';
import User from '../models/User';
import { EBillCategory } from '../models/Bill';
import { sendEmail, generateEventInviteEmail, generateEventInviteNewUserEmail } from '../lib/email';

const createEventSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});

const addExpenseSchema = z.object({
  description: z.string().min(1).max(200),
  amount: z.number().positive(),
  paidBy: z.string().min(1),
  splitType: z.nativeEnum(ESplitType),
  splits: z.array(
    z.object({
      userId: z.string().min(1),
      amount: z.number().min(0),
    })
  ),
  category: z.nativeEnum(EBillCategory).default(EBillCategory.OTHER),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
});

const inviteSchema = z.object({
  email: z.string().email(),
});

const settleSchema = z.object({
  toUserId: z.string().min(1),
  amount: z.number().positive(),
});

export async function listEvents(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const filter = req.query.status === 'closed' ? 'closed' : 'active';
    const statusFilter = filter === 'active'
      ? { status: EEventStatus.ACTIVE }
      : { status: { $in: [EEventStatus.SETTLED, EEventStatus.ARCHIVED] } };

    const events = await Event.find({
      $or: [
        { createdBy: userId },
        { 'members.userId': userId },
        { 'members.email': req.user!.email },
      ],
      ...statusFilter,
    })
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Error listing events:', error);
    res.status(500).json({ error: 'Failed to list events' });
  }
}

export async function updateEventStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { eventId } = req.params;
    const parsed = z.object({ status: z.enum(['active', 'closed']) }).parse(req.body);

    const event = await Event.findOne({ _id: eventId, createdBy: userId });
    if (!event) {
      res.status(404).json({ error: 'Event not found or you are not the creator' });
      return;
    }

    event.status = parsed.status === 'active' ? EEventStatus.ACTIVE : EEventStatus.SETTLED;
    await event.save();

    res.json({ success: true, data: event });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('Error updating event status:', error);
    res.status(500).json({ error: 'Failed to update event status' });
  }
}

export async function createEvent(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const parsed = createEventSchema.parse(req.body);

    const user = await User.findById(userId).lean();
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const event = await Event.create({
      ...parsed,
      createdBy: new mongoose.Types.ObjectId(userId),
      members: [
        {
          userId: new mongoose.Types.ObjectId(userId),
          email: user.email,
          name: user.name,
          status: EMemberStatus.ACTIVE,
        },
      ],
    });

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
}

export async function getEvent(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { eventId } = req.params;

    const event = await Event.findOne({
      _id: eventId,
      $or: [
        { createdBy: userId },
        { 'members.userId': userId },
        { 'members.email': req.user!.email },
      ],
    }).lean();

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const expenses = await Expense.find({ eventId }).sort({ date: -1 }).lean();

    res.json({ success: true, data: { event, expenses } });
  } catch (error) {
    console.error('Error getting event:', error);
    res.status(500).json({ error: 'Failed to get event' });
  }
}

export async function addExpense(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { eventId } = req.params;
    const parsed = addExpenseSchema.parse(req.body);

    const event = await Event.findOne({
      _id: eventId,
      $or: [{ createdBy: userId }, { 'members.userId': userId }, { 'members.email': req.user!.email }],
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const expense = await Expense.create({
      ...parsed,
      eventId,
      date: new Date(parsed.date),
      splits: parsed.splits.map((s) => ({ ...s, settled: false })),
    });

    // Create notifications for other members
    const user = await User.findById(userId).lean();
    const otherMembers = event.members.filter(
      (m) => m.userId && m.userId.toString() !== userId
    );

    const notifications = otherMembers.map((m) => ({
      userId: m.userId!,
      type: ENotificationType.EXPENSE_ADDED,
      message: `${user?.name || 'Someone'} added an expense "${parsed.description}" ($${parsed.amount.toFixed(2)}) to "${event.name}"`,
      relatedEventId: event._id,
      relatedUserId: new mongoose.Types.ObjectId(userId),
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('Error adding expense:', error);
    res.status(500).json({ error: 'Failed to add expense' });
  }
}

export async function updateExpense(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { eventId, expenseId } = req.params;
    const parsed = addExpenseSchema.partial().parse(req.body);

    const event = await Event.findOne({
      _id: eventId,
      $or: [{ createdBy: userId }, { 'members.userId': userId }, { 'members.email': req.user!.email }],
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const updateData: Record<string, unknown> = { ...parsed };
    if (parsed.date) {
      updateData.date = new Date(parsed.date);
    }
    if (parsed.splits) {
      updateData.splits = parsed.splits.map((s) => ({ ...s, settled: false }));
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: expenseId, eventId },
      { $set: updateData },
      { new: true }
    ).lean();

    if (!expense) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    res.json({ success: true, data: expense });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
}

export async function deleteExpense(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { eventId, expenseId } = req.params;

    const event = await Event.findOne({
      _id: eventId,
      $or: [{ createdBy: userId }, { 'members.userId': userId }, { 'members.email': req.user!.email }],
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const expense = await Expense.findOneAndDelete({ _id: expenseId, eventId });

    if (!expense) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
}

export async function inviteMember(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { eventId } = req.params;
    const parsed = inviteSchema.parse(req.body);

    const event = await Event.findOne({
      _id: eventId,
      $or: [{ createdBy: userId }, { 'members.userId': userId }, { 'members.email': req.user!.email }],
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    // Check if already a member
    const existingMember = event.members.find(
      (m) => m.email.toLowerCase() === parsed.email.toLowerCase()
    );
    if (existingMember) {
      res.status(400).json({ error: 'User is already a member of this event' });
      return;
    }

    const inviter = await User.findById(userId).lean();
    const invitee = await User.findOne({ email: parsed.email.toLowerCase() }).lean();

    const frontendUrl = process.env.FRONTEND_URL || 'https://billgenics.com';

    if (invitee) {
      // Existing user
      event.members.push({
        userId: invitee._id as unknown as mongoose.Schema.Types.ObjectId,
        email: invitee.email,
        name: invitee.name,
        status: EMemberStatus.ACTIVE,
      });
      await event.save();

      // Create notification
      await Notification.create({
        userId: invitee._id,
        type: ENotificationType.EVENT_INVITE,
        message: `${inviter?.name || 'Someone'} invited you to "${event.name}"`,
        relatedEventId: event._id,
        relatedUserId: new mongoose.Types.ObjectId(userId),
      });

      const eventLink = `${frontendUrl}/events/${event._id}`;
      await sendEmail({
        to: invitee.email,
        subject: `You've been invited to "${event.name}" on BillGenics`,
        html: generateEventInviteEmail(invitee.name, inviter?.name || 'A user', event.name, eventLink),
      });
    } else {
      // New user — create an unactivated account with registration code
      const registrationCode = crypto.randomBytes(32).toString('hex');
      const codeExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const emailLower = parsed.email.toLowerCase();
      const placeholderName = emailLower.split('@')[0];
      const placeholderPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);

      const newUser = await User.create({
        firstName: placeholderName,
        lastName: 'Invited',
        username: emailLower,
        email: emailLower,
        password: placeholderPassword,
        name: placeholderName,
        activated: false,
        userVerified: false,
        loginSession: {
          registrationCode,
          registrationCodeExpiresAt: codeExpiry,
        },
      });

      event.members.push({
        userId: newUser._id as unknown as mongoose.Schema.Types.ObjectId,
        email: emailLower,
        name: placeholderName,
        status: EMemberStatus.INVITED,
      });
      await event.save();

      const completeAccountLink = `${frontendUrl}/complete-account?email=${encodeURIComponent(emailLower)}&code=${registrationCode}`;
      await sendEmail({
        to: emailLower,
        subject: `You've been invited to "${event.name}" on BillGenics`,
        html: generateEventInviteNewUserEmail(
          emailLower,
          inviter?.name || 'A user',
          event.name,
          completeAccountLink
        ),
      });
    }

    res.json({ success: true, data: event });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('Error inviting member:', error);
    res.status(500).json({ error: 'Failed to invite member' });
  }
}

export async function getBalances(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { eventId } = req.params;

    const event = await Event.findOne({
      _id: eventId,
      $or: [{ createdBy: userId }, { 'members.userId': userId }, { 'members.email': req.user!.email }],
    }).lean();

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const expenses = await Expense.find({ eventId }).lean();

    // Calculate net balances: positive = owed money, negative = owes money
    const netBalance: Record<string, number> = {};
    const memberNames: Record<string, string> = {};

    for (const member of event.members) {
      if (member.userId) {
        const id = member.userId.toString();
        netBalance[id] = 0;
        memberNames[id] = member.name;
      }
    }

    for (const expense of expenses) {
      const payerId = expense.paidBy.toString();
      netBalance[payerId] = (netBalance[payerId] || 0) + expense.amount;

      for (const split of expense.splits) {
        if (!split.settled) {
          const splitUserId = split.userId.toString();
          netBalance[splitUserId] = (netBalance[splitUserId] || 0) - split.amount;
        }
      }
    }

    // Simplify debts using greedy algorithm
    const debtors: { id: string; amount: number }[] = [];
    const creditors: { id: string; amount: number }[] = [];

    for (const [id, balance] of Object.entries(netBalance)) {
      if (balance < -0.01) {
        debtors.push({ id, amount: -balance });
      } else if (balance > 0.01) {
        creditors.push({ id, amount: balance });
      }
    }

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const balances: { from: { userId: string; name: string }; to: { userId: string; name: string }; amount: number }[] = [];

    let i = 0;
    let j = 0;
    while (i < debtors.length && j < creditors.length) {
      const amount = Math.min(debtors[i].amount, creditors[j].amount);
      if (amount > 0.01) {
        balances.push({
          from: { userId: debtors[i].id, name: memberNames[debtors[i].id] || 'Unknown' },
          to: { userId: creditors[j].id, name: memberNames[creditors[j].id] || 'Unknown' },
          amount: Math.round(amount * 100) / 100,
        });
      }
      debtors[i].amount -= amount;
      creditors[j].amount -= amount;
      if (debtors[i].amount < 0.01) i++;
      if (creditors[j].amount < 0.01) j++;
    }

    res.json({ success: true, data: balances });
  } catch (error) {
    console.error('Error getting balances:', error);
    res.status(500).json({ error: 'Failed to get balances' });
  }
}

export async function settleBalance(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { eventId } = req.params;
    const parsed = settleSchema.parse(req.body);

    const event = await Event.findOne({
      _id: eventId,
      $or: [{ createdBy: userId }, { 'members.userId': userId }, { 'members.email': req.user!.email }],
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    // Mark relevant splits as settled
    const expenses = await Expense.find({ eventId });

    for (const expense of expenses) {
      let modified = false;
      for (const split of expense.splits) {
        if (
          split.userId.toString() === userId &&
          expense.paidBy.toString() === parsed.toUserId &&
          !split.settled
        ) {
          split.settled = true;
          modified = true;
        }
      }
      if (modified) {
        await expense.save();
      }
    }

    // Create notification for the other party
    const settler = await User.findById(userId).lean();
    await Notification.create({
      userId: parsed.toUserId,
      type: ENotificationType.SETTLEMENT_CONFIRMED,
      message: `${settler?.name || 'Someone'} marked a settlement of $${parsed.amount.toFixed(2)} in "${event.name}"`,
      relatedEventId: event._id,
      relatedUserId: new mongoose.Types.ObjectId(userId),
    });

    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('Error settling balance:', error);
    res.status(500).json({ error: 'Failed to settle balance' });
  }
}

// POST /api/events/:eventId/invite-link — generate (or return existing) shareable invite URL
export async function generateInviteLink(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { eventId } = req.params;

    const event = await Event.findOne({
      _id: eventId,
      $or: [{ createdBy: userId }, { 'members.userId': userId }, { 'members.email': req.user!.email }],
    });
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    if (!event.inviteCode) {
      event.inviteCode = crypto.randomBytes(16).toString('hex');
      await event.save();
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://billgenics.com';
    const inviteUrl = `${frontendUrl}/events/join/${event.inviteCode}`;
    res.json({
      success: true,
      data: {
        inviteCode: event.inviteCode,
        inviteUrl,
        eventName: event.name,
      },
    });
  } catch (error) {
    console.error('Error generating invite link:', error);
    res.status(500).json({ error: 'Failed to generate invite link' });
  }
}

// GET /api/events/join/:code — public preview of invite (no auth)
export async function getEventByInviteCode(req: Request, res: Response): Promise<void> {
  try {
    const { code } = req.params;
    const event = await Event.findOne({ inviteCode: code }).select('name description createdBy members status').lean();
    if (!event) {
      res.status(404).json({ error: 'Invitation not found or has expired' });
      return;
    }
    if (event.status === EEventStatus.ARCHIVED) {
      res.status(410).json({ error: 'This event is no longer active' });
      return;
    }
    const inviter = await User.findById(event.createdBy).select('name').lean();
    res.json({
      success: true,
      data: {
        name: event.name,
        description: event.description,
        memberCount: event.members.length,
        invitedBy: inviter?.name || null,
      },
    });
  } catch (error) {
    console.error('Error fetching invite:', error);
    res.status(500).json({ error: 'Failed to fetch invitation' });
  }
}

// POST /api/events/join/:code — authenticated user joins event via invite code
export async function joinEventByInviteCode(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const email = req.user!.email;
    const { code } = req.params;

    const event = await Event.findOne({ inviteCode: code });
    if (!event) {
      res.status(404).json({ error: 'Invitation not found or has expired' });
      return;
    }
    if (event.status === EEventStatus.ARCHIVED) {
      res.status(410).json({ error: 'This event is no longer active' });
      return;
    }

    // Already a member?
    const alreadyMember = event.members.some(
      (m) => m.userId?.toString() === userId || m.email.toLowerCase() === email.toLowerCase()
    );
    if (alreadyMember) {
      // Upgrade invited → active if needed
      let modified = false;
      for (const m of event.members) {
        if (m.email.toLowerCase() === email.toLowerCase() && m.status !== EMemberStatus.ACTIVE) {
          m.userId = new mongoose.Types.ObjectId(userId) as unknown as mongoose.Schema.Types.ObjectId;
          m.status = EMemberStatus.ACTIVE;
          modified = true;
        }
      }
      if (modified) await event.save();
      res.json({ success: true, data: { eventId: event._id, alreadyMember: true } });
      return;
    }

    const user = await User.findById(userId).select('name email').lean();
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    event.members.push({
      userId: new mongoose.Types.ObjectId(userId) as unknown as mongoose.Schema.Types.ObjectId,
      email: user.email,
      name: user.name,
      status: EMemberStatus.ACTIVE,
    });
    await event.save();

    // Notify the event creator
    await Notification.create({
      userId: event.createdBy,
      type: ENotificationType.EVENT_INVITE,
      message: `${user.name} joined "${event.name}" via invite link`,
      relatedEventId: event._id,
      relatedUserId: new mongoose.Types.ObjectId(userId),
    });

    res.json({ success: true, data: { eventId: event._id, alreadyMember: false } });
  } catch (error) {
    console.error('Error joining event:', error);
    res.status(500).json({ error: 'Failed to join event' });
  }
}
