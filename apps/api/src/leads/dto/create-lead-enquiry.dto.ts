import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ContactPreference, LeadIntent, LeadStatus } from '@automotive-os/database';

export class CreateLeadEnquiryDto {
  @ApiProperty({
    enum: LeadIntent,
    example: LeadIntent.TEST_DRIVE,
    description: 'Buyer intent for inquiry',
  })
  @IsEnum(LeadIntent)
  @IsNotEmpty()
  intent!: LeadIntent;

  @ApiProperty({
    enum: ContactPreference,
    example: ContactPreference.PHONE,
    description: 'Buyer preferred contact channel',
  })
  @IsEnum(ContactPreference)
  @IsNotEmpty()
  preferredContact!: ContactPreference;

  @ApiProperty({
    description: 'Inquiry message or note for dealership',
    example: 'I would like a Saturday test drive around 11 AM.',
    required: false,
  })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({
    description:
      'Explicit array of buyer profile fields authorized to be shared with dealership',
    example: ['name', 'phone'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  fieldsToShare!: string[];

  @ApiProperty({
    description: 'Version string of buyer consent disclosure accepted',
    example: 'buyer-lead-disclosure-en-AE-v1',
  })
  @IsString()
  @IsNotEmpty()
  consentTextVersion!: string;
}

export class LeadEnquiryCreatedResponseDto {
  @ApiProperty({ description: 'Created Lead UUID' })
  id!: string;

  @ApiProperty({ enum: LeadStatus })
  status!: LeadStatus;

  @ApiProperty({ description: 'Target Listing UUID' })
  listingId!: string;

  @ApiProperty({ description: 'Dealership Tenant UUID' })
  tenantId!: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: string;
}
