import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Appointment,
  AppointmentDocument,
} from '../appointments/schemas/appointment.schema';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private model: Model<NotificationDocument>,
    @InjectModel(Appointment.name)
    private appointments: Model<AppointmentDocument>,
  ) {}
  private appointmentTime(appointment: AppointmentDocument) {
    const at = new Date(appointment.date);
    const [h, m] = appointment.timeSlot.split(':').map(Number);
    at.setUTCHours(h, m, 0, 0);
    return at;
  }
  async sync(userId: string) {
    const now = new Date();
    const horizon = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const upcoming = await this.appointments
      .find({
        userId,
        status: AppointmentStatus.CONFIRMED,
        date: {
          $gte: new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
          ),
          $lte: horizon,
        },
      })
      .populate('serviceId');
    for (const appointment of upcoming) {
      const at = this.appointmentTime(appointment);
      if (at > now && at <= horizon) {
        const service = (appointment.serviceId as any)?.name || 'your service';
        await this.model.updateOne(
          { userId, key: `reminder:${appointment._id.toString()}` },
          {
            $setOnInsert: {
              userId,
              appointmentId: appointment._id,
              key: `reminder:${appointment._id.toString()}`,
              title: 'Appointment reminder',
              message: `${service} on ${at.toLocaleDateString()} at ${appointment.timeSlot}. Bring your required documents.`,
              scheduledFor: at,
            },
          },
          { upsert: true },
        );
      }
    }
    return this.model.find({ userId }).sort({ read: 1, createdAt: -1 });
  }
  async read(id: string, userId: string) {
    const item = await this.model.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true },
    );
    if (!item) throw new NotFoundException('Notification not found');
    return item;
  }
  async readAll(userId: string) {
    await this.model.updateMany({ userId, read: false }, { read: true });
    return { success: true };
  }
}
