import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Counter, CounterSchema } from './schemas/counter.schema';
import { CountersService } from './counters.service';
import { CountersController } from './counters.controller';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import {
  AgentAssignment,
  AgentAssignmentSchema,
} from '../agent-assignments/schemas/agent-assignment.schema';
import {
  QueueEntry,
  QueueEntrySchema,
} from '../queue/schemas/queue-entry.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Counter.name, schema: CounterSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: AgentAssignment.name, schema: AgentAssignmentSchema },
      { name: QueueEntry.name, schema: QueueEntrySchema },
    ]),
  ],
  controllers: [CountersController],
  providers: [CountersService],
  exports: [MongooseModule],
})
export class CountersModule {}
