import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CountersService } from './counters.service';
import { CreateCounterDto, UpdateCounterDto } from './dto/counter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Counters')
@Controller('counters')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class CountersController {
  constructor(private readonly countersService: CountersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Create a new counter (Admin/Supervisor only)' })
  create(@Body() createCounterDto: CreateCounterDto) {
    return this.countersService.create(createCounterDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all counters (populated with Service details)',
  })
  findAll() {
    return this.countersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a counter by ID' })
  findOne(@Param('id') id: string) {
    return this.countersService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Update a counter (Admin/Supervisor only)' })
  update(@Param('id') id: string, @Body() updateCounterDto: UpdateCounterDto) {
    return this.countersService.update(id, updateCounterDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a counter (Admin only)' })
  remove(@Param('id') id: string) {
    return this.countersService.remove(id);
  }
}
