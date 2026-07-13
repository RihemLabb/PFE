import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
  ) {}

  async findAll() {
    return this.appointmentModel.find()
      .populate('userId')
      .populate('serviceId')
      .sort({ date: 1, timeSlot: 1 });
  }

  async findMyAppointments(userId: string) {
    console.log('--- DEBUG findMyAppointments ---');
    console.log('Received userId:', userId);
    
    const appointments = await this.appointmentModel.find({ userId: userId })
      .populate('serviceId')
      .sort({ date: -1, timeSlot: 1 });
      
    console.log('Found appointments:', appointments.length);
    console.log('------------------------------');
    
    return appointments;
  }

  async create(createAppointmentDto: any, userId: string) {
    const service = await this.serviceModel.findById(createAppointmentDto.serviceId);
    if (!service) throw new NotFoundException('Service not found');

    const apptDate = new Date(createAppointmentDto.date);
    apptDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(apptDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const currentBookings = await this.appointmentModel.countDocuments({
      serviceId: service._id,
      date: { $gte: apptDate, $lt: nextDay },
      timeSlot: createAppointmentDto.timeSlot,
      status: { $ne: AppointmentStatus.CANCELLED }
    });

    if (currentBookings >= service.maxCapacityPerSlot) {
      throw new BadRequestException(
        `Sorry, the ${createAppointmentDto.timeSlot} slot is fully booked. Maximum capacity (${service.maxCapacityPerSlot}) reached.`
      );
    }

    const appointment = new this.appointmentModel({
      ...createAppointmentDto,
      userId: userId,
      qrToken: crypto.randomUUID(),
      ticketNumber: `${service.name.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      status: AppointmentStatus.CONFIRMED,
    });

    return appointment.save();
  }

  async cancel(id: string) {
    const appointment = await this.appointmentModel.findById(id);
    if (!appointment) throw new NotFoundException('Appointment not found');
    
    appointment.status = AppointmentStatus.CANCELLED;
    return appointment.save();
  }
}