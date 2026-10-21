import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AppointmentStatus } from '@automotive-os/database';

export class CreateAppointmentDto {
  @ApiProperty({
    description: 'Appointment start timestamp in UTC (ISO 8601)',
    example: '2026-10-24T10:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startsAt!: string;

  @ApiProperty({
    description: 'Appointment end timestamp in UTC (ISO 8601)',
    example: '2026-10-24T11:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endsAt!: string;

  @ApiProperty({
    description: 'Buyer note / preferred test-drive details',
    example: 'Looking for a Saturday morning test drive on Sheikh Zayed Rd.',
    required: false,
  })
  @IsString()
  @IsOptional()
  note?: string;
}

export class AppointmentResponseDto {
  @ApiProperty({ description: 'Appointment UUID' })
  id!: string;

  @ApiProperty({ description: 'Dealership Tenant UUID' })
  tenantId!: string;

  @ApiProperty({ description: 'Lead UUID' })
  leadId!: string;

  @ApiProperty({ description: 'Start time in UTC' })
  startsAt!: string;

  @ApiProperty({ description: 'End time in UTC' })
  endsAt!: string;

  @ApiProperty({ enum: AppointmentStatus, description: 'Appointment status' })
  status!: AppointmentStatus;

  @ApiProperty({ description: 'Appointment note', nullable: true })
  note!: string | null;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt!: string;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt!: string;
}
