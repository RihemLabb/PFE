import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Service, ServiceSchema } from './schemas/service.schema';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { Counter, CounterSchema } from '../counters/schemas/counter.schema';
import {
  Appointment,
  AppointmentSchema,
} from '../appointments/schemas/appointment.schema';
import { Holiday, HolidaySchema } from '../holidays/schemas/holiday.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Service.name, schema: ServiceSchema },
      { name: Counter.name, schema: CounterSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Holiday.name, schema: HolidaySchema },
    ]),
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [MongooseModule],
})
export class ServicesModule {}
