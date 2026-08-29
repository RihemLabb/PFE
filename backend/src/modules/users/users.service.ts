import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../common/enums/user-role.enum';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private model: Model<UserDocument>) {}
  list() {
    return this.model.find().sort({ createdAt: -1 });
  }
  me(id: string) {
    return this.model.findById(id);
  }
  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: UserRole;
  }) {
    if (await this.model.exists({ email: data.email.toLowerCase() }))
      throw new BadRequestException('Email déjà utilisé');
    return this.model.create({
      ...data,
      email: data.email.toLowerCase(),
      password: await bcrypt.hash(data.password, 10),
      role: data.role || UserRole.AGENT,
    });
  }
  async toggle(id: string) {
    const user = await this.model.findById(id);
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    user.isActive = !user.isActive;
    return user.save();
  }
}
