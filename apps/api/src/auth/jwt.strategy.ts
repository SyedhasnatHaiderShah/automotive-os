import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService, OidcJwtPayload } from './auth.service';

const DEFAULT_DEV_SECRET = 'dev-jwt-secret-replace-in-production-min-32-chars-long';

export const cookieExtractor = (req: any): string | null => {
  if (req && req.cookies && req.cookies['ao_session']) {
    return req.cookies['ao_session'];
  }
  if (req && req.headers && typeof req.headers.cookie === 'string') {
    const match = req.headers.cookie.match(/(?:^|;\s*)ao_session=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    const isProductionOrStaging =
      process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';
    const configuredSecret = process.env.JWT_SECRET;

    if (isProductionOrStaging && (!configuredSecret || configuredSecret === DEFAULT_DEV_SECRET)) {
      throw new Error(
        'CRITICAL_SECURITY_ERROR: JWT_SECRET must be explicitly configured with a secure non-default secret in production and staging environments.'
      );
    }

    const expectedIssuer = process.env.JWT_ISSUER || 'https://auth.autonexa.ae';
    const expectedAudience = process.env.JWT_AUDIENCE || 'autonexa-api';

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: configuredSecret || DEFAULT_DEV_SECRET,
      issuer: expectedIssuer,
      audience: expectedAudience,
      algorithms: ['HS256', 'RS256'],
    });
  }

  async validate(payload: OidcJwtPayload) {
    const expectedIssuer = process.env.JWT_ISSUER || 'https://auth.autonexa.ae';
    const expectedAudience = process.env.JWT_AUDIENCE || 'autonexa-api';

    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid JWT: missing subject claim (sub)');
    }

    if (payload.iss && payload.iss !== expectedIssuer) {
      throw new UnauthorizedException(`Invalid JWT issuer: expected ${expectedIssuer}, received ${payload.iss}`);
    }

    if (payload.aud && payload.aud !== expectedAudience) {
      throw new UnauthorizedException(`Invalid JWT audience: expected ${expectedAudience}, received ${payload.aud}`);
    }

    const user = await this.authService.validateOidcPayload(payload);
    if (!user) {
      throw new UnauthorizedException('User authentication failed: subject not authorized');
    }

    return user;
  }
}
