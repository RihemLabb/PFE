import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { FeedbackService } from './feedback.service';

const userId = new Types.ObjectId();
const appointmentId = new Types.ObjectId();
const serviceId = new Types.ObjectId();

function queryResult(value: unknown) {
  return {
    lean: () => ({
      exec: async () => value,
    }),
  };
}

describe('FeedbackService', () => {
  let feedbackModel: any;
  let appointmentModel: any;
  let service: FeedbackService;

  beforeEach(() => {
    feedbackModel = {
      exists: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
    };
    appointmentModel = {
      findById: jest.fn(),
    };
    service = new FeedbackService(feedbackModel, appointmentModel);
  });

  it('rejects feedback for an appointment owned by another user', async () => {
    appointmentModel.findById.mockReturnValue(
      queryResult({
        _id: appointmentId,
        userId: new Types.ObjectId(),
        serviceId,
        status: AppointmentStatus.FINISHED,
      }),
    );

    await expect(
      service.create(userId.toString(), {
        appointmentId: appointmentId.toString(),
        rating: 5,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects feedback before the appointment is finished', async () => {
    appointmentModel.findById.mockReturnValue(
      queryResult({
        _id: appointmentId,
        userId,
        serviceId,
        status: AppointmentStatus.CONFIRMED,
      }),
    );

    await expect(
      service.create(userId.toString(), {
        appointmentId: appointmentId.toString(),
        rating: 4,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects duplicate feedback for the same appointment', async () => {
    appointmentModel.findById.mockReturnValue(
      queryResult({
        _id: appointmentId,
        userId,
        serviceId,
        status: AppointmentStatus.FINISHED,
      }),
    );
    feedbackModel.exists.mockResolvedValue({ _id: new Types.ObjectId() });

    await expect(
      service.create(userId.toString(), {
        appointmentId: appointmentId.toString(),
        rating: 4,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates feedback for the owner of a finished appointment', async () => {
    appointmentModel.findById.mockReturnValue(
      queryResult({
        _id: appointmentId,
        userId,
        serviceId,
        status: AppointmentStatus.FINISHED,
      }),
    );
    feedbackModel.exists.mockResolvedValue(null);
    feedbackModel.create.mockResolvedValue({
      appointmentId,
      userId,
      serviceId,
      rating: 5,
      comment: 'Great service',
    });

    const result = await service.create(userId.toString(), {
      appointmentId: appointmentId.toString(),
      rating: 5,
      comment: '  Great service  ',
    });

    expect(feedbackModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentId,
        serviceId,
        rating: 5,
        comment: 'Great service',
      }),
    );
    expect(result.rating).toBe(5);
  });
});
