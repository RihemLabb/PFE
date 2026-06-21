import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueueEntry, QueueEntryDocument } from './schemas/queue-entry.schema';
import { Appointment, AppointmentDocument } from '../appointments/schemas/appointment.schema';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { QueueStatus } from '../../common/enums/queue-status.enum';
import { CheckInDto } from './dto/queue.dto';

@Injectable()
export class QueueService {
  constructor(
    @InjectModel(QueueEntry.name) private queueModel: Model<QueueEntryDocument>,
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
  ) {}

  async checkIn(checkInDto: CheckInDto) {
    const { qrToken } = checkInDto;

    const appointment = await this.appointmentModel.findOne({ qrToken }).populate('serviceId');
    if (!appointment) throw new NotFoundException('Invalid QR Token');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const apptDate = new Date(appointment.date);
    apptDate.setHours(0, 0, 0, 0);

    if (apptDate.getTime() !== today.getTime()) {
      throw new BadRequestException('QR code is only valid on the day of the appointment');
    }

    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new ConflictException('This appointment has already been checked in or cancelled');
    }

    const lastEntry = await this.queueModel
      .findOne({ serviceId: appointment.serviceId, status: QueueStatus.WAITING })
      .sort({ position: -1 });
    
    const nextPosition = lastEntry ? lastEntry.position + 1 : 1;

    const queueEntry = new this.queueModel({
      appointmentId: appointment._id,
      serviceId: appointment.serviceId,
      position: nextPosition,
      status: QueueStatus.WAITING,
      checkInTime: new Date(),
    });

    await queueEntry.save();

    appointment.status = AppointmentStatus.CHECKED_IN;
    await appointment.save();

    return {
      message: 'Check-in successful',
      ticketNumber: appointment.ticketNumber,
      position: nextPosition,
    };
  }

  async callNext(serviceId: string, counterId: string) {

    const nextTicket = await this.queueModel.findOneAndUpdate(
      { serviceId: new Types.ObjectId(serviceId), status: QueueStatus.WAITING },
      { 
        status: QueueStatus.CALLED, 
        counterId: new Types.ObjectId(counterId), 
        calledTime: new Date() 
      },
      { sort: { position: 1 }, new: true } // Sort by position ascending (FIFO)
    ).populate('appointmentId');

    if (!nextTicket) {
      throw new NotFoundException('No one is waiting in the queue for this service');
    }

    return nextTicket;
  }

  async startService(queueEntryId: string) {
    const entry = await this.queueModel.findById(queueEntryId);
    if (!entry) throw new NotFoundException('Queue entry not found');
    
    entry.status = QueueStatus.IN_PROGRESS;
    return entry.save();
  }

  async finishService(queueEntryId: string) {
    const entry = await this.queueModel.findById(queueEntryId);
    if (!entry) throw new NotFoundException('Queue entry not found');

    entry.status = QueueStatus.FINISHED;
    entry.finishTime = new Date();
    
    await this.appointmentModel.findByIdAndUpdate(entry.appointmentId, {
      status: AppointmentStatus.FINISHED
    });

    return entry.save();
  }

  async markAbsent(queueEntryId: string) {
    const entry = await this.queueModel.findById(queueEntryId);
    if (!entry) throw new NotFoundException('Queue entry not found');

    entry.status = QueueStatus.ABSENT;
    
    await this.appointmentModel.findByIdAndUpdate(entry.appointmentId, {
      status: AppointmentStatus.ABSENT
    });

    return entry.save();
  }

  async getTodayQueue(serviceId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await this.appointmentModel.find({
      serviceId: new Types.ObjectId(serviceId),
      date: { $gte: today, $lt: tomorrow }
    });

    const appointmentIds = appointments.map(app => app._id);

    return this.queueModel.find({
      appointmentId: { $in: appointmentIds }
    }).populate('appointmentId').sort({ position: 1 });
  }
}