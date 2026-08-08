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
import {
  QueueEntry,
  QueueEntryDocument,
} from '../queue/schemas/queue-entry.schema';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { QueueStatus } from '../../common/enums/queue-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(QueueEntry.name)
    private queueEntryModel: Model<QueueEntryDocument>,
  ) {}

  private getUtcDayRange(date = new Date()) {
    const start = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }

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

  async getDashboardStats() {
    const { start, end } = this.getUtcDayRange();

    const [
      totalServices,
      todayAppointments,
      cancelled,
      queueEntries,
      finished,
      absent,
      waiting,
    ] = await Promise.all([
      this.serviceModel.countDocuments({ isActive: true }),
      this.appointmentModel.countDocuments({ date: { $gte: start, $lt: end } }),
      this.appointmentModel.countDocuments({
        date: { $gte: start, $lt: end },
        status: AppointmentStatus.CANCELLED,
      }),
      this.queueEntryModel
        .find({ date: { $gte: start, $lt: end } })
        .select('status checkInTime calledTime')
        .lean(),
      this.queueEntryModel.countDocuments({
        date: { $gte: start, $lt: end },
        status: QueueStatus.FINISHED,
      }),
      this.queueEntryModel.countDocuments({
        date: { $gte: start, $lt: end },
        status: QueueStatus.ABSENT,
      }),
      this.queueEntryModel.countDocuments({
        date: { $gte: start, $lt: end },
        status: QueueStatus.WAITING,
      }),
    ]);

    const waitingSamples = queueEntries.filter(
      (entry: any) => entry.checkInTime && entry.calledTime,
    );
    const averageWaitMinutes = waitingSamples.length
      ? Math.round(
          waitingSamples.reduce((sum: number, entry: any) => {
            const waitMs =
              new Date(entry.calledTime).getTime() -
              new Date(entry.checkInTime).getTime();
            return sum + Math.max(waitMs, 0);
          }, 0) /
            waitingSamples.length /
            60000,
        )
      : 0;

    const weeklyData = await Promise.all(
      Array.from({ length: 7 }, async (_, index) => {
        const dayStart = new Date(start);
        dayStart.setUTCDate(start.getUTCDate() - (6 - index));
        const dayEnd = new Date(dayStart);
        dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

        const [appointments, completed] = await Promise.all([
          this.appointmentModel.countDocuments({
            date: { $gte: dayStart, $lt: dayEnd },
          }),
          this.appointmentModel.countDocuments({
            date: { $gte: dayStart, $lt: dayEnd },
            status: AppointmentStatus.FINISHED,
          }),
        ]);

        return {
          day: dayStart.toLocaleDateString('en-US', {
            weekday: 'short',
            timeZone: 'UTC',
          }),
          appointments,
          completed,
        };
      }),
    );

    return {
      totalServices,
      todayAppointments,
      checkedIn: queueEntries.length,
      finished,
      cancelled,
      absent,
      waiting,
      averageWaitMinutes,
      weeklyData,
      statusBreakdown: [
        { name: 'Finished', value: finished },
        { name: 'Waiting', value: waiting },
        { name: 'Cancelled', value: cancelled },
        { name: 'Absent', value: absent },
      ],
    };
  }
}
