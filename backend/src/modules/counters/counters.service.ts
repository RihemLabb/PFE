import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter, CounterDocument } from './schemas/counter.schema';
import { CreateCounterDto, UpdateCounterDto } from './dto/counter.dto';

@Injectable()
export class CountersService {
  constructor(
    @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
  ) {}

  async create(createCounterDto: CreateCounterDto) {
    const existingNumber = await this.counterModel.findOne({
      number: createCounterDto.number,
    });
    if (existingNumber)
      throw new ConflictException(
        `Counter number ${createCounterDto.number} already exists`,
      );

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
    const updated = await this.counterModel
      .findByIdAndUpdate(id, updateCounterDto, { new: true })
      .populate('serviceId');
    if (!updated) throw new NotFoundException('Counter not found');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.counterModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Counter not found');
    return { message: 'Counter deleted successfully' };
  }
}
