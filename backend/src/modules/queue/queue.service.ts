import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueueEntry, QueueEntryDocument } from './schemas/queue-entry.schema';
import {
  Appointment,
  AppointmentDocument,
} from '../appointments/schemas/appointment.schema';
import { Counter, CounterDocument } from '../counters/schemas/counter.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { AgentAssignmentsService } from '../agent-assignments/agent-assignments.service';
import { QueueStatus } from '../../common/enums/queue-status.enum';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { CounterStatus } from '../../common/enums/counter-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { CheckInDto } from './dto/check-in.dto';
import {
  getBusinessDayRange,
  getDateKeyInTimeZone,
} from '../../common/utils/business-date';

interface QueueActor {
  userId: string;
  email?: string;
  role: UserRole;
}

@Injectable()
export class QueueService {
  constructor(
    @InjectModel(QueueEntry.name)
    private queueEntryModel: Model<QueueEntryDocument>,
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(Counter.name)
    private counterModel: Model<CounterDocument>,
    @InjectModel(Service.name)
    private serviceModel: Model<ServiceDocument>,
    private readonly agentAssignmentsService: AgentAssignmentsService,
  ) {}

  private getDayRange(date = new Date()) {
    const { start, end } = getBusinessDayRange(date);
    return { start, end };
  }

  private validateServiceId(serviceId: string) {
    if (!Types.ObjectId.isValid(serviceId)) {
      throw new BadRequestException('Invalid Service ID format');
    }
  }

