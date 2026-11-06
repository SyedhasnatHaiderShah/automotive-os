import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsIn, IsInt, IsOptional, IsString, Min, MinLength, ValidateIf } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { MembershipRole, UserStatus } from '@automotive-os/database';

export class AdminUserFilterDto {
  @ApiPropertyOptional({ description: 'Search query for email or name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'SUSPENDED', 'DISABLED', 'PENDING_VERIFICATION'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'SUSPENDED', 'DISABLED', 'PENDING_VERIFICATION'])
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'Filter by role key or membership role', enum: [...Object.values(MembershipRole), 'PLATFORM_ADMIN', 'BUYER'] })
  @IsOptional()
  @IsIn([...Object.values(MembershipRole), 'PLATFORM_ADMIN', 'BUYER'])
  role?: string;

  @ApiPropertyOptional({ description: 'Filter by tenant UUID' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 20;
}

export class AdminUpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'SUSPENDED', 'DISABLED', 'PENDING_VERIFICATION'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'SUSPENDED', 'DISABLED', 'PENDING_VERIFICATION'])
  status?: UserStatus;

  @ApiPropertyOptional()
  @IsOptional()
  // SEC-14: implicit conversion would turn the string "false" into true.
  @Transform(({ obj }) => (obj.isPlatformAdmin === 'true' ? true : obj.isPlatformAdmin === 'false' ? false : obj.isPlatformAdmin))
  @IsBoolean()
  isPlatformAdmin?: boolean;

  @ApiPropertyOptional({ description: 'Reason for administrative status update' })
  // QA-LOCAL-10: suspending, disabling or demoting an account requires a recorded reason.
  @ValidateIf((o) => o.status === 'SUSPENDED' || o.status === 'DISABLED' || o.isPlatformAdmin === false)
  @IsString()
  @MinLength(5, { message: 'reason (at least 5 characters) is required when suspending, disabling or demoting an account' })
  reason?: string;
}
