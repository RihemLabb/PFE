import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ 
    example: '6a317c8bafb66ea0ed0cf513', 
    description: 'The ID of the service to book' 
  })
  @IsMongoId()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ 
    example: '2026-06-29', 
    description: 'The date of the appointment (YYYY-MM-DD)' 
  })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ 
    example: '10:00', 
    description: 'The time slot for the appointment' 
  })
  @IsString()
  @IsNotEmpty()
  timeSlot: string;
}