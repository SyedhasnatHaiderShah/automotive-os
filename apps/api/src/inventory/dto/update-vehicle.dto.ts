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
import { Type } from 'class-transformer';
import {
  FuelType,
  StockStatus,
  Transmission,
  VehicleCondition,
} from '@automotive-os/database';

export class UpdateVehicleDto {
  @ApiProperty({ description: 'Vehicle trim / edition', required: false })
  @IsString()
  @IsOptional()
  trim?: string;

  @ApiProperty({ description: 'Model manufacturing year', required: false })
  @IsInt()
  @Min(1990)
  @Max(2030)
  @IsOptional()
  @Type(() => Number)
  modelYear?: number;

  @ApiProperty({ enum: VehicleCondition, required: false })
  @IsEnum(VehicleCondition)
  @IsOptional()
  condition?: VehicleCondition;

  @ApiProperty({ description: 'Current odometer in kilometers', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  mileageKm?: number;

  @ApiProperty({ description: 'Exterior color', required: false })
  @IsString()
  @IsOptional()
  colorExterior?: string;

  @ApiProperty({ enum: FuelType, required: false })
  @IsEnum(FuelType)
  @IsOptional()
  fuel?: FuelType;

  @ApiProperty({ enum: Transmission, required: false })
  @IsEnum(Transmission)
  @IsOptional()
  transmission?: Transmission;

  @ApiProperty({ description: 'UAE GCC specification flag', required: false })
  @IsBoolean()
  @IsOptional()
  gccSpec?: boolean;

  @ApiProperty({ description: 'Private dealer purchase cost in fils', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  purchaseCostFils?: number;

  @ApiProperty({ description: 'Asking price in fils', required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  askingPriceFils?: number;

  @ApiProperty({ enum: StockStatus, required: false })
  @IsEnum(StockStatus)
  @IsOptional()
  stockStatus?: StockStatus;
}
