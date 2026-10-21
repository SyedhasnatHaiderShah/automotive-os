import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StockStatus, VehicleCondition } from '@automotive-os/database';

export class ListVehiclesQueryDto {
  @ApiProperty({ enum: StockStatus, required: false })
  @IsEnum(StockStatus)
  @IsOptional()
  stockStatus?: StockStatus;

  @ApiProperty({ description: 'Filter by Make UUID', required: false })
  @IsString()
  @IsOptional()
  makeId?: string;

  @ApiProperty({ enum: VehicleCondition, required: false })
  @IsEnum(VehicleCondition)
  @IsOptional()
  condition?: VehicleCondition;

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
