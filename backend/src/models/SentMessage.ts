import mongoose, { Schema, Document } from 'mongoose';

export interface ISentMessage extends Document {
  messageId: string; // Microsoft Graph ID
  teamId: string;
  channelId: string;
  userId: string;
  content: string;
  status: 'sent' | 'failed';
  metadata?: any;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SentMessageSchema: Schema = new Schema({
  messageId: { type: String, required: true, unique: true },
  teamId: { type: String, required: true },
  channelId: { type: String, required: true },
  userId: { type: String, required: true },
  content: { type: String },
  status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
  sentAt: { type: Date, default: Date.now },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

SentMessageSchema.index({ userId: 1 });
SentMessageSchema.index({ teamId: 1, channelId: 1 });
SentMessageSchema.index({ createdAt: -1 });

export const SentMessageModel = mongoose.model<ISentMessage>('SentMessage', SentMessageSchema);
export default SentMessageModel;
