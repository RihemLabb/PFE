import {
  IsString,
  IsMongoId,
  Matches,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'ID of the service to book' })
  @IsMongoId()
  serviceId: string;

  @ApiProperty({
    description: 'Date of appointment (YYYY-MM-DD)',
    example: '2026-06-15',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  date: string;

  @ApiProperty({ description: 'Time slot (HH:mm)', example: '09:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Time must be in HH:mm format' })
  timeSlot: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}
export class UpdateAppointmentDto {
  @IsOptional() @IsMongoId() serviceId?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) date?: string;
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) timeSlot?: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}
export class CancelAppointmentDto {
  @IsOptional() @IsString() @MaxLength(300) reason?: string;
}
