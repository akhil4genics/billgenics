import mongoose, { Document, Model, Schema } from 'mongoose';
import { EBillCategory } from './Bill';

export enum ECadence {
  WEEKLY = 'weekly',
  FORTNIGHTLY = 'fortnightly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
}

export enum ERecurringStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum ERecurringChannel {
  EMAIL = 'email',
  SMS = 'sms',
  APP = 'app',
  DIRECT_DEBIT = 'direct_debit',
  MANUAL = 'manual',
}

export interface IRecurringBillModel extends Document {
  userId: Schema.Types.ObjectId;
  name: string;
  category: EBillCategory;
  amount: number;
  cadence: ECadence;
  intervalDays?: number;
  nextDueDate: Date;
  endDate?: Date;
  lastPaidDate?: Date;
  lastReminderCycleDate?: Date;
  lastGeneratedCycleDate?: Date;
  lastGeneratedBillId?: Schema.Types.ObjectId;
  reminderDaysBefore: number;
  channel: ERecurringChannel;
  notes?: string;
  status: ERecurringStatus;
  autoDetected: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RecurringBillSchema = new Schema<IRecurringBillModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: Object.values(EBillCategory),
      default: EBillCategory.OTHER,
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    cadence: { type: String, enum: Object.values(ECadence), required: true },
    intervalDays: { type: Number, min: 1 },
    nextDueDate: { type: Date, required: true },
    endDate: { type: Date },
    lastPaidDate: { type: Date },
    lastReminderCycleDate: { type: Date },
    lastGeneratedCycleDate: { type: Date },
    lastGeneratedBillId: { type: Schema.Types.ObjectId, ref: 'Bill' },
    reminderDaysBefore: { type: Number, default: 3, min: 0, max: 60 },
    channel: {
      type: String,
      enum: Object.values(ERecurringChannel),
      default: ERecurringChannel.MANUAL,
      required: true,
    },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(ERecurringStatus),
      default: ERecurringStatus.ACTIVE,
      required: true,
    },
    autoDetected: { type: Boolean, default: false },
  },
  { timestamps: true }
);

RecurringBillSchema.index({ userId: 1, status: 1, nextDueDate: 1 });
RecurringBillSchema.index({ userId: 1, name: 1 });

const RecurringBill: Model<IRecurringBillModel> =
  mongoose.models.RecurringBill ||
  mongoose.model<IRecurringBillModel>('RecurringBill', RecurringBillSchema);

export default RecurringBill;
