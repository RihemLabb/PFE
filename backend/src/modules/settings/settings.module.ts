import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
@Schema({ timestamps: true })
export class Settings {
  @Prop({ default: 'Smart Queue' }) organizationName: string;
  @Prop({ default: 10, min: 1, max: 120 }) absenceDelayMinutes: number;
  @Prop({ default: 24 }) reminderLeadHours: number;
  @Prop({ default: 'Africa/Tunis' }) timezone: string;
}
export const SettingsSchema = SchemaFactory.createForClass(Settings);
@Injectable()
export class SettingsService {
  constructor(@InjectModel(Settings.name) private model: Model<Settings>) {}
  async get() {
    return (await this.model.findOne()) || this.model.create({});
  }
  update(v: Partial<Settings>) {
    return this.model.findOneAndUpdate({}, v, {
      upsert: true,
      new: true,
      runValidators: true,
    });
  }
}
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
export class SettingsController {
  constructor(private service: SettingsService) {}
  @Get() get() {
    return this.service.get();
  }
  @Patch() @Roles(UserRole.ADMIN) update(@Body() v: Partial<Settings>) {
    return this.service.update(v);
  }
}
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Settings.name, schema: SettingsSchema },
    ]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
