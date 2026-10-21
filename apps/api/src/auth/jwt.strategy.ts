import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService, OidcJwtPayload } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-jwt-secret-replace-in-production-min-32-chars-long',
    });
  }

  async validate(payload: OidcJwtPayload) {
    const user = await this.authService.validateOidcPayload(payload);
    if (!user) {
      throw new UnauthorizedException('User authentication failed');
    }
    return user;
  }
}
