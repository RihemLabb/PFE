import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Counter, CounterDocument } from './schemas/counter.schema';
import { CreateCounterDto, UpdateCounterDto } from './dto/counter.dto';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import {
  AgentAssignment,
  AgentAssignmentDocument,
} from '../agent-assignments/schemas/agent-assignment.schema';
import {
  QueueEntry,
  QueueEntryDocument,
} from '../queue/schemas/queue-entry.schema';

@Injectable()
export class CountersService {
  constructor(
    @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(AgentAssignment.name)
    private assignmentModel: Model<AgentAssignmentDocument>,
    @InjectModel(QueueEntry.name)
    private queueEntryModel: Model<QueueEntryDocument>,
  ) {}

  private async ensureService(serviceId: string) {
    if (!Types.ObjectId.isValid(serviceId)) {
      throw new BadRequestException('Invalid service ID');
    }
    const service = await this.serviceModel.exists({ _id: serviceId });
    if (!service) throw new NotFoundException('Service not found');
  }

  async create(createCounterDto: CreateCounterDto) {
    await this.ensureService(createCounterDto.serviceId);

    const existingNumber = await this.counterModel.findOne({
      number: createCounterDto.number,
    });
    if (existingNumber) {
      throw new ConflictException(
        `Counter number ${createCounterDto.number} already exists`,
      );
    }

    const newCounter = new this.counterModel(createCounterDto);
    return newCounter.save();
  }

  async findAll() {
    return this.counterModel.find().populate('serviceId').sort({ number: 1 });
  }

  async findOne(id: string) {
    const counter = await this.counterModel.findById(id).populate('serviceId');
    if (!counter) throw new NotFoundException('Counter not found');
    return counter;
  }

  async update(id: string, updateCounterDto: UpdateCounterDto) {
    if (updateCounterDto.serviceId) {
      await this.ensureService(updateCounterDto.serviceId);
    }

    const updated = await this.counterModel
      .findByIdAndUpdate(id, updateCounterDto, { new: true })
      .populate('serviceId');
    if (!updated) throw new NotFoundException('Counter not found');
    return updated;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid counter ID');
    }

    const counter = await this.counterModel.findById(id);
    if (!counter) throw new NotFoundException('Counter not found');

    const [assignmentCount, queueEntryCount] = await Promise.all([
      this.assignmentModel.countDocuments({ counterId: id }),
      this.queueEntryModel.countDocuments({ counterId: id }),
    ]);

    if (assignmentCount || queueEntryCount) {
      throw new ConflictException(
        `Counter is still referenced by ${assignmentCount} agent assignment(s) and ${queueEntryCount} queue record(s). Mark it inactive instead of deleting it.`,
      );
    }

    await counter.deleteOne();
    return { message: 'Counter deleted successfully' };
  }
}
