import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService, runWithDbContext } from '../database/prisma.service';
import { MembershipRole } from '@automotive-os/database';
import { RegisterVipLeadDto, RegisterVipResponseDto } from './dto/register-vip.dto';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { CustomerSignupDto, CustomerSignupResponseDto } from './dto/customer-signup.dto';
import { hashPassword, verifyPassword, validatePasswordStrength } from './password.util';

export interface OidcJwtPayload {
  sub: string;
  userId?: string;
  email?: string;
  name?: string;
  phone_number?: string;
  isPlatformAdmin?: boolean;
  sessionId?: string;
  iss?: string;
  aud?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  identitySubject: string;
  email: string | null;
  phoneE164: string | null;
  displayName: string;
  isPlatformAdmin: boolean;
  status: string;
  sessionId?: string;
  memberships: Array<{
    tenantId: string;
    role: MembershipRole;
    active: boolean;
    tenantStatus: string;
    tenantSlug: string;
    tenantName: string;
  }>;
}

export function resolveUserRedirect(user: {
  isPlatformAdmin: boolean;
  status: string;
  memberships: Array<{
    tenantId: string;
    role: string;
    active: boolean;
    tenantStatus: string;
    tenantSlug: string;
  }>;
}): { redirectUrl: string; primaryRole: string; tenantId?: string; tenantSlug?: string } {
  if (user.status === 'SUSPENDED') {
    return { redirectUrl: '/access-suspended', primaryRole: 'SUSPENDED' };
  }
  if (user.status === 'DISABLED') {
    return { redirectUrl: '/access-denied?reason=disabled', primaryRole: 'DISABLED' };
  }
  if (user.isPlatformAdmin) {
    return { redirectUrl: '/admin', primaryRole: 'PLATFORM_ADMIN' };
  }

  const activeMembership = user.memberships.find((m) => m.active);
  if (activeMembership) {
    if (activeMembership.tenantStatus !== 'ACTIVE') {
      return {
        redirectUrl: '/access-suspended?reason=tenant_suspended',
        primaryRole: activeMembership.role,
        tenantId: activeMembership.tenantId,
        tenantSlug: activeMembership.tenantSlug,
      };
    }
    return {
      redirectUrl: '/dealer',
      primaryRole: activeMembership.role,
      tenantId: activeMembership.tenantId,
      tenantSlug: activeMembership.tenantSlug,
    };
  }

  return { redirectUrl: '/account/garage', primaryRole: 'BUYER' };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async validateOidcPayload(payload: OidcJwtPayload): Promise<AuthenticatedUser> {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token: missing subject claim (sub)');
    }

    if (payload.sub.startsWith('pending_reg_')) {
      throw new UnauthorizedException(
        'Account registration is pending verification. Authenticated sessions require verified UAE PASS OIDC or email ownership.',
      );
    }

    return runWithDbContext({ isAdmin: true }, async () => {
      // 1. Resolve user from database by identitySubject or id
      let user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { identitySubject: payload.sub },
            ...(payload.userId ? [{ id: payload.userId }] : []),
          ],
        },
        include: {
          memberships: {
            include: {
              tenant: true,
            },
          },
        },
      });

      // 2. If user does not exist in local database, provision buyer account
      if (!user) {
        const displayName = payload.name || payload.email?.split('@')[0] || 'User';
        user = await this.prisma.user.create({
          data: {
            identitySubject: payload.sub,
            email: payload.email || null,
            phoneE164: payload.phone_number || null,
            displayName,
            status: 'ACTIVE',
            buyer: {
              create: {
                preferredLanguage: 'en',
              },
            },
          },
          include: {
            memberships: {
              include: {
                tenant: true,
              },
            },
          },
        });
      }

      if (user.status === 'DISABLED') {
        throw new ForbiddenException(
          'ACCOUNT_DISABLED: Your account has been disabled by security administration.'
        );
      }

      return {
        id: user.id,
        identitySubject: user.identitySubject,
        email: user.email,
        phoneE164: user.phoneE164,
        displayName: user.displayName,
        isPlatformAdmin: user.isPlatformAdmin,
        status: user.status,
        sessionId: payload.sessionId,
        memberships: user.memberships.map((m) => ({
          tenantId: m.tenantId,
          role: m.role,
          active: m.active,
          tenantStatus: m.tenant.status,
          tenantSlug: m.tenant.slug,
          tenantName: m.tenant.displayName,
        })),
      };
    });
  }

  async login(
    dto: LoginDto,
    meta?: { userAgent?: string; ipAddress?: string }
  ): Promise<LoginResponseDto> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    return runWithDbContext({ isAdmin: true }, async () => {
      const user = await this.prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
        include: {
          memberships: {
            include: {
              tenant: true,
            },
          },
        },
      });

      // Constant-time mitigation if user not found or has no password
      if (!user || !user.passwordHash) {
        await verifyPassword(
          dto.password,
          'scrypt$16384$8$1$0123456789abcdef0123456789abcdef$0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
        );
        throw new UnauthorizedException('Invalid email or password');
      }

      if (user.status === 'DISABLED') {
        throw new ForbiddenException(
          'ACCOUNT_DISABLED: This account has been disabled. Please contact platform administration.'
        );
      }

      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
        throw new UnauthorizedException(
          `Account is temporarily locked due to excessive failed attempts. Please retry in ${minutesLeft} minute(s).`
        );
      }

      const isPasswordValid = await verifyPassword(dto.password, user.passwordHash);

      if (!isPasswordValid) {
        const attempts = user.failedLoginAttempts + 1;
        let lockedUntil: Date | null = null;
        if (attempts >= 5) {
          lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
        }

        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: attempts,
            lockedUntil,
          },
        });

        throw new UnauthorizedException('Invalid email or password');
      }

      // Reset lockout counter on success
      if (user.failedLoginAttempts > 0 || user.lockedUntil) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        });
      }

      // Create session
      const sessionToken = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(sessionToken).digest('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const session = await this.prisma.session.create({
        data: {
          userId: user.id,
          tokenHash,
          userAgent: meta?.userAgent || null,
          ipAddress: meta?.ipAddress || null,
          expiresAt,
        },
      });

      const token = this.jwtService.sign(
        {
          sub: user.identitySubject,
          userId: user.id,
          email: user.email,
          isPlatformAdmin: user.isPlatformAdmin,
          sessionId: session.id,
        },
        {
          issuer: process.env.JWT_ISSUER || 'https://auth.autonexa.ae',
          audience: process.env.JWT_AUDIENCE || 'autonexa-api',
          expiresIn: '7d',
        }
      );

      const redirectInfo = resolveUserRedirect({
        isPlatformAdmin: user.isPlatformAdmin,
        status: user.status,
        memberships: user.memberships.map((m) => ({
          tenantId: m.tenantId,
          role: m.role,
          active: m.active,
          tenantStatus: m.tenant.status,
          tenantSlug: m.tenant.slug,
        })),
      });

      return {
        success: true,
        accessToken: token,
        tokenType: 'Bearer',
        expiresIn: 604800,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          isPlatformAdmin: user.isPlatformAdmin,
          status: user.status,
          primaryRole: redirectInfo.primaryRole,
          tenantId: redirectInfo.tenantId,
          tenantSlug: redirectInfo.tenantSlug,
          redirectUrl: redirectInfo.redirectUrl,
        },
      };
    });
  }

  async signupCustomer(dto: CustomerSignupDto): Promise<CustomerSignupResponseDto> {
    if (dto.consentPdpl !== true) {
      throw new BadRequestException(
        'Explicit UAE Federal PDPL consent agreement (Law No. 45/2021) is required'
      );
    }

    const strength = validatePasswordStrength(dto.password);
    if (!strength.valid) {
      throw new BadRequestException(strength.message);
    }

    const normalizedEmail = dto.email.trim().toLowerCase();

    return runWithDbContext({ isAdmin: true }, async () => {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: normalizedEmail, mode: 'insensitive' } },
            ...(dto.phone ? [{ phoneE164: dto.phone }] : []),
          ],
        },
      });

      if (existingUser) {
        throw new ConflictException('An account with this email or phone number already exists.');
      }

      const passwordHash = await hashPassword(dto.password);
      const identitySubject = `email_${normalizedEmail}`;

      const user = await this.prisma.user.create({
        data: {
          identitySubject,
          email: normalizedEmail,
          displayName: dto.displayName.trim(),
          phoneE164: dto.phone || null,
          passwordHash,
          status: 'ACTIVE',
          isPlatformAdmin: false, // Strict: Customer self-registration can never grant admin
          emailVerifiedAt: new Date(),
          buyer: {
            create: {
              preferredLanguage: 'en',
              preferredEmirate: dto.emirate || 'Dubai',
              marketingConsentAt: new Date(),
            },
          },
        },
      });

      return {
        success: true,
        userId: user.id,
        email: user.email!,
        status: user.status,
        message: 'Account registered successfully as verified customer buyer.',
      };
    });
  }

  async getMe(userId: string) {
    return runWithDbContext({ isAdmin: true }, async () => {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          buyer: true,
          memberships: {
            include: {
              tenant: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User profile not found');
      }

      const redirectInfo = resolveUserRedirect({
        isPlatformAdmin: user.isPlatformAdmin,
        status: user.status,
        memberships: user.memberships.map((m) => ({
          tenantId: m.tenantId,
          role: m.role,
          active: m.active,
          tenantStatus: m.tenant.status,
          tenantSlug: m.tenant.slug,
        })),
      });

      return {
        id: user.id,
        identitySubject: user.identitySubject,
        email: user.email,
        phoneE164: user.phoneE164,
        displayName: user.displayName,
        isPlatformAdmin: user.isPlatformAdmin,
        status: user.status,
        emailVerified: !!user.emailVerifiedAt,
        mfaEnabled: user.mfaEnabled,
        memberships: user.memberships.map((m) => ({
          tenantId: m.tenantId,
          role: m.role,
          active: m.active,
          tenantStatus: m.tenant.status,
          tenantSlug: m.tenant.slug,
          tenantName: m.tenant.displayName,
        })),
        buyerProfile: user.buyer
          ? {
              preferredLanguage: user.buyer.preferredLanguage,
              preferredEmirate: user.buyer.preferredEmirate,
            }
          : null,
        resolvedDashboardUrl: redirectInfo.redirectUrl,
      };
    });
  }

  async logout(sessionId?: string): Promise<{ success: boolean }> {
    if (sessionId) {
      await runWithDbContext({ isAdmin: true }, async () => {
        await this.prisma.session.updateMany({
          where: { id: sessionId },
          data: { revokedAt: new Date() },
        });
      });
    }
    return { success: true };
  }

  async revokeAllUserSessions(userId: string): Promise<{ count: number }> {
    return runWithDbContext({ isAdmin: true }, async () => {
      const result = await this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return { count: result.count };
    });
  }

  // Helper method to mint development tokens for integration tests
  generateDevToken(user: { id?: string; identitySubject: string; email?: string; name?: string }): string {
    return this.jwtService.sign(
      {
        sub: user.identitySubject,
        email: user.email,
        name: user.name,
      },
      {
        issuer: process.env.JWT_ISSUER || 'https://auth.autonexa.ae',
        audience: process.env.JWT_AUDIENCE || 'autonexa-api',
      },
    );
  }

  async registerVipLead(dto: RegisterVipLeadDto): Promise<RegisterVipResponseDto> {
    if (dto.consentPdpl !== true) {
      throw new BadRequestException('Explicit UAE Federal PDPL consent agreement (Law No. 45/2021) is required');
    }

    const cleanPhone = dto.phone.replace(/[\s-]/g, '');
    const formattedPhone = cleanPhone.startsWith('+')
      ? cleanPhone
      : cleanPhone.startsWith('971')
      ? `+${cleanPhone}`
      : `+971${cleanPhone.replace(/^0/, '')}`;

    return runWithDbContext({ isAdmin: true }, async () => {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: dto.email },
            { phoneE164: formattedPhone },
            ...(dto.emiratesId ? [{ identitySubject: `uae_pass_${dto.emiratesId.replace(/-/g, '')}` }] : []),
          ],
        },
      });

      if (existingUser) {
        throw new ConflictException(
          'An account with this email, phone number, or Emirates ID already exists. Proven identity ownership is required; please authenticate directly via UAE PASS.'
        );
      }

      const pendingIdentitySubject = `pending_reg_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      const user = await this.prisma.user.create({
        data: {
          identitySubject: pendingIdentitySubject,
          email: dto.email,
          phoneE164: formattedPhone,
          displayName: dto.legalName,
          status: 'PENDING_VERIFICATION',
          buyer: {
            create: {
              preferredLanguage: 'en',
              preferredEmirate: dto.emirate || 'Dubai',
              preferredMakes: dto.marques || [],
              marketingConsentAt: dto.consentPdpl ? new Date() : null,
            },
          },
        },
        include: {
          buyer: true,
        },
      });

      return {
        success: true,
        userId: user.id,
        registrationId: user.id,
        email: user.email || dto.email,
        tier: dto.tier,
        status: 'PENDING_VERIFICATION',
        requiresVerification: true,
        message: `Registration received under UAE Federal PDPL consent framework. Account is pending verification via UAE PASS before activation.`,
      };
    });
  }
}
