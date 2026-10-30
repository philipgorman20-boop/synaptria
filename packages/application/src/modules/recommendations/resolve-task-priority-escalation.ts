import type { Priority } from '@synaptria/domain/shared';

/** Deterministic priority escalation for blocked overdue tasks on at-risk projects. */
export function resolveTaskPriorityEscalationTarget(
  currentPriority: Priority,
): Priority | null {
  switch (currentPriority) {
    case 'LOW':
    case 'MEDIUM':
      return 'HIGH';
    case 'HIGH':
    case 'CRITICAL':
      return null;
  }
}
