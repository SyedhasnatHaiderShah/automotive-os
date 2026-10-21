import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBuyerProfileDto {
  @ApiProperty({ description: 'Preferred language code (en or ar)', example: 'ar', required: false })
  @IsString()
  @IsOptional()
  preferredLanguage?: string;

  @ApiProperty({ description: 'Preferred UAE emirate (e.g. Dubai, Abu Dhabi, Sharjah)', example: 'Dubai', required: false })
  @IsString()
  @IsOptional()
  preferredEmirate?: string;

  @ApiProperty({ description: 'Minimum budget in integer fils', example: 20000000, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  budgetMinFils?: number;

  @ApiProperty({ description: 'Maximum budget in integer fils', example: 45000000, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  budgetMaxFils?: number;

  @ApiProperty({ description: 'List of preferred car makes', example: ['Toyota', 'Porsche'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredMakes?: string[];
}
