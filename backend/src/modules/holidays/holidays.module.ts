import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  Param,
  Post,
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
export class Holiday {
  @Prop({ required: true, unique: true }) date: string;
  @Prop({ required: true }) reason: string;
}
export const HolidaySchema = SchemaFactory.createForClass(Holiday);
@Injectable()
export class HolidaysService {
  constructor(@InjectModel(Holiday.name) private model: Model<Holiday>) {}
  list() {
    return this.model.find().sort({ date: 1 });
  }
  find(date: string) {
    return this.model.findOne({ date });
  }
  create(v: Partial<Holiday>) {
    return this.model.create(v);
  }
  remove(id: string) {
    return this.model.findByIdAndDelete(id);
  }
}
@Controller('holidays')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
export class HolidaysController {
  constructor(private service: HolidaysService) {}
  @Get() list() {
    return this.service.list();
  }
  @Post() create(@Body() v: Partial<Holiday>) {
    return this.service.create(v);
  }
  @Delete(':id') remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Holiday.name, schema: HolidaySchema }]),
  ],
  controllers: [HolidaysController],
  providers: [HolidaysService],
  exports: [HolidaysService, MongooseModule],
})
export class HolidaysModule {}
