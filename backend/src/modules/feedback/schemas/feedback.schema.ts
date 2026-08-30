import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Appointment } from '../../appointments/schemas/appointment.schema';
import { Service } from '../../services/schemas/service.schema';
import { User } from '../../users/schemas/user.schema';

export type FeedbackDocument = Feedback & Document;

@Schema({ timestamps: true })
export class Feedback {
  @Prop({
    type: Types.ObjectId,
    ref: Appointment.name,
    required: true,
    unique: true,
    index: true,
  })
  appointmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: Service.name,
    required: true,
    index: true,
  })
  serviceId: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ trim: true, maxlength: 500, default: '' })
  comment: string;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
FeedbackSchema.index({ serviceId: 1, createdAt: -1 });
