/**
 * UI capability map for dealer membership roles.
 *
 * This mirrors the role lists enforced by the API (`@RequireRoles` and the
 * cost-redaction rule in apps/api). It only decides what the UI offers; the
 * API remains the authority and re-checks role, membership and tenant on every
 * call. Unknown roles get no capabilities.
 */

export const MEMBERSHIP_ROLES = [
  'OWNER',
  'ADMIN',
  'SALES_MANAGER',
  'SALES_AGENT',
  'INVENTORY_MANAGER',
  'SERVICE_ADVISOR',
  'FINANCE_MANAGER',
  'VIEWER',
] as const;

export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export interface DealerCapabilities {
  /** POST /tenants/:tenantId/vehicles */
  canCreateVehicle: boolean;
  /** Create draft listing, submit for review, unpublish. */
  canManageListings: boolean;
  /** Read/write purchaseCostFils (the API redacts it for other roles). */
  canSeeCost: boolean;
  /** GET leads and appointments. */
  canReadLeads: boolean;
  /** PATCH /leads/:id/status */
  canChangeLeadStatus: boolean;
  /** PATCH /leads/:id/assignment */
  canAssignLeads: boolean;
}

const ROLE_LABELS: Record<MembershipRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  SALES_MANAGER: 'Sales Manager',
  SALES_AGENT: 'Sales Agent',
  INVENTORY_MANAGER: 'Inventory Manager',
  SERVICE_ADVISOR: 'Service Advisor',
  FINANCE_MANAGER: 'Finance Manager',
  VIEWER: 'Viewer',
};

const VEHICLE_CREATE: readonly MembershipRole[] = ['OWNER', 'ADMIN', 'INVENTORY_MANAGER', 'SALES_MANAGER'];
const LISTING_MANAGE: readonly MembershipRole[] = ['OWNER', 'ADMIN', 'INVENTORY_MANAGER', 'SALES_MANAGER'];
const COST_ACCESS: readonly MembershipRole[] = ['OWNER', 'ADMIN', 'INVENTORY_MANAGER', 'FINANCE_MANAGER'];
const LEAD_READ: readonly MembershipRole[] = ['OWNER', 'ADMIN', 'SALES_MANAGER', 'SALES_AGENT'];
const LEAD_STATUS: readonly MembershipRole[] = ['OWNER', 'ADMIN', 'SALES_MANAGER', 'SALES_AGENT'];
const LEAD_ASSIGN: readonly MembershipRole[] = ['OWNER', 'ADMIN', 'SALES_MANAGER'];

export function isMembershipRole(role: string | null | undefined): role is MembershipRole {
  return typeof role === 'string' && (MEMBERSHIP_ROLES as readonly string[]).includes(role);
}

export function roleLabel(role: string | null | undefined): string {
  return isMembershipRole(role) ? ROLE_LABELS[role] : 'Unknown role';
}

export function capabilitiesFor(role: string | null | undefined): DealerCapabilities {
  if (!isMembershipRole(role)) {
    return {
      canCreateVehicle: false,
      canManageListings: false,
      canSeeCost: false,
      canReadLeads: false,
      canChangeLeadStatus: false,
      canAssignLeads: false,
    };
  }
  return {
    canCreateVehicle: VEHICLE_CREATE.includes(role),
    canManageListings: LISTING_MANAGE.includes(role),
    canSeeCost: COST_ACCESS.includes(role),
    canReadLeads: LEAD_READ.includes(role),
    canChangeLeadStatus: LEAD_STATUS.includes(role),
    canAssignLeads: LEAD_ASSIGN.includes(role),
  };
}

/** Shown wherever vehicle intake would start: the create API needs catalogue IDs the UI cannot obtain yet. */
export const INTAKE_UNAVAILABLE_MESSAGE = 'Vehicle intake needs the catalogue API — not available yet';
