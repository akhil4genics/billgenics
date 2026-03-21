import mongoose, { Document, Model, Schema } from 'mongoose';

export enum EEventStatus {
  ACTIVE = 'active',
  SETTLED = 'settled',
  ARCHIVED = 'archived',
}

export enum EMemberStatus {
  INVITED = 'invited',
  ACTIVE = 'active',
}

export interface IEventMember {
  userId?: Schema.Types.ObjectId;
  email: string;
  name: string;
  status: EMemberStatus;
}

export interface IEventModel extends Document {
  name: string;
  description?: string;
  createdBy: Schema.Types.ObjectId;
  members: IEventMember[];
  status: EEventStatus;
  createdAt: Date;
  updatedAt: Date;
}

const EventMemberSchema = new Schema<IEventMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    status: { type: String, enum: Object.values(EMemberStatus), default: EMemberStatus.INVITED, required: true },
  },
  { _id: false }
);

const EventSchema = new Schema<IEventModel>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [EventMemberSchema], default: [] },
    status: { type: String, enum: Object.values(EEventStatus), default: EEventStatus.ACTIVE, required: true },
  },
  { timestamps: true }
);

EventSchema.index({ createdBy: 1 });
EventSchema.index({ 'members.userId': 1 });
EventSchema.index({ 'members.email': 1 });

const Event: Model<IEventModel> = mongoose.models.Event || mongoose.model<IEventModel>('Event', EventSchema);

export default Event;
