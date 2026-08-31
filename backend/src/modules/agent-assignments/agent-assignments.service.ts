import {
  BadRequestException,
  ForbiddenException,
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

  private async resolveActiveAgentId(agentId: string, email?: string) {
    const identityFilters: Record<string, unknown>[] = [];
    if (Types.ObjectId.isValid(agentId)) {
      identityFilters.push({ _id: new Types.ObjectId(agentId) });
    }
    if (email?.trim()) {
      identityFilters.push({ email: email.trim().toLowerCase() });
    }
    if (identityFilters.length === 0) {
      throw new BadRequestException('Invalid agent identity');
    }

    const agent = await this.userModel
      .findOne({
        $or: identityFilters,
        role: UserRole.AGENT,
        isActive: true,
      })
      .select('_id');
    if (!agent) throw new NotFoundException('Agent account not found');
    return agent._id;
  }

  async findMine(agentId: string, email?: string) {
    const resolvedAgentId = await this.resolveActiveAgentId(agentId, email);

    return this.populateAssignment(
      this.assignmentModel
        .findOne({ agentId: resolvedAgentId, isActive: true })
        .sort({ createdAt: -1 }),
    ).exec();
  }

  async assertAgentCounter(agentId: string, counterId: string, email?: string) {
    if (!Types.ObjectId.isValid(counterId)) {
      throw new BadRequestException('Invalid counter ID');
    }
    const resolvedAgentId = await this.resolveActiveAgentId(agentId, email);

    const assignment = await this.assignmentModel.exists({
      agentId: resolvedAgentId,
      counterId,
      isActive: true,
    });

    if (!assignment) {
      throw new ForbiddenException(
        'This counter is not assigned to the current agent',
      );
    }
  }

  async assertAgentService(agentId: string, serviceId: string, email?: string) {
    if (!Types.ObjectId.isValid(serviceId)) {
      throw new BadRequestException('Invalid service ID');
    }
    const resolvedAgentId = await this.resolveActiveAgentId(agentId, email);

    const assignment = await this.assignmentModel
      .findOne({ agentId: resolvedAgentId, isActive: true })
      .sort({ createdAt: -1 })
      .populate('counterId');

    if (!assignment) {
      throw new ForbiddenException(
        'No active counter is assigned to this agent',
      );
    }

    const counter = assignment.counterId as unknown as CounterDocument;
    if (!counter || counter.serviceId.toString() !== serviceId) {
      throw new ForbiddenException(
        'The requested service does not match the current agent assignment',
      );
    }
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

    return this.populateAssignment(
      this.assignmentModel.findById(assignment._id),
    );
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
