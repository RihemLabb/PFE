import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CounterStatus } from '../../../common/enums/counter-status.enum';

export class CreateCounterDto {
  @ApiProperty({ example: 'Guichet 1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  number: number;

  @ApiProperty({ description: 'ID of the service this counter handles', example: '6a283e2e3ff75dc596d73aa9' })
  @IsMongoId()
  serviceId: string;
}

export class UpdateCounterDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ enum: CounterStatus, required: false })
  @IsEnum(CounterStatus)
  @IsOptional()
  status?: CounterStatus;

  @ApiProperty({ required: false })
  @IsMongoId()
  @IsOptional()
  serviceId?: string;
}