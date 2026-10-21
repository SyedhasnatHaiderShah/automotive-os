import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MeService } from './me.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.service';
import {
  MeResponseDto,
  BuyerProfileResponseDto,
} from './dto/me-response.dto';
import { UpdateBuyerProfileDto } from './dto/update-buyer-profile.dto';
import { AddFavoriteDto, FavoriteResponseDto } from './dto/favorite.dto';
import {
  CreateSavedSearchDto,
  SavedSearchResponseDto,
} from './dto/saved-search.dto';
import { BuyerEnquiryResponseDto } from './dto/buyer-enquiry-response.dto';
import {
  AppointmentResponseDto,
  CancelAppointmentDto,
  CreateAppointmentDto,
  RescheduleAppointmentDto,
} from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('me')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get()
  @ApiOperation({ summary: 'Get current authenticated user identity and membership summary' })
  @ApiResponse({ status: 200, type: MeResponseDto })
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<MeResponseDto> {
    return this.meService.getMe(user);
  }

  // ==========================================
  // Buyer Profile
  // ==========================================

  @Get('buyer-profile')
  @ApiOperation({ summary: 'Get own global buyer preferences' })
  @ApiResponse({ status: 200, type: BuyerProfileResponseDto })
  async getBuyerProfile(
    @CurrentUser('id') userId: string
  ): Promise<BuyerProfileResponseDto> {
    return this.meService.getBuyerProfile(userId);
  }

  @Patch('buyer-profile')
  @ApiOperation({ summary: 'Update own global buyer preferences' })
  @ApiResponse({ status: 200, type: BuyerProfileResponseDto })
  async updateBuyerProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateBuyerProfileDto
  ): Promise<BuyerProfileResponseDto> {
    return this.meService.updateBuyerProfile(userId, dto);
  }

  // ==========================================
  // Favorites (Saved Cars)
  // ==========================================

  @Get('favorites')
  @ApiOperation({ summary: 'List bookmarked vehicle listings for current buyer' })
  @ApiResponse({ status: 200, type: [FavoriteResponseDto] })
  async getFavorites(
    @CurrentUser('id') userId: string
  ): Promise<FavoriteResponseDto[]> {
    return this.meService.getFavorites(userId);
  }

  @Post('favorites')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a vehicle listing to personal favorites' })
  @ApiResponse({ status: 201, type: FavoriteResponseDto })
  async addFavorite(
    @CurrentUser('id') userId: string,
    @Body() dto: AddFavoriteDto
  ): Promise<FavoriteResponseDto> {
    return this.meService.addFavorite(userId, dto);
  }

  @Delete('favorites/:listingId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a vehicle listing from personal favorites' })
  @ApiResponse({ status: 200, description: 'Favorite removed successfully' })
  async removeFavorite(
    @CurrentUser('id') userId: string,
    @Param('listingId') listingId: string
  ): Promise<{ success: boolean }> {
    return this.meService.removeFavorite(userId, listingId);
  }

  // ==========================================
  // Saved Searches
  // ==========================================

  @Get('saved-searches')
  @ApiOperation({ summary: 'List saved marketplace searches for current buyer' })
  @ApiResponse({ status: 200, type: [SavedSearchResponseDto] })
  async getSavedSearches(
    @CurrentUser('id') userId: string
  ): Promise<SavedSearchResponseDto[]> {
    return this.meService.getSavedSearches(userId);
  }

  @Post('saved-searches')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Save marketplace search filters and alert preferences' })
  @ApiResponse({ status: 201, type: SavedSearchResponseDto })
  async createSavedSearch(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSavedSearchDto
  ): Promise<SavedSearchResponseDto> {
    return this.meService.createSavedSearch(userId, dto);
  }

  @Delete('saved-searches/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a saved search' })
  @ApiResponse({ status: 200, description: 'Saved search deleted successfully' })
  async deleteSavedSearch(
    @CurrentUser('id') userId: string,
    @Param('id') id: string
  ): Promise<{ success: boolean }> {
    return this.meService.deleteSavedSearch(userId, id);
  }

  // ==========================================
  // Inquiries / Enquiries (Buyer-Submitted)
  // ==========================================

  @Get('enquiries')
  @ApiOperation({ summary: 'List vehicle purchase inquiries and appointments submitted by buyer' })
  @ApiResponse({ status: 200, type: [BuyerEnquiryResponseDto] })
  async getBuyerEnquiries(
    @CurrentUser('id') userId: string
  ): Promise<BuyerEnquiryResponseDto[]> {
    return this.meService.getBuyerEnquiries(userId);
  }

  @Post('leads/:leadId/appointments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Propose a test-drive appointment slot for an active inquiry' })
  @ApiResponse({ status: 201, type: AppointmentResponseDto })
  async requestAppointment(
    @CurrentUser('id') userId: string,
    @Param('leadId') leadId: string,
    @Body() dto: CreateAppointmentDto
  ): Promise<AppointmentResponseDto> {
    return this.meService.requestAppointment(userId, leadId, dto);
  }

  @Post('leads/:leadId/grant/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Revoke explicit data grant for an inquiry. Subsequent dealership access will redact buyer contact details.',
  })
  @ApiResponse({ status: 200, description: 'Data grant revoked successfully' })
  async revokeGrant(
    @CurrentUser('id') userId: string,
    @Param('leadId') leadId: string
  ): Promise<{ success: boolean; revokedAt: string }> {
    return this.meService.revokeLeadGrant(userId, leadId);
  }

  // ==========================================
  // Buyer Appointments Management
  // ==========================================

  @Get('appointments')
  @ApiOperation({ summary: 'List all test-drive and showroom appointments booked by buyer' })
  @ApiResponse({ status: 200, type: [AppointmentResponseDto] })
  async getBuyerAppointments(
    @CurrentUser('id') userId: string
  ): Promise<any[]> {
    return this.meService.getBuyerAppointments(userId);
  }

  @Post('appointments/:appointmentId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel booked test-drive appointment and release holding slot/escrow' })
  @ApiResponse({ status: 200, type: AppointmentResponseDto })
  async cancelAppointment(
    @CurrentUser('id') userId: string,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: CancelAppointmentDto
  ): Promise<AppointmentResponseDto> {
    return this.meService.cancelAppointment(userId, appointmentId, dto?.reason);
  }

  @Post('appointments/:appointmentId/reschedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reschedule test-drive appointment slot' })
  @ApiResponse({ status: 200, type: AppointmentResponseDto })
  async rescheduleAppointment(
    @CurrentUser('id') userId: string,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: RescheduleAppointmentDto
  ): Promise<AppointmentResponseDto> {
    return this.meService.rescheduleAppointment(
      userId,
      appointmentId,
      dto.startsAt,
      dto.endsAt
    );
  }
}
