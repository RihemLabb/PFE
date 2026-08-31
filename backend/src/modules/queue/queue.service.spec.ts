import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { QueueService } from './queue.service';
import { QueueStatus } from '../../common/enums/queue-status.enum';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  getBusinessDayRange,
  getDateKeyInTimeZone,
} from '../../common/utils/business-date';

describe('QueueService', () => {
  let queueEntryModel: any;
  let appointmentModel: any;
  let serviceModel: any;
  let service: QueueService;

  beforeEach(() => {
    queueEntryModel = Object.assign(jest.fn(), {
      findOne: jest.fn(),
      findById: jest.fn(),
      countDocuments: jest.fn(),
    });
    appointmentModel = {
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };
    serviceModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    service = new QueueService(
      queueEntryModel,
      appointmentModel,
      {} as any,
      serviceModel,
      {
        assertAgentService: jest.fn(),
        assertAgentCounter: jest.fn(),
      } as any,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const todayAppointment = () => ({
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    serviceId: new Types.ObjectId(),
    date: new Date(`${getDateKeyInTimeZone()}T00:00:00.000Z`),
    status: AppointmentStatus.CHECKED_IN,
    save: jest.fn(),
  });

  const assignedAgent = () => ({
    userId: new Types.ObjectId().toString(),
    role: UserRole.AGENT,
  });

  describe('check-in', () => {
    it('finds a same-day appointment by normalized ticket number', async () => {
      const appointment = todayAppointment();
      const existingEntry = {
        _id: new Types.ObjectId(),
        appointmentId: appointment._id,
        status: QueueStatus.WAITING,
        position: 1,
      };
      appointmentModel.findOne.mockResolvedValue(appointment);
      queueEntryModel.findOne.mockResolvedValue(existingEntry);

      await expect(
        service.checkIn({ ticketNumber: ' idc-001 ' }, assignedAgent()),
      ).resolves.toBe(existingEntry);

      expect(appointmentModel.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ ticketNumber: 'IDC-001' }),
      );
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

      await expect(
        service.checkIn({ qrToken: 'same-qr-token' }, assignedAgent()),
      ).resolves.toBe(existingEntry);
      expect(queueEntryModel.countDocuments).not.toHaveBeenCalled();
    });

    it('recovers cleanly when concurrent scans race to create the queue entry', async () => {
      const appointment = todayAppointment();
      appointment.status = AppointmentStatus.CONFIRMED;

      const winnerEntry = {
        _id: new Types.ObjectId(),
        appointmentId: appointment._id,
        status: QueueStatus.WAITING,
        position: 1,
      };
      const entrySave = jest
        .fn()
        .mockRejectedValue(
          Object.assign(new Error('duplicate queue entry'), { code: 11000 }),
        );

      appointmentModel.findOne.mockResolvedValue(appointment);
      queueEntryModel.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(winnerEntry);
      queueEntryModel.countDocuments.mockResolvedValue(0);
      queueEntryModel.mockImplementation(() => ({ save: entrySave }));
      serviceModel.findByIdAndUpdate.mockResolvedValue({
        queueSequences: new Map([[getDateKeyInTimeZone(), 1]]),
      });

      await expect(
        service.checkIn({ qrToken: 'concurrent-ticket' }, assignedAgent()),
      ).resolves.toBe(winnerEntry);

      expect(entrySave).toHaveBeenCalledTimes(1);
      expect(appointment.status).toBe(AppointmentStatus.CHECKED_IN);
      expect(appointment.save).toHaveBeenCalledTimes(1);
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

      await expect(
        service.checkIn({ qrToken: 'finished-ticket-token' }, assignedAgent()),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects requests containing both a QR token and ticket number', async () => {
      await expect(
        service.checkIn(
          { qrToken: 'token', ticketNumber: 'IDC-001' },
          assignedAgent(),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('treats the Tunis calendar date as today near the UTC day boundary', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-08-13T23:30:00.000Z'));
      const appointment = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(),
        serviceId: new Types.ObjectId(),
        date: new Date('2026-08-14T00:00:00.000Z'),
        status: AppointmentStatus.CHECKED_IN,
        save: jest.fn(),
      };
      const existingEntry = {
        _id: new Types.ObjectId(),
        appointmentId: appointment._id,
        status: QueueStatus.WAITING,
        position: 1,
      };

      appointmentModel.findOne.mockResolvedValue(appointment);
      queueEntryModel.findOne.mockResolvedValue(existingEntry);

      await expect(
        service.checkIn({ qrToken: 'tunis-midnight-ticket' }, assignedAgent()),
      ).resolves.toBe(existingEntry);
    });
  });

  describe('ticket lookup', () => {
    it('returns a safe same-day preview for manual agent confirmation', async () => {
      const serviceId = new Types.ObjectId();
      const appointment = {
        _id: new Types.ObjectId(),
        userId: { firstName: 'Client', lastName: 'Test' },
        serviceId: { _id: serviceId, name: 'ID Card Issuance' },
        ticketNumber: 'IDC-001',
        date: new Date(`${getDateKeyInTimeZone()}T00:00:00.000Z`),
        timeSlot: '10:10',
        status: AppointmentStatus.CONFIRMED,
      };
      const query: any = {
        populate: jest.fn(),
      };
      query.populate
        .mockReturnValueOnce(query)
        .mockResolvedValueOnce(appointment);
      appointmentModel.findOne.mockReturnValue(query);

      await expect(
        service.lookupTicket(' idc-001 ', assignedAgent()),
      ).resolves.toEqual(
        expect.objectContaining({
          ticketNumber: 'IDC-001',
          userName: 'Client Test',
          serviceName: 'ID Card Issuance',
          timeSlot: '10:10',
        }),
      );
    });
  });

  describe('business day boundaries', () => {
    it('maps a Tunis business day to the matching UTC range', () => {
      const range = getBusinessDayRange(new Date('2026-08-13T23:30:00.000Z'));

      expect(range.dateKey).toBe('2026-08-14');
      expect(range.start.toISOString()).toBe('2026-08-13T23:00:00.000Z');
      expect(range.end.toISOString()).toBe('2026-08-14T23:00:00.000Z');
    });
  });

  describe('markAbsent', () => {
    const adminActor = {
      userId: new Types.ObjectId().toString(),
      role: UserRole.ADMIN,
    };

    const calledEntry = (calledMinutesAgo: number) => ({
      _id: new Types.ObjectId(),
      appointmentId: new Types.ObjectId(),
      serviceId: new Types.ObjectId(),
      counterId: new Types.ObjectId(),
      status: QueueStatus.CALLED,
      calledTime: new Date(Date.now() - calledMinutesAgo * 60 * 1000),
      save: jest.fn().mockResolvedValue(undefined),
    });

    it('rejects marking a called ticket absent before the configured delay', async () => {
      const entry = calledEntry(5);
      queueEntryModel.findById.mockResolvedValue(entry);
      serviceModel.findById.mockResolvedValue({ absenceDelayMinutes: 15 });

      await expect(
        service.markAbsent(entry._id.toString(), adminActor),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(entry.save).not.toHaveBeenCalled();
      expect(appointmentModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('marks the ticket and appointment absent after the configured delay', async () => {
      const entry = calledEntry(16);
      queueEntryModel.findById.mockResolvedValue(entry);
      serviceModel.findById.mockResolvedValue({ absenceDelayMinutes: 15 });

      await expect(
        service.markAbsent(entry._id.toString(), adminActor),
      ).resolves.toBe(entry);

      expect(entry.status).toBe(QueueStatus.ABSENT);
      expect(entry.save).toHaveBeenCalledTimes(1);
      expect(appointmentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        entry.appointmentId,
        { status: AppointmentStatus.ABSENT },
      );
    });
  });
});
