import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService, OidcJwtPayload } from './auth.service';
import { resolveJwtSecret } from './jwt-secret';
import { dbContextStorage } from '../database/prisma.service';

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
    const expectedIssuer = process.env.JWT_ISSUER || 'https://auth.autonexa.ae';
    const expectedAudience = process.env.JWT_AUDIENCE || 'autonexa-api';

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: resolveJwtSecret(),
      issuer: expectedIssuer,
      audience: expectedAudience,
      // Symmetric secret: accept HS256 only.
      algorithms: ['HS256'],
    });
  }

  async validate(payload: OidcJwtPayload) {
    const expectedIssuer = process.env.JWT_ISSUER || 'https://auth.autonexa.ae';
    const expectedAudience = process.env.JWT_AUDIENCE || 'autonexa-api';

    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid JWT: missing subject claim (sub)');
    }

    if (payload.iss && payload.iss !== expectedIssuer) {
      throw new UnauthorizedException('Invalid JWT issuer');
    }

    if (payload.aud && payload.aud !== expectedAudience) {
      throw new UnauthorizedException('Invalid JWT audience');
    }

    const user = await this.authService.validateOidcPayload(payload);
    if (!user) {
      throw new UnauthorizedException('User authentication failed: subject not authorized');
    }

    // Bind the verified user to the request's DB context so RLS policies that
    // check app.user_id (buyer_profiles, favorites, saved_searches, leads,
    // appointments, sessions) can see the caller's own rows.
    const store = dbContextStorage.getStore();
    if (store && !store.userId) {
      store.userId = user.id;
    }

    return user;
  }
}
