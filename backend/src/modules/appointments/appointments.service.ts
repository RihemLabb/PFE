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
import { AvailabilityService } from '../availability/availability.module';
import {
  CancelAppointmentDto,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './dto/appointment.dto';
import { dateOnly, dayBounds, utcDate } from '../../common/utils/date';
type AuthUser = { userId: string; role: string };
@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private model: Model<AppointmentDocument>,
    @InjectModel(Service.name) private services: Model<ServiceDocument>,
    private availability: AvailabilityService,
  ) {}
  findAll(query: Record<string, string> = {}) {
    const f: any = {};
    if (query.serviceId) f.serviceId = query.serviceId;
    if (query.status) f.status = query.status;
    if (query.date) {
      const b = dayBounds(query.date);
      f.date = { $gte: b.start, $lt: b.end };
    }
    return this.model
      .find(f)
      .populate('userId', 'firstName lastName email')
      .populate('serviceId')
      .sort({ date: -1, timeSlot: 1 });
  }
  findMine(userId: string) {
    return this.model
      .find({ userId })
      .populate('serviceId')
      .sort({ date: -1, timeSlot: -1 });
  }
  async one(id: string, user: AuthUser) {
    const a = await this.model
      .findById(id)
      .populate('serviceId')
      .populate('userId', 'firstName lastName email');
    if (!a) throw new NotFoundException('Appointment not found');
    this.access(a, user);
    return a;
  }
  async create(dto: CreateAppointmentDto, userId: string) {
    if (dto.date < dateOnly())
      throw new BadRequestException('Date passée interdite');
    const service = await this.services.findOne({
      _id: dto.serviceId,
      isActive: true,
    });
    if (!service) throw new NotFoundException('Service not found');
    await this.availability.assert(dto.serviceId, dto.date, dto.timeSlot);
    const duplicate = await this.model.exists({
      userId,
      serviceId: dto.serviceId,
      date: utcDate(dto.date),
      timeSlot: dto.timeSlot,
      status: { $nin: [AppointmentStatus.CANCELLED, AppointmentStatus.ABSENT] },
    });
    if (duplicate) throw new BadRequestException('Rendez-vous déjà réservé');
    const b = dayBounds(dto.date);
    const prefix =
      service.name
        .replace(/[^A-Za-z]/g, '')
        .slice(0, 3)
        .toUpperCase() || 'Q';
    const count = await this.model.countDocuments({
      date: { $gte: b.start, $lt: b.end },
      ticketNumber: new RegExp(`^${prefix}-`),
    });
    return this.model.create({
      ...dto,
      userId,
      date: utcDate(dto.date),
      qrToken: crypto.randomUUID(),
      ticketNumber: `${prefix}-${String(count + 1).padStart(3, '0')}`,
      status: AppointmentStatus.CONFIRMED,
    });
  }
  async update(id: string, dto: UpdateAppointmentDto, user: AuthUser) {
    const a = await this.model.findById(id);
    if (!a) throw new NotFoundException('Appointment not found');
    this.access(a, user);
    if (!['PENDING', 'CONFIRMED'].includes(a.status))
      throw new BadRequestException('Rendez-vous non modifiable');
    const sid = dto.serviceId || a.serviceId.toString(),
      date = dto.date || a.date.toISOString().slice(0, 10),
      time = dto.timeSlot || a.timeSlot;
    await this.availability.assert(sid, date, time);
    a.serviceId = new Types.ObjectId(sid);
    a.date = utcDate(date);
    a.timeSlot = time;
    if (dto.notes !== undefined) a.notes = dto.notes;
    return a.save();
  }
  async cancel(id: string, dto: CancelAppointmentDto, user: AuthUser) {
    const a = await this.model.findById(id);
    if (!a) throw new NotFoundException('Appointment not found');
    this.access(a, user);
    if (['FINISHED', 'CANCELLED'].includes(a.status))
      throw new BadRequestException('Annulation impossible');
    a.status = AppointmentStatus.CANCELLED;
    a.cancellationReason = dto.reason;
    return a.save();
  }
  async stats() {
    const b = dayBounds(dateOnly());
    const [totalServices, total, statuses] = await Promise.all([
      this.services.countDocuments({ isActive: true }),
      this.model.countDocuments({ date: { $gte: b.start, $lt: b.end } }),
      this.model.aggregate([
        { $match: { date: { $gte: b.start, $lt: b.end } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);
    const s = Object.fromEntries(statuses.map((x: any) => [x._id, x.count]));
    return {
      totalServices,
      todayAppointments: total,
      checkedIn: s.CHECKED_IN || 0,
      finished: s.FINISHED || 0,
      cancelled: s.CANCELLED || 0,
      waiting: s.CHECKED_IN || 0,
      absent: s.ABSENT || 0,
    };
  }
  private access(a: AppointmentDocument, u: AuthUser) {
    if (
      !['ADMIN', 'SUPERVISOR', 'AGENT'].includes(u.role) &&
      a.userId.toString() !== u.userId
    )
      throw new ForbiddenException('Forbidden');
  }
}
