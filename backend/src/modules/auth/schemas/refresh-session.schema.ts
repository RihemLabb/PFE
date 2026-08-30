import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RefreshSessionDocument = RefreshSession & Document;

@Schema({ timestamps: true })
export class RefreshSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  tokenHash: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;
}

export const RefreshSessionSchema =
  SchemaFactory.createForClass(RefreshSession);

RefreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
