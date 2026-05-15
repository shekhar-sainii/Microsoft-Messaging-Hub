import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  eventType: string;
  details: string;
  status: 'success' | 'failure';
  userId?: string;
  metadata?: any;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema({
  eventType: { type: String, required: true },
  details: { type: String, required: true },
  status: { type: String, enum: ['success', 'failure'], required: true },
  userId: { type: String },
  metadata: { type: Schema.Types.Mixed },
}, { 
  timestamps: true,
  capped: { size: 200 * 1024 * 1024, max: 100000 } // Assessment Requirement: Capped 200MB
});

AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ eventType: 1 });
AuditLogSchema.index({ createdAt: -1 });

export const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export default AuditLogModel;
