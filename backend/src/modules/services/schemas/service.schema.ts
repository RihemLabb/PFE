import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ServiceDocument = Service & Document;

@Schema({ timestamps: true })
export class Service {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ required: true, min: 1 })
  avgDuration: number;

  @Prop({ required: true, min: 5 })
  slotDuration: number;

  @Prop({ required: true, min: 1, default: 1 })
  maxCapacityPerSlot: number;

  @Prop({ type: [String], default: [] })
  requiredDocs: string[];

  @Prop({ default: '09:00' })
  openingTime: string;

  @Prop({ default: '17:00' })
  closingTime: string;

  @Prop({ type: [Number], default: [1, 2, 3, 4, 5] })
  workingDays: number[];

  @Prop({ required: true, min: 0, max: 240, default: 15 })
  absenceDelayMinutes: number;

  @Prop({ type: Map, of: Number, default: {} })
  ticketSequences: Map<string, number>;

  @Prop({ type: Map, of: Number, default: {} })
  slotReservations: Map<string, number>;

  @Prop({ type: Map, of: Number, default: {} })
  queueSequences: Map<string, number>;

  @Prop({ default: true })
  isActive: boolean;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
