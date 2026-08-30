import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private service: NotificationsService) {}
  @Get('my') my(@CurrentUser() user: any) {
    return this.service.sync(user.userId);
  }
  @Patch('read-all') all(@CurrentUser() user: any) {
    return this.service.readAll(user.userId);
  }
  @Patch(':id/read') read(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.read(id, user.userId);
  }
}
