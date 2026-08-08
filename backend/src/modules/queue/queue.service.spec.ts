import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { QueueService } from './queue.service';
import { QueueStatus } from '../../common/enums/queue-status.enum';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';

describe('QueueService check-in', () => {
  let queueEntryModel: any;
  let appointmentModel: any;
  let service: QueueService;

  beforeEach(() => {
    queueEntryModel = {
      findOne: jest.fn(),
      countDocuments: jest.fn(),
    };
    appointmentModel = {
      findOne: jest.fn(),
    };

    service = new QueueService(
      queueEntryModel,
      appointmentModel,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  const todayAppointment = () => ({
    _id: new Types.ObjectId(),
    serviceId: new Types.ObjectId(),
    date: new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`),
    status: AppointmentStatus.CHECKED_IN,
    save: jest.fn(),
  });

  it('returns the same waiting entry when the QR is scanned twice', async () => {
    const appointment = todayAppointment();
    const existingEntry = {
      _id: new Types.ObjectId(),
      appointmentId: appointment._id,
      status: QueueStatus.WAITING,
      position: 1,
    };

    appointmentModel.findOne.mockResolvedValue(appointment);
    queueEntryModel.findOne.mockResolvedValue(existingEntry);

    await expect(service.checkIn('same-qr-token')).resolves.toBe(existingEntry);
    expect(queueEntryModel.countDocuments).not.toHaveBeenCalled();
  });

  it('does not reset a finished ticket back to waiting', async () => {
    const appointment = todayAppointment();
    appointmentModel.findOne.mockResolvedValue(appointment);
    queueEntryModel.findOne.mockResolvedValue({
      _id: new Types.ObjectId(),
      appointmentId: appointment._id,
      status: QueueStatus.FINISHED,
      position: 1,
    });

    await expect(service.checkIn('finished-ticket-token')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
