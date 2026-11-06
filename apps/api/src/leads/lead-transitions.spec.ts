import { ConflictException } from '@nestjs/common';
import { LeadStatus } from '@automotive-os/database';
import { LEAD_TRANSITIONS, assertLeadTransition, isLeadTransitionAllowed } from './lead-transitions';

describe('lead transitions (QA-LOCAL-09)', () => {
  it('covers every LeadStatus exactly once', () => {
    expect(Object.keys(LEAD_TRANSITIONS).sort()).toEqual(Object.values(LeadStatus).sort());
  });

  it('allows the documented forward path', () => {
    expect(isLeadTransitionAllowed('NEW', 'CONTACTED')).toBe(true);
    expect(isLeadTransitionAllowed('CONTACTED', 'QUALIFIED')).toBe(true);
    expect(isLeadTransitionAllowed('QUALIFIED', 'TEST_DRIVE_NEGOTIATION')).toBe(true);
    expect(isLeadTransitionAllowed('TEST_DRIVE_NEGOTIATION', 'WON')).toBe(true);
    expect(() => assertLeadTransition('NEW', 'SPAM')).not.toThrow();
  });

  it('rejects regressions out of WON and arbitrary jumps', () => {
    expect(isLeadTransitionAllowed('WON', 'NEW')).toBe(false);
    expect(isLeadTransitionAllowed('WON', 'LOST')).toBe(false);
    expect(isLeadTransitionAllowed('NEW', 'WON')).toBe(false);
    expect(() => assertLeadTransition('WON', 'NEW')).toThrow(ConflictException);
    expect(() => assertLeadTransition('WON', 'NEW')).toThrow(/INVALID_LEAD_TRANSITION/);
  });

  it('rejects a no-op transition with a distinct code', () => {
    expect(() => assertLeadTransition('CONTACTED', 'CONTACTED')).toThrow(/LEAD_STATUS_UNCHANGED/);
  });

  it('lets a dealer reopen LOST and un-flag SPAM', () => {
    expect(isLeadTransitionAllowed('LOST', 'CONTACTED')).toBe(true);
    expect(isLeadTransitionAllowed('SPAM', 'NEW')).toBe(true);
  });
});
