import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Appointment, AppointmentSchema } from './schemas/appointment.schema';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { AvailabilityController } from './availability.controller';
import { ServicesModule } from '../services/services.module';
import {
  QueueEntry,
  QueueEntrySchema,
} from '../queue/schemas/queue-entry.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: QueueEntry.name, schema: QueueEntrySchema },
    ]),
    ServicesModule,
  ],
  controllers: [AppointmentsController, AvailabilityController],
  providers: [AppointmentsService],
  exports: [MongooseModule],
})
export class AppointmentsModule {}
