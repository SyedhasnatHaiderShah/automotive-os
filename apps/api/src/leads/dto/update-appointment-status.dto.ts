import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { AppointmentStatus } from '@automotive-os/database';

export class UpdateAppointmentStatusDto {
  @ApiProperty({
    enum: AppointmentStatus,
    description: 'Updated appointment status',
    example: AppointmentStatus.CONFIRMED,
  })
  @IsEnum(AppointmentStatus)
  @IsNotEmpty()
  status!: AppointmentStatus;
}
