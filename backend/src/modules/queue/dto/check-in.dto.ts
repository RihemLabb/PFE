import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CheckInDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The QR token from the ticket',
  })
  @IsString()
  @IsNotEmpty()
  qrToken: string;
}
