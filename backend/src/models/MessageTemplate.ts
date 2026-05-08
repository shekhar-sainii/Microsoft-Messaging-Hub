import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageTemplate extends Document {
  name: string;
  description?: string;
  content: any; // Adaptive Card JSON or HTML string
  userId: string;
  type: 'html' | 'adaptive_card';
  createdAt: Date;
  updatedAt: Date;
}

const MessageTemplateSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  content: { type: Schema.Types.Mixed, required: true },
  userId: { type: String, required: true },
  type: { type: String, enum: ['html', 'adaptive_card'], default: 'adaptive_card' },
}, { timestamps: true });

export const MessageTemplateModel = mongoose.model<IMessageTemplate>('MessageTemplate', MessageTemplateSchema);
export default MessageTemplateModel;
