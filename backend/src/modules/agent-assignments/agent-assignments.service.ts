import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AgentAssignment,
  AgentAssignmentDocument,
} from './schemas/agent-assignment.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Counter, CounterDocument } from '../counters/schemas/counter.schema';
import { AssignAgentDto } from './dto/assign-agent.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { CounterStatus } from '../../common/enums/counter-status.enum';

@Injectable()
export class AgentAssignmentsService {
  constructor(
    @InjectModel(AgentAssignment.name)
    private readonly assignmentModel: Model<AgentAssignmentDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Counter.name)
    private readonly counterModel: Model<CounterDocument>,
  ) {}

  private populateAssignment(query: any) {
    return query
      .populate('agentId', 'firstName lastName email role isActive')
      .populate({
        path: 'counterId',
        populate: { path: 'serviceId', select: 'name isActive' },
      });
  }

  async findActive() {
    return this.populateAssignment(
      this.assignmentModel.find({ isActive: true }).sort({ createdAt: -1 }),
    );
  }

  async findMine(agentId: string) {
    if (!Types.ObjectId.isValid(agentId)) {
      throw new BadRequestException('Invalid agent ID');
    }

    return this.populateAssignment(
      this.assignmentModel.findOne({ agentId, isActive: true }),
    );
  }

  async assign(dto: AssignAgentDto) {
    const [agent, counter] = await Promise.all([
      this.userModel.findById(dto.agentId),
      this.counterModel.findById(dto.counterId),
    ]);

    if (!agent) throw new NotFoundException('Agent not found');
    if (agent.role !== UserRole.AGENT) {
      throw new BadRequestException('Selected user is not an agent');
    }
    if (!agent.isActive) {
      throw new BadRequestException('Selected agent is inactive');
    }

    if (!counter) throw new NotFoundException('Counter not found');
    if (counter.status !== CounterStatus.ACTIVE) {
      throw new BadRequestException('Selected counter is not active');
    }

    const sessionDate = new Date();
    await Promise.all([
      this.assignmentModel.updateMany(
        { agentId: agent._id, isActive: true },
        { $set: { isActive: false } },
      ),
      this.assignmentModel.updateMany(
        { counterId: counter._id, isActive: true },
        { $set: { isActive: false } },
      ),
    ]);

    const assignment = await this.assignmentModel.create({
      agentId: agent._id,
      counterId: counter._id,
      date: sessionDate,
      isActive: true,
    });

    return this.populateAssignment(this.assignmentModel.findById(assignment._id));
  }

  async unassign(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid assignment ID');
    }

    const assignment = await this.assignmentModel.findById(id);
    if (!assignment) throw new NotFoundException('Assignment not found');

    assignment.isActive = false;
    await assignment.save();
    return { message: 'Agent assignment ended' };
  }
}