  private isDuplicateKeyError(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    );
  }

  private async syncAppointmentCheckedIn(appointment: AppointmentDocument) {
    if (appointment.status === AppointmentStatus.CHECKED_IN) return;
    appointment.status = AppointmentStatus.CHECKED_IN;
    await appointment.save();
  }

  private async getNextQueuePosition(
    serviceId: Types.ObjectId,
    now = new Date(),
  ) {
    const { start, end, dateKey } = getBusinessDayRange(now);
    const sequencePath = `queueSequences.${dateKey}`;
    const existingCount = await this.queueEntryModel.countDocuments({
      serviceId,
      date: { $gte: start, $lt: end },
    });

    const updatedService = await this.serviceModel.findByIdAndUpdate(
      serviceId,
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

    const position = updatedService.queueSequences?.get(dateKey);
    if (!position) {
      throw new BadRequestException('Could not allocate a queue position');
    }

    return position;
  }

  private async authorizeAgentService(actor: QueueActor, serviceId: string) {
    if (actor.role === UserRole.AGENT) {
      await this.agentAssignmentsService.assertAgentService(
        actor.userId,
        serviceId,
        actor.email,
      );
    }
  }

  private async authorizeAgentEntry(
    actor: QueueActor,
    entry: QueueEntryDocument,
  ) {
    if (actor.role !== UserRole.AGENT) return;
    if (!entry.counterId) {
      throw new BadRequestException('Ticket has no counter assignment');
    }

    await this.agentAssignmentsService.assertAgentCounter(
      actor.userId,
      entry.counterId.toString(),
      actor.email,
    );
  }

  async getTodayQueue(serviceId: string, actor: QueueActor) {
    this.validateServiceId(serviceId);
    await this.authorizeAgentService(actor, serviceId);
    const { start, end } = this.getDayRange();

    return this.queueEntryModel
      .find({
        serviceId,
        date: { $gte: start, $lt: end },
      })
      .populate({
        path: 'appointmentId',
        populate: { path: 'userId', select: 'firstName lastName' },
      })
      .populate('counterId')
      .sort({ position: 1 });
  }

  async getPublicDisplayQueue(serviceId: string) {
    this.validateServiceId(serviceId);
    const { start, end } = this.getDayRange();

    const entries = await this.queueEntryModel
      .find({
        serviceId,
        date: { $gte: start, $lt: end },
        status: {
          $in: [
            QueueStatus.WAITING,
            QueueStatus.CALLED,
            QueueStatus.IN_PROGRESS,
          ],
        },
      })
      .populate({ path: 'appointmentId', select: 'ticketNumber' })
      .populate({ path: 'counterId', select: 'number name' })
      .sort({ position: 1 })
      .lean();

    return entries.map((entry: any) => ({
      _id: entry._id,
      position: entry.position,
      status: entry.status,
      ticketNumber: entry.appointmentId?.ticketNumber ?? 'N/A',
      counterNumber: entry.counterId?.number ?? null,
      counterName: entry.counterId?.name ?? null,
    }));
  }

  async getMyQueueStatus(appointmentId: string, userId: string) {
    if (
      !Types.ObjectId.isValid(appointmentId) ||
      !Types.ObjectId.isValid(userId)
    ) {
      throw new BadRequestException('Invalid appointment or user ID');
    }

    const appointment = await this.appointmentModel.findOne({
      _id: appointmentId,
      userId,
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const service = await this.serviceModel.findById(appointment.serviceId);
    if (!service) throw new NotFoundException('Service not found');

    const entry = await this.queueEntryModel
      .findOne({ appointmentId: appointment._id })
      .populate('counterId', 'number name');

    if (!entry) {
      return {
        appointmentId: appointment._id,
        ticketNumber: appointment.ticketNumber,
        appointmentStatus: appointment.status,
        serviceName: service.name,
        queueStatus: null,
        position: null,
        peopleAhead: null,
        estimatedWaitMinutes: null,
        averageServiceMinutes: service.avgDuration,
        counter: null,
      };
    }

    const { start, end } = this.getDayRange(entry.date);
    let peopleAhead = 0;

    if (entry.status === QueueStatus.WAITING) {
      peopleAhead = await this.queueEntryModel.countDocuments({
        serviceId: entry.serviceId,
        date: { $gte: start, $lt: end },
        position: { $lt: entry.position },
        status: {
          $in: [
            QueueStatus.WAITING,
            QueueStatus.CALLED,
            QueueStatus.IN_PROGRESS,
          ],
        },
      });
    }

    const recentFinished = await this.queueEntryModel
      .find({
        serviceId: entry.serviceId,
        status: QueueStatus.FINISHED,
        serviceStartTime: { $ne: null },
        finishTime: { $ne: null },
      })
      .sort({ finishTime: -1 })
      .limit(30)
      .select('serviceStartTime finishTime')
      .lean();

    const processingSamples = recentFinished
      .map((sample: any) => {
        const startTime = new Date(sample.serviceStartTime).getTime();
        const finishTime = new Date(sample.finishTime).getTime();
        return (finishTime - startTime) / 60000;
      })
      .filter(
        (minutes) => Number.isFinite(minutes) && minutes > 0 && minutes < 240,
      );

    const averageServiceMinutes = processingSamples.length
      ? Math.max(
          1,
          Math.round(
            processingSamples.reduce((sum, value) => sum + value, 0) /
              processingSamples.length,
          ),
        )
      : service.avgDuration;

    const estimatedWaitMinutes =
      entry.status === QueueStatus.WAITING
        ? Math.max(0, Math.ceil(peopleAhead * averageServiceMinutes))
        : 0;

    const populatedCounter = entry.counterId as any;

    return {
      appointmentId: appointment._id,
      ticketNumber: appointment.ticketNumber,
      appointmentStatus: appointment.status,
      serviceName: service.name,
      queueStatus: entry.status,
      position: entry.position,
      peopleAhead,
      estimatedWaitMinutes,
      averageServiceMinutes,
      counter: populatedCounter
        ? {
            id: populatedCounter._id,
            number: populatedCounter.number,
            name: populatedCounter.name,
          }
        : null,
      checkInTime: entry.checkInTime ?? null,
      calledTime: entry.calledTime ?? null,
      serviceStartTime: entry.serviceStartTime ?? null,
      finishTime: entry.finishTime ?? null,
    };
  }

  private normalizeTicketNumber(ticketNumber: string) {
    return ticketNumber.trim().toUpperCase();
  }

  private validateCheckInIdentifier(identifier: CheckInDto) {
    const qrToken = identifier.qrToken?.trim();
    const ticketNumber = identifier.ticketNumber
      ? this.normalizeTicketNumber(identifier.ticketNumber)
      : undefined;

    if ((!qrToken && !ticketNumber) || (qrToken && ticketNumber)) {
      throw new BadRequestException(
        'Provide exactly one QR token or ticket number',
      );
    }

    return { qrToken, ticketNumber };
  }

  private async findCheckInAppointment(identifier: CheckInDto) {
    const { qrToken, ticketNumber } =
      this.validateCheckInIdentifier(identifier);
    if (qrToken) return this.appointmentModel.findOne({ qrToken });

    const { start, end } = this.getDayRange();
    return this.appointmentModel.findOne({
      ticketNumber,
      date: { $gte: start, $lt: end },
    });
  }

  async lookupTicket(ticketNumber: string) {
    const normalizedTicketNumber = this.normalizeTicketNumber(ticketNumber);
    const { start, end } = this.getDayRange();
    const appointment = await this.appointmentModel
      .findOne({
        ticketNumber: normalizedTicketNumber,
        date: { $gte: start, $lt: end },
      })
      .populate('userId', 'firstName lastName')
      .populate('serviceId', 'name');

    if (!appointment) {
      throw new NotFoundException(
        'No appointment with this ticket number today',
      );
    }

    const populatedService = appointment.serviceId as any;
    const serviceId =
      populatedService?._id?.toString?.() ?? appointment.serviceId.toString();

    const populatedUser = appointment.userId as any;
    return {
      appointmentId: appointment._id,
      ticketNumber: appointment.ticketNumber,
      userName: populatedUser?.firstName
        ? `${populatedUser.firstName} ${populatedUser.lastName ?? ''}`.trim()
        : 'Appointment holder',
      serviceId,
      serviceName: populatedService?.name ?? 'Service',
      date: appointment.date,
      timeSlot: appointment.timeSlot,
      status: appointment.status,
    };
  }

  async checkIn(identifier: CheckInDto, actor: QueueActor) {
    const appointment = await this.findCheckInAppointment(identifier);
    if (!appointment) {
      throw new NotFoundException(
        'Ticket not found. Check the QR code or ticket number.',
      );
    }
    await this.authorizeAgentService(actor, appointment.serviceId.toString());

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException(
        'Check-in failed: This appointment has been cancelled.',
      );
    }

    if (
      [AppointmentStatus.FINISHED, AppointmentStatus.ABSENT].includes(
        appointment.status,
      )
    ) {
      throw new BadRequestException(
        `Check-in is not allowed for an appointment with status ${appointment.status}`,
      );
    }

    const todayStr = getDateKeyInTimeZone(new Date());
    const apptStr = new Date(appointment.date).toISOString().split('T')[0];

    if (todayStr !== apptStr) {
      throw new BadRequestException(
        `QR code is only valid on the day of the appointment. Today is ${todayStr}, appointment is ${apptStr}.`,
      );
    }

    const existingEntry = await this.queueEntryModel.findOne({
      appointmentId: appointment._id,
    });

    if (existingEntry) {
      if (existingEntry.status === QueueStatus.WAITING) {
        await this.syncAppointmentCheckedIn(appointment);
        return existingEntry;
      }

      throw new BadRequestException(
        `This ticket has already been checked in and is currently ${existingEntry.status}`,
      );
    }

    const now = new Date();
    const position = await this.getNextQueuePosition(
      appointment.serviceId,
      now,
    );
    const entry = new this.queueEntryModel({
      appointmentId: appointment._id,
      serviceId: appointment.serviceId,
      date: now,
      checkInTime: now,
      position,
      status: QueueStatus.WAITING,
    });

    try {
      const savedEntry = await entry.save();
      await this.syncAppointmentCheckedIn(appointment);
      return savedEntry;
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        const racedEntry = await this.queueEntryModel.findOne({
          appointmentId: appointment._id,
        });

        if (racedEntry) {
          if (racedEntry.status !== QueueStatus.WAITING) {
            throw new BadRequestException(
              `This ticket has already been checked in and is currently ${racedEntry.status}`,
            );
          }

          await this.syncAppointmentCheckedIn(appointment);
          return racedEntry;
        }
      }

      throw error;
    }
  }

  async callNext(serviceId: string, counterId: string, actor: QueueActor) {
    if (
      !Types.ObjectId.isValid(serviceId) ||
      !Types.ObjectId.isValid(counterId)
    ) {
      throw new BadRequestException(
        'Invalid Service or Counter ID format. Please check your configuration.',
      );
    }

    await this.authorizeAgentService(actor, serviceId);
    if (actor.role === UserRole.AGENT) {
      await this.agentAssignmentsService.assertAgentCounter(
        actor.userId,
        counterId,
        actor.email,
      );
    }

    const counter = await this.counterModel.findById(counterId);
    if (!counter) throw new NotFoundException('Counter not found');
    if (counter.status !== CounterStatus.ACTIVE) {
      throw new BadRequestException('Selected counter is not active');
    }
    if (counter.serviceId.toString() !== serviceId) {
      throw new BadRequestException(
        'Selected counter does not belong to the selected service',
      );
    }

    const { start, end } = this.getDayRange();
    const nextEntry = await this.queueEntryModel.findOneAndUpdate(
      {
        serviceId,
        date: { $gte: start, $lt: end },
        status: QueueStatus.WAITING,
      },
      {
        $set: {
          status: QueueStatus.CALLED,
          counterId: new Types.ObjectId(counterId),
          calledTime: new Date(),
        },
      },
      { new: true, sort: { position: 1 } },
    );

    if (!nextEntry) {
      throw new NotFoundException('No one is waiting in the queue');
    }

    return nextEntry;
  }

  async startService(queueEntryId: string, actor: QueueActor) {
    const entry = await this.queueEntryModel.findById(queueEntryId);
    if (!entry) throw new NotFoundException('Queue entry not found');
    if (entry.status !== QueueStatus.CALLED) {
      throw new BadRequestException('Can only start a CALLED ticket');
    }

    await this.authorizeAgentEntry(actor, entry);
    entry.status = QueueStatus.IN_PROGRESS;
    entry.serviceStartTime = new Date();
    return entry.save();
  }

  async finishService(queueEntryId: string, actor: QueueActor) {
    const entry = await this.queueEntryModel.findById(queueEntryId);
    if (!entry) throw new NotFoundException('Queue entry not found');
    if (entry.status !== QueueStatus.IN_PROGRESS) {
      throw new BadRequestException('Can only finish an IN_PROGRESS ticket');
    }

    await this.authorizeAgentEntry(actor, entry);
    entry.status = QueueStatus.FINISHED;
    entry.finishTime = new Date();
    await entry.save();

    await this.appointmentModel.findByIdAndUpdate(entry.appointmentId, {
      status: AppointmentStatus.FINISHED,
    });

    return entry;
  }

  async markAbsent(queueEntryId: string, actor: QueueActor) {
    const entry = await this.queueEntryModel.findById(queueEntryId);
    if (!entry) throw new NotFoundException('Queue entry not found');
    if (entry.status !== QueueStatus.CALLED) {
      throw new BadRequestException('Can only mark a CALLED ticket as absent');
    }

    await this.authorizeAgentEntry(actor, entry);

    if (!entry.calledTime) {
      throw new BadRequestException('Called time is missing for this ticket');
    }

    const service = await this.serviceModel.findById(entry.serviceId);
    if (!service) throw new NotFoundException('Service not found');

    const delayMinutes = service.absenceDelayMinutes ?? 15;
    const eligibleAt =
      new Date(entry.calledTime).getTime() + delayMinutes * 60 * 1000;
    const remainingMs = eligibleAt - Date.now();

    if (remainingMs > 0) {
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      throw new BadRequestException(
        `Cannot mark this ticket absent yet. Wait ${remainingMinutes} more minute${remainingMinutes === 1 ? '' : 's'}.`,
      );
    }

    entry.status = QueueStatus.ABSENT;
    await entry.save();

    await this.appointmentModel.findByIdAndUpdate(entry.appointmentId, {
      status: AppointmentStatus.ABSENT,
    });

    return entry;
  }
}
