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

  @Prop({ type: String, enum: Object.values(QueueStatus), default: QueueStatus.WAITING })
  status: QueueStatus;

  @Prop({ type: Number })
  position: number;

  @Prop({ type: Types.ObjectId, ref: 'Counter' })
  counterId: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  date: Date;
}

export const QueueEntrySchema = SchemaFactory.createForClass(QueueEntry);