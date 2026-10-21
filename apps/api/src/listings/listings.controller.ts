import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  TenantAccessGuard,
  TenantContext,
} from '../common/guards/tenant-access.guard';
import { CurrentTenant } from '../common/decorators/tenant-context.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireRoles } from '../common/decorators/require-roles.decorator';
import { MembershipRole } from '@automotive-os/database';
import { CreateDraftListingDto } from './dto/create-draft-listing.dto';
import { ListingResponseDto } from './dto/listing-response.dto';

@ApiTags('listings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantAccessGuard)
@Controller('api/v1/tenants/:tenantId')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post('vehicles/:id/listing')
  @HttpCode(HttpStatus.CREATED)
  @RequireRoles(
    MembershipRole.OWNER,
    MembershipRole.ADMIN,
    MembershipRole.INVENTORY_MANAGER,
    MembershipRole.SALES_MANAGER
  )
  @ApiOperation({
    summary: 'Create or update draft listing for a physical vehicle (1 listing per vehicle)',
  })
  @ApiResponse({ status: 201, type: ListingResponseDto })
  async createDraftListing(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') vehicleId: string,
    @Body() dto: CreateDraftListingDto,
    @CurrentUser('id') actorUserId: string
  ): Promise<ListingResponseDto> {
    return this.listingsService.createDraftListing(
      tenant.tenantId,
      vehicleId,
      dto,
      actorUserId
    );
  }

  @Post('listings/:id/submit')
  @HttpCode(HttpStatus.OK)
  @RequireRoles(
    MembershipRole.OWNER,
    MembershipRole.ADMIN,
    MembershipRole.INVENTORY_MANAGER,
    MembershipRole.SALES_MANAGER
  )
  @ApiOperation({
    summary:
      'Submit draft listing for platform moderation (Validates publish gates: KYB, stock status, media)',
  })
  @ApiResponse({ status: 200, type: ListingResponseDto })
  async submitForReview(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') listingId: string,
    @CurrentUser('id') actorUserId: string
  ): Promise<ListingResponseDto> {
    return this.listingsService.submitForReview(
      tenant.tenantId,
      listingId,
      actorUserId
    );
  }
}
