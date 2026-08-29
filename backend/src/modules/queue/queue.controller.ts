import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckInDto } from './dto/check-in.dto';
import { QueueService } from './queue.service';

@ApiTags('Queue')
@Controller('queue')
export class QueueController {
  constructor(private service: QueueService) {}
  @Get('display') display(@Query('serviceId') id?: string) {
    return this.service.publicDisplay(id);
  }
  @Get('today')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT, UserRole.SUPERVISOR)
  @ApiBearerAuth('access-token')
  today(@Query('serviceId') id?: string) {
    return this.service.today(id);
  }
  @Get('me') @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token') me(
    @CurrentUser() user: any,
  ) {
    return this.service.myStatus(user.userId);
  }
  @Post('checkin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  checkin(@Body() dto: CheckInDto, @CurrentUser() user: any) {
    return this.service.checkIn(dto.qrToken, user);
  }
  @Post('next')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  next(
    @Body() body: { serviceId: string; counterId: string },
    @CurrentUser() user: any,
  ) {
    return this.service.callNext(body.serviceId, body.counterId, user.userId);
  }
  @Post(':id/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  start(@Param('id') id: string) {
    return this.service.start(id);
  }
  @Post(':id/finish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  finish(@Param('id') id: string) {
    return this.service.finish(id);
  }
  @Post(':id/absent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  absent(@Param('id') id: string) {
    return this.service.absent(id);
  }
}
