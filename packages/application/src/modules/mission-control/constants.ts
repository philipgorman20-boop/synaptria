/** Milestones/tasks with planned end dates within this window (inclusive) are due soon. */
export const MISSION_CONTROL_DUE_SOON_DAYS = 7;

/** Overdue items at or beyond this many days past due escalate to critical severity. */
export const MISSION_CONTROL_DEEPLY_OVERDUE_DAYS = 7;

/** Bounded recent-activity feed size for dashboard display. */
export const MISSION_CONTROL_RECENT_ACTIVITY_LIMIT = 10;

export const MISSION_CONTROL_ATTENTION_TYPES = [
  'overdue_milestone',
  'overdue_task',
  'blocked_task',
  'milestone_due_soon',
  'task_due_soon',
  'recent_significant_activity',
] as const;

export type MissionControlAttentionType =
  (typeof MISSION_CONTROL_ATTENTION_TYPES)[number];

export const MISSION_CONTROL_SEVERITIES = [
  'critical',
  'high',
  'medium',
  'low',
] as const;

export type MissionControlSeverity = (typeof MISSION_CONTROL_SEVERITIES)[number];

export const MISSION_CONTROL_RESTRICTED_SLICES = [
  'programs',
  'projects',
  'milestones',
  'tasks',
  'recentActivity',
] as const;

export type MissionControlRestrictedSlice =
  (typeof MISSION_CONTROL_RESTRICTED_SLICES)[number];

export const MISSION_CONTROL_PROJECT_HEALTH_STATES = [
  'at_risk',
  'watch',
  'on_track',
] as const;

export type MissionControlProjectHealthState =
  (typeof MISSION_CONTROL_PROJECT_HEALTH_STATES)[number];
