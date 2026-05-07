import mongoose, { Schema, Document } from 'mongoose';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface IScheduledMessage extends Document {
  userId: string;
  teamId: string;
  channelId: string;
  content: string;
  scheduledFor: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  jobId?: string;
  error?: string;
  recurrence: RecurrenceType;
  recurrenceEndDate?: Date;
  parentJobId?: string; // For recurring series — links back to the original
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledMessageSchema: Schema = new Schema({
  userId: { type: String, required: true },
  teamId: { type: String, required: true },
  channelId: { type: String, required: true },
  content: { type: String, required: true },
  scheduledFor: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'cancelled'],
    default: 'pending',
  },
  jobId: { type: String },
  error: { type: String },
  recurrence: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly'],
    default: 'none',
  },
  recurrenceEndDate: { type: Date },
  parentJobId: { type: String },
}, { timestamps: true });

ScheduledMessageSchema.index({ userId: 1 });
ScheduledMessageSchema.index({ scheduledFor: 1 });
ScheduledMessageSchema.index({ status: 1 });
ScheduledMessageSchema.index({ parentJobId: 1 });

export const ScheduledMessageModel = mongoose.model<IScheduledMessage>('ScheduledMessage', ScheduledMessageSchema);
export default ScheduledMessageModel;
