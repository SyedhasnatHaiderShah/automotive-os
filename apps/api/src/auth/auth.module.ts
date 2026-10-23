import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

const isProductionOrStaging =
  process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';
const configuredSecret = process.env.JWT_SECRET;
const DEFAULT_DEV_SECRET = 'dev-jwt-secret-replace-in-production-min-32-chars-long';

if (isProductionOrStaging && (!configuredSecret || configuredSecret === DEFAULT_DEV_SECRET)) {
  throw new Error(
    'CRITICAL_SECURITY_ERROR: JWT_SECRET must be explicitly configured with a secure non-default secret in production and staging environments.'
  );
}

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: configuredSecret || DEFAULT_DEV_SECRET,
      signOptions: {
        expiresIn: '1d',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, PassportModule, JwtModule],
})
export class AuthModule {}
