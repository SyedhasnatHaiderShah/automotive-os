import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateAccountSettingsDto {
  @ApiProperty({ description: 'First name', example: 'Tariq', required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ description: 'Last name', example: 'Al-Hashimi', required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ description: 'Public handle / Sovereign patron identifier', example: 'Tariq.Collector.DXB', required: false })
  @IsString()
  @IsOptional()
  handle?: string;

  @ApiProperty({ description: 'Corporate entity affiliation', example: 'Emirates Private Holdings Ltd', required: false })
  @IsString()
  @IsOptional()
  affiliation?: string;

  @ApiProperty({ description: 'Federal Tax Authority TRN (Tax Registration Number)', example: '100-2490-5829-0003', required: false })
  @IsString()
  @IsOptional()
  trn?: string;

  @ApiProperty({ description: 'Settlement currency (AED, USD, EUR)', example: 'AED', required: false })
  @IsString()
  @IsOptional()
  settlementCurrency?: string;

  @ApiProperty({ description: 'FAB Escrow Custody IBAN', example: 'AE02 0300 0019 2838 4810 992', required: false })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s+/g, '').toUpperCase() : value))
  @IsString()
  @Matches(/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/, { message: 'escrowIban must be a valid IBAN (e.g. AE07 0331 2345 6789 0123 456)' })
  escrowIban?: string;

  @ApiProperty({ description: 'Virtual garage portfolio visibility', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  garageVisibility?: boolean;

  @ApiProperty({ description: 'AECB credit bureau soft refresh consent', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  aecbRefresh?: boolean;

  @ApiProperty({ description: 'WhatsApp VIP sovereign communications consent', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  whatsappComms?: boolean;
}

export class AccountSettingsResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ description: 'Full display name' })
  displayName!: string;

  @ApiProperty({ description: 'Primary contact email' })
  email!: string | null;

  @ApiProperty({ description: 'Primary contact phone' })
  phoneE164!: string | null;

  @ApiProperty({ description: 'Corporate entity affiliation' })
  affiliation!: string | null;

  @ApiProperty({ description: 'Federal Tax Authority TRN' })
  trn!: string | null;

  @ApiProperty({ description: 'Settlement currency' })
  settlementCurrency!: string;

  @ApiProperty({ description: 'FAB Escrow Custody IBAN' })
  escrowIban!: string | null;

  @ApiProperty({ description: 'Virtual garage portfolio visibility' })
  garageVisibility!: boolean;

  @ApiProperty({ description: 'AECB credit bureau soft refresh consent' })
  aecbRefreshConsent!: boolean;

  @ApiProperty({ description: 'WhatsApp communications consent' })
  whatsappCommsConsent!: boolean;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: string;
}
