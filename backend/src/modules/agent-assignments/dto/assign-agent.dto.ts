import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class AssignAgentDto {
  @ApiProperty({ description: 'Agent user ID' })
  @IsMongoId()
  agentId: string;

  @ApiProperty({ description: 'Counter ID' })
  @IsMongoId()
  counterId: string;
}
