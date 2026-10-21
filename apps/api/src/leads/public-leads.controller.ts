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
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateLeadEnquiryDto,
  LeadEnquiryCreatedResponseDto,
} from './dto/create-lead-enquiry.dto';

@ApiTags('leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/public/listings/:listingId/leads')
export class PublicLeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Submit vehicle purchase inquiry with explicit, purpose-scoped data grant. Requires authenticated buyer and enforces anti-spam rate limiting.',
  })
  @ApiResponse({ status: 201, type: LeadEnquiryCreatedResponseDto })
  async createLeadEnquiry(
    @CurrentUser('id') buyerUserId: string,
    @Param('listingId') listingId: string,
    @Body() dto: CreateLeadEnquiryDto
  ): Promise<LeadEnquiryCreatedResponseDto> {
    return this.leadsService.createLeadEnquiry(buyerUserId, listingId, dto);
  }
}
