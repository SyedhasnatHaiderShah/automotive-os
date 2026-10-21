import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum AdminModerationDecision {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class AdminListingDecisionDto {
  @ApiProperty({
    enum: AdminModerationDecision,
    description: 'Moderation decision: APPROVE or REJECT',
    example: AdminModerationDecision.APPROVE,
  })
  @IsEnum(AdminModerationDecision)
  @IsNotEmpty()
  decision!: AdminModerationDecision;

  @ApiProperty({
    description: 'Moderation review notes / rejection reason (required if REJECT)',
    example: 'Images do not meet platform quality standards. High resolution exterior photo required.',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
