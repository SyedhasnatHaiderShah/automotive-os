import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
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
  @IsString()
  @IsOptional()
  reason?: string;
}
