import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CancelAppointmentDto,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './dto/appointment.dto';
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private service: AppointmentsService) {}
  @Get() @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.AGENT) all(
    @Query() q: Record<string, string>,
  ) {
    return this.service.findAll(q);
  }
  @Get('my-appointments') mine(@CurrentUser() u: any) {
    return this.service.findMine(u.userId);
  }
  @Get('dashboard/stats') @Roles(UserRole.ADMIN, UserRole.SUPERVISOR) stats() {
    return this.service.stats();
  }
  @Get(':id') one(@Param('id') id: string, @CurrentUser() u: any) {
    return this.service.one(id, u);
  }
  @Post() create(@Body() d: CreateAppointmentDto, @CurrentUser() u: any) {
    return this.service.create(d, u.userId);
  }
  @Patch(':id') update(
    @Param('id') id: string,
    @Body() d: UpdateAppointmentDto,
    @CurrentUser() u: any,
  ) {
    return this.service.update(id, d, u);
  }
  @Put(':id/cancel') cancel(
    @Param('id') id: string,
    @Body() d: CancelAppointmentDto,
    @CurrentUser() u: any,
  ) {
    return this.service.cancel(id, d, u);
  }
  @Post(':id/cancel') cancelLegacy(
    @Param('id') id: string,
    @Body() d: CancelAppointmentDto,
    @CurrentUser() u: any,
  ) {
    return this.service.cancel(id, d, u);
  }
}
