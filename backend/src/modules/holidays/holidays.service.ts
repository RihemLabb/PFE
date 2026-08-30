import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { CreateHolidayDto, UpdateHolidayDto } from './dto/holiday.dto';
import { Holiday, HolidayDocument } from './schemas/holiday.schema';

@Injectable()
export class HolidaysService {
  constructor(
    @InjectModel(Holiday.name)
    private readonly holidayModel: Model<HolidayDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
  ) {}

  private parseDateOnly(date: string) {
    const parsed = new Date(`${date}T00:00:00.000Z`);
    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== date
    ) {
      throw new BadRequestException('Invalid exception date');
    }
    return parsed;
  }

  private timeToMinutes(time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private validateSchedule(
    isClosed: boolean,
    serviceId?: string | null,
    openingTime?: string,
    closingTime?: string,
  ) {
    if (isClosed) return;

    if (!serviceId) {
      throw new BadRequestException(
        'A special opening schedule must target a specific service',
      );
    }
    if (!openingTime || !closingTime) {
      throw new BadRequestException(
        'Opening and closing times are required for a special opening schedule',
      );
    }
    if (this.timeToMinutes(openingTime) >= this.timeToMinutes(closingTime)) {
      throw new BadRequestException('Closing time must be after opening time');
    }
  }

  private async ensureService(serviceId?: string | null) {
    if (!serviceId) return null;
    const service = await this.serviceModel
      .findById(serviceId)
      .select('_id')
      .lean();
    if (!service) throw new NotFoundException('Service not found');
    return new Types.ObjectId(serviceId);
  }

  async findAll() {
    return this.holidayModel
      .find()
      .populate('serviceId', 'name')
      .sort({ date: 1, createdAt: 1 });
  }

  async create(dto: CreateHolidayDto) {
    const date = this.parseDateOnly(dto.date);
    const serviceObjectId = await this.ensureService(dto.serviceId);
    const isClosed = dto.isClosed ?? true;

    this.validateSchedule(
      isClosed,
      dto.serviceId,
      dto.openingTime,
      dto.closingTime,
    );

    const exists = await this.holidayModel.exists({
      date,
      serviceId: serviceObjectId,
    });
    if (exists) {
      throw new ConflictException(
        'An exception already exists for this date and scope',
      );
    }

    try {
      return await this.holidayModel.create({
        name: dto.name.trim(),
        date,
        serviceId: serviceObjectId,
        isClosed,
        openingTime: isClosed ? undefined : dto.openingTime,
        closingTime: isClosed ? undefined : dto.closingTime,
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'An exception already exists for this date and scope',
        );
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateHolidayDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exception ID');
    }

    const existing = await this.holidayModel.findById(id);
    if (!existing) throw new NotFoundException('Schedule exception not found');

    const nextServiceId =
      dto.serviceId !== undefined
        ? dto.serviceId
        : (existing.serviceId?.toString() ?? null);
    const serviceObjectId = await this.ensureService(nextServiceId);
    const nextIsClosed = dto.isClosed ?? existing.isClosed;
    const nextOpeningTime = dto.openingTime ?? existing.openingTime;
    const nextClosingTime = dto.closingTime ?? existing.closingTime;

    this.validateSchedule(
      nextIsClosed,
      nextServiceId,
      nextOpeningTime,
      nextClosingTime,
    );

    if (dto.name !== undefined) existing.name = dto.name.trim();
    if (dto.date !== undefined) existing.date = this.parseDateOnly(dto.date);
    if (dto.serviceId !== undefined) existing.serviceId = serviceObjectId;
    existing.isClosed = nextIsClosed;
    existing.openingTime = nextIsClosed ? undefined : nextOpeningTime;
    existing.closingTime = nextIsClosed ? undefined : nextClosingTime;

    try {
      return await existing.save();
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'An exception already exists for this date and scope',
        );
      }
      throw error;
    }
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exception ID');
    }
    const deleted = await this.holidayModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Schedule exception not found');
    return { deleted: true };
  }
}
