import {
  BadRequestException,
  Controller,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Service,
  ServiceDocument,
  ServiceSchema,
} from '../services/schemas/service.schema';
import {
  Appointment,
  AppointmentDocument,
  AppointmentSchema,
} from '../appointments/schemas/appointment.schema';
import {
  SchedulesModule,
  SchedulesService,
} from '../schedules/schedules.module';
import { HolidaysModule, HolidaysService } from '../holidays/holidays.module';
import { dayBounds, utcDate } from '../../common/utils/date';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectModel(Service.name) private services: Model<ServiceDocument>,
    @InjectModel(Appointment.name)
    private appointments: Model<AppointmentDocument>,
    private schedules: SchedulesService,
    private holidays: HolidaysService,
  ) {}
  async get(serviceId: string, date: string) {
    if (!Types.ObjectId.isValid(serviceId))
      throw new BadRequestException('Invalid service ID');
    const service = await this.services.findOne({
      _id: serviceId,
      isActive: true,
    });
    if (!service) throw new NotFoundException('Service not found');
    const holiday = await this.holidays.find(date);
    if (holiday)
      return { date, service, closed: true, reason: holiday.reason, slots: [] };
    const day = utcDate(date).getUTCDay();
    const schedule = (await this.schedules.list()).find(
      (s: any) =>
        s.serviceId?._id?.toString() === serviceId &&
        s.dayOfWeek === day &&
        s.isActive,
    );
    if (!schedule && (day === 0 || day === 6))
      return { date, service, closed: true, reason: 'Jour fermé', slots: [] };
    const start = schedule?.startTime || '08:00';
    const end = schedule?.endTime || '16:00';
    const bounds = dayBounds(date);
    const booked = await this.appointments.aggregate([
      {
        $match: {
          serviceId: new Types.ObjectId(serviceId),
          date: { $gte: bounds.start, $lt: bounds.end },
          status: { $nin: ['CANCELLED', 'ABSENT'] },
        },
      },
      { $group: { _id: '$timeSlot', count: { $sum: 1 } } },
    ]);
    const counts = new Map(booked.map((x: any) => [x._id, x.count]));
    const toMin = (v: string) => {
      const [h, m] = v.split(':').map(Number);
      return h * 60 + m;
    };
    const fmt = (n: number) =>
      `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
    const slots: Array<{
      time: string;
      capacity: number;
      booked: number;
      remaining: number;
      available: boolean;
    }> = [];
    for (
      let n = toMin(start);
      n + service.slotDuration <= toMin(end);
      n += service.slotDuration
    ) {
      const time = fmt(n);
      const count = Number(counts.get(time) || 0);
      slots.push({
        time,
        capacity: service.maxCapacityPerSlot,
        booked: count,
        remaining: Math.max(service.maxCapacityPerSlot - count, 0),
        available: count < service.maxCapacityPerSlot,
      });
    }
    return { date, service, closed: false, reason: null, slots };
  }
  async assert(serviceId: string, date: string, time: string) {
    const a = await this.get(serviceId, date);
    const slot = a.slots.find((x: any) => x.time === time);
    if (a.closed || !slot?.available)
      throw new BadRequestException(a.reason || 'Créneau indisponible');
  }
}
@Controller('availability')
export class AvailabilityController {
  constructor(private service: AvailabilityService) {}
  @Get() get(
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
  ) {
    return this.service.get(serviceId, date);
  }
}
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Service.name, schema: ServiceSchema },
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
    SchedulesModule,
    HolidaysModule,
  ],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
