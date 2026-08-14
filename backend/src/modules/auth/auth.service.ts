import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { UserRole } from '../../common/enums/user-role.enum';
import { User, UserDocument } from '../users/schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  RefreshSession,
  RefreshSessionDocument,
} from './schemas/refresh-session.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(RefreshSession.name)
    private refreshSessionModel: Model<RefreshSessionDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private serializeUser(user: UserDocument) {
    return {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
    };
  }

  private signAccessToken(user: UserDocument) {
    return this.jwtService.sign({
      sub: user._id,
      email: user.email,
      role: user.role,
    });
  }

  private hashRefreshToken(refreshToken: string) {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private generateRefreshToken() {
    return randomBytes(48).toString('base64url');
  }

  private getRefreshTokenTtlMs() {
    const configuredDays = Number(
      this.configService.get<string>('REFRESH_TOKEN_TTL_DAYS', '7'),
    );
    const days =
      Number.isFinite(configuredDays) && configuredDays > 0
        ? configuredDays
        : 7;
    return days * 24 * 60 * 60 * 1000;
  }

  private async createRefreshSession(userId: Types.ObjectId) {
    const refreshToken = this.generateRefreshToken();
    const expiresAt = new Date(Date.now() + this.getRefreshTokenTtlMs());

    await this.refreshSessionModel.create({
      userId,
      tokenHash: this.hashRefreshToken(refreshToken),
      expiresAt,
    });

    return refreshToken;
  }

  private async buildAuthResponse(user: UserDocument) {
    const refreshToken = await this.createRefreshSession(
      user._id as Types.ObjectId,
    );

    return {
      access_token: this.signAccessToken(user),
      refresh_token: refreshToken,
      user: this.serializeUser(user),
    };
  }

  async register(registerDto: RegisterDto) {
    const email = registerDto.email.trim().toLowerCase();
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const role =
      registerDto.role === UserRole.USER ? registerDto.role : UserRole.USER;
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const newUser = new this.userModel({
      firstName: registerDto.firstName.trim(),
      lastName: registerDto.lastName.trim(),
      email,
      phone: registerDto.phone?.trim() || undefined,
      password: hashedPassword,
      role,
      isActive: true,
    });

    const savedUser = await newUser.save();
    return this.buildAuthResponse(savedUser);
  }

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();
    const user = await this.userModel.findOne({ email }).select('+password');

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been disabled');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const session = await this.refreshSessionModel.findOne({ tokenHash });

    if (!session) {
      throw new UnauthorizedException(
        'Refresh token is invalid or has been revoked',
      );
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      await this.refreshSessionModel.deleteOne({ _id: session._id });
      throw new UnauthorizedException('Refresh token has expired');
    }

    const user = await this.userModel.findById(session.userId);
    if (!user || !user.isActive) {
      await this.refreshSessionModel.deleteMany({ userId: session.userId });
      throw new UnauthorizedException('Account is unavailable');
    }

    const nextRefreshToken = this.generateRefreshToken();
    const nextTokenHash = this.hashRefreshToken(nextRefreshToken);
    const nextExpiresAt = new Date(Date.now() + this.getRefreshTokenTtlMs());

    const rotated = await this.refreshSessionModel.findOneAndUpdate(
      { _id: session._id, tokenHash },
      {
        $set: {
          tokenHash: nextTokenHash,
          expiresAt: nextExpiresAt,
        },
      },
      { new: true },
    );

    if (!rotated) {
      throw new UnauthorizedException('Refresh token has already been used');
    }

    return {
      access_token: this.signAccessToken(user),
      refresh_token: nextRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    await this.refreshSessionModel.deleteOne({
      tokenHash: this.hashRefreshToken(refreshToken),
    });

    return { success: true };
  }
}
