import { Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { DevLoginDto, AuthTokenResponseDto } from './dto/dev-login.dto';
import { RegisterVipLeadDto, RegisterVipResponseDto } from './dto/register-vip.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('token')
  @ApiOperation({ summary: 'Obtain test JWT token for local development and test builds only' })
  @ApiResponse({ status: 200, type: AuthTokenResponseDto })
  async getDevToken(@Body() dto: DevLoginDto): Promise<AuthTokenResponseDto> {
    const isProductionOrStaging =
      process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';

    if (isProductionOrStaging) {
      throw new ForbiddenException(
        'Development JWT token issuance is strictly prohibited in staging and production environments'
      );
    }

    const token = this.authService.generateDevToken({
      identitySubject: dto.identitySubject,
      email: dto.email,
      name: dto.name,
    });

    return {
      accessToken: token,
      tokenType: 'Bearer',
      subject: dto.identitySubject,
    };
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'VIP client registration and lead intake (Collector, Corporate, Dealership)' })
  @ApiResponse({ status: 201, type: RegisterVipResponseDto })
  async registerVipLead(@Body() dto: RegisterVipLeadDto): Promise<RegisterVipResponseDto> {
    return this.authService.registerVipLead(dto);
  }
}
