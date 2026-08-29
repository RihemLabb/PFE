import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CounterStatus } from '../../../common/enums/counter-status.enum';
import { Service } from '../../services/schemas/service.schema';

export type CounterDocument = Counter & Document;

@Schema({ timestamps: true })
export class Counter {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true })
  number: number;

  @Prop({ type: Types.ObjectId, ref: Service.name, required: true })
  serviceId: Types.ObjectId;

  @Prop({ type: String, enum: CounterStatus, default: CounterStatus.ACTIVE })
  status: CounterStatus;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
