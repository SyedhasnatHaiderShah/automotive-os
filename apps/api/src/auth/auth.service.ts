import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { MembershipRole } from '@automotive-os/database';
import { RegisterVipLeadDto, RegisterVipResponseDto } from './dto/register-vip.dto';

export interface OidcJwtPayload {
  sub: string;
  email?: string;
  name?: string;
  phone_number?: string;
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
  memberships: {
    tenantId: string;
    role: MembershipRole;
    active: boolean;
    tenantStatus: string;
    tenantSlug: string;
    tenantName: string;
  }[];
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

    // 1. Resolve user from database by identitySubject
    let user = await this.prisma.user.findUnique({
      where: { identitySubject: payload.sub },
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

    return {
      id: user.id,
      identitySubject: user.identitySubject,
      email: user.email,
      phoneE164: user.phoneE164,
      displayName: user.displayName,
      isPlatformAdmin: user.isPlatformAdmin,
      memberships: user.memberships.map((m) => ({
        tenantId: m.tenantId,
        role: m.role,
        active: m.active,
        tenantStatus: m.tenant.status,
        tenantSlug: m.tenant.slug,
        tenantName: m.tenant.displayName,
      })),
    };
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

    // Check if user already exists (Defense against account takeover / unverified linking)
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

    // 2. NEVER trust self-reported Emirates ID as a UAE PASS identity!
    // Unverified public registrations receive an isolated pending registration subject.
    // Official uae_pass_* identity subjects can ONLY be assigned upon verified UAE PASS OIDC callback.
    const pendingIdentitySubject = `pending_reg_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    const user = await this.prisma.user.create({
      data: {
        identitySubject: pendingIdentitySubject,
        email: dto.email,
        phoneE164: formattedPhone,
        displayName: dto.legalName,
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

    // 3. NO authenticated JWT for unverified registrations.
    // Session activation requires verified UAE PASS OIDC or proven email/phone ownership.
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
  }
}
