import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateStaffDto } from './dto/staff.dto';
import { UpdateProfileDto } from './dto/profile.dto';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  private toProfile(user: UserDocument) {
    return {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
    };
  }

  async getMe(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return this.toProfile(user);
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      const duplicate = await this.userModel.exists({
        _id: { $ne: userId },
        email,
      });
      if (duplicate) throw new ConflictException('Email already registered');
      user.email = email;
    }
    if (dto.firstName !== undefined) user.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) user.lastName = dto.lastName.trim();
    if (dto.phone !== undefined) user.phone = dto.phone.trim() || undefined;

    await user.save();
    return this.toProfile(user);
  }

  async findStaff() {
    return this.userModel
      .find({ role: { $in: [UserRole.AGENT, UserRole.SUPERVISOR] } })
      .select('firstName lastName email phone role isActive createdAt')
      .sort({ role: 1, lastName: 1, firstName: 1 });
  }

  async findAgents() {
    return this.userModel
      .find({ role: UserRole.AGENT })
      .select('firstName lastName email phone role isActive')
      .sort({ lastName: 1, firstName: 1 });
  }

  async createStaff(dto: CreateStaffDto) {
    if (![UserRole.AGENT, UserRole.SUPERVISOR].includes(dto.role)) {
      throw new BadRequestException(
        'Staff accounts can only be created as AGENT or SUPERVISOR',
      );
    }

    const email = dto.email.trim().toLowerCase();
    const exists = await this.userModel.exists({ email });
    if (exists) throw new ConflictException('Email already registered');

    const password = await bcrypt.hash(dto.password, 10);
    const staff = await this.userModel.create({
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email,
      phone: dto.phone?.trim() || undefined,
      password,
      role: dto.role,
      isActive: true,
    });

    return this.userModel
      .findById(staff._id)
      .select('firstName lastName email phone role isActive createdAt');
  }

  async setActive(id: string, isActive: boolean) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Admin status cannot be changed here');
    }

    user.isActive = isActive;
    await user.save();

    return this.userModel
      .findById(user._id)
      .select('firstName lastName email phone role isActive createdAt');
  }
}
