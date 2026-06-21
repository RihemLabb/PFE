import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { QueueStatus } from '../../../common/enums/queue-status.enum';
import { Appointment } from '../../appointments/schemas/appointment.schema';
import { Service } from '../../services/schemas/service.schema';
import { Counter } from '../../counters/schemas/counter.schema';

export type QueueEntryDocument = QueueEntry & Document;

@Schema({ timestamps: true })
export class QueueEntry {
  @Prop({ type: Types.ObjectId, ref: Appointment.name, required: true, unique: true })
  appointmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Service.name, required: true })
  serviceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Counter.name })
  counterId: Types.ObjectId;

  @Prop({ required: true }) 
  position: number;

  @Prop({ type: String, enum: QueueStatus, default: QueueStatus.WAITING })
  status: QueueStatus;

  @Prop()
  checkInTime: Date;

  @Prop()
  calledTime: Date;

  @Prop()
  finishTime: Date;
}

export const QueueEntrySchema = SchemaFactory.createForClass(QueueEntry);


QueueEntrySchema.index({ serviceId: 1, status: 1, position: 1 });