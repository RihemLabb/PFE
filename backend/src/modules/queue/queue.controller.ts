import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QueueService } from './queue.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Queue')
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get('today')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get today queue for a service' })
  getTodayQueue(@Query('serviceId') serviceId: string) {
    return this.queueService.getTodayQueue(serviceId);
  }

  @Post('checkin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Check in user via QR token' })
  checkIn(@Body() body: { qrToken: string }) {
    return this.queueService.checkIn(body.qrToken);
  }

  @Post('next')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Call next ticket (Agent)' })
  callNext(@Body() body: { serviceId: string, counterId: string }) {
    return this.queueService.callNext(body.serviceId, body.counterId);
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Start service for ticket (Agent)' })
  startService(@Param('id') id: string) {
    return this.queueService.startService(id);
  }

  @Post(':id/finish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Finish service for ticket (Agent)' })
  finishService(@Param('id') id: string) {
    return this.queueService.finishService(id);
  }

  @Post(':id/absent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mark ticket as absent (Agent)' })
  markAbsent(@Param('id') id: string) {
    return this.queueService.markAbsent(id);
  }
}