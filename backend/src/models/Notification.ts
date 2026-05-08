import mongoose, { Document, Model, Schema } from 'mongoose';

export enum ENotificationType {
  EVENT_INVITE = 'event_invite',
  SETTLEMENT_REQUEST = 'settlement_request',
  SETTLEMENT_CONFIRMED = 'settlement_confirmed',
  EXPENSE_ADDED = 'expense_added',
  RECURRING_BILL_DUE = 'recurring_bill_due',
}

export interface INotificationModel extends Document {
  userId: Schema.Types.ObjectId;
  type: ENotificationType;
  message: string;
  relatedEventId?: Schema.Types.ObjectId;
  relatedUserId?: Schema.Types.ObjectId;
  relatedRecurringBillId?: Schema.Types.ObjectId;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(ENotificationType), required: true },
    message: { type: String, required: true },
    relatedEventId: { type: Schema.Types.ObjectId, ref: 'Event', default: null },
    relatedUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    relatedRecurringBillId: { type: Schema.Types.ObjectId, ref: 'RecurringBill', default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const Notification: Model<INotificationModel> =
  mongoose.models.Notification || mongoose.model<INotificationModel>('Notification', NotificationSchema);

export default Notification;
