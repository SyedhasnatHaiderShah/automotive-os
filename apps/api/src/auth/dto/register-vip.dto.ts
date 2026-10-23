import { ApiProperty } from '@nestjs/swagger';
import {
  Equals,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum ClientTier {
  COLLECTOR = 'collector',
  CORPORATE = 'corporate',
  DEALER = 'dealer',
}

export class RegisterVipLeadDto {
  @ApiProperty({
    description: 'Client membership tier',
    enum: ClientTier,
    example: ClientTier.COLLECTOR,
  })
  @IsEnum(ClientTier)
  tier!: ClientTier;

  @ApiProperty({
    description: 'Full legal name / Entity representative',
    example: 'Sheikh Mansoor Al-Ketbi',
  })
  @IsString()
  @IsNotEmpty()
  legalName!: string;

  @ApiProperty({
    description: 'UAE contact mobile number',
    example: '+971508924114',
  })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({
    description: 'Corporate or private email address',
    example: 'm.alketbi@holding.ae',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'UAE Federal Emirates ID or UAE PASS identity claim',
    example: '784-1988-4920194-1',
    required: false,
  })
  @IsString()
  @IsOptional()
  emiratesId?: string;

  @ApiProperty({
    description: 'Emirate of residence / business registration',
    example: 'Dubai',
    required: false,
  })
  @IsString()
  @IsOptional()
  emirate?: string;

  @ApiProperty({
    description: 'Curated garage marques of interest',
    example: ['Ferrari', 'Porsche', 'Rolls-Royce'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  marques?: string[];

  @ApiProperty({
    description: 'Initial password or passkey seed hash',
    required: false,
  })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({
    description: 'UAE Federal PDPL consent agreement (Law No. 45/2021)',
    example: true,
  })
  @Equals(true, { message: 'UAE Federal PDPL consent must be explicitly granted' })
  consentPdpl!: boolean;
}

export class RegisterVipResponseDto {
  @ApiProperty({ description: 'Operation status', example: true })
  success!: boolean;

  @ApiProperty({ description: 'Provisioned user identifier' })
  userId!: string;

  @ApiProperty({ description: 'Pending registration identifier', required: false })
  registrationId?: string;

  @ApiProperty({ description: 'Registered email' })
  email!: string;

  @ApiProperty({ description: 'Assigned tier', enum: ClientTier })
  tier!: ClientTier;

  @ApiProperty({ description: 'Account verification status', example: 'PENDING_VERIFICATION' })
  status!: string;

  @ApiProperty({ description: 'Indicates verification requirement before session activation', example: true })
  requiresVerification!: boolean;

  @ApiProperty({ description: 'JWT authentication token (omitted for unverified registrations)', required: false })
  accessToken?: string;

  @ApiProperty({ description: 'Registration confirmation message' })
  message!: string;
}
