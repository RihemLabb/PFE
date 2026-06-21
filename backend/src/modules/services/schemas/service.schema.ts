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

  @Prop({ default: true })
  isActive: boolean;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);