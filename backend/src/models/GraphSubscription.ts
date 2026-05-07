import mongoose, { Schema, Document } from 'mongoose';

export interface IGraphSubscription extends Document {
  subscriptionId: string;
  resource: string;
  changeType: string;
  clientState: string;
  expirationDateTime: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const GraphSubscriptionSchema: Schema = new Schema({
  subscriptionId: { type: String, required: true, unique: true },
  resource: { type: String, required: true },
  changeType: { type: String, required: true },
  clientState: { type: String, required: true },
  expirationDateTime: { type: Date, required: true },
  userId: { type: String, required: true },
}, { timestamps: true });

export const GraphSubscriptionModel = mongoose.model<IGraphSubscription>('GraphSubscription', GraphSubscriptionSchema);
export default GraphSubscriptionModel;
