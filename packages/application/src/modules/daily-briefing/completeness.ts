import type { MissionControlRestrictedSlice } from '../mission-control/types';
import type { DailyBriefingCompleteness } from './types';

const RESTRICTED_SLICE_LABELS: Record<MissionControlRestrictedSlice, string> = {
  programs: 'programs',
  projects: 'projects',
  milestones: 'milestones',
  tasks: 'tasks',
  recentActivity: 'recent activity',
};

const OPERATIONAL_SLICES: readonly MissionControlRestrictedSlice[] = [
  'projects',
  'milestones',
  'tasks',
  'recentActivity',
];

export function assessDailyBriefingCompleteness(input: {
  readonly restrictedSlices: readonly MissionControlRestrictedSlice[];
}): DailyBriefingCompleteness {
  const degradationNotes = input.restrictedSlices.map(
    (slice) =>
      `Mission Control ${RESTRICTED_SLICE_LABELS[slice]} data is unavailable due to access permissions.`,
  );

  if (input.restrictedSlices.length === 0) {
    return {
      status: 'complete',
      degradationNotes,
    };
  }

  const allOperationalRestricted = OPERATIONAL_SLICES.every((slice) =>
    input.restrictedSlices.includes(slice),
  );

  if (allOperationalRestricted) {
    return {
      status: 'insufficient',
      degradationNotes,
    };
  }

  return {
    status: 'degraded',
    degradationNotes,
  };
}
