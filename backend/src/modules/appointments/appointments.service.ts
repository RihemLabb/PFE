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
import { Holiday, HolidayDocument } from '../holidays/schemas/holiday.schema';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { QueueStatus } from '../../common/enums/queue-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  addDaysToDateKey,
  dateKeyToUtcDate,
  getBusinessDayRange,
  getDateKeyInTimeZone,
} from '../../common/utils/business-date';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(QueueEntry.name)
    private queueEntryModel: Model<QueueEntryDocument>,
    @InjectModel(Holiday.name)
    private holidayModel: Model<HolidayDocument>,
  ) {}

  private getAppointmentDayRange(dateKey: string) {
    return {
      start: dateKeyToUtcDate(dateKey),
      end: dateKeyToUtcDate(addDaysToDateKey(dateKey, 1)),
    };
  }

  private parseDateOnly(date: string) {
    try {
      return dateKeyToUtcDate(date);
    } catch {
      throw new BadRequestException('Invalid appointment date');
    }
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

  private buildServiceSlots(
    service: ServiceDocument,
    openingTime = service.openingTime || '09:00',
    closingTime = service.closingTime || '17:00',
  ) {
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

  private ensureNotPast(appointmentDate: Date) {
    const appointmentKey = appointmentDate.toISOString().slice(0, 10);
    const todayKey = getDateKeyInTimeZone();
    if (appointmentKey < todayKey) {
      throw new BadRequestException('Cannot book an appointment in the past');
    }
  }

  private getSlotReservationPath(appointmentDate: Date, timeSlot: string) {
    const dateKey = appointmentDate.toISOString().slice(0, 10);
    const safeSlot = timeSlot.replace(/[^a-zA-Z0-9-]/g, '-');
    return `slotReservations.${dateKey}__${safeSlot}`;
  }

  private async reserveSlot(
    service: ServiceDocument,
    appointmentDate: Date,
    timeSlot: string,
    currentBookings: number,
  ) {
    const reservationPath = this.getSlotReservationPath(
      appointmentDate,
      timeSlot,
    );

    await this.serviceModel.updateOne(
      {
        _id: service._id,
        $or: [
          { [reservationPath]: { $exists: false } },
          { [reservationPath]: { $lt: currentBookings } },
        ],
      },
      { $set: { [reservationPath]: currentBookings } },
    );

    const reserved = await this.serviceModel.findOneAndUpdate(
      {
        _id: service._id,
        [reservationPath]: { $lt: service.maxCapacityPerSlot },
      },
      { $inc: { [reservationPath]: 1 } },
      { new: true },
    );

    if (!reserved) {
      throw new BadRequestException(
        `Sorry, the ${timeSlot} slot is fully booked. Maximum capacity (${service.maxCapacityPerSlot}) reached.`,
      );
    }
  }

  private async releaseSlotReservation(
    serviceId: Types.ObjectId,
    appointmentDate: Date,
    timeSlot: string,
  ) {
    const reservationPath = this.getSlotReservationPath(
      appointmentDate,
      timeSlot,
    );
    await this.serviceModel.updateOne(
      { _id: serviceId, [reservationPath]: { $gt: 0 } },
      { $inc: { [reservationPath]: -1 } },
    );
  }

  private async getNextTicketNumber(
    service: ServiceDocument,
    appointmentDate: Date,
  ) {
    const dateKey = appointmentDate.toISOString().slice(0, 10);
    const sequencePath = `ticketSequences.${dateKey}`;
    const existingCount = await this.appointmentModel.countDocuments({
      serviceId: service._id,
      date: appointmentDate,
    });

    const updatedService = await this.serviceModel.findByIdAndUpdate(
      service._id,
      [
        {
          $set: {
            [sequencePath]: {
              $add: [{ $ifNull: [`$${sequencePath}`, existingCount] }, 1],
            },
          },
        },
      ],
      { new: true },
    );

    if (!updatedService) throw new NotFoundException('Service not found');

    const sequenceValue = updatedService.ticketSequences?.get(dateKey);
    if (!sequenceValue) {
      throw new BadRequestException('Could not allocate a ticket number');
    }

    const prefix =
      service.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() ||
      'TKT';
    return `${prefix}-${String(sequenceValue).padStart(3, '0')}`;
  }

  private async resolveScheduleForDate(
    service: ServiceDocument,
    appointmentDate: Date,
  ) {
    const exceptions = await this.holidayModel
      .find({
        date: appointmentDate,
        $or: [{ serviceId: null }, { serviceId: service._id }],
      })
      .lean();

    const serviceId = service._id.toString();
    const specificException = exceptions.find(
      (exception: any) => exception.serviceId?.toString() === serviceId,
    );
    const globalException = exceptions.find(
      (exception: any) => !exception.serviceId,
    );
    const exception = specificException ?? globalException;

    if (exception) {
      if (exception.isClosed) {
        return {
          isOpen: false,
          openingTime: service.openingTime || '09:00',
          closingTime: service.closingTime || '17:00',
          closureReason: exception.name,
        };
      }

      return {
        isOpen: true,
        openingTime: exception.openingTime || service.openingTime || '09:00',
        closingTime: exception.closingTime || service.closingTime || '17:00',
        closureReason: null,
      };
    }

    const workingDays = service.workingDays?.length
      ? service.workingDays
      : [1, 2, 3, 4, 5];
    const isOpen = workingDays.includes(appointmentDate.getUTCDay());

    return {
      isOpen,
      openingTime: service.openingTime || '09:00',
      closingTime: service.closingTime || '17:00',
      closureReason: isOpen ? null : 'Service closed on this weekday',
    };
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
    const todayKey = getDateKeyInTimeZone();
    if (date < todayKey) {
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
        closureReason: 'Date is in the past',
        slots: [],
      };
    }

    const schedule = await this.resolveScheduleForDate(service, appointmentDate);
    const serviceSlots = schedule.isOpen
      ? this.buildServiceSlots(
          service,
          schedule.openingTime,
          schedule.closingTime,
        )
      : [];

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
      openingTime: schedule.openingTime,
      closingTime: schedule.closingTime,
      requiredDocs: service.requiredDocs ?? [],
      isOpen: schedule.isOpen,
      closureReason: schedule.closureReason,
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
    this.ensureNotPast(appointmentDate);

    const schedule = await this.resolveScheduleForDate(service, appointmentDate);
    if (!schedule.isOpen) {
      throw new BadRequestException(
        schedule.closureReason || 'This service is closed on the selected date',
      );
    }

    const validSlots = this.buildServiceSlots(
      service,
      schedule.openingTime,
      schedule.closingTime,
    );
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

    await this.reserveSlot(
      service,
      appointmentDate,
      createAppointmentDto.timeSlot,
      currentBookings,
    );

    try {
      const ticketNumber = await this.getNextTicketNumber(
        service,
        appointmentDate,
      );
      const appointment = new this.appointmentModel({
        ...createAppointmentDto,
        date: appointmentDate,
        userId,
        qrToken: crypto.randomUUID(),
        ticketNumber,
        status: AppointmentStatus.CONFIRMED,
      });

      return await appointment.save();
    } catch (error) {
      await this.releaseSlotReservation(
        service._id,
        appointmentDate,
        createAppointmentDto.timeSlot,
      ).catch(() => undefined);
      throw error;
    }
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
    const cancelledAppointment = await appointment.save();
    await this.releaseSlotReservation(
      appointment.serviceId,
      appointment.date,
      appointment.timeSlot,
    );
    return cancelledAppointment;
  }

  async getDashboardStats() {
    const todayKey = getDateKeyInTimeZone();
    const { start: appointmentStart, end: appointmentEnd } =
      this.getAppointmentDayRange(todayKey);
    const { start: queueStart, end: queueEnd } = getBusinessDayRange();

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
      this.appointmentModel.countDocuments({
        date: { $gte: appointmentStart, $lt: appointmentEnd },
      }),
      this.appointmentModel.countDocuments({
        date: { $gte: appointmentStart, $lt: appointmentEnd },
        status: AppointmentStatus.CANCELLED,
      }),
      this.queueEntryModel
        .find({ date: { $gte: queueStart, $lt: queueEnd } })
        .select('status checkInTime calledTime')
        .lean(),
      this.queueEntryModel.countDocuments({
        date: { $gte: queueStart, $lt: queueEnd },
        status: QueueStatus.FINISHED,
      }),
      this.queueEntryModel.countDocuments({
        date: { $gte: queueStart, $lt: queueEnd },
        status: QueueStatus.ABSENT,
      }),
      this.queueEntryModel.countDocuments({
        date: { $gte: queueStart, $lt: queueEnd },
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
        const dayKey = addDaysToDateKey(todayKey, index - 6);
        const { start: dayStart, end: dayEnd } =
          this.getAppointmentDayRange(dayKey);

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
