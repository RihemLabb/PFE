import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueueEntry, QueueEntryDocument } from './schemas/queue-entry.schema';
import { Appointment, AppointmentDocument } from '../appointments/schemas/appointment.schema';
import { QueueStatus } from '../../common/enums/queue-status.enum';

@Injectable()
export class QueueService {
  constructor(
    @InjectModel(QueueEntry.name) private queueEntryModel: Model<QueueEntryDocument>,
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
  ) {}

  async getTodayQueue(serviceId: string) {
    if (!Types.ObjectId.isValid(serviceId)) {
      throw new BadRequestException('Invalid Service ID format');
    }

    return this.queueEntryModel
      .find({ serviceId: serviceId })
      .populate('appointmentId')
      .sort({ position: 1 });
  }

  async checkIn(qrToken: string) {
    const appointment = await this.appointmentModel.findOne({ qrToken }).populate('userId');
    if (!appointment) {
      throw new NotFoundException('Invalid QR token. Please check your ticket.');
    }

    if (appointment.status === 'CANCELLED') {
      throw new BadRequestException('Check-in failed: This appointment has been cancelled.');
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const apptStr = new Date(appointment.date).toISOString().split('T')[0];

    if (todayStr !== apptStr) {
      throw new BadRequestException(`QR code is only valid on the day of the appointment. Today is ${todayStr}, appointment is ${apptStr}.`);
    }

    let entry = await this.queueEntryModel.findOne({ appointmentId: appointment._id });
    
    if (!entry) {
      const count = await this.queueEntryModel.countDocuments({ 
        serviceId: appointment.serviceId
      });
      
      entry = new this.queueEntryModel({
        appointmentId: appointment._id,
        serviceId: appointment.serviceId,
        date: new Date(),
        position: count + 1,
        status: QueueStatus.WAITING,
      });
    } else {
      entry.status = QueueStatus.WAITING;
    }

    return entry.save();
  }

  async callNext(serviceId: string, counterId: string) {
    if (!Types.ObjectId.isValid(serviceId) || !Types.ObjectId.isValid(counterId)) {
      throw new BadRequestException('Invalid Service or Counter ID format. Please check your configuration.');
    }

    const nextEntry = await this.queueEntryModel.findOne({
      serviceId: serviceId,
      status: QueueStatus.WAITING,
    }).sort({ position: 1 });

    if (!nextEntry) throw new NotFoundException('No one is waiting in the queue');

    nextEntry.status = QueueStatus.CALLED;
    nextEntry.counterId = new Types.ObjectId(counterId); 
    return nextEntry.save();
  }

  async startService(queueEntryId: string) {
    const entry = await this.queueEntryModel.findById(queueEntryId);
    if (!entry) throw new NotFoundException('Queue entry not found');
    if (entry.status !== QueueStatus.CALLED) {
      throw new BadRequestException('Can only start a CALLED ticket');
    }
    entry.status = QueueStatus.IN_PROGRESS;
    return entry.save();
  }

  async finishService(queueEntryId: string) {
    const entry = await this.queueEntryModel.findById(queueEntryId);
    if (!entry) throw new NotFoundException('Queue entry not found');
    if (entry.status !== QueueStatus.IN_PROGRESS) {
      throw new BadRequestException('Can only finish an IN_PROGRESS ticket');
    }
    entry.status = QueueStatus.FINISHED;
    return entry.save();
  }

  async markAbsent(queueEntryId: string) {
    const entry = await this.queueEntryModel.findById(queueEntryId);
    if (!entry) throw new NotFoundException('Queue entry not found');
    if (entry.status !== QueueStatus.CALLED) {
      throw new BadRequestException('Can only mark a CALLED ticket as absent');
    }
    entry.status = QueueStatus.ABSENT;
    return entry.save();
  }
}