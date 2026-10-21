import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDraftListingDto {
  @ApiProperty({
    description: 'Custom listing headline (optional; defaults to Year Make Model Trim)',
    example: '2024 Toyota Land Cruiser GR-Sport V6 Twin-Turbo',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Detailed vehicle description and feature highlights',
    example: 'Brand new 2024 GR-Sport in pristine Pearl White, full GCC specification with dealer warranty.',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Asking price in integer fils (optional; defaults to vehicle asking price)',
    example: 35000000,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  askingPriceFils?: number;
}
