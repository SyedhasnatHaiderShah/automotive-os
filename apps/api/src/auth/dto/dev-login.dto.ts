import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DevLoginDto {
  @ApiProperty({ description: 'OIDC Identity Subject claim', example: 'auth0|dealer_a_tariq' })
  @IsString()
  @IsNotEmpty()
  identitySubject!: string;

  @ApiProperty({ description: 'Optional email address', example: 'tariq@alfuttaim-prestige.ae', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Optional display name', example: 'Tariq Al-Hashimi', required: false })
  @IsString()
  @IsOptional()
  name?: string;
}

export class AuthTokenResponseDto {
  @ApiProperty({ description: 'Signed JWT access token' })
  accessToken!: string;

  @ApiProperty({ description: 'Token type', example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({ description: 'Subject identity', example: 'auth0|dealer_a_tariq' })
  subject!: string;
}
