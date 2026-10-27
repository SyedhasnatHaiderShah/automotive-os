import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService, AuthenticatedUser } from './auth.service';
import { DevLoginDto, AuthTokenResponseDto } from './dto/dev-login.dto';
import { RegisterVipLeadDto, RegisterVipResponseDto } from './dto/register-vip.dto';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { CustomerSignupDto, CustomerSignupResponseDto } from './dto/customer-signup.dto';
import {
  VerifyEmailDto,
  VerifyEmailResponseDto,
  ResendVerificationDto,
  ResendVerificationResponseDto,
} from './dto/verify-email.dto';
import {
  VerifyActivationTokenDto,
  VerifyActivationTokenResponseDto,
  CompleteActivationDto,
  CompleteActivationResponseDto,
} from './dto/activate.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PlatformAdminGuard } from '../common/guards/platform-admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<LoginResponseDto> {
    const userAgent = req.headers['user-agent'] as string | undefined;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

    const result = await this.authService.login(dto, { userAgent, ipAddress });

    // Set secure HTTP-only session cookie for single-domain routing
    const isSecure =
      process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';

    res.cookie('ao_session', result.accessToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return result;
  }

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register customer account (BUYER role only)' })
  @ApiResponse({ status: 201, type: CustomerSignupResponseDto })
  async signupCustomer(@Body() dto: CustomerSignupDto): Promise<CustomerSignupResponseDto> {
    return this.authService.signupCustomer(dto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify customer email address with cryptographic token' })
  @ApiResponse({ status: 200, type: VerifyEmailResponseDto })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<VerifyEmailResponseDto> {
    return this.authService.verifyEmail(dto.token);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification link' })
  @ApiResponse({ status: 200, type: ResendVerificationResponseDto })
  async resendVerification(
    @Body() dto: ResendVerificationDto
  ): Promise<ResendVerificationResponseDto> {
    return this.authService.resendVerification(dto.email);
  }

  @Public()
  @Get('activate/verify')
  @ApiOperation({ summary: 'Verify activation token and retrieve invitation metadata' })
  @ApiResponse({ status: 200, type: VerifyActivationTokenResponseDto })
  async verifyActivationToken(
    @Query('token') token: string
  ): Promise<VerifyActivationTokenResponseDto> {
    return this.authService.verifyActivationToken(token);
  }

  @Public()
  @Post('activate/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete activation, set password, and verify MFA' })
  @ApiResponse({ status: 200, type: CompleteActivationResponseDto })
  async completeActivation(
    @Body() dto: CompleteActivationDto,
    @Req() req: Request
  ): Promise<CompleteActivationResponseDto> {
    const setupMfaSecret = req.headers['x-mfa-secret'] as string | undefined;
    return this.authService.completeActivation(dto, setupMfaSecret);
  }

  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @Get('verify-admin-session')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Authoritative platform administrator session verification' })
  async verifyAdminSession(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.verifyAdminSession(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve currently authenticated user profile & memberships' })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke current session and clear authentication cookie' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response
  ) {
    res.clearCookie('ao_session', { path: '/' });
    return this.authService.logout(user.sessionId);
  }

  @Public()
  @Post('token')
  @ApiOperation({ summary: 'Obtain test JWT token for local development and test builds only' })
  @ApiResponse({ status: 200, type: AuthTokenResponseDto })
  async getDevToken(@Body() dto: DevLoginDto): Promise<AuthTokenResponseDto> {
    const isProductionOrStaging =
      process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';

    if (isProductionOrStaging || process.env.ALLOW_DEV_TOKENS !== 'true') {
      throw new ForbiddenException(
        'Development JWT token issuance is strictly prohibited in staging, production, or unflagged environments'
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
