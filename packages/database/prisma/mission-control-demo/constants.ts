/** Identifies synthetic Mission Control demo records in development databases. */
export const MISSION_CONTROL_DEMO_SEED_MARKER = 'mission-control-demo';

/** Stable correlation id for all demo domain events (supports cleanup). */
export const MISSION_CONTROL_DEMO_CORRELATION_ID = 'mc-demo-seed-v1';

/** Prefix applied to demo program/project codes for idempotent identification. */
export const MISSION_CONTROL_DEMO_CODE_PREFIX = 'MC-DEMO-';

/** Default organization slug used by the base development seed. */
export const MISSION_CONTROL_DEMO_ORGANIZATION_SLUG = 'synaptria';

export const MISSION_CONTROL_DEMO_PROGRAM_IDS = {
  antibody: '10000000-0000-4000-8000-000000000001',
  mrna: '10000000-0000-4000-8000-000000000002',
  operations: '10000000-0000-4000-8000-000000000003',
} as const;

export const MISSION_CONTROL_DEMO_PROJECT_IDS = {
  criticalAtRisk: '20000000-0000-4000-8000-000000000001',
  atRisk: '20000000-0000-4000-8000-000000000002',
  watch: '20000000-0000-4000-8000-000000000003',
  onTrack: '20000000-0000-4000-8000-000000000004',
  onTrackQuiet: '20000000-0000-4000-8000-000000000005',
  completed: '20000000-0000-4000-8000-000000000006',
} as const;
