import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
export class UsersController {
  constructor(private service: UsersService) {}
  @Get() list() {
    return this.service.list();
  }
  @Post() create(@Body() body: any) {
    return this.service.create(body);
  }
  @Patch(':id/toggle') toggle(@Param('id') id: string) {
    return this.service.toggle(id);
  }
}
