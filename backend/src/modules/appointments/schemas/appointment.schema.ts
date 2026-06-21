import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';
import { User } from '../../users/schemas/user.schema';
import { Service } from '../../services/schemas/service.schema';

export type AppointmentDocument = Appointment & Document;

@Schema({ timestamps: true })
export class Appointment {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Service.name, required: true })
  serviceId: Types.ObjectId;

  @Prop({ required: true }) 
  date: Date;

  @Prop({ required: true }) 
  timeSlot: string;

  @Prop({ type: String, enum: AppointmentStatus, default: AppointmentStatus.CONFIRMED })
  status: AppointmentStatus;

  @Prop({ required: true, unique: true }) 
  qrToken: string;

  @Prop({ required: true }) 
  ticketNumber: string;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

AppointmentSchema.index({ serviceId: 1, date: 1, timeSlot: 1 });