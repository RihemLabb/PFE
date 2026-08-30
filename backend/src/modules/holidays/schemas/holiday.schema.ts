import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Service } from '../../services/schemas/service.schema';

export type HolidayDocument = Holiday & Document;

@Schema({ timestamps: true })
export class Holiday {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, index: true })
  date: Date;

  @Prop({ type: Types.ObjectId, ref: Service.name, default: null, index: true })
  serviceId?: Types.ObjectId | null;

  @Prop({ default: true })
  isClosed: boolean;

  @Prop()
  openingTime?: string;

  @Prop()
  closingTime?: string;
}

export const HolidaySchema = SchemaFactory.createForClass(Holiday);
HolidaySchema.index({ date: 1, serviceId: 1 }, { unique: true });
