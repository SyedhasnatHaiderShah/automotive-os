import { ConflictException } from '@nestjs/common';
import { AppointmentStatus } from '@automotive-os/database';

/**
 * Dealer appointment lifecycle. Keys are the current status, values the
 * statuses a dealer may move it to. Cancelled, completed and no-show are final.
 * Mirrored for the console in `apps/dealer/lib/dealer-api.ts`.
 */
export const APPOINTMENT_TRANSITIONS: Readonly<Record<AppointmentStatus, readonly AppointmentStatus[]>> = {
  REQUESTED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'NO_SHOW', 'CANCELLED'],
  CANCELLED: [],
  COMPLETED: [],
  NO_SHOW: [],
};

export function assertAppointmentTransition(from: AppointmentStatus, to: AppointmentStatus): void {
  if (!APPOINTMENT_TRANSITIONS[from]?.includes(to)) {
    throw new ConflictException(
      `INVALID_APPOINTMENT_TRANSITION: ${from} -> ${to} is not allowed (allowed: ${APPOINTMENT_TRANSITIONS[from]?.join(', ') || 'none'})`,
    );
  }
}
