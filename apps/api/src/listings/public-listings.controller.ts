import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { Public } from '../common/decorators/public.decorator';
import { PublicListingQueryDto } from './dto/public-listing-query.dto';
import {
  PublicListingDetailDto,
  PublicListingSearchResponseDto,
} from './dto/public-listing-response.dto';

@ApiTags('public')
@Public()
@Controller('api/v1/public/listings')
export class PublicListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  @ApiOperation({
    summary:
      'Search and filter verified dealership listings. Redacts private dealer costs, private notes, and private documents. Only shows published stock with AVAILABLE status from ACTIVE dealers.',
  })
  @ApiResponse({ status: 200, type: PublicListingSearchResponseDto })
  async getPublicListings(
    @Query() query: PublicListingQueryDto
  ): Promise<PublicListingSearchResponseDto> {
    return this.listingsService.getPublicListings(query);
  }

  @Get(':slug')
  @ApiOperation({
    summary:
      'Get redacted listing detail and public dealership profile by marketplace slug.',
  })
  @ApiResponse({ status: 200, type: PublicListingDetailDto })
  @ApiResponse({ status: 404, description: 'Listing not found or no longer available' })
  async getPublicListingBySlug(
    @Param('slug') slug: string
  ): Promise<PublicListingDetailDto> {
    return this.listingsService.getPublicListingBySlug(slug);
  }
}
