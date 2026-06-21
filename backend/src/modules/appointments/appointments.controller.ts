import { Controller, Get, Post, Body, Param, Query, Put, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all appointments (Admin)' })
  findAll() {
    return this.appointmentsService.findAll();
  }

  @Get('availability')
  @ApiOperation({ summary: 'Get available time slots for a service on a specific date' })
  @ApiQuery({ name: 'serviceId', required: true })
  @ApiQuery({ name: 'date', required: true, example: '2026-06-15' })
  getAvailability(@Query('serviceId') serviceId: string, @Query('date') date: string) {
    return this.appointmentsService.getAvailability(serviceId, date);
  }

  @Get('dashboard/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get dashboard statistics (Admin)' })
  getDashboardStats() {
    return this.appointmentsService.getDashboardStats();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Book a new appointment (User)' })
  createAppointment(@Request() req, @Body() createDto: CreateAppointmentDto) {
    return this.appointmentsService.createAppointment(req.user.userId, createDto);
  }

  @Get('my-appointments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all appointments for the logged-in user' })
  findMyAppointments(@Request() req) {
    return this.appointmentsService.findUserAppointments(req.user.userId);
  }

  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cancel an appointment (User)' })
  cancelAppointment(@Request() req, @Param('id') id: string) {
    return this.appointmentsService.cancelAppointment(req.user.userId, id);
  }
}