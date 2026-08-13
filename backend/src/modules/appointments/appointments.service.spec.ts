import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AppointmentsService } from './appointments.service';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';

describe('AppointmentsService', () => {
  let appointmentModel: any;
  let serviceModel: any;
  let queueEntryModel: any;
  let holidayModel: any;
  let service: AppointmentsService;

  beforeEach(() => {
    appointmentModel = {
      findById: jest.fn(),
      find: jest.fn(),
      exists: jest.fn(),
      countDocuments: jest.fn(),
    };
    serviceModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      countDocuments: jest.fn(),
    };
    queueEntryModel = {
      find: jest.fn(),
      countDocuments: jest.fn(),
    };
    holidayModel = {
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    };

    service = new AppointmentsService(
      appointmentModel,
      serviceModel,
      queueEntryModel,
      holidayModel,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('prevents a user from cancelling another user appointment', async () => {
    const ownerId = new Types.ObjectId();
    const requesterId = new Types.ObjectId();
    appointmentModel.findById.mockResolvedValue({
      userId: ownerId,
      status: AppointmentStatus.CONFIRMED,
      save: jest.fn(),
    });

    await expect(
      service.cancel(
        '507f1f77bcf86cd799439011',
        requesterId.toString(),
        UserRole.USER,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows an appointment owner to cancel a confirmed appointment', async () => {
    const ownerId = new Types.ObjectId();
    const appointment = {
      userId: ownerId,
      serviceId: new Types.ObjectId(),
      date: new Date('2026-08-14T00:00:00.000Z'),
      timeSlot: '09:00',
      status: AppointmentStatus.CONFIRMED,
      save: jest.fn().mockImplementation(async function () {
        return this;
      }),
    };
    appointmentModel.findById.mockResolvedValue(appointment);

    const result = await service.cancel(
      '507f1f77bcf86cd799439011',
      ownerId.toString(),
      UserRole.USER,
    );

    expect(result.status).toBe(AppointmentStatus.CANCELLED);
    expect(appointment.save).toHaveBeenCalledTimes(1);
    expect(serviceModel.updateOne).toHaveBeenCalledTimes(1);
  });

  it('rejects cancellation after check-in', async () => {
    const ownerId = new Types.ObjectId();
    appointmentModel.findById.mockResolvedValue({
      userId: ownerId,
      status: AppointmentStatus.CHECKED_IN,
      save: jest.fn(),
    });

    await expect(
      service.cancel(
        '507f1f77bcf86cd799439011',
        ownerId.toString(),
        UserRole.USER,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('generates availability from the configured service schedule', async () => {
    const futureDate = new Date();
    futureDate.setUTCDate(futureDate.getUTCDate() + 7);
    while (futureDate.getUTCDay() === 0 || futureDate.getUTCDay() === 6) {
      futureDate.setUTCDate(futureDate.getUTCDate() + 1);
    }
    const date = futureDate.toISOString().slice(0, 10);

    serviceModel.findById.mockResolvedValue({
      _id: new Types.ObjectId(),
      name: 'Passport Renewal',
      isActive: true,
      avgDuration: 15,
      slotDuration: 30,
      maxCapacityPerSlot: 2,
      openingTime: '09:00',
      closingTime: '10:00',
      workingDays: [1, 2, 3, 4, 5],
      requiredDocs: ['ID Card'],
    });

    appointmentModel.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ timeSlot: '09:00' }]),
      }),
    });

    const result = await service.getAvailability(
      '507f1f77bcf86cd799439011',
      date,
    );

    expect(result.isOpen).toBe(true);
    expect(result.slots).toEqual([
      { time: '09:00', booked: 1, remaining: 1, available: true },
      { time: '09:30', booked: 0, remaining: 2, available: true },
    ]);
  });

  it('treats the previous UTC date as past after Tunis midnight', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-13T23:30:00.000Z'));
    serviceModel.findById.mockResolvedValue({
      _id: new Types.ObjectId(),
      name: 'Passport Renewal',
      isActive: true,
      avgDuration: 15,
      slotDuration: 30,
      maxCapacityPerSlot: 2,
      openingTime: '09:00',
      closingTime: '10:00',
      workingDays: [0, 1, 2, 3, 4, 5, 6],
      requiredDocs: [],
    });

    const result = await service.getAvailability(
      '507f1f77bcf86cd799439011',
      '2026-08-13',
    );

    expect(result.isOpen).toBe(false);
    expect(result.closureReason).toBe('Date is in the past');
    expect(appointmentModel.find).not.toHaveBeenCalled();
  });

  it('rejects a slot reservation when the atomic counter reaches capacity', async () => {
    serviceModel.findOneAndUpdate.mockResolvedValue(null);
    const serviceId = new Types.ObjectId();

    await expect(
      (service as any).reserveSlot(
        { _id: serviceId, maxCapacityPerSlot: 2 },
        new Date('2026-08-14T00:00:00.000Z'),
        '09:00',
        2,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(serviceModel.updateOne).toHaveBeenCalledTimes(1);
    expect(serviceModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
  });

  it('allocates the next daily ticket number from the service sequence', async () => {
    appointmentModel.countDocuments.mockResolvedValue(4);
    serviceModel.findByIdAndUpdate.mockResolvedValue({
      ticketSequences: new Map([['2026-08-14', 5]]),
    });

    const ticketNumber = await (service as any).getNextTicketNumber(
      { _id: new Types.ObjectId(), name: 'Passport Renewal' },
      new Date('2026-08-14T00:00:00.000Z'),
    );

    expect(ticketNumber).toBe('PAS-005');
  });

  it('closes availability on a configured global holiday', async () => {
    const futureDate = new Date();
    futureDate.setUTCDate(futureDate.getUTCDate() + 7);
    const date = futureDate.toISOString().slice(0, 10);
    const serviceId = new Types.ObjectId();

    serviceModel.findById.mockResolvedValue({
      _id: serviceId,
      name: 'Civil Registry',
      isActive: true,
      slotDuration: 30,
      maxCapacityPerSlot: 2,
      openingTime: '09:00',
      closingTime: '10:00',
      workingDays: [0, 1, 2, 3, 4, 5, 6],
      requiredDocs: [],
    });
    holidayModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        {
          name: 'National holiday',
          date: new Date(`${date}T00:00:00.000Z`),
          serviceId: null,
          isClosed: true,
        },
      ]),
    });
    appointmentModel.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });

    const result = await service.getAvailability(serviceId.toString(), date);

    expect(result.isOpen).toBe(false);
    expect(result.closureReason).toBe('National holiday');
    expect(result.slots).toEqual([]);
  });
});
