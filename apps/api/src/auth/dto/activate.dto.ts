import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class VerifyActivationTokenDto {
  @ApiProperty({ description: '256-bit activation token' })
  @IsString()
  @IsNotEmpty({ message: 'Activation token is required' })
  token!: string;
}

export class VerifyActivationTokenResponseDto {
  @ApiProperty({ example: true })
  valid!: boolean;

  @ApiProperty({ example: 'admin@autonexa.ae' })
  email!: string;

  @ApiProperty({ example: true })
  isPlatformAdmin!: boolean;

  @ApiProperty({ example: true })
  requiresMfa!: boolean;

  @ApiPropertyOptional({ example: 'ADMIN' })
  role?: string | null;

  @ApiPropertyOptional({ example: 'Al Futtaim Motors' })
  tenantName?: string | null;

  @ApiPropertyOptional({ example: 'JBSWY3DPEHPK3PXP' })
  mfaSecret?: string; // Generated TOTP secret for setup if requiresMfa

  @ApiPropertyOptional({ example: 'otpauth://totp/AutomotiveOS:admin@autonexa.ae?secret=...' })
  otpauthUrl?: string;
}

export class CompleteActivationDto {
  @ApiProperty({ description: '256-bit activation token' })
  @IsString()
  @IsNotEmpty({ message: 'Activation token is required' })
  token!: string;

  @ApiProperty({ example: 'SuperSecurePass123!', description: 'Administrator or user password' })
  @IsString()
  @MinLength(10, { message: 'Password must be at least 10 characters long' })
  password!: string;

  @ApiPropertyOptional({ example: '123456', description: '6-digit TOTP MFA verification code' })
  @IsOptional()
  @IsString()
  mfaCode?: string;
}

export class CompleteActivationResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Account activated successfully. You may now log in.' })
  message!: string;

  @ApiProperty({ example: '/auth?tab=login' })
  redirectUrl!: string;
}
