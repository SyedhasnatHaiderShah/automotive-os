import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { VehicleCondition } from '@automotive-os/database';

export class PublicListingQueryDto {
  @ApiProperty({ description: 'Filter by UAE Emirate (e.g. Dubai, Abu Dhabi, Sharjah)', required: false })
  @IsString()
  @IsOptional()
  emirate?: string;

  @ApiProperty({ description: 'Filter by Make name or slug (e.g. Toyota, Porsche)', required: false })
  @IsString()
  @IsOptional()
  make?: string;

  @ApiProperty({ description: 'Filter by Dealership slug (e.g. silberarrows, al-futtaim-prestige)', required: false })
  @IsString()
  @IsOptional()
  dealerSlug?: string;

  @ApiProperty({ description: 'Filter by Model name or slug (e.g. Land Cruiser, 911)', required: false })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ enum: VehicleCondition, required: false })
  @IsEnum(VehicleCondition)
  @IsOptional()
  condition?: VehicleCondition;

  @ApiProperty({ description: 'Filter by UAE GCC Spec', required: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  gccSpec?: boolean;

  @ApiProperty({ description: 'Minimum asking price in integer fils', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minPriceFils?: number;

  @ApiProperty({ description: 'Maximum asking price in integer fils', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  maxPriceFils?: number;

  @ApiProperty({ description: 'Page number (starts at 1)', default: 1, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ description: 'Number of items per page (max 50)', default: 20, required: false })
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
