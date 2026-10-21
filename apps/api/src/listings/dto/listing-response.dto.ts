import { ApiProperty } from '@nestjs/swagger';
import { ListingStatus } from '@automotive-os/database';

export class ListingResponseDto {
  @ApiProperty({ description: 'Listing UUID' })
  id!: string;

  @ApiProperty({ description: 'Dealership Tenant UUID' })
  tenantId!: string;

  @ApiProperty({ description: 'Associated physical vehicle UUID' })
  vehicleId!: string;

  @ApiProperty({ description: 'Marketplace URL slug', example: '2024-toyota-land-cruiser-gr-sport-dubai' })
  slug!: string;

  @ApiProperty({ description: 'Listing headline' })
  title!: string;

  @ApiProperty({ description: 'Listing description', nullable: true })
  description!: string | null;

  @ApiProperty({ description: 'Asking price in integer fils' })
  askingPriceFils!: string;

  @ApiProperty({ enum: ListingStatus, description: 'Current moderation/publication status' })
  status!: ListingStatus;

  @ApiProperty({ description: 'Automated listing quality score (0-100)' })
  qualityScore!: number;

  @ApiProperty({ description: 'Timestamp when listing was verified/approved', nullable: true })
  verifiedAt!: string | null;

  @ApiProperty({ description: 'Timestamp when listing was published', nullable: true })
  publishedAt!: string | null;

  @ApiProperty({ description: 'Created timestamp in UTC' })
  createdAt!: string;

  @ApiProperty({ description: 'Updated timestamp in UTC' })
  updatedAt!: string;
}
