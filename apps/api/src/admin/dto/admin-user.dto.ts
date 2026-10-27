import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UserStatus } from '@automotive-os/database';

export class AdminUserFilterDto {
  @ApiPropertyOptional({ description: 'Search query for email or name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'SUSPENDED', 'DISABLED', 'PENDING_VERIFICATION'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'SUSPENDED', 'DISABLED', 'PENDING_VERIFICATION'])
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'Filter by role key or membership role' })
  @IsOptional()
  @IsString()
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
  isPlatformAdmin?: boolean;

  @ApiPropertyOptional({ description: 'Reason for administrative status update' })
  @IsOptional()
  @IsString()
  reason?: string;
}
