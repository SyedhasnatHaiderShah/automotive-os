import {
  Controller,
  Get,
  Req,
  Res,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { PrismaService, runWithDbContext } from '../database/prisma.service';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';

@ApiTags('media')
@Controller('api/v1/public/media')
export class PublicMediaController {
  private s3Client: S3Client | null = null;

  constructor(private readonly prisma: PrismaService) {
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;
    const endpoint = process.env.R2_ENDPOINT || process.env.S3_ENDPOINT;

    if (accessKeyId && secretAccessKey && endpoint) {
      this.s3Client = new S3Client({
        region: process.env.R2_REGION || process.env.AWS_REGION || 'auto',
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: true,
      });
    }
  }

  @Get('*')
  @ApiOperation({ summary: 'Stream verified public vehicle media through Railway API gateway' })
  @ApiResponse({ status: 200, description: 'Media stream' })
  @ApiResponse({ status: 404, description: 'Media not found or private' })
  async getPublicMedia(@Req() req: Request, @Res() res: Response) {
    const fullPath = req.path;
    const prefix = '/api/v1/public/media/';
    if (!fullPath.startsWith(prefix) || fullPath.length <= prefix.length) {
      throw new BadRequestException('Media object key is required');
    }

    const rawKey = fullPath.slice(prefix.length);

    // Path traversal prevention
    const objectKey = decodeURIComponent(rawKey).replace(/^\/+/, '');
    if (objectKey.includes('..') || objectKey.includes('\\') || objectKey.includes('\0')) {
      throw new BadRequestException('Invalid object key path');
    }

    // SEC-22: Defense-in-depth confidentiality gate:
    // Only serve public media if:
    // 1. isPublic is true and kind is not a private document
    // 2. The tenant is currently ACTIVE (prevent leaking media from suspended/closed dealers)
    // 3. The vehicle stockStatus is AVAILABLE (suspended/sold/archived stock media unpublishes)
    const mediaItem = await runWithDbContext({ isAdmin: true }, async () => {
      return this.prisma.vehicleMedia.findFirst({
        where: {
          objectKey,
          isPublic: true,
          kind: { not: 'DOCUMENT' },
          tenant: { status: 'ACTIVE' },
          vehicle: { stockStatus: 'AVAILABLE' },
        },
      });
    });

    if (!mediaItem) {
      throw new NotFoundException('Public media asset not found or not authorized for public distribution');
    }

    const bucket = process.env.R2_BUCKET_NAME || process.env.S3_BUCKET;
    if (!this.s3Client || !bucket) {
      throw new NotFoundException('Storage provider is currently unavailable');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: objectKey,
      });
      const s3Response = await this.s3Client.send(command);

      res.setHeader('Content-Type', s3Response.ContentType || 'image/jpeg');
      if (s3Response.ContentLength) {
        res.setHeader('Content-Length', s3Response.ContentLength);
      }
      if (s3Response.ETag) {
        res.setHeader('ETag', s3Response.ETag);
      }
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, immutable');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      const bodyStream = s3Response.Body as Readable;
      bodyStream.pipe(res);
    } catch (err: any) {
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        throw new NotFoundException('Object key does not exist in storage bucket');
      }
      throw err;
    }
  }
}
