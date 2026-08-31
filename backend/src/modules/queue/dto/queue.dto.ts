import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CallNextDto {
  @ApiProperty({ description: "ID of the agent's counter" })
  @IsMongoId()
  counterId: string;
}
