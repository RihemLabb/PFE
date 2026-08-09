import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateStaffDto, UpdateUserStatusDto } from './dto/staff.dto';
import { UpdateProfileDto } from './dto/profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the current user profile' })
  getMe(@CurrentUser() user: { userId: string }) {
    return this.usersService.getMe(user.userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the current user profile' })
  updateMe(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateMe(user.userId, dto);
  }

  @Get('staff')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'List agent and supervisor accounts' })
  findStaff() {
    return this.usersService.findStaff();
  }

  @Get('agents')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'List agent accounts for counter assignment' })
  findAgents() {
    return this.usersService.findAgents();
  }

  @Post('staff')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create an agent or supervisor account' })
  createStaff(@Body() dto: CreateStaffDto) {
    return this.usersService.createStaff(dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate or deactivate a non-admin account' })
  setActive(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.usersService.setActive(id, dto.isActive);
  }
}
