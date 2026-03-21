import mongoose, { Document, Model, Schema } from 'mongoose';

export enum EBillCategory {
  GROCERY = 'grocery',
  ELECTRONICS = 'electronics',
  TELEPHONE = 'telephone',
  DINING = 'dining',
  TRANSPORT = 'transport',
  HEALTH = 'health',
  UTILITIES = 'utilities',
  ENTERTAINMENT = 'entertainment',
  CLOTHING = 'clothing',
  OTHER = 'other',
}

export enum EEntryMethod {
  SCAN = 'scan',
  MANUAL = 'manual',
}

export enum EBillStatus {
  ACTIVE = 'active',
  DELETED = 'deleted',
}

export interface IBillItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IBillModel extends Document {
  userId: Schema.Types.ObjectId;
  storeName: string;
  storeABN?: string;
  storeAddress?: string;
  date: Date;
  category: EBillCategory;
  items: IBillItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod?: string;
  notes?: string;
  receiptImageKey?: string;
  entryMethod: EEntryMethod;
  status: EBillStatus;
  createdAt: Date;
  updatedAt: Date;
}

const BillItemSchema = new Schema<IBillItem>(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const BillSchema = new Schema<IBillModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    storeName: { type: String, required: true, trim: true },
    storeABN: { type: String, trim: true },
    storeAddress: { type: String, trim: true },
    date: { type: Date, required: true },
    category: { type: String, enum: Object.values(EBillCategory), default: EBillCategory.OTHER, required: true },
    items: { type: [BillItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, trim: true },
    notes: { type: String, trim: true },
    receiptImageKey: { type: String },
    entryMethod: { type: String, enum: Object.values(EEntryMethod), required: true },
    status: { type: String, enum: Object.values(EBillStatus), default: EBillStatus.ACTIVE, required: true },
  },
  { timestamps: true }
);

BillSchema.index({ userId: 1, date: -1 });
BillSchema.index({ userId: 1, category: 1 });

const Bill: Model<IBillModel> = mongoose.models.Bill || mongoose.model<IBillModel>('Bill', BillSchema);

export default Bill;
