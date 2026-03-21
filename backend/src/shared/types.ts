// Shared types between frontend and backend

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

export enum EEventStatus {
  ACTIVE = 'active',
  SETTLED = 'settled',
  ARCHIVED = 'archived',
}

export enum EMemberStatus {
  INVITED = 'invited',
  ACTIVE = 'active',
}

export enum ESplitType {
  EQUAL = 'equal',
  CUSTOM = 'custom',
}

export enum ENotificationType {
  EVENT_INVITE = 'event_invite',
  SETTLEMENT_REQUEST = 'settlement_request',
  SETTLEMENT_CONFIRMED = 'settlement_confirmed',
  EXPENSE_ADDED = 'expense_added',
}

export interface IBillItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IBill {
  _id: string;
  userId: string;
  storeName: string;
  storeABN?: string;
  storeAddress?: string;
  date: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface IEventMember {
  userId?: string;
  email: string;
  name: string;
  status: EMemberStatus;
}

export interface IEvent {
  _id: string;
  name: string;
  description?: string;
  createdBy: string;
  members: IEventMember[];
  status: EEventStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IExpenseSplit {
  userId: string;
  amount: number;
  settled: boolean;
}

export interface IExpense {
  _id: string;
  eventId: string;
  description: string;
  amount: number;
  paidBy: string;
  splitType: ESplitType;
  splits: IExpenseSplit[];
  category: EBillCategory;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface INotification {
  _id: string;
  userId: string;
  type: ENotificationType;
  message: string;
  relatedEventId?: string;
  relatedUserId?: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IUser {
  id: string;
  email: string;
  name: string;
  firstName: string;
  username: string;
}

export interface ApiResponse<T = unknown> {
  success?: boolean;
  error?: string;
  data?: T;
}

export interface IBillStats {
  totalSpent: number;
  billCount: number;
  categoryBreakdown: { category: EBillCategory; total: number; count: number }[];
  topCategory?: EBillCategory;
}

export interface IBalance {
  from: { userId: string; name: string };
  to: { userId: string; name: string };
  amount: number;
}
