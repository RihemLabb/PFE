import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { QueueStatus } from '../../../common/enums/queue-status.enum';

export type QueueEntryDocument = QueueEntry & Document;

@Schema({ timestamps: true })
export class QueueEntry {
  @Prop({ type: Types.ObjectId, ref: 'Appointment', required: true, unique: true })
  appointmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service', required: true })
  serviceId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(QueueStatus),
    default: QueueStatus.WAITING,
  })
  status: QueueStatus;

  @Prop({ type: Number, required: true })
  position: number;

  @Prop({ type: Types.ObjectId, ref: 'Counter' })
  counterId?: Types.ObjectId;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: Date, required: true })
  checkInTime: Date;

  @Prop({ type: Date })
  calledTime?: Date;

  @Prop({ type: Date })
  serviceStartTime?: Date;

  @Prop({ type: Date })
  finishTime?: Date;
}

export const QueueEntrySchema = SchemaFactory.createForClass(QueueEntry);

QueueEntrySchema.index({ serviceId: 1, date: 1, position: 1 });
