import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBuyerProfileDto {
  @ApiProperty({ description: 'Preferred language code (en or ar)', example: 'ar', required: false })
  @IsString()
  @IsOptional()
  preferredLanguage?: string;

  // null clears the stored value (MK-08); undefined leaves it unchanged.
  @ApiProperty({ description: 'Preferred UAE emirate (e.g. Dubai, Abu Dhabi, Sharjah); null clears it', example: 'Dubai', required: false, nullable: true })
  @IsString()
  @IsOptional()
  preferredEmirate?: string | null;

  @ApiProperty({ description: 'Minimum budget in integer fils; null clears it', example: 20000000, required: false, nullable: true })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  budgetMinFils?: number | null;

  @ApiProperty({ description: 'Maximum budget in integer fils; null clears it', example: 45000000, required: false, nullable: true })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  budgetMaxFils?: number | null;

  @ApiProperty({ description: 'List of preferred car makes', example: ['Toyota', 'Porsche'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredMakes?: string[];
}
