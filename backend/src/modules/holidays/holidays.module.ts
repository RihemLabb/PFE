import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { HolidaysController } from './holidays.controller';
import { HolidaysService } from './holidays.service';
import { Holiday, HolidaySchema } from './schemas/holiday.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Holiday.name, schema: HolidaySchema },
      { name: Service.name, schema: ServiceSchema },
    ]),
  ],
  controllers: [HolidaysController],
  providers: [HolidaysService],
  exports: [MongooseModule, HolidaysService],
})
export class HolidaysModule {}
