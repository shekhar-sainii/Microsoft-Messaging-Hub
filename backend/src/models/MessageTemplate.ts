import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageTemplate extends Document {
  name: string;
  description?: string;
  content: any; // Adaptive Card JSON
  userId: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageTemplateSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  content: { type: Schema.Types.Mixed, required: true },
  userId: { type: String, required: true },
  category: { type: String, default: 'General' },
}, { timestamps: true });

export const MessageTemplateModel = mongoose.model<IMessageTemplate>('MessageTemplate', MessageTemplateSchema);
export default MessageTemplateModel;
