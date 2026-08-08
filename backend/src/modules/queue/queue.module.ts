import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { QueueDataModule } from './queue-data.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { CountersModule } from '../counters/counters.module';

@Module({
  imports: [QueueDataModule, AppointmentsModule, CountersModule],
  controllers: [QueueController],
  providers: [QueueService],
})
export class QueueModule {}
