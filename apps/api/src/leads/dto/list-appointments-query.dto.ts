import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentStatus } from '@automotive-os/database';

export class ListAppointmentsQueryDto {
  @ApiProperty({ enum: AppointmentStatus, required: false })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ApiProperty({ description: 'Page number (starts at 1)', default: 1, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ description: 'Page size', default: 20, required: false })
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
