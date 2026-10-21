import { ApiProperty } from '@nestjs/swagger';
import { ContactPreference, LeadIntent, LeadStatus } from '@automotive-os/database';
import { AppointmentResponseDto } from './create-appointment.dto';

export class BuyerLeadGrantInfoDto {
  @ApiProperty({ description: 'Data grant ID' })
  id!: string;

  @ApiProperty({ description: 'Fields granted to dealer' })
  fieldsGranted!: string[];

  @ApiProperty({ description: 'Consent purpose' })
  purpose!: string;

  @ApiProperty({ description: 'Consent disclosure version' })
  consentTextVer!: string;

  @ApiProperty({ description: 'Grant timestamp' })
  grantedAt!: string;

  @ApiProperty({ description: 'Revocation timestamp if revoked', nullable: true })
  revokedAt!: string | null;
}

export class BuyerListingSummaryDto {
  @ApiProperty({ description: 'Listing UUID' })
  id!: string;

  @ApiProperty({ description: 'Listing Slug' })
  slug!: string;

  @ApiProperty({ description: 'Listing Title' })
  title!: string;

  @ApiProperty({ description: 'Dealership Name' })
  dealershipName!: string;
}

export class BuyerEnquiryResponseDto {
  @ApiProperty({ description: 'Lead UUID' })
  id!: string;

  @ApiProperty({ description: 'Dealership Tenant UUID' })
  tenantId!: string;

  @ApiProperty({ type: BuyerListingSummaryDto })
  listing!: BuyerListingSummaryDto;

  @ApiProperty({ enum: LeadStatus })
  status!: LeadStatus;

  @ApiProperty({ enum: LeadIntent })
  intent!: LeadIntent;

  @ApiProperty({ enum: ContactPreference })
  preferredContact!: ContactPreference;

  @ApiProperty({ description: 'Buyer inquiry message', nullable: true })
  buyerMessage!: string | null;

  @ApiProperty({ type: BuyerLeadGrantInfoDto, nullable: true })
  grant!: BuyerLeadGrantInfoDto | null;

  @ApiProperty({ type: [AppointmentResponseDto] })
  appointments!: AppointmentResponseDto[];

  @ApiProperty({ description: 'Submission timestamp' })
  createdAt!: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: string;
}
