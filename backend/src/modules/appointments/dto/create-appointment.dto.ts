import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString, Matches } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({
    example: '6a317c8bafb66ea0ed0cf513',
    description: 'The ID of the service to book',
  })
  @IsMongoId()
  serviceId: string;

  @ApiProperty({
    example: '2026-06-29',
    description: 'The date of the appointment (YYYY-MM-DD)',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  date: string;

  @ApiProperty({
    example: '10:00',
    description: 'The time slot for the appointment (HH:mm)',
  })
  @IsString()
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Time must be in HH:mm format',
  })
  timeSlot: string;
}
