import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MediaKind } from '@automotive-os/database';

export class CreateMediaUploadDto {
  @ApiProperty({ enum: MediaKind, example: MediaKind.EXTERIOR })
  @IsEnum(MediaKind)
  kind!: MediaKind;

  @ApiProperty({ description: 'Original file name', example: 'lc_front_angle.jpg' })
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @ApiProperty({ description: 'MIME type of media file', example: 'image/jpeg' })
  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @ApiProperty({ description: 'Whether this image/document is visible on public listings', example: true, default: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiProperty({ description: 'Descriptive alt text for accessibility', required: false })
  @IsString()
  @IsOptional()
  altText?: string;

  @ApiProperty({ description: 'Gallery sort order', example: 1, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  sortOrder?: number;
}

export class MediaUploadResponseDto {
  @ApiProperty({ description: 'Generated Media UUID' })
  mediaId!: string;

  @ApiProperty({ description: 'S3-compatible Object Key in private bucket' })
  objectKey!: string;

  @ApiProperty({ description: 'Pre-signed S3 PUT URL for direct client upload' })
  uploadUrl!: string;

  @ApiProperty({ description: 'URL expiration timestamp in UTC' })
  expiresAt!: string;

  @ApiProperty({ description: 'Public visibility flag' })
  isPublic!: boolean;
}
