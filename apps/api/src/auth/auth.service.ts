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
import { VerifyEmailResponseDto, ResendVerificationResponseDto } from './dto/verify-email.dto';
import {
  VerifyActivationTokenResponseDto,
  CompleteActivationDto,
  CompleteActivationResponseDto,
} from './dto/activate.dto';
import { hashPassword, verifyPassword, validatePasswordStrength } from './password.util';
import { isLocalOrTestEnv } from './jwt-secret';

export interface OidcJwtPayload {
  sub: string;
  userId?: string;
  email?: string;
  name?: string;
  phone_number?: string;
  isPlatformAdmin?: boolean;
  sessionId?: string;
  /** Set only on tokens minted by generateDevToken (local development / tests). */
  dev?: boolean;
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

    // Only routes that exist in apps/dealer and run on live data. Service and
    // finance modules are sample-data previews, so those roles land on the dashboard.
    let roleLanding = '/dealer';
    switch (activeMembership.role) {
      case 'SALES_MANAGER':
      case 'SALES_AGENT':
        roleLanding = '/dealer/leads';
        break;
      case 'INVENTORY_MANAGER':
        roleLanding = '/dealer/inventory';
        break;
      default:
        roleLanding = '/dealer';
        break;
    }

    return {
      redirectUrl: roleLanding,
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

    // Dev tokens (no session row, may auto-provision) are honoured only in
    // local development and automated tests (SEC-09).
    const isDevToken = payload.dev === true && isLocalOrTestEnv();
    if (!payload.sessionId && !isDevToken) {
      throw new UnauthorizedException('SESSION_REQUIRED: Please log in again.');
    }

    return runWithDbContext({ isAdmin: true }, async () => {
      // 1. Resolve user strictly by the signed subject claim
      let user = await this.prisma.user.findFirst({
        where: { identitySubject: payload.sub },
        include: {
          memberships: {
            // Deterministic order (DL-09): callers pick the first usable membership.
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            include: {
              tenant: true,
            },
          },
        },
      });

      // 2. Unknown subjects are rejected; auto-provisioning is a dev/test convenience only
      if (!user && !isDevToken) {
        throw new UnauthorizedException('User authentication failed: subject not authorized');
      }
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

      // Authoritative Session & User Status Enforcement (S3 Security Gate)
      if (payload.sessionId) {
        const session = await this.prisma.session.findUnique({
          where: { id: payload.sessionId },
        });

        if (!session || session.userId !== user.id || session.revokedAt || session.expiresAt < new Date()) {
          throw new UnauthorizedException(
            'SESSION_REVOKED: This session has been revoked, invalidated, or expired. Please log in again.'
          );
        }
      }

      if (user.status === 'DISABLED') {
        throw new ForbiddenException(
          'ACCOUNT_DISABLED: Your account has been disabled by security administration.'
        );
      }

      if (user.status === 'SUSPENDED') {
        throw new ForbiddenException(
          'ACCOUNT_SUSPENDED: Your account has been suspended by platform administration.'
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
            // Deterministic order (DL-09): callers pick the first usable membership.
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
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
        throw new UnauthorizedException('Invalid email or password, or the account is temporarily locked');
      }

      // SEC-05: never reveal account state before the password is proven.
      // A locked account answers with the same generic 401 as a bad password.
      const genericFailure = 'Invalid email or password, or the account is temporarily locked';
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        await verifyPassword(dto.password, user.passwordHash);
        throw new UnauthorizedException(genericFailure);
      }

      const isPasswordValid = await verifyPassword(dto.password, user.passwordHash);

      if (!isPasswordValid) {
        // Atomic increment so parallel guesses cannot exceed the threshold.
        const updated = await this.prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: { increment: 1 } },
          select: { failedLoginAttempts: true },
        });
        const attempts = updated.failedLoginAttempts;
        let lockedUntil: Date | null = null;
        if (attempts >= 5) {
          lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
          await this.prisma.user.update({
            where: { id: user.id },
            data: { lockedUntil, failedLoginAttempts: 0 },
          });
        }

        await this.prisma.auditEvent.create({
          data: {
            action: lockedUntil ? 'AUTH_LOGIN_ACCOUNT_LOCKED' : 'AUTH_LOGIN_FAILED',
            actorUserId: user.id,
            targetType: 'User',
            targetId: user.id,
            metadata: {
              failedAttempts: attempts,
              lockedUntil: lockedUntil?.toISOString() ?? null,
            },
          },
        });

        throw new UnauthorizedException(genericFailure);
      }

