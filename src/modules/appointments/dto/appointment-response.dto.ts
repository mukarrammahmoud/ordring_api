import { ApiProperty } from '@nestjs/swagger';

export class AppointmentResponseDto {
  @ApiProperty({ example: 'clx1xyz789' })
  id: string;

  @ApiProperty({ example: 'clx1abc123' })
  slotId: string;

  @ApiProperty({ example: 'Alice Smith' })
  clientName: string;

  @ApiProperty({ example: 'alice@example.com' })
  clientEmail: string;

  @ApiProperty({ enum: ['CONFIRMED', 'CANCELLED'], example: 'CONFIRMED' })
  status: 'CONFIRMED' | 'CANCELLED';

  @ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
  updatedAt: Date;
}
