import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsIn,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MediaKind } from '@automotive-os/database';

export const ALLOWED_MEDIA_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export type AllowedMediaContentType = (typeof ALLOWED_MEDIA_CONTENT_TYPES)[number];

export const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
export const MAX_DOCUMENT_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export class CreateMediaUploadDto {
  @ApiProperty({ enum: MediaKind, example: MediaKind.EXTERIOR })
  @IsEnum(MediaKind)
  kind!: MediaKind;

  @ApiProperty({ description: 'Original file name', example: 'lc_front_angle.jpg' })
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @ApiProperty({
    description: 'MIME type of media file',
    example: 'image/jpeg',
    enum: ALLOWED_MEDIA_CONTENT_TYPES,
  })
  @IsString()
  @IsIn(ALLOWED_MEDIA_CONTENT_TYPES, {
    message: 'contentType must be one of: image/jpeg, image/png, image/webp, application/pdf',
  })
  contentType!: AllowedMediaContentType;

  @ApiProperty({
    description: 'File size in bytes (max 15MB for images, 50MB for PDFs)',
    example: 2048000,
    required: false,
  })
  @IsInt()
  @Min(1, { message: 'fileSizeBytes must be at least 1 byte' })
  @Max(MAX_DOCUMENT_SIZE_BYTES, { message: 'fileSizeBytes cannot exceed 50MB' })
  @IsOptional()
  @Type(() => Number)
  fileSizeBytes?: number;

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
