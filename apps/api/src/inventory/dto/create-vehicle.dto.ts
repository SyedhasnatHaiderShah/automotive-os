import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
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

export class CreateVehicleDto {
  @ApiProperty({ description: 'Branch UUID within dealership' })
  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @ApiProperty({ description: 'Vehicle Make UUID' })
  @IsString()
  @IsNotEmpty()
  makeId!: string;

  @ApiProperty({ description: 'Vehicle Model UUID' })
  @IsString()
  @IsNotEmpty()
  modelId!: string;

  @ApiProperty({ description: '17-character VIN (chassis number)', example: '1GNEK1337PREST01', required: false })
  @IsString()
  @IsOptional()
  vin?: string;

  @ApiProperty({ description: 'Internal dealership stock tracking number', example: 'AFP-2024-001' })
  @IsString()
  @IsNotEmpty()
  stockNumber!: string;

  @ApiProperty({ description: 'Vehicle trim / edition', example: 'GR-Sport Twin Turbo V6', required: false })
  @IsString()
  @IsOptional()
  trim?: string;

  @ApiProperty({ description: 'Model manufacturing year', example: 2024 })
  @IsInt()
  @Min(1990)
  @Max(2030)
  @Type(() => Number)
  modelYear!: number;

  @ApiProperty({ enum: VehicleCondition, example: VehicleCondition.NEW })
  @IsEnum(VehicleCondition)
  condition!: VehicleCondition;

  @ApiProperty({ description: 'Current odometer in kilometers', example: 150, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  mileageKm?: number;

  @ApiProperty({ description: 'Exterior color', example: 'Pearl White', required: false })
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

  @ApiProperty({ description: 'UAE GCC specification flag', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  gccSpec?: boolean;

  @ApiProperty({ description: 'Private dealer acquisition cost in integer fils (NEVER public)', example: 31000000, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  purchaseCostFils?: number;

  @ApiProperty({ description: 'Target asking price in integer fils', example: 35000000 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  askingPriceFils!: number;

  @ApiProperty({ enum: StockStatus, required: false, default: StockStatus.INTAKE })
  @IsEnum(StockStatus)
  @IsOptional()
  stockStatus?: StockStatus;
}
