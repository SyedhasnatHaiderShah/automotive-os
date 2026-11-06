import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MinLength, ValidateIf } from 'class-validator';
import { TenantStatus } from '@automotive-os/database';

export class UpdateTenantStatusDto {
  @ApiProperty({
    enum: TenantStatus,
    description: 'New tenant operational status (ACTIVE, SUSPENDED, CLOSED, PENDING)',
    example: TenantStatus.SUSPENDED,
  })
  @IsEnum(TenantStatus)
  @IsNotEmpty()
  status!: TenantStatus;

  @ApiProperty({
    description: 'Regulatory audit justification or enforcement reason',
    example: 'DED license expired without renewal bond provided within grace period',
    required: false,
  })
  // QA-LOCAL-10: suspending or closing a dealership requires a recorded reason.
  @ValidateIf((o) => o.status === TenantStatus.SUSPENDED || o.status === TenantStatus.CLOSED)
  @IsString()
  @MinLength(5, { message: 'reason (at least 5 characters) is required when suspending or closing a dealership' })
  reason?: string;
}
