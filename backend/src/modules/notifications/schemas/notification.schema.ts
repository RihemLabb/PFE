import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type NotificationDocument = Notification & Document;
@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Appointment' })
  appointmentId?: Types.ObjectId;
  @Prop({ required: true }) key: string;
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) message: string;
  @Prop({ default: false }) read: boolean;
  @Prop({ type: Date }) scheduledFor?: Date;
}
export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, key: 1 }, { unique: true });
