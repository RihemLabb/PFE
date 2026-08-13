import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all appointments (Admin/Supervisor)' })
  findAll() {
    return this.appointmentsService.findAll();
  }

  @Get('my-appointments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get my appointments (Any logged-in user)' })
  findMyAppointments(@CurrentUser() user: any) {
    return this.appointmentsService.findMyAppointments(user.userId);
  }

  @Get('dashboard/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get live dashboard statistics (Admin/Supervisor)' })
  getStats() {
    return this.appointmentsService.getDashboardStats();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create an appointment (User)' })
  create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @CurrentUser() user: any,
  ) {
    return this.appointmentsService.create(createAppointmentDto, user.userId);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cancel an appointment (Owner/Admin/Supervisor)' })
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.appointmentsService.cancel(id, user.userId, user.role);
  }
}
