import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Passport Renewal' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Renewal of expired passports', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 15, description: 'Average duration in minutes' })
  @IsNumber()
  @Min(1)
  avgDuration: number;

  @ApiProperty({ example: ['ID Card', 'Old Passport'], required: false })
  @IsArray()
  @IsOptional()
  requiredDocs?: string[];

  @ApiProperty({ example: 15, description: 'Slot duration in minutes' })
  @IsNumber()
  @Min(5)
  slotDuration: number;

  @ApiProperty({ example: 3, description: 'Max capacity per slot' })
  @IsNumber()
  @Min(1)
  maxCapacityPerSlot: number;

  @ApiProperty({ example: '09:00', required: false, default: '09:00' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  @IsOptional()
  openingTime?: string;

  @ApiProperty({ example: '17:00', required: false, default: '17:00' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  @IsOptional()
  closingTime?: string;

  @ApiProperty({
    example: [1, 2, 3, 4, 5],
    description: 'Operating weekdays where 0=Sunday and 6=Saturday',
    required: false,
  })
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  @IsOptional()
  workingDays?: number[];
}

export class UpdateServiceDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  avgDuration?: number;

  @ApiProperty({ required: false })
  @IsArray()
  @IsOptional()
  requiredDocs?: string[];

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: 15, required: false })
  @IsNumber()
  @Min(5)
  @IsOptional()
  slotDuration?: number;

  @ApiProperty({ example: 3, required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxCapacityPerSlot?: number;

  @ApiProperty({ example: '09:00', required: false })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  @IsOptional()
  openingTime?: string;

  @ApiProperty({ example: '17:00', required: false })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  @IsOptional()
  closingTime?: string;

  @ApiProperty({ example: [1, 2, 3, 4, 5], required: false })
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  @IsOptional()
  workingDays?: number[];
}
