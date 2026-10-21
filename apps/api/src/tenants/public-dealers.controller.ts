import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { Public } from '../common/decorators/public.decorator';
import { PublicDealerDetailDto } from './dto/public-dealer-response.dto';

@ApiTags('public')
@Public()
@Controller('api/v1/public/dealers')
export class PublicDealersController {
  constructor(private readonly tenantsService: TenantsService) {}

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
