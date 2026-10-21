import { ApiProperty } from '@nestjs/swagger';

export class VehicleMediaItemDto {
  @ApiProperty({ description: 'Media ID' })
  id!: string;

  @ApiProperty({ description: 'Media kind' })
  kind!: string;

  @ApiProperty({ description: 'S3 Object Key' })
  objectKey!: string;

  @ApiProperty({ description: 'Alt text', nullable: true })
  altText!: string | null;

  @ApiProperty({ description: 'Sort order index' })
  sortOrder!: number;

  @ApiProperty({ description: 'Publicly readable flag' })
  isPublic!: boolean;
}

export class VehicleResponseDto {
  @ApiProperty({ description: 'Vehicle UUID' })
  id!: string;

  @ApiProperty({ description: 'Dealership Tenant UUID' })
  tenantId!: string;

  @ApiProperty({ description: 'Branch UUID' })
  branchId!: string;

  @ApiProperty({ description: 'Make Name', example: 'Toyota' })
  makeName!: string;

  @ApiProperty({ description: 'Model Name', example: 'Land Cruiser' })
  modelName!: string;

  @ApiProperty({ description: 'Private VIN (Chassis number)', nullable: true })
  vin!: string | null;

  @ApiProperty({ description: 'Internal stock number', example: 'AFP-2024-001' })
  stockNumber!: string;

  @ApiProperty({ description: 'Trim / Edition', nullable: true })
  trim!: string | null;

  @ApiProperty({ description: 'Model Year' })
  modelYear!: number;

  @ApiProperty({ description: 'Vehicle condition' })
  condition!: string;

  @ApiProperty({ description: 'Odometer mileage in km', nullable: true })
  mileageKm!: number | null;

  @ApiProperty({ description: 'Exterior color', nullable: true })
  colorExterior!: string | null;

  @ApiProperty({ description: 'Fuel type', nullable: true })
  fuel!: string | null;

  @ApiProperty({ description: 'Transmission', nullable: true })
  transmission!: string | null;

  @ApiProperty({ description: 'UAE GCC Spec flag', nullable: true })
  gccSpec!: boolean | null;

  @ApiProperty({ description: 'Private Dealer Cost in integer fils (Never public)', nullable: true })
  purchaseCostFils!: string | null;

  @ApiProperty({ description: 'Asking Price in integer fils' })
  askingPriceFils!: string;

  @ApiProperty({ description: 'Authoritative Stock Status' })
  stockStatus!: string;

  @ApiProperty({ description: 'Created timestamp in UTC' })
  createdAt!: string;

  @ApiProperty({ description: 'Updated timestamp in UTC' })
  updatedAt!: string;

  @ApiProperty({ description: 'Attached media items', type: [VehicleMediaItemDto] })
  media!: VehicleMediaItemDto[];

  @ApiProperty({ description: 'Active listing ID if created', nullable: true })
  listingId!: string | null;

  @ApiProperty({ description: 'Active listing status if created', nullable: true })
  listingStatus!: string | null;
}
