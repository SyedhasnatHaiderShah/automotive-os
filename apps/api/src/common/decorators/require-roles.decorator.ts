import { SetMetadata } from '@nestjs/common';
import { MembershipRole } from '@automotive-os/database';

export const REQUIRED_ROLES_KEY = 'requiredRoles';
export const RequireRoles = (...roles: MembershipRole[]) =>
  SetMetadata(REQUIRED_ROLES_KEY, roles);
