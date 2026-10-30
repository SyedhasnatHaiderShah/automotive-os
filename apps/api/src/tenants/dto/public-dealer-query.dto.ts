import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PublicDealerQueryDto {
  @ApiProperty({ description: 'Filter by UAE Emirate of an active branch (e.g. Dubai, Sharjah)', required: false })
  @IsString()
  @IsOptional()
  emirate?: string;

  @ApiProperty({ description: 'Page number', default: 1, required: false })
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
