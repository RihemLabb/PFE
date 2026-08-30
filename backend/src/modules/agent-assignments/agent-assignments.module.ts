import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AgentAssignment,
  AgentAssignmentSchema,
} from './schemas/agent-assignment.schema';
import { AgentAssignmentsController } from './agent-assignments.controller';
import { AgentAssignmentsService } from './agent-assignments.service';
import { UsersModule } from '../users/users.module';
import { CountersModule } from '../counters/counters.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AgentAssignment.name, schema: AgentAssignmentSchema },
    ]),
    UsersModule,
    CountersModule,
  ],
  controllers: [AgentAssignmentsController],
  providers: [AgentAssignmentsService],
  exports: [AgentAssignmentsService],
})
export class AgentAssignmentsModule {}
