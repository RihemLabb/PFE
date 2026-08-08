import {
  BadRequestException,
  ConflictException,
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

  private parseDateOnly(date: string) {
    const parsed = new Date(`${date}T00:00:00.000Z`);
    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== date
    ) {
      throw new BadRequestException('Invalid appointment date');
    }
    return parsed;
  }

  private timeToMinutes(time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(totalMinutes: number) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  private buildServiceSlots(service: ServiceDocument) {
    const openingTime = service.openingTime || '09:00';
    const closingTime = service.closingTime || '17:00';
    const slotDuration = service.slotDuration;
    const openingMinutes = this.timeToMinutes(openingTime);
    const closingMinutes = this.timeToMinutes(closingTime);

    if (openingMinutes >= closingMinutes) {
      throw new BadRequestException(
        'Service schedule is invalid: closing time must be after opening time',
      );
    }

    const slots: string[] = [];
    for (
      let cursor = openingMinutes;
      cursor + slotDuration <= closingMinutes;
      cursor += slotDuration
    ) {
      slots.push(this.minutesToTime(cursor));
    }
    return slots;
  }

  private ensureBookableDate(service: ServiceDocument, appointmentDate: Date) {
    const today = this.getUtcDayRange().start;
    if (appointmentDate < today) {
      throw new BadRequestException('Cannot book an appointment in the past');
    }

    const workingDays = service.workingDays?.length
      ? service.workingDays
      : [1, 2, 3, 4, 5];
    if (!workingDays.includes(appointmentDate.getUTCDay())) {
      throw new BadRequestException('This service is closed on the selected date');
    }
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

  async getAvailability(serviceId: string, date: string) {
    const service = await this.serviceModel.findById(serviceId);
    if (!service) throw new NotFoundException('Service not found');
    if (!service.isActive) {
      throw new BadRequestException('This service is currently unavailable');
    }

    const appointmentDate = this.parseDateOnly(date);
    const today = this.getUtcDayRange().start;
    if (appointmentDate < today) {
      return {
        serviceId,
        serviceName: service.name,
        date,
        slotDuration: service.slotDuration,
        maxCapacityPerSlot: service.maxCapacityPerSlot,
        openingTime: service.openingTime || '09:00',
        closingTime: service.closingTime || '17:00',
        requiredDocs: service.requiredDocs ?? [],
        isOpen: false,
        slots: [],
      };
    }

    const workingDays = service.workingDays?.length
      ? service.workingDays
      : [1, 2, 3, 4, 5];
    const isOpen = workingDays.includes(appointmentDate.getUTCDay());
    const serviceSlots = isOpen ? this.buildServiceSlots(service) : [];

    const bookings = await this.appointmentModel
      .find({
        serviceId,
        date: appointmentDate,
        status: { $ne: AppointmentStatus.CANCELLED },
      })
      .select('timeSlot')
      .lean();

    const bookingCounts = bookings.reduce<Record<string, number>>(
      (counts, booking: any) => {
        counts[booking.timeSlot] = (counts[booking.timeSlot] ?? 0) + 1;
        return counts;
      },
      {},
    );

    return {
      serviceId,
      serviceName: service.name,
      date,
      slotDuration: service.slotDuration,
      maxCapacityPerSlot: service.maxCapacityPerSlot,
      openingTime: service.openingTime || '09:00',
      closingTime: service.closingTime || '17:00',
      requiredDocs: service.requiredDocs ?? [],
      isOpen,
      slots: serviceSlots.map((time) => {
        const booked = bookingCounts[time] ?? 0;
        const remaining = Math.max(service.maxCapacityPerSlot - booked, 0);
        return {
          time,
          booked,
          remaining,
          available: remaining > 0,
        };
      }),
    };
  }

  async create(createAppointmentDto: any, userId: string) {
    const service = await this.serviceModel.findById(
      createAppointmentDto.serviceId,
    );
    if (!service) throw new NotFoundException('Service not found');
    if (!service.isActive) {
      throw new BadRequestException('This service is currently unavailable');
    }

    const appointmentDate = this.parseDateOnly(createAppointmentDto.date);
    this.ensureBookableDate(service, appointmentDate);

    const validSlots = this.buildServiceSlots(service);
    if (!validSlots.includes(createAppointmentDto.timeSlot)) {
      throw new BadRequestException(
        'The selected time is outside this service schedule',
      );
    }

    const duplicateBooking = await this.appointmentModel.exists({
      userId,
      serviceId: createAppointmentDto.serviceId,
      date: appointmentDate,
      timeSlot: createAppointmentDto.timeSlot,
      status: { $ne: AppointmentStatus.CANCELLED },
    });
    if (duplicateBooking) {
      throw new ConflictException(
        'You already have an active appointment for this service and time slot',
      );
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

    const dailyServiceCount = await this.appointmentModel.countDocuments({
      serviceId: createAppointmentDto.serviceId,
      date: appointmentDate,
    });
    const prefix =
      service.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() ||
      'TKT';

    const appointment = new this.appointmentModel({
      ...createAppointmentDto,
      date: appointmentDate,
      userId,
      qrToken: crypto.randomUUID(),
      ticketNumber: `${prefix}-${String(dailyServiceCount + 1).padStart(3, '0')}`,
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
