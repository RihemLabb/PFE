import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty({ example: 15, description: 'Slot duration in minutes' })
  @IsNumber()
  @Min(5)
  slotDuration: number;

  @ApiProperty({ example: 3, description: 'Max capacity per slot' })
  @IsNumber()
  @Min(1)
  maxCapacityPerSlot: number;
}
