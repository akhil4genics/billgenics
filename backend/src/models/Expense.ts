import mongoose, { Document, Model, Schema } from 'mongoose';
import { EBillCategory } from './Bill';

export enum ESplitType {
  EQUAL = 'equal',
  CUSTOM = 'custom',
}

export interface IExpenseSplit {
  userId: Schema.Types.ObjectId;
  amount: number;
  settled: boolean;
}

export interface IExpenseModel extends Document {
  eventId: Schema.Types.ObjectId;
  description: string;
  amount: number;
  paidBy: Schema.Types.ObjectId;
  splitType: ESplitType;
  splits: IExpenseSplit[];
  category: EBillCategory;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSplitSchema = new Schema<IExpenseSplit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    settled: { type: Boolean, default: false },
  },
  { _id: false }
);

const ExpenseSchema = new Schema<IExpenseModel>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    paidBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    splitType: { type: String, enum: Object.values(ESplitType), required: true },
    splits: { type: [ExpenseSplitSchema], required: true },
    category: { type: String, enum: Object.values(EBillCategory), default: EBillCategory.OTHER },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

ExpenseSchema.index({ eventId: 1 });
ExpenseSchema.index({ paidBy: 1 });

const Expense: Model<IExpenseModel> =
  mongoose.models.Expense || mongoose.model<IExpenseModel>('Expense', ExpenseSchema);

export default Expense;
