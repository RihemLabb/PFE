import { UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthService } from './auth.service';
import { UserRole } from '../../common/enums/user-role.enum';

describe('AuthService refresh tokens', () => {
  let userModel: any;
  let refreshSessionModel: any;
  let jwtService: any;
  let service: AuthService;

  beforeEach(() => {
    userModel = {
      findById: jest.fn(),
    };
    refreshSessionModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('new-access-token'),
    };

    service = new AuthService(
      userModel,
      refreshSessionModel,
      jwtService,
      {
        get: jest.fn((_key: string, fallback: string) => fallback),
      } as any,
    );
  });

  it('rotates a valid refresh token and issues a new access token', async () => {
    const session = {
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(),
      expiresAt: new Date(Date.now() + 60_000),
    };
    const user = {
      _id: session.userId,
      email: 'user@pfe.com',
      role: UserRole.USER,
      isActive: true,
    };

    refreshSessionModel.findOne.mockResolvedValue(session);
    userModel.findById.mockResolvedValue(user);
    refreshSessionModel.findOneAndUpdate.mockResolvedValue({ _id: session._id });

    const result = await service.refresh('a'.repeat(64));

    expect(result.access_token).toBe('new-access-token');
    expect(result.refresh_token).toHaveLength(64);
    expect(result.refresh_token).not.toBe('a'.repeat(64));
    expect(refreshSessionModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: user._id,
      email: user.email,
      role: user.role,
    });
  });

  it('rejects a refresh token that is missing or already rotated', async () => {
    refreshSessionModel.findOne.mockResolvedValue(null);

    await expect(service.refresh('b'.repeat(64))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('revokes a refresh token on logout', async () => {
    refreshSessionModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

    await expect(service.logout('c'.repeat(64))).resolves.toEqual({
      success: true,
    });
    expect(refreshSessionModel.deleteOne).toHaveBeenCalledTimes(1);
  });
});
