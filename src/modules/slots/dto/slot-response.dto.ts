import { ApiProperty } from '@nestjs/swagger';

export class SlotResponseDto {
  @ApiProperty({ example: 'clx1abc123' })
  id: string;

  @ApiProperty({ example: '2026-10-05T09:00:00.000Z' })
  startTime: Date;

  @ApiProperty({ example: '2026-10-05T10:00:00.000Z' })
  endTime: Date;

  @ApiProperty({ example: false })
  isBooked: boolean;

  @ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
  updatedAt: Date;
}
