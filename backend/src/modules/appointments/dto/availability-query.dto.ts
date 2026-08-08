import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, Matches } from 'class-validator';

export class AvailabilityQueryDto {
  @ApiProperty({ description: 'Service ID' })
  @IsMongoId()
  serviceId: string;

  @ApiProperty({ example: '2026-08-11', description: 'Date in YYYY-MM-DD format' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  date: string;
}
