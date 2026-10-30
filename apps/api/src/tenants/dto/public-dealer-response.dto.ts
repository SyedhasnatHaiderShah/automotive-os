import { ApiProperty } from '@nestjs/swagger';
import { VerificationStatus } from '@automotive-os/database';

export class PublicDealerBranchDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  emirate: string;

  @ApiProperty()
  city: string;

  @ApiProperty({ required: false })
  address?: string | null;

  @ApiProperty({ required: false })
  latitude?: string;

  @ApiProperty({ required: false })
  longitude?: string;
}

export class PublicDealerVerificationDto {
  @ApiProperty({ enum: VerificationStatus })
  status: VerificationStatus;

  @ApiProperty({ required: false })
  tradeLicenseRef?: string;

  @ApiProperty({ required: false })
  licenseExpiry?: string;

  @ApiProperty({ required: false })
  jurisdiction?: string;

  @ApiProperty()
  isKybVerified: boolean;
}

export class PublicDealerStatsDto {
  @ApiProperty({ description: 'Count of live grounded published vehicles' })
  liveGroundedStock: number;

  @ApiProperty({ description: 'Total asking price sum in integer fils' })
  inventoryValueFils: string;

  @ApiProperty({ description: 'Collector satisfaction rating out of 5; null until a review source exists', nullable: true, type: Number })
  collectorRating: number | null;

  @ApiProperty({ description: 'Physical facility area in square feet; null until captured', nullable: true, type: Number })
  facilitySqFt: number | null;

  @ApiProperty({ description: 'Years established in UAE; null until captured', nullable: true, type: Number })
  establishedYears: number | null;
}

export class PublicDealerContactDto {
  @ApiProperty({ nullable: true, type: String })
  directPhone: string | null;

  @ApiProperty({ nullable: true, type: String })
  whatsappNumber: string | null;

  @ApiProperty({ nullable: true, type: String })
  makaniNumber: string | null;

  @ApiProperty({ nullable: true, type: String, description: 'Primary active branch "lat, long"' })
  gpsCoordinates: string | null;
}

export class PublicDealerDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  legalName: string;

  @ApiProperty()
  displayName: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  currency: string;

  @ApiProperty({ type: PublicDealerVerificationDto, required: false })
  verification?: PublicDealerVerificationDto;

  @ApiProperty({ type: [PublicDealerBranchDto] })
  branches: PublicDealerBranchDto[];

  @ApiProperty({ type: PublicDealerStatsDto })
  stats: PublicDealerStatsDto;

  @ApiProperty({ type: PublicDealerContactDto })
  contact: PublicDealerContactDto;
}

export class PublicDealerSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  displayName: string;

  @ApiProperty()
  isKybVerified: boolean;

  @ApiProperty({ type: [String] })
  emirates: string[];

  @ApiProperty({ type: [String] })
  cities: string[];

  @ApiProperty({ description: 'Count of live grounded published vehicles' })
  liveGroundedStock: number;
}

export class PublicDealerListResponseDto {
  @ApiProperty({ type: [PublicDealerSummaryDto] })
  items: PublicDealerSummaryDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
