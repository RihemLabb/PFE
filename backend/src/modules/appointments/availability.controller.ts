import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { AvailabilityQueryDto } from './dto/availability-query.dto';

@ApiTags('Availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get available slots for a service and date' })
  getAvailability(@Query() query: AvailabilityQueryDto) {
    return this.appointmentsService.getAvailability(
      query.serviceId,
      query.date,
    );
  }
}
