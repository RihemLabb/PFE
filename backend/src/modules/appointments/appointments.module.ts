import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Appointment, AppointmentSchema } from './schemas/appointment.schema';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { AvailabilityController } from './availability.controller';
import { ServicesModule } from '../services/services.module';
import { QueueDataModule } from '../queue/queue-data.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
    ServicesModule,
    QueueDataModule,
  ],
  controllers: [AppointmentsController, AvailabilityController],
  providers: [AppointmentsService],
  exports: [MongooseModule],
})
export class AppointmentsModule {}
