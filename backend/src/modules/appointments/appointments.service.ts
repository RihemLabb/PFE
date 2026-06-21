import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { CreateAppointmentDto } from './dto/appointment.dto';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
  ) {}

  async findAll() {
    return this.appointmentModel.find().populate('userId serviceId').sort({ date: -1 });
  }

  async getAvailability(serviceId: string, date: string) {
    const service = await this.serviceModel.findById(serviceId);
    if (!service) throw new NotFoundException('Service not found');

    const slots = this.generateTimeSlots(8, 16, service.slotDuration);
    
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const existingAppointments = await this.appointmentModel.find({
      serviceId: new Types.ObjectId(serviceId),
      date: { $gte: startDate, $lt: endDate },
      status: { $ne: AppointmentStatus.CANCELLED }
    });

    return slots.map(slot => {
      const bookedCount = existingAppointments.filter(app => app.timeSlot === slot).length;
      return {
        timeSlot: slot,
        isAvailable: bookedCount < service.maxCapacityPerSlot,
        remainingCapacity: Math.max(0, service.maxCapacityPerSlot - bookedCount),
      };
    });
  }

  async createAppointment(userId: string, createDto: CreateAppointmentDto) {
    const { serviceId, date, timeSlot } = createDto;
    const service = await this.serviceModel.findById(serviceId);
    if (!service) throw new NotFoundException('Service not found');

    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const bookedCount = await this.appointmentModel.countDocuments({
      serviceId: new Types.ObjectId(serviceId),
      date: { $gte: startDate, $lt: endDate },
      timeSlot: timeSlot,
      status: { $ne: AppointmentStatus.CANCELLED }
    });

    if (bookedCount >= service.maxCapacityPerSlot) {
      throw new ConflictException('This time slot is fully booked');
    }

    const ticketNumber = await this.generateDailyTicketNumber(serviceId, date, service.name);

    const newAppointment = new this.appointmentModel({
      userId: new Types.ObjectId(userId),
      serviceId: new Types.ObjectId(serviceId),
      date: startDate,
      timeSlot,
      qrToken: uuidv4(),
      ticketNumber,
    });

    return newAppointment.save();
  }

  async findUserAppointments(userId: string) {
    return this.appointmentModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('serviceId')
      .sort({ date: -1, timeSlot: -1 });
  }

  async cancelAppointment(userId: string, appointmentId: string) {
    const appointment = await this.appointmentModel.findOne({
      _id: appointmentId,
      userId: new Types.ObjectId(userId),
    });

    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.status !== AppointmentStatus.CONFIRMED && appointment.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException('Cannot cancel an appointment that is already checked in or finished');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    return appointment.save();
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalServices = await this.serviceModel.countDocuments();
    const todayAppointments = await this.appointmentModel.countDocuments({
      date: { $gte: today, $lt: tomorrow },
    });
    const checkedIn = await this.appointmentModel.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: AppointmentStatus.CHECKED_IN,
    });
    const finished = await this.appointmentModel.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: AppointmentStatus.FINISHED,
    });
    const cancelled = await this.appointmentModel.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: AppointmentStatus.CANCELLED,
    });

    return {
      totalServices,
      todayAppointments,
      checkedIn,
      finished,
      cancelled,
      waiting: todayAppointments - checkedIn - finished - cancelled,
    };
  }

  private generateTimeSlots(startHour: number, endHour: number, durationMinutes: number): string[] {
    const slots: string[] = [];
    let currentMinutes = startHour * 60;
    const endMinutes = endHour * 60;

    while (currentMinutes < endMinutes) {
      const hours = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
      const mins = (currentMinutes % 60).toString().padStart(2, '0');
      slots.push(`${hours}:${mins}`);
      currentMinutes += durationMinutes;
    }
    return slots;
  }

  private async generateDailyTicketNumber(serviceId: string, date: string, serviceName: string): Promise<string> {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const lastAppointment = await this.appointmentModel
      .findOne({
        serviceId: new Types.ObjectId(serviceId),
        date: { $gte: startDate, $lt: endDate },
      })
      .sort({ ticketNumber: -1 });

    let nextNumber = 1;
    if (lastAppointment) {
      const parts = lastAppointment.ticketNumber.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }

    const prefix = serviceName.substring(0, 4).toUpperCase().replace(/\s/g, '');
    return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
  }
}