import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
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
  findMyAppointments(@Req() req: any) {
    console.log('--- DEBUG CONTROLLER ---');
    console.log('Request user:', req.user);
    console.log('User ID:', req.user?._id);
    console.log('------------------------');
    return this.appointmentsService.findMyAppointments(req.user._id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create an appointment (Any logged-in user)' })
  create(@Body() createAppointmentDto: CreateAppointmentDto, @Req() req: any) {
    return this.appointmentsService.create(createAppointmentDto, req.user._id);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cancel an appointment (User)' })
  cancel(@Param('id') id: string) {
    return this.appointmentsService.cancel(id);
  }

  @Get('dashboard/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get dashboard stats (Admin)' })
  getStats() {
    return {
      totalServices: 2,
      todayAppointments: 5,
      checkedIn: 2,
      finished: 1,
      cancelled: 0,
      waiting: 2
    };
  }
}