      // Account state is disclosed only after a correct password.
      if (user.status === 'DISABLED') {
        throw new ForbiddenException(
          'ACCOUNT_DISABLED: This account has been disabled. Please contact platform administration.'
        );
      }

      if (user.status === 'SUSPENDED') {
        throw new ForbiddenException(
          'ACCOUNT_SUSPENDED: This account has been suspended. Please contact platform administration.'
        );
      }

      if (user.status === 'PENDING_VERIFICATION' || !user.emailVerifiedAt) {
        throw new ForbiddenException(
          'EMAIL_NOT_VERIFIED: Your email address has not been verified. Please verify your email before logging in.'
        );
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

      await this.prisma.auditEvent.create({
        data: {
          action: 'AUTH_LOGIN_SUCCESS',
          actorUserId: user.id,
          targetType: 'Session',
          targetId: session.id,
          metadata: {
            isPlatformAdmin: user.isPlatformAdmin,
          },
        },
      });

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

      // Cryptographically secure 256-bit email verification token (S1 Security Standard)
      const rawVerificationToken = randomBytes(32).toString('hex');
      const verificationTokenHash = createHash('sha256').update(rawVerificationToken).digest('hex');
      const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour expiration

      const user = await this.prisma.user.create({
        data: {
          identitySubject,
          email: normalizedEmail,
          displayName: dto.displayName.trim(),
          phoneE164: dto.phone || null,
          passwordHash,
          status: 'PENDING_VERIFICATION',
          isPlatformAdmin: false, // Strict: Customer self-registration can never grant admin
          emailVerifiedAt: null,
          emailVerificationTokenHash: verificationTokenHash,
          emailVerificationExpiresAt: verificationExpiresAt,
          buyer: {
            create: {
              preferredLanguage: 'en',
              preferredEmirate: dto.emirate || 'Dubai',
              pdplConsentAt: new Date(),
              marketingConsentAt: dto.consentMarketing ? new Date() : null,
            },
          },
        },
      });

      return {
        success: true,
        userId: user.id,
        email: user.email!,
        status: user.status,
        message: 'Account registered successfully. Please verify your email to activate your account.',
        // Raw token is only echoed for local development and automated tests (SEC-01).
        verificationToken: isLocalOrTestEnv() ? rawVerificationToken : undefined,
      };
    });
  }

  async verifyEmail(rawToken: string): Promise<VerifyEmailResponseDto> {
    if (!rawToken || !rawToken.trim()) {
      throw new BadRequestException('Verification token is required');
    }

    const tokenHash = createHash('sha256').update(rawToken.trim()).digest('hex');

    return runWithDbContext({ isAdmin: true }, async () => {
      const user = await this.prisma.user.findFirst({
        where: { emailVerificationTokenHash: tokenHash },
      });

      if (!user) {
        throw new BadRequestException('Invalid or already used email verification token.');
      }

      if (user.emailVerificationExpiresAt && user.emailVerificationExpiresAt < new Date()) {
        throw new BadRequestException(
          'Email verification token has expired. Please request a new verification link.'
        );
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          status: user.status === 'PENDING_VERIFICATION' ? 'ACTIVE' : user.status,
          emailVerifiedAt: user.emailVerifiedAt || new Date(),
          emailVerificationTokenHash: null,
          emailVerificationExpiresAt: null,
        },
      });

      await this.prisma.auditEvent.create({
        data: {
          action: 'USER_EMAIL_VERIFIED',
          actorUserId: user.id,
          targetType: 'User',
          targetId: user.id,
          metadata: { email: user.email },
        },
      });

      return {
        success: true,
        message: 'Email address verified successfully. You may now log in.',
        email: user.email || undefined,
      };
    });
  }

  async resendVerification(email: string): Promise<ResendVerificationResponseDto> {
    const normalizedEmail = email.trim().toLowerCase();

    return runWithDbContext({ isAdmin: true }, async () => {
      const user = await this.prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      });

      const genericMessage =
        'If an unverified account exists with this email address, a verification link has been sent.';

      if (!user || user.emailVerifiedAt) {
        return { success: true, message: genericMessage };
      }

      const rawVerificationToken = randomBytes(32).toString('hex');
      const verificationTokenHash = createHash('sha256').update(rawVerificationToken).digest('hex');
      const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationTokenHash: verificationTokenHash,
          emailVerificationExpiresAt: verificationExpiresAt,
        },
      });

      return {
        success: true,
        message: genericMessage,
        verificationToken: isLocalOrTestEnv() ? rawVerificationToken : undefined,
      };
    });
  }

  async verifyActivationToken(rawToken: string): Promise<VerifyActivationTokenResponseDto> {
    if (!rawToken || !rawToken.trim()) {
      throw new BadRequestException('Activation token is required');
    }

    const tokenHash = createHash('sha256').update(rawToken.trim()).digest('hex');

    return runWithDbContext({ isAdmin: true }, async () => {
      const invitation = await this.prisma.userInvitation.findUnique({
        where: { tokenHash },
        include: { tenant: true },
      });

      if (!invitation || invitation.acceptedAt !== null) {
        throw new BadRequestException('Invalid or already accepted activation token.');
      }

      if (invitation.expiresAt < new Date()) {
        throw new BadRequestException(
          'Activation token has expired. Please contact administration for a new invitation.'
        );
      }

      return {
        valid: true,
        email: invitation.email,
        isPlatformAdmin: invitation.isPlatformAdmin,
        requiresMfa: false,
        role: invitation.role,
        tenantName: invitation.tenant?.displayName,
      };
    });
  }

  async completeActivation(
    dto: CompleteActivationDto
  ): Promise<CompleteActivationResponseDto> {
    const strength = validatePasswordStrength(dto.password);
    if (!strength.valid) {
      throw new BadRequestException(strength.message);
    }

    const tokenHash = createHash('sha256').update(dto.token.trim()).digest('hex');

    return runWithDbContext({ isAdmin: true }, async () => {
      const invitation = await this.prisma.userInvitation.findUnique({
        where: { tokenHash },
        include: { tenant: true },
      });

      if (!invitation || invitation.acceptedAt !== null) {
        throw new BadRequestException('Invalid or already accepted activation token.');
      }

      if (invitation.expiresAt < new Date()) {
        throw new BadRequestException('Activation token has expired.');
      }

      const passwordHash = await hashPassword(dto.password);
      const normalizedEmail = invitation.email.toLowerCase().trim();

      let user = invitation.invitedUserId
        ? await this.prisma.user.findUnique({ where: { id: invitation.invitedUserId } })
        : await this.prisma.user.findFirst({
            where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
          });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            identitySubject: `email_${normalizedEmail}`,
            email: normalizedEmail,
            displayName: normalizedEmail.split('@')[0] || 'User',
            passwordHash,
            status: 'ACTIVE',
            emailVerifiedAt: new Date(),
            isPlatformAdmin: invitation.isPlatformAdmin,
            mfaSecret: null,
            mfaEnabled: false,
          },
        });
      } else {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash,
            status: 'ACTIVE',
            emailVerifiedAt: user.emailVerifiedAt || new Date(),
            isPlatformAdmin: invitation.isPlatformAdmin ? true : user.isPlatformAdmin,
            mfaSecret: null,
            mfaEnabled: false,
          },
        });
      }

      if (invitation.tenantId && invitation.role) {
        await this.prisma.membership.upsert({
          where: {
            tenantId_userId: {
              tenantId: invitation.tenantId,
              userId: user.id,
            },
          },
          update: {
            role: invitation.role,
            active: true,
          },
          create: {
            tenantId: invitation.tenantId,
            userId: user.id,
            role: invitation.role,
            active: true,
          },
        });
      }

      await this.prisma.userInvitation.update({
        where: { id: invitation.id },
        data: {
          acceptedAt: new Date(),
          invitedUserId: user.id,
        },
      });

      await this.prisma.auditEvent.create({
        data: {
          action: invitation.isPlatformAdmin
            ? 'PLATFORM_ADMIN_ACTIVATED'
            : 'USER_INVITATION_ACCEPTED',
          actorUserId: user.id,
          targetType: 'User',
          targetId: user.id,
          metadata: {
            email: user.email,
            isPlatformAdmin: invitation.isPlatformAdmin,
            tenantId: invitation.tenantId,
            role: invitation.role,
          },
        },
      });

      return {
        success: true,
        message: 'Account activated successfully. You may now log in.',
        redirectUrl: '/auth?tab=login',
      };
    });
  }

  async verifyAdminSession(user: AuthenticatedUser) {
    if (!user || !user.isPlatformAdmin || user.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'PLATFORM_ADMIN_REQUIRED: Active platform administrator privileges are required.'
      );
    }
    return { valid: true, user };
  }

  async getMe(userId: string) {
    return runWithDbContext({ isAdmin: true }, async () => {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          buyer: true,
          memberships: {
            // Deterministic order (DL-09): callers pick the first usable membership.
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
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
        dev: true,
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

      const pendingIdentitySubject = `pending_reg_${Date.now()}_${randomBytes(16).toString('hex')}`;

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
