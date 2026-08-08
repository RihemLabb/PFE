import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
  ) {}

  async findAll() {
    return this.appointmentModel
      .find()
      .populate('userId')
      .populate('serviceId')
      .sort({ date: 1, timeSlot: 1 });
  }

  async findMyAppointments(userId: string) {
    return this.appointmentModel
      .find({ userId })
      .populate('serviceId')
      .sort({ createdAt: -1 });
  }

  async create(createAppointmentDto: any, userId: string) {
    const service = await this.serviceModel.findById(
      createAppointmentDto.serviceId,
    );
    if (!service) throw new NotFoundException('Service not found');
    if (!service.isActive) {
      throw new BadRequestException('This service is currently unavailable');
    }

    const appointmentDate = new Date(
      `${createAppointmentDto.date}T00:00:00.000Z`,
    );

    if (Number.isNaN(appointmentDate.getTime())) {
      throw new BadRequestException('Invalid appointment date');
    }

    const currentBookings = await this.appointmentModel.countDocuments({
      serviceId: createAppointmentDto.serviceId,
      date: appointmentDate,
      timeSlot: createAppointmentDto.timeSlot,
      status: { $ne: AppointmentStatus.CANCELLED },
    });

    if (currentBookings >= service.maxCapacityPerSlot) {
      throw new BadRequestException(
        `Sorry, the ${createAppointmentDto.timeSlot} slot is fully booked. Maximum capacity (${service.maxCapacityPerSlot}) reached.`,
      );
    }

    const appointment = new this.appointmentModel({
      ...createAppointmentDto,
      date: appointmentDate,
      userId,
      qrToken: crypto.randomUUID(),
      ticketNumber: `${service.name.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      status: AppointmentStatus.CONFIRMED,
    });

    return appointment.save();
  }

  async cancel(id: string, requesterUserId: string, requesterRole: UserRole) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid appointment ID');
    }

    const appointment = await this.appointmentModel.findById(id);
    if (!appointment) throw new NotFoundException('Appointment not found');

    const canManageAny = [UserRole.ADMIN, UserRole.SUPERVISOR].includes(
      requesterRole,
    );
    const ownsAppointment = appointment.userId.toString() === requesterUserId;

    if (!canManageAny && !ownsAppointment) {
      throw new ForbiddenException(
        'You are not allowed to cancel this appointment',
      );
    }

    const nonCancellableStatuses = [
      AppointmentStatus.CANCELLED,
      AppointmentStatus.CHECKED_IN,
      AppointmentStatus.FINISHED,
      AppointmentStatus.ABSENT,
    ];

    if (nonCancellableStatuses.includes(appointment.status)) {
      throw new BadRequestException(
        `Appointment cannot be cancelled while its status is ${appointment.status}`,
      );
    }

    appointment.status = AppointmentStatus.CANCELLED;
    return appointment.save();
  }
}
