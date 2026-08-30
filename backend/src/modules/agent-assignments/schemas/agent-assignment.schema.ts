import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Counter } from '../../counters/schemas/counter.schema';

export type AgentAssignmentDocument = AgentAssignment & Document;

@Schema({ timestamps: true })
export class AgentAssignment {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  agentId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: Counter.name,
    required: true,
    index: true,
  })
  counterId: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  date: Date;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const AgentAssignmentSchema =
  SchemaFactory.createForClass(AgentAssignment);

AgentAssignmentSchema.index({ agentId: 1, isActive: 1 });
AgentAssignmentSchema.index({ counterId: 1, isActive: 1 });
