import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { QueueDataModule } from './queue-data.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { CountersModule } from '../counters/counters.module';
import { ServicesModule } from '../services/services.module';
import { AgentAssignmentsModule } from '../agent-assignments/agent-assignments.module';

@Module({
  imports: [
    QueueDataModule,
    AppointmentsModule,
    CountersModule,
    ServicesModule,
    AgentAssignmentsModule,
  ],
  controllers: [QueueController],
  providers: [QueueService],
})
export class QueueModule {}
