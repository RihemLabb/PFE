import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateHolidayDto, UpdateHolidayDto } from './dto/holiday.dto';
import { HolidaysService } from './holidays.service';

@ApiTags('Schedule Exceptions')
@ApiBearerAuth()
@Controller('holidays')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'List holidays and service schedule exceptions' })
  findAll() {
    return this.holidaysService.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a holiday or service schedule exception' })
  create(@Body() dto: CreateHolidayDto) {
    return this.holidaysService.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a holiday or service schedule exception' })
  update(@Param('id') id: string, @Body() dto: UpdateHolidayDto) {
    return this.holidaysService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a holiday or service schedule exception' })
  remove(@Param('id') id: string) {
    return this.holidaysService.remove(id);
  }
}
