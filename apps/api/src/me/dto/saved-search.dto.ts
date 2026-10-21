import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateSavedSearchDto {
  @ApiProperty({ description: 'User-friendly name for this search', example: 'Land Cruisers in Dubai under 350k' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'JSON filter specification',
    example: { make: 'Toyota', model: 'Land Cruiser', maxPriceFils: 35000000, emirate: 'Dubai' },
  })
  @IsObject()
  @IsNotEmpty()
  filterJson!: Record<string, any>;

  @ApiProperty({ description: 'Enable push/email alerts for matching vehicles', default: false, required: false })
  @IsBoolean()
  @IsOptional()
  alertsEnabled?: boolean;
}

export class SavedSearchResponseDto {
  @ApiProperty({ description: 'Saved search UUID' })
  id!: string;

  @ApiProperty({ description: 'Search name' })
  name!: string;

  @ApiProperty({ description: 'Filter specification JSON' })
  filterJson!: Record<string, any>;

  @ApiProperty({ description: 'Alerts enabled flag' })
  alertsEnabled!: boolean;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt!: string;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt!: string;
}
