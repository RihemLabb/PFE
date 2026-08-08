import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueueEntry, QueueEntryDocument } from './schemas/queue-entry.schema';
import {
  Appointment,
  AppointmentDocument,
} from '../appointments/schemas/appointment.schema';
import { Counter, CounterDocument } from '../counters/schemas/counter.schema';
import { AgentAssignmentsService } from '../agent-assignments/agent-assignments.service';
import { QueueStatus } from '../../common/enums/queue-status.enum';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { CounterStatus } from '../../common/enums/counter-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';

interface QueueActor {
  userId: string;
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
    private readonly agentAssignmentsService: AgentAssignmentsService,
  ) {}

  private getTodayRange() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return { start, end };
  }

  private validateServiceId(serviceId: string) {
    if (!Types.ObjectId.isValid(serviceId)) {
      throw new BadRequestException('Invalid Service ID format');
    }
  }

  private async authorizeAgentService(actor: QueueActor, serviceId: string) {
    if (actor.role === UserRole.AGENT) {
      await this.agentAssignmentsService.assertAgentService(
        actor.userId,
        serviceId,
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
    );
  }

  async getTodayQueue(serviceId: string, actor: QueueActor) {
    this.validateServiceId(serviceId);
    await this.authorizeAgentService(actor, serviceId);
    const { start, end } = this.getTodayRange();

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
    const { start, end } = this.getTodayRange();

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

  async checkIn(qrToken: string) {
    const appointment = await this.appointmentModel.findOne({ qrToken });
    if (!appointment) {
      throw new NotFoundException('Invalid QR token. Please check your ticket.');
    }

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

    const todayStr = new Date().toISOString().split('T')[0];
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
        return existingEntry;
      }

      throw new BadRequestException(
        `This ticket has already been checked in and is currently ${existingEntry.status}`,
      );
    }

    const { start, end } = this.getTodayRange();
    const count = await this.queueEntryModel.countDocuments({
      serviceId: appointment.serviceId,
      date: { $gte: start, $lt: end },
    });

    const now = new Date();
    const entry = new this.queueEntryModel({
      appointmentId: appointment._id,
      serviceId: appointment.serviceId,
      date: now,
      checkInTime: now,
      position: count + 1,
      status: QueueStatus.WAITING,
    });

    appointment.status = AppointmentStatus.CHECKED_IN;
    await appointment.save();

    return entry.save();
  }

  async callNext(
    serviceId: string,
    counterId: string,
    actor: QueueActor,
  ) {
    if (!Types.ObjectId.isValid(serviceId) || !Types.ObjectId.isValid(counterId)) {
      throw new BadRequestException(
        'Invalid Service or Counter ID format. Please check your configuration.',
      );
    }

    await this.authorizeAgentService(actor, serviceId);
    if (actor.role === UserRole.AGENT) {
      await this.agentAssignmentsService.assertAgentCounter(
        actor.userId,
        counterId,
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

    const { start, end } = this.getTodayRange();
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
    entry.status = QueueStatus.ABSENT;
    await entry.save();

    await this.appointmentModel.findByIdAndUpdate(entry.appointmentId, {
      status: AppointmentStatus.ABSENT,
    });

    return entry;
  }
}
