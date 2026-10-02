import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'ID of the slot to book', example: 'clx1abc123' })
  @IsString()
  @IsNotEmpty()
  slotId: string;

  @ApiProperty({ description: 'Client full name', example: 'Alice Smith' })
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @ApiProperty({
    description: 'Client email address',
    example: 'alice@example.com',
  })
  @IsEmail()
  clientEmail: string;
}
