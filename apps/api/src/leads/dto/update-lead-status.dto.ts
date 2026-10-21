import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { LeadStatus } from '@automotive-os/database';

export class UpdateLeadStatusDto {
  @ApiProperty({
    enum: LeadStatus,
    description: 'Target CRM lead lifecycle status',
    example: LeadStatus.CONTACTED,
  })
  @IsEnum(LeadStatus)
  @IsNotEmpty()
  status!: LeadStatus;
}
