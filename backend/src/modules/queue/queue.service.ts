import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { QueueStatus } from '../../common/enums/queue-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { dayBounds } from '../../common/utils/date';
import {
  Appointment,
  AppointmentDocument,
} from '../appointments/schemas/appointment.schema';
import { Counter, CounterDocument } from '../counters/schemas/counter.schema';
import { SettingsService } from '../settings/settings.module';
import { QueueEntry, QueueEntryDocument } from './schemas/queue-entry.schema';

@Injectable()
export class QueueService {
  constructor(
    @InjectModel(QueueEntry.name) private model: Model<QueueEntryDocument>,
    @InjectModel(Appointment.name)
    private appointments: Model<AppointmentDocument>,
    @InjectModel(Counter.name) private counters: Model<CounterDocument>,
    private settings: SettingsService,
  ) {}

  async today(serviceId?: string) {
    const b = dayBounds(new Date().toISOString().slice(0, 10));
    const filter: Record<string, unknown> = {
      date: { $gte: b.start, $lt: b.end },
    };
    if (serviceId) {
      if (!Types.ObjectId.isValid(serviceId))
        throw new BadRequestException('Service invalide');
      filter.serviceId = serviceId;
    }
    return this.model
      .find(filter)
      .populate({
        path: 'appointmentId',
        populate: { path: 'userId serviceId' },
      })
      .populate('counterId')
      .sort({ position: 1 });
  }

  async publicDisplay(serviceId?: string) {
    const entries = await this.today(serviceId);
    return entries.filter((entry) =>
      [
        QueueStatus.WAITING,
        QueueStatus.CALLED,
        QueueStatus.IN_PROGRESS,
      ].includes(entry.status),
    );
  }

  async myStatus(userId: string) {
    const b = dayBounds(new Date().toISOString().slice(0, 10));
    const entries = await this.model
      .find({
        date: { $gte: b.start, $lt: b.end },
        status: { $nin: [QueueStatus.FINISHED, QueueStatus.ABSENT] },
      })
      .populate({
        path: 'appointmentId',
        match: { userId },
        populate: { path: 'serviceId' },
      })
      .populate('counterId')
      .sort({ position: -1 });
    return entries.find((entry: any) => entry.appointmentId) || null;
  }

  async checkIn(qrToken: string, user: { userId: string; role: UserRole }) {
    const appointment = await this.appointments.findOne({ qrToken });
    if (!appointment) throw new NotFoundException('QR invalide');
    if (
      user.role === UserRole.USER &&
      appointment.userId.toString() !== user.userId
    )
      throw new ForbiddenException('Ce ticket ne vous appartient pas');
    const b = dayBounds(new Date().toISOString().slice(0, 10));
    if (appointment.date < b.start || appointment.date >= b.end)
      throw new BadRequestException(
        'QR valable uniquement le jour du rendez-vous',
      );
    if (
      [
        AppointmentStatus.CANCELLED,
        AppointmentStatus.ABSENT,
        AppointmentStatus.FINISHED,
      ].includes(appointment.status)
    )
      throw new BadRequestException('Rendez-vous non pointable');
    const existing = await this.model.findOne({
      appointmentId: appointment._id,
    });
    if (existing) return existing;
    const last = await this.model
      .findOne({
        serviceId: appointment.serviceId,
        date: { $gte: b.start, $lt: b.end },
      })
      .sort({ position: -1 });
    const now = new Date();
    const entry = await this.model.create({
      appointmentId: appointment._id,
      serviceId: appointment.serviceId,
      date: now,
      checkInTime: now,
      position: (last?.position || 0) + 1,
      status: QueueStatus.WAITING,
    });
    await this.appointments.updateOne(
      { _id: appointment._id },
      { status: AppointmentStatus.CHECKED_IN, checkedInDate: now },
    );
    return entry;
  }

  async callNext(serviceId: string, counterId: string, agentId: string) {
    if (
      !Types.ObjectId.isValid(serviceId) ||
      !Types.ObjectId.isValid(counterId)
    )
      throw new BadRequestException('Service ou guichet invalide');
    const counter = await this.counters.findById(counterId);
    if (!counter || counter.status !== 'ACTIVE')
      throw new BadRequestException('Guichet indisponible');
    if (counter.serviceId?.toString() !== serviceId)
      throw new BadRequestException('Le guichet ne traite pas ce service');
    const b = dayBounds(new Date().toISOString().slice(0, 10));
    const next = await this.model
      .findOne({
        serviceId,
        date: { $gte: b.start, $lt: b.end },
        status: QueueStatus.WAITING,
      })
      .sort({ position: 1 });
    if (!next) throw new NotFoundException("Personne n'attend");
    next.status = QueueStatus.CALLED;
    next.counterId = new Types.ObjectId(counterId);
    next.agentId = new Types.ObjectId(agentId);
    next.calledTime = new Date();
    await this.appointments.updateOne(
      { _id: next.appointmentId },
      { status: AppointmentStatus.CHECKED_IN },
    );
    return next.save();
  }

  private async transition(
    id: string,
    expected: QueueStatus,
    status: QueueStatus,
    appointmentStatus: AppointmentStatus,
    field: 'startTime' | 'finishTime',
  ) {
    const entry = await this.model.findById(id);
    if (!entry) throw new NotFoundException('Ticket introuvable');
    if (entry.status !== expected)
      throw new BadRequestException(`Transition ${expected} requise`);
    entry.status = status;
    entry[field] = new Date();
    await this.appointments.updateOne(
      { _id: entry.appointmentId },
      { status: appointmentStatus },
    );
    return entry.save();
  }

  start(id: string) {
    return this.transition(
      id,
      QueueStatus.CALLED,
      QueueStatus.IN_PROGRESS,
      AppointmentStatus.CHECKED_IN,
      'startTime',
    );
  }
  finish(id: string) {
    return this.transition(
      id,
      QueueStatus.IN_PROGRESS,
      QueueStatus.FINISHED,
      AppointmentStatus.FINISHED,
      'finishTime',
    );
  }

  async absent(id: string) {
    const entry = await this.model.findById(id);
    if (!entry) throw new NotFoundException('Ticket introuvable');
    if (entry.status !== QueueStatus.CALLED || !entry.calledTime)
      throw new BadRequestException('Ticket non appelé');
    const config = await this.settings.get();
    if (
      Date.now() - entry.calledTime.getTime() <
      Number(config.absenceDelayMinutes || 5) * 60000
    )
      throw new BadRequestException(
        `Délai d'absence de ${config.absenceDelayMinutes} min non écoulé`,
      );
    entry.status = QueueStatus.ABSENT;
    entry.finishTime = new Date();
    await this.appointments.updateOne(
      { _id: entry.appointmentId },
      { status: AppointmentStatus.ABSENT },
    );
    return entry.save();
  }
}
