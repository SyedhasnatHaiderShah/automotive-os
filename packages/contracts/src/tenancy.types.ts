export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PLATFORM_MODERATOR = 'PLATFORM_MODERATOR',
  DEALER_PRINCIPAL = 'DEALER_PRINCIPAL',
  DEALER_ADMIN = 'DEALER_ADMIN',
  DEALER_SALES = 'DEALER_SALES',
  DEALER_INVENTORY_MANAGER = 'DEALER_INVENTORY_MANAGER',
  BUYER = 'BUYER',
}

export interface AuthenticatedUserContext {
  userId: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  isPlatformAdmin: boolean;
}

export interface TenantContext {
  tenantId: string;
  slug: string;
  name: string;
  isActive: boolean;
}
