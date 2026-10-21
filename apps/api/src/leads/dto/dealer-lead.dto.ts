import { ApiProperty } from '@nestjs/swagger';
import {
  AppointmentStatus,
  ContactPreference,
  LeadIntent,
  LeadStatus,
} from '@automotive-os/database';

export class DealerBuyerContactDto {
  @ApiProperty({ description: 'Buyer name (null if not granted or revoked)', nullable: true })
  name!: string | null;

  @ApiProperty({ description: 'Buyer phone (null if not granted or revoked)', nullable: true })
  phone!: string | null;

  @ApiProperty({ description: 'Buyer email (null if not granted or revoked)', nullable: true })
  email!: string | null;

  @ApiProperty({ enum: ['ACTIVE', 'REVOKED', 'NO_GRANT'] })
  grantStatus!: 'ACTIVE' | 'REVOKED' | 'NO_GRANT';
}

export class DealerListingBriefDto {
  @ApiProperty({ description: 'Listing UUID' })
  id!: string;

  @ApiProperty({ description: 'Listing URL Slug' })
  slug!: string;

  @ApiProperty({ description: 'Listing Title' })
  title!: string;

  @ApiProperty({ description: 'Asking price in fils' })
  askingPriceFils!: string;
}

export class DealerLeadSummaryDto {
  @ApiProperty({ description: 'Lead UUID' })
  id!: string;

  @ApiProperty({ description: 'Listing UUID' })
  listingId!: string;

  @ApiProperty({ description: 'Listing Title' })
  listingTitle!: string;

  @ApiProperty({ enum: LeadIntent })
  intent!: LeadIntent;

  @ApiProperty({ enum: LeadStatus })
  status!: LeadStatus;

  @ApiProperty({ enum: ContactPreference })
  preferredContact!: ContactPreference;

  @ApiProperty({ description: 'Buyer display name (masked or granted)' })
  buyerDisplayName!: string;

  @ApiProperty({ description: 'Assigned staff membership ID', nullable: true })
  assignedMembershipId!: string | null;

  @ApiProperty({ description: 'Assigned staff name', nullable: true })
  assignedStaffName!: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: string;
}

export class DealerAppointmentItemDto {
  @ApiProperty({ description: 'Appointment UUID' })
  id!: string;

  @ApiProperty({ description: 'Start time' })
  startsAt!: string;

  @ApiProperty({ description: 'End time' })
  endsAt!: string;

  @ApiProperty({ enum: AppointmentStatus })
  status!: AppointmentStatus;

  @ApiProperty({ description: 'Appointment note', nullable: true })
  note!: string | null;
}

export class DealerLeadDetailDto {
  @ApiProperty({ description: 'Lead UUID' })
  id!: string;

  @ApiProperty({ description: 'Dealership Tenant UUID' })
  tenantId!: string;

  @ApiProperty({ type: DealerListingBriefDto })
  listing!: DealerListingBriefDto;

  @ApiProperty({ enum: LeadIntent })
  intent!: LeadIntent;

  @ApiProperty({ enum: LeadStatus })
  status!: LeadStatus;

  @ApiProperty({ enum: ContactPreference })
  preferredContact!: ContactPreference;

  @ApiProperty({ description: 'Buyer inquiry message', nullable: true })
  buyerMessage!: string | null;

  @ApiProperty({ description: 'Assigned staff membership ID', nullable: true })
  assignedMembershipId!: string | null;

  @ApiProperty({ description: 'Assigned staff member display name', nullable: true })
  assignedStaffName!: string | null;

  @ApiProperty({ type: DealerBuyerContactDto, description: 'Field-level consent authorized contact details' })
  buyerContact!: DealerBuyerContactDto;

  @ApiProperty({ type: [DealerAppointmentItemDto] })
  appointments!: DealerAppointmentItemDto[];

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: string;
}
