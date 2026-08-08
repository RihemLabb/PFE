import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QueueEntry, QueueEntrySchema } from './schemas/queue-entry.schema';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { AppointmentsModule } from '../appointments/appointments.module';
import { CountersModule } from '../counters/counters.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QueueEntry.name, schema: QueueEntrySchema },
    ]),
    AppointmentsModule,
    CountersModule,
  ],
  controllers: [QueueController],
  providers: [QueueService],
})
export class QueueModule {}
