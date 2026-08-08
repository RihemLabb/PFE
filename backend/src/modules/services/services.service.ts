import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Service, ServiceDocument } from './schemas/service.schema';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
  ) {}

  private validateSchedule(openingTime: string, closingTime: string) {
    if (openingTime >= closingTime) {
      throw new BadRequestException(
        'Closing time must be later than opening time',
      );
    }
  }

  async create(createServiceDto: CreateServiceDto) {
    const name = createServiceDto.name.trim();
    const existing = await this.serviceModel.findOne({ name });
    if (existing) throw new ConflictException('Service name already exists');

    this.validateSchedule(
      createServiceDto.openingTime || '09:00',
      createServiceDto.closingTime || '17:00',
    );

    const newService = new this.serviceModel({
      ...createServiceDto,
      name,
    });
    return newService.save();
  }

  async findAll() {
    return this.serviceModel.find().sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const service = await this.serviceModel.findById(id);
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    const service = await this.serviceModel.findById(id);
    if (!service) throw new NotFoundException('Service not found');

    if (updateServiceDto.name) {
      const name = updateServiceDto.name.trim();
      const duplicate = await this.serviceModel.findOne({
        _id: { $ne: id },
        name,
      });
      if (duplicate) throw new ConflictException('Service name already exists');
      updateServiceDto.name = name;
    }

    const openingTime = updateServiceDto.openingTime ?? service.openingTime ?? '09:00';
    const closingTime = updateServiceDto.closingTime ?? service.closingTime ?? '17:00';
    this.validateSchedule(openingTime, closingTime);

    Object.assign(service, updateServiceDto);
    return service.save();
  }

  async remove(id: string) {
    const deleted = await this.serviceModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Service not found');
    return { message: 'Service deleted successfully' };
  }
}
