import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QueueService } from './queue.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CheckInDto } from './dto/check-in.dto';

@ApiTags('Queue')
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get('display')
  @ApiOperation({ summary: 'Get sanitized live queue data for a public display' })
  getPublicDisplayQueue(@Query('serviceId') serviceId: string) {
    return this.queueService.getPublicDisplayQueue(serviceId);
  }

  @Get('today')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get today queue for an authorized service' })
  getTodayQueue(
    @Query('serviceId') serviceId: string,
    @CurrentUser() user: any,
  ) {
    return this.queueService.getTodayQueue(serviceId, user);
  }

  @Post('checkin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Check in user via QR token' })
  checkIn(@Body() checkInDto: CheckInDto) {
    return this.queueService.checkIn(checkInDto.qrToken);
  }

  @Post('next')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Call next ticket for an authorized counter' })
  callNext(
    @Body() body: { serviceId: string; counterId: string },
    @CurrentUser() user: any,
  ) {
    return this.queueService.callNext(body.serviceId, body.counterId, user);
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Start service for a called ticket' })
  startService(@Param('id') id: string, @CurrentUser() user: any) {
    return this.queueService.startService(id, user);
  }

  @Post(':id/finish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Finish service for an in-progress ticket' })
  finishService(@Param('id') id: string, @CurrentUser() user: any) {
    return this.queueService.finishService(id, user);
  }

  @Post(':id/absent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mark a called ticket as absent' })
  markAbsent(@Param('id') id: string, @CurrentUser() user: any) {
    return this.queueService.markAbsent(id, user);
  }
}
