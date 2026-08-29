import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { QueueStatus } from '../../../common/enums/queue-status.enum';

export type QueueEntryDocument = QueueEntry & Document;

@Schema({ timestamps: true })
export class QueueEntry {
  @Prop({ type: Types.ObjectId, ref: 'Appointment', required: true })
  appointmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service', required: true })
  serviceId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(QueueStatus),
    default: QueueStatus.WAITING,
  })
  status: QueueStatus;

  @Prop({ type: Number })
  position: number;

  @Prop({ type: Types.ObjectId, ref: 'Counter' })
  counterId: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  date: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  agentId?: Types.ObjectId;

  @Prop({ type: Date })
  checkInTime?: Date;

  @Prop({ type: Date })
  calledTime?: Date;

  @Prop({ type: Date })
  startTime?: Date;

  @Prop({ type: Date })
  finishTime?: Date;
}

export const QueueEntrySchema = SchemaFactory.createForClass(QueueEntry);
QueueEntrySchema.index({ appointmentId: 1 }, { unique: true });
QueueEntrySchema.index({ serviceId: 1, date: 1, status: 1, position: 1 });
