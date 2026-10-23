import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
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
    return this.jwtService.sign({
      sub: user.identitySubject,
      email: user.email,
      name: user.name,
      iss: 'https://auth.autonexa.ae',
      aud: 'autonexa-api',
    });
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

    // Check if user already exists
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          { phoneE164: formattedPhone },
          ...(dto.emiratesId ? [{ identitySubject: `uae_pass_${dto.emiratesId.replace(/-/g, '')}` }] : []),
        ],
      },
      include: {
        buyer: true,
      },
    });

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          displayName: dto.legalName || user.displayName,
          phoneE164: formattedPhone,
          buyer: {
            upsert: {
              create: {
                preferredLanguage: 'en',
                preferredEmirate: dto.emirate || 'Dubai',
                preferredMakes: dto.marques || [],
                marketingConsentAt: dto.consentPdpl ? new Date() : null,
              },
              update: {
                preferredEmirate: dto.emirate || undefined,
                preferredMakes: dto.marques && dto.marques.length > 0 ? dto.marques : undefined,
                marketingConsentAt: dto.consentPdpl ? new Date() : undefined,
              },
            },
          },
        },
        include: {
          buyer: true,
        },
      });
    } else {
      const identitySubject = dto.emiratesId
        ? `uae_pass_${dto.emiratesId.replace(/-/g, '')}`
        : `vip_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      user = await this.prisma.user.create({
        data: {
          identitySubject,
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
    }

    const token = this.generateDevToken({
      id: user.id,
      identitySubject: user.identitySubject,
      email: user.email || undefined,
      name: user.displayName,
    });

    return {
      success: true,
      userId: user.id,
      email: user.email || dto.email,
      tier: dto.tier,
      accessToken: token,
      message: `VIP ${dto.tier.toUpperCase()} registration completed under UAE PDPL consent framework`,
    };
  }
}
