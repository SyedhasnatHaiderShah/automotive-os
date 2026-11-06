import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class AddFavoriteDto {
  @ApiProperty({ description: 'Listing UUID to bookmark', example: '11111111-1111-1111-1111-cccc00000001' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { message: 'listingId must be a UUID' })
  listingId!: string;
}

export class FavoriteResponseDto {
  @ApiProperty({ description: 'Favorite UUID' })
  id!: string;

  @ApiProperty({ description: 'Listing UUID' })
  listingId!: string;

  @ApiProperty({ description: 'Listing URL Slug' })
  slug!: string;

  @ApiProperty({ description: 'Listing Title' })
  title!: string;

  @ApiProperty({ description: 'Asking Price in Fils' })
  askingPriceFils!: string;

  @ApiProperty({ description: 'Listing Status' })
  status!: string;

  @ApiProperty({ description: 'Primary exterior photo URL if available', nullable: true })
  thumbnailUrl!: string | null;

  @ApiProperty({ description: 'Timestamp when favorited' })
  createdAt!: string;
}
