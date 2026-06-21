import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QueueService } from './queue.service';
import { CheckInDto, CallNextDto } from './dto/queue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Queue & Check-in')
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('checkin')
  @ApiOperation({ summary: 'Check-in a user by scanning their QR code' })
  checkIn(@Body() checkInDto: CheckInDto) {
    return this.queueService.checkIn(checkInDto);
  }

  @Post('next')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Call the next ticket in the queue (Agent)' })
  callNext(@Query('serviceId') serviceId: string, @Body() callNextDto: CallNextDto) {
    return this.queueService.callNext(serviceId, callNextDto.counterId);
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mark ticket as In Progress (Agent)' })
  startService(@Param('id') id: string) {
    return this.queueService.startService(id);
  }

  @Post(':id/finish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mark ticket as Finished (Agent)' })
  finishService(@Param('id') id: string) {
    return this.queueService.finishService(id);
  }

  @Post(':id/absent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.SUPERVISOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mark ticket as Absent (Agent/Supervisor)' })
  markAbsent(@Param('id') id: string) {
    return this.queueService.markAbsent(id);
  }

  @Get('today')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get today\'s queue for a specific service' })
  getTodayQueue(@Query('serviceId') serviceId: string) {
    return this.queueService.getTodayQueue(serviceId);
  }
}