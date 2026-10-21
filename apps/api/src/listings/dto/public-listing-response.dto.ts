import { ApiProperty } from '@nestjs/swagger';

export class PublicPriceDto {
  @ApiProperty({ example: 'AED' })
  currency!: string;

  @ApiProperty({ example: '35000000', description: 'Amount in integer fils' })
  amountFils!: string;
}

export class PublicSellerDto {
  @ApiProperty({ description: 'Dealership ID' })
  id!: string;

  @ApiProperty({ description: 'Dealership public slug' })
  slug!: string;

  @ApiProperty({ description: 'Dealership display name' })
  displayName!: string;

  @ApiProperty({ description: 'Showroom emirate' })
  emirate!: string;

  @ApiProperty({ description: 'Showroom city' })
  city!: string;

  @ApiProperty({ description: 'Verified KYB dealer badge' })
  verified!: boolean;
}

export class PublicMediaDto {
  @ApiProperty({ description: 'Media UUID' })
  id!: string;

  @ApiProperty({ description: 'Media kind (e.g. EXTERIOR, INTERIOR)' })
  kind!: string;

  @ApiProperty({ description: 'Public image URL' })
  url!: string;

  @ApiProperty({ description: 'Descriptive alt text for accessibility', nullable: true })
  altText!: string | null;

  @ApiProperty({ description: 'Display sort order' })
  sortOrder!: number;
}

export class PublicListingSummaryDto {
  @ApiProperty({ description: 'Listing UUID' })
  id!: string;

  @ApiProperty({ description: 'Marketplace URL slug' })
  slug!: string;

  @ApiProperty({ description: 'Listing title' })
  title!: string;

  @ApiProperty({ type: PublicPriceDto })
  price!: PublicPriceDto;

  @ApiProperty({ description: 'Model manufacturing year' })
  year!: number;

  @ApiProperty({ description: 'Odometer reading in km', nullable: true })
  mileageKm!: number | null;

  @ApiProperty({ description: 'Vehicle condition' })
  condition!: string;

  @ApiProperty({ description: 'UAE Emirate where vehicle is physically located' })
  emirate!: string;

  @ApiProperty({ type: PublicSellerDto })
  seller!: PublicSellerDto;

  @ApiProperty({ type: [PublicMediaDto], description: 'Public exterior/interior images only' })
  media!: PublicMediaDto[];

  @ApiProperty({ description: 'Publication timestamp' })
  publishedAt!: string;
}

export class PublicListingDetailDto extends PublicListingSummaryDto {
  @ApiProperty({ description: 'Detailed listing description', nullable: true })
  description!: string | null;

  @ApiProperty({ description: 'Vehicle Make' })
  makeName!: string;

  @ApiProperty({ description: 'Vehicle Model' })
  modelName!: string;

  @ApiProperty({ description: 'Vehicle Trim', nullable: true })
  trim!: string | null;

  @ApiProperty({ description: 'Exterior color', nullable: true })
  colorExterior!: string | null;

  @ApiProperty({ description: 'Fuel type', nullable: true })
  fuel!: string | null;

  @ApiProperty({ description: 'Transmission', nullable: true })
  transmission!: string | null;

  @ApiProperty({ description: 'GCC specification flag', nullable: true })
  gccSpec!: boolean | null;

  @ApiProperty({ description: 'Privacy-masked VIN (e.g. 1GNEK1337*******)', nullable: true })
  maskedVin!: string | null;
}

export class PublicListingSearchResponseDto {
  @ApiProperty({ type: [PublicListingSummaryDto] })
  items!: PublicListingSummaryDto[];

  @ApiProperty({ description: 'Total eligible matching listings' })
  total!: number;

  @ApiProperty({ description: 'Current page number' })
  page!: number;

  @ApiProperty({ description: 'Items per page' })
  limit!: number;
}
