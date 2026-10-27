export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DISABLED' | 'PENDING_VERIFICATION';

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface UserSummary {
  id: string;
  email: string | null;
  displayName: string;
  isPlatformAdmin: boolean;
  status: UserStatus;
  primaryRole: string;
  tenantId?: string;
  tenantSlug?: string;
  redirectUrl: string;
}

export interface LoginResponseDto {
  success: boolean;
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: UserSummary;
}

export interface CustomerSignupRequestDto {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
  emirate?: string;
  consentPdpl: boolean;
}

export interface SignupResponseDto {
  success: boolean;
  userId: string;
  email: string;
  status: UserStatus;
  message: string;
  requiresEmailVerification?: boolean;
}

export interface AuthenticatedUserProfile {
  id: string;
  identitySubject: string;
  email: string | null;
  phoneE164: string | null;
  displayName: string;
  isPlatformAdmin: boolean;
  status: UserStatus;
  emailVerified: boolean;
  mfaEnabled: boolean;
  memberships: Array<{
    tenantId: string;
    role: string;
    active: boolean;
    tenantStatus: string;
    tenantSlug: string;
    tenantName: string;
  }>;
  buyerProfile?: {
    preferredLanguage: string;
    preferredEmirate: string | null;
  } | null;
  resolvedDashboardUrl: string;
}

export interface AdminUserListItem {
  id: string;
  email: string | null;
  displayName: string;
  phoneE164: string | null;
  isPlatformAdmin: boolean;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  emailVerifiedAt: string | null;
  memberships: Array<{
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    role: string;
    active: boolean;
  }>;
  isBuyer: boolean;
}

export interface AdminUserFilterQuery {
  search?: string;
  role?: string;
  status?: UserStatus;
  tenantId?: string;
  page?: number;
  limit?: number;
}

export interface AdminUserMutationDto {
  displayName?: string;
  status?: UserStatus;
  isPlatformAdmin?: boolean;
}

export interface AdminCreateDealerDto {
  slug: string;
  legalName: string;
  displayName: string;
  country?: string;
  currency?: string;
  adminEmail: string;
  adminName: string;
}

export interface AdminDealerListItem {
  id: string;
  slug: string;
  legalName: string;
  displayName: string;
  status: string;
  country: string;
  currency: string;
  createdAt: string;
  vehicleCount: number;
  activeStaffCount: number;
  verificationStatus: string;
}
