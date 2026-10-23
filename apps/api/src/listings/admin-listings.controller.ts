import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { ListingsService } from "./listings.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { PlatformAdminGuard } from "../common/guards/platform-admin.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AdminListingDecisionDto } from "./dto/admin-listing-decision.dto";
import { ListingResponseDto } from "./dto/listing-response.dto";

@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@Controller("api/v1/admin/listings")
export class AdminListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get(":id")
  @ApiOperation({
    summary: "Get full vehicle listing dossier for platform moderation review",
  })
  @ApiResponse({ status: 200 })
  async getListing(@Param("id") listingId: string) {
    return this.listingsService.getAdminListingById(listingId);
  }

  @Post(":id/decision")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Platform admin moderation decision on pending listing (Approve / Reject with reason). Appends outbox event and audit record.",
  })
  @ApiResponse({ status: 200, type: ListingResponseDto })
  async adminDecision(
    @CurrentUser("id") adminUserId: string,
    @Param("id") listingId: string,
    @Body() dto: AdminListingDecisionDto,
  ): Promise<ListingResponseDto> {
    return this.listingsService.adminDecision(adminUserId, listingId, dto);
  }
}
