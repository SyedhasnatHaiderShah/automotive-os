import { ConflictException } from '@nestjs/common';
import { LeadStatus } from '@automotive-os/database';

/**
 * CRM lead lifecycle (QA-LOCAL-09). Keys are the current status, values the
 * statuses a dealer may move the lead to. WON is terminal; LOST and SPAM can be
 * reopened once. Mirrored for the console in `apps/dealer/lib/dealer-api.ts`.
 */
export const LEAD_TRANSITIONS: Readonly<Record<LeadStatus, readonly LeadStatus[]>> = {
  NEW: ['CONTACTED', 'QUALIFIED', 'LOST', 'SPAM'],
  CONTACTED: ['QUALIFIED', 'TEST_DRIVE_NEGOTIATION', 'LOST', 'SPAM'],
  QUALIFIED: ['TEST_DRIVE_NEGOTIATION', 'WON', 'LOST'],
  TEST_DRIVE_NEGOTIATION: ['QUALIFIED', 'WON', 'LOST'],
  WON: [],
  LOST: ['CONTACTED'],
  SPAM: ['NEW'],
};

export function isLeadTransitionAllowed(from: LeadStatus, to: LeadStatus): boolean {
  return LEAD_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertLeadTransition(from: LeadStatus, to: LeadStatus): void {
  if (from === to) {
    throw new ConflictException(`LEAD_STATUS_UNCHANGED: Lead is already ${to}`);
  }
  if (!isLeadTransitionAllowed(from, to)) {
    throw new ConflictException(
      `INVALID_LEAD_TRANSITION: ${from} -> ${to} is not allowed (allowed: ${LEAD_TRANSITIONS[from].join(', ') || 'none'})`,
    );
  }
}
