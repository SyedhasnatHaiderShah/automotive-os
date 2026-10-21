import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { DevLoginDto, AuthTokenResponseDto } from './dto/dev-login.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('token')
  @ApiOperation({ summary: 'Obtain test JWT token for development and integration test suites' })
  @ApiResponse({ status: 200, type: AuthTokenResponseDto })
  async getDevToken(@Body() dto: DevLoginDto): Promise<AuthTokenResponseDto> {
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
}
