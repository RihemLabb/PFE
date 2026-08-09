import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import {
  Appointment,
  AppointmentDocument,
} from '../appointments/schemas/appointment.schema';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { Feedback, FeedbackDocument } from './schemas/feedback.schema';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<FeedbackDocument>,
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>,
  ) {}

  async create(userId: string, dto: CreateFeedbackDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user');
    }

    const appointment = await this.appointmentModel
      .findById(dto.appointmentId)
      .lean()
      .exec();

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.userId.toString() !== userId) {
      throw new ForbiddenException('You can only rate your own appointment');
    }

    if (appointment.status !== AppointmentStatus.FINISHED) {
      throw new BadRequestException(
        'Feedback is available only after the appointment is finished',
      );
    }

    const existing = await this.feedbackModel.exists({
      appointmentId: appointment._id,
    });

    if (existing) {
      throw new ConflictException('This appointment has already been rated');
    }

    try {
      return await this.feedbackModel.create({
        appointmentId: appointment._id,
        userId: new Types.ObjectId(userId),
        serviceId: appointment.serviceId,
        rating: dto.rating,
        comment: dto.comment?.trim() ?? '',
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException('This appointment has already been rated');
      }
      throw error;
    }
  }

  async findMine(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user');
    }

    return this.feedbackModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }
}
