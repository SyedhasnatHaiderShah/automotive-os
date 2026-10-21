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

  @ApiProperty({ description: 'Collector satisfaction rating out of 5' })
  collectorRating: number;

  @ApiProperty({ description: 'Physical facility area in square feet' })
  facilitySqFt: number;

  @ApiProperty({ description: 'Years established in UAE' })
  establishedYears: number;
}

export class PublicDealerContactDto {
  @ApiProperty()
  directPhone: string;

  @ApiProperty()
  whatsappNumber: string;

  @ApiProperty()
  makaniNumber: string;

  @ApiProperty()
  gpsCoordinates: string;
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
