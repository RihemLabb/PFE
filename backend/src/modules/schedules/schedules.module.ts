import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Schema({ timestamps: true })
export class Schedule {
  @Prop({ type: Types.ObjectId, ref: 'Service', required: true })
  serviceId: Types.ObjectId;
  @Prop({ min: 0, max: 6, required: true }) dayOfWeek: number;
  @Prop({ required: true }) startTime: string;
  @Prop({ required: true }) endTime: string;
  @Prop({ default: true }) isActive: boolean;
}
export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
ScheduleSchema.index({ serviceId: 1, dayOfWeek: 1 }, { unique: true });
@Injectable()
export class SchedulesService {
  constructor(@InjectModel(Schedule.name) private model: Model<Schedule>) {}
  list() {
    return this.model.find().populate('serviceId').sort({ dayOfWeek: 1 });
  }
  create(v: Partial<Schedule>) {
    return this.model.create(v);
  }
  update(id: string, v: Partial<Schedule>) {
    return this.model.findByIdAndUpdate(id, v, {
      new: true,
      runValidators: true,
    });
  }
  remove(id: string) {
    return this.model.findByIdAndDelete(id);
  }
}
@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
export class SchedulesController {
  constructor(private service: SchedulesService) {}
  @Get() list() {
    return this.service.list();
  }
  @Post() create(@Body() v: Partial<Schedule>) {
    return this.service.create(v);
  }
  @Patch(':id') update(@Param('id') id: string, @Body() v: Partial<Schedule>) {
    return this.service.update(id, v);
  }
  @Delete(':id') remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Schedule.name, schema: ScheduleSchema },
    ]),
  ],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService, MongooseModule],
})
export class SchedulesModule {}
