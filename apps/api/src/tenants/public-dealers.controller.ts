import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { Public } from '../common/decorators/public.decorator';
import {
  PublicDealerDetailDto,
  PublicDealerListResponseDto,
} from './dto/public-dealer-response.dto';
import { PublicDealerQueryDto } from './dto/public-dealer-query.dto';

@ApiTags('public')
@Public()
@Controller('api/v1/public/dealers')
export class PublicDealersController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({
    summary: 'List active KYB-approved dealerships with live published stock counts.',
  })
  @ApiResponse({ status: 200, type: PublicDealerListResponseDto })
  async listPublicDealers(
    @Query() query: PublicDealerQueryDto
  ): Promise<PublicDealerListResponseDto> {
    return this.tenantsService.listPublicDealers(query);
  }

  @Get(':slug')
  @ApiOperation({
    summary:
      'Get public verified dealership storefront profile, branches, trade license telemetry and stock statistics.',
  })
  @ApiResponse({ status: 200, type: PublicDealerDetailDto })
  @ApiResponse({ status: 404, description: 'Dealership not found or inactive' })
  async getPublicDealerBySlug(
    @Param('slug') slug: string
  ): Promise<PublicDealerDetailDto> {
    return this.tenantsService.getPublicDealerBySlug(slug);
  }
}
