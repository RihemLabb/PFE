import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class CheckInDto {
  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Opaque token encoded in the appointment QR code',
  })
  @IsOptional()
  @IsString()
  qrToken?: string;

  @ApiPropertyOptional({
    example: 'IDC-001',
    description: 'Human-readable ticket number for manual agent check-in',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9]+-\d+$/, {
    message: 'ticketNumber must look like IDC-001',
  })
  ticketNumber?: string;
}

export class TicketLookupDto {
  @ApiPropertyOptional({ example: 'IDC-001' })
  @IsString()
  @Matches(/^[A-Za-z0-9]+-\d+$/, {
    message: 'ticketNumber must look like IDC-001',
  })
  ticketNumber: string;
}
