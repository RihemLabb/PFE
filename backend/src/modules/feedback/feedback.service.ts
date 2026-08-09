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

  async getSummary() {
    const feedback = await this.feedbackModel
      .find()
      .populate('serviceId', 'name')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: feedback.filter((item: any) => item.rating === rating).length,
    }));
    const totalFeedback = feedback.length;
    const averageRating = totalFeedback
      ? Number(
          (
            feedback.reduce(
              (sum: number, item: any) => sum + item.rating,
              0,
            ) / totalFeedback
          ).toFixed(2),
        )
      : 0;

    const serviceMap = new Map<
      string,
      { serviceId: string; serviceName: string; count: number; total: number }
    >();

    feedback.forEach((item: any) => {
      const populated = item.serviceId;
      const serviceId = populated?._id?.toString() ?? populated?.toString() ?? '';
      const serviceName = populated?.name ?? 'Service';
      const current = serviceMap.get(serviceId) ?? {
        serviceId,
        serviceName,
        count: 0,
        total: 0,
      };
      current.count += 1;
      current.total += item.rating;
      serviceMap.set(serviceId, current);
    });

    const byService = Array.from(serviceMap.values())
      .map((entry) => ({
        serviceId: entry.serviceId,
        serviceName: entry.serviceName,
        feedbackCount: entry.count,
        averageRating: Number((entry.total / entry.count).toFixed(2)),
      }))
      .sort((a, b) => b.feedbackCount - a.feedbackCount);

    const recentComments = feedback
      .filter((item: any) => item.comment?.trim())
      .slice(0, 10)
      .map((item: any) => ({
        id: item._id.toString(),
        serviceName: item.serviceId?.name ?? 'Service',
        rating: item.rating,
        comment: item.comment,
        createdAt: item.createdAt,
      }));

    return {
      totalFeedback,
      averageRating,
      ratingDistribution,
      byService,
      recentComments,
    };
  }
}
