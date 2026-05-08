import mongoose, { Schema, Document } from 'mongoose';

export interface IGraphSubscription extends Document {
  subscriptionId: string;
  resource: string;
  tenantId: string;
  expirationDateTime: Date;
  deltaLink?: string; // For catch-up logic
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GraphSubscriptionSchema: Schema = new Schema({
  subscriptionId: { type: String, required: true, unique: true },
  resource: { type: String, required: true },
  tenantId: { type: String, required: true },
  expirationDateTime: { type: Date, required: true },
  deltaLink: { type: String },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export const GraphSubscriptionModel = mongoose.model<IGraphSubscription>('GraphSubscription', GraphSubscriptionSchema);
export default GraphSubscriptionModel;
