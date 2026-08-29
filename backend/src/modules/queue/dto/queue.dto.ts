import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckInDto {
  @ApiProperty({ description: "The QR Token scanned from the user's ticket" })
  @IsString()
  @IsNotEmpty()
  qrToken: string;
}

export class CallNextDto {
  @ApiProperty({ description: "ID of the agent's counter" })
  @IsMongoId()
  counterId: string;
}
