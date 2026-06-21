import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Service, ServiceDocument } from './schemas/service.schema';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
  ) {}

  async create(createServiceDto: CreateServiceDto) {
    const existing = await this.serviceModel.findOne({ name: createServiceDto.name });
    if (existing) throw new ConflictException('Service name already exists');
    
    const newService = new this.serviceModel(createServiceDto);
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
    const updated = await this.serviceModel.findByIdAndUpdate(id, updateServiceDto, { new: true });
    if (!updated) throw new NotFoundException('Service not found');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.serviceModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Service not found');
    return { message: 'Service deleted successfully' };
  }
}